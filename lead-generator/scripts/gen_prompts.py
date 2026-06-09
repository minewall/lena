#!/usr/bin/env python3
"""Gera a biblioteca de prompts (Claude for Chrome) em lead-generator/prompts/,
um arquivo por segmento × zona, a partir da taxonomia abaixo. Fonte única de
verdade: edite SEGMENTS/ZONES e rode `python gen_prompts.py`.

Saída de cada prompt = CSV no schema do lead-generator, importável pelo
seed_prospects_sql.py (que mapeia o código do segmento -> rótulo legível)."""
import os

OUT = os.path.join(os.path.dirname(__file__), "..", "prompts")

# ── Zonas: label | slug do arquivo | slug do CSV | bairros-guia ──────────────
ZONES = {
    "Zona Sul": ("zona-sul", "sul",
        "Vila Mariana, Moema, Campo Belo, Santo Amaro, Jabaquara, Ipiranga, Saúde, "
        "Brooklin, Morumbi, Vila Olímpia, Itaim Bibi, Chácara Santo Antônio, "
        "Cidade Dutra, Capão Redondo, Interlagos."),
    "Zona Norte": ("zona-norte", "norte",
        "Santana, Tucuruvi, Casa Verde, Vila Maria, Mandaqui, Tremembé, Água Fria, "
        "Freguesia do Ó, Brasilândia, Limão, Vila Guilherme, Jaçanã."),
    "Centro": ("centro", "centro",
        "Sé, República, Santa Cecília, Consolação, Bela Vista, Higienópolis, "
        "Liberdade, Bom Retiro, Campos Elíseos, Pacaembu, Cambuci, Brás."),
    "Zona Leste": ("zona-leste", "leste",
        "Tatuapé, Mooca, Vila Prudente, Penha, Vila Formosa, Anália Franco, "
        "Vila Carrão, Aricanduva, Itaquera, São Mateus, Sapopemba, Vila Matilde, "
        "Belém, Ermelino Matarazzo, São Miguel Paulista, Itaim Paulista, Guaianases."),
    "Zona Oeste": ("zona-oeste", "oeste",
        "Lapa, Pinheiros, Perdizes, Pompeia, Vila Leopoldina, Butantã, "
        "Alto de Pinheiros, Vila Madalena, Jaguaré, Rio Pequeno, Barra Funda, "
        "Sumaré, Raposo Tavares."),
}
GAP4 = ["Zona Norte", "Centro", "Zona Leste", "Zona Oeste"]  # tudo menos Sul
NEW5 = list(ZONES.keys())                                     # segmento novo: 5 zonas

# ── Segmentos (ordem da lista de referência do Roberto) ──────────────────────
# code | prefix do arquivo | prefixo do CSV | título(plural caps) | foco(frase)
# | detalhe(o que descrever) | obs(instrução da observação) | zonas | meta
SEGMENTS = [
  # --- existentes (umbrella): só zonas com gap ---
  ("SALAO_BELEZA","salao","saloes","SALÕES DE BELEZA",
   "salões de beleza e cabeleireiros (corte, coloração, tratamentos).",
   "serviços oferecidos","\"[Salão] <endereço completo>; <serviços>\"",
   ["Zona Norte","Zona Leste","Zona Oeste"],"40 a 60"),
  ("CLINICA_ESTETICA","clinica-estetica","clinicas-esteticas","CLÍNICAS DE ESTÉTICA",
   "clínicas de estética avançada, dermato-estética e harmonização facial/corporal.",
   "procedimentos oferecidos","\"[Estética] <endereço completo>; <procedimentos>\"",
   ["Zona Norte","Zona Leste","Zona Oeste"],"40 a 60"),
  ("CLINICA_MEDICA","clinica-medica","clinicas-medicas","CONSULTÓRIOS E CLÍNICAS MÉDICAS",
   "consultórios e clínicas médicas (clínica geral e especialidades).",
   "especialidades médicas","começa com a especialidade entre colchetes (ex.: \"[Clínica geral]\", \"[Pediatria]\", \"[Dermatologia]\") + \"<endereço>; <especialidades>\"",
   ["Zona Sul","Zona Norte","Zona Leste","Zona Oeste"],"40 a 60"),
  ("PETSHOP","petshop","petshops","PETSHOPS",
   "pet shops e lojas de produtos para animais (banho e tosa, day care, hotel).",
   "serviços oferecidos","\"[Petshop] <endereço completo>; <serviços>\"",
   ["Centro","Zona Leste"],"30 a 50"),
  # --- novos (granular): 5 zonas ---
  ("BARBEARIA","barbearia","barbearias","BARBEARIAS",
   "barbearias e barbershops (corte masculino, barba, grooming).",
   "serviços oferecidos","\"[Barbearia] <endereço completo>; <serviços>\"",NEW5,"30 a 50"),
  ("FISIOTERAPIA","fisioterapia","fisioterapia","CLÍNICAS DE FISIOTERAPIA",
   "clínicas e consultórios de fisioterapia (ortopédica, RPG, pilates clínico, reabilitação).",
   "especialidades","\"[Fisioterapia] <endereço completo>; <especialidades>\"",NEW5,"30 a 50"),
  ("PSICOLOGIA","psicologia","psicologia","CONSULTÓRIOS DE PSICOLOGIA",
   "consultórios e clínicas de psicologia/psicoterapia.",
   "abordagens e públicos atendidos","\"[Psicologia] <endereço completo>; <abordagens>\"",NEW5,"30 a 50"),
  ("NUTRICAO","nutricao","nutricao","CONSULTÓRIOS DE NUTRIÇÃO",
   "consultórios de nutrição e nutricionistas (emagrecimento, esportiva, clínica).",
   "áreas de atuação","\"[Nutrição] <endereço completo>; <áreas>\"",NEW5,"30 a 50"),
  ("VETERINARIA","veterinaria","veterinarias","CLÍNICAS VETERINÁRIAS",
   "clínicas e hospitais veterinários (consultas, cirurgias, exames, vacinas).",
   "serviços e especialidades","\"[Veterinária] <endereço completo>; <serviços>\"",NEW5,"30 a 50"),
  ("OFICINA","oficina","oficinas","OFICINAS MECÂNICAS",
   "oficinas mecânicas, funilaria, auto elétrica e centros automotivos.",
   "tipo de serviço automotivo","\"[Oficina] <endereço completo>; <serviços>\"",NEW5,"30 a 50"),
  ("LOCADORA","locadora","locadoras","LOCADORAS",
   "locadoras de veículos e de equipamentos (eventos, construção, ferramentas).",
   "tipo de locação","\"[Locadora] <endereço completo>; <tipo de locação>\"",NEW5,"30 a 50"),
  ("IDIOMAS","idiomas","idiomas","ESCOLAS DE IDIOMAS",
   "escolas e cursos de idiomas (inglês, espanhol e outros).",
   "idiomas oferecidos","\"[Idiomas] <endereço completo>; <idiomas>\"",NEW5,"30 a 50"),
  ("ACADEMIA","academia","academias","ACADEMIAS",
   "academias de musculação, cross e ginástica.",
   "modalidades","\"[Academia] <endereço completo>; <modalidades>\"",NEW5,"30 a 50"),
  ("PILATES_YOGA","pilates-yoga","pilates-yoga","ESTÚDIOS DE PILATES E YOGA",
   "estúdios de pilates e de yoga.",
   "modalidades","\"[Pilates] ou [Yoga] + <endereço completo>; <modalidades>\"",NEW5,"30 a 50"),
  ("IMOBILIARIA","imobiliaria","imobiliarias","IMOBILIÁRIAS",
   "imobiliárias e corretoras de imóveis (venda e locação).",
   "atuação (venda/locação, residencial/comercial)","\"[Imobiliária] <endereço completo>; <atuação>\"",NEW5,"30 a 50"),
  ("ADVOCACIA","advocacia","advocacia","ESCRITÓRIOS DE ADVOCACIA",
   "escritórios de advocacia e advogados.",
   "áreas de atuação jurídica","\"[Advocacia] <endereço completo>; <áreas>\"",NEW5,"30 a 50"),
  ("CONTABILIDADE","contabilidade","contabilidade","ESCRITÓRIOS DE CONTABILIDADE",
   "escritórios de contabilidade e contadores.",
   "serviços contábeis","\"[Contabilidade] <endereço completo>; <serviços>\"",NEW5,"30 a 50"),
  ("AUTOESCOLA","autoescola","autoescolas","AUTOESCOLAS",
   "autoescolas / centros de formação de condutores (CFC).",
   "categorias de habilitação","\"[Autoescola] <endereço completo>; <categorias>\"",NEW5,"30 a 50"),
  ("EVENTOS_BUFFET","eventos-buffet","eventos-buffet","BUFFETS E EVENTOS",
   "buffets e empresas de eventos (infantil, casamento, corporativo).",
   "tipo de evento","\"[Buffet] ou [Eventos] + <endereço completo>; <tipo de evento>\"",NEW5,"30 a 50"),
  ("SPA","spa","spas","SPAS",
   "spas e day spas (massagem, relaxamento, bem-estar) — distinto de clínica de estética.",
   "serviços de bem-estar","\"[Spa] <endereço completo>; <serviços>\"",NEW5,"30 a 50"),
  ("TATUAGEM","tatuagem","tatuagem","ESTÚDIOS DE TATUAGEM",
   "estúdios de tatuagem e body piercing.",
   "estilos / serviços","\"[Tatuagem] <endereço completo>; <estilos>\"",NEW5,"30 a 50"),
  ("TRANSPORTADORA","transportadora","transportadoras","TRANSPORTADORAS",
   "transportadoras e empresas de logística/fretes/mudanças.",
   "tipo de transporte","\"[Transportadora] <endereço completo>; <tipo>\"",NEW5,"20 a 40"),
  ("INDUSTRIA","industria","industrias","INDÚSTRIAS",
   "indústrias e fábricas (qualquer ramo).",
   "ramo industrial","\"[Indústria] <endereço completo>; <ramo>\"",NEW5,"20 a 40"),
  ("ASSISTENCIA_TECNICA","assistencia-tecnica","assistencia-tecnica","ASSISTÊNCIAS TÉCNICAS",
   "assistências técnicas (eletrodomésticos, eletrônicos, celulares, informática).",
   "tipo de equipamento atendido","\"[Assistência] <endereço completo>; <equipamentos>\"",NEW5,"30 a 50"),
  ("SALAO_FESTA","salao-festa","saloes-festa","SALÕES DE FESTA",
   "salões de festa e espaços para eventos.",
   "capacidade e tipo de evento","\"[Salão de festa] <endereço completo>; <capacidade/tipo>\"",NEW5,"20 a 40"),
]

TEMPLATE = """<!-- Saída: salvar como lead-generator/data/{csv_name} -->
<!-- Gerado por scripts/gen_prompts.py — não editar à mão; edite o gerador. -->

Você é um assistente de prospecção B2B. MISSÃO: coletar {title} na cidade de
São Paulo, SOMENTE na {zona_phrase}. NÃO inclua outras zonas.

FOCO: {focus} Cada unidade/estabelecimento é um item separado.

BAIRROS-GUIA ({zona}) — não precisa se limitar a eles:
{bairros}

COMO COLETAR: use Google Maps, Google Search e os sites/Instagram oficiais. Para
cada estabelecimento, capture o máximo de: nome oficial; bairro + zona;
telefone(s) fixo(s); WhatsApp/celular (PRIORIDADE — abordamos primeiro quem tem
WhatsApp); e-mail(s); website, Instagram, Facebook, LinkedIn, TikTok; endereço
completo e {detalhe}.

REGRAS:
- Dados REAIS e verificáveis. NUNCA invente telefone, e-mail ou perfil. Campo não
  encontrado fica vazio.
- São contatos comerciais públicos de empresas (B2B). Não colete dados pessoais
  de indivíduos.
- Não duplique dentro da sua lista (mesma unidade/endereço). Unidades diferentes
  de uma mesma rede são itens distintos.
- Meta: {volume} estabelecimentos. Qualidade > quantidade: só inclua quem tiver
  ao menos um contato (telefone, WhatsApp, e-mail ou site).

FORMATO DE SAÍDA (obrigatório): um bloco de código CSV com ESTE cabeçalho EXATO e
todos os campos entre aspas duplas:

nome,segmento,bairros,telefones,whatsapps,emails,website,instagram,facebook,linkedin,tiktok,fonte,coletado_em,observacao

Convenções:
- segmento: sempre "{code}"
- bairros: "Bairro | {zona}"
- telefones e whatsapps: formato "(11) 1234-5678"; múltiplos separados por " | "
- emails: múltiplos separados por " | "
- website/instagram/facebook/linkedin/tiktok: URL completa ou vazio
- fonte: "claude_chrome"
- coletado_em: a data de hoje no formato AAAA-MM-DD
- observacao: {obs}

Entregue o CSV completo desta região quando terminar.
"""


def zona_phrase(label):
    return label.upper() if label.startswith("Zona") else f"região {label.upper()}"


def main():
    os.makedirs(OUT, exist_ok=True)
    n = 0
    for code, prefix, csv_prefix, title, focus, detalhe, obs, zonas, volume in SEGMENTS:
        for zona in zonas:
            fslug, cslug, bairros = ZONES[zona]
            md = TEMPLATE.format(
                csv_name=f"prospects_{csv_prefix}_sp_{cslug}.csv",
                title=title, zona_phrase=zona_phrase(zona), focus=focus,
                zona=zona, bairros=bairros, detalhe=detalhe, code=code,
                obs=obs, volume=volume,
            )
            with open(os.path.join(OUT, f"{prefix}_{fslug}.md"), "w", encoding="utf-8") as fh:
                fh.write(md)
            n += 1
    print(f"{n} prompts gerados em {os.path.normpath(OUT)}")


if __name__ == "__main__":
    main()
