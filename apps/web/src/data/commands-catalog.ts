/**
 * Catálogo Oficial dos 70 Comandos Inteligentes de IA para o Cockpit do Web App.
 * Extraído diretamente do catálogo canônico do motor NLU.
 */

export interface CockpitCommand {
  id: number;
  internalName: string;
  title: string;
  intent: string;
  userPhrase: string;
  allPhrases: string[];
  category:
    | 'Básico'
    | 'Ensaios'
    | 'Aniversários'
    | 'Casamentos'
    | 'Natureza'
    | 'Eventos'
    | 'Motion visual'
    | 'Comercial';
  complexity: 'low' | 'medium' | 'high';
  credits: number;
  tags: string[];
}

export const COCKPIT_COMMANDS: CockpitCommand[] = [
  {
    "id": 1,
    "internalName": "remove_background",
    "title": "Remoção de Fundo Inteligente",
    "intent": "Remover o fundo da imagem e isolar o assunto principal em estúdio neutro.",
    "userPhrase": "Tira o fundo",
    "allPhrases": [
      "Tira o fundo",
      "Remove o fundo",
      "Fundo de estúdio",
      "Isola a pessoa"
    ],
    "category": "Básico",
    "complexity": "low",
    "credits": 1,
    "tags": [
      "fundo",
      "remover",
      "estudio",
      "isolar",
      "neutro"
    ]
  },
  {
    "id": 2,
    "internalName": "transparent_background",
    "title": "Fundo Transparente (PNG Puro)",
    "intent": "Recortar o assunto em alta resolução com canal alfa transparente puro.",
    "userPhrase": "Fundo transparente",
    "allPhrases": [
      "Fundo transparente",
      "Foto em PNG",
      "Recorta sem fundo",
      "Sem nada atrás"
    ],
    "category": "Básico",
    "complexity": "low",
    "credits": 1,
    "tags": [
      "png",
      "transparente",
      "recorte",
      "alfa",
      "vazado"
    ]
  },
  {
    "id": 3,
    "internalName": "replace_background",
    "title": "Substituição Completa de Cenário",
    "intent": "Substituir o fundo por um novo cenário solicitado.",
    "userPhrase": "Muda o fundo",
    "allPhrases": [
      "Muda o fundo",
      "Troca o cenário",
      "Coloca outro fundo",
      "Muda o que tá atrás"
    ],
    "category": "Básico",
    "complexity": "medium",
    "credits": 1,
    "tags": [
      "fundo",
      "cenario",
      "trocar",
      "substituir",
      "ambiente"
    ]
  },
  {
    "id": 4,
    "internalName": "remove_people",
    "title": "Remover Pessoas & Pedestres",
    "intent": "Eliminar pessoas indesejadas, pedestres e figurantes ao fundo.",
    "userPhrase": "Tira as pessoas atrás",
    "allPhrases": [
      "Tira as pessoas atrás",
      "Apaga os figurantes",
      "Remove quem tá no fundo",
      "Só eu na foto"
    ],
    "category": "Básico",
    "complexity": "medium",
    "credits": 1,
    "tags": [
      "remover",
      "pessoas",
      "figurantes",
      "pedestres",
      "apagar"
    ]
  },
  {
    "id": 5,
    "internalName": "remove_objects",
    "title": "Apagar Objetos, Placas & Distrações",
    "intent": "Remover objetos, placas, postes ou distrações indesejadas da foto.",
    "userPhrase": "Tira esse objeto",
    "allPhrases": [
      "Tira esse objeto",
      "Apaga o poste",
      "Limpa a foto",
      "Tira a sujeira"
    ],
    "category": "Básico",
    "complexity": "low",
    "credits": 1,
    "tags": [
      "objeto",
      "apagar",
      "remover",
      "limpar",
      "placa",
      "poste"
    ]
  },
  {
    "id": 6,
    "internalName": "improve_lighting",
    "title": "Iluminação Profissional de Estúdio",
    "intent": "Corrigir iluminação fraca, sombras duras ou superexposição com luz de estúdio.",
    "userPhrase": "Melhora a iluminação",
    "allPhrases": [
      "Melhora a iluminação",
      "Clareia a foto",
      "Ajusta a luz",
      "Tira a sombra do rosto"
    ],
    "category": "Básico",
    "complexity": "low",
    "credits": 1,
    "tags": [
      "luz",
      "iluminacao",
      "clarear",
      "sombra",
      "exposicao"
    ]
  },
  {
    "id": 7,
    "internalName": "improve_colors",
    "title": "Aprimoramento de Cores & Tom de Pele",
    "intent": "Calibrar balanço de cores, tons de pele e saturação cinematográfica.",
    "userPhrase": "Melhora as cores",
    "allPhrases": [
      "Melhora as cores",
      "Deixa mais viva",
      "Corrige a cor",
      "Pele bonita"
    ],
    "category": "Básico",
    "complexity": "low",
    "credits": 1,
    "tags": [
      "cor",
      "cores",
      "colorir",
      "pele",
      "saturacao",
      "vivo"
    ]
  },
  {
    "id": 8,
    "internalName": "sharpen",
    "title": "Super-Resolução & Nitidez Óptica",
    "intent": "Aumentar a nitidez óptica e super-resolução sem artefatos plásticos.",
    "userPhrase": "Aumenta a nitidez",
    "allPhrases": [
      "Aumenta a nitidez",
      "Deixa mais nítida",
      "Melhora a resolução",
      "Foco perfeito"
    ],
    "category": "Básico",
    "complexity": "low",
    "credits": 1,
    "tags": [
      "nitidez",
      "resolucao",
      "foco",
      "detalhes",
      "qualidade"
    ]
  },
  {
    "id": 9,
    "internalName": "restore_photo",
    "title": "Restauração de Foto Antiga / Danificada",
    "intent": "Restaurar fotografia antiga danificada, removendo arranhões e recuperando nitidez.",
    "userPhrase": "Restaura foto antiga",
    "allPhrases": [
      "Restaura foto antiga",
      "Recupera foto rasgada",
      "Foto velha",
      "Conserta foto antiga"
    ],
    "category": "Básico",
    "complexity": "medium",
    "credits": 1,
    "tags": [
      "restaurar",
      "antiga",
      "velha",
      "rasgada",
      "mancha",
      "recuperar"
    ]
  },
  {
    "id": 10,
    "internalName": "product_photo",
    "title": "Foto de Produto para E-commerce",
    "intent": "Transformar fotografia de produto em foto profissional de catálogo comercial.",
    "userPhrase": "Foto de produto",
    "allPhrases": [
      "Foto de produto",
      "Foto pra vender",
      "Foto pra e-commerce",
      "Foto de catálogo"
    ],
    "category": "Básico",
    "complexity": "medium",
    "credits": 1,
    "tags": [
      "produto",
      "vender",
      "ecommerce",
      "loja",
      "catalogo"
    ]
  },
  {
    "id": 11,
    "internalName": "add_elements",
    "title": "Adicionar Elementos & Adereços",
    "intent": "Inserir adereços, objetos decorativos ou elementos visuais mantendo a física da cena.",
    "userPhrase": "Coloca um chapéu",
    "allPhrases": [
      "Coloca um chapéu",
      "Adiciona flores",
      "Coloca óculos",
      "Bota elementos"
    ],
    "category": "Básico",
    "complexity": "medium",
    "credits": 1,
    "tags": [
      "adicionar",
      "colocar",
      "inserir",
      "aderecos",
      "objetos"
    ]
  },
  {
    "id": 12,
    "internalName": "replace_elements",
    "title": "Trocar Roupas & Acessórios",
    "intent": "Substituir roupas, móveis ou detalhes específicos por novos itens fotorrealistas.",
    "userPhrase": "Troca minha roupa",
    "allPhrases": [
      "Troca minha roupa",
      "Muda a cor da camisa",
      "Troca o casaco",
      "Muda o vestido"
    ],
    "category": "Básico",
    "complexity": "medium",
    "credits": 1,
    "tags": [
      "trocar",
      "mudar",
      "roupa",
      "camisa",
      "vestido",
      "substituir"
    ]
  },
  {
    "id": 13,
    "internalName": "variations",
    "title": "Variações Criativas & Ângulos",
    "intent": "Gerar variações criativas e alternativas estéticas da imagem.",
    "userPhrase": "Gera variações",
    "allPhrases": [
      "Gera variações",
      "Me dá opções diferentes",
      "Outras versões",
      "Faz alternativas"
    ],
    "category": "Básico",
    "complexity": "medium",
    "credits": 1,
    "tags": [
      "variacoes",
      "opcoes",
      "alternativas",
      "versoes"
    ]
  },
  {
    "id": 14,
    "internalName": "free_prompt",
    "title": "Criação Livre por Linguagem Natural",
    "intent": "Edição livre e composições artísticas personalizadas descritas pelo usuário.",
    "userPhrase": "Edição livre",
    "allPhrases": [
      "Edição livre",
      "Faz o que eu escrever",
      "Criação livre",
      "Do meu jeito"
    ],
    "category": "Básico",
    "complexity": "medium",
    "credits": 1,
    "tags": [
      "livre",
      "prompt",
      "personalizado",
      "customizado"
    ]
  },
  {
    "id": 15,
    "internalName": "studio_portrait",
    "title": "Ensaio Fotográfico de Estúdio",
    "intent": "Transformar uma foto comum em um retrato profissional de estúdio.",
    "userPhrase": "Deixa minha foto profissional",
    "allPhrases": [
      "Deixa minha foto profissional",
      "Quero parecer que tirei em estúdio",
      "Foto de estúdio",
      "Faz um ensaio fotográfico meu"
    ],
    "category": "Ensaios",
    "complexity": "medium",
    "credits": 1,
    "tags": [
      "estudio",
      "profissional",
      "retrato",
      "editorial",
      "softbox"
    ]
  },
  {
    "id": 16,
    "internalName": "elegant_female_editorial",
    "title": "Editorial Feminino Elegante & Chique",
    "intent": "Criar um retrato feminino sofisticado.",
    "userPhrase": "Quero uma foto feminina elegante",
    "allPhrases": [
      "Quero uma foto feminina elegante",
      "Me coloca num ensaio chique",
      "Foto elegante de mulher",
      "Ensaio feminino fino"
    ],
    "category": "Ensaios",
    "complexity": "medium",
    "credits": 1,
    "tags": [
      "feminino",
      "elegante",
      "chique",
      "fino",
      "ensaio",
      "mulher"
    ]
  },
  {
    "id": 17,
    "internalName": "cinematic_male_portrait",
    "title": "Retrato Masculino Cinematográfico",
    "intent": "Criar retrato masculino dramático.",
    "userPhrase": "Quero uma foto estilo filme",
    "allPhrases": [
      "Quero uma foto estilo filme",
      "Me deixa com visual cinematográfico",
      "Foto de homem estilo cinema",
      "Retrato dramático masculino"
    ],
    "category": "Ensaios",
    "complexity": "medium",
    "credits": 1,
    "tags": [
      "masculino",
      "cinematografico",
      "filme",
      "dramatico",
      "cinema",
      "homem"
    ]
  },
  {
    "id": 18,
    "internalName": "maternity_portrait",
    "title": "Ensaio Gestante & Maternidade",
    "intent": "Criar um retrato delicado de gestante.",
    "userPhrase": "Quero um ensaio de grávida",
    "allPhrases": [
      "Quero um ensaio de grávida",
      "Faz uma foto de gestante bonita",
      "Foto de maternidade",
      "Ensaio de gravidez"
    ],
    "category": "Ensaios",
    "complexity": "medium",
    "credits": 1,
    "tags": [
      "gestante",
      "gravida",
      "maternidade",
      "gravidez",
      "mae"
    ]
  },
  {
    "id": 19,
    "internalName": "romantic_couple",
    "title": "Ensaio Romântico de Casal",
    "intent": "Criar um ensaio romântico de casal.",
    "userPhrase": "Deixa nossa foto romântica",
    "allPhrases": [
      "Deixa nossa foto romântica",
      "Quero um ensaio de casal",
      "Foto de namorados apaixonados",
      "Foto romântica com meu amor"
    ],
    "category": "Ensaios",
    "complexity": "medium",
    "credits": 1,
    "tags": [
      "casal",
      "romantico",
      "namorados",
      "amor",
      "apaixonados",
      "dois"
    ]
  },
  {
    "id": 20,
    "internalName": "children_portrait",
    "title": "Retrato Infantil Profissional",
    "intent": "Criar retrato infantil profissional.",
    "userPhrase": "Faz um ensaio do meu filho",
    "allPhrases": [
      "Faz um ensaio do meu filho",
      "Deixa essa foto infantil mais bonita",
      "Foto profissional da minha filha",
      "Ensaio de crianca"
    ],
    "category": "Ensaios",
    "complexity": "medium",
    "credits": 1,
    "tags": [
      "infantil",
      "filho",
      "filha",
      "crianca",
      "bebe",
      "kids"
    ]
  },
  {
    "id": 21,
    "internalName": "graduation_portrait",
    "title": "Retrato Solene de Formatura (Beca)",
    "intent": "Criar fotografia comemorativa de formatura.",
    "userPhrase": "Quero foto de formatura",
    "allPhrases": [
      "Quero foto de formatura",
      "Me coloca num ensaio de formando",
      "Foto de graduacao",
      "Ensaio com beca de formatura"
    ],
    "category": "Ensaios",
    "complexity": "medium",
    "credits": 1,
    "tags": [
      "formatura",
      "formando",
      "formanda",
      "graduacao",
      "academico"
    ]
  },
  {
    "id": 22,
    "internalName": "corporate_headshot",
    "title": "Foto Corporativa para LinkedIn & Currículo",
    "intent": "Criar fotografia para currículo, trabalho ou LinkedIn.",
    "userPhrase": "Quero foto pro trabalho",
    "allPhrases": [
      "Quero foto pro trabalho",
      "Deixa profissional para LinkedIn",
      "Foto executiva",
      "Foto de perfil profissional para curriculo"
    ],
    "category": "Ensaios",
    "complexity": "medium",
    "credits": 1,
    "tags": [
      "trabalho",
      "linkedin",
      "curriculo",
      "corporativo",
      "executivo",
      "headshot"
    ]
  },
  {
    "id": 23,
    "internalName": "kids_birthday",
    "title": "Festa Infantil Temática de Aniversário",
    "intent": "Criar ambiente festivo infantil de aniversário.",
    "userPhrase": "Coloca decoração de aniversário",
    "allPhrases": [
      "Coloca decoração de aniversário",
      "Faz uma foto de aniversário pro meu filho",
      "Festa infantil na foto",
      "Balões de aniversário de criança"
    ],
    "category": "Aniversários",
    "complexity": "medium",
    "credits": 1,
    "tags": [
      "aniversario",
      "infantil",
      "baloes",
      "festa",
      "parabens"
    ]
  },
  {
    "id": 24,
    "internalName": "quinceanera_luxury",
    "title": "Ensaio Debutante / Festa de 15 Anos",
    "intent": "Transformar a fotografia em ensaio de debutante / festa de 15 anos.",
    "userPhrase": "Quero foto de 15 anos",
    "allPhrases": [
      "Quero foto de 15 anos",
      "Faz uma festa de princesa",
      "Foto de debutante",
      "Ensaio de 15 anos de luxo"
    ],
    "category": "Aniversários",
    "complexity": "high",
    "credits": 2,
    "tags": [
      "15 anos",
      "debutante",
      "princesa",
      "quinceanera",
      "luxo"
    ]
  },
  {
    "id": 25,
    "internalName": "adult_birthday_luxury",
    "title": "Celebração de Aniversário Adulto Luxo",
    "intent": "Criar fotografia de aniversário adulto sofisticada.",
    "userPhrase": "Quero aniversário de luxo",
    "allPhrases": [
      "Quero aniversário de luxo",
      "Faz uma foto de aniversário elegante",
      "Festa adulta chique",
      "Comemoração de aniversário vip"
    ],
    "category": "Aniversários",
    "complexity": "medium",
    "credits": 1,
    "tags": [
      "aniversario",
      "luxo",
      "adulto",
      "champagne",
      "chique",
      "vip"
    ]
  },
  {
    "id": 26,
    "internalName": "surprise_party",
    "title": "Festa Surpresa com Balões & Confetes",
    "intent": "Adicionar atmosfera de festa surpresa com balões e confetes.",
    "userPhrase": "Coloca uma festa surpresa",
    "allPhrases": [
      "Coloca uma festa surpresa",
      "Enche de balões e confetes",
      "Foto de festa animada",
      "Clima de surpresa de aniversário"
    ],
    "category": "Aniversários",
    "complexity": "medium",
    "credits": 1,
    "tags": [
      "surpresa",
      "baloes",
      "confetes",
      "festa",
      "animada"
    ]
  },
  {
    "id": 27,
    "internalName": "garden_birthday",
    "title": "Aniversário ao Ar Livre em Jardim",
    "intent": "Criar celebração de aniversário ao ar livre no jardim.",
    "userPhrase": "Quero aniversário num jardim",
    "allPhrases": [
      "Quero aniversário num jardim",
      "Coloca minha festa ao ar livre",
      "Aniversário no parque com flores",
      "Piquenique de aniversário"
    ],
    "category": "Aniversários",
    "complexity": "medium",
    "credits": 1,
    "tags": [
      "jardim",
      "ar livre",
      "natureza",
      "piquenique",
      "festa"
    ]
  },
  {
    "id": 28,
    "internalName": "smash_cake",
    "title": "Ensaio Infantil Smash the Cake",
    "intent": "Criar cenário de ensaio infantil smash the cake com bolo.",
    "userPhrase": "Faz ensaio smash the cake",
    "allPhrases": [
      "Faz ensaio smash the cake",
      "Coloca meu bebê num cenário com bolo",
      "Ensaio com bolo infantil",
      "Smash the cake"
    ],
    "category": "Aniversários",
    "complexity": "high",
    "credits": 2,
    "tags": [
      "smash",
      "cake",
      "bolo",
      "bebe",
      "ensaio"
    ]
  },
  {
    "id": 29,
    "internalName": "neon_birthday",
    "title": "Balada Neon & Aniversário Noturno",
    "intent": "Aplicar cenário festivo moderno com iluminação neon.",
    "userPhrase": "Quero festa neon",
    "allPhrases": [
      "Quero festa neon",
      "Deixa aniversário com luz colorida",
      "Balada neon de aniversário",
      "Luzes neon na comemoração"
    ],
    "category": "Aniversários",
    "complexity": "medium",
    "credits": 1,
    "tags": [
      "neon",
      "luzes",
      "colorida",
      "balada",
      "moderna"
    ]
  },
  {
    "id": 30,
    "internalName": "birthday_portrait",
    "title": "Retrato com Vela Acesa & Bolo",
    "intent": "Destacar o aniversariante com retrato comemorativo especial.",
    "userPhrase": "Faz uma foto bonita pro meu aniversário",
    "allPhrases": [
      "Faz uma foto bonita pro meu aniversário",
      "Me destaca na foto",
      "Retrato de aniversário",
      "Foto especial de meu dia"
    ],
    "category": "Aniversários",
    "complexity": "medium",
    "credits": 1,
    "tags": [
      "aniversariante",
      "destaque",
      "parabens",
      "meu dia",
      "comemorativo"
    ]
  },
  {
    "id": 31,
    "internalName": "classic_wedding",
    "title": "Casamento Clássico & Cerimonial",
    "intent": "Produzir fotografia matrimonial clássica e elegante.",
    "userPhrase": "Transforma em foto de casamento",
    "allPhrases": [
      "Transforma em foto de casamento",
      "Quero casamento clássico",
      "Foto de noivos na igreja",
      "Ensaio de casamento tradicional"
    ],
    "category": "Casamentos",
    "complexity": "high",
    "credits": 2,
    "tags": [
      "casamento",
      "classico",
      "noivos",
      "igreja",
      "matrimonial"
    ]
  },
  {
    "id": 32,
    "internalName": "beach_wedding",
    "title": "Casamento Pé na Areia ao Pôr do Sol",
    "intent": "Criar cenário matrimonial romântico na praia ao pôr do sol.",
    "userPhrase": "Coloca nosso casamento na praia",
    "allPhrases": [
      "Coloca nosso casamento na praia",
      "Quero casar no pôr do sol",
      "Casamento beira mar",
      "Noivos na praia"
    ],
    "category": "Casamentos",
    "complexity": "high",
    "credits": 2,
    "tags": [
      "casamento",
      "praia",
      "por do sol",
      "mar",
      "litoral"
    ]
  },
  {
    "id": 33,
    "internalName": "countryside_wedding",
    "title": "Casamento Campestre & Rústico Chique",
    "intent": "Criar cerimônia matrimonial em ambiente campestre ao ar livre.",
    "userPhrase": "Quero casamento no campo",
    "allPhrases": [
      "Quero casamento no campo",
      "Coloca a gente num jardim de casamento",
      "Casamento rústico chique",
      "Casamento na fazenda"
    ],
    "category": "Casamentos",
    "complexity": "medium",
    "credits": 1,
    "tags": [
      "campo",
      "fazenda",
      "rustico",
      "jardim",
      "verde"
    ]
  },
  {
    "id": 34,
    "internalName": "pre_wedding_editorial",
    "title": "Ensaio Pré-Wedding Romântico",
    "intent": "Criar ensaio romântico de pré-wedding antes do casamento.",
    "userPhrase": "Quero pré-wedding",
    "allPhrases": [
      "Quero pré-wedding",
      "Faz um ensaio romântico nosso",
      "Foto de pre-wedding",
      "Ensaio antes do casamento"
    ],
    "category": "Casamentos",
    "complexity": "medium",
    "credits": 1,
    "tags": [
      "pre wedding",
      "pre-wedding",
      "noivos",
      "romantico",
      "ensaio"
    ]
  },
  {
    "id": 35,
    "internalName": "night_wedding",
    "title": "Casamento Noturno com Iluminação Cênica",
    "intent": "Aplicar estética de casamento noturno com luzes de fada e bokeh.",
    "userPhrase": "Coloca casamento à noite",
    "allPhrases": [
      "Coloca casamento à noite",
      "Quero foto com luzes de casamento",
      "Casamento noturno romântico",
      "Foto de noivos com luzinhas"
    ],
    "category": "Casamentos",
    "complexity": "high",
    "credits": 2,
    "tags": [
      "casamento",
      "noite",
      "luzes",
      "fairy lights",
      "bokeh"
    ]
  },
  {
    "id": 36,
    "internalName": "cinematic_newlyweds",
    "title": "Retrato Cinematográfico dos Recém-Casados",
    "intent": "Criar retrato cinematográfico dramático de casal de noivos.",
    "userPhrase": "Deixa nosso casamento estilo cinema",
    "allPhrases": [
      "Deixa nosso casamento estilo cinema",
      "Faz foto de filme dos noivos",
      "Noivos de cinema",
      "Cena de filme romântico"
    ],
    "category": "Casamentos",
    "complexity": "high",
    "credits": 2,
    "tags": [
      "cinema",
      "filme",
      "noivos",
      "dramatico",
      "cinematografico"
    ]
  },
  {
    "id": 37,
    "internalName": "luxury_wedding",
    "title": "Casamento Alto Luxo com Lustres de Cristal",
    "intent": "Criar cenário matrimonial de altíssimo luxo com lustres e flores.",
    "userPhrase": "Quero casamento de luxo",
    "allPhrases": [
      "Quero casamento de luxo",
      "Coloca decoração chique",
      "Casamento milionário",
      "Casamento em palácio"
    ],
    "category": "Casamentos",
    "complexity": "high",
    "credits": 2,
    "tags": [
      "luxo",
      "palacio",
      "lustres",
      "cristal",
      "milionario"
    ]
  },
  {
    "id": 38,
    "internalName": "vintage_wedding",
    "title": "Casamento Vintage & Estética Nostálgica",
    "intent": "Aplicar estilo clássico nostálgico vintage de casamento.",
    "userPhrase": "Deixa casamento antigo",
    "allPhrases": [
      "Deixa casamento antigo",
      "Quero foto vintage",
      "Casamento anos 80 ou 90",
      "Foto com ar nostálgico de casamento"
    ],
    "category": "Casamentos",
    "complexity": "medium",
    "credits": 1,
    "tags": [
      "vintage",
      "nostalgico",
      "antigo",
      "filme",
      "classico"
    ]
  },
  {
    "id": 39,
    "internalName": "sunset_park",
    "title": "Parque Dourado ao Entardecer",
    "intent": "Inserir atmosfera de parque ao entardecer com luz dourada.",
    "userPhrase": "Me coloca no parque ao pôr do sol",
    "allPhrases": [
      "Me coloca no parque ao pôr do sol",
      "Quero luz de fim de tarde",
      "Foto no parque no por do sol",
      "Golden hour no parque"
    ],
    "category": "Natureza",
    "complexity": "medium",
    "credits": 1,
    "tags": [
      "parque",
      "por do sol",
      "entardecer",
      "golden hour",
      "tarde"
    ]
  },
  {
    "id": 40,
    "internalName": "enchanted_garden",
    "title": "Jardim Encantado & Floral Suave",
    "intent": "Criar cenário floral fantasioso de jardim encantado.",
    "userPhrase": "Me coloca num jardim encantado",
    "allPhrases": [
      "Me coloca num jardim encantado",
      "Quero flores e luzes mágicas",
      "Jardim de conto de fadas",
      "Mundo mágico de flores"
    ],
    "category": "Natureza",
    "complexity": "medium",
    "credits": 1,
    "tags": [
      "jardim",
      "encantado",
      "magico",
      "flores",
      "fadas"
    ]
  },
  {
    "id": 41,
    "internalName": "cinematic_forest",
    "title": "Floresta Mística com Raios de Sol",
    "intent": "Criar cenário florestal dramático com raios de sol e névoa.",
    "userPhrase": "Me coloca numa floresta",
    "allPhrases": [
      "Me coloca numa floresta",
      "Quero cenário de filme na mata",
      "Floresta com névoa",
      "Mata fechada cinematográfica"
    ],
    "category": "Natureza",
    "complexity": "medium",
    "credits": 1,
    "tags": [
      "floresta",
      "mata",
      "arvores",
      "raios",
      "nevoa"
    ]
  },
  {
    "id": 42,
    "internalName": "tropical_beach",
    "title": "Praia Tropical Paradisíaca",
    "intent": "Substituir cenário por uma praia paradisíaca tropical.",
    "userPhrase": "Me coloca numa praia bonita",
    "allPhrases": [
      "Me coloca numa praia bonita",
      "Quero praia tropical",
      "Foto no Caribe",
      "Praia com água cristalina"
    ],
    "category": "Natureza",
    "complexity": "medium",
    "credits": 1,
    "tags": [
      "praia",
      "mar",
      "tropical",
      "caribe",
      "areia",
      "verao"
    ]
  },
  {
    "id": 43,
    "internalName": "mountain_adventure",
    "title": "Aventura nas Montanhas & Névoa",
    "intent": "Criar cenário de montanhas dramáticas e aventura ao ar livre.",
    "userPhrase": "Me coloca numa montanha",
    "allPhrases": [
      "Me coloca numa montanha",
      "Quero foto de aventura",
      "Pico da montanha",
      "Trilha com visual de montanha"
    ],
    "category": "Natureza",
    "complexity": "medium",
    "credits": 1,
    "tags": [
      "montanha",
      "pico",
      "aventura",
      "rochas",
      "altitude"
    ]
  },
  {
    "id": 44,
    "internalName": "urban_park",
    "title": "Parque Urbano & Arquitetura Verde",
    "intent": "Criar cenário de parque urbano arborizado e moderno.",
    "userPhrase": "Quero um parque bonito na cidade",
    "allPhrases": [
      "Quero um parque bonito na cidade",
      "Muda o fundo pra um parque moderno",
      "Parque com prédios ao fundo",
      "Parque Ibirapuera / Central Park"
    ],
    "category": "Natureza",
    "complexity": "medium",
    "credits": 1,
    "tags": [
      "parque",
      "urbano",
      "cidade",
      "arvores",
      "moderno"
    ]
  },
  {
    "id": 45,
    "internalName": "tropical_waterfall",
    "title": "Cachoeira Tropical Exuberante",
    "intent": "Criar cenário exuberante de cachoeira tropical.",
    "userPhrase": "Me coloca numa cachoeira",
    "allPhrases": [
      "Me coloca numa cachoeira",
      "Quero foto em uma cachoeira bonita",
      "Foto com queda d água",
      "Cachoeira na mata"
    ],
    "category": "Natureza",
    "complexity": "medium",
    "credits": 1,
    "tags": [
      "cachoeira",
      "queda d agua",
      "rio",
      "tropical",
      "mist"
    ]
  },
  {
    "id": 46,
    "internalName": "dream_destination",
    "title": "Destino Turístico dos Sonhos (Viagens)",
    "intent": "Inserir a pessoa em destino turístico solicitado com proporção realista.",
    "userPhrase": "Me coloca em Paris",
    "allPhrases": [
      "Me coloca em Paris",
      "Quero aparecer em outro país",
      "Foto em Londres",
      "Me bota em Nova York",
      "Viajando na Itália"
    ],
    "category": "Natureza",
    "complexity": "high",
    "credits": 2,
    "tags": [
      "viagem",
      "paris",
      "destino",
      "turismo",
      "europa",
      "internacional"
    ]
  },
  {
    "id": 47,
    "internalName": "graduation_party",
    "title": "Baile & Festa de Formatura",
    "intent": "Criar cenário de comemoração de festa de formatura.",
    "userPhrase": "Quero uma festa de formatura",
    "allPhrases": [
      "Quero uma festa de formatura",
      "Coloca decoração de formatura",
      "Baile de formatura",
      "Festa de formando comemorando"
    ],
    "category": "Eventos",
    "complexity": "medium",
    "credits": 1,
    "tags": [
      "festa",
      "formatura",
      "baile",
      "comemoracao"
    ]
  },
  {
    "id": 48,
    "internalName": "neon_party",
    "title": "Festa Neon & Balada com Efeitos de Luz",
    "intent": "Criar ambiente de festa noturna colorida com iluminação neon.",
    "userPhrase": "Me coloca numa balada",
    "allPhrases": [
      "Me coloca numa balada",
      "Quero luz neon",
      "Festa com neon",
      "Balada eletrônica com luzes"
    ],
    "category": "Eventos",
    "complexity": "medium",
    "credits": 1,
    "tags": [
      "balada",
      "neon",
      "festa",
      "nightclub",
      "eletronica"
    ]
  },
  {
    "id": 49,
    "internalName": "corporate_event",
    "title": "Palestra & Convenção Corporativa",
    "intent": "Criar fotografia em convenção ou evento empresarial profissional.",
    "userPhrase": "Me coloca num evento empresarial",
    "allPhrases": [
      "Me coloca num evento empresarial",
      "Quero foto num congresso",
      "Foto em conferência",
      "Palestra ou evento corporativo"
    ],
    "category": "Eventos",
    "complexity": "medium",
    "credits": 1,
    "tags": [
      "corporativo",
      "evento",
      "congresso",
      "conferencia",
      "empresarial"
    ]
  },
  {
    "id": 50,
    "internalName": "new_year_party",
    "title": "Celebração de Ano-Novo com Fogos",
    "intent": "Criar atmosfera festiva de celebração de Ano-Novo / Réveillon.",
    "userPhrase": "Coloca festa de Ano-Novo",
    "allPhrases": [
      "Coloca festa de Ano-Novo",
      "Quero foto de Réveillon",
      "Comemoração de virada de ano",
      "Foto de ano novo com fogos"
    ],
    "category": "Eventos",
    "complexity": "medium",
    "credits": 1,
    "tags": [
      "reveillon",
      "ano novo",
      "virada",
      "fogos",
      "comemoracao"
    ]
  },
  {
    "id": 51,
    "internalName": "june_festival",
    "title": "Festa Junina & Arraiá Tradicional",
    "intent": "Criar ambiente tradicional festivo de Festa Junina / São João.",
    "userPhrase": "Me coloca numa festa junina",
    "allPhrases": [
      "Me coloca numa festa junina",
      "Quero decoração de São João",
      "Festa caipira com bandeirinhas",
      "Arraial junino"
    ],
    "category": "Eventos",
    "complexity": "medium",
    "credits": 1,
    "tags": [
      "festa junina",
      "sao joao",
      "arraial",
      "bandeirinhas",
      "caipira"
    ]
  },
  {
    "id": 52,
    "internalName": "gender_reveal",
    "title": "Chá Revelação Delicado & Festivo",
    "intent": "Criar cenário delicado de comemoração de chá revelação.",
    "userPhrase": "Quero decoração de chá revelação",
    "allPhrases": [
      "Quero decoração de chá revelação",
      "Faz um cenário de revelação de bebê",
      "Chá revelação azul e rosa",
      "Foto de chá revelação"
    ],
    "category": "Eventos",
    "complexity": "medium",
    "credits": 1,
    "tags": [
      "cha revelacao",
      "revelacao",
      "bebe",
      "pastel",
      "baloes"
    ]
  },
  {
    "id": 53,
    "internalName": "baby_shower",
    "title": "Chá de Bebê Acolhedor & Doce",
    "intent": "Criar cenário comemorativo e acolhedor de chá de bebê.",
    "userPhrase": "Quero um chá de bebê",
    "allPhrases": [
      "Quero um chá de bebê",
      "Coloca decoração de bebê",
      "Cenário de chá de fraldas",
      "Festa de boas-vindas do bebê"
    ],
    "category": "Eventos",
    "complexity": "medium",
    "credits": 1,
    "tags": [
      "cha de bebe",
      "fraldas",
      "maternidade",
      "acolhedor",
      "pastel"
    ]
  },
  {
    "id": 54,
    "internalName": "music_festival",
    "title": "Festival de Música & Palco Iluminado",
    "intent": "Criar cenário de festival de música com palco e luzes de show.",
    "userPhrase": "Me coloca num festival",
    "allPhrases": [
      "Me coloca num festival",
      "Quero foto num show",
      "Festival de música tipo Lollapalooza ou Rock in Rio",
      "Na plateia de um grande show"
    ],
    "category": "Eventos",
    "complexity": "high",
    "credits": 2,
    "tags": [
      "festival",
      "show",
      "musica",
      "palco",
      "rock",
      "luzes"
    ]
  },
  {
    "id": 55,
    "internalName": "zero_gravity",
    "title": "Gravidade Zero & Efeito Flutuante",
    "intent": "Criar efeito surreal de pessoa flutuando sem gravidade.",
    "userPhrase": "Quero ficar sem gravidade",
    "allPhrases": [
      "Quero ficar sem gravidade",
      "Me faz flutuar",
      "Me bota voando",
      "Me coloca levitando no ar",
      "Sem gravidade"
    ],
    "category": "Motion visual",
    "complexity": "high",
    "credits": 2,
    "tags": [
      "gravidade zero",
      "flutuar",
      "voar",
      "levitar",
      "sem gravidade",
      "suspensao"
    ]
  },
  {
    "id": 56,
    "internalName": "floating_mirror",
    "title": "Espelho Surrealista Mágico",
    "intent": "Criar efeito surreal de espelho gigante flutuando com reflexos coerentes.",
    "userPhrase": "Me coloca flutuando sobre um espelho",
    "allPhrases": [
      "Me coloca flutuando sobre um espelho",
      "Quero um espelho gigante no ar",
      "Espelho flutuante",
      "Reflexo no espelho suspenso"
    ],
    "category": "Motion visual",
    "complexity": "high",
    "credits": 2,
    "tags": [
      "espelho",
      "flutuando",
      "espelho gigante",
      "reflexo",
      "surreal"
    ]
  },
  {
    "id": 57,
    "internalName": "body_fire",
    "title": "Chamas Cinematográficas & Efeito Épico",
    "intent": "Criar efeito fantástico de chamas cinematográficas envolvendo o corpo.",
    "userPhrase": "Quero meu corpo pegando fogo",
    "allPhrases": [
      "Quero meu corpo pegando fogo",
      "Me coloca com chamas nos braços",
      "Fogo no corpo",
      "Efeito de fogo cinematográfico"
    ],
    "category": "Motion visual",
    "complexity": "high",
    "credits": 2,
    "tags": [
      "fogo",
      "chamas",
      "pegando fogo",
      "brasas",
      "incandescente",
      "fire"
    ]
  },
  {
    "id": 58,
    "internalName": "floating_portrait",
    "title": "Levitação Poética & Suspensa",
    "intent": "Criar efeito de levitação sutil e delicada no ar.",
    "userPhrase": "Me deixa flutuando",
    "allPhrases": [
      "Me deixa flutuando",
      "Quero parecer suspenso no ar",
      "Levitacao suave",
      "Flutuando levemente"
    ],
    "category": "Motion visual",
    "complexity": "high",
    "credits": 2,
    "tags": [
      "levitacao",
      "flutuando",
      "suspenso",
      "levitar",
      "suave"
    ]
  },
  {
    "id": 59,
    "internalName": "neon_orbit",
    "title": "Órbitas Luminosas & Trilhas Neon",
    "intent": "Adicionar anéis de energia e órbitas luminosas neon ao redor do corpo.",
    "userPhrase": "Coloca luzes girando em mim",
    "allPhrases": [
      "Coloca luzes girando em mim",
      "Quero anéis de energia",
      "Orbitas de neon ao redor do corpo",
      "Circulos de luz brilhante"
    ],
    "category": "Motion visual",
    "complexity": "high",
    "credits": 2,
    "tags": [
      "neon",
      "orbita",
      "aneis",
      "energia",
      "luzes girando",
      "trail"
    ]
  },
  {
    "id": 60,
    "internalName": "cinematic_particles",
    "title": "Partículas de Luz & Brilho Dourado",
    "intent": "Criar atmosfera mágica de partículas luminosas flutuantes.",
    "userPhrase": "Coloca partículas brilhando",
    "allPhrases": [
      "Coloca partículas brilhando",
      "Quero poeira de luz na foto",
      "Brilhos no ar",
      "Particulas cinematograficas"
    ],
    "category": "Motion visual",
    "complexity": "medium",
    "credits": 1,
    "tags": [
      "particulas",
      "poeira de luz",
      "brilho",
      "glints",
      "fagulhas"
    ]
  },
  {
    "id": 61,
    "internalName": "frozen_motion",
    "title": "Tempo Congelado & Ação Dinâmica",
    "intent": "Criar aparência de ação com tempo congelado e objetos suspensos.",
    "userPhrase": "Quero parecer que parei o tempo",
    "allPhrases": [
      "Quero parecer que parei o tempo",
      "Congela tudo ao meu redor",
      "Tempo congelado",
      "Gotas de agua congeladas no ar"
    ],
    "category": "Motion visual",
    "complexity": "high",
    "credits": 2,
    "tags": [
      "tempo congelado",
      "congelar",
      "gotas no ar",
      "acao",
      "suspensao"
    ]
  },
  {
    "id": 62,
    "internalName": "cinematic_motion_blur",
    "title": "Desfoque de Movimento em Alta Velocidade",
    "intent": "Simular movimento intenso com desfoque direcional mantendo o sujeito nítido.",
    "userPhrase": "Coloca efeito de velocidade",
    "allPhrases": [
      "Coloca efeito de velocidade",
      "Quero fundo em movimento",
      "Rastro de velocidade",
      "Motion blur cinematográfico"
    ],
    "category": "Motion visual",
    "complexity": "medium",
    "credits": 1,
    "tags": [
      "velocidade",
      "motion blur",
      "desfoque",
      "movimento",
      "rastro"
    ]
  },
  {
    "id": 63,
    "internalName": "product_studio",
    "title": "Produto em Estúdio Comercial com Sombra",
    "intent": "Criar fotografia comercial de produto de estúdio.",
    "userPhrase": "Deixa meu produto profissional",
    "allPhrases": [
      "Deixa meu produto profissional",
      "Quero foto de catálogo",
      "Foto de produto com fundo de estúdio",
      "Foto profissional do meu item"
    ],
    "category": "Comercial",
    "complexity": "medium",
    "credits": 1,
    "tags": [
      "produto",
      "comercial",
      "catalogo",
      "embalagem",
      "estudio"
    ]
  },
  {
    "id": 64,
    "internalName": "product_lifestyle",
    "title": "Produto em Cenário Realista de Uso",
    "intent": "Mostrar produto em cenário cotidiano e realista de utilização.",
    "userPhrase": "Coloca meu produto numa casa bonita",
    "allPhrases": [
      "Coloca meu produto numa casa bonita",
      "Quero foto do produto sendo usado",
      "Foto de produto lifestyle",
      "Produto na sala moderna"
    ],
    "category": "Comercial",
    "complexity": "high",
    "credits": 2,
    "tags": [
      "lifestyle",
      "produto",
      "casa",
      "ambiente",
      "uso"
    ]
  },
  {
    "id": 65,
    "internalName": "fashion_editorial",
    "title": "Lookbook & Campanha de Moda",
    "intent": "Criar fotografia de campanha de moda editorial.",
    "userPhrase": "Quero foto de revista",
    "allPhrases": [
      "Quero foto de revista",
      "Deixa parecendo campanha de moda",
      "Vogue style",
      "Foto editorial de moda"
    ],
    "category": "Comercial",
    "complexity": "high",
    "credits": 2,
    "tags": [
      "moda",
      "revista",
      "editorial",
      "vogue",
      "fashion",
      "campanha"
    ]
  },
  {
    "id": 66,
    "internalName": "food_photography",
    "title": "Gastronomia & Prato Gourmet de Chef",
    "intent": "Melhorar fotografia gastronômica para cardápio ou anúncio.",
    "userPhrase": "Deixa meu prato mais bonito",
    "allPhrases": [
      "Deixa meu prato mais bonito",
      "Quero foto profissional de comida",
      "Foto de comida apetitosa",
      "Foto para cardápio"
    ],
    "category": "Comercial",
    "complexity": "medium",
    "credits": 1,
    "tags": [
      "comida",
      "gastronomia",
      "prato",
      "restaurante",
      "cardapio",
      "apetitoso"
    ]
  },
  {
    "id": 67,
    "internalName": "luxury_real_estate",
    "title": "Imobiliário Alto Padrão & Arquitetura",
    "intent": "Melhorar fotografia imobiliária para alto padrão.",
    "userPhrase": "Deixa esse imóvel mais elegante",
    "allPhrases": [
      "Deixa esse imóvel mais elegante",
      "Melhora a foto dessa casa",
      "Foto imobiliária de luxo",
      "Foto profissional de arquitetura"
    ],
    "category": "Comercial",
    "complexity": "medium",
    "credits": 1,
    "tags": [
      "imovel",
      "casa",
      "arquitetura",
      "imobiliaria",
      "luxo",
      "decoracao"
    ]
  },
  {
    "id": 68,
    "internalName": "automotive_cinematic",
    "title": "Fotografia Automotiva & Reflexos de Estúdio",
    "intent": "Criar fotografia profissional cinematográfica de veículo.",
    "userPhrase": "Deixa meu carro estilo cinema",
    "allPhrases": [
      "Deixa meu carro estilo cinema",
      "Quero foto de propaganda do carro",
      "Foto de carro esportivo",
      "Automotivo cinematográfico"
    ],
    "category": "Comercial",
    "complexity": "medium",
    "credits": 1,
    "tags": [
      "carro",
      "automotivo",
      "veiculo",
      "propaganda",
      "moto",
      "estrada"
    ]
  },
  {
    "id": 69,
    "internalName": "social_profile_portrait",
    "title": "Retrato Moderno para Redes Sociais & Bio",
    "intent": "Criar fotografia profissional moderna para redes sociais e perfil.",
    "userPhrase": "Quero foto pro Instagram",
    "allPhrases": [
      "Quero foto pro Instagram",
      "Deixa minha foto de perfil melhor",
      "Foto pro Insta de alto padrão",
      "Foto de perfil bonita"
    ],
    "category": "Comercial",
    "complexity": "medium",
    "credits": 1,
    "tags": [
      "instagram",
      "perfil",
      "insta",
      "rede social",
      "avatar",
      "feed"
    ]
  },
  {
    "id": 70,
    "internalName": "advertising_campaign",
    "title": "Composição Publicitária de Alta Conversão",
    "intent": "Transformar fotografia em composição publicitária de alto impacto.",
    "userPhrase": "Cria uma propaganda com essa foto",
    "allPhrases": [
      "Cria uma propaganda com essa foto",
      "Deixa parecendo anúncio profissional",
      "Campanha publicitária",
      "Foto estilo outdoor / billboard"
    ],
    "category": "Comercial",
    "complexity": "high",
    "credits": 2,
    "tags": [
      "publicidade",
      "propaganda",
      "anuncio",
      "campanha",
      "outdoor",
      "comercial"
    ]
  }
];

export interface CockpitCategoryMeta {
  id: string;
  name: string;
  count: number;
  description: string;
  badgeColor?: string;
}

export const COCKPIT_CATEGORIES: CockpitCategoryMeta[] = [
  { id: 'all', name: 'Todos os 70 Comandos', count: 70, description: 'Catálogo completo de ferramentas de IA generativa com processamento instantâneo.' },
  { id: 'Básico', name: 'Básico & Restauração', count: 14, description: 'Recortes, fundos, iluminação, cores, restauração analógica e prompt livre.' },
  { id: 'Ensaios', name: 'Ensaios & Retratos', count: 8, description: 'Estúdio profissional, executivo LinkedIn, gestante, newborn e editorial.' },
  { id: 'Aniversários', name: 'Aniversários & Festas', count: 8, description: 'Festas infantis, debutante 15 anos, smash the cake e celebrações em família.' },
  { id: 'Casamentos', name: 'Casamentos & Noivas', count: 8, description: 'Altar, véu, alianças, valsa dos noivos e atmosfera romântica.' },
  { id: 'Natureza', name: 'Natureza & Paisagens', count: 8, description: 'Praias tropicais, montanhas, campos floridos, via láctea e cenários paradisíacos.' },
  { id: 'Eventos', name: 'Eventos & Palcos', count: 8, description: 'Conferências de tecnologia, convenções, shows musicais e celebrações solenes.' },
  { id: 'Motion visual', name: 'Motion & Efeitos Visuais', count: 8, description: 'Partículas luminosas, levitação, time-lapse e dinamismo visual surreal.' },
  { id: 'Comercial', name: 'Comercial & E-commerce', count: 8, description: 'Fotos de catálogo, cosméticos, joias, pratos gourmet e publicidade de alta conversão.' },
];
