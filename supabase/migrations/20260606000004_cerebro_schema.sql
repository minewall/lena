-- ============================================================================
-- 20260606000004 — cérebro da Lena: tenant_brains, tenant_services, tenant_faqs
--
-- 1:1 entre tenant e tenant_brains (PK compartilhada).
-- Trigger after insert em tenants cria brain default por segmento.
-- ============================================================================

create type public.tenant_tone as enum ('Acolhedor', 'Profissional', 'Descontraído');

-- ───────── tenant_brains ─────────
create table public.tenant_brains (
  tenant_id uuid primary key references public.tenants (id) on delete cascade,
  business_name text not null,
  segment text not null,
  hours text,
  address text,
  payments jsonb not null default '[]'::jsonb,
  convenios jsonb not null default '[]'::jsonb,
  promo text,
  extras text,
  tone public.tenant_tone not null default 'Acolhedor',
  escalation_rules jsonb not null default '{}'::jsonb,
  version int not null default 1,
  updated_at timestamptz not null default now()
);

comment on table public.tenant_brains is
  '1:1 com tenants. Configuração consumida pelo prompt-builder para a Lena.';

create trigger tenant_brains_touch_updated_at
  before update on public.tenant_brains
  for each row execute function public.touch_updated_at();

-- ───────── tenant_services ─────────
create table public.tenant_services (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  name text not null,
  description text,
  price_cents integer,
  duration_min integer,
  is_upsell boolean not null default false,
  position integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.tenant_services is
  'Catálogo de serviços ofertados. is_upsell marca itens para upsell pós-agendamento.';

create index tenant_services_tenant_idx
  on public.tenant_services (tenant_id, position)
  where active;

create trigger tenant_services_touch_updated_at
  before update on public.tenant_services
  for each row execute function public.touch_updated_at();

-- ───────── tenant_faqs ─────────
create table public.tenant_faqs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  question text not null,
  answer text not null,
  tags text[] not null default '{}',
  position integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.tenant_faqs is
  'FAQ que alimenta a Lena. tags permite categorização (ex.: preços, horários).';

create index tenant_faqs_tenant_idx
  on public.tenant_faqs (tenant_id, position)
  where active;

create trigger tenant_faqs_touch_updated_at
  before update on public.tenant_faqs
  for each row execute function public.touch_updated_at();

-- ───────── trigger: bootstrap_brain após insert em tenants ─────────
create or replace function public.bootstrap_tenant_brain()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  default_hours text;
  default_extras text;
begin
  default_hours := case new.segment
    when 'escola' then 'segunda a sexta, das 8h às 17h30'
    when 'clinica' then 'segunda a sexta, das 9h às 19h; sábados, das 9h às 13h'
    when 'salao' then 'terça a sábado, das 10h às 19h'
    when 'petshop' then 'segunda a sábado, das 9h às 19h'
    else null
  end;

  default_extras := case new.segment
    when 'escola' then 'Para visita: pergunte o nome do responsável, a idade da criança e a série pretendida antes de oferecer horários.'
    else null
  end;

  insert into public.tenant_brains (tenant_id, business_name, segment, hours, extras, tone)
  values (new.id, new.name, new.segment, default_hours, default_extras, 'Acolhedor'::public.tenant_tone)
  on conflict (tenant_id) do nothing;

  return new;
end;
$$;

revoke execute on function public.bootstrap_tenant_brain() from public, anon, authenticated;

create trigger tenants_bootstrap_brain
  after insert on public.tenants
  for each row execute function public.bootstrap_tenant_brain();
