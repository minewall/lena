# Enviar como contato@lena.ia.br — Brevo SMTP grátis + Gmail

> Objetivo: continuar **recebendo** em `contato@lena.ia.br` pelo Cloudflare (já funciona) e passar a
> **enviar** como `contato@lena.ia.br` direto do seu Gmail, de graça, sem cair no spam.
> Plano grátis do Brevo: 300 e-mails/dia — de sobra pra prospecção.

---

## Visão geral (como as peças se encaixam)

```
ENTRADA:  alguém escreve -> contato@lena.ia.br -> Cloudflare Email Routing -> seu Gmail   (já pronto)
SAÍDA:    você responde no Gmail "como" contato@lena.ia.br -> SMTP da Brevo -> destinatário  (vamos montar)
```

---

## Passo 1 — Criar conta Brevo e autenticar o domínio
1. Crie conta grátis em **brevo.com**.
2. Vá em **Settings → Senders, Domains & Dedicated IPs → Domains → Add a domain** e digite `lena.ia.br`.
3. O Brevo vai te mostrar **registros pra adicionar no DNS** (um código de verificação + DKIM).
   Guarde essa tela aberta — os valores exatos do DKIM e do `brevo-code` são gerados pra sua conta.

## Passo 2 — Adicionar os registros no Cloudflare (DNS)

No painel do Cloudflare → `lena.ia.br` → **DNS → Records → Add record**. Todos como **DNS only** (nuvem cinza; TXT/CNAME não são proxiados mesmo).

| Tipo | Nome | Conteúdo | De onde vem |
|---|---|---|---|
| **TXT** | `@` | `brevo-code:XXXXXXXXXXXX` | copie da tela do Brevo |
| **CNAME** | `brevo1._domainkey` | `b1.lena-ia-br.dkim.brevo.com` | DKIM (Brevo usa CNAME) — DNS only |
| **CNAME** | `brevo2._domainkey` | `b2.lena-ia-br.dkim.brevo.com` | DKIM 2 — DNS only |
| **TXT** | `_dmarc` | `v=DMARC1; p=none; rua=mailto:contato@lena.ia.br; fo=1` | use este valor |

> **⚠️ DMARC: comece em `p=none`, não `p=reject`.** `p=reject` faz qualquer e-mail que falhe na
> validação ser descartado em silêncio (nem cai no spam) — perigoso antes de confirmar que o Brevo
> assina tudo certo. Rode 1-2 semanas em `p=none` (modo monitor, com `rua` recebendo relatórios),
> confirme o alinhamento, e só então suba para `p=quarantine` e depois `p=reject`.

### ⚠️ Atenção no SPF (o ponto que mais quebra)
Você **já tem** um registro SPF do Cloudflare Email Routing (algo como `v=spf1 include:_spf.mx.cloudflare.net ~all`).
**Só pode existir UM registro SPF.** Não crie outro — **edite o existente** pra incluir o Brevo:

```
v=spf1 include:_spf.mx.cloudflare.net include:spf.brevo.com ~all
```

> Se não achar um SPF existente, crie um TXT em `@` com o valor acima.
> **Não mexa nos registros MX** do Cloudflare — eles são o recebimento, têm que ficar.

Volte na tela do Brevo e clique em **Verify / Authenticate**. Pode levar de minutos a algumas horas pra propagar.

## Passo 3 — Pegar as credenciais SMTP no Brevo
1. No Brevo: **Settings → SMTP & API → aba SMTP**.
2. Anote:
   - **SMTP server:** `smtp-relay.brevo.com`
   - **Port:** `587` (TLS)
   - **Login:** o e-mail da sua conta Brevo
   - **Password / SMTP key:** clique em **Generate a new SMTP key** e copie (é diferente da senha de login)

## Passo 4 — Configurar "Enviar como" no Gmail
1. Gmail → **Configurações ⚙ → Ver todas as configurações → Contas e importação**.
2. Em **"Enviar e-mails como"** → **Adicionar outro endereço de e-mail**.
3. Nome: `Roberto` (ou `Lena`) · E-mail: `contato@lena.ia.br` → **Próxima etapa**.
4. Preencha o SMTP:
   - **Servidor SMTP:** `smtp-relay.brevo.com`
   - **Porta:** `587`
   - **Nome de usuário:** o login Brevo
   - **Senha:** a SMTP key do passo 3
   - **Conexão segura usando TLS** (selecionado)
5. **Adicionar conta.** O Google manda um e-mail de verificação pra `contato@lena.ia.br`...
6. ...que o **Cloudflare encaminha pro seu Gmail**. Abra, clique no link de confirmação. Pronto.

## Passo 5 — Usar
Ao escrever um e-mail, no campo **De:** escolha `contato@lena.ia.br`.
Defina como padrão em **Contas e importação → "Enviar e-mails como" → tornar padrão** se quiser que TODO e-mail saia desse endereço.

---

## Checklist de entregabilidade (pra não cair no spam)
- [ ] SPF único, com `include:spf.brevo.com` somado ao do Cloudflare
- [ ] DKIM do Brevo verificado (status verde no painel Brevo)
- [ ] DMARC `p=none` publicado (depois de 2-3 semanas sem problema, pode subir pra `p=quarantine`)
- [ ] Domínio com status **Authenticated** no Brevo
- [ ] Primeiro teste: mande um e-mail pra um Gmail seu e confira se chegou na caixa de entrada (não spam) e se o "enviado por" não aparece feio

---

## Quando migrar pro Google Workspace
Se a prospecção engrenar e o volume crescer, vale migrar pro **Workspace** (~R$35/mês): caixa real,
melhor reputação, sem depender de relay. A assinatura e o domínio continuam iguais — só troca o MX.
