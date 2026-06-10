-- ============================================================================
-- Fundação dos indicadores de atendimento (decisão Roberto 2026-06-10):
--   1. Sentimento por conversa  → coluna sentiment, classificada por Haiku
--   2. Trocas até o desfecho    → view conversation_effort (SQL puro)
--   3. Funil hora × tipo        → coluna intent + view attendance_funnel
--
-- Classificação: pg_cron (15 min) despacha conversas resolvidas/arquivadas
-- ainda não classificadas para a edge function classify-conversation, que
-- chama Haiku UMA vez extraindo sentimento + tipo juntos (~R$0,005/conversa).
-- ============================================================================

alter table public.conversations
  add column sentiment text
    check (sentiment in ('positivo', 'neutro', 'negativo')),
  add column intent text
    check (intent in ('agendamento', 'remarcacao_cancelamento', 'preco_planos',
                      'duvida_info', 'reclamacao', 'outro')),
  add column classified_at timestamptz;

create index conversations_classify_idx
  on public.conversations (lifecycle)
  where classified_at is null;

-- ── Métrica 2: trocas de mensagens até o desfecho ──────────────────────────
-- Desfecho por prioridade: agendamento > transferência p/ humano > finalizada.
-- security_invoker: RLS de conversations/messages vale para quem consulta.
create view public.conversation_effort
with (security_invoker = true) as
select
  c.id,
  c.tenant_id,
  c.opened_at,
  c.sentiment,
  c.intent,
  case
    when exists (select 1 from public.appointments a where a.conversation_id = c.id)
      then 'agendamento'
    when c.state in ('human', 'paused') then 'transferencia'
    when c.lifecycle in ('resolved', 'archived') then 'finalizada'
    else 'em_andamento'
  end as desfecho,
  (
    select count(*)
      from public.messages m
     where m.conversation_id = c.id
       and m.created_at <= coalesce(
         (select min(a.created_at) from public.appointments a
           where a.conversation_id = c.id),
         c.resolved_at,
         now())
  ) as trocas_ate_desfecho
from public.conversations c;

-- ── Métrica 3: funil hora local × tipo de solicitação ──────────────────────
create view public.attendance_funnel
with (security_invoker = true) as
select
  c.tenant_id,
  extract(hour from c.opened_at at time zone coalesce(t.timezone, 'America/Sao_Paulo'))::int as hora_local,
  coalesce(c.intent, 'nao_classificado') as tipo,
  count(*) as conversas,
  count(*) filter (where ce.desfecho = 'agendamento') as agendamentos,
  count(*) filter (where ce.desfecho = 'transferencia') as transferencias
from public.conversations c
join public.tenants t on t.id = c.tenant_id
join public.conversation_effort ce on ce.id = c.id
group by 1, 2, 3;

-- ── Despacho da classificação ───────────────────────────────────────────────
create or replace function public.dispatch_conversation_classification()
returns void
language plpgsql
security definer
set search_path = public, vault, net
as $$
declare
  v_key text;
  v_conv record;
begin
  select decrypted_secret into v_key
    from vault.decrypted_secrets where name = 'service_role_key' limit 1;
  if v_key is null then
    raise warning 'classifier: service_role_key ausente no vault';
    return;
  end if;

  for v_conv in
    select c.id from public.conversations c
     where c.lifecycle in ('resolved', 'archived')
       and c.classified_at is null
       and (select count(*) from public.messages m
             where m.conversation_id = c.id and m.kind = 'text') >= 2
     order by c.resolved_at nulls last
     limit 20
  loop
    perform net.http_post(
      url := 'https://tirvnwsiokivrswdthge.supabase.co/functions/v1/classify-conversation',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || v_key,
        'apikey', v_key
      ),
      body := jsonb_build_object('conversation_id', v_conv.id)
    );
  end loop;
end;
$$;

select cron.schedule(
  'conversation-classifier',
  '7,22,37,52 * * * *',
  $$select public.dispatch_conversation_classification()$$
);
