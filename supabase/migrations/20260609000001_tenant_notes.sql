-- ============================================================================
-- 20260609000001 — notas de relacionamento da Averse com cada tenant
-- Usado pela visão platform_admin para registrar interações com clientes.
-- ============================================================================
create table public.tenant_notes (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references public.tenants (id) on delete cascade,
  author_id  uuid references public.profiles (id) on delete set null,
  body       text not null,
  created_at timestamptz not null default now()
);

comment on table public.tenant_notes is
  'Notas internas da Averse sobre o tenant (visível só para platform_admin).';

create index tenant_notes_tenant_idx on public.tenant_notes (tenant_id, created_at desc);

alter table public.tenant_notes enable row level security;

create policy "tenant_notes: platform admin full access"
  on public.tenant_notes for all
  using (public.is_platform_admin())
  with check (public.is_platform_admin());
