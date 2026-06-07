-- ============================================================================
-- 20260607000002 — RLS para as tabelas do WhatsApp
-- ============================================================================

alter table public.tenant_secrets enable row level security;
alter table public.wa_numbers enable row level security;
alter table public.wa_templates enable row level security;
alter table public.webhook_events enable row level security;
alter table public.contacts enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

-- ───────── tenant_secrets — só service_role lê ─────────
-- Sem nenhuma policy permissive: por padrão, anon e authenticated não veem nada.
-- service_role (Edge Functions) bypassa RLS. Platform admin acessa via Edge Function.
-- Apenas uma policy de leitura para platform admin para emergência de suporte:
create policy "secrets: platform admin emergency read"
  on public.tenant_secrets for select
  using (public.is_platform_admin());

-- ───────── wa_numbers ─────────
create policy "wa_numbers: members or platform admin read"
  on public.wa_numbers for select
  using (public.is_tenant_member(tenant_id) or public.is_platform_admin());

create policy "wa_numbers: admin update"
  on public.wa_numbers for update
  using (public.is_tenant_admin(tenant_id) or public.is_platform_admin())
  with check (public.is_tenant_admin(tenant_id) or public.is_platform_admin());

-- INSERT/DELETE só via Edge Function com service_role.

-- ───────── wa_templates ─────────
create policy "wa_templates: members or platform admin read"
  on public.wa_templates for select
  using (public.is_tenant_member(tenant_id) or public.is_platform_admin());

create policy "wa_templates: admin insert"
  on public.wa_templates for insert
  with check (public.is_tenant_admin(tenant_id) or public.is_platform_admin());

create policy "wa_templates: admin update"
  on public.wa_templates for update
  using (public.is_tenant_admin(tenant_id) or public.is_platform_admin())
  with check (public.is_tenant_admin(tenant_id) or public.is_platform_admin());

create policy "wa_templates: admin delete"
  on public.wa_templates for delete
  using (public.is_tenant_admin(tenant_id) or public.is_platform_admin());

-- ───────── webhook_events ─────────
-- Leitura só por platform admin (debug). Escrita só via service_role.
create policy "webhook_events: platform admin read"
  on public.webhook_events for select
  using (public.is_platform_admin());

-- ───────── contacts ─────────
create policy "contacts: members or platform admin read"
  on public.contacts for select
  using (public.is_tenant_member(tenant_id) or public.is_platform_admin());

create policy "contacts: members update"
  on public.contacts for update
  using (public.is_tenant_member(tenant_id) or public.is_platform_admin())
  with check (public.is_tenant_member(tenant_id) or public.is_platform_admin());

-- INSERT vem via Edge Function (msg-processor); membros não criam contato à mão.

-- ───────── conversations ─────────
create policy "conversations: members or platform admin read"
  on public.conversations for select
  using (public.is_tenant_member(tenant_id) or public.is_platform_admin());

create policy "conversations: members update"
  on public.conversations for update
  using (public.is_tenant_member(tenant_id) or public.is_platform_admin())
  with check (public.is_tenant_member(tenant_id) or public.is_platform_admin());

-- INSERT vem via Edge Function.

-- ───────── messages ─────────
create policy "messages: members or platform admin read"
  on public.messages for select
  using (public.is_tenant_member(tenant_id) or public.is_platform_admin());

-- INSERT por membro só para mensagens outbound enviadas pelo operador via UI.
create policy "messages: members insert outbound"
  on public.messages for insert
  with check (
    (public.is_tenant_member(tenant_id) or public.is_platform_admin())
    and direction = 'out'
    and sent_by_user_id = (select auth.uid())
  );
