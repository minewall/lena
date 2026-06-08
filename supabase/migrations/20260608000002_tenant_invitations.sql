-- ============================================================================
-- 20260608000002 — tenant_invitations + RPCs de convite/aceite
--
-- Fluxo: admin chama invite_member(email, role) → INSERT em
-- tenant_invitations (pending). Convidado se loga na Central com o mesmo
-- email; após login, o front chama accept_my_invitations() que percorre
-- pendentes e cria tenant_members + marca a invitation como aceita.
-- ============================================================================

create type public.invitation_status as enum ('pending', 'accepted', 'revoked');

create table public.tenant_invitations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  email text not null,
  role public.tenant_role not null default 'operador',
  status public.invitation_status not null default 'pending',
  invited_by uuid references public.profiles (id) on delete set null,
  invited_at timestamptz not null default now(),
  accepted_at timestamptz
);

-- normaliza email pra lowercase
create or replace function public.normalize_invitation_email()
returns trigger
language plpgsql
as $$
begin
  new.email = lower(trim(new.email));
  return new;
end;
$$;

create trigger tenant_invitations_normalize
  before insert or update of email on public.tenant_invitations
  for each row execute function public.normalize_invitation_email();

-- só um convite pending por (tenant, email)
create unique index tenant_invitations_unique_pending
  on public.tenant_invitations (tenant_id, email)
  where status = 'pending';

create index tenant_invitations_by_email_pending
  on public.tenant_invitations (email)
  where status = 'pending';

alter table public.tenant_invitations enable row level security;

-- admin do tenant vê e gerencia seus convites
create policy "invitations: admin read"
  on public.tenant_invitations for select
  using (public.is_tenant_admin(tenant_id) or public.is_platform_admin());

create policy "invitations: admin update"
  on public.tenant_invitations for update
  using (public.is_tenant_admin(tenant_id) or public.is_platform_admin())
  with check (public.is_tenant_admin(tenant_id) or public.is_platform_admin());

-- INSERT só via RPC invite_member (security definer)
-- DELETE não exposto (status='revoked' faz papel de soft-delete)

-- ───────── RPC: invite_member ─────────
create or replace function public.invite_member(
  p_tenant_id uuid,
  p_email text,
  p_role public.tenant_role default 'operador'
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  new_id uuid;
  caller_id uuid := (select auth.uid());
begin
  if caller_id is null then
    raise exception 'must be authenticated' using errcode = 'P0001';
  end if;

  if not (public.is_tenant_admin(p_tenant_id) or public.is_platform_admin()) then
    raise exception 'only tenant admin can invite' using errcode = 'P0001';
  end if;

  -- se já existe pending, retorna o id existente (idempotência)
  select id into new_id
  from public.tenant_invitations
  where tenant_id = p_tenant_id
    and email = lower(trim(p_email))
    and status = 'pending'
  limit 1;

  if new_id is not null then
    return new_id;
  end if;

  insert into public.tenant_invitations (tenant_id, email, role, invited_by)
  values (p_tenant_id, p_email, p_role, caller_id)
  returning id into new_id;

  return new_id;
end;
$$;

revoke execute on function public.invite_member(uuid, text, public.tenant_role)
  from public, anon;

comment on function public.invite_member(uuid, text, public.tenant_role) is
  'Admin do tenant convida um e-mail com role. Idempotente.';

-- ───────── RPC: accept_my_invitations ─────────
-- Chamada pelo front após login. Pega convites pendentes do e-mail
-- do usuário autenticado e cria tenant_members.
create or replace function public.accept_my_invitations()
returns table (tenant_id uuid, role public.tenant_role)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  caller_id uuid := (select auth.uid());
  caller_email text := lower(trim((select email from auth.users where id = caller_id)));
begin
  if caller_id is null or caller_email is null then
    raise exception 'must be authenticated' using errcode = 'P0001';
  end if;

  -- cria tenant_members para cada invitation pendente
  insert into public.tenant_members (tenant_id, user_id, role, accepted_at)
  select inv.tenant_id, caller_id, inv.role, now()
  from public.tenant_invitations inv
  where inv.email = caller_email
    and inv.status = 'pending'
  on conflict (tenant_id, user_id) do nothing;

  -- marca invitations como aceitas
  update public.tenant_invitations
  set status = 'accepted', accepted_at = now()
  where email = caller_email
    and status = 'pending';

  -- retorna tenants em que o user agora está
  return query
  select tm.tenant_id, tm.role
  from public.tenant_members tm
  where tm.user_id = caller_id
    and tm.accepted_at is not null;
end;
$$;

revoke execute on function public.accept_my_invitations() from public, anon;
grant execute on function public.accept_my_invitations() to authenticated;

comment on function public.accept_my_invitations() is
  'Chamada pelo front após login. Aceita todos os convites pendentes do email do usuário e retorna os tenants.';

-- ───────── RPC: revoke_invitation ─────────
create or replace function public.revoke_invitation(p_invitation_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  inv record;
begin
  select * into inv from public.tenant_invitations where id = p_invitation_id;
  if inv is null then
    raise exception 'invitation not found' using errcode = 'P0001';
  end if;
  if not (public.is_tenant_admin(inv.tenant_id) or public.is_platform_admin()) then
    raise exception 'access denied' using errcode = 'P0001';
  end if;
  update public.tenant_invitations
  set status = 'revoked'
  where id = p_invitation_id;
end;
$$;

revoke execute on function public.revoke_invitation(uuid) from public, anon;
grant execute on function public.revoke_invitation(uuid) to authenticated;

-- ───────── RPC: list_tenant_members (admin vê emails) ─────────
-- A consulta direta de tenant_members + profiles não traz email (profiles
-- não tem). Esta RPC junta com auth.users para o admin ver quem é cada
-- membro.
create or replace function public.list_tenant_members(p_tenant_id uuid)
returns table (
  user_id uuid,
  email text,
  full_name text,
  role public.tenant_role,
  accepted_at timestamptz,
  invited_at timestamptz
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not (public.is_tenant_admin(p_tenant_id) or public.is_platform_admin()) then
    raise exception 'access denied' using errcode = 'P0001';
  end if;

  return query
  select
    tm.user_id,
    u.email::text as email,
    p.full_name,
    tm.role,
    tm.accepted_at,
    tm.invited_at
  from public.tenant_members tm
  join auth.users u on u.id = tm.user_id
  left join public.profiles p on p.id = tm.user_id
  where tm.tenant_id = p_tenant_id
  order by tm.invited_at asc;
end;
$$;

revoke execute on function public.list_tenant_members(uuid) from public, anon;
grant execute on function public.list_tenant_members(uuid) to authenticated;
