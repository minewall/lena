# Montagem no ElevenLabs Studio — roteiro clip-a-clip

Reel "A noite da Carla". Duração ~46s (definida pela sua locução). Formato
final **9:16, 1080×1920**.

## Assets (em `assets/`)
- Vídeos (8s cada, vamos cortar): `frame-1.mp4`, `frame-3.mp4`, `frame-4.mp4`,
  `frame-5.mp4`, `frame-6.mp4`
- Telas (imagem estática): `frame-2.png`, `frame-7.png`
- Locução: `audio/lena-loc-001.mp3` … `lena-loc-007.mp3`

## Passo 1 — trilha de áudio (define a régua)
Solte as 7 locuções **na ordem, uma após a outra** na faixa de voz:
loc-001 → 002 → 003 → 004 → 005 → 006 → 007.
Deixe um respiro de ~0,2s entre elas se quiser dar ar. Isso cria a linha do
tempo (~46s). **Tudo se alinha à voz.**

Durações reais (pra conferência):

| loc | dura | termina em |
|---|---|---|
| 001 | 5,0s | 0:05 |
| 002 | 8,2s | 0:13 |
| 003 | 9,0s | 0:22 |
| 004 | 5,5s | 0:28 |
| 005 | 3,2s | 0:31 |
| 006 | 10,8s | 0:42 |
| 007 | 4,1s | 0:46 |

## Passo 2 — faixa de vídeo (o que aparece em cada momento)

| Tempo | Locução (o que ela diz) | Tela | Corte / observação |
|---|---|---|---|
| 0:00–0:08 | loc-01 + início 02 ("Deixa eu te contar… achou o número") | **frame-1.mp4** | use os primeiros ~8s (a aflição dela) |
| 0:08–0:22 | fim 02 + loc-03 ("mandou mensagem… ninguém respondeu") | **frame-2.png** | entra quando ela "mandou mensagem". **Segura no silêncio** (~14s). Dê um zoom lento 1.0→1.05 pra não ficar parado |
| 0:22–0:25 | loc-04 ("De manhã, ela desistiu e foi trabalhar") | **frame-3.mp4** | corte a janela bolsa→porta |
| 0:25–0:31 | fim 04 + loc-05 ("o horário das nove ficou vazio… Eu não") | **frame-4.mp4** | sala vazia; **segura no "Eu não"** |
| 0:31–0:37 | loc-06 ("Eu sou a Lena. Não durmo… nove e quarenta e dois") | **frame-5.mp4** | ⭐ **CORTE-CHAVE**: a virada F4→F5 cai em "**Eu sou a Lena**". Use a janela onde o sorriso assenta |
| 0:37–0:40 | loc-06 ("…eu teria respondido na hora") | **frame-6.mp4** | o chá, a paz |
| 0:40–0:46 | loc-06 "E estava agendado" + loc-07 | **frame-7.png** | a tela entra em "**estava agendado**" e segura até o fim. A tagline na tela bate com loc-07. Zoom lento sutil |

**Os 3 sincronismos que fazem o vídeo funcionar:**
1. **F1→F2** quando ela "mandou mensagem" (~0:08).
2. **F4→F5** exatamente em "Eu sou a Lena" (~0:31) — é o pivô escuro→claro.
3. **F7** entra em "E estava agendado" (~0:40) — a confirmação aparece quando ela diz que foi agendado.

## Passo 3 — música
Faixa de piano discreta, baixinha, do 0:00 ao fim. Sobe **levíssimo na virada
(~0:31)** e resolve quente no F7. No **Eleven Music**, prompt sugerido:
```
gentle solo piano, intimate and warm, slow, a little melancholic, with a quiet
hopeful lift around the middle, minimal, cinematic, ~46 seconds
```
Volume bem abaixo da voz (a locução manda).

## Passo 4 — legenda e export
- Ative a **legenda automática** (Reels rodam sem som). Fonte limpa, embaixo,
  fora dos ~15% inferiores (a UI do Reels cobre).
- Export **9:16, 1080×1920**, MP4. Salve em `assets/final/reel-carla-v1.mp4`.

## Ajuste fino
Os tempos são guia — **confie no ouvido**. Se um corte não cair na palavra
certa, arraste ±0,5s. Os cortes-chave (F4→F5 em "Eu sou a Lena" e F7 em "estava
agendado") são os que não podem errar. Me manda o `reel-carla-v1.mp4` que eu
reviso ritmo, legenda e fecho a legenda do post pra publicar.
