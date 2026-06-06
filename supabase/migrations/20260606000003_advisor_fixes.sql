-- ============================================================================
-- 20260606000003 — fixes apontados pelo Supabase advisor após 0001+0002
--
-- 1. function_search_path_mutable em touch_updated_at  → set search_path
-- 2. SECURITY DEFINER funções helpers expostas a anon/authenticated via RPC
--    → revoke EXECUTE de quem não precisa chamar (helpers só são usados
--    pelas RLS policies internamente; handle_new_user é trigger; create_tenant
--    fica apenas para authenticated)
-- 3. auth_rls_initplan: policies chamam auth.uid() por linha
--    → trocar por (select auth.uid())
-- 4. multiple_permissive_policies em tenant_members SELECT
--    → separar a policy ALL em INSERT/UPDATE/DELETE distintas
-- ============================================================================

-- ───────── 1. search_path em touch_updated_at ─────────
alter function public.touch_updated_at() set search_path = public, pg_temp;

-- ───────── 2. revogar EXECUTE público das funções internas ─────────
revoke execute on function public.is_tenant_member(uuid) from public, anon, authenticated;
revoke execute on function public.is_tenant_admin(uuid) from public, anon, authenticated;
revoke execute on function public.is_platform_admin() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.create_tenant(text, text, text) from public, anon;
-- (authenticated mantém execute em create_tenant — é a RPC exposta para criar tenant)

-- ───────── 3. helpers com (select auth.uid()) + search_path ─────────
create or replace function public.is_tenant_member(t uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.tenant_members tm
    where tm.tenant_id = t
      and tm.user_id = (select auth.uid())
      and tm.accepted_at is not null
  );
$$;

create or replace function public.is_tenant_admin(t uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.tenant_members tm
    where tm.tenant_id = t
      and tm.user_id = (select auth.uid())
      and tm.role = 'admin'
      and tm.accepted_at is not null
  );
$$;

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.is_platform_admin = true
  );
$$;

-- Re-revogar após CREATE OR REPLACE (grants padrão voltam ao default)
revoke execute on function public.is_tenant_member(uuid) from public, anon, authenticated;
revoke execute on function public.is_tenant_admin(uuid) from public, anon, authenticated;
revoke execute on function public.is_platform_admin() from public, anon, authenticated;

-- ───────── 3. policies profiles com (select auth.uid()) ─────────
drop policy "profiles: self or platform admin read" on public.profiles;
create policy "profiles: self or platform admin read"
  on public.profiles for select
  using (id = (select auth.uid()) or public.is_platform_admin());

drop policy "profiles: self update" on public.profiles;
create policy "profiles: self update"
  on public.profiles for update
  using (id = (select auth.uid()))
  with check (
    id = (select auth.uid())
    and is_platform_admin = (
      select p.is_platform_admin from public.profiles p where p.id = (select auth.uid())
    )
  );

-- ───────── 4. tenant_members: quebrar ALL em INSERT/UPDATE/DELETE ─────────
drop policy "tenant_members: admin manage" on public.tenant_members;

create policy "tenant_members: admin insert"
  on public.tenant_members for insert
  with check (public.is_tenant_admin(tenant_id) or public.is_platform_admin());

create policy "tenant_members: admin update"
  on public.tenant_members for update
  using (public.is_tenant_admin(tenant_id) or public.is_platform_admin())
  with check (public.is_tenant_admin(tenant_id) or public.is_platform_admin());

create policy "tenant_members: admin delete"
  on public.tenant_members for delete
  using (public.is_tenant_admin(tenant_id) or public.is_platform_admin());
