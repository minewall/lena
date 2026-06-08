# Handoff — Prospecção (CRM da Averse) na Central

**Data:** 2026-06-08
**Autor:** sessão de prospecção (Roberto + agente)
**Para:** agente(s) trabalhando no repo da Central

Resumo rápido pra quem mexe na Central: **migramos o CRM de prospecção do
monday.com para o Supabase** e adicionamos a página **`/prospeccao`**. É uma
área **interna da Averse** (só `platform_admin`), fora do modelo multi-tenant.

---

## Banco (Supabase `lena-uno`, ref `tirvnwsiokivrswdthge`)

- **Nova tabela `public.prospects`** — 379 leads carregados (mesma fonte do
  `lead-generator`). Migration `supabase/migrations/20260608000009_prospects_crm.sql`:
  - enum `prospect_funil`: `novo | contatado | em_conversa | cliente | perdido`
  - coluna **gerada** `whatsapp_url` = `https://wa.me/<1º whatsapp>` (abre o
    WhatsApp direto, sem `tel:`/FaceTime)
  - **RLS:** só `is_platform_admin()` (CRM interno da Averse; NÃO tem `tenant_id`)
- Migration `20260608000010_prospects_funil_changed_at.sql`: coluna
  `funil_changed_at` + trigger `touch_prospect_funil_changed` (atualiza **só**
  quando `funil` muda — `updated_at` muda em qualquer edição).
- **Seed reutilizável:** `lead-generator/scripts/seed_prospects_sql.py` lê os
  CSVs de `lead-generator/data/` e gera o SQL de carga.

## Central (frontend)

| Arquivo | Mudança |
|---|---|
| `central/src/pages/Prospeccao.tsx` | **NOVO** — Kanban (drag-and-drop HTML5 nativo) + visão Lista (tabela). Filtros: busca, segmento, tipo de contato (WhatsApp/telefone/e-mail). Ordena cada coluna por `funil_changed_at` (recente no topo). Edição de `notas` inline. |
| `central/src/lib/prospects.ts` | **NOVO** — data layer: `loadProspects`, `updateFunil`, `updateNotas`; tipo `Prospect`, const `FUNIS`. |
| `central/src/App.tsx` | **MOD** — rota `/prospeccao`. |
| `central/src/components/Layout.tsx` | **MOD** — item de nav "Prospecção" com novo campo `platformOnly`; filtro do menu por `isPlatformAdmin`. |

## ⚠️ Pontos de atenção

- **Tipos do DB:** `prospects` (e `appointments`) **não** estão em
  `packages/shared/src/db/types.ts`. Seguimos o padrão de **cast local** já usado
  em `lib/agenda.ts` e `lib/dashboard.ts`. Se quiser regenerar os tipos
  (`npx supabase gen types typescript --project-id tirvnwsiokivrswdthge > packages/shared/src/db/types.ts`),
  dá pra trocar os casts de `lib/prospects.ts` por tipos reais. A regeneração foi
  rodada uma vez nesta sessão mas **não foi gravada** (mantivemos o padrão atual).
- **Gate:** `/prospeccao` é **platform_admin-only** (não é tenant-admin). O nav usa
  o novo campo `platformOnly`. `roberto271712@gmail.com` foi promovido a
  `is_platform_admin = true` no banco.
- **Não-tenant:** `prospects` não tem `tenant_id`. Não misturar com fluxos
  multi-tenant nem com RLS de tenant.
- **monday.com obsoleto:** o board antigo (`18415991954`) deixou de ser o CRM;
  fica só como referência histórica. (O plano grátis do monday bloqueia API de
  estrutura — foi o gatilho da migração.)

## Como acessar

1. Ser `platform_admin` no `profiles`.
2. `npm run dev:central`, login por magic link → item **"Prospecção"** no menu.
