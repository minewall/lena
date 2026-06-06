-- ============================================================================
-- 20260606000001 — schema base: profiles, tenants, tenant_members
-- Multi-tenant via RLS por tenant_id. profiles é extensão 1:1 de auth.users.
-- ============================================================================

-- ───────── profiles ─────────
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  avatar_url text,
  is_platform_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is
  'Extensão 1:1 de auth.users. is_platform_admin = staff da Averse.';

-- ───────── tenants ─────────
create type public.tenant_status as enum ('active', 'paused', 'archived');

create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  segment text not null default 'escola',
  status public.tenant_status not null default 'active',
  timezone text not null default 'America/Sao_Paulo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

comment on table public.tenants is
  'Negócio cliente (escola, clínica, salão, petshop). Multi-tenant root.';

create index tenants_status_idx on public.tenants (status) where deleted_at is null;

-- ───────── tenant_members ─────────
create type public.tenant_role as enum ('admin', 'operador');

create table public.tenant_members (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.tenant_role not null default 'admin',
  invited_at timestamptz not null default now(),
  accepted_at timestamptz,
  unique (tenant_id, user_id)
);

comment on table public.tenant_members is
  'Associa profiles a tenants com papel. accepted_at null = convite pendente.';

create index tenant_members_user_idx on public.tenant_members (user_id) where accepted_at is not null;

-- ───────── updated_at trigger ─────────
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

create trigger tenants_touch_updated_at
  before update on public.tenants
  for each row execute function public.touch_updated_at();

-- ───────── novo auth.user → cria profile ─────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ───────── RPC: create_tenant (cria o tenant e adiciona o caller como admin) ─────────
create or replace function public.create_tenant(
  p_name text,
  p_slug text,
  p_segment text default 'escola'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_tenant_id uuid;
begin
  if auth.uid() is null then
    raise exception 'must be authenticated' using errcode = 'P0001';
  end if;

  insert into public.tenants (name, slug, segment)
  values (p_name, p_slug, p_segment)
  returning id into new_tenant_id;

  insert into public.tenant_members (tenant_id, user_id, role, accepted_at)
  values (new_tenant_id, auth.uid(), 'admin', now());

  return new_tenant_id;
end;
$$;

comment on function public.create_tenant(text, text, text) is
  'Cria um tenant e adiciona o usuário autenticado como admin com accepted_at agora.';
