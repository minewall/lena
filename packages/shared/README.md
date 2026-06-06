# @lena/shared

Pacote compartilhado da Lena. Importado pela Pages Function da demo
(`lena-site/functions/api/lena.js`) e, futuramente, pela Central da Lena
(`central/`) e pelas Edge Functions do Supabase.

A regra de ouro: **o system prompt e os guardrails nunca chegam ao cliente.**
Tudo que mora aqui é consumido só pelo backend.

## Layout

- `prompt/` — construtor do system prompt e tipos do `TenantBrain`.
  - `buildDemoSystem(brain)` — versão usada na demo do site. Texto
    preservado verbatim da implementação original em `lena-site/functions/api/lena.js`
    para garantir paridade.
  - A versão de produção (`buildProductionSystem`) entra quando integrarmos
    o WhatsApp Cloud API, com guardrails completos de `automacao/prompt-base.md`.
- `tones/` — dicionário dos 3 tons (Acolhedor, Profissional, Descontraído).
- `wa/` — placeholder. Vai abrigar o `WhatsAppProvider` adapter
  (`MetaCloudProvider`, `Dialog360Provider`).
- `prompt/segments/` — seeds de brain por segmento. Hoje só `escolas`
  (segmento-foco do piloto).

## Build

```bash
npm run build:shared
```

Saída em `packages/shared/dist/`.

## Paridade da demo

Qualquer mudança em `buildDemoSystem` precisa preservar a saída
caractere-a-caractere. Rodar antes de commitar:

```bash
npm run build:shared
node packages/shared/test/parity.mjs
```

## Deploy do `lena-site/` no Cloudflare Pages

Antes deste pacote, o site era estático puro. Agora ele consome `@lena/shared`,
então o build no Cloudflare Pages precisa instalar o workspace e buildar o
shared antes do deploy. Ajustar no painel Cloudflare Pages → Settings:

- **Root directory:** raiz do repo (não `lena-site/`)
- **Build command:** `npm install && npm run build:shared`
- **Build output directory:** `lena-site`

A Function `/api/lena` continua sendo descoberta automaticamente em
`lena-site/functions/api/lena.js`.
