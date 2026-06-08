# Lena — Backlog

Itens deferidos para retomar depois.

## Próximo passo combinado
- [ ] Após validar demanda (10+ interessados via `/interesse.html`), partir para o sistema funcional.

## Central da Lena — em andamento (2026-06-06)
- [x] **E1** — fundação (monorepo, @lena/shared, Supabase lena-uno, scaffold da Central com magic link)
- [x] **E2** — cérebro da Lena (tenant_brains/services/faqs + UI em `/cerebro`)
- [x] **E3** — WhatsApp adapter + Cloud API (provisionado, número da Lena ao ar)
- [x] **E5** — motor IA ligado no WhatsApp real (Lena respondendo Sonnet 4.6 em ~4s)
- [x] **E5.3** — anti-loop, modo direto, memória do contato (notes via Haiku em background)
- [x] **Site v3 + marca v2 ao ar** (lena.ia.br + /precos com CTAs wa.me, avatar da Lena nova no WhatsApp Business)
- [ ] **E4** — inbox + handoff humano (em andamento agora)
- [ ] **E6** — agenda básica (Google Calendar)
- [ ] **E7** — relatórios essenciais
- [ ] **E8** — Painel Averse (super-admin) com dados reais
- [ ] **E10** — **Módulo de faturamento integrado com o Asaas** (cobrança recorrente dos tenants da Lena).
  - PSP escolhido: **Asaas** (decisão Q5, fase 2). Cobrança das mensalidades da Central (assinatura por tenant), não confundir com cobrança que o cliente final faz dos pacientes dele.
  - Escopo provável: criar customer no Asaas por tenant; planos/assinaturas (recorrência mensal); webhook Asaas → atualizar `subscription_status` do tenant (active/past_due/canceled); suspender acesso da Central quando inadimplente (grace period); link de cobrança Pix/boleto/cartão; recibos. Edge function `asaas-webhook` validando assinatura + idempotência (mesmo padrão do wa-webhook).
  - Modelo de dados: tabela `subscriptions` (tenant_id, asaas_customer_id, asaas_subscription_id, plan, status, current_period_end) + `invoices` (histórico). Guardar API key do Asaas em `tenant_secrets`/Vault, nunca no front.
  - UI: aba Configurações → Faturamento (plano atual, status, próxima cobrança, histórico, link p/ atualizar forma de pagamento). Painel Averse vê MRR/inadimplência.
  - Pré-requisito: definir os planos e o pricing antes de codar. Não bloqueia piloto (primeiros clientes podem ser cobrança manual).
- [ ] **Refactor pós-MVP:** mover webhook do WhatsApp de `https://<projeto>.supabase.co/functions/v1/wa-webhook` para domínio próprio (sugerido: `wa.lena.ia.br` via Cloudflare Worker proxy). Razão: independência do project ref, URL limpa em logs Meta. Não bloqueia E3.
- [ ] **Verificação Meta Business:** ajustar contrato social via Contabilizei (incluir e-mail e telefone) e completar Business Verification — destrava Embedded Signup multi-tenant. Não bloqueia piloto.

## Pendências para discutir/refinar antes do piloto comercial
- [ ] **Revisar regra de handoff por volume** (hoje: 10 msg/h vira modo direto, 20+ vira `paused`). Roberto quer testar com tráfego real antes de fechar os limites. Possíveis ajustes: limite por tenant em vez de global, janela diferente que 1h, sinal de qualidade de conversa antes de contar (mensagens curtas/repetidas não pesam igual a perguntas completas). Decisão depende de dados do piloto.
- [ ] **Sistema de flags e call-actions para o gestor.** Quando a Lena marca `paused` ou identifica algo que precisa atenção (cliente irritado, dúvida fora do brain, lead quente para fechar), o gestor precisa receber sinal claro do que fazer. Caminho a desenhar: tags automáticas por conversa (lead_quente / reclamação / agendamento_pendente / handoff_solicitado / fora_de_escopo), prioridade visual na inbox, ações sugeridas no detalhe da conversa ("ligar agora", "enviar proposta", "marcar reunião"). Pode envolver notificação por email/WhatsApp para o admin do tenant. Decidir entre regras fixas (rule engine) ou classificação com Haiku rápida no msg-processor.
- [x] **Sessão de restrições no brain (o que a Lena NÃO pode falar).** FEITO 2026-06-08: colunas `restrictions` + `escalation_triggers` em tenant_brains, bloco RESTRIÇÕES OBRIGATÓRIAS no prompt, aba Cérebro → Limites.
- [x] **Política de identificação pessoal no atendimento (público vs privado).** FEITO 2026-06-08: colunas `team_public` (jsonb nome/função) + `team_private`, bloco EQUIPE E IDENTIFICAÇÃO no prompt, mesma aba Limites com aviso de responsabilidade LGPD do contratante.

## Sessão de planejamento estratégico (2026-06-08) — 18 frentes levantadas por Roberto

**Prospecção / marketing (destrava captação)**
- [ ] **P1 — Atualizar a apresentação comercial** com a evolução: Lena agora AGENDA de verdade (tool use), respeita restrições, identifica equipe, tem inbox + dashboard pro gestor. Antes vendia "responde no WhatsApp"; agora é "recepcionista que agenda sozinha 24h".
- [ ] **P2 — Mockups de Agenda + Dashboard do cliente** prontos pra estampar no material (telas reais ou hi-fi). Depende de refinar essas telas (ver A1/D1).
- [ ] **P3 — Materiais visuais das redes** (Instagram, Facebook, LinkedIn) com avatar novo + copy atualizada. Kit: foto perfil, capa, 3-5 posts feed, stories destaque, banner LinkedIn.
- [ ] **P4 — Funil/workflow site → Lena**: rever jornada de lena.ia.br até a 1ª msg no WhatsApp. Mapear pontos de fricção, CTA, mensagem de entrada da Lena, /obrigado.html.
- [ ] **P5 — Campanha Instagram/Facebook com botão WhatsApp** (Click-to-WhatsApp Ads via Meta Ads Manager apontando pro número da Lena). Viável tecnicamente; precisa pixel/conta de anúncios + criativo. Brief de campanha.
- [ ] **P6 — Variações visuais do avatar da Lena** (roupa, cabelo preso/solto, feição/expressão) p/ usar em contextos diferentes sem repetir a mesma arte. Prompt p/ o design gerar set.

**Estratégia de segmentos (decisão de foco)**
- [ ] **S1 — Definir a lista inicial de quem atender, por PADRÃO OPERACIONAL e não por segmento.** Insight do Roberto: classificar por rotatividade de horários, agendamento por profissional/recurso, frequência/recorrência de atendimento — em vez de "salão x clínica x escola". Criar matriz segmento × contexto operacional → escolher 2-3 arquétipos pra afunilar a prospecção. Doc dedicado: `produto/segmentos-arquetipos.md`.

**Agenda v2 — o grande tema (evolução do E6, hoje mono-recurso)**
- [ ] **AG1 — Visões de calendário dia/semana/mês** na Central (hoje só lista "próximos"). Agenda visual estilo Google Calendar.
- [ ] **AG2 — Multi-profissional / multi-recurso:** vários agendamentos no MESMO horário com profissionais diferentes, cada um com cor própria. **Mudança de modelo de dados:** nova tabela `professionals` (ou `resources`), `appointments.professional_id`, disponibilidade por profissional, EXCLUSION constraint passa a ser por (professional_id, horário). É o item que mais mexe na arquitetura — destrava AG3, AG4 e parte do dashboard.
- [ ] **AG3 — Ausência pontual de profissional:** marcar que o profissional X não atende no dia Y → a Lena responde "fulano não tem agenda nesse dia" e oferece outro profissional/horário. Depende de AG2.
- [ ] **AG4 — Dias especiais / exceções:** negócio fechado, feriado, evento, horário diferente, dia promocional — override simples sobre a disponibilidade padrão. Tela "exceções do calendário".
- [ ] **AG5 — Lista de espera:** quando não há horário, cliente opta por entrar na fila / ser avisado se vagar. Regra de **antecedência mínima** pro aviso (cliente precisa se deslocar). Quando um horário é cancelado, Lena avisa o próximo da fila respeitando a antecedência. Tabela `waitlist`.

**Cérebro / RAG da Lena**
- [ ] **R1 — Onboarding do cérebro por perguntas de múltipla escolha** (como no Haile): guiar o gestor a montar o cérebro respondendo perguntas objetivas, em vez de texto livre. Melhora qualidade e reduz fricção no cadastro.
- [ ] **R2 — RAG em camadas:** resposta nível 1 (rápida, do prompt) + nível 2 (busca mais informação só quando a pergunta exige). Melhora latência e custo. Decidir: prompt em camadas vs busca vetorial (embeddings) sob demanda.
- [ ] **R3 — Lista de preços: mensagem vs JPEG/PDF.** Decisão de UX: lista curta → texto; lista longa → enviar imagem/PDF (WhatsApp suporta documento). Campo no cérebro pra anexar tabela de preços; Lena decide o formato. (resposta detalhada na conversa de 2026-06-08)

**Dashboard estratégico (evolução do E dashboard atual)**
- [ ] **D1 — Refinar dashboard do cliente** (pré-requisito do mockup P2).
- [ ] **D2 — Gráficos de indicadores estratégicos:** atendimentos fora do horário comercial, agendamentos fora x dentro do horário, tempo médio de resposta, qtde de interações, conversas resolvidas pela Lena x enviadas pra humano, taxa de conversão (conversa → agendamento). Precisa instrumentar eventos (ver C1).

**Conversas / ciclo de vida**
- [ ] **C1 — Definir variáveis de "conversa encerrada".** Critérios candidatos: agendamento confirmado, cliente se despediu, X horas sem resposta (timeout), handoff resolvido pelo humano, fora de escopo concluído. Vira um status + métrica (alimenta D2). (resposta com proposta na conversa de 2026-06-08)

**Pagamentos / sinal (compliance)**
- [ ] **PG1 — Envio de dados de Pix para sinal.** MVP: Lena envia a CHAVE PIX / QR Code copia-e-cola do PRÓPRIO negócio (valor de sinal configurável no cérebro) como INFORMAÇÃO — negócio recebe direto, sem custódia. Isso NÃO nos torna instituição de pagamento (não recebemos/repassamos fundos). Confirmação do pagamento é manual/pelo negócio. Fase 2 (quando E10/Asaas entrar): gerar link de cobrança Pix dinâmico via Asaas (PSP regulado) = totalmente compliant. NUNCA processar/custodiar dinheiro pela Lena. Respeitar WhatsApp Commerce Policy. (análise legal na conversa de 2026-06-08)

**Jurídico / Meta**
- [ ] **J1 — Atualizar Termos de Uso + Política de Privacidade + Confidencialidade** incluindo: que operamos sobre a WhatsApp Business Cloud API (Meta), tratamento de dados pessoais via Meta, conformidade com as políticas da Meta/WhatsApp, papel de operador/controlador (LGPD), e referências exigidas pela Meta. Revisão por advogado antes de publicar.

## Deferido — discutir em breve
- [x] **Lena v0.5 — automação inicial** → ver `automacao/` (esqueleto pronto p/ piloto, 2026-06-01)
  - [x] Prompt-base (system instruction) para Claude/GPT → `automacao/prompt-base.md`
  - [x] Template de respostas rápidas para WhatsApp Business App → `automacao/templates-whatsapp.md`
  - [x] Fluxo n8n/Make exportável (webhook → IA → resposta) → `automacao/fluxo-n8n.json`
  - [x] Lógica de "transferir para humano" quando foge do escopo → README §handoff
  - [ ] Pendente p/ v0.6: tools de agenda reais, estado multi-turno, trava de handoff
- [ ] **WhatsApp Business Cloud API**
  - Abrir MEI (se ainda não tem)
  - Verificação de negócio no Meta Business Manager (3-7 dias úteis)
  - Aprovação de Display Name (24-48h)
  - Decisão: Cloud API direto OU Z-API/360dialog (BSP)
- [ ] **Demo Nível 2** — sandbox real com LLM dentro da página (chat que chama Claude/GPT direto)
- [ ] **Demo Nível 3** — visitante digita telefone, recebe WhatsApp do Lena de verdade
- [ ] **Analytics** — Cloudflare Web Analytics (grátis, sem cookie banner)
- [ ] **OG image PNG** — exportar `og-image.html` para PNG 1200×630 e linkar nas metas
- [ ] **Tipografia + setor inicial** — afunilar campanha em UM nicho (sugestão: clínicas de estética/odonto)
- [ ] **Trust strip real** — substituir nomes-placeholder por logos de clientes reais quando tiver
- [ ] **Depoimentos reais** — após 3-5 clientes, fotos + cargo + quote no slot atual de "Para quem"
- [ ] **Política de Privacidade e Termos** — revisão por advogado antes de publicar campos `[entre colchetes]`
- [ ] **Snippet de redirecionamento WhatsApp → /obrigado.html** — para tracking de conversão

## Frentes em aberto (decisão de foco — 2026-06-01)
- ⏸️ **Parado por ora:** guia WhatsApp Business Cloud API (item #2) e Demo Nível 2/3 (item #3). Retomar depois.
- 🚀 **Frente ativa:** **Lead Generator** (`lead-generator/`) — prospecção B2B (salões, clínicas de estética, escolas, **petshops** SP — petshop adicionado 2026-06-01). MVP construído em 2026-06-01: scaffolding completo, Fase 1 (Google Places API), crawler Playwright, extractors (e-mail/WhatsApp/redes), classificação+score, export CSV, report HTML, CLI Typer, LGPD (opt-out + base legal), 9 testes passando. Decisões vs spec: Places API no lugar de scraping do Maps; LGPD como requisito de 1ª classe.
  - [ ] Pendente: Fase 6 (decisores via LLM) ainda desligada; rodar pipeline real com API key; escala via fila p/ 100k.
  - 📥 **Prospecção manual** (coletadas 2026-06-01, importar com `python -m src.cli import-prospects <arquivo>` quando o banco subir):
    - 50 clínicas de estética **SP** (CLINICA_ESTETICA) → `lead-generator/data/prospects_clinicas_sp.csv`
    - 34 clínicas de estética **Osasco** (CLINICA_ESTETICA) → `lead-generator/data/prospects_clinicas_osasco.csv`
    - 50 salões/cabeleireiros **SP** (SALAO_BELEZA) → `lead-generator/data/prospects_saloes_sp.csv`
    - 50 clínicas médicas **SP** + 25 **Osasco** + 20 **Campinas** (CLINICA_MEDICA) → `prospects_clinicas_medicas_{sp,osasco,campinas}.csv`
    - 30 petshops **SP** (PETSHOP, zonas Sul/Oeste/Norte; gerados via prompt na extensão Claude/Chrome — 28 com website p/ enrich) → `prospects_petshops_sp.csv`
    - 59 escolas **SP Zona Sul + Norte** (ESCOLA; subtipo em `observacao`: 11 Idiomas / 29 Colégio / 19 Curso) → `prospects_escolas_sp.csv` (faltam zonas Oeste/Leste/Centro)
    - 31 odontologia **SP Zona Sul** (ODONTOLOGIA; especialidade em `observacao`; 100% com website) → `prospects_odontologia_sp.csv` (faltam zonas Oeste/Norte/Leste/Centro)
    - 30 terapias **SP Zona Sul** (TERAPIAS; subtipo em `observacao`: 9 Psico / 9 Fisio / 5 Nutri / 7 Integrativas; 100% website) → `prospects_terapias_sp.csv` (faltam zonas Oeste/Norte/Leste/Centro)
    - Total: **379 leads** em 10 arquivos. Único segmento ainda sem coleta: IMOBILIARIA. Segmento na coluna `segmento`. Enum: SALAO_BELEZA, CLINICA_ESTETICA, CLINICA_MEDICA, ODONTOLOGIA, TERAPIAS, IMOBILIARIA, ESCOLA, PETSHOP, OUTROS (odonto/terapias/imobiliária add 2026-06-01; pousada foi removida a pedido).
    - ⚠️ Duplicatas cross-segment a resolver na importação: "MF Cabeleireiro" (salões) ≈ "MF Cabeleireiro / Clínica Estética"; "Clínica ComVida (Facebook)" (médicas Osasco) ≈ "Clínica ComVida" (estética Osasco). Campinas usa DDD (19).

## Ideias de produto (em desenho)
- 💡 **Add-on Campanhas de Reativação** (WhatsApp) — serviço extra, pacote de créditos mensal. v1 = reativação de base quente. Brief: `produto/campanhas-reativacao.md`. Depende do WhatsApp Cloud API (#2). Confirmar custo real Meta/BSP antes de fechar pricing.

## Site (reestruturado 2026-06-01 para validação)
- Reestruturado em 2 páginas de conversão: `/` (index.html) enxuta (hero resultado → diferenciais de recuperação de faturamento → demo clínica → como funciona → teaser planos → early adopter → FAQ → CTA) e `/precos` (precos.html, comparativo 3 planos + add-on campanhas "sob consulta"). Form `/interesse.html` enxugado (acaba após volume) + checkbox `interesse_campanhas`. OG/meta em todas; demo só clínica (com beat de sinal Pix); prova social = ângulo honesto de early adopter (sem depoimento/número falso). Recursos reais hoje: sinal Pix, reabastecimento/lista de espera, recorrência. "Relatório faturamento recuperado em R$" e "voz" = em breve.
- ⚠️ TODOs do site: (1) **token do Cloudflare Web Analytics** — placeholder `TOKEN_CLOUDFLARE` em index/precos/interesse/obrigado; conversão = views de /obrigado.html; (2) **OG image PNG 1200x630** — exportar de og-image.html e trocar o interino (assets/lena-avatar-1000.png).

## Notas de produto
- Margem do plano **Premium** (R$ 1.800 / 4.000 conversas) fica apertada se muitos lembretes utility. Considerar cobrar lembretes à parte ou reduzir cap para 2.000.
- Avaliar pricing por **resultado** (R$ X por agendamento confirmado) quando tiver dados reais de conversão.
