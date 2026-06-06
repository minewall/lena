# Lena — Backlog

Itens deferidos para retomar depois.

## Próximo passo combinado
- [ ] Após validar demanda (10+ interessados via `/interesse.html`), partir para o sistema funcional.

## Deferido — discutir em breve
- [x] **Lena v0.5 — automação inicial** → ver `automacao/` (esqueleto pronto p/ piloto, 2026-06-01)
  - [x] Prompt-base (system instruction) para Claude/GPT → `automacao/prompt-base.md`
  - [x] Template de respostas rápidas para WhatsApp Business App → `automacao/templates-whatsapp.md`
  - [x] Fluxo n8n/Make exportável (webhook → IA → resposta) → `automacao/fluxo-n8n.json`
  - [x] Lógica de "transferir para humano" quando foge do escopo → README §handoff
  - [ ] Pendente p/ v0.6: tools de agenda reais, estado multi-turno, trava de handoff
- [ ] **WhatsApp Business Cloud API**
  - Abrir MEI (se ainda não tem)
  - Verificação de negócio no Meta Business Manager (3-7 dias úteis)
  - Aprovação de Display Name (24-48h)
  - Decisão: Cloud API direto OU Z-API/360dialog (BSP)
- [ ] **Demo Nível 2** — sandbox real com LLM dentro da página (chat que chama Claude/GPT direto)
- [ ] **Demo Nível 3** — visitante digita telefone, recebe WhatsApp do Lena de verdade
- [ ] **Analytics** — Cloudflare Web Analytics (grátis, sem cookie banner)
- [ ] **OG image PNG** — exportar `og-image.html` para PNG 1200×630 e linkar nas metas
- [ ] **Tipografia + setor inicial** — afunilar campanha em UM nicho (sugestão: clínicas de estética/odonto)
- [ ] **Trust strip real** — substituir nomes-placeholder por logos de clientes reais quando tiver
- [ ] **Depoimentos reais** — após 3-5 clientes, fotos + cargo + quote no slot atual de "Para quem"
- [ ] **Política de Privacidade e Termos** — revisão por advogado antes de publicar campos `[entre colchetes]`
- [ ] **Snippet de redirecionamento WhatsApp → /obrigado.html** — para tracking de conversão

## Frentes em aberto (decisão de foco — 2026-06-01)
- ⏸️ **Parado por ora:** guia WhatsApp Business Cloud API (item #2) e Demo Nível 2/3 (item #3). Retomar depois.
- 🚀 **Frente ativa:** **Lead Generator** (`lead-generator/`) — prospecção B2B (salões, clínicas de estética, escolas, **petshops** SP — petshop adicionado 2026-06-01). MVP construído em 2026-06-01: scaffolding completo, Fase 1 (Google Places API), crawler Playwright, extractors (e-mail/WhatsApp/redes), classificação+score, export CSV, report HTML, CLI Typer, LGPD (opt-out + base legal), 9 testes passando. Decisões vs spec: Places API no lugar de scraping do Maps; LGPD como requisito de 1ª classe.
  - [ ] Pendente: Fase 6 (decisores via LLM) ainda desligada; rodar pipeline real com API key; escala via fila p/ 100k.
  - 📥 **Prospecção manual** (coletadas 2026-06-01, importar com `python -m src.cli import-prospects <arquivo>` quando o banco subir):
    - 50 clínicas de estética **SP** (CLINICA_ESTETICA) → `lead-generator/data/prospects_clinicas_sp.csv`
    - 34 clínicas de estética **Osasco** (CLINICA_ESTETICA) → `lead-generator/data/prospects_clinicas_osasco.csv`
    - 50 salões/cabeleireiros **SP** (SALAO_BELEZA) → `lead-generator/data/prospects_saloes_sp.csv`
    - 50 clínicas médicas **SP** + 25 **Osasco** + 20 **Campinas** (CLINICA_MEDICA) → `prospects_clinicas_medicas_{sp,osasco,campinas}.csv`
    - 30 petshops **SP** (PETSHOP, zonas Sul/Oeste/Norte; gerados via prompt na extensão Claude/Chrome — 28 com website p/ enrich) → `prospects_petshops_sp.csv`
    - 59 escolas **SP Zona Sul + Norte** (ESCOLA; subtipo em `observacao`: 11 Idiomas / 29 Colégio / 19 Curso) → `prospects_escolas_sp.csv` (faltam zonas Oeste/Leste/Centro)
    - 31 odontologia **SP Zona Sul** (ODONTOLOGIA; especialidade em `observacao`; 100% com website) → `prospects_odontologia_sp.csv` (faltam zonas Oeste/Norte/Leste/Centro)
    - 30 terapias **SP Zona Sul** (TERAPIAS; subtipo em `observacao`: 9 Psico / 9 Fisio / 5 Nutri / 7 Integrativas; 100% website) → `prospects_terapias_sp.csv` (faltam zonas Oeste/Norte/Leste/Centro)
    - Total: **379 leads** em 10 arquivos. Único segmento ainda sem coleta: IMOBILIARIA. Segmento na coluna `segmento`. Enum: SALAO_BELEZA, CLINICA_ESTETICA, CLINICA_MEDICA, ODONTOLOGIA, TERAPIAS, IMOBILIARIA, ESCOLA, PETSHOP, OUTROS (odonto/terapias/imobiliária add 2026-06-01; pousada foi removida a pedido).
    - ⚠️ Duplicatas cross-segment a resolver na importação: "MF Cabeleireiro" (salões) ≈ "MF Cabeleireiro / Clínica Estética"; "Clínica ComVida (Facebook)" (médicas Osasco) ≈ "Clínica ComVida" (estética Osasco). Campinas usa DDD (19).

## Ideias de produto (em desenho)
- 💡 **Add-on Campanhas de Reativação** (WhatsApp) — serviço extra, pacote de créditos mensal. v1 = reativação de base quente. Brief: `produto/campanhas-reativacao.md`. Depende do WhatsApp Cloud API (#2). Confirmar custo real Meta/BSP antes de fechar pricing.

## Site (reestruturado 2026-06-01 para validação)
- Reestruturado em 2 páginas de conversão: `/` (index.html) enxuta (hero resultado → diferenciais de recuperação de faturamento → demo clínica → como funciona → teaser planos → early adopter → FAQ → CTA) e `/precos` (precos.html, comparativo 3 planos + add-on campanhas "sob consulta"). Form `/interesse.html` enxugado (acaba após volume) + checkbox `interesse_campanhas`. OG/meta em todas; demo só clínica (com beat de sinal Pix); prova social = ângulo honesto de early adopter (sem depoimento/número falso). Recursos reais hoje: sinal Pix, reabastecimento/lista de espera, recorrência. "Relatório faturamento recuperado em R$" e "voz" = em breve.
- ⚠️ TODOs do site: (1) **token do Cloudflare Web Analytics** — placeholder `TOKEN_CLOUDFLARE` em index/precos/interesse/obrigado; conversão = views de /obrigado.html; (2) **OG image PNG 1200x630** — exportar de og-image.html e trocar o interino (assets/lena-avatar-1000.png).

## Notas de produto
- Margem do plano **Premium** (R$ 1.800 / 4.000 conversas) fica apertada se muitos lembretes utility. Considerar cobrar lembretes à parte ou reduzir cap para 2.000.
- Avaliar pricing por **resultado** (R$ X por agendamento confirmado) quando tiver dados reais de conversão.
