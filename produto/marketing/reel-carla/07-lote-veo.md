# Lote de geração — Veo (gerar tudo de uma vez, depois editar)

Frame 1 já está pronto (`assets/frames/frame-1.mp4`). Faltam **4 clipes**:
3, 4, 5, 6. Frames 2 e 7 são telas (montar, ver `03-telas-whatsapp.md`).

## Como gerar (vale para todos)

1. **Still primeiro** (aba **Imagem**): para os frames de pessoa (3, 5, 6),
   **anexe a `frame-1.png` como referência** e cole o *prompt de still*. Isso
   mantém a MESMA Carla (rosto, coque, suéter oliva, cozinha). Salve como
   `frame-3.png`, `frame-5.png`, `frame-6.png`.
2. **Animar** (aba **Vídeo**): ponha o still no **Quadro inicial** e cole o
   *motion prompt*. **9:16**, Veo 3.1 (fast ok), **4s**, **som desligado**.
   Salve como `frame-3.mp4`, etc.
3. Frame 4 não tem pessoa: gere direto (sem referência).

Ordem sugerida: **5 → 3 → 6 → 4** (faça o 5 logo, ele é o gêmeo do 1).

> ⚠️ **REGRA DE OURO (não pule o still).** A emoção mora no **still**, não no
> movimento. NÃO anime a `frame-1` (preocupada) tentando virar alívio — o modelo
> só amplifica a tensão e **arregala o olho**. Gere o still com a emoção-alvo já
> pronta, e deixe o motion prompt quase sem movimento facial. Para pessoas,
> prefira **Veo 3.1** (o Kling "video-edit" exagera).

---

## Frame 5 — A VIRADA (o mais sensível: gêmeo do Frame 1, alívio)

> Tem que ser visualmente IGUAL ao Frame 1 — mesma cozinha, suéter oliva, coque,
> luz, enquadramento. Só a EMOÇÃO muda: aflição → alívio. É o que faz o "e se"
> bater no corte.

**Still (aba Imagem — anexe `frame-1.png` como referência). O still TEM que já
parecer aliviado:**
```
Using the exact same woman from the reference — same face, same dark hair in a
messy low bun, same dark olive-green knit sweater, same kitchen at night, same
warm light and same framing. Change ONLY her expression to calm RELIEF: eyes
relaxed and soft, NOT wide, no surprise, no shock. A gentle small closed-mouth
smile, eyebrows relaxed, shoulders lowered, the tension gone from her face. She
looks reassured, at peace. Photoreal 35mm film look, shallow depth of field,
muted warm palette. Vertical 9:16. No text.
```
**Motion (aba Vídeo — Quadro inicial = `frame-5.png`, o still JÁ aliviado).
Movimento quase zero:**
```
Minimal movement. She gives a small, slow exhale of relief and her shoulders
settle; the gentle closed-mouth smile stays. Calm and soft the entire time. She
does NOT widen her eyes, NO surprise, NO shock, NO raised eyebrows — eyes stay
relaxed and half-lidded throughout. Almost imperceptible slow push-in. Photoreal
35mm. No text. 4 seconds.
```

---

## Frame 3 — A desistência (manhã seguinte)

**Still (aba Imagem — anexe `frame-1.png` como referência):**
```
The same woman from the reference (same face, warm light-brown skin, dark hair
in a messy low bun), now the next morning. Dressed for work in a simple jacket
or blouse, soft cool morning light from a window. She is slipping her phone into
her shoulder bag with a small resigned sigh and a flicker of frustration,
looking down — she has given up. Photoreal 35mm film look, shallow depth of
field, muted warm palette. Vertical 9:16. No text.
```
**Motion (aba Vídeo — Quadro inicial = `frame-3.png`):**
```
She slides the phone fully into her bag, shoulders dropping in a resigned sigh,
then turns slightly toward the door. Very gentle handheld, slow. Photoreal 35mm,
muted warm palette. No text. 4 seconds.
```

---

## Frame 6 — O alívio (agendado, chá)

**Still (aba Imagem — anexe `frame-1.png` como referência):**
```
The same woman (same face, same dark olive-green knit sweater, same messy low
bun) in the same kitchen at night. She sets her phone down on the counter and
reaches for a cup of tea, relaxed and content, the worry gone. Same photoreal
35mm look, muted warm palette. Vertical 9:16. No text.
```
**Motion (aba Vídeo — Quadro inicial = `frame-6.png`):**
```
She sets the phone down on the counter and reaches for the cup of tea, calm and
content. Slow, gentle camera drift, warm light. Photoreal 35mm, muted warm
palette. No text. 4 seconds.
```

---

## Frame 4 — O horário vazio (sem pessoa, sem referência)

**Still (aba Imagem — sem referência):**
```
Photoreal vertical 9:16, no people: an empty small treatment room or studio
reception in the morning, just opened. Soft daylight through a window, one empty
chair, quiet and still — the first appointment slot of the day, unfilled. Shot
on 35mm film, muted warm palette of cream, terracotta and warm brown. No text,
no logos.
```
**Motion (aba Vídeo — Quadro inicial = `frame-4.png`):**
```
Locked-off static shot, no people. Dust motes drift slowly in the morning light
from the window; the empty chair is perfectly still; a faint movement of the
curtain. Quiet, melancholic stillness. 4 seconds.
```

---

## Depois de gerar

Jogue `frame-3.mp4`, `frame-4.mp4`, `frame-5.mp4`, `frame-6.mp4` em
`assets/frames/` e me avise. Eu valido o lote (specs + identidade + deformação)
de uma vez, igual fiz com o Frame 1. Aí montamos no Studio com a sua locução
(cronometragem em `00-roteiro-e-frames.md`).

Frames 2 e 7 (telas WhatsApp) seguem em `03-telas-whatsapp.md` — montar, não gerar.
