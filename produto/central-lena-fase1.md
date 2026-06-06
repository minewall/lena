# Central da Lena — Fase 1 (proposta para aprovação)

Documento de planejamento. Nada foi codado. Aprovação do usuário é pré-requisito para iniciar a implementação.

- Autor: Claude (orquestrador) + Roberto (decisor)
- Data: 2026-06-05
- Repos analisados:
  - Lena: `/Users/marianapires/Fabric/8.Lena/`
  - Haile (referência de reaproveitamento): `/Users/marianapires/Fabric/3.app_financas/`

## 0. Decisões aprovadas (2026-06-05)

- **Q1 ✅** Backend próprio com Supabase Edge Functions + `@lena/shared`. n8n fora do caminho crítico; só add-on opcional do tenant em fase 3.
- **Q2 ✅** Multi-tenant via RLS por `tenant_id` em `public`.
- **Q3 ✅** MVP sem Pix. Pix entra como E10 na fase 2. Quando entrar, dinheiro sempre na conta do tenant.
- **Q4 ✅** WhatsApp Cloud API direto no piloto (1 número). **Sempre** atrás de uma interface adapter (`WhatsAppProvider`) para permitir trocar por 360dialog (BSP) sem reescrever nada. Embedded Signup multi-tenant fica para depois da verificação Meta; piloto não depende dele.
- **Q6 ✅** Sonnet 4.6 default no diálogo; Haiku 4.5 nos fluxos utilitários (classificação de intenção, extração).
- **Q7 ✅** Multi-segmento especializado. Piloto começa por **escolas** (leads quentes: Campo Belo, Adventista). Demais segmentos (clínicas, salões, petshops) entram via pacotes pré-configurados de brain + templates conforme demanda. Não vincula a Lena a um único vertical.
- **Q8 + Q9 ✅** Monorepo em `8.Lena/` com Yarn workspaces. `packages/shared` é importado por `lena-site` (paridade demo↔produção) e pela Central.

### Refinamentos arquiteturais decorrentes

- **Webhook WA → ack rápido + processamento assíncrono.** A `Edge Fn wa-webhook` apenas (1) valida assinatura, (2) faz INSERT idempotente em `webhook_events`, (3) responde 200 em < 500ms. O processamento real (carregar brain, chamar Claude, executar tools, enviar resposta) roda em uma segunda Edge Function `msg-processor` disparada por `NOTIFY` do Postgres. Se um dia o processador estourar timeout, troca-se por `pgmq` no próprio Postgres sem mudar o contrato com a Meta.
- **Adapter de provedor WhatsApp.** `packages/shared/wa/provider.ts` define a interface `WhatsAppProvider` com `verifyWebhook`, `sendText`, `sendTemplate`, `getNumberHealth`. Implementações: `MetaCloudProvider` (default do piloto) e `Dialog360Provider` (plano B). Escolha por tenant via `tenant_secrets.meta.provider`.

---

## 1. Inventário de reaproveitamento do Haile

Para cada item: **COPIAR** (usar quase como está), **ADAPTAR** (manter padrão, trocar domínio) ou **NÃO USAR** (específico de finanças, refazer).

| # | Item | Onde mora no Haile | Decisão | Por quê |
|---|---|---|---|---|
| 1 | Stack web (React 19 + Vite + TS + Tailwind 4 + Zustand + Recharts + Lucide) | `web/`, `package.json`, `web/package.json` | **COPIAR** | Stack moderna, agnóstica, já produtiva. Zero motivo para trocar. |
| 2 | Monorepo Yarn workspaces (`web/`, `packages/shared/`) | raiz | **COPIAR** | Permite extrair `@lena/shared` (tipos, prompt-builder, tools) reutilizável entre Pages Function (site/demo) e Central. |
| 3 | Deploy Cloudflare Workers + Static Assets | `wrangler.toml`, `cf-worker.js` | **COPIAR** | Continuamos no Cloudflare (já é o stack do site). SPA fallback igual. |
| 4 | Supabase como banco + auth + edge functions | `supabase/` | **COPIAR** | Já é a recomendação do brief Lena. Padrão Haile é didático. |
| 5 | Multi-tenant via RLS por `auth.uid()` + tabelas de associação | `supabase/migrations/20260518000002_rls.sql` | **ADAPTAR** | Trocar `family_groups` por `tenants` (negócios). Membros via `tenant_members` com role. Helper SQL `is_tenant_member(tenant_id)` e `is_tenant_admin(tenant_id)`. |
| 6 | Auth (Supabase Auth, magic link / e-mail+senha) + `profiles` 1:1 | `web/src/lib/auth.tsx`, `profiles` migration | **COPIAR** | Idêntico ao que a Lena precisa. Adicionar campo `is_platform_admin` (Averse) em `profiles` para distinguir super-admin. |
| 7 | RBAC com `role` + `tier` em `profiles` | `profiles` | **ADAPTAR** | Na Lena os papéis vivem em `tenant_members.role` (admin/operador). `profiles.is_platform_admin` é para Averse. |
| 8 | Motor de personalidades (mentor/educador/profissional) | `packages/shared/src/coach-personalities.ts` | **COPIAR** | Padrão "mesma IA, persona variável, guardrails fixos" é exatamente o que a Lena precisa para os 3 tons (Acolhedor, Profissional, Descontraído). Trocar os blocos de persona pelo conteúdo do `automacao/prompt-base.md`. |
| 9 | Context Engine (`buildCoachSystemPrompt`) | `packages/shared/src/coach-context.ts` | **ADAPTAR** | Mesmo padrão (montagem determinística do system prompt a partir de uma struct), trocar dados financeiros por **TenantBrain** (nome do negócio, segmento, horários, serviços, FAQ, regras de upsell, tom). |
| 10 | Tool use (catálogo de tools Anthropic) | `packages/shared/src/coach-tools.ts` | **ADAPTAR** | Substituir tools de finanças por: `consultar_agenda`, `criar_agendamento`, `remarcar`, `cancelar`, `enviar_pix`, `transferir_humano`, `registrar_lead`. |
| 11 | `claude-proxy` edge function (validação JWT, cap por tier, telemetria de custo em `ai_usage`) | `supabase/functions/claude-proxy/index.ts` | **COPIAR** | Padrão completo, inclusive a tabela `ai_usage` em micro-USD. Na Lena adapta para contabilizar custo por tenant e por conversa. |
| 12 | Tabela `ai_usage` + RPC `ai_usage_current_month` + `ai_usage_caps` | migrations | **COPIAR** | Excelente para controlar margem da Averse. Adicionar dimensão `tenant_id`. |
| 13 | Asaas integrator (webhook idempotente, state machine, sempre-200) | `supabase/functions/asaas-*` | **ADAPTAR** | Reusar como padrão de integrador para 2 frentes diferentes na Lena: (a) cobrança da Averse aos tenants, (b) Pix do tenant ao cliente final via PSP do tenant. |
| 14 | Cron via `pg_cron` (billing_lifecycle, onboarding-reminder) | migrations | **COPIAR** | Mesma estrutura para: lembretes 24h antes do agendamento, reconciliação de assinatura, health-check do número WhatsApp. |
| 15 | Tabela `lgpd_requests` + RPC admin | `supabase/migrations/20260526000016_lgpd_requests.sql` | **COPIAR** | Adicionar `tenant_id`; a Averse atende e o tenant também precisa atender DSARs dos seus clientes finais. |
| 16 | Componentes UI: Button (CVA), Modal, Field, charts (Recharts), AppShell | `web/src/components/ui/*`, `web/src/components/charts/*` | **COPIAR estrutura, retipar visual** | Estrutura é boa. Tokens (cores/tipografia) trocam para a identidade da Lena (terracota/creme/sálvia/café, Bricolage + Hanken). |
| 17 | Admin vanilla HTML (`/admin/*.html`) | `admin/` | **NÃO USAR** | Refazer em React dentro da Central como módulo Super-admin. Padrão de edge function admin a gente aproveita. |
| 18 | CLAUDE.md (convenções do Haile) | raiz | **ADAPTAR** | Criar CLAUDE.md da Lena com regras próprias (tom, sem emojis, identidade de "recepcionista virtual", etc.). |
| 19 | Open Finance, categorização, metas, perfis LLP, Mine Wall | `packages/shared/src/finance/*` | **NÃO USAR** | Domínio Haile. |
| 20 | Marca/identidade visual Haile | `assets/`, design tokens | **NÃO USAR** | Lena tem identidade própria, já definida em `brand lena/`. |

**Resultado esperado:** ~60–70% do que precisamos para a Central já tem precedente bom no Haile. O ganho maior é em: motor de personalidades, context engine, claude-proxy com telemetria de custo, padrão RLS multi-tenant, edge functions de integração com state machine, e a stack de UI.

---

## 2. Estado atual da Lena (o que já existe)

Reutilizável diretamente:
- **`automacao/prompt-base.md`** — system instruction paramétrico com placeholders (`{{NOME_DO_NEGOCIO}}` etc.) e exemplo preenchido. Vira a base do TenantBrain → prompt.
- **`automacao/templates-whatsapp.md`** — conversacionais + 4 HSM utility (lembrete, confirmação, remarcação, pós-atendimento). Vira o catálogo inicial de templates.
- **`lena-site/functions/api/lena.js`** — Pages Function com guardrails (rate-limit por IP via KV, max 24 msgs, 1500 chars, 600 tokens, modelo claude-sonnet-4-6). **Insight importante:** é a referência viva de que o prompt **já vive no backend** (Pages Function). A Central precisa migrar essa mesma lógica para uma edge function Supabase que também receba o webhook do WhatsApp.
- **`brand lena/`** — paleta, tipografia, SVGs. Alimenta o design system da Central direto.
- **`produto/lena-brief-completo.md`** — fonte única de verdade do produto, planos, ICP. Não mexer.
- **`lead-generator/`** — fonte externa que alimenta o CRM monday e, futuramente, pode "empurrar" leads para o módulo Comercial da Central.

Só doc, ainda não código de produção:
- `automacao/fluxo-n8n.json` — esqueleto exportável. Útil como referência conceitual; recomendo **não** depender de n8n em produção (justificativa abaixo).
- `automacao/README.md` — descreve as tools que ainda são apenas contratos.

Bloqueadores externos (independentes da Central):
- WhatsApp Business Cloud API: ainda não está plugado (MEI/MBM/Display Name pendentes).
- Validação de demanda: meta de 10+ interessados ainda em curso.

---

## 3. Arquitetura proposta

### 3.1. Pirâmide de decisões

#### a) Orquestração: backend próprio em vez de n8n
**Recomendo backend próprio (Supabase Edge Functions + tabelas de eventos)**, retirando o n8n do caminho crítico.

Por quê:
- **Acoplamento de prompt + guardrails ao backend tipado.** Hoje o `api/lena.js` já mostra que o prompt mora bem em backend nosso. Manter num pacote compartilhado (`packages/shared`) garante que o site, a Central e o webhook usam o mesmo construtor de prompt. Em n8n vira código solto em "Function nodes".
- **Multi-tenant e RLS.** Edge function autenticada conversa nativamente com RLS. Em n8n, tudo roda com service-role e o isolamento vira disciplina.
- **Observabilidade e custo.** A tabela `ai_usage` do Haile (micro-USD) é trivial em edge function; em n8n exige plumbing.
- **Operação.** n8n é mais uma peça com banco, fila, upgrades, alta-disponibilidade e cofre de credenciais. Para um SaaS multi-tenant, isso é custo recorrente.
- **n8n continua útil** para automações **opcionais do tenant** (ex.: "quando agendamento for criado, postar no Slack"). Aí é "n8n como integração de saída", não "n8n como caminho crítico".

#### b) Multi-tenant: RLS por `tenant_id`, não schema-per-tenant
- RLS atende o tamanho previsível do mercado (centenas a poucos milhares de tenants) com complexidade operacional baixa.
- Schema-per-tenant explode operação (migrations, backups, custo) e dificulta dashboards agregados da Averse.
- Padrão Haile (RLS + helper functions) é o nosso ponto de partida.
- Onde o isolamento de RLS é insuficiente (ex.: segredos de WABA, tokens de PSP), a gente guarda em uma tabela `tenant_secrets` com RLS estrita e acesso só via edge function com service-role.

#### c) Onde mora o prompt e os guardrails
**Tudo no backend, num pacote compartilhado `@lena/shared`** importado tanto pelo site (Pages Function) quanto pela Central (Supabase Edge Functions). Cliente nunca recebe o system prompt; só recebe a resposta.

- `@lena/shared/prompt/build.ts` — recebe `TenantBrain` + tom + histórico recente + tool catalog → devolve a `system` e `messages` para o Anthropic.
- `@lena/shared/prompt/guardrails.ts` — bloco fixo (nunca inventa, transfere para humano nas regras X/Y/Z, identidade "recepcionista virtual", LGPD).
- `@lena/shared/tones/{acolhedor,profissional,descontraido}.ts` — só o delta de tom.
- `@lena/shared/tools/*` — catálogo de tools (contratos JSON Schema + handlers no backend).

#### d) IA: modelo padrão
- **Sonnet 4.6** como default (já é o que o site usa hoje e o brief reforça qualidade > custo nesse ponto).
- **Haiku 4.5** para fluxos baratos: classificação de intenção, detecção de palavras-gatilho, extração estruturada (nome, telefone, serviço).
- **Opus 4.7** só para casos exóticos (ex.: análise de conversa para qualificar lead). Configurável por tenant em fase 2.

#### e) Observabilidade e custo
- Reutilizar `ai_usage` do Haile com `tenant_id`. Permite tanto a fatura interna (custo Anthropic por tenant) quanto o relatório da Averse.
- Logs em Supabase + tabela `webhook_events` append-only para WhatsApp/PSP/Calendar (idempotência via `external_id` UNIQUE).
- Sentry/PostHog ficam fora do MVP (custo).

### 3.2. Fluxo de mensagem ponta a ponta

```
┌──────────────┐        ┌──────────────────────────┐        ┌────────────────────────┐
│ Cliente final│  ──►   │ WhatsApp Cloud API (Meta)│  ──►   │ Edge Fn: wa-webhook    │
│  (WhatsApp)  │        └──────────────────────────┘        │  - valida assinatura   │
└──────────────┘                  ▲                         │  - acha o tenant (WABA)│
       ▲                          │                         │  - insere em messages  │
       │                          │                         │  - dispara processor   │
       │                          │                         └─────────┬──────────────┘
       │                          │                                   │
       │                          │                                   ▼
       │                          │                         ┌────────────────────────┐
       │                          │                         │ Edge Fn: msg-processor │
       │                          │                         │  1) checa handoff lock │
       │                          │                         │  2) carrega TenantBrain│
       │                          │                         │  3) build prompt (@lena│
       │                          │                         │     /shared)           │
       │                          │                         │  4) chama Claude       │
       │                          │                         │  5) executa tools      │
       │                          │                         │  6) log ai_usage       │
       │                          │                         └─────────┬──────────────┘
       │                          │                                   │
       │                          │   ┌───────────────────────────────┼──────────────┐
       │                          │   │                               │              │
       │                          │   ▼                               ▼              ▼
       │                  ┌────────────────┐         ┌────────────────────┐  ┌────────────┐
       │                  │ Tool: agenda   │         │ Tool: criar PIX     │  │ Tool:      │
       │                  │ Google Cal /   │         │ via PSP do tenant   │  │ transferir │
       │                  │ sistema cliente│         │ (Asaas/Efí/MP)      │  │ humano     │
       │                  └────────────────┘         └────────────────────┘  └─────┬──────┘
       │                          │                                                │
       └──────────────────────────┘ ◄────── resposta enviada via WA Cloud API ─────┘

Central da Lena (React/Vite no Cloudflare) lê e escreve em todas essas tabelas via Supabase + RLS.
Cron (pg_cron) dispara: lembretes 24h antes, reconciliação billing, health-check de número.
```

### 3.3. Stack final recomendada

| Camada | Escolha | Justificativa |
|---|---|---|
| Frontend Central | React 19 + Vite + TS + Tailwind 4 + Zustand + Recharts | Igual Haile; produtividade comprovada. |
| Hospedagem Central | Cloudflare Pages | Continua o stack do site. |
| Backend | Supabase Edge Functions (Deno) + pg_cron + RLS | Backend = DB; menos peças. |
| Banco | Supabase Postgres | Já decidido no brief. |
| Auth | Supabase Auth (magic link + e-mail/senha) | Padrão Haile. |
| IA | Anthropic API (Sonnet 4.6 default / Haiku 4.5 utilitário) | Já é nosso provedor. |
| WhatsApp | Meta WhatsApp Cloud API (Tech Provider Averse) | Decisão de produto. |
| Calendário | Google Calendar via OAuth (por tenant) | Padrão de mercado das PMEs. Sistema próprio do tenant entra via webhook. |
| Pagamentos | PSPs do tenant (Asaas, Efí, Mercado Pago) | Pix nunca passa pela Averse. Padrão de integrador Asaas do Haile cobre. |
| Billing Averse → tenant | Asaas (assinatura mensal por plano) | Reaproveita por inteiro. |
| Mensageria/eventos | Tabelas append-only + trigger pg + edge fn | Sem broker dedicado no MVP. Se escalar, plugar pgmq ou SQS. |
| Pacote compartilhado | `packages/shared` (Yarn workspace) | Prompt-builder, tipos, tools usados em site, webhook e Central. |
| Observabilidade | `ai_usage`, `webhook_events`, Supabase logs | Sentry/PostHog em fase 2. |
| n8n | **Fora do caminho crítico.** Disponível como add-on opcional de automação do tenant (fase 2/3). | Justificativa em §3.1.a. |

---

## 4. Modelo de dados multi-tenant (proposta)

Schemas: tudo em `public` com RLS. Edge functions privilegiadas usam `service_role` apenas quando necessário (webhooks, cron, super-admin).

### 4.1. Tenancy e pessoas
- `tenants` — `id, slug, name, segment, status, plan_id, timezone, created_at, deleted_at`.
- `tenant_members` — `id, tenant_id, user_id, role ('admin' | 'operador'), invited_at, accepted_at`. Helper SQL: `is_tenant_member(tenant_id uuid)`, `is_tenant_admin(tenant_id uuid)`.
- `profiles` — extensão de `auth.users`; `id, full_name, avatar_url, is_platform_admin bool default false, updated_at`.
- `tenant_secrets` — `tenant_id, kind ('waba'|'psp'|'google_calendar'|'webhook'), ciphertext, meta jsonb, updated_at`. RLS: leitura só via edge function com service-role.

### 4.2. Cérebro da Lena (configuração do tenant)
- `tenant_brains` — 1 por tenant. `tenant_id PK, business_name, segment, address, hours jsonb, payments jsonb, convenios jsonb, tone ('acolhedor'|'profissional'|'descontraido'), escalation_rules jsonb, version int, updated_at`.
- `tenant_services` — catálogo: `id, tenant_id, name, description, price_cents, duration_min, is_upsell bool, active bool`.
- `tenant_faqs` — `id, tenant_id, question, answer, tags text[], active bool`.
- `tenant_upsell_rules` — `id, tenant_id, trigger jsonb (após confirmar agendamento, segmento, etc.), service_id, max_per_day int`.

### 4.3. WhatsApp e canais
- `wa_numbers` — `id, tenant_id, phone_e164, display_name, waba_id, phone_id, status, quality_rating, last_health_check`.
- `wa_templates` — `id, tenant_id, name, category ('utility'|'marketing'|'auth'), language, body, status ('draft'|'submitted'|'approved'|'rejected'), meta_template_id`.
- `webhook_events` — `id, source ('whatsapp'|'asaas'|'mp'|'efí'|'gcal'), external_id UNIQUE, tenant_id, payload jsonb, received_at, processed_at, status`. Idempotência por `external_id`.

### 4.4. Inbox e conversas
- `contacts` — `id, tenant_id, phone_e164, name, tags text[], opted_out bool, created_at`. Único por `(tenant_id, phone_e164)`.
- `conversations` — `id, tenant_id, contact_id, channel ('whatsapp'), state ('lena'|'human'|'paused'), assigned_to user_id null, last_message_at, opened_at, closed_at`.
- `messages` — `id, conversation_id, tenant_id, direction ('in'|'out'), kind ('text'|'image'|'template'|'system'), body, meta jsonb (template_name, tool_calls, ai_model), wa_message_id, created_at`.
- `handoff_events` — `id, conversation_id, reason, from_state, to_state, actor user_id null, created_at`.

### 4.5. Agenda
- `calendars` — `id, tenant_id, kind ('google'|'system'|'manual'), external_ref, timezone, sync_state, last_sync_at`.
- `appointments` — `id, tenant_id, contact_id, service_id, calendar_id, start_at, end_at, status ('booked'|'confirmed'|'cancelled'|'no_show'|'done'), created_via ('lena'|'operador'|'externo'), external_event_id`.
- `appointment_reminders` — `id, appointment_id, kind ('24h'|'2h'|'pos_atendimento'), scheduled_for, sent_at, status`.

### 4.6. Pagamentos (Pix do tenant ao cliente final)
- `psp_accounts` — `id, tenant_id, provider ('asaas'|'efi'|'mp'), external_account_id, label`.
- `pix_charges` — `id, tenant_id, contact_id, appointment_id null, psp_account_id, amount_cents, status ('created'|'paid'|'expired'|'refunded'), copy_paste, qr_url, created_at, paid_at`. (Dinheiro nunca passa pela Averse — só rastreamos o status para a Lena conversar com o cliente.)

### 4.7. Billing (Averse cobra do tenant)
- `plans` — `id, code ('essencial'|'profissional'|'premium'), price_cents, conversation_cap, addons_allowed`.
- `subscriptions` — `id, tenant_id, plan_id, status, asaas_subscription_id, current_period_start, current_period_end, trial_end_at`.
- `invoices` — `id, subscription_id, asaas_invoice_id, amount_cents, status, due_at, paid_at`.
- `conversation_usage` — `id, tenant_id, period_month, conversation_count`. Cap por plano.
- `credits_addons` — `id, tenant_id, kind ('campanhas'), balance, last_purchase_at` (fase 2).

### 4.8. IA, observabilidade, LGPD
- `ai_usage` — `id, tenant_id, conversation_id, model, input_tokens, output_tokens, cost_micro_usd, occurred_at`.
- `ai_usage_caps` — `tenant_id null + plan_code` (defaults por plano) ou `tenant_id` (override).
- `lgpd_requests` — `id, tenant_id, contact_id null, requester_email, kind ('export'|'delete'|'rectify'|'object'), status, requested_at, completed_at, completed_by`.
- `audit_log` — `id, tenant_id, actor_user_id, action, target_kind, target_id, meta jsonb, created_at`. Append-only, soft delete em outros recursos.

### 4.9. Campanhas (fase 2)
- `campaigns` — `id, tenant_id, name, template_id, segment jsonb, status, scheduled_for, finished_at, opt_in_required bool`.
- `campaign_targets` — `id, campaign_id, contact_id, status, sent_at, replied_at, opted_out_at`.
- Guardrails: frequency cap + auto-pausa por queda de quality rating do número (implementados em código, não só em policy).

### 4.10. Convenções de RLS
- Toda tabela com `tenant_id` aplica a policy: `using (is_tenant_member(tenant_id))` para leitura e `using (is_tenant_admin(tenant_id))` para escrita sensível.
- `profiles.is_platform_admin = true` ganha bypass via policies dedicadas para visões agregadas.
- Triggers `before insert` populam `tenant_id` a partir do contexto quando aplicável (ex.: `messages.tenant_id` derivado de `conversations.tenant_id`).

---

## 5. Módulos, épicos e MVP

Os 11 módulos do brief, agrupados em épicos com ordem sugerida.

### 5.1. MVP (fase 1 — onboarding até primeiro tenant operando)

Objetivo do MVP: **um cliente real consegue, no dia 1, ter a Lena atendendo no WhatsApp dele, com agenda básica e relatório essencial.** Billing automatizado e campanhas ficam para depois.

| Épico | Módulos cobertos | Entregáveis |
|---|---|---|
| E1. Fundação | Auth, multi-tenant, design system | Login, criação de tenant, papéis (admin do cliente + super-admin Averse), shell da Central com identidade visual da Lena. |
| E2. Cérebro da Lena | Configuração | UI para preencher `tenant_brains`, catálogo de serviços, FAQ, escolha de tom. Versão do brain com histórico. |
| E3. Conexão WhatsApp | Tenants/onboarding + integrações | Embedded Signup (Meta) por tenant, registro do número/WABA, validador de saúde (display name, quality, limites). |
| E4. Conversas e inbox | Inbox + handoff | Webhook WhatsApp → conversas/mensagens, render do histórico, botão "assumir/devolver", trava de handoff por tempo. |
| E5. Motor IA | Cérebro + integrações | `@lena/shared` com prompt-builder, guardrails, tons, tool catalog mínimo (`responder`, `transferir_humano`). Edge function `msg-processor` + `ai_usage`. |
| E6. Agenda básica | Agenda | Conexão Google Calendar por tenant + tools `consultar_agenda` e `criar_agendamento` com trava de dupla marcação. Lembrete 24h via cron + HSM utility. |
| E7. Relatórios essenciais | Relatórios operacionais | Dashboard do cliente: conversas/dia, taxa de agendamento, no-show, tempo de resposta, handoffs. |
| E8. Saúde da plataforma (Averse) | Monitoramento | Super-admin: lista de tenants, status dos números, consumo de IA, erros recentes. |

Estimativa grosseira para MVP: **4 a 6 semanas** de implementação contínua, partindo do código do Haile como referência. Esse número precisa de validação contra a sua disponibilidade.

### 5.2. Fase 2 (pós-MVP)

| Épico | Conteúdo |
|---|---|
| E9. Billing automatizado | Asaas, planos, cap de conversas, faturamento, dunning. |
| E10. Pix (Pagamentos do tenant) | `tenant_secrets` para PSP, tool `enviar_pix`, registro de cobranças, conciliação. |
| E11. Templates aprovados pela Meta | Submissão e gestão de templates (utility e marketing). |
| E12. Upsell estruturado | Regras de upsell por serviço, relatório comercial. |
| E13. Operador (recepção do cliente) | Papel `operador`, fila de handoff, marcação de leads. |

### 5.3. Fase 3 (add-ons)

| Épico | Conteúdo |
|---|---|
| E14. Campanhas de reativação | Créditos, segmentação, opt-in, frequency cap, auto-pausa. |
| E15. Automações do tenant | Aí sim n8n opcional como integração de saída (Slack, planilhas, CRMs). |
| E16. Analytics avançado | Comercial e financeiro detalhados, recortes longos. |

---

## 6. Decisões abertas que precisam da sua validação antes de codar

Lista enxuta. Vou marcar a minha recomendação em cada item.

1. **Orquestração:** backend próprio (Supabase Edge Functions + pacote compartilhado) vs n8n no caminho crítico.
   *Recomendo: backend próprio, n8n só como add-on opcional de saída.*

2. **Multi-tenant:** RLS em `public` com `tenant_id` vs schema-per-tenant.
   *Recomendo: RLS.*

3. **Escopo do MVP:** o conjunto E1–E8 acima (sem billing automatizado, sem Pix, sem campanhas) vs incluir Pix já no MVP (vale para clínicas estética/odonto que cobram sinal).
   *Recomendo: começar sem Pix; entrar como E10 logo na fase 2.*

4. **WhatsApp:** Cloud API direto (Averse como Tech Provider) vs BSP (Z-API, 360dialog).
   *Recomendo: Cloud API direto se o registro Meta avançar em até 2–3 semanas; do contrário usar 360dialog temporariamente para destravar piloto. Decisão de produto e regulatório.*

5. **PSP padrão (para fase 2):** Asaas (familiar pelo Haile) vs Efí vs Mercado Pago.
   *Recomendo: Asaas como primeiro integrador (reaproveita código), com arquitetura preparada para plugar Efí e MP depois.*

6. **Modelo Claude padrão na Lena de produção:** Sonnet 4.6 default + Haiku 4.5 para utilitários.
   *Recomendo: confirmar como política única para evitar variabilidade entre tenants.*

7. **Nicho-foco no piloto:** clínicas estética/odonto (alto ticket, sinal Pix) vs petshops (volume).
   *Recomendo: clínicas estética/odonto — alinhado ao brief e ao add-on de campanhas.*

8. **`@lena/shared` mora:** dentro do repo `8.Lena` como monorepo Yarn (igual Haile) vs repo separado.
   *Recomendo: monorepo dentro de `8.Lena/`.*

9. **Pacote `packages/shared` será compartilhado entre o site atual (`lena-site`) e a Central?**
   *Recomendo: sim, para o site adotar o mesmo prompt-builder e ficar coerente com a IA real.*

Aguardo a sua leitura. Quando você responder esses 9 pontos, eu reviso o plano e abro a fase de implementação módulo a módulo.
