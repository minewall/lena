# Produção — Reel "A noite da Carla" (Roteiro 1, Eixo A)

Pacote pronto para produzir. Cole os prompts nas ferramentas, gere a voz,
monte no CapCut. Formato: vertical 9:16, ~35s, Reels/Stories.

> **Regra de consistência (a chave de tudo):** todo prompt de imagem repete,
> sem mudar uma palavra, o **BLOCO PERSONAGEM** e o **BLOCO ESTILO**. Só a
> CENA muda. É isso que faz a mesma Carla aparecer em todos os frames.
> No Gemini/Nano Banana: gere o Frame 1, depois peça os outros como EDIÇÃO
> ("a mesma mulher, mesma roupa, agora…"). No Midjourney: gere o Frame 1, pegue
> a URL e use como `--cref <url>` nos demais.

---

## BLOCO PERSONAGEM (colar igual em todo frame de pessoa)

```
A 35-year-old Brazilian woman named Carla, warm light-brown skin, dark wavy
shoulder-length hair, soft natural everyday features, no heavy makeup, wearing
a mustard-yellow knit sweater. Real, relatable, not a model.
```

## BLOCO ESTILO (colar igual em TODOS os frames)

```
Photorealistic, shot on 35mm film, shallow depth of field, natural warm
lighting, cinematic candid moment, muted warm palette (cream, terracotta,
warm brown), authentic Brazilian home, no text, no watermark, no logos,
vertical 9:16 composition.
```
*(Midjourney: acrescente ao final de cada prompt `--ar 9:16 --style raw --v 7`;
e `--cref <url-do-frame-1>` nos frames 3, 5 e 6.)*

---

## OS FRAMES

### Frame 1 — A perda começa (21h40, cozinha à noite)
> [BLOCO PERSONAGEM] standing in a small São Paulo apartment kitchen at night,
> warm overhead light, dark window behind her, holding her phone, the exact
> moment she remembers something she forgot — a soft "oh no" expression, eyebrows
> lifting, slightly worried. Intimate, quiet. [BLOCO ESTILO]

### Frame 2 — A resposta automática · NÃO GERAR POR IA → MONTAR
Mockup de tela de WhatsApp (ou print do produto). Mensagem cinza recebida:
**"Olá! Nosso atendimento é de segunda a sexta, das 9h às 18h."** Sem resposta
depois. Horário 21h42. Montar no CapCut/Figma com a fonte real do WhatsApp.

### Frame 3 — A desistência (manhã seguinte, 7h50)
> [BLOCO PERSONAGEM] the next morning, dressed for work, soft morning light from
> the window, putting her phone into her bag with a small resigned sigh, a flicker
> of frustration. She gives up. [BLOCO ESTILO]

### Frame 4 — A perda consumada (o horário vazio)
> An empty treatment room / studio reception in the morning, just opened, soft
> daylight through the window, one empty chair, nobody there, quiet and still —
> the first slot of the day that stayed empty. No people. [BLOCO ESTILO]

### Frame 5 — A VIRADA (mesma cozinha, 21h42, resolvido)
> [BLOCO PERSONAGEM] same apartment kitchen, same night, same mustard sweater,
> same warm light — but now looking at her phone with a small relieved smile, a
> tiny exhale of relief, shoulders softening. [BLOCO ESTILO]
*(Idêntico ao Frame 1 em cenário/roupa/luz — só a EMOÇÃO muda, de aflição para
alívio. É o que faz o "e se" ler na hora.)*

### Frame 6 — O alívio (agendado)
> [BLOCO PERSONAGEM] setting her phone down on the kitchen counter, relaxed,
> reaching for a cup of tea, calm and content, the worry gone. [BLOCO ESTILO]

### Frame 7 — Tela final · NÃO GERAR POR IA → MONTAR
Fundo creme da marca + **avatar da Lena** (`lena-avatar.png` do produto) + balão
real de WhatsApp: **"Oi, Carla! Tenho 7h ou 7h30 amanhã. Qual prefere?"** +
a frase em lettering + `lena.ia.br`.

---

## ROTEIRO DE LOCUÇÃO (voz da Lena · cronometrado)

Direção geral de voz: **feminina BR, calorosa, calma, íntima — como quem conta
um segredo. Pausada. No "Eu não." a voz fica mais firme e baixa (o ponto de
virada). No fecho, sorriso na voz.**

| Tempo | Frame | Locução (PT-BR) | Direção |
|---|---|---|---|
| 0:00–0:04 | F1 | "Deixa eu te contar uma história. Acontece toda noite, em algum negócio." | íntima, convidativa |
| 0:04–0:12 | F1→F2 | "Nove e quarenta da noite. A Carla lembrou que precisava marcar a sessão. Achou o número. Mandou mensagem." | ritmo de inventário, sobe leve |
| 0:12–0:18 | F2 | "Nosso atendimento é das nove às seis. Ela esperou. Ninguém respondeu." | mais seca, a frustração |
| 0:18–0:23 | F3→F4 | "De manhã, ela desistiu e foi trabalhar. O horário das nove ficou vazio." | desce, melancólica · beat no fim |
| 0:23–0:27 | F4→F5 | "A recepcionista tem hora pra chegar. **Eu não.**" | PAUSA antes. "Eu não" firme, baixo |
| 0:27–0:33 | F5→F6 | "Eu sou a Lena. Não durmo, não tiro folga. Nove e quarenta e dois, eu teria respondido na hora. E estava agendado." | assume, confiante, quente |
| 0:33–0:37 | F7 | "Seus clientes não têm hora pra querer agendar. Eu também não." | sorriso na voz, fecho |

**Total ~37s.** Trilha: piano discreto, sobe levíssimo na virada (0:23).

### Config sugerida no ElevenLabs
- Criar voz por **Voice Design**: *"warm Brazilian Portuguese woman, early 30s,
  calm, friendly, intimate storyteller, natural, not robotic."*
- Modelo: **Multilingual v2** (melhor prosódia PT-BR).
- Stability ~55% · Similarity ~75% · Style baixo (0–15%).
- Gere frase por frase (controle de pausa melhor que o bloco inteiro).
- Salve como "Voz da Lena" → reutilizar em todas as peças.

---

## Reaproveitamento

- Os BLOCOS PERSONAGEM/ESTILO viram **template**: troque só a Carla e a cena
  para os outros roteiros (João/oficina, Renata/loja) mantendo a identidade
  visual da campanha.
- A "Voz da Lena" do ElevenLabs serve para todos os Reels.
- A versão **carrossel** usa os mesmos 7 frames como 7 slides + texto — sem
  voz nem montagem de vídeo.
