-- ============================================================================
-- 20260607000001 — WhatsApp: tenant_secrets, wa_numbers, wa_templates,
-- webhook_events, contacts, conversations, messages
--
-- Multi-tenant via tenant_id; tenant_secrets é a única tabela onde nenhum
-- role além de service_role lê (tokens da Meta moram lá).
-- ============================================================================

-- ───────── enums ─────────
create type public.wa_number_status as enum (
  'connected',     -- número plugado, recebendo
  'pending',       -- aguardando handshake/aprovação
  'disconnected'   -- desligado pelo admin ou pela Meta
);

create type public.wa_quality_rating as enum (
  'unknown',
  'green',
  'yellow',
  'red'
);

create type public.wa_template_status as enum (
  'draft',
  'submitted',
  'approved',
  'rejected',
  'paused',
  'disabled'
);

create type public.wa_template_category as enum (
  'utility',
  'authentication',
  'marketing'
);

create type public.message_direction as enum ('in', 'out');

create type public.message_kind as enum (
  'text',
  'image',
  'audio',
  'video',
  'document',
  'sticker',
  'location',
  'contact',
  'template',
  'system'
);

create type public.conversation_state as enum (
  'lena',     -- Lena (IA) responde
  'human',    -- operador assumiu
  'paused'    -- ninguém responde (handoff pendente, fora do horário, etc.)
);

create type public.webhook_event_source as enum (
  'whatsapp',
  'asaas',
  'gcal',
  'other'
);

create type public.webhook_event_status as enum (
  'received',   -- na fila
  'processed',  -- processado com sucesso
  'failed'      -- falhou; aguarda retry manual
);

-- ───────── tenant_secrets ─────────
create table public.tenant_secrets (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  kind text not null,            -- 'wa', 'gcal', 'psp', ...
  value text not null,           -- token plaintext por ora; cifrar em pós-MVP
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, kind)
);

comment on table public.tenant_secrets is
  'Tokens e segredos por tenant. RLS bloqueia leitura por anon/authenticated; só service_role das Edge Functions lê. TODO pós-MVP: cifra simétrica com chave em vault.';

create trigger tenant_secrets_touch_updated_at
  before update on public.tenant_secrets
  for each row execute function public.touch_updated_at();

-- ───────── wa_numbers ─────────
create table public.wa_numbers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  phone_e164 text not null,                  -- ex.: '+5511999999999'
  display_name text,                          -- nome aprovado pela Meta
  phone_number_id text not null,              -- ID da Meta (numérico/string)
  waba_id text not null,
  provider text not null default 'meta_cloud',-- 'meta_cloud' | '360dialog'
  status public.wa_number_status not null default 'pending',
  quality_rating public.wa_quality_rating not null default 'unknown',
  messaging_limit text,                       -- ex.: '1k_per_day'
  last_health_check timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (phone_number_id),
  unique (tenant_id)                          -- 1 número por tenant no MVP
);

comment on table public.wa_numbers is
  'Número WhatsApp por tenant. Sem secrets aqui — só metadados visíveis no painel do admin.';

create trigger wa_numbers_touch_updated_at
  before update on public.wa_numbers
  for each row execute function public.touch_updated_at();

-- ───────── wa_templates ─────────
create table public.wa_templates (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  name text not null,
  language text not null default 'pt_BR',
  category public.wa_template_category not null default 'utility',
  body text not null,
  variables text[] not null default '{}',
  meta_template_id text,                      -- ID retornado pela Meta após aprovação
  status public.wa_template_status not null default 'draft',
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, name, language)
);

create trigger wa_templates_touch_updated_at
  before update on public.wa_templates
  for each row execute function public.touch_updated_at();

-- ───────── webhook_events ─────────
create table public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  source public.webhook_event_source not null,
  external_id text not null,                  -- wa_message_id, asaas_event_id, etc.
  tenant_id uuid references public.tenants (id) on delete cascade,
  payload jsonb not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  status public.webhook_event_status not null default 'received',
  error text,
  unique (source, external_id)
);

comment on table public.webhook_events is
  'Append-only. UNIQUE(source, external_id) garante idempotência: retries da Meta caem na 2ª inserção sem reprocessar.';

create index webhook_events_unprocessed_idx
  on public.webhook_events (received_at)
  where status = 'received';

-- ───────── contacts ─────────
create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  phone_e164 text not null,
  name text,
  tags text[] not null default '{}',
  opted_out boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, phone_e164)
);

create trigger contacts_touch_updated_at
  before update on public.contacts
  for each row execute function public.touch_updated_at();

-- ───────── conversations ─────────
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  contact_id uuid not null references public.contacts (id) on delete cascade,
  channel text not null default 'whatsapp',
  state public.conversation_state not null default 'lena',
  assigned_to uuid references public.profiles (id) on delete set null,
  last_message_at timestamptz,
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  unique (tenant_id, contact_id, channel)   -- 1 conversa por contato/canal
);

create index conversations_inbox_idx
  on public.conversations (tenant_id, last_message_at desc)
  where closed_at is null;

-- ───────── messages ─────────
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  direction public.message_direction not null,
  kind public.message_kind not null default 'text',
  body text,
  wa_message_id text,                         -- id da mensagem na Meta
  meta jsonb not null default '{}'::jsonb,    -- template_name, ai_model, tool_calls, etc.
  sent_by_user_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index messages_conversation_idx
  on public.messages (conversation_id, created_at desc);

create index messages_tenant_recent_idx
  on public.messages (tenant_id, created_at desc);

-- ───────── trigger: atualiza conversations.last_message_at ─────────
create or replace function public.touch_conversation_on_message()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.conversations
     set last_message_at = new.created_at
   where id = new.conversation_id
     and (last_message_at is null or last_message_at < new.created_at);
  return new;
end;
$$;

revoke execute on function public.touch_conversation_on_message() from public, anon, authenticated;

create trigger messages_touch_conversation
  after insert on public.messages
  for each row execute function public.touch_conversation_on_message();
