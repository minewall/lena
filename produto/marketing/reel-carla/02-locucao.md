# Locução — voz da Lena (ElevenLabs)

## Passo 1 — criar a "Voz da Lena" (uma vez, reutilizável em tudo)

No ElevenLabs → **Voice Design**, prompt de voz:

> warm Brazilian Portuguese woman, early 30s, calm, friendly, intimate
> storyteller, natural and human, not robotic, gentle pace

- Settings: **Stability ~55% · Similarity ~75% · Style 0–15% · Speaker Boost on**.
- Salve como **"Voz da Lena"** → é o ativo oficial, use em todos os Reels.

---

## Entenda antes: onde se controla a entonação

O ponto que te travou: **o texto que você cola é falado literalmente.** A
"direção" (íntima, melancólica…) **não vai no texto** — ela é controlada de dois
jeitos, e depende do modelo:

| | **Eleven v2 (Multilingual)** | **Eleven v3 (alpha)** |
|---|---|---|
| Como dirige a frase | Só pelos **settings** (Stability/Style) + **re-roll** | **Tags inline** no texto: `[sighs]`, `[whispers]`… |
| PT-BR | Prosódia mais estável | Um pouco mais instável, mas expressivo |
| Tags em português? | — | **Não.** Vocabulário **fixo em inglês** |

Ou seja: **se você quer mandar frase a frase ("aqui suspira, aqui sorri"),
precisa do v3** e das tags em inglês (Opção B). Se quer o caminho mais seguro
em PT-BR, fica no v2 (Opção A) e dirige pelos settings.

> ⚠️ **Tags só existem no v3 e só em inglês.** `[íntima]`, `[melancólica]` **não
> funcionam** — o modelo lê a palavra. As válidas são as da lista da Opção B.

---

## Opção A — Eleven v2 (texto limpo, dirige pelos settings)

Cole **só a fala** (sem aspas, sem colchetes). Uma de cada vez. Gere e salve
como `assets/audio/loc-01.mp3` … `loc-07.mp3`. A entonação você ajusta pela
tabela de direção lá embaixo (Stability/Style + re-roll).

**loc-01**
```
Deixa eu te contar uma história. Acontece toda noite, em algum negócio.
```

**loc-02**
```
Nove e quarenta da noite. A Carla lembrou que precisava marcar uma sessão. Achou o número. Mandou mensagem.
```

**loc-03**
```
Ela esperou. Ninguém respondeu.
```

**loc-04**
```
De manhã, verificou e nenhuma mensagem de volta, ela desistiu e foi trabalhar. Naquele mesmo dia o horário das nove ficou vazio.
```

**loc-05**
```
A recepcionista tem hora pra chegar… Eu não.
```

**loc-06**
```
Eu sou a Lena. Não durmo, não tiro folga. Nove e quarenta e dois, eu teria respondido na hora. E estava agendado.
```

**loc-07**
```
Seus clientes não têm hora pra querer agendar. Eu também não.
```

---

## Opção B — Eleven v3 (tags por frase, em inglês)

**É aqui que você customiza cada frase.** Em Settings, modelo **Eleven v3** e
estabilidade **"Natural"** (ou **"Creative"** para mais emoção — **"Robust"
ignora as tags**). Cole o bloco **inteiro, com as tags**.

Regras: **tag é probabilística** — se você *ouvir* a palavra (a voz fala
"pause"), apague a tag e use `…`. **Pouca tag funciona melhor que muita.**

**loc-01**
```
[thoughtful] Deixa eu te contar uma história. Acontece toda noite, em algum negócio.
```

**loc-02**
```
Nove e quarenta da noite. A Carla lembrou que precisava marcar uma sessão. Achou o número… mandou mensagem.
```

**loc-03**
```
Ela esperou. [pause] Ninguém respondeu.
```

**loc-04**
```
De manhã, verificou… nenhuma mensagem de volta. [sighs] Ela desistiu e foi trabalhar. Naquele mesmo dia, o horário das nove ficou vazio.
```

**loc-05**
```
A recepcionista tem hora pra chegar… [pause] Eu não.
```

**loc-06**
```
Eu sou a Lena. Não durmo, não tiro folga. Nove e quarenta e dois… eu teria respondido na hora. E estava agendado.
```

**loc-07**
```
Seus clientes não têm hora pra querer agendar. [happy] Eu também não.
```

**Tags válidas mais úteis aqui** (todas em inglês): `[thoughtful]`, `[sad]`,
`[sighs]`, `[exhales]`, `[whispers]`, `[curious]`, `[surprised]`, `[happy]`,
`[pause]` / `[short pause]`. Maiúsculas dão ênfase (ex.: `VAZIO`) e `…` segura a
pausa — valem nos dois modelos.

Total falado ~32–37s. Se um clipe sair errado, regenere só ele (re-roll).

---

## Direção de voz — guia de intenção (NÃO colar; vale para a Opção A)

| Clipe | Intenção | Tag equivalente no v3 |
|---|---|---|
| loc-01 | íntima, convidativa | `[thoughtful]` |
| loc-02 | ritmo de inventário, sobe leve | — (só pontuação) |
| loc-03 | mais seca, a frustração | `[pause]` antes da resposta |
| loc-04 | desce, melancólica | `[sighs]` |
| loc-05 | pausa antes de "Eu não"; firme e baixo | `[pause]` |
| loc-06 | assume, confiante, quente | — (deixe limpo, confia na voz) |
| loc-07 | sorriso na voz, fecho | `[happy]` |

Settings por intenção (Opção A): melancólicas/íntimas (01, 04) → Stability ~60%
(mais contida); virada confiante (06, 07) → Style ~15% (mais presença).

---

## Formato de saída

MP3 (ou WAV), 7 arquivos em `assets/audio/`. Se preferir um arquivo único, gere
contínuo e salve como `locucao.mp3` — mas o frase-a-frase facilita alinhar com
os cortes na montagem.
