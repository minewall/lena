# Locução — voz da Lena (ElevenLabs)

## Passo 1 — criar a "Voz da Lena" (uma vez, reutilizável em tudo)

No ElevenLabs → **Voice Design**, prompt de voz:

> warm Brazilian Portuguese woman, early 30s, calm, friendly, intimate
> storyteller, natural and human, not robotic, gentle pace

- Modelo: **Eleven Multilingual v2** (melhor prosódia PT-BR).
- Settings: **Stability ~55% · Similarity ~75% · Style 0–15% · Speaker Boost on**.
- Salve como **"Voz da Lena"** → é o ativo oficial, use em todos os Reels.

## Passo 2 — gerar a locução (frase por frase)

Gere **um clipe por linha** (controle melhor de pausa que o bloco inteiro).
Salve como `assets/audio/loc-01.mp3` … `loc-07.mp3`. As reticências marcam
pausa; respeite-as.

| Arquivo | Texto (cole exatamente) | Direção de voz |
|---|---|---|
| loc-01 | "Deixa eu te contar uma história. Acontece toda noite, em algum negócio." | íntima, convidativa |
| loc-02 | "Nove e quarenta da noite. A Carla lembrou que precisava marcar a sessão. Achou o número. Mandou mensagem." | ritmo de inventário, sobe leve |
| loc-03 | "Nosso atendimento é das nove às seis. Ela esperou. Ninguém respondeu." | mais seca, a frustração |
| loc-04 | "De manhã, ela desistiu e foi trabalhar. O horário das nove ficou vazio." | desce, melancólica |
| loc-05 | "A recepcionista tem hora pra chegar… Eu não." | pausa antes de "Eu não"; firme e baixo |
| loc-06 | "Eu sou a Lena. Não durmo, não tiro folga. Nove e quarenta e dois, eu teria respondido na hora. E estava agendado." | assume, confiante, quente |
| loc-07 | "Seus clientes não têm hora pra querer agendar. Eu também não." | sorriso na voz, fecho |

Total falado ~32–37s. Se algum clipe sair com entonação errada, regenere só
ele (botão de re-roll do ElevenLabs) até acertar.

## Formato de saída

MP3 (ou WAV), 7 arquivos em `assets/audio/`. Se preferir um arquivo único,
gere contínuo e salve como `locucao.mp3` — mas o frase-a-frase facilita
alinhar com os cortes na montagem.
