# Visão guardada — Lena como copiloto operacional do dono

> Pitch do Roberto (2026-06-11), guardado para "um dia". Não é roadmap ativo —
> é o norte de para onde a Lena pode crescer depois que o core (atendimento)
> estiver validado pelos pilotos.

## A virada

- **Hoje:** Lena = front-office. Atende o **cliente do dono** no WhatsApp.
- **Amanhã:** Lena = front + back-office. Vira o **copiloto do dono** dentro da
  Central.

Conecta direto ao posicionamento (`posicionamento-dores.md`): não vendemos
canal, resolvemos o negócio. Atender o cliente é metade; tocar a operação é a
outra metade.

## Os três componentes do pitch

1. **Lena conversacional na Central (chat com tool-use, como o Haile).**
   O dono conversa e ela executa: "agenda a Maria amanhã 15h", "remarca todos
   de sexta", "quanto entrou essa semana?", "quem faltou esse mês?". A mesma
   tecnologia de tool-use que já domamos no `msg-processor` (consultar/criar/
   cancelar agendamento), agora apontada para o dono em vez do cliente.
2. **Comando de voz.** O dono está de mãos ocupadas no salão/clínica e *fala*:
   a Lena insere agendamento, registra pagamento, responde dúvida. STT
   (Whisper / ElevenLabs) + o mesmo loop de tool-use.
3. **Módulo de gestão financeira do negócio + lembretes de obrigações.**
   Entradas/saídas simples e — o diferencial — a Lena lembrando o DONO das
   obrigações DELE: DAS do MEI, aluguel, fornecedor, INSS, alvará. A Lena que
   lembra o cliente de não faltar passa a lembrar o dono de não esquecer as
   contas.

## Por que é poderoso

- **Sobe o "job" e o ticket:** de "não perco cliente" para "ela toca meu
  negócio". Justifica tier acima do Premium.
- **Lock-in / retenção:** quando a Lena vira cérebro operacional + financeiro,
  trocar dói muito mais.
- **Reaproveita o Haile:** chat copiloto com tool-use já é conhecimento nosso.
- **Re-significa a Central:** deixa de ser "painel de config" e vira "onde o
  dono opera o negócio falando com a Lena".

## Cuidados (quando for a hora)

- **Sequência:** só depois dos pilotos validarem o atendimento. Antes disso =
  dispersão fatal.
- **Escopo do financeiro:** começar pelo MÍNIMO (lembretes de obrigações +
  entradas/saídas), nunca virar ERP. Não é contabilidade — é organização +
  lembrete; complementa o contador, não substitui (mesma postura do Haile).
- **Não confundir com o Haile:** Haile = financeiro PESSOAL/família; isto =
  financeiro do NEGÓCIO (PME). Sinergia de tecnologia, produtos distintos.

## Onde já temos a fundação

- Tool-use server-side com Claude API: feito no `msg-processor`.
- Padrão de copiloto conversacional: feito no Haile.
- Central como backoffice multi-tenant com RLS: feito.
- Falta: camada de voz (STT) e o módulo financeiro (schema + UI).
