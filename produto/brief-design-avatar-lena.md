# Briefing de design · Avatar e assets visuais da Lena

Documento de briefing para gerar os assets visuais da identidade visível da Lena. Serve tanto como brief para designer humano quanto como prompt para IA generativa (DALL-E, Midjourney, Stable Diffusion).

Última atualização: 2026-06-07.

---

## 1. Quem é a Lena (em uma linha)

A Lena é a **recepcionista virtual com IA** de pequenos negócios brasileiros (clínicas, escolas, salões, petshops, escritórios). Atende pelo WhatsApp 24 horas por dia, marca compromissos, confirma horários, qualifica leads. Produto da **AVERSE TECNOLOGIA LTDA**.

Persona: **feminina, brasileira, calorosa, profissional, anti-jargão, resolvedora**. Não é "uma atendente" nem "um chatbot". É uma recepcionista virtual com personalidade própria. Fala em primeira pessoa, sem hífens, sem travessões, com cuidado e segurança.

Não é uma foto de pessoa real. Não é um robô.

---

## 2. Identidade visual existente

Já temos uma marca definida. Tudo o que for gerado precisa conversar com ela.

### Paleta

| Cor | HEX | Uso |
|---|---|---|
| Terracota | `#D9613A` | Primária, calor humano |
| Terracota (clara) | `#E8784E` | Realce sobre fundo escuro |
| Terracota (escura) | `#B84A28` | Pressionada |
| Creme | `#FBF3E7` | Fundo claro, tinta sobre escuro |
| Areia | `#F3E7D3` | Cartões, superfícies |
| Café | `#241B15` | Tinta principal |
| Café (mais escuro) | `#1B130D` | Fundo escuro |
| Sálvia | `#4E9E78` | Presença, status "online" |
| Sálvia (clara) | `#5FB98D` | Sobre fundo escuro |
| Ambar | `#F2A93C` | Destaque secundário |
| Ameixa | `#8A5A9C` | Acento (escolas) |

### Tipografia

- **Display:** Bricolage Grotesque (700-800) — títulos
- **Texto:** Hanken Grotesk (400-700) — corpo
- **Wordmark:** sempre `lena.` minúsculas, ponto em sálvia (#4E9E78)

### Selo (já existe)

Quadrado arredondado (squircle) terracota com a letra `L` em creme e um "ponto de presença" em sálvia (representa o status online do WhatsApp). Geometria canônica em `lena-site/lena-marks.js`. Funciona como marca corporativa, mas é **abstrato demais** para servir como avatar de persona da Lena no WhatsApp.

---

## 3. Assets que precisam ser produzidos

Por ordem de prioridade.

### 🎯 A. Avatar da Lena para o WhatsApp Business (PRIORIDADE 1)

É a foto que aparece para o cliente quando recebe mensagem da Lena no WhatsApp. Hoje está vazio (mostra só a inicial).

**Especificações técnicas:**
- Formato: **PNG** com fundo (pode ser sólido ou translúcido onde fizer sentido)
- Dimensões mínimas: **640×640 px** (WhatsApp exibe em círculo, então a composição precisa ser **centrada e segura num círculo inscrito de raio ~280 px no centro**)
- Recomendado entregar também: 1024×1024 (alta resolução para o painel da Meta) e 320×320 (thumbnail)
- Peso máximo: ~5 MB

**Direção criativa, 2 caminhos possíveis (a escolher):**

#### Caminho 1 — "Persona ilustrada feminina" (recomendado)

Uma **ilustração estilizada e contemporânea** de uma mulher jovem brasileira, traços simples e amigáveis, em estilo "ilustração de marca" moderno (linha clara, cores chapadas, geometria suave). Não realismo nem cartoon infantil. Algo entre **Hervé** (linha simples) e **Tom Froese** (cores chapadas).

Elementos sugeridos:
- Sorriso discreto, expressão atenta e calorosa
- Olhar reto para a câmera (transmite confiança)
- Pode ter um headset leve sugerindo "recepção", mas sem clichê de call center
- Roupa em creme ou terracota suave
- Cabelo natural (a Lena pode ter cabelo curto, médio ou longo, designer decide)
- Fundo em creme (`#FBF3E7`) ou areia (`#F3E7D3`) com sutil textura ou geometria

Características que importam:
- **Acolhedora, profissional, brasileira contemporânea**
- Não exageradamente jovem (não passa "estagiária"), não exageradamente velha
- Sem traços étnicos exclusivos (a Lena atende negócios diversos)
- Sem maquiagem exagerada
- Sem objetos comerciais óbvios (nada de uniforme de empresa)

#### Caminho 2 — "Selo personalizado" (mais corporativo)

Versão evoluída do selo atual: o squircle terracota com "L" creme, mas adicionando elementos de personalidade (uma sombra de sorriso integrada à letra, um detalhe de cuidado, algo que humanize sem ser uma cara). Esse caminho é mais conservador, escala melhor entre tamanhos, mas perde "personagem".

**Recomendação:** A se você quer a Lena vendendo personalidade. B se prefere uma marca mais asséptica/corporativa.

**Sugestão fechada:** seguir o Caminho 1 e manter o selo como avatar institucional para LinkedIn da Averse.

#### O que NÃO queremos (em qualquer caminho)

- ❌ Foto de pessoa real (LGPD, credibilidade, deepfake)
- ❌ Robô, robozinho, headset gigante, fones óbvios de call center
- ❌ Estética anos 80/90 (smartphone genérico, balão de fala chapado)
- ❌ Emojis dentro do avatar
- ❌ Sotaque de logo (palavras dentro do avatar)
- ❌ Estilo Pixar/Disney 3D (fica genérico, sem personalidade de marca)
- ❌ Estilo "memoji"/"bitmoji" (parece app de mensagem antigo)
- ❌ Cabelo loiro perfeito de stock photo

### 🎯 B. OG Image para compartilhamento (PRIORIDADE 2)

Imagem que aparece quando alguém compartilha `lena.ia.br` no WhatsApp, LinkedIn, Twitter etc.

**Especificações técnicas:**
- Formato: **PNG**
- Dimensões: **1200×630 px** (padrão Open Graph; LinkedIn e Facebook usam essa)
- Variante recomendada: **1200×675** para Twitter/X (similar)
- Área segura (safe area): centro da imagem, pelo menos 1000×550 px (algumas plataformas cortam bordas)

**Direção:**
- Fundo: creme (`#FBF3E7`) ou areia (`#F3E7D3`)
- Wordmark "lena." grande, deslocado à esquerda
- Headline curta à direita ou abaixo: **"Sua recepcionista virtual no WhatsApp"**
- Sub-headline opcional menor: "atende 24h, marca na sua agenda, confirma"
- O avatar (do item A) à direita, em destaque
- Talvez um pequeno mockup minimalista de balão de chat WhatsApp (verde claro `#D9FDD3`) com uma frase tipo "Agendado, sexta às 10h ✓"
- Sutil acento sálvia ou terracota para "presença online"

**O que evitar:**
- Texto miúdo demais (>40 chars na headline some no thumb)
- Bordas com informação relevante (cortam em alguns lugares)
- Stock photos
- Wordmark sem o ponto sálvia

### 🟡 C. Avatar circular para o site (mockup do chat)

Já existe `lena-avatar.svg` no site usado no chat mockup do hero. Pode ser substituído pela versão do item A (consistência total). Pode ser uma versão mais minimalista do avatar A, mantendo o feeling.

### 🟡 D. Versões adicionais (nice to have)

- **Cover LinkedIn da Averse** (1584×396 px): wordmark + headline + selo
- **Avatar LinkedIn da Averse** (300×300 px): selo terracota
- **Capa Instagram** (já existe em `brand lena/social/`)
- **Imagem de assinatura de e-mail** da Lena: 600×200 px com selo + wordmark + tagline "Recepcionista virtual com IA"

---

## 4. Prompts prontos para IA generativa

Caso você queira testar caminhos rápidos via IA antes de finalizar com designer humano. Cole no Midjourney, DALL-E, Stable Diffusion ou modelo similar.

### Prompt 1 — Caminho 1 (persona ilustrada)

```
A stylized flat illustration portrait of a young Brazilian woman, calm
and warm expression, gentle smile, looking directly at the viewer.
Modern editorial illustration style, clean linework, flat colors,
contemporary brand aesthetic (similar to Hervé Pedrosa or Tom Froese).
Earthy color palette: terracotta orange (#D9613A), warm cream (#FBF3E7),
sage green accent (#4E9E78). Subtle headset visible but not the main
focus. Background in solid cream (#FBF3E7) with very subtle dot pattern.
Centered composition optimized for circular crop, head and shoulders
framing, safe area within central 70% of canvas. Square 1024x1024.
Professional, friendly, Brazilian, approachable, anti-corporate,
anti-robot. No text, no logos, no emoji.
```

### Prompt 2 — variação mais ilustrativa

```
Minimalist editorial illustration of a young woman receptionist,
3/4 portrait, warm earthy tones, terracotta and cream palette with sage
green accent. Flat vector style, smooth gradients, contemporary
Brazilian design aesthetic. Centered for circular avatar use, head and
shoulders, gentle eye contact, soft smile suggesting confidence.
Background creamy beige with subtle texture. Should feel premium but
approachable, professional but warm. 1024x1024, no text, no robot
elements, no call center cliches.
```

### Prompt 3 — Caminho 2 (selo evoluído)

```
A modern brand mark in the shape of a rounded square (squircle),
terracotta orange #D9613A background, with a lowercase letter "L" in
cream #FBF3E7 at the center, the bottom of the L curving subtly upward
forming a friendly smile that ends in a small sage green circle #4E9E78
suggesting a "presence dot" (online indicator). Minimalist, geometric,
warm, premium feel. Flat 2D vector illustration. Centered composition
1024x1024, transparent or cream background.
```

### Prompt 4 — OG image

```
Editorial brand banner 1200x630, warm cream background #FBF3E7, on the
left the lowercase wordmark "lena." in bold Bricolage Grotesque-like
typeface, the dot in sage green #4E9E78. On the right, a circular
portrait avatar of a young brazilian woman in flat illustration style,
warm smile, terracotta and cream palette. Below the wordmark, a short
headline in dark brown #241B15: "Sua recepcionista virtual no
WhatsApp". A subtle WhatsApp-style chat bubble in mint green floats in
the corner saying "Agendado, sexta às 10h ✓". Premium, warm, brazilian
brand aesthetic. No additional text, no logos beyond the wordmark.
```

---

## 5. Critérios de aceitação

Para considerar o trabalho entregue:

- [ ] Avatar funciona bem **em círculo de 56px** (a Lena vai aparecer pequena no chat list do WhatsApp do cliente)
- [ ] Avatar funciona bem **em quadrado de 320px** (no perfil expandido)
- [ ] Wordmark `lena.` legível em qualquer asset onde aparecer
- [ ] Paleta da marca respeitada (nenhuma cor de fora)
- [ ] **Nenhum hífen, nenhum travessão** em copy (consistência com a regra da Lena)
- [ ] Arquivos entregues em PNG (com fundo) e PNG (com transparência onde fizer sentido)
- [ ] Sources fornecidos (SVG, Figma, Illustrator ou Sketch)
- [ ] Variantes em escuro/claro para o avatar (a Lena tem que funcionar tanto em fundo creme quanto em fundo café)

---

## 6. Próximos passos

1. **Designer escolhe um caminho** (A ou B) ou apresenta 2 conceitos para Roberto decidir.
2. Entrega rounds: primeiro **3 thumbnails baixa fidelidade** (24-48h), depois finalização do escolhido (3-5 dias).
3. Arquivo final aprovado vira o avatar no **painel WhatsApp Business** (Manager > Perfil > Foto), no `lena-site/assets/`, no LinkedIn, no Instagram.

Roberto disponível em: contato@lena.ia.br · WhatsApp `+55 11 93961-5168` (que é a própria Lena 😉, e ela vai te ajudar com brief).

---

## Anexos úteis para o designer

- Site atual: <https://lena.ia.br/>
- Repo público: <https://github.com/minewall/lena>
- Brand atual: pasta `brand lena/` no repo (paleta, SVGs do selo, sociais)
- Selo SVG canônico: `lena-site/assets/lena-selo.svg`
- Lockup horizontal: `brand lena/svg/lena-lockup-horizontal-claro.svg`
- Brief de produto completo: `produto/lena-brief-completo.md`
