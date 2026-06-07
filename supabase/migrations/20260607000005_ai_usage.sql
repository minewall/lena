-- ============================================================================
-- 20260607000005 — ai_usage: telemetria de chamadas IA por tenant
-- Custo em micro-USD para precisão (×1e6) — padrão herdado do Haile.
-- ============================================================================

create table public.ai_usage (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  conversation_id uuid references public.conversations (id) on delete set null,
  message_id uuid references public.messages (id) on delete set null,
  model text not null,
  input_tokens int not null default 0,
  output_tokens int not null default 0,
  cost_micro_usd bigint not null default 0,
  meta jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

comment on table public.ai_usage is
  'Telemetria de chamadas Anthropic por tenant. cost_micro_usd = USD × 1_000_000. INSERT só via service_role das Edge Functions.';

create index ai_usage_tenant_recent_idx on public.ai_usage (tenant_id, occurred_at desc);

alter table public.ai_usage enable row level security;

-- Members do tenant veem o próprio uso; platform admin vê tudo.
create policy "ai_usage: members or platform admin read"
  on public.ai_usage for select
  using (public.is_tenant_member(tenant_id) or public.is_platform_admin());

-- Sem policy de INSERT/UPDATE/DELETE permissive: gravação só via service_role
-- (Edge Function msg-processor).