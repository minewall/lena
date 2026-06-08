-- ============================================================================
-- 20260608000008 — cron de lembrete 24h
--
-- Habilita pg_cron + pg_net e agenda send-reminders de hora em hora.
-- A service role key vem do Vault (secret 'service_role_key'), cadastrado
-- manualmente uma vez:
--   select vault.create_secret('<SERVICE_ROLE_KEY>', 'service_role_key');
-- ============================================================================

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- (idempotente) remove agendamento anterior se existir
select cron.unschedule('send-reminders-hourly')
where exists (select 1 from cron.job where jobname = 'send-reminders-hourly');

select cron.schedule(
  'send-reminders-hourly',
  '0 * * * *',
  $$
  select net.http_post(
    url := 'https://tirvnwsiokivrswdthge.supabase.co/functions/v1/send-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || coalesce(
        (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key' limit 1),
        'missing'
      )
    ),
    body := '{}'::jsonb
  );
  $$
);
