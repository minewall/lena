# Montar o Reel no ElevenLabs (Image & Video + Studio)

Alternativa ao CapCut: fazer **tudo no ElevenLabs**. Ele agora gera vídeo a
partir de **imagem de referência** (rodando Veo, Sora, Kling, etc.), faz
**lip-sync de foto** (avatar falante) e junta os clipes com a **sua locução já
gravada** na timeline do **Studio**, exportando 9:16 com legenda. Beta, exige
plano pago para vídeo.

> ⚠️ **Carla × Lena (leia antes de subir foto).** Nos frames 1, 3, 5 e 6 quem
> aparece é a **Carla, a cliente** — a Lena é a **voz** (narradora). A foto da
> Lena NÃO é a referência desses planos; a referência deles é a **Carla**
> (a mesma imagem-mãe que já usamos no Midjourney/Gemini, `frame-1`).
> A foto da Lena tem dois lugares certos: o **momento da revelação**
> ("Eu sou a Lena, não durmo…", loc-06) como **avatar falante**, e o **frame
> final** (tela da marca). Se a sua intenção for outra — Lena aparecendo na
> tela como apresentadora o tempo todo — me fala, porque aí o roteiro muda.

---

## Teste rápido primeiro (10 min, prova o conceito)

Antes de produzir os 7, valide identidade + qualidade com UM plano:

1. ElevenLabs → **Image & Video** (playground).
2. **Suba o `frame-1` da Carla** como imagem de referência (ou gere pelo prompt
   do Frame 1 abaixo).
3. Modo **image-to-video**, modelo **Kling** ou **Veo** (bons em movimento sutil
   realista). Cole o **PROMPT DE MOVIMENTO do Frame 1** (abaixo). Duração 3–4s.
4. **Export to Studio** → na timeline, arraste seu `assets/audio/loc-01.mp3` e
   `loc-02.mp3` por cima. Veja se casa.
5. Exporte 9:16 e me manda. A gente afina daqui.

Se a Carla se manteve e o movimento ficou natural, seguimos para os 7.

---

## Como o ElevenLabs trata o prompt de vídeo

Diferente da imagem estática: além do **quê** (cena), você descreve o
**movimento** — câmera e micro-ação. Para este Reel o movimento é **mínimo e
emocional** (não é ação): leve push-in, respiração, um gesto. Use a imagem como
referência e o texto abaixo como **motion prompt** (em inglês, os modelos
respondem melhor).

Regra de consistência: a Carla é a mesma imagem-mãe em 1/3/5/6 (suba o mesmo
`frame-1` como referência em cada um, ou gere o 1 e use "image-to-video" a
partir dele).

---

## PROMPTS DE MOVIMENTO (image-to-video)

### Frame 1 — A perda começa (21h40, cozinha à noite)
Referência: `frame-1` (Carla).
```
Subtle handheld, almost imperceptible slow push-in. The woman is holding her
phone; the exact moment realization hits — her eyebrows lift, lips part
slightly, a small worried breath. Warm overhead kitchen light flickering
softly, dark window behind. Intimate, quiet, candid. Photoreal, 35mm film look,
shallow depth of field, muted warm palette. No text. 4 seconds.
```

### Frame 3 — A desistência (manhã seguinte)
Referência: `frame-3` (Carla, manhã).
```
Soft morning light. She slides her phone into her bag, shoulders dropping in a
small resigned sigh, a flicker of frustration, then turns toward the door. Very
gentle handheld, slow. Photoreal 35mm, muted warm palette. No text. 4 seconds.
```

### Frame 4 — O horário vazio (sem pessoa)
Referência: `frame-4` (sala vazia).
```
Locked-off static shot, no people. Dust motes drift slowly in the morning light
from the window; the single empty chair is perfectly still; a faint movement of
the curtain. Quiet, melancholic stillness. Photoreal 35mm, muted warm palette.
No text. 3 seconds.
```

### Frame 5 — A VIRADA (mesma cozinha, agora alívio)
Referência: `frame-5` (igual ao 1, emoção de alívio).
```
SAME framing and lighting as the opening kitchen shot. Her face softens into a
small relieved smile, a tiny exhale of relief, shoulders releasing. Gentle slow
push-in, matching the opening. Photoreal 35mm, muted warm palette. No text.
4 seconds.
```
*(É o corte gêmeo do Frame 1 — mesmo enquadramento, só a emoção vira. Mantenha o
mesmo movimento de câmera para o "e se" ler no corte.)*

### Frame 6 — O alívio (agendado)
Referência: `frame-6` (Carla, chá).
```
She sets the phone down on the kitchen counter and reaches for a cup of tea,
relaxed and content, the worry gone. Slow gentle drift of the camera, warm
light. Photoreal 35mm, muted warm palette. No text. 4 seconds.
```

---

## Frame 7 e a Lena (a foto que você vai subir)

### Opção A — Lena como avatar falante na revelação (recomendado p/ testar)
No beat **loc-06** ("Eu sou a Lena. Não durmo, não tiro folga…"):
1. Image & Video → **AI Talking Avatar / Lip-sync**.
2. Suba a **foto da Lena** + selecione o áudio **`loc-06.mp3`**.
3. Gere o lip-sync. Funciona melhor se a foto da Lena for um **retrato
   fotorrealista**. Se for o **avatar/logo ilustrado** da marca, o lip-sync pode
   ficar estranho — nesse caso prefira só um **leve zoom + onda de áudio**
   (movimento sutil), sem boca.

### Opção B — Frame 7 tela da marca (fecho)
Mantém como em `03-telas-whatsapp.md`: fundo creme + avatar da Lena + balão real
do WhatsApp ("Oi, Carla! Tenho 7h ou 7h30 amanhã. Qual prefere?") + `lena.ia.br`.
Pode montar no próprio Studio (imagem estática + leve zoom) com `loc-07` por cima.

---

## Montagem no Studio (com a SUA locução)

1. Gere os 5 clipes (F1, F3, F4, F5, F6) + avatar da Lena (loc-06) no Image &
   Video. Frame 2 e 7 = telas (ver `03-telas-whatsapp.md`).
2. **Export to Studio** em cada um. Na timeline, ordene pela cronometragem do
   `00-roteiro-e-frames.md`:

   | Tempo | Clipe | Áudio |
   |---|---|---|
   | 0:00–0:04 | F1 | loc-01 |
   | 0:04–0:12 | F1→F2 | loc-02 |
   | 0:12–0:18 | F2 | loc-03 |
   | 0:18–0:23 | F3→F4 | loc-04 |
   | 0:23–0:27 | F4→F5 | loc-05 |
   | 0:27–0:33 | Lena avatar / F5→F6 | loc-06 |
   | 0:33–0:37 | F7 | loc-07 |

3. Arraste seus `assets/audio/loc-01…07.mp3` para a faixa de voz e **alinhe os
   cortes às falas** (o corte F1→F5 cai junto com "Eu não", 0:23).
4. **Música**: piano discreto (gere no Eleven Music ou suba a sua), subindo
   levíssimo na virada (0:23). **SFX** opcional: notificação no F2.
5. **Legenda/caption** automática do Studio (ative — Reels sem som).
6. Exporte **9:16, 1080×1920**. Salve como `assets/reel-final.mp4`.

---

## Quando algo não sair bem
Me mande o clipe (jogue em `assets/`). Eu afino o motion prompt (intensidade do
movimento, duração, push-in) ou ajusto o corte/tempo. Image-to-video quase
sempre pede um ou dois ajustes de direção — normal e rápido.

Fontes: ElevenLabs Image & Video (beta) e Studio 3.0.
```
https://elevenlabs.io/docs/eleven-creative/playground/image-video
https://elevenlabs.io/studio
https://elevenlabs.io/lip-sync/ai-talking-avatar
```
