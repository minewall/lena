# Lena — Unit Economics dos Planos (2026-06-09)

Modelo de custo por plano para travar o pricing da /precos. Todas as premissas explícitas — ajustar e recalcular quando houver dados reais dos pilotos.

## Premissas

**Câmbio:** R$ 5,50/US$ (conservador).

**Custo de IA por conversa** (conversa = atendimento completo de um cliente, ~10 respostas da Lena):
- Contexto por turno ~4K tokens (prompt da Lena + dados do negócio + histórico), ~85% servido do prompt cache (leitura = 10% do preço de entrada)
- Saída ~150 tokens por turno
- Preços (jun/2026): Haiku 4.5 = US$ 1/M entrada, US$ 5/M saída · Sonnet 4.6 = US$ 3/M, US$ 15/M

| Cenário | US$/conversa | R$/conversa |
|---|---|---|
| 100% Haiku | 0,016 | 0,09 |
| Mix 80% Haiku / 20% Sonnet (alvo) | 0,022 | **0,12** |
| 100% Sonnet (pior caso) | 0,048 | 0,26 |

**Custo de WhatsApp (Cloud API, Brasil, cobrança por mensagem):**
- Conversa de atendimento (cliente inicia, janela 24h): **R$ 0**
- Template utility (lembrete, confirmação): ~R$ 0,045/mensagem → ~R$ 0,09 por agendamento (lembrete + confirmação)
- Template marketing (campanhas de reativação): ~R$ 0,31–0,38/mensagem → **fora dos planos; add-on à parte**
- Premissa: 60% das conversas viram agendamento com lembrete+confirmação

## Margem por plano (preços atuais da página)

| | Essencial R$ 400 | Profissional R$ 900 | Premium R$ 1.800 |
|---|---|---|---|
| Cap de conversas/mês | 500 | 1.500 | 4.000 |
| IA (mix 80/20) | R$ 60 | R$ 180 | R$ 480 |
| Utility (lembretes) | R$ 27 | R$ 81 | R$ 216 |
| **Custo direto** | **R$ 87** | **R$ 261** | **R$ 696** |
| **Margem bruta** | **78%** | **71%** | **61%** |
| Margem no pior caso (100% Sonnet) | 64% | 54% | 30% |

Custos fixos por cliente (infra compartilhada Cloudflare/Supabase, número WhatsApp) são marginais nesta escala; implantação é cobrada à parte.

## Leituras

1. **Essencial e Profissional estão saudáveis** nos preços atuais, mesmo no pior caso de modelo.
2. **Premium é o frágil**: 61% no alvo, mas despenca para 30% se o uso pesar em Sonnet ou se a recorrência proativa (que é utility paga) for usada intensamente. É o plano de "profissionais ilimitados, várias unidades" — exatamente o perfil que abusa do cap.
3. **Anual (2 meses grátis = preço ×10/12)** derruba ~17% da receita; Premium anual no pior caso fica no vermelho operacional (R$ 1.500 − custos ~R$ 1.256 = margem 16%). Aceitável como exceção, perigoso como padrão.
4. **Campanhas à parte está correto**: R$ 0,31–0,38/mensagem de marketing torna inviável incluir no plano; precifica como pacote de créditos com margem própria (decisão já tomada: card removido da /precos em 2026-06-09).
5. Alavancas se o Premium apertar com dados reais: baixar cap p/ 2.000–2.500, cobrar pacote de lembretes excedentes, ou subir para R$ 1.900–2.000.

## Decisões (Roberto, 2026-06-09) — PRICING TRAVADO
- **Essencial R$ 400 · Profissional R$ 900 · Premium R$ 2.000** (anual = ×10/12: 333 / 750 / 1.667)
- Premium mantém cap de 4.000 conversas e lembretes inclusos; rever com dados reais dos pilotos (margem alvo 65%, pior caso ~37% no novo preço)
- "Multicanal" saiu do resumo do Premium; bullet virou "Instagram + chat no site" com selo **em breve** (mesmo padrão de "Atendimento por voz")
- Campanhas de reativação: fora dos planos, add-on à parte (card removido da /precos)

## Fontes
- Preços Claude: tabela oficial Anthropic (jun/2026)
- WhatsApp: Meta cobra por mensagem desde jul/2025; faixas BRL de
  https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing e
  https://www.uptail.ai/blog/whatsapp-business-api-pricing-2026-what-it-costs-and-how-billing-works
