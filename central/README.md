# central — Central da Lena

App React + Vite que serve a Central da Lena (backoffice da Averse e dos
tenants). Consome `@lena/shared` e o Supabase `lena-uno`.

## Rodar localmente

```bash
# uma vez:
cp central/.env.example central/.env
npm install            # na raiz, instala os workspaces
npm run build:shared   # gera @lena/shared/dist

# diariamente:
npm run dev:central    # abre http://localhost:5173
```

## Stack

- React 19 + Vite 6 + TypeScript 5
- Tailwind 4 (config inline via `@theme` em `src/styles/global.css`)
- React Router 7
- Zustand 5 (`src/store/auth.ts`)
- Supabase JS (`src/lib/supabase.ts`, tipado com `@lena/shared/db`)

## Estrutura

```
central/
├── public/_redirects        SPA fallback p/ Cloudflare Pages
├── src/
│   ├── lib/
│   │   ├── env.ts           leitura de import.meta.env.*
│   │   └── supabase.ts      cliente tipado
│   ├── store/auth.ts        sessão + lista de tenants + currentTenant
│   ├── components/
│   │   ├── AuthGate.tsx     redireciona p/ /login se não logado
│   │   └── Layout.tsx       sidebar + tenant switcher + nav
│   ├── pages/
│   │   ├── Login.tsx        magic link
│   │   ├── AuthCallback.tsx callback do magic link
│   │   ├── CreateTenant.tsx wizard que chama RPC create_tenant
│   │   └── Dashboard.tsx    KPIs placeholder + próximos passos
│   ├── styles/global.css    tokens da marca Lena via @theme
│   ├── App.tsx              rotas
│   └── main.tsx             entry
└── index.html
```

## Auth

Login por magic link via Supabase Auth. Após clicar no link do e-mail, o
usuário cai em `/auth/callback`. A sessão é persistida em localStorage
pelo SDK; o `AuthGate` redireciona não-autenticados para `/login`.

## Multi-tenant

`useAuth` carrega `tenants` (RLS já filtra por membership). O usuário
escolhe o atual no switcher do sidebar; a preferência fica em
`localStorage.lena.currentTenantId`. Sem nenhum tenant, o Dashboard
empurra para `/criar-tenant`, que chama a RPC `create_tenant` e registra
o usuário como `admin` aceito.

## Deploy (planejado, ainda não configurado)

Cloudflare Pages, projeto separado do site institucional. Sugestão de
domínio: `central.lena.ia.br`. Build command:

```
npm install && npm run build:shared && npm run build -w central
```

Build output: `central/dist`. Vars: `VITE_LENA_SUPABASE_URL` e
`VITE_LENA_SUPABASE_PUBLISHABLE_KEY`.
