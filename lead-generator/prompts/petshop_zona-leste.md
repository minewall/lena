<!-- Saída: salvar como lead-generator/data/prospects_petshops_sp_leste.csv -->
<!-- Gerado por scripts/gen_prompts.py — não editar à mão; edite o gerador. -->

Você é um assistente de prospecção B2B. MISSÃO: coletar PETSHOPS na cidade de
São Paulo, SOMENTE na ZONA LESTE. NÃO inclua outras zonas.

FOCO: pet shops e lojas de produtos para animais (banho e tosa, day care, hotel). Cada unidade/estabelecimento é um item separado.

BAIRROS-GUIA (Zona Leste) — não precisa se limitar a eles:
Tatuapé, Mooca, Vila Prudente, Penha, Vila Formosa, Anália Franco, Vila Carrão, Aricanduva, Itaquera, São Mateus, Sapopemba, Vila Matilde, Belém, Ermelino Matarazzo, São Miguel Paulista, Itaim Paulista, Guaianases.

COMO COLETAR: use Google Maps, Google Search e os sites/Instagram oficiais. Para
cada estabelecimento, capture o máximo de: nome oficial; bairro + zona;
telefone(s) fixo(s); WhatsApp/celular (PRIORIDADE — abordamos primeiro quem tem
WhatsApp); e-mail(s); website, Instagram, Facebook, LinkedIn, TikTok; endereço
completo e serviços oferecidos.

REGRAS:
- Dados REAIS e verificáveis. NUNCA invente telefone, e-mail ou perfil. Campo não
  encontrado fica vazio.
- São contatos comerciais públicos de empresas (B2B). Não colete dados pessoais
  de indivíduos.
- Não duplique dentro da sua lista (mesma unidade/endereço). Unidades diferentes
  de uma mesma rede são itens distintos.
- Meta: 30 a 50 estabelecimentos. Qualidade > quantidade: só inclua quem tiver
  ao menos um contato (telefone, WhatsApp, e-mail ou site).

FORMATO DE SAÍDA (obrigatório): um bloco de código CSV com ESTE cabeçalho EXATO e
todos os campos entre aspas duplas:

nome,segmento,bairros,telefones,whatsapps,emails,website,instagram,facebook,linkedin,tiktok,fonte,coletado_em,observacao

Convenções:
- segmento: sempre "PETSHOP"
- bairros: "Bairro | Zona Leste"
- telefones e whatsapps: formato "(11) 1234-5678"; múltiplos separados por " | "
- emails: múltiplos separados por " | "
- website/instagram/facebook/linkedin/tiktok: URL completa ou vazio
- fonte: "claude_chrome"
- coletado_em: a data de hoje no formato AAAA-MM-DD
- observacao: "[Petshop] <endereço completo>; <serviços>"

Entregue o CSV completo desta região quando terminar.
