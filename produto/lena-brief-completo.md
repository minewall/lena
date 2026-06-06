# Lena — Brief Completo do Projeto

Documento de conhecimento para consultoria de mercado, marketing e negócios B2B.
Última atualização: 2026-06-01. Fonte de verdade do produto; se algo não estiver aqui, não foi definido.

---

## 1. O que é a Lena (em uma linha)
Uma **assistente de IA que atende clientes, tira dúvidas e agenda compromissos automaticamente pelo
WhatsApp, 24 horas por dia**, para pequenas e médias empresas brasileiras de serviço.

Promessa central: **parar de perder cliente por demora no atendimento e por falta**, sem precisar de
ninguém colado no celular e sem o dono entender de tecnologia.

## 2. Contexto e empresa
- Marca: **Lena** (antes chamada "Lyle"; rebrand concluído). Persona feminina ("a Lena").
- Domínio: **lena.ia.br**. Site institucional no ar (Cloudflare Pages).
- Empresa: **AVERSE TECNOLOGIA LTDA**.
- Identidade visual: terracota (#D9613A), creme (#FBF3E7), sálvia/verde (#4E9E78), café (#241B15).
  Wordmark "lena." em minúsculas, tom caloroso e humano.

## 3. Problema que resolve (dor do cliente)
PMEs de serviço no Brasil vivem do WhatsApp, mas:
- Perdem lead quando demoram a responder (cliente vai para o concorrente que respondeu primeiro).
- Perdem faturamento com **faltas** (no-show) por falta de lembrete/confirmação.
- O dono/recepção fica refém do celular, atendendo fora do horário, no fim de semana, à noite.
- Não têm visibilidade (quantos atendimentos, taxa de agendamento, horários de pico).

## 4. O que a Lena faz (recursos)
- **Responde dúvidas** com a informação real do negócio (horários, valores, serviços, convênios).
  Não inventa: quando não sabe, assume e transfere para um humano.
- **Agenda compromissos**: consulta a agenda, oferece horários livres, confirma e bloqueia em tempo
  real (Google Calendar, sistema próprio ou planilha). Sem dupla marcação.
- **Lembra e confirma** 24h antes (reduz faltas); remarca/cancela com um toque.
- **Qualifica leads** antes de passar para a equipe.
- **Transfere para humano** quando foge do escopo, sem deixar o cliente no vácuo.
- **Relatórios** de volume, taxa de agendamento e horários de pico.

Diferencial central: **não é um chatbot de árvore de decisão**. É IA treinada no negócio do cliente,
fala PT-BR natural, e (no add-on de campanhas) **dispara E responde**, o que disparadores comuns não fazem.

## 5. Planos e preços (atuais)
Cobrança mensal; plano anual equivale a "2 meses grátis". Implantação única a partir de **R$ 1.500**.
Sem fidelidade, cancela quando quiser.

| Plano | Mensal | Anual (por mês) | Limite | Destaques |
|---|---|---|---|---|
| **Essencial** | R$ 400 | R$ 333 | até 500 conversas/mês | Atendimento (FAQ), agendamento, lembretes, suporte e-mail |
| **Profissional** (mais escolhido) | R$ 900 | R$ 750 | até 1.500 conversas/mês | Tudo do Essencial + qualificação de leads, integração agenda/CRM, suporte 24h |
| **Premium** | R$ 1.800 | R$ 1.500 | até 4.000 conversas/mês | WhatsApp + Instagram + site, voz (em breve), painel + relatórios semanais, suporte no mesmo dia |

Observações de produto/margem:
- A **margem do Premium aperta** se houver muitos lembretes "utility" (custo por mensagem da Meta).
  Em aberto: cobrar lembretes à parte, reduzir o teto, ou repensar o empacotamento.
- Ideia em estudo: pricing por **resultado** (ex.: por agendamento confirmado) quando houver dados reais.

## 6. ICP e segmentos-alvo
Segmentos com encaixe forte (recorrência + agendamento + WhatsApp):
- **Clínicas e consultórios médicos** (caso de uso clássico: agenda + lembrete + redução de falta).
- **Clínicas de estética / odontologia**.
- **Salões de beleza / cabeleireiros / barbearias**.
- **Petshops** (banho e tosa = recorrência mensal; veterinário = agendamento). Forte para reativação.
- **Escolas e cursos particulares** (captação fora do horário comercial).
- Também citado no site: imobiliárias/corretores.

Nicho de afunilamento sugerido para a campanha inicial: **clínicas (estética/odonto) e petshops**, pela
recorrência e pela dor clara de no-show. Decisão de foco ainda em aberto.

Perfil do decisor: dono(a) da PME ou gestor(a)/recepção. Decisão rápida, sensível a preço, precisa ver
valor concreto (menos falta, mais agendamento). Compra por WhatsApp e indicação.

## 7. Posicionamento e mensagem (atual)
- Headline do site: "Seu negócio respondendo e agendando 24h por dia."
- Tom: caloroso, humano, anti-jargão. "Funcionando em poucos dias, sem precisar entender de tecnologia."
- Provas/argumentos: responde em segundos, PT-BR natural, não inventa, reduz faltas pela metade.
- Em aberto: a marca ainda não tem clientes/depoimentos reais publicados (há placeholders).

## 8. Funil e validação
- Página de captação: **/interesse.html** (formulário conversacional estilo WhatsApp que coleta nome,
  e-mail, WhatsApp, tipo de negócio, volume de mensagens e sugere o plano; integra Formspree).
- **Gate de validação combinado**: atingir **10 ou mais interessados reais** antes de investir pesado no
  sistema funcional. (Validação de demanda ainda não atingida.)
- Tracking/analytics ainda não instalado (Cloudflare Web Analytics planejado).

## 9. Motor de aquisição (já em construção)
### 9.1 Lead Generator (prospecção B2B própria)
Sistema em Python/PostgreSQL que constrói base própria de empresas a partir de dados públicos
(LGPD: legítimo interesse, opt-out, minimização). Coleta nome, contato, redes, classifica segmento
e dá um score de qualidade do lead (0 a 100). Hoje com **229 leads** coletados manualmente
(clínicas de estética e médicas, salões; SP, Osasco, Campinas) e crescendo.
Objetivo: alimentar a prospecção da Lena com leads segmentados e priorizados.

### 9.2 Add-on de Campanhas de Reativação (WhatsApp) — em desenho
Serviço adicional contratável (pacote de créditos mensal) para **reativar a base de clientes** do
contratante via WhatsApp (ex.: "faz 30 dias do último banho do seu pet, quer agendar?").
Diferencial: a Lena dispara E responde/agenda. Posicionamento: "campanhas sem queimar seu número".
Depende do WhatsApp Business Cloud API e de templates de marketing aprovados pela Meta.
Risco central: marketing sem opt-in derruba a reputação e pode banir o número do cliente, por isso os
guardrails (opt-in, frequency cap, pausa automática por qualidade) são vendidos como recurso.

## 10. Infraestrutura e dependências
- **WhatsApp Business Cloud API**: pré-requisito para operar de verdade e para o add-on de campanhas.
  Exige MEI/empresa, verificação no Meta Business Manager (prazo de dias), aprovação de display name,
  e decisão entre Cloud API direto ou via BSP (ex.: Z-API, 360dialog). Ainda não iniciado.
- Automação inicial (v0.5) já existe em esqueleto: prompt-base da IA, templates de WhatsApp, fluxo
  n8n (webhook -> IA -> resposta) e lógica de transferência para humano.

## 11. Mercado brasileiro (contexto que importa para a estratégia)
- WhatsApp é praticamente universal entre consumidores e PMEs no Brasil; é o canal de venda e
  atendimento padrão. Isso é a favor da Lena (não precisa mudar o hábito do cliente).
- PME brasileira é sensível a preço, decide rápido e valoriza prova concreta (ROI em falta/agendamento).
- Concorrência: chatbots genéricos, plataformas de atendimento (multiatendimento), disparadores de
  WhatsApp, e o "fazer na mão" (status quo). O diferencial da Lena é IA que entende o negócio + agenda
  + responde, não árvore de decisão.
- LGPD e políticas da Meta (opt-in, categorias de mensagem, qualidade do número) são restrições reais.

## 12. Status atual (2026-06-01)
- Site institucional e página de interesse no ar e revisados (copy, ortografia, gênero da marca).
- Automação v0.5 (prompt-base, templates, fluxo n8n) em esqueleto.
- Lead Generator funcional para importar/enriquecer; 229 leads na base.
- Add-on de campanhas desenhado (brief), aguardando WhatsApp API.
- Pendências grandes: validar demanda (10+ interessados), montar WhatsApp Cloud API, fechar foco de nicho.

## 13. Perguntas em aberto (onde preciso de ajuda)
**Posicionamento e nicho**
- Devemos afunilar em 1 ou 2 nichos para a campanha inicial? Quais (clínicas? petshops?) e por quê?
- Como diferenciar a Lena de "mais um chatbot" na cabeça do dono da PME?

**Precificação e empacotamento**
- A grade R$ 400 / 900 / 1.800 está adequada ao poder de compra e à percepção de valor da PME BR?
- Como resolver a margem do Premium (lembretes utility)? Cobrar à parte, mudar tetos, mudar lógica?
- Como precificar o add-on de campanhas (pacote de créditos) com margem saudável?
- Faz sentido testar pricing por resultado (por agendamento) em algum momento?

**Aquisição e canais**
- Melhor mix de canais para chegar à PME brasileira: prospecção ativa (nosso Lead Generator) via
  WhatsApp, tráfego pago, conteúdo/orgânico, indicação, parcerias (contadores, fornecedores do setor)?
- Qual deve ser o processo de vendas (self-service vs vendas consultivas) dado o ticket?
- Metas e métricas: que CAC, conversão de lead, ciclo de vendas e churn são realistas aqui?

**Validação e go-to-market**
- Como atingir e medir os 10+ interessados de forma rápida e barata?
- Qual a sequência de lançamento recomendada (oferta de early adopter, piloto pago, etc.)?

---

### Glossário rápido
PME (pequena e média empresa), ICP (perfil de cliente ideal), CAC (custo de aquisição de cliente),
LTV (valor do cliente no tempo), no-show (falta), BSP (provedor oficial de WhatsApp), HSM/template
(mensagem pré-aprovada da Meta), opt-in/opt-out (consentimento/descadastro).
