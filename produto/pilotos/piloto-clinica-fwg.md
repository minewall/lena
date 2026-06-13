# Piloto — Clínica FWG (Medicina e Performance)

Dossiê de prospecção (2026-06-10). Fontes: Instagram @clinicafwg, Econodata,
Doctoralia, busca CNPJ.

## A empresa

| Campo | Dado |
|---|---|
| Razão social | Clinica FWG Medicina e Perfomance Ltda (ME) |
| CNPJ | 23.796.273/0001-90 · ativa desde **06/12/2015** (~10 anos) |
| Sócios | **Felipe Walter Gomes** (sócio-admin; FWG = iniciais dele, tem LinkedIn) e Leonardo Henrique Fachini Bonrizk |
| Endereço | Alameda Min. Rocha Azevedo, 38 — sala 201, Cerqueira César (Jardins), São Paulo/SP, CEP 01410-000 |
| Telefone | (11) 97238-**** (final mascarado nas fontes públicas) |
| CNAE | 9313-1/00 — atividades de condicionamento físico |
| Instagram | [@clinicafwg](https://www.instagram.com/clinicafwg/) — "Medicina e Performance", ativo com reels |
| Doctoralia | [perfil](https://www.doctoralia.com.br/clinicas/clinica-fwg-medicina-e-performance) — especialidade clínica médica |

## O que fazem

Clínica multidisciplinar de saúde e performance esportiva: **medicina
esportiva, avaliação física, exames de força, bioimpedância, planos
nutricionais (nutrólogo + nutricionista), treino personalizado e estética**.
Posicionamento: "cuidar da saúde e bem-estar de forma completa e integrada".

## Por que é um piloto excelente para a Lena

1. **Agenda multi-profissional de verdade**: médico, nutri, preparador físico
   e estética = as colunas por profissional + agendamentos paralelos que
   acabamos de construir são exatamente o caso deles.
2. **Ticket alto, no-show caro**: Jardins/SP, consultas e avaliações de
   performance — cada falta dói; lembrete + confirmação é ROI direto.
3. **Público que escreve fora do horário**: quem treina manda mensagem 6h ou
   22h; a Lena 24h captura o que hoje espera até o dia seguinte.
4. **Serviços com duração definida** (avaliação, bioimpedância, consulta):
   encaixam direto em `tenant_services` com duração/preço.
5. **Segmento "clínica"** já é arquétipo nosso (a simulação institucional da
   Lena usa clínica como exemplo).

## Contato / interlocutora

**Jessica** — nosso alvo de conversa na clínica (info passada por ela ao
Roberto em 10/06). Felipe (sócio) entra depois, na decisão.

## Equipe confirmada (Jessica, 2026-06-10)

| Profissional | Qtde |
|---|---|
| Nutrólogos | **3** |
| Nutricionistas | 2 |
| Preparador físico | 1 |
| Biomédica | 1 |
| Fisioterapeuta | 1 |
| **Total** | **8 profissionais** |

Implicações:
- **Agenda com 8 colunas** — teste perfeito (e exigente) das colunas por
  profissional + paralelos. Cores por função ajudam (nutrólogos em tons
  próximos, etc.).
- **8 > 5**: estoura o limite do plano Profissional → a FWG é,
  na prática, perfil **Premium (R$ 2.000, profissionais ilimitados)**.
  No piloto roda sem custo; na conversa de fechamento a oferta de fundador
  deve referenciar o Premium (50% = R$ 1.000/mês no 1º ano), não o
  Profissional.
- Fisioterapeuta e biomédica reforçam os **limites de saúde** no Cérebro
  (nada de orientação clínica pela Lena).

## Pré-preenchimento do onboarding (validar com a Jessica na sessão de 1h)

- **Serviços** (chutes a confirmar): Consulta medicina esportiva · Avaliação
  física completa · Bioimpedância · Consulta nutrológica · Retorno ·
  Avaliação estética. Duração 30-60 min, preços a confirmar.
- **Equipe** (colunas da agenda): os 8 acima — coletar nomes e
  disponibilidade de cada um com a Jessica.
- **Tom**: Profissional (saúde, Jardins) — confirmar se preferem mais próximo.
- **FAQ provável**: preço da avaliação, aceita convênio? (provável não —
  particular/reembolso), estacionamento na Alameda, como funciona o programa,
  exames inclusos, quanto tempo até resultado.
- **Limites críticos (saúde!)**: a Lena NUNCA dá orientação médica,
  nutricional ou de treino; não interpreta exame; não fala de medicação.
  Tudo isso = transferir para humano. (Reforçar `restrictions` +
  `escalation_triggers`: dor, lesão, medicamento, exame, urgência.)
- **Baseline**: focar em (a) mensagens fora do horário comercial, (b) tempo
  até resposta hoje, (c) no-shows/semana em avaliações, (d) ticket médio.

## Próximos passos

1. Roberto: mandar o convite do kit (`kit-piloto.md` §2) para a **Jessica**,
   adaptado: trocar "negócio" por "clínica".
2. Sessão de onboarding de 1h com a Jessica (checklist do kit §4 + este
   pré-preenchimento; coletar nomes/disponibilidade dos 8 profissionais).
3. Número do piloto: e-chip dedicado (já comprado) ou número atual da clínica
   (decisão do Felipe — recomendo dedicado para o piloto).

---

## Demo na Central (criada 2026-06-12)

Tenant **"Clínica FWG · Medicina e Performance"** (slug `clinica-fwg`) no lena-uno,
pré-configurado para demonstrar pra Jessica:
- **Cérebro**: segmento Clínica, horários (placeholder), endereço (Jardins), tom
  Profissional, **limites de saúde** (Lena nunca dá orientação médica), gatilhos
  de transferência. Unidade primária cadastrada.
- **7 serviços** (medicina esportiva, avaliação física, bioimpedância, nutrológica,
  nutricionista, retorno, estética) com duração; **preço a confirmar** (null).
- **8 profissionais** (3 nutrólogos, 2 nutri, preparador, biomédica, fisio) =
  agenda de 8 colunas, o argumento de venda.
- **8 agendamentos** amanhã (8h–16h), **origem Lena**, espalhados pelos profissionais.
- **1 conversa** demo resolvida (Lena agenda uma avaliação) + 3 contatos.

**Acesso:** Roberto (bobcloud27@gmail.com) é admin do tenant → no seletor de
negócio da Central, troque para "Clínica FWG" e demonstre. Para a Jessica ter
login próprio, convide o **e-mail real dela** em Configurações → Equipe (login é
magic-link; e-mail fictício não recebe o link).

**A validar com a Jessica na sessão de 1h** (hoje é placeholder): preços, horários
reais, nomes dos 8 profissionais e disponibilidade, estacionamento, FAQ.
