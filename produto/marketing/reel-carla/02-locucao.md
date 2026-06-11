# Locução — voz da Lena (ElevenLabs)

## Passo 1 — criar a "Voz da Lena" (uma vez, reutilizável em tudo)

No ElevenLabs → **Voice Design**, prompt de voz:

> warm Brazilian Portuguese woman, early 30s, calm, friendly, intimate
> storyteller, natural and human, not robotic, gentle pace

- Modelo: **Eleven Multilingual v2** (melhor prosódia PT-BR).
- Settings: **Stability ~55% · Similarity ~75% · Style 0–15% · Speaker Boost on**.
- Salve como **"Voz da Lena"** → é o ativo oficial, use em todos os Reels.

---

## ⚠️ Como NÃO errar (leia antes de colar)

O ElevenLabs **fala exatamente o texto que você cola** — ele não entende
"direção de voz". Então:

- **Cole SÓ a fala** (os blocos do Passo 2). Uma de cada vez.
- **NÃO cole as aspas.** Sem `" "`.
- **NÃO cole a coluna de direção** ("íntima", "melancólica"…). Isso é nota
  PARA VOCÊ, para escolher os settings — está numa seção separada lá embaixo.
- A **entonação** você controla pelos **settings** (Stability/Style) e
  **regenerando** (re-roll), não escrevendo no texto.
- **Pontuação importa:** ponto e reticências (…) viram pausa. Mantenha como está.

---

## Passo 2 — as 7 falas (cole UMA POR VEZ, só o texto do bloco)

Cada bloco abaixo é exatamente o que vai no campo de texto do ElevenLabs.
Gere o áudio, salve como `assets/audio/loc-01.mp3` … `loc-07.mp3`.

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
Nosso atendimento é das nove às seis. Ela esperou. Ninguém respondeu.
```

**loc-04**
```
De manhã, verificou e ninguém respondeu ainda, ela desistiu e foi trabalhar. Naquele mesmo dia o horário das nove ficou vazio.
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

Total falado ~32–37s. Se um clipe sair com entonação errada, regenere só ele
(re-roll) até acertar.

---

## Direção de voz — para VOCÊ ajustar os settings (NÃO colar)

Use como guia ao escolher Stability/Style e ao decidir se regenera um clipe.

| Clipe | Intenção |
|---|---|
| loc-01 | íntima, convidativa |
| loc-02 | ritmo de inventário, sobe leve |
| loc-03 | mais seca, a frustração |
| loc-04 | desce, melancólica |
| loc-05 | pausa antes de "Eu não"; firme e baixo |
| loc-06 | assume, confiante, quente |
| loc-07 | sorriso na voz, fecho |

Dica de settings por intenção: para as falas melancólicas/íntimas (01, 04),
suba um pouco a Stability (~60%) para ficar mais contida; para a virada
confiante (06, 07), Style ~15% dá mais presença.

> **Avançado (opcional):** se você usar o **ElevenLabs v3** (não o v2), ele
> aceita *audio tags* entre colchetes DENTRO do texto, ex.: `[warmly]`,
> `[whispers]`, `[pause]`. Aí a direção pode ir no texto — mas só no v3. No v2
> (recomendado aqui), mantenha o texto limpo como nos blocos acima.

---

## Formato de saída

MP3 (ou WAV), 7 arquivos em `assets/audio/`. Se preferir um arquivo único,
gere contínuo e salve como `locucao.mp3` — mas o frase-a-frase facilita alinhar
com os cortes na montagem.
