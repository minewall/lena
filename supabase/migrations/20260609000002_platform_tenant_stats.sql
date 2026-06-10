-- ============================================================================
-- 20260609000002 — RPC para stats agregadas de todos os tenants
-- Usada pela visão Averse (/averse/tenants). security definer para bypassar
-- RLS cross-tenant; is_platform_admin() garante que só a Averse acessa.
-- ============================================================================

create or replace function public.platform_tenant_stats(p_days int default 30)
returns table (
  tenant_id        uuid,
  last_message_at  timestamptz,
  messages_30d     bigint,
  conversations_30d bigint,
  cost_micro_usd_30d bigint
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    t.id,
    (select max(c.last_message_at)
       from public.conversations c
      where c.tenant_id = t.id)                                                       as last_message_at,
    coalesce(
      (select count(*)
         from public.messages m
        where m.tenant_id = t.id
          and m.created_at >= now() - (p_days || ' days')::interval), 0)              as messages_30d,
    coalesce(
      (select count(*)
         from public.conversations cv
        where cv.tenant_id = t.id
          and cv.last_message_at >= now() - (p_days || ' days')::interval), 0)        as conversations_30d,
    coalesce(
      (select sum(a.cost_micro_usd)
         from public.ai_usage a
        where a.tenant_id = t.id
          and a.occurred_at >= now() - (p_days || ' days')::interval), 0)             as cost_micro_usd_30d
  from public.tenants t
  where t.deleted_at is null
    and public.is_platform_admin()
  order by last_message_at desc nulls last
$$;

revoke execute on function public.platform_tenant_stats(int) from public, anon;
grant execute on function public.platform_tenant_stats(int) to authenticated;
