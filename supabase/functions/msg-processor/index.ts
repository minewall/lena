// ============================================================================
// msg-processor — processa um webhook_event de WhatsApp em background.
//
// Recebe { webhook_event_id } via POST com Authorization: Bearer SERVICE_ROLE.
//
// Para cada evento:
//  - 'message': upsert contact, upsert conversation (state='lena'), insert
//    em messages com direction='in'. Marca webhook_event.status='processed'.
//  - 'status': por ora só marca processed (futuro: atualizar message.meta com
//    status sent/delivered/read/failed).
//
// Esta função ainda NÃO chama Claude nem envia resposta. Isso é E5 — quando
// a IA real entrar no caminho do WhatsApp. Por ora, msg-processor só persiste
// para que a inbox da Central já tenha histórico real para mostrar.
// ============================================================================

import { getServiceClient } from "../_shared/supabase.ts";
import type {
  WhatsAppInboundEvent,
  WhatsAppInboundMessage,
} from "../_shared/wa/types.ts";

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

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  // Autenticação simples por SERVICE_ROLE (chamada interna)
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
      await processInboundMessage(sb, event.tenant_id, event.payload);
    }
    // status events: por ora só marca processado (atualização de status
    // de mensagem enviada será implementada junto com o envio em E5)

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

// ── helpers ─────────────────────────────────────────────────────────────

async function processInboundMessage(
  sb: ReturnType<typeof getServiceClient>,
  tenantId: string,
  msg: WhatsAppInboundMessage,
) {
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

  // 2) upsert conversation (1 por tenant+contact+channel)
  const { data: conv, error: convErr } = await sb
    .from("conversations")
    .upsert(
      {
        tenant_id: tenantId,
        contact_id: contactId,
        channel: "whatsapp",
      },
      { onConflict: "tenant_id,contact_id,channel", ignoreDuplicates: false },
    )
    .select("id")
    .single();
  if (convErr) throw new Error(`conversation upsert: ${convErr.message}`);

  const conversationId = (conv as { id: string }).id;

  // 3) insert message
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
}
