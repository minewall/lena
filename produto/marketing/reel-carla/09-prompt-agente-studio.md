# Prompt para o Agente do Estúdio (ElevenLabs)

Cole no campo "Descreva o que você gostaria de criar" do Agente do Estúdio.
**Pré-requisito:** as 7 locuções (`lena-loc-001…007`) e os 7 frames
(`frame-1.mp4`, `frame-2.png`, `frame-3.mp4`, `frame-4.mp4`, `frame-5.mp4`,
`frame-6.mp4`, `frame-7.png`) já importados em **Arquivos**.

---

```
Monte um Reel vertical 9:16 (1080x1920), ~46 segundos, com os arquivos já
importados no projeto. Siga exatamente este plano.

FAIXA DE ÁUDIO (voz) — uma única faixa, clipes em sequência, sem sobreposição,
nesta ordem exata:
lena-loc-001, lena-loc-002, lena-loc-003, lena-loc-004, lena-loc-005,
lena-loc-006, lena-loc-007.
Pode deixar ~0,2s de respiro entre eles. Essa faixa define a duração total.

FAIXA DE VÍDEO — coloque cada mídia no tempo indicado, cortando os vídeos de 8s
para a janela pedida:
- 0:00–0:08  -> frame-1.mp4 (use os primeiros 8s)
- 0:08–0:22  -> frame-2.png (imagem estática; aplique um zoom lento de 1.0 a
  1.05 para não ficar parado)
- 0:22–0:25  -> frame-3.mp4
- 0:25–0:31  -> frame-4.mp4
- 0:31–0:37  -> frame-5.mp4
- 0:37–0:40  -> frame-6.mp4
- 0:40–0:46  -> frame-7.png (imagem estática; zoom lento sutil)

SINCRONISMOS QUE NÃO PODEM ERRAR (alinhe os cortes às palavras da locução):
1. O corte de frame-4 para frame-5 deve cair exatamente quando a voz diz
   "Eu sou a Lena" (em lena-loc-006).
2. frame-7.png deve entrar quando a voz diz "estava agendado" (fim de
   lena-loc-006).

MÚSICA — gere uma trilha de piano solo suave, íntima, lenta, com uma leve subida
de esperança no meio, ~46s, e coloque em volume baixo (bem abaixo da voz).

LEGENDAS — gere legendas automáticas da locução, fonte limpa, posicionadas na
parte de baixo mas acima dos 15% inferiores da tela.

EXPORTAR — vídeo final em 9:16, 1080x1920, MP4.
```

---

Se o agente errar a ordem da voz (loc-003/004 vivem trocando) ou colocar clipes
em faixas diferentes, peça: "coloque todas as locuções numa única faixa de
áudio, em sequência 001 a 007". Se um corte não cair na palavra certa, ajuste
±0,5s na mão depois.
