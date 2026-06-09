<!-- Saída: salvar como lead-generator/data/prospects_odontologia_sp_leste.csv -->

Você é um assistente de prospecção B2B. MISSÃO: coletar CLÍNICAS E CONSULTÓRIOS
ODONTOLÓGICOS na cidade de São Paulo, SOMENTE na ZONA LESTE. NÃO inclua outras
zonas.

FOCO: clínicas de odontologia geral, implantodontia, ortodontia, odontopediatria,
estética dental e prótese. Cada unidade/consultório é um item.

BAIRROS-GUIA (Zona Leste) — não precisa se limitar a eles:
Tatuapé, Mooca, Vila Prudente, Penha, Vila Formosa, Anália Franco, Vila Carrão,
Aricanduva, Itaquera, São Mateus, Sapopemba, Vila Matilde, Belém, Ermelino
Matarazzo, São Miguel Paulista, Itaim Paulista, Guaianases.

COMO COLETAR: use Google Maps, Google Search e os sites/Instagram oficiais. Para
cada clínica, capture o máximo de: nome oficial; bairro + zona; telefone(s)
fixo(s); WhatsApp/celular (PRIORIDADE — abordamos primeiro quem tem WhatsApp);
e-mail(s); website, Instagram, Facebook, LinkedIn, TikTok; endereço completo e
especialidades odontológicas oferecidas.

REGRAS:
- Dados REAIS e verificáveis. NUNCA invente telefone, e-mail ou perfil. Campo não
  encontrado fica vazio.
- São contatos comerciais públicos de empresas (B2B). Não colete dados pessoais
  de indivíduos nem de pacientes.
- Não duplique dentro da sua lista (mesma unidade/endereço). Unidades diferentes
  de uma mesma rede são itens distintos.
- Meta: 30 a 50 clínicas. Qualidade > quantidade: só inclua quem tiver ao menos
  um contato (telefone, WhatsApp, e-mail ou site).

FORMATO DE SAÍDA (obrigatório): um bloco de código CSV com ESTE cabeçalho EXATO e
todos os campos entre aspas duplas:

nome,segmento,bairros,telefones,whatsapps,emails,website,instagram,facebook,linkedin,tiktok,fonte,coletado_em,observacao

Convenções:
- segmento: sempre "ODONTOLOGIA"
- bairros: "Bairro | Zona Leste"
- telefones e whatsapps: formato "(11) 1234-5678"; múltiplos separados por " | "
- emails: múltiplos separados por " | "
- website/instagram/facebook/linkedin/tiktok: URL completa ou vazio
- fonte: "claude_chrome"
- coletado_em: a data de hoje no formato AAAA-MM-DD
- observacao: começa com a especialidade principal entre colchetes — ex.:
  "[Implante]", "[Ortodontia]", "[Odontologia geral]", "[Estética dental]",
  "[Odontopediatria]" — seguida de "<endereço completo>; <especialidades>"

EXEMPLO de linha:
"Clínica Exemplo Odonto","ODONTOLOGIA","Tatuapé | Zona Leste","(11) 2098-1234","(11) 98765-4321","contato@exemploodonto.com.br","https://exemploodonto.com.br","https://instagram.com/exemploodonto","","","","claude_chrome","2026-06-08","[Ortodontia] Rua Tuiuti, 123 - Tatuapé; ortodontia, clínica geral, estética dental"

Entregue o CSV completo da Zona Leste quando terminar.
