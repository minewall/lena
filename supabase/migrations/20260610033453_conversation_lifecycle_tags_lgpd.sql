-- ============================================================================
-- Conversas: ciclo de vida + tags + LGPD
--
-- Eixos separados: state (quem atende: lena/human/paused) é ortogonal ao
-- lifecycle (open/resolved/archived). Resolvida é reversível — mensagem
-- inbound reabre via trigger. Arquivar organiza, não apaga; retenção LGPD
-- é política separada (transcript 24m / registro mínimo 5a — CDC art. 27),
-- a eliminação automática NÃO está agendada aqui de propósito.
-- Housekeeping (pg_cron, hora em hora): auto-resolve 48h sem mensagem,
-- auto-arquiva 30d resolvida.
-- ============================================================================

create type public.conversation_lifecycle as enum ('open', 'resolved', 'archived');

alter table public.conversations
  add column lifecycle public.conversation_lifecycle not null default 'open',
  add column resolved_at timestamptz,
  add column archived_at timestamptz;

update public.conversations
   set lifecycle = 'resolved', resolved_at = closed_at
 where closed_at is not null;

create index conversations_lifecycle_idx
  on public.conversations (tenant_id, lifecycle, last_message_at desc);

create table public.tenant_tags (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  color text not null default '#897866',
  created_at timestamptz not null default now(),
  unique (tenant_id, name)
);

create table public.conversation_tags (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  tag_id uuid not null references public.tenant_tags(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (conversation_id, tag_id)
);

alter table public.tenant_tags enable row level security;
alter table public.conversation_tags enable row level security;

create policy "tenant_tags: members all" on public.tenant_tags
  for all
  using (is_tenant_member(tenant_id) or is_platform_admin())
  with check (is_tenant_member(tenant_id) or is_platform_admin());

create policy "conversation_tags: members all" on public.conversation_tags
  for all
  using (exists (
    select 1 from public.conversations c
     where c.id = conversation_id
       and (is_tenant_member(c.tenant_id) or is_platform_admin())
  ))
  with check (exists (
    select 1 from public.conversations c
     where c.id = conversation_id
       and (is_tenant_member(c.tenant_id) or is_platform_admin())
  ));

create table public.lgpd_requests (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete set null,
  kind text not null check (kind in ('acesso', 'eliminacao', 'correcao', 'portabilidade')),
  status text not null default 'aberta' check (status in ('aberta', 'em_andamento', 'concluida', 'negada')),
  notes text,
  requested_at timestamptz not null default now(),
  completed_at timestamptz
);

alter table public.lgpd_requests enable row level security;

create policy "lgpd_requests: members all" on public.lgpd_requests
  for all
  using (is_tenant_member(tenant_id) or is_platform_admin())
  with check (is_tenant_member(tenant_id) or is_platform_admin());

create or replace function public.reopen_conversation_on_inbound()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.direction = 'in' then
    update public.conversations
       set lifecycle = 'open', resolved_at = null, archived_at = null, closed_at = null
     where id = new.conversation_id
       and lifecycle <> 'open';
  end if;
  return new;
end;
$$;

create trigger messages_reopen_conversation
  after insert on public.messages
  for each row execute function public.reopen_conversation_on_inbound();

create or replace function public.conversation_housekeeping()
returns void
language sql
security definer
set search_path = public
as $$
  update public.conversations
     set lifecycle = 'resolved', resolved_at = now()
   where lifecycle = 'open'
     and last_message_at < now() - interval '48 hours';

  update public.conversations
     set lifecycle = 'archived', archived_at = now()
   where lifecycle = 'resolved'
     and resolved_at < now() - interval '30 days';
$$;

select cron.schedule(
  'conversation-housekeeping',
  '17 * * * *',
  $$select public.conversation_housekeeping()$$
);
