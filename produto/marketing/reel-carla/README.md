# Reel "A noite da Carla" — kit de produção

Pasta única de produção do primeiro Reel da campanha "E se…" (Eixo A,
disponibilidade 24h). Conceito da campanha: `../campanha-e-se.md`.

## Sequência de produção (siga nesta ordem)

1. **Voz da Lena** (`02-locucao.md`) — crie a voz no ElevenLabs e gere os
   clipes de locução. Faça PRIMEIRO: o tempo da fala define quanto cada frame
   fica na tela.
2. **Frame 1, a imagem-mãe da Carla** (`01-prompts-imagem.md`) — é a referência
   de todas as outras. Capriche aqui; só avance quando ela estiver certa.
3. **Frames 3, 5 e 6** — derive a partir do Frame 1 (mesma Carla). O Frame 5 é
   o Frame 1 com a emoção trocada (aflição → alívio).
4. **Frame 4** — cenário sem pessoa (recepção vazia).
5. **Telas de WhatsApp** (`03-telas-whatsapp.md`) — Frames 2 e 7. NÃO gerar por
   IA; montar (mockup/print). IA erra texto e UI.
6. **Montagem** (`05-montagem-capcut.md`) — junte tudo no CapCut.
7. **Legenda do post** (`04-legenda-post.md`) — já está pronta para colar.
8. **Me avise** quando os assets estiverem na pasta → eu reviso e finalizo antes
   de postar.

## Onde guardar o quê

| Pasta | Conteúdo | Naming | Formato |
|---|---|---|---|
| `assets/frames/` | imagens geradas | `frame-1.png` … `frame-7.png` | PNG ou JPG, 1080×1920 (9:16), maior resolução possível |
| `assets/audio/` | locução | `loc-01.mp3` … `loc-07.mp3` (1 por linha) ou `locucao.mp3` | MP3 ou WAV |
| `assets/final/` | vídeo montado | `reel-carla-v1.mp4` | MP4, 1080×1920, 30fps |

Frames 2 e 7 (telas) entram como `frame-2.png` e `frame-7.png` depois de montados.

## Ferramentas (recomendação)

- **Imagem:** Gemini "Nano Banana" (2.5 Flash Image) para consistência por
  edição, e/ou Midjourney v7 para o teto de qualidade. Prompts dos dois em
  `01-prompts-imagem.md`.
- **Voz:** ElevenLabs (Voice Design + Multilingual v2).
- **Telas/montagem:** CapCut.
- **Trilha:** Artlist/Epidemic ou Suno (piano discreto).

## Saída final esperada

Vídeo vertical 9:16, ~37s, MP4 1080×1920 30fps, legenda embutida, em
`assets/final/reel-carla-v1.mp4`. Quando estiver lá, eu confiro ritmo, legenda
e fecho a legenda do post para publicar.
