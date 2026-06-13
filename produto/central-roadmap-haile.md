# Central da Lena — roadmap de evolução (inspiração Haile)

Análise dos 13 ajustes pedidos por Roberto (2026-06-13). Esforço: **P** (pequeno,
~horas), **M** (médio, ~1 dia), **G** (grande, vários dias). Benefício: alto/méd/baixo.
Princípio transversal (#11): **tudo clicável + mobile/touch** — aplicar em cada tela.

## Matriz esforço × benefício

| # | Item | Esforço | Benefício | Onda |
|---|---|---|---|---|
| 7 | Idade da Lena (faixa deslizante 18→48, de 4 em 4) | P | Méd | 1 |
| 4 | Especialidades da equipe | P/M | Alto | 1 |
| 12 | Formas de pagamento (Pix, dados bancários; boleto via API depois) | P/M | Alto | 1 |
| 1 | Serviços em lista clicável (editar na linha, estilo lançamentos) | M | Alto | 1 |
| 9 | Agendamentos futuros + tags/filtros (retorno, sessão 1/x, 1ª vez, especiais) | M | Alto | 2 |
| 5 | "Recados da Lena" (insights de atendimento, qualidade de dados, ações) | M/G | Alto | 2 |
| 2 | Cadastro de produtos + estoque (Lena calcula disponibilidade) | M/G | Méd/Alto | 2 |
| 3 | Vínculos de serviço (requisito/incluído/complemento) + preço condicional | G | Méd/Alto | 3 |
| 6 | Relatórios como hub de cards (operacional, performance, comportamento, qualidade, análise da Lena) | G | Méd/Alto | 3 |
| 8 | Configurações: aparência, notificações, backup, privacidade & LGPD, sobre | M | Méd | 3 |
| 10 | Metas (serviços, produtos, agenda por horas/eficiência) estilo Haile | G | Méd | 4 |
| 13 | Pontos/fidelidade (estrelas por pontos, pontos por valor gasto) | G | Méd | 4 |
| 14 | Indicadores de monitoramento/infra (admin) | — | — | **backlog** |

## Solução técnica (1 linha cada)

1. **Serviços em lista** — refatora `Cerebro/Servicos.tsx` de cards para tabela
   clicável + drawer/painel de edição na linha (mesmo padrão de lançamentos do
   Haile). Reusa o catálogo já feito (categorias/campos ricos).
2. **Produtos + estoque** — nova tabela `tenant_products` (nome, preço, estoque,
   categoria, ativo) + tela em lista + wiring no prompt (Lena sabe estoque e
   recusa/encaminha quando zerado).
3. **Vínculos de serviço + preço condicional** — ver pesquisa abaixo. Tabela
   `tenant_service_links` (service_id, linked_service_id, kind ∈
   requisito/incluído/complemento, price_mode ∈ mantém/desconto%/preço_fixo,
   price_value). UI dentro do serviço: seção "Serviços vinculados".
4. **Especialidades da equipe** — `tenant_staff` ganha `specialties text[]` (e o
   vínculo staff↔serviços da fase Equipe). Wiring no prompt.
5. **Recados da Lena** — superfície de insights no Hoje/dashboard. Regras + 1
   chamada Haiku diária que gera 2-3 recados (ex.: "12 clientes sem retorno há
   30d", "3 serviços sem preço", "amanhã tem 4 encaixes livres às 9h").
6. **Relatórios hub** — `Relatorios.tsx` vira grade de cards; cada card abre um
   relatório (rota própria): Operacional, Performance, Comportamento, Qualidade,
   Análise da Lena. Reusa o `attendance_report` e novos RPCs por relatório.
7. **Idade da Lena** — slider em `Cerebro/Tom.tsx` (18,22,…,48 + "48+"), salvo no
   brain; wiring no prompt (faixa etária molda o tom).
8. **Configurações sub-abas** — novas telas sob `/configuracoes` (aparência:
   tema; notificações; backup: export de dados; privacidade & LGPD: retenção/
   exclusão; sobre: versão). Algumas reais, outras scaffolding.
9. **Agenda futura + tags** — view de próximos compromissos + filtros/tags por
   tipo (retorno, sessão N/X — vem do catálogo `default_sessions` —, 1ª vez,
   evento especial). Tag derivada + manual.
10. **Metas** — nova `tenant_goals` (escopo: serviço/produto/agenda, período,
    alvo, base: receita/qtde/horas/eficiência) + cards de progresso estilo Haile.
11. **Clicável + mobile** — transversal: linhas/cards/elementos clicáveis, alvos
    ≥44px, layout responsivo (sidebar vira drawer, tabelas viram cards no mobile).
12. **Pagamentos** — `tenant_brains.payments` (jsonb) já existe; UI pra Pix +
    dados bancários; wiring no prompt (Lena informa como pagar). Boleto via API =
    fase futura (gateway).
13. **Fidelidade/pontos** — `tenant_loyalty_config` + `contact_points`; pontos por
    valor gasto, classificação por estrelas. Lena cita saldo/benefício. Opt-in.

## Pesquisa do #3 (sub-serviços/requisitos + preço condicional)

Plataformas modernas (Fresha, Anolla, AppBeleza, Gendo) **já fazem** as peças:
**add-ons/bundles** (corte+cor), **pacotes** e **preço dinâmico por regra**
(horário, ocupação, fidelidade). O "**pré-requisito obrigatório**" (limpeza antes
da obturação) é menos padronizado como recurso nomeado, mas é coberto por
"add-ons obrigatórios".

**Conclusão:** não reinventar — seguir o padrão de **add-on/vínculo de serviço**,
simplificado. Um serviço lista "serviços vinculados" com **tipo** (requisito /
incluído / complemento) e **ajuste de preço** (mantém / desconto % / preço fixo
no combo). Reaproveita o conceito dos `tenant_combos` já criados. A Lena usa:
"para o clareamento, a limpeza é obrigatória; fecho os dois por R$ X". UI: uma
seção dentro do serviço, com no máximo 3 campos por vínculo.

Fontes: fresha.com/pricing, anolla.com/en/best-salon-software, appbeleza.com.br,
gendo.com.br.

## Ondas de execução (com paralelização)

Cada onda: agentes paralelos por módulo independente; **eu valido tudo (build +
preview) antes de commitar**. Itens que tocam tipos/prompt compartilhados são
sincronizados por mim no fim.

- **Onda 1 — quick wins + base** (paralelo: 7, 4, 12; depois 1):
  idade, especialidades, pagamentos (independentes) + serviços-em-lista. Já
  aplica o princípio clicável/mobile (#11) nas telas tocadas.
- **Onda 2 — profundidade + valor proativo** (paralelo: 9, 5, 2):
  agenda futura+tags, Recados da Lena, produtos+estoque.
- **Onda 3 — análise + gestão** (paralelo: 6, 8; depois 3):
  relatórios-hub, configurações sub-abas, vínculos de serviço (mais sensível).
- **Onda 4 — diferenciais** (paralelo: 10, 13):
  metas, fidelidade.
- **Backlog:** #14 monitoramento/infra admin.

## Observação de produto
Produtos+estoque (#2), pagamentos (#12) e fidelidade (#13) empurram a Lena de
"recepção" para **operar o negócio** (a virada que você definiu). Faz sentido
priorizá-los acima de metas/fidelidade puro-marketing.
