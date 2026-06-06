# Supabase — `lena-uno`

Banco de dados e auth da Lena.

- **Project ref:** `tirvnwsiokivrswdthge`
- **Project URL:** `https://tirvnwsiokivrswdthge.supabase.co`
- **Region:** `us-east-2`
- **Org:** `minewall` (mesma do FinFamily/Haile)
- **Tier:** Free
- **Painel:** https://supabase.com/dashboard/project/tirvnwsiokivrswdthge

## Schema atual

3 tabelas em `public`, todas com RLS habilitada:

- **`profiles`** — extensão 1:1 de `auth.users`. Campo `is_platform_admin`
  identifica staff da Averse.
- **`tenants`** — negócios clientes (escolas, clínicas, salões, petshops).
  Soft-delete via `deleted_at`. Slug único.
- **`tenant_members`** — associa profile a tenant com papel
  (`admin` | `operador`). Convites pendentes têm `accepted_at = null`.

## Funções

- **`create_tenant(p_name, p_slug, p_segment)`** — RPC exposta (apenas
  `authenticated`). Cria tenant e registra o caller como `admin` aceito.
  Uso a partir do cliente:
  ```ts
  const { data: tenantId, error } = await supabase.rpc("create_tenant", {
    p_name: "Colégio Adventista",
    p_slug: "adventista-campo-belo",
    p_segment: "escola",
  });
  ```
- **`is_tenant_member(t)`**, **`is_tenant_admin(t)`**, **`is_platform_admin()`**
  — helpers usados internamente pelas RLS policies. Não expostos via API.

## Migrations

Em `supabase/migrations/`. Aplicar via Supabase MCP, `supabase db push`
ou painel SQL.

| # | Migration |
|---|---|
| 20260606000001 | `init_profiles_tenants_members` — schema base + triggers + `create_tenant` RPC |
| 20260606000002 | `rls_helpers_policies` — RLS on, helpers, policies |
| 20260606000003 | `advisor_fixes` — search_path, revokes, `(select auth.uid())`, separa policies de `tenant_members` |

## Variáveis de ambiente

Para o cliente (Central, demo do site se precisar):

```bash
LENA_SUPABASE_URL=https://tirvnwsiokivrswdthge.supabase.co
LENA_SUPABASE_PUBLISHABLE_KEY=sb_publishable_KKYuhc6CPX1PTLESHUir9Q_noKB_aW6
```

A **publishable key** é segura para o cliente (não dá privilégios além de
RLS). A **service role key** fica apenas em Edge Functions e nunca vai
para o front. Não está em `.env.example` — colar manualmente em secrets
do Cloudflare/Supabase quando precisar.

## Re-gerar tipos TypeScript

```
# via Supabase CLI:
npx supabase gen types typescript --project-id tirvnwsiokivrswdthge > packages/shared/src/db/types.ts
npm run build:shared
```

(ou pedir para o Claude rodar via MCP `generate_typescript_types`)

## Advisor

Após 0001+0002+0003, o advisor segurança reporta 1 warning intencional:
- `create_tenant` é executável por `authenticated` — é a única RPC exposta
  para usuários logados criarem tenant. Não revogar.

Advisor performance só reporta 2 INFOs sobre índices ainda não usados
(esperado em DB vazio).
