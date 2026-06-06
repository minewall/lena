-- ============================================================================
-- 20260606000005 — RLS para tenant_brains, tenant_services, tenant_faqs
-- ============================================================================

alter table public.tenant_brains enable row level security;
alter table public.tenant_services enable row level security;
alter table public.tenant_faqs enable row level security;

-- ───────── tenant_brains ─────────
-- INSERT é feito apenas pelo trigger bootstrap_tenant_brain (security definer).
-- DELETE acompanha o cascade de tenants. Não há policy permissive para esses.

create policy "brains: members or platform admin read"
  on public.tenant_brains for select
  using (public.is_tenant_member(tenant_id) or public.is_platform_admin());

create policy "brains: admin update"
  on public.tenant_brains for update
  using (public.is_tenant_admin(tenant_id) or public.is_platform_admin())
  with check (public.is_tenant_admin(tenant_id) or public.is_platform_admin());

-- ───────── tenant_services ─────────
create policy "services: members or platform admin read"
  on public.tenant_services for select
  using (public.is_tenant_member(tenant_id) or public.is_platform_admin());

create policy "services: admin insert"
  on public.tenant_services for insert
  with check (public.is_tenant_admin(tenant_id) or public.is_platform_admin());

create policy "services: admin update"
  on public.tenant_services for update
  using (public.is_tenant_admin(tenant_id) or public.is_platform_admin())
  with check (public.is_tenant_admin(tenant_id) or public.is_platform_admin());

create policy "services: admin delete"
  on public.tenant_services for delete
  using (public.is_tenant_admin(tenant_id) or public.is_platform_admin());

-- ───────── tenant_faqs ─────────
create policy "faqs: members or platform admin read"
  on public.tenant_faqs for select
  using (public.is_tenant_member(tenant_id) or public.is_platform_admin());

create policy "faqs: admin insert"
  on public.tenant_faqs for insert
  with check (public.is_tenant_admin(tenant_id) or public.is_platform_admin());

create policy "faqs: admin update"
  on public.tenant_faqs for update
  using (public.is_tenant_admin(tenant_id) or public.is_platform_admin())
  with check (public.is_tenant_admin(tenant_id) or public.is_platform_admin());

create policy "faqs: admin delete"
  on public.tenant_faqs for delete
  using (public.is_tenant_admin(tenant_id) or public.is_platform_admin());
