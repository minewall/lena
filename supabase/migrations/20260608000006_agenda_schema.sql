-- ============================================================================
-- 20260608000006 — agenda própria da Lena
--
-- tenant_availability: regras de disponibilidade por dia da semana.
-- appointments: agendamentos, com EXCLUSION constraint anti dupla marcação.
-- ============================================================================

create extension if not exists btree_gist;

create type public.appointment_status as enum (
  'booked',     -- marcado
  'confirmed',  -- confirmado pelo cliente
  'cancelled',  -- cancelado
  'no_show',    -- não compareceu
  'done'        -- atendido
);

create type public.appointment_origin as enum ('lena', 'operador', 'externo');

-- ───────── tenant_availability ─────────
create table public.tenant_availability (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  weekday int not null check (weekday between 0 and 6),  -- 0=domingo
  start_minute int not null check (start_minute between 0 and 1439),
  end_minute int not null check (end_minute between 1 and 1440),
  slot_minutes int not null default 60 check (slot_minutes between 5 and 480),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  check (end_minute > start_minute)
);

comment on table public.tenant_availability is
  'Janelas de atendimento por dia da semana. A Lena gera slots a partir disto.';

create index tenant_availability_idx
  on public.tenant_availability (tenant_id, weekday)
  where active;

-- ───────── appointments ─────────
create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  contact_id uuid references public.contacts (id) on delete set null,
  service_id uuid references public.tenant_services (id) on delete set null,
  conversation_id uuid references public.conversations (id) on delete set null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status public.appointment_status not null default 'booked',
  origin public.appointment_origin not null default 'lena',
  customer_name text,
  notes text,
  reminder_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

comment on table public.appointments is
  'Agendamentos. EXCLUSION constraint impede dois agendamentos ativos sobrepostos no mesmo tenant.';

create trigger appointments_touch_updated_at
  before update on public.appointments
  for each row execute function public.touch_updated_at();

-- anti dupla marcação: nenhum par de agendamentos ATIVOS (não cancelado/no_show)
-- do mesmo tenant pode ter horários sobrepostos.
alter table public.appointments
  add constraint appointments_no_overlap
  exclude using gist (
    tenant_id with =,
    tstzrange(starts_at, ends_at) with &&
  )
  where (status in ('booked', 'confirmed', 'done'));

create index appointments_tenant_upcoming_idx
  on public.appointments (tenant_id, starts_at)
  where status in ('booked', 'confirmed');

create index appointments_reminder_idx
  on public.appointments (starts_at)
  where status in ('booked', 'confirmed') and reminder_sent_at is null;

-- ───────── RLS ─────────
alter table public.tenant_availability enable row level security;
alter table public.appointments enable row level security;

create policy "availability: members read"
  on public.tenant_availability for select
  using (public.is_tenant_member(tenant_id) or public.is_platform_admin());

create policy "availability: admin insert"
  on public.tenant_availability for insert
  with check (public.is_tenant_admin(tenant_id) or public.is_platform_admin());

create policy "availability: admin update"
  on public.tenant_availability for update
  using (public.is_tenant_admin(tenant_id) or public.is_platform_admin())
  with check (public.is_tenant_admin(tenant_id) or public.is_platform_admin());

create policy "availability: admin delete"
  on public.tenant_availability for delete
  using (public.is_tenant_admin(tenant_id) or public.is_platform_admin());

create policy "appointments: members read"
  on public.appointments for select
  using (public.is_tenant_member(tenant_id) or public.is_platform_admin());

create policy "appointments: members insert"
  on public.appointments for insert
  with check (public.is_tenant_member(tenant_id) or public.is_platform_admin());

create policy "appointments: members update"
  on public.appointments for update
  using (public.is_tenant_member(tenant_id) or public.is_platform_admin())
  with check (public.is_tenant_member(tenant_id) or public.is_platform_admin());
