# Lena — Templates de resposta (WhatsApp)

Dois usos distintos:

1. **Respostas conversacionais** — sugestões de redação para o LLM/atendente. Texto livre,
   pode ser enviado a qualquer momento da conversa (janela de 24h aberta).
2. **Templates HSM (utility)** — mensagens que a empresa INICIA fora da janela de 24h
   (lembrete, confirmação). Precisam ser **pré-aprovadas** no WhatsApp Business / Cloud API.
   Marcadas com 🔒. Variáveis no formato `{{1}}`, `{{2}}` exigido pela Meta.

> Tom: ver `prompt-base.md` §2. Curto, caloroso, no máx. 1 emoji.

---

## 1. Conversacionais (texto livre)

### Saudação inicial
> Oi! Aqui é a Lena, assistente da {{negócio}} 😊 Como posso te ajudar?

### Pedir o nome
> Pra começar, como posso te chamar?

### Cliente fez uma pergunta respondida pela base
> {resposta direta e curta}. Quer que eu já veja um horário pra você?

### Oferecer horários (após consultar_agenda)
> Tenho esses horários com a {{profissional}}:
> 🗓️ {opção 1}
> 🗓️ {opção 2}
> 🗓️ {opção 3}
> Qual fica melhor?

### Confirmar agendamento
> Agendado! ✅ {serviço}, {dia} às {hora}, com {profissional}.
> Te mando um lembrete um dia antes. Até lá!

### Remarcar
> Sem problema. Seu horário atual é {atual}. Quer remarcar pra qual dia?

### Cancelar
> Cancelado ✅ Quando quiser remarcar, é só me chamar.

### Fora do escopo / não sei (antes de transferir)
> Essa eu prefiro que uma pessoa da equipe te responda direitinho. Vou te passar pra alguém,
> só um instante 😊

### Encerramento
> Precisando de qualquer coisa, é só chamar. Tenha um ótimo dia! 👋

---

## 2. Templates HSM (utility) — 🔒 requerem aprovação Meta

> Categoria recomendada: **Utility** (mais barata e com alta aprovação por serem transacionais).
> Nome do template: snake_case. Idioma: pt_BR.

### 🔒 `lembrete_consulta` (utility)
```
Olá, {{1}}! Lembrete da {{2}}: você tem {{3}} amanhã, {{4}}, às {{5}}, com {{6}}.
Responda *CONFIRMO* pra confirmar, ou *REMARCAR* se precisar mudar. 🗓️
```
Variáveis: 1=nome, 2=negócio, 3=serviço, 4=dia, 5=hora, 6=profissional.

### 🔒 `confirmacao_agendamento` (utility)
```
{{1}}, seu horário na {{2}} está confirmado: {{3}}, {{4}} às {{5}}, com {{6}}. ✅
Qualquer mudança, é só responder por aqui.
```

### 🔒 `remarcacao_sugerida` (utility)
```
Oi, {{1}}! Vi que não conseguimos confirmar seu horário de {{2}}. Quer que eu veja
outras opções? É só responder *SIM*. 😊
```

### 🔒 `pos_atendimento` (utility) — opcional
```
Oi, {{1}}! Como foi seu atendimento na {{2}} hoje? Sua opinião ajuda a gente a melhorar.
```

---

## 3. Palavras-gatilho (atalhos do cliente)

Reconhecer e tratar mesmo com variações/acentuação:

| Cliente digita | Ação |
|---|---|
| CONFIRMO / confirmar / sim, confirmo | marcar presença = confirmada |
| REMARCAR / remarcar / mudar horário | iniciar fluxo de remarcação |
| CANCELAR / cancelar / não vou poder | iniciar fluxo de cancelamento |
| ATENDENTE / humano / falar com alguém / pessoa | `transferir_humano` |
| PARAR / SAIR / não quero mais mensagens | registrar opt-out e parar HSM |

> **Opt-out** é obrigatório por política da Meta: ao receber PARAR/SAIR, confirme a saída e
> não envie mais templates de iniciativa da empresa para esse número.
