# Prompts de imagem — por plataforma

5 frames de pessoa/cenário gerados por IA (1, 3, 4, 5, 6). Frames 2 e 7 são
telas → ver `03-telas-whatsapp.md`.

**A Carla precisa ser a MESMA mulher nos frames 1, 3, 5 e 6.** A técnica muda
por plataforma:
- **Gemini (Nano Banana):** gere o Frame 1; depois gere 3/5/6 como **edição**,
  referenciando a imagem do Frame 1 (cole a imagem e use o prompt de edição).
- **Midjourney:** gere o Frame 1, copie a URL da imagem, e use `--cref <URL>
  --cw 100` nos frames 3/5/6 (cw 100 mantém rosto e roupa).

Saída: PNG/JPG, vertical 9:16, 1080×1920+. Salvar como `assets/frames/frame-N.png`.

---

## Frame 1 — A perda começa (21h40, cozinha à noite) · imagem-mãe

**Gemini:**
> Generate a photorealistic vertical 9:16 image. A 35-year-old Brazilian woman —
> warm light-brown skin, dark wavy shoulder-length hair, soft natural everyday
> features, minimal makeup, wearing a mustard-yellow knit sweater — stands in a
> small São Paulo apartment kitchen at night. Warm overhead light, a dark window
> behind her. She holds her phone and has just remembered something she forgot:
> a soft "oh no" expression, eyebrows lifting, slightly worried. Intimate, quiet,
> candid. Shot on 35mm film, shallow depth of field, muted warm palette of cream,
> terracotta and warm brown. Realistic and relatable, not a fashion model. No
> text, no watermark, no on-screen logos.

**Midjourney:**
> photorealistic candid portrait, 35-year-old Brazilian woman, warm light-brown
> skin, dark wavy shoulder-length hair, soft natural features, minimal makeup,
> mustard-yellow knit sweater, small São Paulo apartment kitchen at night, warm
> overhead light, dark window behind, holding phone, sudden "oh no" realization,
> worried eyebrows, intimate quiet mood, shot on 35mm film, shallow depth of
> field, muted warm palette cream terracotta brown, cinematic, no text --ar 9:16 --style raw --v 7

---

## Frame 3 — A desistência (manhã seguinte)

**Gemini (edição — anexe o Frame 1):**
> Using the same woman from this image (same face, same mustard-yellow sweater,
> same hair), now show her the next morning, dressed for work, in soft morning
> light from a window, putting her phone into her bag with a small resigned sigh
> and a flicker of frustration — she has given up. Keep the same photorealistic
> 35mm style and muted warm palette. Vertical 9:16, no text.

**Midjourney:**
> photorealistic candid portrait, same 35-year-old Brazilian woman, dark wavy
> hair, mustard-yellow knit sweater, next morning, dressed for work, soft morning
> window light, putting phone into her bag, small resigned sigh, flicker of
> frustration, giving up, 35mm film, shallow depth of field, muted warm palette
> cream terracotta brown, cinematic, no text --ar 9:16 --style raw --v 7 --cref <URL_FRAME1> --cw 100

---

## Frame 4 — O horário vazio (cenário, sem pessoa)

**Gemini:**
> Generate a photorealistic vertical 9:16 image, no people: an empty treatment
> room or small studio reception in the morning, just opened, soft daylight
> through the window, one empty chair, quiet and still — the first appointment
> slot of the day, unfilled. Shot on 35mm, muted warm palette cream terracotta
> brown. No text, no logos.

**Midjourney:**
> photorealistic empty small studio reception room, morning just opened, soft
> daylight through window, one empty chair, quiet still atmosphere, no people,
> first unfilled appointment slot of the day, 35mm film, muted warm palette cream
> terracotta brown, cinematic, no text --ar 9:16 --style raw --v 7

---

## Frame 5 — A VIRADA (mesma cena do Frame 1, resolvida)

> ⚠️ Tem que ser visualmente IGUAL ao Frame 1 (mesma cozinha, roupa, luz,
> enquadramento). Só a emoção muda: de aflição para alívio. É o que faz o "e se"
> ler na hora do corte.

**Gemini (edição — anexe o Frame 1):**
> Using the exact same woman, same mustard-yellow sweater, same kitchen, same
> night, same warm light and same framing as this image — but now she is looking
> at her phone with a small relieved smile, a tiny exhale of relief, shoulders
> softening. Change only her emotion, from worry to relief. Same photorealistic
> 35mm style. Vertical 9:16, no text.

**Midjourney:**
> photorealistic candid portrait, same 35-year-old Brazilian woman, mustard-yellow
> knit sweater, same kitchen at night, warm overhead light, looking at her phone
> with a small relieved smile, tiny exhale of relief, shoulders softening, 35mm
> film, shallow depth of field, muted warm palette cream terracotta brown,
> cinematic, no text --ar 9:16 --style raw --v 7 --cref <URL_FRAME1> --cw 100

---

## Frame 6 — O alívio (agendado)

**Gemini (edição — anexe o Frame 1):**
> Using the same woman (same face, mustard-yellow sweater) in the same kitchen,
> show her setting her phone down on the counter, relaxed, reaching for a cup of
> tea, calm and content, the worry gone. Same 35mm style and muted warm palette.
> Vertical 9:16, no text.

**Midjourney:**
> photorealistic candid portrait, same 35-year-old Brazilian woman, mustard-yellow
> knit sweater, same kitchen, setting phone down on counter, relaxed, reaching for
> a cup of tea, calm and content, worry gone, 35mm film, muted warm palette cream
> terracotta brown, cinematic, no text --ar 9:16 --style raw --v 7 --cref <URL_FRAME1> --cw 100

---

## Se a Carla não sair como queremos

Me mande o Frame 1 gerado (jogue em `assets/frames/`). Ajusto o prompt fino —
idade, traços, roupa, luz. A primeira geração quase sempre pede um ou dois
retoques de direção; é normal e rápido.
