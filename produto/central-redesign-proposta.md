# Central da Lena — Proposta de redesign (2026-06-10)

Mockup: `_ref/central-skin-v1.png` (fonte: `/tmp/central-skin-mockup.html`).

## Pesquisa — o que os melhores fazem

**Segmento (agenda/beleza/serviços):** Fresha e Booksy dominam com sidebar escura +
conteúdo claro, agenda como coração do produto, fluxo de agendamento < 60s e
lembretes automáticos como argumento central. A Fresha passou de 1M downloads/mês
em 2026 — é a régua visual do segmento.

**Atendimento WhatsApp BR (Letalk, Huggy, Blip):** inbox central como tela-mãe,
kanban de funil integrado às conversas, automação visível. Validam nosso par
Conversas + Prospecção.

**SaaS moderno (Linear, Stripe, Notion):** command palette (⌘K) como navegação
primária quando o produto cresce; progressive disclosure (mostrar pouco, revelar
quando precisa); interfaces que se adaptam ao papel do usuário (operador vê
operação, dono vê números).

**Haile (nosso outro produto):** padrões estruturais que já validamos —
insight contextual da IA na primeira linha de cada tela (1 linha + 1 ação + ×),
hero card com glow para a métrica-herói, números tabulares com tracking negativo,
labels uppercase 9-10px, chips/badges com alpha da cor, clique direto (linha
inteira clicável, ações dentro do modal), zero emoji (Lucide inline), empty
states com personalidade.

## Decisões de identidade

- **Paleta continua a da Lena** (creme/café/terracota/sálvia) — o dark ink/indigo
  é assinatura do Haile, não nossa. O que muda é o USO da paleta.
- **Sidebar vira café escuro** (#241B15, como as seções escuras do site): contraste
  premium, terracota ganha força como cor de ação, identidade alinhada ao site.
- **Tipografia (decisão Roberto, 2026-06-10): Montserrat (display/números) +
  Open Sans (corpo)** — sans comercial, separa a Central da cara editorial do
  site (que mantém Bricolage+Hanken). `tabular-nums` e tracking apertado em números.

## Status de aplicação
- ✅ **Fase 1 (shell) aplicada em 2026-06-10**: sidebar café com 3 grupos +
  ícones Lucide inline (icons.tsx), tenant switcher com avatar/segmento,
  topbar com breadcrumb + ação "Agendar", rodapé com usuário/papel/sair,
  fontes trocadas, terracota alinhado ao selo (#E35B2E), "Visão geral"→"Hoje",
  "Tenants"→"Clientes Averse". Busca ⌘K ficou para a Fase 4 (não shipar UI morta).
- ✅ **Fase 2.5 (conversas + sub-barra) aplicada em 2026-06-10**:
  - Migration `conversation_lifecycle_tags_lgpd` (registrada 20260610033453):
    lifecycle open/resolved/archived em conversations, tenant_tags +
    conversation_tags (RLS), lgpd_requests, trigger de reabertura por mensagem
    inbound, housekeeping via pg_cron (auto-resolve 48h / auto-arquiva 30d).
    Eliminação automática de transcripts (retenção 24m/5a) NÃO agendada —
    decisão explícita, ativar quando a política de privacidade dos tenants
    estiver publicada.
  - UI Conversas: abas Abertas/Resolvidas/Arquivadas, filtro e chips de tag,
    criação de tag inline, ações Resolver/Reabrir/Arquivar no Detail.
  - SubNav (componente) no padrão Haile aplicado em Cérebro (Negócio/
    Atendimento) e Configurações (Negócio/Integrações/Time).
  - Tipos do @lena/shared atualizados (novas tabelas/colunas/enum).
- Fase 2 (Hoje: Lena inline + hero "Receita recuperada" + agenda do dia +
  conversas recentes) — próxima. Memória por contato (resumo derivado p/
  contexto da Lena) entra junto: transcript bruto expira, resumo persiste,
  eliminação LGPD apaga os dois em cascata.

## Organização da navegação (IA)

Hoje: 8 itens soltos misturando operação do tenant, configuração e plataforma.

Proposta — 3 grupos com labels uppercase:

| Grupo | Itens | Nota |
|---|---|---|
| **OPERAÇÃO** | Hoje (ex-Visão geral) · Conversas (badge não-lidas) · Agenda · Clientes | dia a dia do operador |
| **LENA** | Cérebro · Configurações | setup do negócio (admin) |
| **AVERSE** | Prospecção · Clientes Averse (ex-Tenants) | platform admin only |

Mais:
- Tenant switcher rico no topo (avatar com inicial + segmento + plano).
- Ícones Lucide inline em todos os itens (mata o 👥 emoji).
- Rodapé com avatar do usuário + papel.
- "Hoje" substitui "Visão geral": dashboard orientado a ação do dia
  (agenda de hoje + conversas recentes), não só métricas.
- **Lena inline** no topo de cada tela: insight contextual + 1 ação
  ("3 conversas esperam resposta… quero chamar a lista de espera?").
  É a Lena cuidando do dono — mesmo princípio do Haile inline.
- **Hero card "Receita recuperada"**: a métrica que vende o produto
  (faltas evitadas + lista de espera) vira protagonista do dashboard.
- ⌘K (command palette): registrar como evolução futura, não no primeiro corte.

## Plano de aplicação (fases)

1. **Shell** — sidebar escura com grupos + ícones, topbar (busca + ação rápida),
   tokens novos no global.css. Toca só Layout.tsx + tokens. Maior impacto visual.
2. **Hoje** — dashboard reorganizado: Lena inline, hero card, KPIs, agenda do dia,
   conversas recentes. (Dados: dashboard.ts já tem quase tudo; receita recuperada
   precisa de query nova.)
3. **Padrões de componente** — chips/badges/empty states/tabela densa aplicados
   página a página (Clientes, Agenda, Cérebro, Prospecção, Tenants).
4. **⌘K + refinos** — command palette, dark mode opcional, responsivo mobile.

## Fontes
- https://www.fresha.com/for-business/salon/best-salon-software
- https://www.saasui.design/blog/7-saas-ui-design-trends-2026
- https://www.gitnexa.com/blogs/saas-dashboard-ux-patterns
- https://letalk.com.br/ · https://www.huggy.io/pt-br/whatsapp
- Skill haile-design (sistema consolidado 2026-05-26)
