-- ============================================================================
-- 20260611170000 — Unidades (multi) com amenities estruturados.
--
-- O negócio pode ter mais de uma unidade. Cada uma tem endereço, andar,
-- estacionamento, capacidade e uma lista flexível de comodidades (amenities)
-- que a Lena usa para responder "onde vocês ficam / o que tem aí". Genérico:
-- clínica, salão, escola, oficina — todo negócio tem um lugar físico.
--
-- Decisão (Roberto, 2026-06-11): multi-unidade desde já. Migra os campos de
-- local de tenant_brains (address/parking/landmark) para uma unidade primária.
-- ============================================================================

create table public.tenant_units (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  is_primary boolean not null default false,
  address text,
  floor text,                 -- ex.: "Térreo", "3º andar"
  landmark text,              -- ponto de referência
  parking text,               -- detalhe livre (tem? pago? manobrista? conveniado?)
  capacity int,               -- atendimentos simultâneos totais na unidade
  -- comodidades como flags flexíveis: { ac: true, wifi: true, ... }
  amenities jsonb not null default '{}'::jsonb,
  notes text,
  active boolean not null default true,
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index tenant_units_tenant_idx on public.tenant_units (tenant_id, position);
-- no máximo uma unidade primária por tenant
create unique index tenant_units_one_primary
  on public.tenant_units (tenant_id) where is_primary;

create trigger tenant_units_touch_updated_at
  before update on public.tenant_units
  for each row execute function public.touch_updated_at();

alter table public.tenant_units enable row level security;

create policy "units: members or platform admin read"
  on public.tenant_units for select
  using (is_tenant_member(tenant_id) or is_platform_admin());
create policy "units: admin insert"
  on public.tenant_units for insert
  with check (is_tenant_admin(tenant_id) or is_platform_admin());
create policy "units: admin update"
  on public.tenant_units for update
  using (is_tenant_admin(tenant_id) or is_platform_admin())
  with check (is_tenant_admin(tenant_id) or is_platform_admin());
create policy "units: admin delete"
  on public.tenant_units for delete
  using (is_tenant_admin(tenant_id) or is_platform_admin());

-- Semeia a unidade primária de cada tenant a partir do cérebro.
insert into public.tenant_units (tenant_id, name, is_primary, address, parking, landmark, position)
select b.tenant_id,
       coalesce(nullif(btrim(b.business_name), ''), 'Unidade principal'),
       true, b.address, b.parking, b.landmark, 0
from public.tenant_brains b;
