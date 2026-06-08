-- ============================================================================
-- 20260608000003 — RPC dashboard_stats: KPIs agregados por tenant e período
--
-- Devolve um JSON com métricas operacionais. Security definer com check de
-- membership (qualquer membro do tenant pode ver o painel).
-- ============================================================================

create or replace function public.dashboard_stats(
  p_tenant_id uuid,
  p_days integer default 7
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  since timestamptz := now() - make_interval(days => greatest(p_days, 1));
  today_start timestamptz := date_trunc('day', now());
  result jsonb;
  v_conversations_period int;
  v_conversations_today int;
  v_messages_in int;
  v_messages_out int;
  v_lena_out int;
  v_operator_out int;
  v_needs_attention int;
  v_active_open int;
  v_cost_micro bigint;
  v_avg_response_seconds numeric;
  v_contacts_new int;
begin
  if not (public.is_tenant_member(p_tenant_id) or public.is_platform_admin()) then
    raise exception 'access denied' using errcode = 'P0001';
  end if;

  -- conversas com atividade no período (last_message_at dentro da janela)
  select count(*) into v_conversations_period
  from public.conversations
  where tenant_id = p_tenant_id
    and closed_at is null
    and coalesce(last_message_at, opened_at) >= since;

  -- conversas com atividade hoje
  select count(*) into v_conversations_today
  from public.conversations
  where tenant_id = p_tenant_id
    and coalesce(last_message_at, opened_at) >= today_start;

  -- mensagens no período
  select
    count(*) filter (where direction = 'in'),
    count(*) filter (where direction = 'out'),
    count(*) filter (where direction = 'out' and (meta->>'ai_model') is not null),
    count(*) filter (where direction = 'out' and (meta->>'sent_by') = 'operator')
  into v_messages_in, v_messages_out, v_lena_out, v_operator_out
  from public.messages
  where tenant_id = p_tenant_id
    and created_at >= since;

  -- conversas que precisam de atenção (humano assumiu ou pausada)
  select count(*) into v_needs_attention
  from public.conversations
  where tenant_id = p_tenant_id
    and closed_at is null
    and state in ('human', 'paused');

  -- conversas abertas total
  select count(*) into v_active_open
  from public.conversations
  where tenant_id = p_tenant_id
    and closed_at is null;

  -- custo de IA no período (micro-USD)
  select coalesce(sum(cost_micro_usd), 0) into v_cost_micro
  from public.ai_usage
  where tenant_id = p_tenant_id
    and occurred_at >= since;

  -- contatos novos no período
  select count(*) into v_contacts_new
  from public.contacts
  where tenant_id = p_tenant_id
    and created_at >= since;

  -- tempo médio de resposta da Lena: para cada mensagem out da Lena,
  -- a diferença até a última mensagem in anterior na mesma conversa.
  with paired as (
    select
      m.created_at as out_at,
      (
        select max(prev.created_at)
        from public.messages prev
        where prev.conversation_id = m.conversation_id
          and prev.direction = 'in'
          and prev.created_at < m.created_at
      ) as last_in_at
    from public.messages m
    where m.tenant_id = p_tenant_id
      and m.direction = 'out'
      and (m.meta->>'ai_model') is not null
      and m.created_at >= since
  )
  select avg(extract(epoch from (out_at - last_in_at)))
  into v_avg_response_seconds
  from paired
  where last_in_at is not null
    and out_at - last_in_at < interval '10 minutes';

  result := jsonb_build_object(
    'period_days', p_days,
    'conversations_period', v_conversations_period,
    'conversations_today', v_conversations_today,
    'messages_in', v_messages_in,
    'messages_out', v_messages_out,
    'lena_out', v_lena_out,
    'operator_out', v_operator_out,
    'needs_attention', v_needs_attention,
    'active_open', v_active_open,
    'contacts_new', v_contacts_new,
    'cost_micro_usd', v_cost_micro,
    'cost_brl_approx', round((v_cost_micro / 1000000.0) * 5.5, 2),
    'avg_response_seconds', round(coalesce(v_avg_response_seconds, 0)::numeric, 1)
  );

  return result;
end;
$$;

revoke execute on function public.dashboard_stats(uuid, integer) from public, anon;
grant execute on function public.dashboard_stats(uuid, integer) to authenticated;

comment on function public.dashboard_stats(uuid, integer) is
  'KPIs agregados do tenant para o painel. cost_brl_approx usa câmbio fixo 5.5; ajustar quando houver câmbio real.';
