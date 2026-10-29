/**
 * Motor de Interpretação Automática de Linguagem Natural (NLU) — ALEGON AI Photo Studio.
 * Dono: OpenRouter AI Specialist.
 * 
 * Regra de Ouro:
 * O cliente escreve naturalmente em português brasileiro informal.
 * O sistema detecta intenção primária, intenções secundárias, combinações coerentes,
 * elementos a preservar, restrições e consolida os créditos sugeridos.
 */

import { COMMANDS_CATALOG, type InternalCommand, getCommandByName } from './catalog';
import { sanitizeUserPrompt } from './prompts';

export { sanitizeUserPrompt };

export interface StructuredInterpretation {
  primaryIntent: InternalCommand;
  secondaryIntents: InternalCommand[];
  allDetectedCommands: InternalCommand[];
  allCommandNames: string[];
  elementsToPreserve: string[];
  elementsToModify: string[];
  restrictions: string[];
  style: string;
  complexity: 'low' | 'medium' | 'high';
  modelCompatibility: string;
  suggestedCredits: number;
  priceInCents: number;
  confidence: number;
  humanFriendlySummary: string;
  consolidatedTechnicalPrompt: string;
  sanitizedInput: string;
}

/**
 * Normaliza string para comparação semântica: minúsculas, sem acentos e sem pontuação.
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'’]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Mapeamentos semânticos de alta relevância com sinônimos e gírias brasileiras.
 */
interface SemanticRule {
  commandName: string;
  keywords: string[];
  phrases: string[];
  weight: number;
}

const SEMANTIC_RULES: SemanticRule[] = [
  // ── Motion Visual & Surreal ──
  {
    commandName: 'zero_gravity',
    keywords: ['flutuar', 'flutuando', 'voar', 'voando', 'levitar', 'levitando', 'gravidade', 'suspensa', 'suspenso'],
    phrases: ['sem gravidade', 'me bota voando', 'me faz flutuar', 'levitando no ar', 'parecer voando', 'flutuando no ar'],
    weight: 12,
  },
  {
    commandName: 'floating_mirror',
    keywords: ['espelho', 'espelhos', 'reflexo'],
    phrases: ['em cima de um espelho', 'sobre um espelho', 'espelho flutuando', 'espelho gigante', 'espelho no ar'],
    weight: 14,
  },
  {
    commandName: 'body_fire',
    keywords: ['fogo', 'chamas', 'queimando', 'brasas', 'flamejante', 'labareda'],
    phrases: ['pegando fogo', 'fogo no corpo', 'fogo saindo', 'chamas nos bracos', 'chamas pelo corpo', 'corpo em chamas'],
    weight: 14,
  },
  {
    commandName: 'neon_orbit',
    keywords: ['orbitas', 'aneis', 'trilhas'],
    phrases: ['luzes girando', 'aneis de energia', 'circulos de luz', 'luz neon girando', 'orbitas de neon'],
    weight: 12,
  },
  {
    commandName: 'cinematic_particles',
    keywords: ['particulas', 'fagulhas', 'glitters', 'poeira'],
    phrases: ['particulas brilhando', 'poeira de luz', 'brilhos no ar', 'luzes flutuando', 'pontos de luz'],
    weight: 10,
  },
  {
    commandName: 'frozen_motion',
    keywords: ['congelar', 'congelado', 'paralisado'],
    phrases: ['parei o tempo', 'tempo congelado', 'congelar tudo', 'gotas congeladas', 'acao congelada'],
    weight: 12,
  },
  {
    commandName: 'cinematic_motion_blur',
    keywords: ['velocidade', 'rastro', 'desfoque', 'blur'],
    phrases: ['efeito de velocidade', 'fundo em movimento', 'passando rapido', 'movimento rapido', 'motion blur'],
    weight: 10,
  },

  // ── Casamentos & Romântico ──
  {
    commandName: 'romantic_couple',
    keywords: ['namorado', 'namorada', 'esposo', 'esposa', 'marido', 'casal', 'romantico', 'romantica', 'beijo'],
    phrases: ['ensaio de casal', 'com meu namorado', 'com minha namorada', 'com meu marido', 'foto de casal', 'romantica'],
    weight: 12,
  },
  {
    commandName: 'beach_wedding',
    keywords: ['casamento', 'casar'],
    phrases: ['casamento na praia', 'casar na praia', 'casamento beira mar', 'noivos na praia', 'noivos no por do sol'],
    weight: 14,
  },
  {
    commandName: 'classic_wedding',
    keywords: ['casamento', 'matrimonio', 'noivos', 'noiva', 'noivo', 'veu', 'grinalda'],
    phrases: ['foto de casamento', 'casamento classico', 'igreja de casamento', 'ensaio de noivos', 'casar'],
    weight: 12,
  },
  {
    commandName: 'pre_wedding_editorial',
    keywords: ['pre-wedding', 'prewedding'],
    phrases: ['pre wedding', 'ensaio antes do casamento', 'fotos antes de casar', 'ensaio pre casamento'],
    weight: 14,
  },

  // ── Ensaios & Retratos ──
  {
    commandName: 'corporate_headshot',
    keywords: ['linkedin', 'curriculo', 'trabalho', 'empresa', 'executivo', 'executiva', 'corporativo', 'vaga'],
    phrases: ['foto pro linkedin', 'foto para curriculo', 'foto pro trabalho', 'foto de perfil profissional', 'parecer executivo'],
    weight: 14,
  },
  {
    commandName: 'studio_portrait',
    keywords: ['estudio', 'profissional', 'retrato'],
    phrases: ['foto profissional', 'tirada em estudio', 'parecer de estudio', 'ensaio profissional', 'estudio fotografico'],
    weight: 10,
  },
  {
    commandName: 'elegant_female_editorial',
    keywords: ['chique', 'elegante', 'fina', 'poderosa', 'modelo'],
    phrases: ['foto feminina elegante', 'ensaio chique', 'mulher elegante', 'bem vestida e chique', 'foto de madame'],
    weight: 10,
  },
  {
    commandName: 'cinematic_male_portrait',
    keywords: ['filme', 'cinema', 'dramatico', 'homem', 'masculino'],
    phrases: ['estilo filme', 'estilo cinema', 'visual cinematografico', 'homem de cinema', 'retrato cinematografico'],
    weight: 10,
  },
  {
    commandName: 'maternity_portrait',
    keywords: ['gravida', 'gestante', 'barriga', 'maternidade', 'gravidez'],
    phrases: ['ensaio de gravida', 'foto de gestante', 'ensaio de gestante', 'foto da minha gravidez'],
    weight: 14,
  },
  {
    commandName: 'children_portrait',
    keywords: ['crianca', 'filho', 'filha', 'menino', 'menina', 'pequeno', 'pequena'],
    phrases: ['ensaio do meu filho', 'ensaio da minha filha', 'foto do meu filho', 'foto infantil'],
    weight: 12,
  },
  {
    commandName: 'graduation_portrait',
    keywords: ['formatura', 'formando', 'formanda', 'beca', 'diploma'],
    phrases: ['foto de formatura', 'ensaio de formando', 'com beca', 'minha formatura'],
    weight: 14,
  },

  // ── Aniversários ──
  {
    commandName: 'kids_birthday',
    keywords: ['aniversario', 'parabens', 'bexigas'],
    phrases: ['aniversario infantil', 'decoracao de aniversario', 'aniversario do meu filho', 'aniversario da minha filha'],
    weight: 12,
  },
  {
    commandName: 'quinceanera_luxury',
    keywords: ['debutante', 'quinze', 'valsa'],
    phrases: ['15 anos', 'festa de 15 anos', 'foto de 15 anos', 'festa de debutante', 'quinze anos'],
    weight: 14,
  },
  {
    commandName: 'smash_cake',
    keywords: ['smash', 'cake'],
    phrases: ['smash the cake', 'smash the cacke', 'com bolo', 'ensaio com bolo'],
    weight: 14,
  },
  {
    commandName: 'adult_birthday_luxury',
    keywords: ['aniversario', 'comemorar'],
    phrases: ['aniversario de luxo', 'aniversario elegante', 'meu aniversario chique', 'aniversario adulto'],
    weight: 10,
  },

  // ── Natureza & Viagens ──
  {
    commandName: 'tropical_beach',
    keywords: ['praia', 'litoral', 'mar', 'oceano', 'areia', 'coqueiro', 'verao'],
    phrases: ['na praia', 'praia bonita', 'praia tropical', 'beira do mar', 'agua cristalina'],
    weight: 12,
  },
  {
    commandName: 'sunset_park',
    keywords: ['por do sol', 'entardecer', 'poente', 'tardinha', 'golden hour'],
    phrases: ['no por do sol', 'ao por do sol', 'fim de tarde', 'parque ao entardecer', 'luz de fim de tarde'],
    weight: 12,
  },
  {
    commandName: 'cinematic_forest',
    keywords: ['floresta', 'bosque', 'arvores', 'mata', 'selva'],
    phrases: ['numa floresta', 'na floresta', 'mata fechada', 'arvores cinematograficas', 'raios de sol na mata'],
    weight: 12,
  },
  {
    commandName: 'mountain_adventure',
    keywords: ['montanha', 'montanhas', 'pico', 'cume', 'trilha'],
    phrases: ['numa montanha', 'topo da montanha', 'foto de aventura', 'pico da montanha'],
    weight: 12,
  },
  {
    commandName: 'tropical_waterfall',
    keywords: ['cachoeira', 'cascata', 'quedas'],
    phrases: ['numa cachoeira', 'em uma cachoeira', 'banho de cachoeira', 'foto na cachoeira'],
    weight: 12,
  },
  {
    commandName: 'dream_destination',
    keywords: ['paris', 'londres', 'italia', 'roma', 'europa', 'orlando', 'eua', 'tokyo', 'disney'],
    phrases: ['me coloca em paris', 'em outro pais', 'viajando para', 'ponto turistico', 'na torre eiffel'],
    weight: 14,
  },

  // ── Comercial & E-Commerce ──
  {
    commandName: 'product_photo',
    keywords: ['vender', 'produto', 'catalogo', 'shopee', 'mercado livre', 'anuncio'],
    phrases: ['foto de produto', 'foto pra vender', 'foto comercial', 'vender no insta', 'loja virtual'],
    weight: 12,
  },
  {
    commandName: 'social_profile_portrait',
    keywords: ['instagram', 'insta', 'perfil', 'bio', 'avatar', 'feed'],
    phrases: ['foto pro instagram', 'foto pro insta', 'minha foto de perfil', 'foto para feed'],
    weight: 12,
  },
  {
    commandName: 'food_photography',
    keywords: ['comida', 'prato', 'lanche', 'restaurante', 'cardapio', 'doce', 'hamburguer'],
    phrases: ['foto de comida', 'foto para cardapio', 'prato apetitoso', 'foto do meu prato'],
    weight: 12,
  },
  {
    commandName: 'luxury_real_estate',
    keywords: ['imovel', 'apartamento', 'casa', 'arquitetura', 'decoracao', 'sala', 'quarto'],
    phrases: ['foto de imovel', 'foto da casa', 'foto do apartamento', 'anuncio imobiliario'],
    weight: 12,
  },
  {
    commandName: 'automotive_cinematic',
    keywords: ['carro', 'moto', 'veiculo', 'automovel', 'esportivo'],
    phrases: ['foto do meu carro', 'carro estilo cinema', 'propaganda de carro', 'foto automotiva'],
    weight: 12,
  },

  // ── Comandos Básicos / Utilitários ──
  {
    commandName: 'remove_background',
    keywords: ['fundo'],
    phrases: ['tira o fundo', 'remover o fundo', 'sem fundo', 'fundo branco', 'fundo cinza'],
    weight: 8,
  },
  {
    commandName: 'remove_people',
    keywords: ['pessoas', 'gente', 'figurantes', 'povo', 'pedestres', 'transeuntes'],
    phrases: ['tira as pessoas', 'tira esse povo', 'remover quem ta no fundo', 'apaga as pessoas', 'so eu na foto', 'remover pedestres'],
    weight: 12,
  },
  {
    commandName: 'remove_objects',
    keywords: ['objeto', 'placa', 'poste', 'fio', 'lixeira', 'detalhe'],
    phrases: ['tira o poste', 'apaga esse objeto', 'limpar a foto', 'tirar a lixeira'],
    weight: 10,
  },
  {
    commandName: 'improve_lighting',
    keywords: ['escuro', 'escura', 'iluminacao', 'clarear', 'sombra', 'luz'],
    phrases: ['ta muito escura', 'melhora a luz', 'clareia meu rosto', 'tira essa sombra', 'arruma a iluminacao'],
    weight: 10,
  },
  {
    commandName: 'sharpen',
    keywords: ['nitidez', 'nitido', 'nitida', 'foco', 'clareza', 'desfocado', 'desfocada', 'borrado', 'definicao'],
    phrases: ['aumentar a nitidez', 'mais nitidez', 'melhorar o foco', 'tirar o desfoque', 'nitidez optica', 'foco nos olhos'],
    weight: 12,
  },
  {
    commandName: 'restore_photo',
    keywords: ['antiga', 'velha', 'rasgada', 'manchada', 'borrada', 'riscada', 'vincos'],
    phrases: ['foto antiga', 'restaura a foto', 'foto velha de familia', 'recupera essa foto', 'restaurar foto antiga'],
    weight: 12,
  },
  {
    commandName: 'replace_elements',
    keywords: ['troca', 'trocar', 'troque', 'substituir', 'substitua', 'muda', 'mudar', 'roupa', 'ropa', 'vestido', 'terno', 'camisa', 'cabelo', 'tenis'],
    phrases: ['troca a minha roupa', 'troca a minha ropa', 'substituir por', 'trocar roupa', 'vestir um terno', 'mudar a roupa', 'trocar por terno', 'ropa por terno'],
    weight: 12,
  },
  {
    commandName: 'add_elements',
    keywords: ['adicionar', 'adiciona', 'bota', 'insere', 'inserir'],
    phrases: ['adicionar elementos', 'colocar elementos', 'inserir na foto'],
    weight: 8,
  },
];

/**
 * Motor central de interpretação NLU.
 */
export function interpretNaturalLanguage(userInput: string): StructuredInterpretation {
  const sanitized = sanitizeUserPrompt(userInput);
  const normalized = normalizeText(sanitized);

  // Pontuação para cada comando do catálogo
  const scores: Map<string, number> = new Map();

  for (const rule of SEMANTIC_RULES) {
    let score = 0;

    // Correspondência de frases inteiras (alta relevância)
    for (const phrase of rule.phrases) {
      const normPhrase = normalizeText(phrase);
      if (normalized.includes(normPhrase)) {
        score += rule.weight * 2;
      }
    }

    // Correspondência de palavras-chave individuais
    for (const kw of rule.keywords) {
      const normKw = normalizeText(kw);
      const regex = new RegExp(`\\b${normKw}\\b`, 'i');
      if (regex.test(normalized)) {
        score += rule.weight;
      }
    }

    if (score > 0) {
      const current = scores.get(rule.commandName) || 0;
      scores.set(rule.commandName, current + score);
    }
  }

  // Também analisa tags e frases de exemplo no catálogo de 70 comandos
  for (const cmd of COMMANDS_CATALOG) {
    let tagScore = 0;
    for (const tag of cmd.tags) {
      const normTag = normalizeText(tag);
      if (normalized.includes(normTag)) {
        tagScore += 4;
      }
    }
    for (const phrase of cmd.userPhrases) {
      const normP = normalizeText(phrase);
      if (normalized.includes(normP)) {
        tagScore += 10;
      }
    }
    if (tagScore > 0) {
      const current = scores.get(cmd.internalName) || 0;
      scores.set(cmd.internalName, current + tagScore);
    }
  }

  // Ordena os comandos detectados por pontuação decrescente
  const detectedList = Array.from(scores.entries())
    .sort((a, b) => b[1] - a[1])
    .filter(([_, score]) => score >= 6)
    .map(([name]) => getCommandByName(name))
    .filter((c): c is InternalCommand => Boolean(c));

  // Se nada foi pontuado com confiança mínima, utiliza 'studio_portrait' ou 'free_prompt'
  let primaryCmd: InternalCommand;
  let secondaryCmds: InternalCommand[] = [];

  if (detectedList.length === 0) {
    // Fallback inteligente: se usuário pediu algo livre
    const isEditingFree = normalized.length > 5;
    primaryCmd = isEditingFree
      ? getCommandByName('free_prompt') || COMMANDS_CATALOG[13]!
      : getCommandByName('studio_portrait') || COMMANDS_CATALOG[14]!;
  } else {
    primaryCmd = detectedList[0]!;
    secondaryCmds = detectedList.slice(1, 4); // até 3 intenções secundárias consolidadas
  }

  const allDetected = [primaryCmd, ...secondaryCmds];

  // Determina complexidade consolidada: se QUALQUER intenção for alta, a solicitação é alta
  const hasHighComplexity = allDetected.some((c) => c.complexity === 'high');
  const complexity: 'low' | 'medium' | 'high' = hasHighComplexity
    ? 'high'
    : allDetected.some((c) => c.complexity === 'medium')
    ? 'medium'
    : 'low';

  // Consolidação de créditos:
  // Operações de baixa e média consolidadas = 1 crédito
  // Operações de alta complexidade (efeitos surreais, composições complexas) = 2 créditos
  const suggestedCredits = complexity === 'high' ? 2 : 1;
  const priceInCents = suggestedCredits === 2 ? 1580 : 790; // R$ 15,80 ou R$ 7,90

  // Resumo em linguagem humana amigável para o cliente (sem jargões de IA)
  const humanFriendlySummary = buildHumanFriendlySummary(allDetected, sanitized);

  // Elementos padrão de preservação e restrições éticas de fotografia
  const elementsToPreserve = [
    'Identidade facial, traços e proporções originais da pessoa',
    'Textura realista de pele sem suavização plástica artificial',
    'Postura natural, mãos e anatomia corporal fisicamente coerentes',
  ];

  if (allDetected.some((c) => c.category === 'Comercial')) {
    elementsToPreserve.push('Embalagem, marca e geometria original do produto');
  }

  const elementsToModify = allDetected.map((c) => c.intent);
  const restrictions = [
    'Sem deformações anatômicas ou membros extras',
    'Sem lesões corporais, queimaduras ou aspecto de sofrimento',
    'Preservação rigorosa de perspectiva e escala espacial',
  ];

  // Composição do prompt técnico unificado em inglês para os modelos OpenRouter
  const consolidatedTechnicalPrompt = composeTechnicalPrompt(allDetected, sanitized);

  const confidence = detectedList.length > 0 ? Math.min(1.0, 0.75 + detectedList.length * 0.08) : 0.65;

  return {
    primaryIntent: primaryCmd,
    secondaryIntents: secondaryCmds,
    allDetectedCommands: allDetected,
    allCommandNames: allDetected.map((c) => c.internalName),
    elementsToPreserve,
    elementsToModify,
    restrictions,
    style: primaryCmd.category === 'Motion visual' ? 'Cinematográfico Surreal' : 'Fotografia Editorial Realista',
    complexity,
    modelCompatibility: 'google/gemini-2.5-flash-image, black-forest-labs/flux-1-schnell',
    suggestedCredits,
    priceInCents,
    confidence,
    humanFriendlySummary,
    consolidatedTechnicalPrompt,
    sanitizedInput: sanitized,
  };
}

/**
 * Constrói resumo amigável em português para exibição ao usuário final.
 */
function buildHumanFriendlySummary(commands: InternalCommand[], rawInput: string): string {
  if (commands.length === 1) {
    const cmd = commands[0]!;
    return cmd.internalName === 'free_prompt'
      ? `Edição Personalizada: "${rawInput.slice(0, 50)}${rawInput.length > 50 ? '...' : ''}"`
      : cmd.intent;
  }

  // Agrupa intenções detectadas
  const labels = commands.map((c) => {
    switch (c.internalName) {
      case 'zero_gravity':
        return 'Levitação em Gravidade Zero';
      case 'floating_mirror':
        return 'Espelho Gigante Flutuante';
      case 'body_fire':
        return 'Efeito de Chamas Cinematográficas';
      case 'romantic_couple':
        return 'Ensaio de Casal';
      case 'sunset_park':
        return 'Cenário de Pôr do Sol';
      case 'studio_portrait':
        return 'Retrato de Estúdio Profissional';
      case 'corporate_headshot':
        return 'Retrato Executivo para Perfil';
      case 'tropical_beach':
        return 'Cenário de Praia Tropical';
      case 'quinceanera_luxury':
        return 'Ensaio de 15 Anos de Luxo';
      case 'classic_wedding':
        return 'Casamento Clássico';
      case 'cinematic_male_portrait':
        return 'Iluminação de Cinema';
      default:
        return c.intent.split('.')[0] || c.intent;
    }
  });

  return labels.join(' + ');
}

/**
 * Suaviza termos agressivos do usuário para evitar falso positivo em filtros de moderação.
 */
function softenPromptForSafety(text: string): string {
  return text
    .replace(/\b(pegando\s+fogo|fogo\s+no\s+corpo|em\s+chamas|queimando)\b/gi, 'efeito cinematográfico de aura luminosa mágica e partículas douradas estilo super-herói')
    .replace(/\b(fogo|chamas|fire|flames)\b/gi, 'aura luminosa de energia mágica')
    .replace(/\b(me\s+coloca\s+de|me\s+vista\s+de|coloca\s+em\s+mim|bota\s+em\s+mim)\b/gi, 'estilo elegante com')
    .replace(/\b(trocar\s+corpo|mudar\s+corpo|muda\s+meu\s+corpo)\b/gi, 'estilo de vestimenta formal');
}

/**
 * Construtor do Prompt Técnico Avançado Consolidado (com regras estritas de preservação).
 */
function composeTechnicalPrompt(commands: InternalCommand[], userInput: string): string {
  const safeUserInput = softenPromptForSafety(userInput);
  const instructions = commands.map((c, i) => `${i + 1}. [${c.category.toUpperCase()}]: ${c.technicalPrompt}`).join('\n');

  return [
    'PHOTO EDITING INSTRUCTION (Image-to-Image / Inpainting Refinement):',
    `USER SPECIFIC REQUEST: "${safeUserInput}"`,
    '',
    'CONSOLIDATED TECHNICAL OPERATIONS:',
    instructions,
    '',
    'STRICT PHOTO FIDELITY & IDENTITY CONSTRAINTS:',
    '- PRESERVE EXACT IDENTITY: Faithfully maintain the subject original facial features, likeness, and natural expression.',
    '- PROFESSIONAL EDITORIAL FINISH: High-end 35mm DSLR studio photography, authentic balanced natural lighting, crisp details, and seamless optical integration.',
    '- NO CARTOON / NO UNNATURAL ARTIFACTS: The final rendered image must look like a high-end photograph, preserving authentic textures and physics.',
  ].join('\n');
}
