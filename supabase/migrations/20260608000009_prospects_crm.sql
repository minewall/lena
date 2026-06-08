-- ============================================================================
-- 20260608000009 — CRM de prospecção da Averse (interno, fora do modelo tenant)
--
-- Substitui o board do monday.com (Lena — Prospecção). Leads = empresas
-- potenciais clientes da Lena, alimentadas pelo lead-generator (Places API).
-- NÃO é dado de tenant: RLS libera só para platform_admin (staff Averse).
-- ============================================================================

create type public.prospect_funil as enum
  ('novo', 'contatado', 'em_conversa', 'cliente', 'perdido');

create table public.prospects (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null,
  segmento    text not null,           -- rótulo legível: Petshop, Clínica Médica, ...
  funil       public.prospect_funil not null default 'novo',
  bairros     text,                    -- "Moema | Zona Sul"
  telefones   text[] not null default '{}',  -- fixos, dígitos normalizados c/ 55
  whatsapps   text[] not null default '{}',  -- celulares, dígitos normalizados c/ 55
  emails      text[] not null default '{}',
  website     text,
  instagram   text,
  facebook    text,
  linkedin    text,
  tiktok      text,
  fonte       text,
  coletado_em date,
  observacao  text,                    -- dados coletados (endereço, serviços)
  notas       text,                    -- anotações internas do funil de vendas
  -- Link clicável que abre o WhatsApp Web/app direto (sem tel:/FaceTime).
  whatsapp_url text generated always as (
    case when array_length(whatsapps, 1) >= 1
      then 'https://wa.me/' || regexp_replace(whatsapps[1], '[^0-9]', '', 'g')
      else null end
  ) stored,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.prospects is
  'CRM de prospecção interno da Averse (substitui board monday). RLS só platform_admin.';
comment on column public.prospects.whatsapp_url is
  'Gerado: https://wa.me/<1º whatsapp>. Abre WhatsApp direto, evita tel:/FaceTime.';

create index prospects_funil_idx    on public.prospects (funil);
create index prospects_segmento_idx on public.prospects (segmento);

create trigger prospects_touch_updated_at
  before update on public.prospects
  for each row execute function public.touch_updated_at();

-- ───────── RLS: exclusivo da Averse (platform_admin) ─────────
alter table public.prospects enable row level security;

create policy "prospects: platform admin full access"
  on public.prospects for all
  using (public.is_platform_admin())
  with check (public.is_platform_admin());
