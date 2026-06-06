-- ============================================================================
-- 20260606000002 — RLS, helpers e policies para profiles/tenants/tenant_members
-- ============================================================================

-- ───────── helpers ─────────
create or replace function public.is_tenant_member(t uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.tenant_members tm
    where tm.tenant_id = t
      and tm.user_id = auth.uid()
      and tm.accepted_at is not null
  );
$$;

create or replace function public.is_tenant_admin(t uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.tenant_members tm
    where tm.tenant_id = t
      and tm.user_id = auth.uid()
      and tm.role = 'admin'
      and tm.accepted_at is not null
  );
$$;

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.is_platform_admin = true
  );
$$;

-- ───────── RLS on ─────────
alter table public.profiles enable row level security;
alter table public.tenants enable row level security;
alter table public.tenant_members enable row level security;

-- ───────── profiles ─────────
create policy "profiles: self or platform admin read"
  on public.profiles for select
  using (id = auth.uid() or public.is_platform_admin());

create policy "profiles: self update"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid() and is_platform_admin = (select p.is_platform_admin from public.profiles p where p.id = auth.uid()));
-- Observação: usuário não pode promover a si mesmo a platform admin.
-- Mudanças desse flag são feitas só via service-role (super-admin Averse).

-- ───────── tenants ─────────
create policy "tenants: members or platform admin read"
  on public.tenants for select
  using (public.is_tenant_member(id) or public.is_platform_admin());

create policy "tenants: admin update"
  on public.tenants for update
  using (public.is_tenant_admin(id) or public.is_platform_admin());

-- Inserção de tenants é feita exclusivamente via RPC public.create_tenant
-- (security definer). Sem policy de INSERT direto, qualquer tentativa
-- de INSERT como usuário comum falha — só o RPC controlado entra.

-- ───────── tenant_members ─────────
create policy "tenant_members: members of tenant read"
  on public.tenant_members for select
  using (public.is_tenant_member(tenant_id) or public.is_platform_admin());

create policy "tenant_members: admin manage"
  on public.tenant_members for all
  using (public.is_tenant_admin(tenant_id) or public.is_platform_admin())
  with check (public.is_tenant_admin(tenant_id) or public.is_platform_admin());
