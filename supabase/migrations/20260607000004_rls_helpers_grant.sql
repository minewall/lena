-- ============================================================================
-- 20260607000004 — grant execute das helpers de RLS para authenticated
--
-- Bug introduzido em 20260606000003_advisor_fixes: revoguei EXECUTE de
-- authenticated nas funções is_tenant_member / is_tenant_admin /
-- is_platform_admin. Essas funções são SECURITY DEFINER por design
-- (precisam bypassar a RLS de tenant_members para evitar recursão), mas
-- são CHAMADAS DE DENTRO das policies de RLS quando o caller é authenticated.
--
-- Sem EXECUTE, o caller authenticated não consegue avaliar as policies de
-- SELECT em tenants, tenant_members, contacts, conversations, messages etc.,
-- e qualquer query retorna "permission denied".
--
-- Solução: restaurar EXECUTE para authenticated. O lint do advisor sobre
-- "anon_security_definer_function_executable" continua válido para anon
-- (mantemos revoke), mas authenticated precisa para o RLS funcionar.
-- Não é vazamento real: essas funções só revelam membership do próprio
-- usuário sobre um tenant_id que ele já precisa conhecer.
-- ============================================================================

grant execute on function public.is_tenant_member(uuid) to authenticated;
grant execute on function public.is_tenant_admin(uuid) to authenticated;
grant execute on function public.is_platform_admin() to authenticated;

comment on function public.is_tenant_member(uuid) is
  'RLS helper. EXECUTE concedido a authenticated porque é chamada pelas policies de SELECT/UPDATE em todas as tabelas tenant-scoped. SECURITY DEFINER necessário para evitar recursão em tenant_members.';
comment on function public.is_tenant_admin(uuid) is
  'RLS helper. EXECUTE concedido a authenticated (mesma justificativa de is_tenant_member).';
comment on function public.is_platform_admin() is
  'RLS helper. EXECUTE concedido a authenticated (mesma justificativa).';
