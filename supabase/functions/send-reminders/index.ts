// ============================================================================
// send-reminders — dispara lembretes de agendamentos ~24h antes.
//
// Chamada pelo pg_cron (de hora em hora) com Authorization: Bearer
// SERVICE_ROLE. Varre appointments com starts_at entre +23h e +25h, status
// booked/confirmed, reminder_sent_at null.
//
// Política de envio:
//  - Se há mensagem do cliente nas últimas 24h (janela WhatsApp aberta),
//    manda texto livre (grátis).
//  - Senão, fora da janela: exige template aprovado pela Meta, que ainda
//    não temos. Por ora, registra como pendente (meta.reminder_pending) e
//    NÃO marca reminder_sent, para retentar quando o template existir.
// ============================================================================

import { getServiceClient } from "../_shared/supabase.ts";
import { MetaCloudProvider } from "../_shared/wa/meta-cloud.ts";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

interface ApptRow {
  id: string;
  tenant_id: string;
  contact_id: string | null;
  conversation_id: string | null;
  starts_at: string;
  customer_name: string | null;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);
  const srk = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const auth = req.headers.get("authorization");
  const apikey = req.headers.get("apikey");
  if (auth !== `Bearer ${srk}` && apikey !== srk) {
    return json({ error: "forbidden" }, 403);
  }

  const sb = getServiceClient();
  const now = Date.now();
  const from = new Date(now + 23 * 3600_000).toISOString();
  const to = new Date(now + 25 * 3600_000).toISOString();

  const { data, error } = await sb
    .from("appointments")
    .select("id, tenant_id, contact_id, conversation_id, starts_at, customer_name")
    .in("status", ["booked", "confirmed"])
    .is("reminder_sent_at", null)
    .gte("starts_at", from)
    .lte("starts_at", to)
    .limit(200);

  if (error) {
    console.error("query appointments:", error);
    return json({ error: error.message }, 500);
  }

  const appts = (data ?? []) as ApptRow[];
  let sent = 0;
  let pending = 0;

  for (const a of appts) {
    if (!a.contact_id) continue;

    // contato + secret + timezone
    const [{ data: contact }, { data: secret }, { data: tenant }] = await Promise.all([
      sb.from("contacts").select("phone_e164, name").eq("id", a.contact_id).maybeSingle(),
      sb
        .from("tenant_secrets")
        .select("value, meta")
        .eq("tenant_id", a.tenant_id)
        .eq("kind", "wa")
        .maybeSingle(),
      sb.from("tenants").select("timezone, name").eq("id", a.tenant_id).maybeSingle(),
    ]);

    if (!contact || !secret) continue;
    const meta = ((secret as { meta: { phone_number_id?: string } }).meta ?? {}) as {
      phone_number_id?: string;
    };
    if (!meta.phone_number_id) continue;

    const tz = (tenant as { timezone?: string } | null)?.timezone || "America/Sao_Paulo";
    const bizName = (tenant as { name?: string } | null)?.name || "o estabelecimento";
    const phone = (contact as { phone_e164: string }).phone_e164;
    const who =
      a.customer_name?.trim() ||
      (contact as { name: string | null }).name?.trim() ||
      "";

    // janela 24h aberta? última mensagem IN do cliente nessa conversa
    let windowOpen = false;
    if (a.conversation_id) {
      const since = new Date(now - 24 * 3600_000).toISOString();
      const { data: lastIn } = await sb
        .from("messages")
        .select("id")
        .eq("conversation_id", a.conversation_id)
        .eq("direction", "in")
        .gt("created_at", since)
        .limit(1)
        .maybeSingle();
      windowOpen = !!lastIn;
    }

    const when = new Date(a.starts_at).toLocaleString("pt-BR", {
      timeZone: tz,
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

    if (windowOpen) {
      const text =
        `Oi${who ? ", " + who.split(" ")[0] : ""}! Passando para lembrar do seu horário em ${bizName}: ${when}. ` +
        `Se precisar remarcar ou cancelar, é só me avisar por aqui.`;
      const provider = new MetaCloudProvider({
        phoneNumberId: meta.phone_number_id,
        accessToken: (secret as { value: string }).value,
        appSecret: Deno.env.get("META_APP_SECRET") ?? "",
        verifyToken: Deno.env.get("META_VERIFY_TOKEN") ?? "",
      });
      try {
        const r = await provider.sendText(phone, text);
        await sb.from("messages").insert({
          conversation_id: a.conversation_id,
          tenant_id: a.tenant_id,
          direction: "out",
          kind: "text",
          body: text,
          wa_message_id: r.waMessageId,
          meta: { reminder: true, appointment_id: a.id },
        });
        await sb
          .from("appointments")
          .update({ reminder_sent_at: new Date().toISOString() })
          .eq("id", a.id);
        sent++;
      } catch (e) {
        console.error(`reminder send falhou appt=${a.id}:`, e);
      }
    } else {
      // fora da janela: precisa template aprovado (ainda não temos).
      // não marca reminder_sent para retentar quando o template existir.
      pending++;
      console.log(
        `reminder pendente (fora da janela 24h, sem template) appt=${a.id}`,
      );
    }
  }

  return json({ ok: true, considered: appts.length, sent, pending });
});
