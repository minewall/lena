// ============================================================================
// msg-processor — processa um webhook_event de WhatsApp em background.
//
// Responsabilidades:
//   1. Persiste contact + conversation + message inbound.
//   2. Se conversation.state = 'lena':
//      - Anti-loop: pula se Lena já respondeu nos últimos 5s OU se chegou
//        mensagem mais nova depois desta.
//      - Conta mensagens IN da conversation na última hora:
//          0-9   → modo normal
//          10-19 → modo direto (1 frase, oferece humano)
//          20+   → handoff (state=paused, mensagem fixa, para)
//      - Carrega brain + services + contact.notes
//      - Monta prompt, chama Claude, envia resposta, persiste outbound + ai_usage.
//      - Em background (waitUntil), chama Haiku para atualizar contact.notes
//        a cada 5 turnos.
// ============================================================================

import { getServiceClient } from "../_shared/supabase.ts";
import type {
  WhatsAppInboundEvent,
  WhatsAppInboundMessage,
} from "../_shared/wa/types.ts";
import { MetaCloudProvider } from "../_shared/wa/meta-cloud.ts";
import { buildDemoSystem, brainRecordToPrompt } from "../_shared/prompt/index.ts";

const DEFAULT_MODEL = "claude-sonnet-4-6";
const MODEL_LIGHT = "claude-haiku-4-5";
const ALLOWED_DIALOG_MODELS = new Set([
  "claude-sonnet-4-6",
  "claude-haiku-4-5",
  "claude-opus-4-8",
]);
const MAX_TOKENS = 600;
const HISTORY_LIMIT = 20;
const DEBOUNCE_WINDOW_MS = 5000;
const LOOKBACK_MINUTES = 60;
const DEFAULT_DIRECT_AFTER = 10;
const DEFAULT_HANDOFF_AFTER = 20;
const NOTES_UPDATE_EVERY_TURNS = 5;

// micro-USD por 1k tokens (USD/1M ÷ 1000 × 1e6 = USD/1k × 1e6)
const PRICING_MICRO_PER_1K: Record<string, { in: number; out: number }> = {
  "claude-sonnet-4-6": { in: 3000, out: 15000 },
  "claude-haiku-4-5": { in: 1000, out: 5000 },
  "claude-opus-4-8": { in: 5000, out: 25000 },
};

function pricingFor(model: string): { in: number; out: number } {
  return PRICING_MICRO_PER_1K[model] ?? PRICING_MICRO_PER_1K[DEFAULT_MODEL];
}

declare const EdgeRuntime: { waitUntil(p: Promise<unknown>): void } | undefined;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

interface WebhookEventRow {
  id: string;
  tenant_id: string | null;
  payload: WhatsAppInboundEvent;
  status: string;
}

interface InboundContext {
  conversationId: string;
  conversationState: "lena" | "human" | "paused";
  contactId: string;
  contactPhoneE164: string;
  waMessageId: string;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  // Aceita a service key como Bearer (formato JWT legado) ou no header
  // apikey (formato novo sb_secret_..., que o gateway não trata como JWT).
  const srk = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const auth = req.headers.get("authorization");
  const apikey = req.headers.get("apikey");
  if (auth !== `Bearer ${srk}` && apikey !== srk) {
    return json({ error: "forbidden" }, 403);
  }

  let body: { webhook_event_id?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid json" }, 400);
  }
  if (!body.webhook_event_id) {
    return json({ error: "webhook_event_id required" }, 400);
  }

  const sb = getServiceClient();
  const { data, error } = await sb
    .from("webhook_events")
    .select("id, tenant_id, payload, status")
    .eq("id", body.webhook_event_id)
    .maybeSingle();

  if (error || !data) {
    console.error("load webhook_event:", error);
    return json({ error: "not found" }, 404);
  }
  const event = data as WebhookEventRow;
  if (event.status === "processed") return json({ ok: true, skipped: true });

  if (!event.tenant_id) {
    await sb
      .from("webhook_events")
      .update({ status: "failed", error: "no_tenant_resolved" })
      .eq("id", event.id);
    return json({ ok: false, error: "no_tenant" });
  }

  try {
    if (event.payload.kind === "message") {
      const ctx = await processInboundMessage(sb, event.tenant_id, event.payload);
      if (ctx && ctx.conversationState === "lena" && event.payload.text) {
        await respondWithLena(sb, event.tenant_id, ctx);
      }
    }

    await sb
      .from("webhook_events")
      .update({ status: "processed", processed_at: new Date().toISOString() })
      .eq("id", event.id);

    return json({ ok: true });
  } catch (e) {
    console.error("process error:", e);
    await sb
      .from("webhook_events")
      .update({ status: "failed", error: String((e as Error).message ?? e) })
      .eq("id", event.id);
    return json({ ok: false, error: String((e as Error).message ?? e) }, 500);
  }
});

// ── inbound persistence ────────────────────────────────────────────────

async function processInboundMessage(
  sb: ReturnType<typeof getServiceClient>,
  tenantId: string,
  msg: WhatsAppInboundMessage,
): Promise<InboundContext | null> {
  const { data: contact, error: contactErr } = await sb
    .from("contacts")
    .upsert(
      {
        tenant_id: tenantId,
        phone_e164: msg.fromPhoneE164,
        name: msg.contactName ?? null,
      },
      { onConflict: "tenant_id,phone_e164" },
    )
    .select("id")
    .single();
  if (contactErr) throw new Error(`contact upsert: ${contactErr.message}`);

  const contactId = (contact as { id: string }).id;

  const { data: conv, error: convErr } = await sb
    .from("conversations")
    .upsert(
      { tenant_id: tenantId, contact_id: contactId, channel: "whatsapp" },
      { onConflict: "tenant_id,contact_id,channel", ignoreDuplicates: false },
    )
    .select("id, state")
    .single();
  if (convErr) throw new Error(`conversation upsert: ${convErr.message}`);

  const conversationId = (conv as { id: string }).id;
  const conversationState = (conv as { state: InboundContext["conversationState"] }).state;

  const { error: msgErr } = await sb.from("messages").insert({
    conversation_id: conversationId,
    tenant_id: tenantId,
    direction: "in",
    kind: msg.messageKind === "contact" ? "contact" : msg.messageKind,
    body: msg.text ?? null,
    wa_message_id: msg.waMessageId,
    meta: {
      contact_name: msg.contactName ?? null,
      timestamp: msg.timestamp,
      media: msg.media ?? null,
    },
  });
  if (msgErr) throw new Error(`message insert: ${msgErr.message}`);

  return {
    conversationId,
    conversationState,
    contactId,
    contactPhoneE164: msg.fromPhoneE164,
    waMessageId: msg.waMessageId,
  };
}

// ── anti-loop / debounce ───────────────────────────────────────────────

async function shouldSkipResponse(
  sb: ReturnType<typeof getServiceClient>,
  conversationId: string,
  currentWaMsgId: string,
): Promise<string | null> {
  // 1. Lena já respondeu nos últimos DEBOUNCE_WINDOW_MS ms?
  const since = new Date(Date.now() - DEBOUNCE_WINDOW_MS).toISOString();
  const { data: recentOut } = await sb
    .from("messages")
    .select("id, created_at")
    .eq("conversation_id", conversationId)
    .eq("direction", "out")
    .gt("created_at", since)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (recentOut) return `recent_out_${recentOut.created_at}`;

  // 2. chegou mensagem IN mais nova depois desta? (supersession)
  const { data: latestIn } = await sb
    .from("messages")
    .select("wa_message_id, created_at")
    .eq("conversation_id", conversationId)
    .eq("direction", "in")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (
    latestIn &&
    (latestIn as { wa_message_id: string }).wa_message_id !== currentWaMsgId
  ) {
    return "superseded_by_newer";
  }

  return null;
}

// ── tiers de volume ────────────────────────────────────────────────────

async function classifyVolumeTier(
  sb: ReturnType<typeof getServiceClient>,
  conversationId: string,
  rules: { direct_mode_after_count?: number; handoff_after_count?: number },
): Promise<{ tier: "normal" | "direct" | "handoff"; inCount: number }> {
  const since = new Date(Date.now() - LOOKBACK_MINUTES * 60_000).toISOString();
  const { count } = await sb
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("conversation_id", conversationId)
    .eq("direction", "in")
    .gt("created_at", since);

  const inCount = count ?? 0;
  const directAfter = rules.direct_mode_after_count ?? DEFAULT_DIRECT_AFTER;
  const handoffAfter = rules.handoff_after_count ?? DEFAULT_HANDOFF_AFTER;

  if (inCount >= handoffAfter) return { tier: "handoff", inCount };
  if (inCount >= directAfter) return { tier: "direct", inCount };
  return { tier: "normal", inCount };
}

// ── Claude responde ────────────────────────────────────────────────────

async function respondWithLena(
  sb: ReturnType<typeof getServiceClient>,
  tenantId: string,
  ctx: InboundContext,
) {
  const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!anthropicKey) {
    console.warn("ANTHROPIC_API_KEY missing — Lena não vai responder");
    return;
  }

  // anti-loop
  const skipReason = await shouldSkipResponse(sb, ctx.conversationId, ctx.waMessageId);
  if (skipReason) {
    console.log(`skip response: ${skipReason}`);
    return;
  }

  // load brain + services + contact + tenant (timezone)
  const [brainQ, servicesQ, contactQ, tenantQ] = await Promise.all([
    sb.from("tenant_brains").select("*").eq("tenant_id", tenantId).maybeSingle(),
    sb
      .from("tenant_services")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("active", true)
      .order("position", { ascending: true }),
    sb.from("contacts").select("name, notes").eq("id", ctx.contactId).maybeSingle(),
    sb.from("tenants").select("timezone").eq("id", tenantId).maybeSingle(),
  ]);

  const brain = brainQ.data as Record<string, unknown> | null;
  const services = (servicesQ.data ?? []) as unknown[];
  const contact = contactQ.data as { name: string | null; notes: string | null } | null;
  const tenantTz =
    (tenantQ.data as { timezone?: string } | null)?.timezone || "America/Sao_Paulo";

  if (!brain) {
    console.warn(`tenant ${tenantId} sem brain — pulando resposta`);
    return;
  }

  const rules =
    ((brain.escalation_rules as Record<string, unknown> | null)?.anti_abuse as
      | { direct_mode_after_count?: number; handoff_after_count?: number }
      | undefined) ?? {};
  const { tier, inCount } = await classifyVolumeTier(sb, ctx.conversationId, rules);
  console.log(`tier=${tier} in_count_last_hour=${inCount}`);

  // ── handoff: para de responder e marca conversa em modo paused ──
  if (tier === "handoff") {
    const handoffMsg =
      "Estou vendo que você tem várias coisas pra resolver. Vou pedir ajuda da nossa equipe pra te atender melhor, fica disponível por aqui que alguém te chama em seguida.";

    const secret = await loadSecret(sb, tenantId);
    if (secret) {
      const provider = new MetaCloudProvider(secret);
      try {
        const r = await provider.sendText(ctx.contactPhoneE164, handoffMsg);
        await sb.from("messages").insert({
          conversation_id: ctx.conversationId,
          tenant_id: tenantId,
          direction: "out",
          kind: "text",
          body: handoffMsg,
          wa_message_id: r.waMessageId,
          meta: { ai_model: null, handoff: true },
        });
      } catch (e) {
        console.error("handoff send falhou:", e);
      }
    }
    await sb
      .from("conversations")
      .update({ state: "paused" })
      .eq("id", ctx.conversationId);
    return;
  }

  // histórico
  const { data: history } = await sb
    .from("messages")
    .select("direction, body, created_at")
    .eq("conversation_id", ctx.conversationId)
    .eq("kind", "text")
    .order("created_at", { ascending: false })
    .limit(HISTORY_LIMIT);

  const ordered = (history ?? []).slice().reverse();
  const messages = ordered
    .map((m: { direction: string; body: string | null }) => ({
      role: m.direction === "in" ? ("user" as const) : ("assistant" as const),
      content: String(m.body ?? "").trim(),
    }))
    .filter((m) => m.content.length > 0);

  if (messages.length === 0) {
    console.warn("histórico vazio, abortando");
    return;
  }

  // secret
  const secret = await loadSecret(sb, tenantId);
  if (!secret) {
    console.warn(`tenant ${tenantId} sem wa secret — pulando envio`);
    return;
  }

  // modelo de diálogo escolhido pelo tenant (com allowlist e fallback)
  const brainModel = typeof brain.ai_model === "string" ? brain.ai_model : DEFAULT_MODEL;
  const dialogModel = ALLOWED_DIALOG_MODELS.has(brainModel) ? brainModel : DEFAULT_MODEL;

  // prompt
  const cfg = brainRecordToPrompt(brain as never, services as never);
  let system = buildDemoSystem(cfg);

  if (contact?.notes && contact.notes.trim().length > 0) {
    system +=
      `\n\nSOBRE ESTE CLIENTE (notas internas, não confirme com ele a menos que ele pergunte direto):\n${contact.notes.trim()}`;
  }

  if (tier === "direct") {
    system +=
      `\n\nATENÇÃO: este cliente já mandou ${inCount} mensagens na última hora. Responda em UMA única frase, vá direto ao ponto. Ofereça transferir para um humano da equipe agora ("quer que eu te conecte com nossa equipe?").`;
  }

  // ── tools de agenda (só se o tenant tem disponibilidade configurada) ──
  const { count: availCount } = await sb
    .from("tenant_availability")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("active", true);
  const agendaEnabled = (availCount ?? 0) > 0;
  const tools = agendaEnabled ? buildAgendaTools() : undefined;

  if (agendaEnabled) {
    const tz = tenantTz;
    const nowLocal = new Date().toLocaleString("pt-BR", { timeZone: tz });
    system +=
      `\n\nAGENDA. Você consegue agendar de verdade.` +
      `\nAgora é ${nowLocal} (fuso ${tz}). Para agendar:` +
      `\n1. Use consultar_horarios_livres para ver horários reais antes de oferecer qualquer horário. Nunca invente horário.` +
      `\n2. Confirme o horário e o serviço com o cliente.` +
      `\n3. Use criar_agendamento. Se o horário foi tomado, ofereça outro da lista.` +
      `\nPergunte o nome do cliente se ainda não souber. Para cancelar, use cancelar_agendamento com o id que você criou.`;
  }

  // ── loop de conversa com tool use ──
  const provider = new MetaCloudProvider(secret);
  // conversa em blocos (começa do histórico em texto)
  const convo: { role: "user" | "assistant"; content: unknown }[] = messages.map(
    (m) => ({ role: m.role, content: m.content }),
  );

  let totalIn = 0;
  let totalOut = 0;
  let finalText = "";
  let lastStopReason: string | null = null;
  const MAX_TOOL_ROUNDS = 5;

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const anthropicResp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: dialogModel,
        max_tokens: MAX_TOKENS,
        system,
        messages: convo,
        ...(tools ? { tools } : {}),
      }),
    });

    if (!anthropicResp.ok) {
      console.error(`anthropic ${anthropicResp.status}: ${await anthropicResp.text()}`);
      return;
    }

    const claudeData = (await anthropicResp.json()) as {
      content?: { type: string; text?: string; id?: string; name?: string; input?: unknown }[];
      usage?: { input_tokens?: number; output_tokens?: number };
      stop_reason?: string;
    };
    totalIn += claudeData.usage?.input_tokens ?? 0;
    totalOut += claudeData.usage?.output_tokens ?? 0;
    lastStopReason = claudeData.stop_reason ?? null;

    const blocks = claudeData.content ?? [];
    finalText = blocks
      .filter((b) => b.type === "text")
      .map((b) => b.text ?? "")
      .join("")
      .trim();

    if (claudeData.stop_reason === "tool_use") {
      // executa cada tool e devolve resultados
      convo.push({ role: "assistant", content: blocks });
      const toolResults: unknown[] = [];
      for (const b of blocks) {
        if (b.type !== "tool_use") continue;
        const result = await executeAgendaTool(sb, {
          tenantId,
          tz: tenantTz,
          conversationId: ctx.conversationId,
          contactId: ctx.contactId,
          contactName: contact?.name ?? null,
          services: services as { id: string; name: string; duration_min: number | null }[],
          name: b.name ?? "",
          input: (b.input ?? {}) as Record<string, unknown>,
        });
        toolResults.push({
          type: "tool_result",
          tool_use_id: b.id,
          content: JSON.stringify(result),
        });
      }
      convo.push({ role: "user", content: toolResults });
      continue; // próxima rodada
    }

    break; // end_turn ou outro: sai com finalText
  }

  if (!finalText) {
    console.warn("Claude não produziu texto final");
    return;
  }

  // envia resposta final
  let sendResult;
  try {
    sendResult = await provider.sendText(ctx.contactPhoneE164, finalText);
  } catch (e) {
    console.error("sendText falhou:", e);
    return;
  }

  const { data: outMsg } = await sb
    .from("messages")
    .insert({
      conversation_id: ctx.conversationId,
      tenant_id: tenantId,
      direction: "out",
      kind: "text",
      body: finalText,
      wa_message_id: sendResult.waMessageId,
      meta: { ai_model: dialogModel, stop_reason: lastStopReason, tier },
    })
    .select("id")
    .single();

  const pricing = pricingFor(dialogModel);
  const costMicroUsd = Math.round(
    (totalIn * pricing.in) / 1000 + (totalOut * pricing.out) / 1000,
  );

  await sb.from("ai_usage").insert({
    tenant_id: tenantId,
    conversation_id: ctx.conversationId,
    message_id: (outMsg as { id?: string } | null)?.id ?? null,
    model: dialogModel,
    input_tokens: totalIn,
    output_tokens: totalOut,
    cost_micro_usd: costMicroUsd,
    meta: { tier, stop_reason: lastStopReason, agenda: agendaEnabled },
  });

  console.log(
    `Lena respondeu tenant=${tenantId} conv=${ctx.conversationId} tier=${tier} model=${dialogModel} ` +
      `agenda=${agendaEnabled} in=${totalIn} out=${totalOut} cost=${costMicroUsd}µUSD`,
  );

  // ── atualizar notes do contato em background, a cada N turnos ──
  if (inCount > 0 && inCount % NOTES_UPDATE_EVERY_TURNS === 0) {
    const job = updateContactNotes(sb, ctx.contactId, contact?.notes ?? null, messages, anthropicKey, tenantId);
    if (typeof EdgeRuntime !== "undefined" && EdgeRuntime.waitUntil) {
      EdgeRuntime.waitUntil(job.catch((e) => console.error("notes update bg failed:", e)));
    } else {
      job.catch((e) => console.error("notes update failed:", e));
    }
  }
}

// ── tools de agenda ──────────────────────────────────────────────────────

function buildAgendaTools() {
  return [
    {
      name: "consultar_horarios_livres",
      description:
        "Consulta horários livres reais na agenda do negócio. Use SEMPRE antes de oferecer um horário ao cliente. Devolve uma lista de horários disponíveis.",
      input_schema: {
        type: "object",
        properties: {
          de: {
            type: "string",
            description: "Data inicial da busca no formato AAAA-MM-DD. Use hoje se o cliente não especificou.",
          },
          ate: {
            type: "string",
            description: "Data final da busca no formato AAAA-MM-DD. Use até 7 dias à frente se o cliente não especificou.",
          },
          duracao_min: {
            type: "integer",
            description: "Duração desejada em minutos. Deixe vazio para usar o padrão do serviço.",
          },
        },
        required: ["de", "ate"],
      },
    },
    {
      name: "criar_agendamento",
      description:
        "Cria um agendamento de verdade. Só use depois de confirmar horário e serviço com o cliente. Se o horário já tiver sido tomado, devolve erro e você deve oferecer outro.",
      input_schema: {
        type: "object",
        properties: {
          inicio: {
            type: "string",
            description: "Data e hora de início no formato AAAA-MM-DDTHH:MM (horário local do negócio).",
          },
          duracao_min: {
            type: "integer",
            description: "Duração em minutos.",
          },
          nome_cliente: {
            type: "string",
            description: "Nome de quem está agendando.",
          },
          servico: {
            type: "string",
            description: "Nome do serviço, se houver.",
          },
        },
        required: ["inicio", "duracao_min"],
      },
    },
    {
      name: "cancelar_agendamento",
      description: "Cancela um agendamento existente pelo id devolvido em criar_agendamento.",
      input_schema: {
        type: "object",
        properties: {
          agendamento_id: { type: "string", description: "id do agendamento" },
          motivo: { type: "string", description: "motivo opcional" },
        },
        required: ["agendamento_id"],
      },
    },
  ];
}

interface AgendaToolCtx {
  tenantId: string;
  tz: string;
  conversationId: string;
  contactId: string;
  contactName: string | null;
  services: { id: string; name: string; duration_min: number | null }[];
  name: string;
  input: Record<string, unknown>;
}

async function executeAgendaTool(
  sb: ReturnType<typeof getServiceClient>,
  ctx: AgendaToolCtx,
): Promise<unknown> {
  try {
    if (ctx.name === "consultar_horarios_livres") {
      const de = String(ctx.input.de ?? "");
      const ate = String(ctx.input.ate ?? "");
      const dur = ctx.input.duracao_min ? Number(ctx.input.duracao_min) : null;
      const { data, error } = await sb.rpc("find_free_slots", {
        p_tenant_id: ctx.tenantId,
        p_from: de,
        p_to: ate,
        p_duration_min: dur,
        p_limit: 12,
      });
      if (error) return { ok: false, error: error.message };
      const slots = ((data ?? []) as { slot_start: string }[]).map((s) =>
        new Date(s.slot_start).toLocaleString("pt-BR", {
          timeZone: ctx.tz,
          weekday: "short",
          day: "2-digit",
          month: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        }),
      );
      return { ok: true, horarios: slots, total: slots.length };
    }

    if (ctx.name === "criar_agendamento") {
      // interpreta "AAAA-MM-DDTHH:MM" como horário local do tenant
      const raw = String(ctx.input.inicio ?? "").trim();
      const startsAtIso = localToIso(raw, ctx.tz);
      if (!startsAtIso) return { ok: false, error: "data_invalida" };
      const dur = Number(ctx.input.duracao_min ?? 60);
      const servico = ctx.input.servico ? String(ctx.input.servico) : null;
      const matched = servico
        ? ctx.services.find(
            (s) => s.name.toLowerCase() === servico.toLowerCase(),
          )
        : undefined;

      const { data, error } = await sb.rpc("book_appointment", {
        p_tenant_id: ctx.tenantId,
        p_starts_at: startsAtIso,
        p_duration_min: dur,
        p_customer_name: String(ctx.input.nome_cliente ?? ctx.contactName ?? ""),
        p_contact_id: ctx.contactId,
        p_service_id: matched?.id ?? null,
        p_conversation_id: ctx.conversationId,
        p_origin: "lena",
        p_notes: null,
      });
      if (error) return { ok: false, error: error.message };
      return data;
    }

    if (ctx.name === "cancelar_agendamento") {
      const { data, error } = await sb.rpc("cancel_appointment", {
        p_appointment_id: String(ctx.input.agendamento_id ?? ""),
        p_reason: ctx.input.motivo ? String(ctx.input.motivo) : null,
      });
      if (error) return { ok: false, error: error.message };
      return data;
    }

    return { ok: false, error: "ferramenta_desconhecida" };
  } catch (e) {
    return { ok: false, error: String((e as Error).message ?? e) };
  }
}

/**
 * Converte "AAAA-MM-DDTHH:MM" (ou com espaço) no horário local do tenant
 * para um ISO com offset correto. Usa Intl para descobrir o offset do tz
 * naquela data (cobre horário de verão).
 */
function localToIso(raw: string, tz: string): string | null {
  const m = raw.match(/(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/);
  if (!m) return null;
  const [, y, mo, d, h, mi] = m;
  // monta uma data assumindo UTC, depois corrige pelo offset do tz
  const asUtc = Date.UTC(+y, +mo - 1, +d, +h, +mi, 0);
  const offsetMs = tzOffsetMs(new Date(asUtc), tz);
  return new Date(asUtc - offsetMs).toISOString();
}

function tzOffsetMs(date: Date, tz: string): number {
  // diferença entre o "wall clock" no tz e o UTC, em ms
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = dtf.formatToParts(date);
  const map: Record<string, number> = {};
  for (const p of parts) {
    if (p.type !== "literal") map[p.type] = Number(p.value);
  }
  const asUtcWall = Date.UTC(
    map.year,
    map.month - 1,
    map.day,
    map.hour === 24 ? 0 : map.hour,
    map.minute,
    map.second,
  );
  return asUtcWall - date.getTime();
}

// ── helpers ─────────────────────────────────────────────────────────────

interface ProviderOpts {
  phoneNumberId: string;
  accessToken: string;
  appSecret: string;
  verifyToken: string;
}

async function loadSecret(
  sb: ReturnType<typeof getServiceClient>,
  tenantId: string,
): Promise<ProviderOpts | null> {
  const { data } = await sb
    .from("tenant_secrets")
    .select("value, meta")
    .eq("tenant_id", tenantId)
    .eq("kind", "wa")
    .maybeSingle();
  if (!data) return null;
  const meta = ((data as { meta: { phone_number_id?: string } }).meta ?? {}) as {
    phone_number_id?: string;
  };
  if (!meta.phone_number_id || !(data as { value: string }).value) return null;
  return {
    phoneNumberId: meta.phone_number_id,
    accessToken: (data as { value: string }).value,
    appSecret: Deno.env.get("META_APP_SECRET") ?? "",
    verifyToken: Deno.env.get("META_VERIFY_TOKEN") ?? "",
  };
}

async function updateContactNotes(
  sb: ReturnType<typeof getServiceClient>,
  contactId: string,
  currentNotes: string | null,
  conversation: { role: "user" | "assistant"; content: string }[],
  anthropicKey: string,
  tenantId: string,
): Promise<void> {
  const recent = conversation.slice(-10);
  const transcript = recent
    .map((m) => `[${m.role === "user" ? "cliente" : "lena"}] ${m.content}`)
    .join("\n");

  const userPrompt =
    `Você é uma analista de CRM. Atualize as notas internas sobre este cliente, baseado na conversa abaixo.\n\n` +
    `NOTAS ATUAIS:\n${currentNotes && currentNotes.trim() ? currentNotes.trim() : "(sem notas anteriores)"}\n\n` +
    `CONVERSA RECENTE:\n${transcript}\n\n` +
    `INSTRUÇÕES:\n` +
    `- Devolva apenas as novas notas, em até 3 linhas curtas.\n` +
    `- Foque em preferências, perguntas recorrentes, contexto pessoal relevante (ex.: tipo de negócio, dores mencionadas, próximo passo combinado).\n` +
    `- NUNCA registre dados sensíveis (senha, CPF, cartão, saúde detalhada).\n` +
    `- Se nada novo de relevante, devolva as notas atuais sem mudança.\n` +
    `- Não escreva preâmbulo. Devolva só o texto das notas, sem aspas.`;

  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": anthropicKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL_LIGHT,
      max_tokens: 250,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  if (!resp.ok) {
    console.warn(`notes haiku ${resp.status}: ${await resp.text()}`);
    return;
  }
  const data = (await resp.json()) as {
    content?: { type: string; text?: string }[];
    usage?: { input_tokens?: number; output_tokens?: number };
  };
  const text = (data.content ?? [])
    .filter((b) => b.type === "text")
    .map((b) => b.text ?? "")
    .join("")
    .trim();

  if (!text || text.length < 5) return;

  await sb.from("contacts").update({ notes: text }).eq("id", contactId);

  // telemetria
  const usage = data.usage ?? {};
  const pricing = pricingFor(MODEL_LIGHT);
  const costMicro = Math.round(
    ((usage.input_tokens ?? 0) * pricing.in) / 1000 +
      ((usage.output_tokens ?? 0) * pricing.out) / 1000,
  );
  await sb.from("ai_usage").insert({
    tenant_id: tenantId,
    model: MODEL_LIGHT,
    input_tokens: usage.input_tokens ?? 0,
    output_tokens: usage.output_tokens ?? 0,
    cost_micro_usd: costMicro,
    meta: { purpose: "contact_notes_update" },
  });
}
