# Prompts de prospecção — Claude for Chrome

Biblioteca de prompts para coletar leads B2B por **segmento × região**, usados na
Claude for Chrome. Cada prompt gera um **CSV** no schema do lead-generator, que é
importado na base ([[lena-crm-supabase]] → tabela `public.prospects`).

## Como usar

1. Abra o arquivo do segmento/zona que vai trabalhar e **cole o conteúdo na
   Claude for Chrome**.
2. Ela navega e devolve um **bloco CSV**.
3. Salve como `lead-generator/data/prospects_<segmento>_<zona>.csv`
   (ex.: `prospects_escolas_sp_leste.csv`).
4. Avise o agente do Claude Code → ele roda o `scripts/seed_prospects_sql.py`,
   **deduplica contra a base atual** e faz o bulk-insert (com `funil = novo`).

## Convenção de nomes

`<segmento>_<zona>.md` — minúsculo, sem acento, hifenizado.
Ex.: `escola_zona-leste.md`, `odontologia_centro.md`.

## De onde vêm os prompts

A maioria é **gerada** por `../scripts/gen_prompts.py` (fonte única: a taxonomia
de 28 segmentos × o mapa de zonas). Para regenerar/estender, edite o script e rode
`python gen_prompts.py`. Exceções **mantidas à mão** (mais afinadas, com exemplo
de linha): `escola_*`, `odontologia_*`, `terapias_*`.

## Mapa de cobertura (2026-06-08) — ✅ feito · 🟡 parcial · ⬜ vazio

| Segmento | Sul | Norte | Centro | Leste | Oeste | Outras |
|---|---|---|---|---|---|---|
| Escola | ✅ | ✅ | ✅ | ⬜ | ⬜ | — |
| Odontologia | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | — |
| Terapias | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | — |
| Petshop | ✅ | ✅ | ⬜ | ⬜ | ✅ | — |
| Salão | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | — |
| Clínica Estética | 🟡 | 🟡 | ✅ | 🟡 | 🟡 | Osasco ✅ |
| Clínica Médica | 🟡 | 🟡 | ✅ | 🟡 | 🟡 | Osasco/Campinas ✅ |

## Sequência sugerida (foco WhatsApp-first)

1. **Escola** — Leste → Oeste → Centro  *(em andamento)*
2. **Odontologia** — Norte → Leste → Oeste → Centro
3. **Terapias** — Norte → Leste → Oeste → Centro
4. **Petshop** — Leste → Centro
5. **Salão / Estética / Médica** — varredura sistemática por zona (adensar)

## Bairros por zona (referência para os prompts)

- **Zona Leste:** Tatuapé, Mooca, Vila Prudente, Penha, Vila Formosa, Anália
  Franco, Vila Carrão, Aricanduva, Itaquera, São Mateus, Sapopemba, Vila Matilde,
  Belém, Ermelino Matarazzo, São Miguel Paulista, Itaim Paulista, Guaianases.
- **Zona Oeste:** Lapa, Pinheiros, Perdizes, Pompeia, Vila Leopoldina, Butantã,
  Alto de Pinheiros, Vila Madalena, Jaguaré, Rio Pequeno, Barra Funda, Sumaré,
  Raposo Tavares.
- **Centro:** Sé, República, Santa Cecília, Consolação, Bela Vista, Higienópolis,
  Liberdade, Bom Retiro, Campos Elíseos, Pacaembu, Cambuci, Brás.
- **Zona Norte:** Santana, Tucuruvi, Casa Verde, Vila Maria, Mandaqui, Tremembé,
  Água Fria, Freguesia do Ó, Brasilândia, Limão, Vila Guilherme, Jaçanã.

## Schema do CSV (canônico)

```
nome,segmento,bairros,telefones,whatsapps,emails,website,instagram,facebook,linkedin,tiktok,fonte,coletado_em,observacao
```

- todos os campos entre aspas duplas; múltiplos valores separados por `" | "`
- `segmento`: código fixo por arquivo (ESCOLA, ODONTOLOGIA, TERAPIAS, PETSHOP,
  SALAO_BELEZA, CLINICA_ESTETICA, CLINICA_MEDICA)
- `bairros`: `"Bairro | Zona X"`
- telefones/whatsapps: `"(11) 1234-5678"`
- `fonte`: `"claude_chrome"` · `coletado_em`: `YYYY-MM-DD`
- `observacao`: `"[Tag] <endereço completo>; <detalhes do segmento>"`
