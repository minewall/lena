-- ============================================================================
-- Watchdog do pipeline de WhatsApp — "a Lena nunca fica offline".
--
-- A cada 5 minutos (pg_cron):
--   1. Re-despacha para o msg-processor todo webhook_event preso em
--      'received' há mais de 2 minutos (o despacho normal é assíncrono e
--      pode falhar; este é o retry de segurança).
--   2. Se houver evento preso há mais de 15 minutos (retry não está dando
--      conta = incidente real), manda alerta por WhatsApp para o operador
--      da plataforma, no máximo 1 por hora (tabela ops_alerts).
--
-- Aprendizado do incidente 2026-06-10 (migração p/ API keys sb_secret).
-- ============================================================================

create table if not exists public.ops_alerts (
  kind text primary key,
  last_sent_at timestamptz not null default now()
);
alter table public.ops_alerts enable row level security;
create policy "ops_alerts: platform admin" on public.ops_alerts
  for select using (is_platform_admin());

create or replace function public.requeue_stuck_webhooks()
returns void
language plpgsql
security definer
set search_path = public, vault, net
as $$
declare
  v_key text;
  v_evt record;
  v_stuck_15m int;
  v_wa record;
  v_alert_due boolean;
begin
  select decrypted_secret into v_key
    from vault.decrypted_secrets where name = 'service_role_key' limit 1;
  if v_key is null then
    raise warning 'watchdog: service_role_key ausente no vault';
    return;
  end if;

  -- 1. retry: re-despacha eventos presos (>2 min, até 20 por rodada)
  for v_evt in
    select id from public.webhook_events
     where status = 'received'
       and received_at < now() - interval '2 minutes'
     order by received_at
     limit 20
  loop
    perform net.http_post(
      url := 'https://tirvnwsiokivrswdthge.supabase.co/functions/v1/msg-processor',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || v_key,
        'apikey', v_key
      ),
      body := jsonb_build_object('webhook_event_id', v_evt.id)
    );
  end loop;

  -- 2. alerta: preso há >15 min = retry não resolveu
  select count(*) into v_stuck_15m
    from public.webhook_events
   where status = 'received'
     and received_at < now() - interval '15 minutes';

  if v_stuck_15m = 0 then
    return;
  end if;

  select coalesce(
    (select last_sent_at < now() - interval '1 hour'
       from public.ops_alerts where kind = 'webhook_stuck'),
    true
  ) into v_alert_due;
  if not v_alert_due then
    return;
  end if;

  -- token/numero do WhatsApp do tenant da plataforma (Lena)
  select s.value as token,
         (s.meta ->> 'phone_number_id') as phone_number_id
    into v_wa
    from public.tenant_secrets s
   where s.kind = 'wa'
     and (s.meta ->> 'phone_number_id') is not null
   order by s.updated_at desc
   limit 1;

  if v_wa.token is not null then
    perform net.http_post(
      url := 'https://graph.facebook.com/v21.0/' || v_wa.phone_number_id || '/messages',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || v_wa.token
      ),
      body := jsonb_build_object(
        'messaging_product', 'whatsapp',
        'to', '5511998602717',
        'type', 'text',
        'text', jsonb_build_object(
          'body',
          'ALERTA Central da Lena: ' || v_stuck_15m ||
          ' mensagem(ns) de WhatsApp presas ha mais de 15 minutos sem processamento. ' ||
          'O retry automatico nao esta dando conta. Verifique as edge functions no Supabase.'
        )
      )
    );
  end if;

  insert into public.ops_alerts (kind, last_sent_at)
  values ('webhook_stuck', now())
  on conflict (kind) do update set last_sent_at = now();
end;
$$;

select cron.schedule(
  'webhook-watchdog',
  '*/5 * * * *',
  $$select public.requeue_stuck_webhooks()$$
);
