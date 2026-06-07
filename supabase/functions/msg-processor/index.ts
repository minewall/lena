// ============================================================================
// msg-processor — processa um webhook_event de WhatsApp em background.
//
// Recebe { webhook_event_id } via POST com Authorization: Bearer SERVICE_ROLE.
//
// Para evento kind='message':
//   1. Upsert contact + conversation + insert message inbound.
//   2. Se conversation.state = 'lena', chama Claude e envia resposta via WA.
//   3. Persiste outbound message + ai_usage.
//   4. Marca webhook_event.status='processed'.
//
// Para evento kind='status': por ora só marca processed (atualização de
// status de mensagem enviada será no E6+).
// ============================================================================

import { getServiceClient } from "../_shared/supabase.ts";
import type {
  WhatsAppInboundEvent,
  WhatsAppInboundMessage,
} from "../_shared/wa/types.ts";
import { MetaCloudProvider } from "../_shared/wa/meta-cloud.ts";
import { buildDemoSystem, brainRecordToPrompt } from "../_shared/prompt/index.ts";

const MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 600;
const HISTORY_LIMIT = 20;

// Pricing em micro-USD por 1k tokens (×1e6 do USD/1k)
const PRICING_MICRO_PER_1K: Record<string, { in: number; out: number }> = {
  "claude-sonnet-4-6": { in: 3000, out: 15000 },
  "claude-haiku-4-5-20251001": { in: 800, out: 4000 },
};

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
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  const auth = req.headers.get("authorization");
  const expected = `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`;
  if (auth !== expected) return json({ error: "forbidden" }, 403);

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
        await respondWithLena(sb, event.tenant_id, ctx, event.payload.text);
      }
    }
    // status events: por ora só marca processado.

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
  // 1) upsert contact
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

  // 2) upsert conversation
  const { data: conv, error: convErr } = await sb
    .from("conversations")
    .upsert(
      { tenant_id: tenantId, contact_id: contactId, channel: "whatsapp" },
      { onConflict: "tenant_id,contact_id,channel", ignoreDuplicates: false },
    )
    .select("id, state")
    .single();
  if (convErr) throw new Error(`conversation upsert: ${convErr.message}`);

  const conversationId = (conv as { id: string; state: InboundContext["conversationState"] }).id;
  const conversationState = (conv as { state: InboundContext["conversationState"] }).state;

  // 3) insert inbound message
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
  };
}

// ── Claude responde ────────────────────────────────────────────────────

async function respondWithLena(
  sb: ReturnType<typeof getServiceClient>,
  tenantId: string,
  ctx: InboundContext,
  _latestUserText: string,
) {
  const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!anthropicKey) {
    console.warn("ANTHROPIC_API_KEY missing — Lena não vai responder");
    return;
  }

  // 1) carrega brain + services ativos
  const [{ data: brain }, { data: services }] = await Promise.all([
    sb.from("tenant_brains").select("*").eq("tenant_id", tenantId).maybeSingle(),
    sb
      .from("tenant_services")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("active", true)
      .order("position", { ascending: true }),
  ]);

  if (!brain) {
    console.warn(`tenant ${tenantId} sem brain — pulando resposta`);
    return;
  }

  // 2) histórico recente (últimas N mensagens text)
  const { data: history } = await sb
    .from("messages")
    .select("direction, body, created_at")
    .eq("conversation_id", ctx.conversationId)
    .eq("kind", "text")
    .order("created_at", { ascending: false })
    .limit(HISTORY_LIMIT);

  const ordered = (history ?? []).slice().reverse();
  const messages = ordered
    .map((m) => ({
      role: m.direction === "in" ? ("user" as const) : ("assistant" as const),
      content: String(m.body ?? "").trim(),
    }))
    .filter((m) => m.content.length > 0);

  if (messages.length === 0) {
    console.warn("histórico vazio, abortando");
    return;
  }

  // 3) secret do tenant (token + phone_number_id)
  const { data: secret } = await sb
    .from("tenant_secrets")
    .select("value, meta")
    .eq("tenant_id", tenantId)
    .eq("kind", "wa")
    .maybeSingle();
  if (!secret) {
    console.warn(`tenant ${tenantId} sem wa secret — pulando envio`);
    return;
  }

  const meta = (secret.value ? (secret as { meta: { phone_number_id?: string } }).meta : {}) || {};
  const phoneNumberId = meta.phone_number_id;
  const accessToken = (secret as { value: string }).value;
  if (!phoneNumberId || !accessToken) {
    console.warn("secret incompleto (phone_number_id ou token), abortando");
    return;
  }

  // 4) monta system prompt via @lena/shared
  const cfg = brainRecordToPrompt(brain, (services ?? []) as never);
  const system = buildDemoSystem(cfg);

  // 5) chama Anthropic
  const anthropicResp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": anthropicKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system,
      messages,
    }),
  });

  if (!anthropicResp.ok) {
    const errText = await anthropicResp.text();
    console.error(`anthropic ${anthropicResp.status}: ${errText}`);
    return;
  }

  const claudeData = (await anthropicResp.json()) as {
    content?: { type: string; text?: string }[];
    usage?: { input_tokens?: number; output_tokens?: number };
    stop_reason?: string;
  };
  const replyText = (claudeData.content ?? [])
    .filter((b) => b.type === "text")
    .map((b) => b.text ?? "")
    .join("")
    .trim();

  if (!replyText) {
    console.warn("Claude devolveu vazio");
    return;
  }

  // 6) envia via WhatsApp Cloud API
  const provider = new MetaCloudProvider({
    phoneNumberId,
    accessToken,
    appSecret: Deno.env.get("META_APP_SECRET") ?? "",
    verifyToken: Deno.env.get("META_VERIFY_TOKEN") ?? "",
  });

  let sendResult;
  try {
    sendResult = await provider.sendText(ctx.contactPhoneE164, replyText);
  } catch (e) {
    console.error("sendText falhou:", e);
    return;
  }

  // 7) persiste outbound message + ai_usage
  const { data: outMsg, error: outErr } = await sb
    .from("messages")
    .insert({
      conversation_id: ctx.conversationId,
      tenant_id: tenantId,
      direction: "out",
      kind: "text",
      body: replyText,
      wa_message_id: sendResult.waMessageId,
      meta: {
        ai_model: MODEL,
        stop_reason: claudeData.stop_reason ?? null,
      },
    })
    .select("id")
    .single();

  if (outErr) {
    console.error("erro ao persistir outbound:", outErr);
  }

  const inputTokens = claudeData.usage?.input_tokens ?? 0;
  const outputTokens = claudeData.usage?.output_tokens ?? 0;
  const pricing = PRICING_MICRO_PER_1K[MODEL] ?? PRICING_MICRO_PER_1K["claude-sonnet-4-6"];
  const costMicroUsd = Math.round(
    (inputTokens * pricing.in) / 1000 + (outputTokens * pricing.out) / 1000,
  );

  await sb.from("ai_usage").insert({
    tenant_id: tenantId,
    conversation_id: ctx.conversationId,
    message_id: (outMsg as { id?: string } | null)?.id ?? null,
    model: MODEL,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    cost_micro_usd: costMicroUsd,
    meta: { stop_reason: claudeData.stop_reason ?? null },
  });

  console.log(
    `Lena respondeu tenant=${tenantId} conv=${ctx.conversationId} ` +
      `in=${inputTokens} out=${outputTokens} cost=${costMicroUsd}µUSD`,
  );
}
