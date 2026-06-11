# Campanha "E se…" — conceito criativo (v0, 2026-06-10)

Ideia do Roberto: abordagens emocionais por segmento, partindo de DORES reais,
com estética realista (menos tecnologia, mais pessoa). Inspiração narrativa:
a sequência da bailarina em *O Curioso Caso de Benjamin Button* — a cadeia de
pequenos acasos narrada minuto a minuto ("se apenas uma coisa tivesse
acontecido diferente…"). Aqui, invertida para o nosso bem: **a cadeia de
pequenas perdas que acontece quando ninguém responde — e o corte para a
realidade alternativa em que a Lena respondeu.**

## O mecanismo narrativo

1. **A cadeia** (voz em off, ritmo de inventário): micro-eventos banais e
   verossímeis, um após o outro, que terminam em uma perda silenciosa
   (cliente que desiste, horário vago, agenda furada).
2. **A virada**: "Mas não foi isso que aconteceu." (beat)
3. **A realidade com a Lena**: a MESMA cadeia, com um único elo trocado —
   alguém respondeu na hora. Final mundano e feliz: a agenda fechada.
4. Assinatura: avatar da Lena + "Lena. Sua recepcionista virtual, 24h." +
   lena.ia.br.

A força está no realismo: nada de interface futurista, nada de robô. Pessoa,
celular, cotidiano brasileiro.

## Roteiro 1 — "A noite da Carla" (30-40s, Reels/Stories)

> **[cena: cozinha de apartamento, 21h40, luz quente. Carla, 35, ainda de
> roupa de trabalho, lembra de algo no meio do jantar.]**
>
> OFF: Às 21h40, a Carla lembrou que precisava marcar a sessão.
> Às 21h41, ela achou o número do estúdio.
> Às 21h42, veio o aviso: "nosso horário de atendimento é das 9h às 18h".
> Ela pensou: será que dá antes do trabalho? 7h?
> Ninguém para responder.
> Às 7h50 do dia seguinte, ela desistiu e foi trabalhar.
> A recepcionista chegou às 9h. O horário das 7h ficou vago.
>
> **[corte seco. Mesma cozinha, 21h42.]**
>
> OFF: Mas não foi isso que aconteceu.
> Às 21h42, a Lena respondeu: "Oi, Carla! Tenho 7h ou 7h30 amanhã. Qual prefere?"
> Às 21h43, estava agendado. Com lembrete marcado.
>
> **[tela final: balão de WhatsApp real da conversa + avatar da Lena]**
> LETTERING: Seus clientes não têm hora para querer agendar.
> A Lena também não. — lena.ia.br

## Frases curtas (a do Roberto + variações por dor)

- **"Seus clientes não têm hora para querer agendar. A Lena também não."** (a original, lapidada)
- "Quem responde primeiro, agenda primeiro."
- "O horário das 7h só existe para quem responde às 21h."
- "Cada 'deixe seu recado' é um cliente indo procurar quem atende."
- "Sua agenda de amanhã se decide hoje à noite."
- "A recepcionista chega às 9h. O cliente chegou às 21h40."

## Dores por segmento (gancho de cada peça)

| Segmento | Dor / cena "E se…" |
|---|---|
| Clínica/saúde | Paciente lembra à noite, quer encaixe antes do trabalho (Roteiro 1) |
| Salão/estética | Sexta 19h, cliente quer horário pro sábado; quem não responde perde o pico |
| Escola | Mãe pesquisa colégio às 22h depois que o filho dormiu; visita marcada na hora vence a concorrente |
| Petshop | Tutor lembra do banho no domingo; segunda às 8h o concorrente já confirmou |
| Escritório | Lead compara 3 advogados; o que responde primeiro leva a consulta |

## Diretrizes de imagem (decisão pendente: gerar por IA vs stock)

Para conexão "menos tecnologia, mais pessoal": pessoas brasileiras reais em
cenários reais (cozinha de apartamento, corredor de clínica, balcão de salão),
luz natural, emoção contida — o mesmo princípio que já adotamos no Haile.

- **Recomendação**: gerar por IA (mesmo pipeline do avatar — gpt-image/Gemini),
  porque (a) garante consistência com a Lena, (b) permite a MESMA pessoa nas
  duas realidades do "E se…" (essencial pro corte), (c) custo zero de licença.
  Nunca usamos stock para a Lena (brief proíbe cara de banco de imagem).
- Alternativa stock se precisar de volume: Pexels/Unsplash (grátis) têm pouco
  rosto brasileiro convincente; Freepik tem mais BR, exige assinatura.
- **Vídeo**: gerar com IA (Veo/Runway/Kling) a partir de frames-chave gerados
  no mesmo estilo, OU fotos geradas + motion sutil (parallax/zoom) com a voz
  em off carregando a narrativa — mais barato e o formato "cadeia de eventos"
  funciona até melhor com imagens quase paradas.
- A Lena aparece como o avatar dela no balão de WhatsApp (real, do produto),
  nunca como "robô".

## Próximos passos sugeridos

1. Validar o conceito e o Roteiro 1 com o Roberto (este doc).
2. Gerar os frames da Carla (6-8 imagens, duas realidades) no pipeline de IA.
3. Montar o vídeo 1 (30-40s) com off + trilha; postar como Reel fixado.
4. Adaptar o roteiro para os outros 4 segmentos (mesma estrutura, dor trocada).
5. Medir: cliques no link da bio → lena.ia.br (precisa do token do Cloudflare
   Analytics que está pendente no backlog do site).
