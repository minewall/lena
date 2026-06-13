-- ============================================================================
-- 20260613170000 — Idade/persona da Lena por tenant.
-- O dono escolhe a faixa etária da Lena (18→48, de 4 em 4) em Tom e IA; molda
-- o jeito de falar. null = não definido (tom neutro).
-- ============================================================================
alter table public.tenant_brains
  add column persona_age int
  check (persona_age is null or (persona_age between 18 and 80));
