-- ============================================================================
-- 20260611160000 — Catálogo da Lena: categorias (2 níveis), serviços ricos
-- e combos.
--
-- Transforma "serviço = linha plana (nome/preço/duração)" em catálogo
-- estruturado que a Lena usa de verdade: agrupar por categoria, propor séries
-- de sessões, avisar preparos/pré-requisitos e ofertar combos. Tudo genérico
-- (salão, clínica, escola, oficina, petshop) — nada amarrado a um segmento.
--
-- Decisões (Roberto, 2026-06-11): catálogo primeiro; paralelismo simples
-- (nº simultâneos por serviço); multi-unidade vem na fase seguinte.
-- ============================================================================

-- 1) Categorias em 2 níveis ---------------------------------------------------
--    parent_id NULL  = categoria de 1º nível (ex.: "Tratamento capilar")
--    parent_id SET   = subcategoria de 2º nível (ex.: "Tingimento")
--    Subcategoria é opcional: um serviço pode pendurar direto no 1º nível.
create table public.tenant_service_categories (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  parent_id uuid references public.tenant_service_categories(id) on delete cascade,
  name text not null,
  position int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index tenant_service_categories_tenant_idx
  on public.tenant_service_categories (tenant_id, parent_id, position);

-- Garante no máximo 2 níveis e que o pai é do mesmo tenant.
create or replace function public.enforce_category_two_levels()
returns trigger
language plpgsql
set search_path to 'public', 'pg_temp'
as $$
declare
  parent_parent uuid;
  parent_tenant uuid;
begin
  if new.parent_id is not null then
    select parent_id, tenant_id
      into parent_parent, parent_tenant
      from public.tenant_service_categories
      where id = new.parent_id;
    if parent_tenant is distinct from new.tenant_id then
      raise exception 'categoria pai pertence a outro tenant';
    end if;
    if parent_parent is not null then
      raise exception 'categorias têm no máximo 2 níveis';
    end if;
  end if;
  return new;
end $$;

create trigger tenant_service_categories_two_levels
  before insert or update on public.tenant_service_categories
  for each row execute function public.enforce_category_two_levels();

create trigger tenant_service_categories_touch_updated_at
  before update on public.tenant_service_categories
  for each row execute function public.touch_updated_at();

alter table public.tenant_service_categories enable row level security;

create policy "categories: members or platform admin read"
  on public.tenant_service_categories for select
  using (is_tenant_member(tenant_id) or is_platform_admin());
create policy "categories: admin insert"
  on public.tenant_service_categories for insert
  with check (is_tenant_admin(tenant_id) or is_platform_admin());
create policy "categories: admin update"
  on public.tenant_service_categories for update
  using (is_tenant_admin(tenant_id) or is_platform_admin())
  with check (is_tenant_admin(tenant_id) or is_platform_admin());
create policy "categories: admin delete"
  on public.tenant_service_categories for delete
  using (is_tenant_admin(tenant_id) or is_platform_admin());

-- 2) Serviços ricos -----------------------------------------------------------
alter table public.tenant_services
  add column category_id uuid references public.tenant_service_categories(id) on delete set null,
  -- paralelismo simples: quantos desse serviço cabem ao mesmo tempo
  add column max_parallel int not null default 1,
  -- preparo / pré-requisito ANTES do atendimento (ex.: "não secar o cabelo",
  -- "sem álcool 24h antes"). A Lena avisa o cliente no agendamento.
  add column prep_instructions text,
  -- cuidados DEPOIS (ex.: "não lavar por 48h")
  add column aftercare_instructions text,
  -- tratamentos com série prevista: nº de sessões e intervalo recomendado.
  -- quando default_sessions > 1, a Lena já propõe a série inteira.
  add column default_sessions int not null default 1,
  add column session_interval_days int;

alter table public.tenant_services
  add constraint tenant_services_max_parallel_positive check (max_parallel >= 1),
  add constraint tenant_services_default_sessions_positive check (default_sessions >= 1);

create index tenant_services_category_idx
  on public.tenant_services (category_id);

-- 3) Combos -------------------------------------------------------------------
--    'pacote'      = bundle de preço fechado (ex.: "+Bela = R$ X, inclui A+B+C")
--    'condicional' = ao fechar o gatilho, a Lena oferta os itens com desconto
--                    (ex.: "fechou tingimento → unha com 20% off")
create type public.combo_kind as enum ('pacote', 'condicional');

create table public.tenant_combos (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  kind public.combo_kind not null,
  description text,
  -- pacote: preço fechado do combo
  price_cents int,
  -- condicional: desconto aplicado aos itens ofertados (0–100)
  discount_pct numeric(5,2),
  -- condicional: serviço-gatilho que dispara a oferta
  trigger_service_id uuid references public.tenant_services(id) on delete set null,
  active boolean not null default true,
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tenant_combos_discount_range
    check (discount_pct is null or (discount_pct >= 0 and discount_pct <= 100))
);
create index tenant_combos_tenant_idx on public.tenant_combos (tenant_id, position);

-- Serviços que compõem o pacote / são ofertados na condicional.
-- tenant_id denormalizado para RLS simples e consistente.
create table public.tenant_combo_items (
  id uuid primary key default gen_random_uuid(),
  combo_id uuid not null references public.tenant_combos(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  service_id uuid not null references public.tenant_services(id) on delete cascade,
  qty int not null default 1,
  position int not null default 0,
  constraint tenant_combo_items_qty_positive check (qty >= 1)
);
create index tenant_combo_items_combo_idx on public.tenant_combo_items (combo_id, position);

create trigger tenant_combos_touch_updated_at
  before update on public.tenant_combos
  for each row execute function public.touch_updated_at();

alter table public.tenant_combos enable row level security;
alter table public.tenant_combo_items enable row level security;

create policy "combos: members or platform admin read"
  on public.tenant_combos for select
  using (is_tenant_member(tenant_id) or is_platform_admin());
create policy "combos: admin insert"
  on public.tenant_combos for insert
  with check (is_tenant_admin(tenant_id) or is_platform_admin());
create policy "combos: admin update"
  on public.tenant_combos for update
  using (is_tenant_admin(tenant_id) or is_platform_admin())
  with check (is_tenant_admin(tenant_id) or is_platform_admin());
create policy "combos: admin delete"
  on public.tenant_combos for delete
  using (is_tenant_admin(tenant_id) or is_platform_admin());

create policy "combo_items: members or platform admin read"
  on public.tenant_combo_items for select
  using (is_tenant_member(tenant_id) or is_platform_admin());
create policy "combo_items: admin insert"
  on public.tenant_combo_items for insert
  with check (is_tenant_admin(tenant_id) or is_platform_admin());
create policy "combo_items: admin update"
  on public.tenant_combo_items for update
  using (is_tenant_admin(tenant_id) or is_platform_admin())
  with check (is_tenant_admin(tenant_id) or is_platform_admin());
create policy "combo_items: admin delete"
  on public.tenant_combo_items for delete
  using (is_tenant_admin(tenant_id) or is_platform_admin());
