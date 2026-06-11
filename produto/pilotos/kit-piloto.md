# Kit do Piloto — Lena (v1, 2026-06-10)

Material completo para rodar os 2 primeiros pilotos com clientes reais.
Objetivo do piloto: **provar valor medível em 30 dias** e sair com baseline,
números e depoimento para o site.

---

## 1. O programa (proposta para o piloto)

| Item | Condição |
|---|---|
| Duração | 30 dias corridos (renovável por mais 30 de comum acordo) |
| Plano | Profissional (1.500 conversas, 5 profissionais) **sem custo no piloto** |
| Implantação | Cortesia (nós configuramos o Cérebro junto com o dono) |
| Pós-piloto | Condição de fundador: **R$ 450/mês no 1º ano** (50% do Profissional), sem fidelidade |
| Contrapartida 1 | Responder o baseline (item 3) antes do go-live |
| Contrapartida 2 | 1 conversa de feedback por quinzena (15-20 min, WhatsApp ou call) |
| Contrapartida 3 | Depoimento com nome e negócio **se e somente se** estiver satisfeito — uso exclusivo no site lena.ia.br (decisão: não usamos em anúncios) |

Por que de graça: o que compramos com o piloto é **prova social + números reais
+ feedback de produto**. Vale mais que R$ 900.

## 2. Convite pronto (WhatsApp, tom pessoal)

> Oi, [nome]! Lembra que te falei da Lena, a recepcionista virtual que eu
> estou construindo? Ela atende no WhatsApp 24h, responde os clientes na
> hora, agenda sozinha e manda lembrete pra ninguém faltar.
>
> Tô abrindo 2 vagas de piloto antes de lançar e quero o [negócio] numa
> delas. Funciona assim: 30 dias sem custo nenhum, eu mesmo configuro tudo
> com você (leva 1 hora), e em troca você me conta o que funcionou e o que
> não funcionou. Se gostar, segue com 50% de desconto no primeiro ano.
> Se não gostar, desliga e fim, sem amarração.
>
> Topa? Te mostro funcionando em 5 minutos.

## 3. Baseline (coletar ANTES do go-live — é o que prova o ROI depois)

Preencher com o dono, sem cerimônia. Estimativas valem.

| Pergunta | Resposta |
|---|---|
| Quantas mensagens de WhatsApp o negócio recebe por dia (média)? | |
| Quem responde hoje? Em quanto tempo (média)? | |
| Quantas mensagens chegam fora do horário / fim de semana? O que acontece com elas? | |
| Quantos agendamentos por semana? Por qual canal? | |
| Quantas faltas (no-show) por semana? | |
| Faz lembrete de véspera hoje? Como? | |
| Ticket médio por atendimento/serviço? | |
| Já perdeu cliente por demora no retorno? Exemplo recente? | |
| Nota 0-10: quanto o WhatsApp do negócio te estressa hoje? | |

**Métricas automáticas a partir do go-live** (já instrumentadas na Central —
não pedir ao dono): conversas e mensagens, tempo de resposta da Lena,
agendamentos criados pela Lena (R$), taxa de automação (% respostas sem
humano), sentimento das conversas, trocas até o desfecho, funil hora×tipo,
custo de IA.

## 4. Checklist de onboarding (1 sessão de ~1h com o dono)

1. [ ] Criar o tenant na Central (segmento certo — define o seed do Cérebro)
2. [ ] **Cérebro · Dados gerais**: nome, horários reais, endereço, promoção atual
3. [ ] **Cérebro · Serviços**: cada serviço com preço e duração (alimenta agenda e o hero de receita)
4. [ ] **Cérebro · Tom e IA**: tom da casa (Acolhedor/Profissional/Descontraído)
5. [ ] **Cérebro · FAQ**: as 5-10 perguntas que mais chegam (pedir exemplos reais do WhatsApp dele)
6. [ ] **Cérebro · Limites**: o que a Lena NÃO pode falar + gatilhos de transferência
7. [ ] **Agenda · Profissionais**: equipe com cores + disponibilidade por dia/horário
8. [ ] **WhatsApp**: número dedicado do piloto (e-chip) conectado via Cloud API (`set_tenant_wa_config`); validar webhook com mensagem de teste
9. [ ] **Equipe**: convidar quem vai atender o handoff (papel operador)
10. [ ] Teste cego: 3 conversas simuladas (preço, agendamento, pergunta fora do escopo → transferência)
11. [ ] Go-live: divulgar o número (bio do Instagram, Google, plaquinha no balcão)
12. [ ] Agendar check-in de 7 dias

## 5. Rituais do piloto

- **D+1**: olhar todas as conversas do primeiro dia na Central; ajustar FAQ/limites com o que apareceu.
- **D+7, D+21**: check-in de 15 min (o que a Lena errou? o que surpreendeu?). Ajustar Cérebro na hora.
- **D+14, D+28**: enviar ao dono um resumo com números (conversas, agendamentos, R$ agendado pela Lena, tempo de resposta vs baseline).
- **D+30**: conversa de fechamento → baseline vs resultado → pedir o depoimento → oferta de fundador.

## 6. Acordo de depoimento (texto simples, mandar por WhatsApp mesmo)

> Combinado do depoimento: se você estiver satisfeito ao fim do piloto,
> você me autoriza a publicar um depoimento seu (nome, negócio e foto, se
> topar) **apenas no site lena.ia.br**. Nada de anúncio pago, nada de outros
> canais sem nova autorização. Pode revisar o texto antes de ir ao ar e pode
> pedir a retirada quando quiser.

## 7. Critérios de sucesso do piloto (nossos, internos)

- ≥ 70% das conversas resolvidas sem humano (taxa de automação)
- ≥ 5 agendamentos criados pela Lena no mês
- Tempo de resposta < 10s consistente
- Sentimento: ≥ 80% positivo/neutro
- Dono responde "sim" para: "você pagaria R$ 450/mês por isso?"
- Zero incidentes de resposta errada grave (preço inventado, horário inventado)

O que medir está pronto na Central — o piloto começa no dia em que o número conectar.
