# Lena — Add-on: Campanhas de Reativação (WhatsApp)

> Direção de produto decidida em 2026-06-01. Serviço adicional contratável à parte dos planos.
> Posicionamento: **"campanhas de reativação inteligentes, sem queimar seu número"** — NÃO "disparador em massa".

## Por que
- Upsell natural (reusa número aprovado, templates e a IA conversacional da Lena).
- Nova linha de receita que NÃO infla a margem dos planos (resolve o aperto do Premium com lembretes utility).
- Diferencial: a Lena **dispara E responde/agenda** — disparadores comuns deixam o dono na mão na resposta.
- Dado de segmentação já existe na base da Lena (quem agendou, faltou, não volta há N meses).

## Escopo v1 — Reativação (base quente)
Recontatar SÓ quem já é cliente e já interagiu com o negócio (opted-in). Captação fria fica para depois (maior risco de ban/LGPD).

### Fluxo
1. Segmentação automática pela base (último atendimento, no-show, sem retorno há N meses, aniversário).
2. Curadoria de template marketing (aprovado Meta) + copy com o cliente.
3. Disparo agendado: respeita opt-in, frequency cap, janela de horário.
4. Lena responde os retornos e agenda (incluído — respostas caem na janela de 24h, hoje grátis).
5. Monitor de quality rating com **auto-pausa** se o número começar a cair.
6. Relatório de ROI: enviados → lidos → respondidos → agendamentos gerados.

## Cobrança — pacote de créditos mensal
1 crédito = 1 mensagem de campanha enviada (template marketing). Respostas da IA não consomem crédito.

| Pacote | Créditos/mês | Preço sugerido | R$/crédito |
|---|---|---|---|
| Start | 500 | R$ 350 | 0,70 |
| Plus | 1.500 | R$ 900 | 0,60 |
| Pro | 4.000 | R$ 2.000 | 0,50 |

- Custo base est. (Meta + markup BSP): ~R$ 0,25/msg — **confirmar com Meta + BSP escolhido**.
- Excedente avulso. Política de rollover de créditos a definir (não acumula OU rola 1 mês).

## Riscos / guardrails (centrais, não rodapé)
- Marketing = categoria mais cara da Meta + exige opt-in. Disparo sem consentimento derruba o quality rating (verde→amarelo→vermelho) e pode **banir o número do cliente** = perder o cliente inteiro.
- LGPD: marketing exige **consentimento** (base legal diferente da prospecção B2B do Lead Generator) + opt-out obrigatório.
- Guardrails como FEATURE: gestão opt-in/opt-out, frequency cap, auto-pausa por qualidade, horário inteligente.

## Dependências
- Requer WhatsApp Business Cloud API ativo (item #2 do backlog, ainda parado).
- Templates marketing pré-aprovados na Meta.

## Pendências de decisão
- [ ] Confirmar custo real por msg marketing (Brasil) com a Meta e com o BSP (Z-API/360dialog).
- [ ] Política de rollover de créditos.
- [ ] Validar números de margem após custo real.
- [ ] Fases 2/3 (promoções pontuais; captação fria) só após número ganhar reputação.
