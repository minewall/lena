# Lena v0.5 — Automação inicial

Primeira versão funcional do "cérebro" da Lena: recebe mensagem no WhatsApp → consulta a IA
com o prompt-base → responde, ou transfere para um humano quando foge do escopo.

> Status: **esqueleto pronto para implantação piloto** (1 cliente). Ainda sem WhatsApp Cloud API
> oficial — dá pra rodar no piloto via Z-API/360dialog (BSP) ou no WhatsApp Business App + ponte.
> Próxima etapa de infraestrutura está no `backlog.md` (WhatsApp Business Cloud API).

## Arquivos

| Arquivo | O que é |
|---|---|
| `prompt-base.md` | System instruction da Lena (Claude/GPT). Configurável por cliente; tem exemplo preenchido. |
| `templates-whatsapp.md` | Respostas conversacionais + templates HSM (lembrete/confirmação) que a Meta exige aprovar. |
| `fluxo-n8n.json` | Workflow exportável: webhook → normaliza → IA → resposta / handoff. |

## Arquitetura (webhook → IA → resposta)

```
WhatsApp do cliente
      │  (mensagem recebida)
      ▼
[ Provedor: Cloud API / Z-API / 360dialog ]  ──webhook──►  [ n8n: Webhook ]
                                                                  │
                                                          Normalizar payload
                                                                  │
                                              ┌─── pediu "atendente"? ──► Notificar equipe (handoff)
                                              │
                                              ▼
                                        Lena (Claude)  ◄── system: prompt-base.md
                                              │              tools: consultar_agenda, criar_agendamento,
                                       Interpretar resposta        transferir_humano, ...
                                              │
                                ┌─── IA pediu transferir? ──► Notificar equipe (handoff)
                                │
                                ▼
                        Enviar resposta no WhatsApp
```

## Como rodar (piloto)

1. **n8n**: `Workflows → Import from File → fluxo-n8n.json`.
2. Definir variáveis de ambiente no n8n:
   - `ANTHROPIC_API_KEY` — chave da API Claude.
   - `LENA_SYSTEM_PROMPT` — conteúdo de `prompt-base.md` já preenchido para o cliente (§9 base de conhecimento).
   - `WA_SEND_URL` + `WA_TOKEN` — endpoint/credencial do provedor de WhatsApp.
   - `HANDOFF_NOTIFY_URL` — webhook do Slack/Telegram/e-mail da equipe.
3. Apontar o webhook do provedor para a URL do nó **Webhook** do n8n.
4. Aprovar os templates HSM (`templates-whatsapp.md` §2) no painel do provedor antes de enviar
   lembretes/confirmações de iniciativa da empresa.

## Lógica de "transferir para humano"

Dois caminhos (ambos terminam no nó **Notificar equipe**):

1. **Atalho determinístico** — o nó *Normalizar payload* detecta palavras como
   "atendente / humano / reclamação" e desvia ANTES de gastar uma chamada de IA.
2. **Decisão da IA** — o prompt-base (§5) instrui a Lena a chamar a tool `transferir_humano`
   em casos de: fora da base de conhecimento, irritação/urgência, dinheiro real, loop, ou
   pedido explícito. O nó *Interpretar resposta IA* detecta esse tool_use e desvia.

Quando transfere, a equipe recebe `{ telefone, nome, resumo, última mensagem }`. **A partir daí
o atendimento é humano** — numa v0.6 dá pra adicionar uma "trava" que pausa a IA para aquele
número por X horas (estado em Redis/DB) para a IA não responder por cima do atendente.

## Estado da conversa (limitação da v0.5)

O esqueleto envia 1 mensagem do cliente por vez (stateless). Para conversa multi-turno
de verdade (a Lena lembrar o que foi dito), a v0.6 deve:
- guardar o histórico por telefone (Redis, Supabase ou tabela do n8n);
- montar o array `messages` com os últimos N turnos antes de chamar a IA;
- aplicar `prompt_caching` no system (já está no fluxo) para baratear cada turno.

## Próximos passos (ver backlog.md)

- [ ] Implementar as tools de agenda (`consultar_agenda`, `criar_agendamento`, ...) — hoje são
      contratos no prompt; faltam os nós/integração com a agenda real (Google Calendar / sistema do cliente).
- [ ] Persistência de estado + trava de handoff (v0.6).
- [ ] WhatsApp Business Cloud API oficial (verificação Meta, display name).
- [ ] Demo Nível 2 (chat com LLM na página) reaproveitando este prompt-base.
