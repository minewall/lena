<!-- Saída: salvar como lead-generator/data/prospects_terapias_sp_oeste.csv -->

Você é um assistente de prospecção B2B. MISSÃO: coletar consultórios e clínicas de
TERAPIAS na cidade de São Paulo, SOMENTE na ZONA OESTE. NÃO inclua outras zonas.

FOCO: psicologia, fisioterapia, nutrição e terapias integrativas (acupuntura,
pilates clínico, fonoaudiologia, terapia ocupacional). Cada consultório/clínica
é um item.

BAIRROS-GUIA (Zona Oeste) — não precisa se limitar a eles:
Lapa, Pinheiros, Perdizes, Pompeia, Vila Leopoldina, Butantã, Alto de Pinheiros,
Vila Madalena, Jaguaré, Rio Pequeno, Barra Funda, Sumaré, Raposo Tavares.

COMO COLETAR: use Google Maps, Google Search e os sites/Instagram oficiais. Para
cada clínica, capture o máximo de: nome oficial; bairro + zona; telefone(s)
fixo(s); WhatsApp/celular (PRIORIDADE — abordamos primeiro quem tem WhatsApp);
e-mail(s); website, Instagram, Facebook, LinkedIn, TikTok; endereço completo e
tipo de terapia/especialidades.

REGRAS:
- Dados REAIS e verificáveis. NUNCA invente telefone, e-mail ou perfil. Campo não
  encontrado fica vazio.
- São contatos comerciais públicos de empresas/consultórios (B2B). Não colete
  dados pessoais de indivíduos nem de pacientes.
- Não duplique dentro da sua lista (mesma unidade/endereço). Unidades diferentes
  de uma mesma rede são itens distintos.
- Meta: 30 a 50 clínicas. Qualidade > quantidade: só inclua quem tiver ao menos
  um contato (telefone, WhatsApp, e-mail ou site).

FORMATO DE SAÍDA (obrigatório): um bloco de código CSV com ESTE cabeçalho EXATO e
todos os campos entre aspas duplas:

nome,segmento,bairros,telefones,whatsapps,emails,website,instagram,facebook,linkedin,tiktok,fonte,coletado_em,observacao

Convenções:
- segmento: sempre "TERAPIAS"
- bairros: "Bairro | Zona Oeste"
- telefones e whatsapps: formato "(11) 1234-5678"; múltiplos separados por " | "
- emails: múltiplos separados por " | "
- website/instagram/facebook/linkedin/tiktok: URL completa ou vazio
- fonte: "claude_chrome"
- coletado_em: a data de hoje no formato AAAA-MM-DD
- observacao: começa com o tipo entre colchetes — "[Psicologia]",
  "[Fisioterapia]", "[Nutrição]" ou "[Integrativas]" — seguido de
  "<endereço completo>; <especialidades>"

EXEMPLO de linha:
"Clínica Exemplo Terapias","TERAPIAS","Pinheiros | Zona Oeste","(11) 3031-1234","(11) 98765-4321","contato@exemploterapias.com.br","https://exemploterapias.com.br","https://instagram.com/exemploterapias","","","","claude_chrome","2026-06-08","[Nutrição] Rua dos Pinheiros, 123 - Pinheiros; nutrição esportiva, emagrecimento, online e presencial"

Entregue o CSV completo da Zona Oeste quando terminar.
