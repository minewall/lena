// ============================================================================
// wa-webhook — recebe webhooks da Meta (WhatsApp Cloud API).
//
// Responsabilidades:
//  1. GET handshake: responde hub.challenge se hub.verify_token = META_VERIFY_TOKEN.
//  2. POST: valida X-Hub-Signature-256 com META_APP_SECRET.
//  3. Resolve tenant pelo phone_number_id do payload.
//  4. INSERT idempotente em webhook_events (UNIQUE source+external_id).
//  5. Responde 200 OK em <500ms.
//  6. Em paralelo (EdgeRuntime.waitUntil) dispara msg-processor com o
//     webhook_event_id para processamento assíncrono.
//
// Esta função NÃO chama Claude e NÃO envia resposta no WhatsApp.
// Ela é só o gateway de ingestão. msg-processor faz o resto.
// ============================================================================

import { getEnv } from "../_shared/env.ts";
import { getServiceClient } from "../_shared/supabase.ts";
import { normalizeMetaWebhook } from "../_shared/wa/meta-cloud.ts";
import { validateMetaSignature } from "../_shared/wa/signature.ts";

declare const EdgeRuntime: { waitUntil(p: Promise<unknown>): void } | undefined;

interface JsonResp {
  status?: number;
}
function json(body: unknown, opts: JsonResp = {}): Response {
  return new Response(JSON.stringify(body), {
    status: opts.status ?? 200,
    headers: { "content-type": "application/json" },
  });
}
function text(body: string, status = 200): Response {
  return new Response(body, { status, headers: { "content-type": "text/plain" } });
}

Deno.serve(async (req) => {
  const url = new URL(req.url);

  // ── 1. GET handshake ────────────────────────────────────────────────
  if (req.method === "GET") {
    const env = getEnv();
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");
    if (mode === "subscribe" && token === env.metaVerifyToken && challenge) {
      return text(challenge, 200);
    }
    return text("forbidden", 403);
  }

  if (req.method !== "POST") return text("method not allowed", 405);

  // ── 2. POST: valida assinatura ──────────────────────────────────────
  let env;
  try {
    env = getEnv();
  } catch (e) {
    console.error("env error:", e);
    return text("config error", 500);
  }

  const rawBody = await req.text();
  const sigHeader = req.headers.get("x-hub-signature-256");
  const sigOk = await validateMetaSignature({
    rawBody,
    signatureHeader: sigHeader,
    appSecret: env.metaAppSecret,
  });
  if (!sigOk) return text("invalid signature", 401);

  // ── 3. parse + idempotência ─────────────────────────────────────────
  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return text("invalid json", 400);
  }

  let events;
  try {
    events = normalizeMetaWebhook(payload);
  } catch (e) {
    console.error("normalize error:", e);
    // Mesmo com erro de normalização, tentamos persistir o evento bruto
    // para inspeção. Mas sem phone_number_id não conseguimos resolver tenant.
    return text("ok", 200);
  }

  const sb = getServiceClient();
  const insertedIds: string[] = [];

  for (const evt of events) {
    if (evt.kind === "unknown") continue;

    // resolve tenant via phone_number_id (Meta entrega o ID do número que
    // recebeu — esse é o do tenant)
    let tenantId: string | null = null;
    if ("phoneNumberId" in evt && evt.phoneNumberId) {
      const { data: wa } = await sb
        .from("wa_numbers")
        .select("tenant_id")
        .eq("phone_number_id", evt.phoneNumberId)
        .maybeSingle();
      tenantId = (wa as { tenant_id?: string } | null)?.tenant_id ?? null;
    }

    // external_id por evento:
    // - message: usa waMessageId (único na Meta)
    // - status: composto, para permitir múltiplos status do mesmo wa_message_id
    const external_id =
      evt.kind === "message"
        ? evt.waMessageId
        : `status:${evt.waMessageId}:${evt.status}`;

    const { data: inserted, error } = await sb
      .from("webhook_events")
      .insert({
        source: "whatsapp",
        external_id,
        tenant_id: tenantId,
        payload: evt,
        status: "received",
      })
      .select("id")
      .maybeSingle();

    if (error) {
      // 23505 = unique violation. Caímos aqui em reentregas da Meta — comportamento esperado.
      if (error.code === "23505") continue;
      console.error("insert webhook_events error:", error);
      continue;
    }
    if (inserted) insertedIds.push((inserted as { id: string }).id);
  }

  // ── 4. dispara msg-processor em background ──────────────────────────
  if (insertedIds.length > 0) {
    const trigger = (async () => {
      const target = `${env.supabaseUrl}/functions/v1/msg-processor`;
      for (const id of insertedIds) {
        try {
          await fetch(target, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${env.supabaseServiceRoleKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ webhook_event_id: id }),
          });
        } catch (e) {
          console.error("dispatch msg-processor failed:", e);
        }
      }
    })();
    if (typeof EdgeRuntime !== "undefined" && EdgeRuntime.waitUntil) {
      EdgeRuntime.waitUntil(trigger);
    } else {
      // fallback local: aguarda mesmo (em prod do Supabase, EdgeRuntime existe)
      await trigger;
    }
  }

  return json({ ok: true, count: insertedIds.length });
});
