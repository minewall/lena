// ============================================================================
// operator-send — operador (admin/operador do tenant) envia mensagem manual
// pela Central. Usa o JWT do usuário para validar membership e o
// service_role para ler tenant_secrets e enviar via MetaCloudProvider.
//
// Body esperado: { conversation_id: string, body: string }
// Headers: Authorization: Bearer <user_jwt> (Supabase injeta via
// supabase.functions.invoke)
// ============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.0";
import { MetaCloudProvider } from "../_shared/wa/meta-cloud.ts";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const META_APP_SECRET = Deno.env.get("META_APP_SECRET") ?? "";
const META_VERIFY_TOKEN = Deno.env.get("META_VERIFY_TOKEN") ?? "";

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  const authHeader = req.headers.get("authorization") ?? "";
  if (!authHeader.toLowerCase().startsWith("bearer ")) {
    return json({ error: "missing bearer token" }, 401);
  }

  // 1) cliente autenticado com o JWT do usuário (respeita RLS)
  const userClient = createClient(SUPABASE_URL, SERVICE_KEY, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // confirma quem é o user
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData?.user) {
    return json({ error: "invalid token" }, 401);
  }
  const userId = userData.user.id;

  // 2) parse body
  let body: { conversation_id?: string; body?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid json" }, 400);
  }
  const conversationId = body.conversation_id;
  const text = (body.body ?? "").trim();
  if (!conversationId || !text) {
    return json({ error: "conversation_id and body required" }, 400);
  }
  if (text.length > 4096) {
    return json({ error: "body too long (max 4096 chars)" }, 400);
  }

  // 3) carrega a conversation (RLS valida que o user é membro do tenant)
  const { data: conv, error: convErr } = await userClient
    .from("conversations")
    .select("id, tenant_id, contact_id, state")
    .eq("id", conversationId)
    .maybeSingle();
  if (convErr || !conv) {
    return json({ error: "conversation not found or no access" }, 404);
  }

  const tenantId = (conv as { tenant_id: string }).tenant_id;
  const contactId = (conv as { contact_id: string }).contact_id;

  // 4) cliente service_role para tenant_secrets + contact (precisa bypass RLS)
  const sb = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const [{ data: secret }, { data: contact }] = await Promise.all([
    sb
      .from("tenant_secrets")
      .select("value, meta")
      .eq("tenant_id", tenantId)
      .eq("kind", "wa")
      .maybeSingle(),
    sb.from("contacts").select("phone_e164").eq("id", contactId).maybeSingle(),
  ]);

  if (!secret) return json({ error: "tenant secret missing" }, 500);
  if (!contact) return json({ error: "contact not found" }, 500);

  const meta = ((secret as { meta: { phone_number_id?: string } }).meta ?? {}) as {
    phone_number_id?: string;
  };
  const phoneNumberId = meta.phone_number_id;
  const accessToken = (secret as { value: string }).value;
  if (!phoneNumberId || !accessToken) {
    return json({ error: "wa secret incomplete" }, 500);
  }

  // 5) envia via Cloud API
  const provider = new MetaCloudProvider({
    phoneNumberId,
    accessToken,
    appSecret: META_APP_SECRET,
    verifyToken: META_VERIFY_TOKEN,
  });

  let sendResult;
  try {
    sendResult = await provider.sendText(
      (contact as { phone_e164: string }).phone_e164,
      text,
    );
  } catch (e) {
    console.error("operator sendText failed:", e);
    return json({ error: `sendText: ${(e as Error).message}` }, 502);
  }

  // 6) persiste outbound message (service_role para incluir sent_by_user_id
  //    sem ter que satisfazer a policy de members insert outbound, e para
  //    poder gravar com tenant_id direto)
  const { data: outMsg, error: outErr } = await sb
    .from("messages")
    .insert({
      conversation_id: conversationId,
      tenant_id: tenantId,
      direction: "out",
      kind: "text",
      body: text,
      wa_message_id: sendResult.waMessageId,
      sent_by_user_id: userId,
      meta: { sent_by: "operator" },
    })
    .select("id, created_at")
    .single();

  if (outErr) {
    console.error("operator message insert failed:", outErr);
    return json({ error: `insert: ${outErr.message}` }, 500);
  }

  return json({
    ok: true,
    message_id: (outMsg as { id: string }).id,
    wa_message_id: sendResult.waMessageId,
    created_at: (outMsg as { created_at: string }).created_at,
  });
});
