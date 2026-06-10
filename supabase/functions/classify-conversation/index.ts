// ============================================================================
// classify-conversation — extrai sentimento + tipo de solicitação de uma
// conversa encerrada, numa única chamada de Haiku (~R$0,005/conversa).
//
// Chamada pelo pg_cron (dispatch_conversation_classification) com a service
// key. Grava conversations.sentiment / .intent / .classified_at e telemetria
// em ai_usage. Conversa sem texto suficiente é marcada como classificada
// (com nulls) para o cron não insistir.
// ============================================================================

import { getServiceClient } from "../_shared/supabase.ts";

const MODEL = "claude-haiku-4-5";
const MAX_MESSAGES = 30;
const SENTIMENTS = new Set(["positivo", "neutro", "negativo"]);
const INTENTS = new Set([
  "agendamento",
  "remarcacao_cancelamento",
  "preco_planos",
  "duvida_info",
  "reclamacao",
  "outro",
]);
// micro-USD por 1k tokens
const PRICE_IN = 1000;
const PRICE_OUT = 5000;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  const srk = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const auth = req.headers.get("authorization");
  const apikey = req.headers.get("apikey");
  if (auth !== `Bearer ${srk}` && apikey !== srk) {
    return json({ error: "forbidden" }, 403);
  }

  let body: { conversation_id?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid json" }, 400);
  }
  if (!body.conversation_id) return json({ error: "conversation_id required" }, 400);

  const sb = getServiceClient();
  const { data: conv } = await sb
    .from("conversations")
    .select("id, tenant_id, classified_at")
    .eq("id", body.conversation_id)
    .maybeSingle();
  if (!conv) return json({ error: "not found" }, 404);
  if ((conv as { classified_at: string | null }).classified_at) {
    return json({ ok: true, skipped: true });
  }
  const tenantId = (conv as { tenant_id: string }).tenant_id;

  const { data: msgs } = await sb
    .from("messages")
    .select("direction, body")
    .eq("conversation_id", body.conversation_id)
    .eq("kind", "text")
    .order("created_at", { ascending: true })
    .limit(MAX_MESSAGES);

  const transcript = (msgs ?? [])
    .map((m: { direction: string; body: string | null }) =>
      `[${m.direction === "in" ? "cliente" : "lena"}] ${String(m.body ?? "").trim()}`)
    .filter((l) => l.length > 12)
    .join("\n");

  if (transcript.length < 40) {
    await sb
      .from("conversations")
      .update({ classified_at: new Date().toISOString() })
      .eq("id", body.conversation_id);
    return json({ ok: true, skipped: "too_short" });
  }

  const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!anthropicKey) return json({ error: "no anthropic key" }, 500);

  const prompt =
    `Classifique a conversa de atendimento abaixo (WhatsApp, negócio de serviço).\n\n` +
    `CONVERSA:\n${transcript}\n\n` +
    `Responda APENAS com JSON válido, sem markdown, neste formato:\n` +
    `{"sentimento":"positivo|neutro|negativo","tipo":"agendamento|remarcacao_cancelamento|preco_planos|duvida_info|reclamacao|outro"}\n\n` +
    `Regras:\n` +
    `- sentimento = como o CLIENTE termina a conversa (não a Lena).\n` +
    `- tipo = a intenção PRINCIPAL do cliente na conversa.\n` +
    `- Cliente que só cumprimentou ou testou = neutro / outro.`;

  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": anthropicKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 100,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!resp.ok) {
    console.error(`anthropic ${resp.status}: ${await resp.text()}`);
    return json({ error: "anthropic_failed" }, 500);
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

  let parsed: { sentimento?: string; tipo?: string } = {};
  try {
    parsed = JSON.parse(text.replace(/^```json?\s*|\s*```$/g, ""));
  } catch {
    console.error("parse falhou:", text);
  }

  const sentiment = SENTIMENTS.has(parsed.sentimento ?? "") ? parsed.sentimento! : null;
  const intent = INTENTS.has(parsed.tipo ?? "") ? parsed.tipo! : null;

  await sb
    .from("conversations")
    .update({
      sentiment,
      intent,
      classified_at: new Date().toISOString(),
    })
    .eq("id", body.conversation_id);

  const usage = data.usage ?? {};
  const costMicro = Math.round(
    ((usage.input_tokens ?? 0) * PRICE_IN) / 1000 +
      ((usage.output_tokens ?? 0) * PRICE_OUT) / 1000,
  );
  await sb.from("ai_usage").insert({
    tenant_id: tenantId,
    conversation_id: body.conversation_id,
    model: MODEL,
    input_tokens: usage.input_tokens ?? 0,
    output_tokens: usage.output_tokens ?? 0,
    cost_micro_usd: costMicro,
    meta: { purpose: "classify_conversation", sentiment, intent },
  });

  return json({ ok: true, sentiment, intent });
});
