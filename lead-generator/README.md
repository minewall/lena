# Lead Generator — Prospecção B2B (salões, clínicas de estética, escolas · SP)

Sistema de geração de leads que constrói uma base própria de empresas a partir de
**dados públicos**, para alimentar a prospecção da **Lena** (lena.ia.br).

> **Decisões de arquitetura tomadas no MVP** (diferem do spec original):
> - **Fonte de dados = Google Places API (New)**, não scraping do Maps. Estável, legal e dentro do ToS.
>   Scraping do Maps viola os termos do Google e quebra com CAPTCHA/consent wall.
> - **LGPD como requisito de 1ª classe**: campos de proveniência (`data_source`, `collected_at`,
>   `legal_basis`), tabela de **opt-out** (`do_not_contact`) e minimização de dados.
> - **Só extraímos** e-mails/telefones que aparecem no site — nunca adivinhamos (`comercial@dominio`).

## Stack
Python 3.12 · SQLAlchemy 2 · Pydantic v2 · Playwright · BeautifulSoup4 · PostgreSQL ·
Typer (CLI) · Loguru (logs) · Tenacity (retry) · Docker.

## Estrutura
```
lead-generator/
├── src/
│   ├── config.py            # settings via .env (pydantic-settings)
│   ├── logging_setup.py     # logs estruturados (Loguru)
│   ├── cli.py               # CLI Typer (entrypoint)
│   ├── maps/                # Fase 1 — Google Places API
│   ├── crawler/             # Fase 2 — Playwright (visita sites, respeita robots.txt)
│   ├── extractors/          # Fases 3-5 — e-mail / telefone-WhatsApp / redes sociais
│   ├── validators/          # schemas Pydantic
│   ├── database/            # modelos SQLAlchemy + sessão (campos LGPD)
│   ├── services/            # ingest, enrich, classifier (Fase 7), scoring (Fase 8)
│   ├── exports/             # Fase 9 — CSV
│   └── reports/             # Fase 10 — relatório HTML
├── sql/schema.sql           # schema de referência
├── tests/                   # testes unitários (extractors, classifier, scoring)
├── data/  logs/  exports/  reports/
├── docker-compose.yml  Dockerfile  requirements.txt
```

## Instalação

### Opção A — Docker (recomendado)
```bash
cd lead-generator
cp .env.example .env          # preencha GOOGLE_PLACES_API_KEY
docker compose up -d db       # sobe o PostgreSQL
docker compose run --rm app init-db
```

### Opção B — local
```bash
python3.12 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
playwright install chromium
cp .env.example .env          # POSTGRES_HOST=localhost e GOOGLE_PLACES_API_KEY
python -m src.cli init-db
```

> **Chave do Google é OPCIONAL.** Ela só habilita a Fase 1 (`search`, busca automática no Places).
> Todo o resto — importar listas manuais, enriquecer via crawler, exportar e relatórios — funciona sem ela.
> Para usar o `search`: Console GCP → ativar **"Places API (New)"** → criar API key → colar em `GOOGLE_PLACES_API_KEY`.

## Guia de execução

### Fluxo sem Google (listas manuais + enriquecimento)

```bash
# Importa sua lista (CSV). Se a linha tiver coluna `website`, fica pronta para o crawler.
python -m src.cli import-prospects data/minha_lista.csv

# Fases 2-6 — visita o site das empresas COM website e extrai e-mail/WhatsApp/redes, recalcula score
python -m src.cli enrich --limit 50

# Exporta e gera relatório
python -m src.cli export --min-score 40
python -m src.cli report
```

### Fluxo com Google (busca automática, requer a key)

```bash
# Fase 1 — busca e persiste empresas (dedup por place_id)
python -m src.cli search --segment all       # ou: salao | clinica | escola

# Fases 2-6 — visita sites, extrai e-mail/WhatsApp/redes, recalcula score
python -m src.cli enrich --limit 50

# Fase 9 — exporta CSV (filtra por score mínimo)
python -m src.cli export --min-score 40

# Fase 10 — relatório de qualidade
python -m src.cli report

# Tudo de uma vez
python -m src.cli pipeline --segment all

# LGPD — opt-out
python -m src.cli optout adicionar contato@empresa.com
```
Saídas em `exports/leads.csv` e `reports/report.html`.

### Testes
```bash
pytest            # extractors, classificação e scoring (puros, sem dependências externas)
```

## Modelo de dados
`companies` (1) ──< `company_emails` / `company_phones` / `company_socials` / `company_contacts`.
Mais `do_not_contact` (opt-out). Ver `sql/schema.sql` e `src/database/models.py`.
Chave natural de deduplicação: **`place_id`** do Google (upsert); listas manuais deduplicam por **nome**.

## Formato do CSV de prospecção manual

Colunas (use `data/_template_prospects.csv` como base):

```text
nome,segmento,bairros,telefones,whatsapps,emails,website,instagram,facebook,linkedin,tiktok,fonte,coletado_em,observacao
```

- **nome** (obrigatório) e **segmento** (`SALAO_BELEZA` | `CLINICA_ESTETICA` | `CLINICA_MEDICA` | `ODONTOLOGIA` | `TERAPIAS` | `IMOBILIARIA` | `ESCOLA` | `PETSHOP` | `OUTROS`).
- Campos com **múltiplos valores**: separe por ` | ` (ex.: dois telefones, dois e-mails, várias unidades em `bairros`).
- **telefones** = fixos (`type=phone`); **whatsapps** = WhatsApp (`type=whatsapp`). Normalizados para `+55…` na importação.
- **website** opcional: se preenchido, a empresa fica `pending` para o crawler (`enrich`) extrair mais dados; senão, `done`.
- **instagram/facebook/linkedin/tiktok**: URL completa. Viram registros em `company_socials` e contam no score.
- Campos vazios são aceitos (deixe `""`). Importe com `import-prospects <arquivo>`.

## Score de qualidade (Fase 8)
Website +20 · E-mail +20 · WhatsApp +20 · Instagram +10 · LinkedIn +10 · Decisor +20 → 0-100.

## Decisores (Fase 6) — opcional e sensível
Desligado por padrão. Para ativar, configure `LLM_PROVIDER` (`anthropic`/`openai`) no `.env`.
Coleta **nome + cargo** (dado pessoal) apenas de páginas públicas sobre/equipe/diretoria,
sob **legítimo interesse** registrado em `company_contacts.legal_basis`.

## Compliance (LGPD)
- Apenas dados públicos e corporativos. Sem CPF, sem dado sensível.
- Sem acesso a áreas autenticadas, sem quebra de CAPTCHA, sem bypass.
- `robots.txt` verificado antes de cada visita (`src/crawler/website.py`).
- Base legal **legítimo interesse (art. 7º, IX)** registrada por contato; recomenda-se
  documentar o teste de proporcionalidade (LIA).
- **Opt-out** atendido via tabela `do_not_contact` (art. 18) — verificado no enriquecimento.

## Estratégia de escalabilidade (100 mil empresas)
O MVP roda single-process. Para escalar:
1. **Fila de trabalho**: trocar laços por **arq/Celery/RQ** com workers; 1 empresa = 1 task.
   `enrich_status` (pending/done/failed) já habilita reprocessamento idempotente.
2. **Particionamento de busca**: o Places limita ~60 resultados/query. Particione por
   **bairro × categoria** (ex.: "salão de beleza Moema") para ampliar cobertura sem duplicar.
3. **Crawler distribuído**: pool de browsers Playwright em múltiplos workers, com
   **proxies rotativos** e rate limit por domínio.
4. **Banco**: índices já previstos; adicionar particionamento por `segment`/`neighborhood`
   e connection pool (PgBouncer) sob alto volume.
5. **Custo**: cache de resultados do Places; só re-enriquecer empresas com `collected_at`
   antigo (crawl incremental).
6. **Observabilidade**: logs JSON (já via Loguru) → Loki/Grafana; métricas de taxa de enriquecimento.

## Melhorias futuras
- [ ] Fase 6 (decisores) com LLM + `prompt_caching`, reaproveitando o estilo da Lena.
- [ ] **Bônus**: geração de mensagem de abordagem personalizada por lead (reusa `automacao/prompt-base.md` da Lena).
- [ ] Enriquecimento via **CNPJ/Receita** (sócios, situação cadastral) como fonte legal complementar.
- [ ] Deduplicação fuzzy por nome+endereço além do `place_id`.
- [ ] Validação de e-mail por MX/SMTP (sem enviar) para subir a qualidade.
- [ ] Painel web (em vez de report estático) com filtros por bairro/segmento/score.

## Integração com a Lena
```
search → enrich → leads.csv (score) → mensagem personalizada (prompt-base da Lena)
       → abordagem no WhatsApp → /interesse.html → cliente Lena
```
