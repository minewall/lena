# Supabase Edge Functions — Lena

Funções Deno deployadas no projeto `lena-uno` (`tirvnwsiokivrswdthge`).

## Estrutura

```
supabase/functions/
├── _shared/
│   ├── env.ts                env vars utilities
│   ├── supabase.ts           cliente service-role (bypass RLS)
│   └── wa/                   cópia sincronizada de @lena/shared/wa
│       └── …                 (regenerada por `npm run sync:edge`)
├── wa-webhook/index.ts       gateway de ingestão do WhatsApp Cloud API
└── msg-processor/index.ts    processa webhook_events em background
```

## Env vars (configurar via painel Supabase ou `supabase secrets set ...`)

| Var | Onde mora | Valor |
|---|---|---|
| `SUPABASE_URL` | auto-injetada | URL do projeto |
| `SUPABASE_SERVICE_ROLE_KEY` | auto-injetada | service role key |
| `META_APP_SECRET` | configurar | "App Secret" do app Meta (developers.facebook.com → app → Settings → Basic) |
| `META_VERIFY_TOKEN` | configurar | string aleatória forte que escolhemos. **Mesmo token vai no painel Meta → WABA → Webhooks** |

```bash
# exemplo (rodar 1 vez, antes do primeiro deploy)
supabase secrets set --project-ref tirvnwsiokivrswdthge \
  META_APP_SECRET=<colar_app_secret> \
  META_VERIFY_TOKEN=<gerar_string_forte_32_chars>
```

## Deploy

```bash
# precisa do Supabase CLI: npm i -g supabase

# antes de cada deploy, sincroniza o adapter
npm run sync:edge

# deploy individual
supabase functions deploy wa-webhook --project-ref tirvnwsiokivrswdthge --no-verify-jwt
supabase functions deploy msg-processor --project-ref tirvnwsiokivrswdthge --no-verify-jwt
```

> `--no-verify-jwt` no `wa-webhook` porque a Meta NÃO manda JWT do Supabase.
> A autenticação é via `X-Hub-Signature-256` (HMAC com `META_APP_SECRET`).
>
> `--no-verify-jwt` no `msg-processor` porque a chamada interna a partir do
> `wa-webhook` usa `Authorization: Bearer SERVICE_ROLE_KEY` que é o nosso
> próprio mecanismo de autenticação.

## URLs públicas

```
GET/POST  https://tirvnwsiokivrswdthge.supabase.co/functions/v1/wa-webhook
POST      https://tirvnwsiokivrswdthge.supabase.co/functions/v1/msg-processor
```

A URL do `wa-webhook` é o que vai no painel Meta → WABA → Webhooks →
**Callback URL**, com o `META_VERIFY_TOKEN` no campo **Verify token**.

## Fluxo runtime

```
1. Meta → POST /wa-webhook (com X-Hub-Signature-256)
2. wa-webhook:
   - valida assinatura
   - normaliza payload (normalizeMetaWebhook)
   - resolve tenant_id pelo phone_number_id (tabela wa_numbers)
   - INSERT idempotente em webhook_events (UNIQUE source+external_id)
   - ack 200 ao Meta
   - EdgeRuntime.waitUntil(fetch /msg-processor com webhook_event_id)
3. msg-processor:
   - load webhook_events row
   - upsert contact, upsert conversation, insert message (direction='in')
   - update webhook_events.status='processed'
```

O fluxo de **resposta da Lena** (Claude + sendText) vem em E5.

## Mantendo `_shared/wa/` em sincronia

Toda mudança em `packages/shared/src/wa/*.ts` exige:

```bash
npm run sync:edge
git add supabase/functions/_shared/wa/
```

Eventualmente vamos automatizar com pre-commit hook.
