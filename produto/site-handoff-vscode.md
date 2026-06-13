# Prompt para o Claude no VSCode — evolução do site lena.ia.br

Cole o bloco abaixo no Claude (VSCode) ao abrir este repositório. Ele dá o
contexto do que evoluímos. Tarefa principal desta rodada: **inserir imagens que
conectem a Lena a negócios reais** (a ideia que validamos: cenas de PMEs reais —
clínica, salão, escola, petshop — não "tech/robô"), mantendo marca e voz.

---

```
Você vai evoluir o site institucional da Lena (lena.ia.br). Antes de editar,
leia o contexto e siga à risca a marca e a voz.

ONDE FICA O SITE
- Pasta `lena-site/` (site estático: index.html, experimente.html,
  interesse.html, obrigado.html, lena-brand.css, lena-marks.js, functions/ do
  Cloudflare). Ignore `site v1/` (versão antiga).

O QUE É A LENA (posicionamento — leia `produto/posicionamento-dores.md`)
- A Lena é uma recepcionista virtual com IA que atende o WhatsApp do negócio 24h:
  responde na hora, agenda, lembra, confirma e qualifica.
- VENDEMOS RESULTADO DE NEGÓCIO, não "automação de WhatsApp". O WhatsApp é o
  canal, não o produto. Lidere sempre pela dor/resultado (cliente perdido por
  demora, faturamento perdido por falta, dono refém do celular).
- Segmentos: clínicas, salões/estética, escolas, petshops, escritórios
  (`produto/segmentos-arquetipos.md`).

MARCA (use `lena-site/lena-brand.css` como fonte da verdade)
- Paleta quente: creme (#FBF3E7), terracota (#E35B2E), café (marrom escuro),
  salvia (verde). Nada de azul "tech".
- Fontes: Bricolage Grotesque (display) + Hanken Grotesk (texto).
- Selo da Lena (círculo laranja com "L" e ponto verde) e o avatar ilustrado da
  Lena (mulher) em `branding/` — use os existentes, não gere logo novo.

VOZ DA LENA (regras firmes)
- 1ª pessoa ("eu respondo", "eu agendo"), calorosa e resolvedora.
- NUNCA use hífen nem travessão em frases (use ponto, vírgula, parênteses).
- Emoji com muita parcimônia (quase nenhum).
- Ela é "recepcionista virtual", nunca "chatbot/bot/atendente".

PREÇOS (não esconder)
- Essencial R$ 400/mês (500 conversas), Profissional R$ 900/mês (1.500, mais
  escolhido), Premium R$ 2.000/mês (4.000). Anual com 2 meses grátis.
  Implantação a partir de R$ 1.500 (única). NÃO altere os valores publicados.

TAREFA DESTA RODADA — imagens que conectam com negócios reais
- Inserir imagens/cenas de PMEs brasileiras reais e acolhedoras (recepção de
  clínica, cadeira de salão, secretaria de escola, balcão de petshop), no mesmo
  clima quente e cinematográfico do nosso Reel (35mm, paleta creme/terracota,
  pessoas reais e relacionáveis, não modelos, sem texto na imagem).
- Reaproveite o material do Reel se ajudar: `produto/marketing/reel-carla/`
  (frames da Carla, cards de marca) e o conceito da campanha "E se…".
- Onde inserir: hero, blocos de segmento, prova social. A imagem ilustra a DOR e
  o RESULTADO (antes/depois), não a tecnologia.
- Mantenha o site rápido (otimize as imagens) e responsivo (mobile primeiro).

REGRAS DE EXECUÇÃO
- NÃO quebre o selo, os preços travados, nem os formulários (experimente /
  interesse / obrigado) e as functions do Cloudflare.
- Roberto é perfeccionista com o site público: faça mudanças incrementais e
  mostre no preview antes de finalizar.
- Commits pequenos e descritivos. Não publique sem revisão.
```

---

## Como dividir o trabalho (você no VSCode × eu aqui)
- **Você (VSCode):** site público (`lena-site/`) — imagens, hero, copy visual.
- **Eu (aqui):** Central da Lena (backoffice) — o roadmap em
  `produto/central-roadmap-haile.md`.
- Compartilhamos: `packages/shared` (tipos, prompt). Se mexer lá, avise pra
  evitarmos conflito.
