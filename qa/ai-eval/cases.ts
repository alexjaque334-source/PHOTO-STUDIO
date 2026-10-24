/**
 * Casos de teste canônicos para o harness de avaliação de IA — ALEGON AI Photo Studio.
 * Dono: Subagente OpenRouter.
 * 
 * 30 casos de teste distribuídos em:
 * - 10 Remoção de objetos e pessoas
 * - 10 Troca e isolamento de fundo
 * - 10 Retratos comerciais e fotos de produtos
 */

import type { EditTool, Tier } from '../../apps/api/src/contracts';

export interface AiTestCase {
  id: string;
  category: 'removal' | 'background' | 'commercial_portrait';
  tool: EditTool;
  tier: Tier;
  title: string;
  userPrompt: string;
  criteria: string[];
}

export const AI_TEST_CASES: AiTestCase[] = [
  // =========================================================================
  // CATEGORIA 1: REMOÇÃO DE OBJETOS E PESSOAS (10 casos)
  // =========================================================================
  {
    id: 'rem-01',
    category: 'removal',
    tool: 'remove_people',
    tier: 'padrao',
    title: 'Remoção de pedestre em ponto turístico',
    userPrompt: 'Remover o turista com camiseta vermelha que apareceu atrás do casal no lado direito.',
    criteria: [
      'Turista removido completamente sem artefatos ou fantasmas.',
      'Arquitetura do monumento ao fundo reconstruída com textura e linhas retas.',
      'Preservação intacta da fisionomia e vestimenta do casal.',
    ],
  },
  {
    id: 'rem-02',
    category: 'removal',
    tool: 'remove_people',
    tier: 'economico',
    title: 'Remoção de figurantes ao fundo na praia',
    userPrompt: 'Remover banhistas distantes no mar e na areia.',
    criteria: [
      'Banhistas removidos com preenchimento natural de ondas e areia molhada.',
      'Sujeito principal em primeiro plano sem perda de nitidez.',
    ],
  },
  {
    id: 'rem-03',
    category: 'removal',
    tool: 'remove_objects',
    tier: 'padrao',
    title: 'Remoção de lixeira urbana e bitucas na calçada',
    userPrompt: 'Apagar a lixeira verde de metal e manchas no chão ao lado do banco.',
    criteria: [
      'Lixeira verde e sombra projetada removidas.',
      'Padrão de paralelepípedos da calçada restaurado com textura idêntica.',
    ],
  },
  {
    id: 'rem-04',
    category: 'removal',
    tool: 'remove_objects',
    tier: 'economico',
    title: 'Remoção de fios elétricos e postes no céu',
    userPrompt: 'Remover fios de poste cruzando o céu acima da fachada da casa histórica.',
    criteria: [
      'Fios apagados com gradiente suave do céu azul.',
      'Moldura do telhado e beiral preservados sem borrões.',
    ],
  },
  {
    id: 'rem-05',
    category: 'removal',
    tool: 'remove_objects',
    tier: 'premium',
    title: 'Remoção de microfone e pedestal em foto de palco',
    userPrompt: 'Remover o pedestal e cabo de microfone que corta o violão do músico.',
    criteria: [
      'Cabo e haste removidos cirurgicamente.',
      'Verniz e cordas do violão reconstituídos sem descontinuidade.',
    ],
  },
  {
    id: 'rem-06',
    category: 'removal',
    tool: 'remove_objects',
    tier: 'padrao',
    title: 'Remoção de manchas e sujeira em roupa branca',
    userPrompt: 'Remover mancha de café na altura do peito da camisa social branca.',
    criteria: [
      'Trama do tecido e sombra da dobra da camisa reconstituídas naturalmente.',
      'Sem alteração de cor ou textura na área adjacente.',
    ],
  },
  {
    id: 'rem-07',
    category: 'removal',
    tool: 'remove_people',
    tier: 'premium',
    title: 'Remoção de garçom no fundo de ensaio de casamento',
    userPrompt: 'Remover o garçom servindo mesas ao fundo do salão.',
    criteria: [
      'Bokeh de luzes do salão mantido harmonicamente.',
      'Sem distorção no véu translúcido da noiva.',
    ],
  },
  {
    id: 'rem-08',
    category: 'removal',
    tool: 'remove_objects',
    tier: 'padrao',
    title: 'Remoção de carro estacionado em frente à vitrine',
    userPrompt: 'Apagar o carro prata estacionado na frente da loja.',
    criteria: [
      'Carro e reflexos removidos.',
      'Asfalto e calçada preenchidos com continuidade de perspectiva.',
    ],
  },
  {
    id: 'rem-09',
    category: 'removal',
    tool: 'remove_objects',
    tier: 'economico',
    title: 'Remoção de placa de trânsito em foto de paisagem',
    userPrompt: 'Remover a placa amarela de limite de velocidade à beira da estrada.',
    criteria: [
      'Vegetação e cerca rural reconstruídas naturalmente.',
    ],
  },
  {
    id: 'rem-10',
    category: 'removal',
    tool: 'remove_objects',
    tier: 'padrao',
    title: 'Remoção de etiqueta de preço e código de barras em produto',
    userPrompt: 'Remover a etiqueta de código de barras colada na caixa do cosmético.',
    criteria: [
      'Design e tipografia original da embalagem reconstituídos.',
      'Superfície brilhante sem manchas residuais de cola ou adesivo.',
    ],
  },

  // =========================================================================
  // CATEGORIA 2: TROCA E ISOLAMENTO DE FUNDO (10 casos)
  // =========================================================================
  {
    id: 'bg-01',
    category: 'background',
    tool: 'replace_background',
    tier: 'padrao',
    title: 'Fundo de escritório corporativo moderno para foto executiva',
    userPrompt: 'Substituir o quarto por um escritório moderno em tons sóbrios com vidro e desfoque suave de profundidade.',
    criteria: [
      'Recorte perfeito dos cabelos e ombros.',
      'Iluminação do novo fundo harmonizada com o tom de pele do sujeito.',
      'Desfoque realista simulando lente 85mm f/1.8.',
    ],
  },
  {
    id: 'bg-02',
    category: 'background',
    tool: 'remove_background',
    tier: 'economico',
    title: 'Fundo de estúdio neutro off-white com sombra de chão',
    userPrompt: '',
    criteria: [
      'Fundo original removido com isolamento limpo.',
      'Sombra de contato natural preservada sob os pés/objeto.',
    ],
  },
  {
    id: 'bg-03',
    category: 'background',
    tool: 'transparent_background',
    tier: 'padrao',
    title: 'Recorte com transparência alfa de modelo para e-commerce',
    userPrompt: '',
    criteria: [
      'Canal alfa nítido.',
      'Fios de cabelo isolados sem halo verde ou bordas esbranquiçadas.',
    ],
  },
  {
    id: 'bg-04',
    category: 'background',
    tool: 'replace_background',
    tier: 'premium',
    title: 'Cenário de café europeu contemporâneo ao entardecer',
    userPrompt: 'Colocar a pessoa sentada em um café elegante em Paris com iluminação dourada de fim de tarde.',
    criteria: [
      'Luz dourada do entardecer refletida sutilmente nos contornos da pele.',
      'Perspectiva da mesa alinhada perfeitamente com a postura.',
    ],
  },
  {
    id: 'bg-05',
    category: 'background',
    tool: 'replace_background',
    tier: 'padrao',
    title: 'Cenário de estúdio minimalista em tons pastel para moda',
    userPrompt: 'Fundo de estúdio fotográfico minimalista em tom terracota suave com arcos geométricos.',
    criteria: [
      'Linhas geométricas limpas e iluminação suave de difusor gigante.',
    ],
  },
  {
    id: 'bg-06',
    category: 'background',
    tool: 'replace_background',
    tier: 'economico',
    title: 'Paisagem natural de montanhas ensolaradas',
    userPrompt: 'Fundo de montanhas verdes e céu aberto em dia claro de sol.',
    criteria: [
      'Luz solar do cenário compatível com a iluminação do sujeito.',
    ],
  },
  {
    id: 'bg-07',
    category: 'background',
    tool: 'replace_background',
    tier: 'premium',
    title: 'Cenário noturno futurista com luzes neon suaves de metrópole',
    userPrompt: 'Fundo de metrópole moderna à noite com reflexos em asfalto molhado e luzes de bokeh.',
    criteria: [
      'Rim light (luz de recorte) realista nas bordas do cabelo e jaqueta.',
    ],
  },
  {
    id: 'bg-08',
    category: 'background',
    tool: 'remove_background',
    tier: 'padrao',
    title: 'Estúdio fotográfico cinza gradiente comercial',
    userPrompt: 'Fundo de estúdio cinza médio com vinheta suave.',
    criteria: [
      'Gradiente homogêneo sem efeito de faixas (color banding).',
    ],
  },
  {
    id: 'bg-09',
    category: 'background',
    tool: 'replace_background',
    tier: 'padrao',
    title: 'Biblioteca clássica em madeira para profissional do direito',
    userPrompt: 'Escritório clássico com estantes de livros em madeira nobre e iluminação quente de luminária.',
    criteria: [
      'Ambiente elegante condizente com retratos jurídicos/acadêmicos.',
    ],
  },
  {
    id: 'bg-10',
    category: 'background',
    tool: 'replace_background',
    tier: 'economico',
    title: 'Praia paradisíaca com areia branca e coqueiros distantes',
    userPrompt: 'Praia tropical ensolarada com mar azul turquesa ao fundo.',
    criteria: [
      'Horizonte reto e perspectiva de praia sem deformação.',
    ],
  },

  // =========================================================================
  // CATEGORIA 3: RETRATOS E FOTOS COMERCIAIS (10 casos)
  // =========================================================================
  {
    id: 'com-01',
    category: 'commercial_portrait',
    tool: 'product_photo',
    tier: 'premium',
    title: 'Foto de joia (anel de ouro) em pedestal de mármore',
    userPrompt: 'Anel repousado sobre bloco de mármore branco com iluminação macro e reflexo especular nítido no metal.',
    criteria: [
      'Brilho especular preciso no diamante e no ouro sem estourar realces.',
      'Textura das ranhuras do mármore nítida.',
    ],
  },
  {
    id: 'com-02',
    category: 'commercial_portrait',
    tool: 'product_photo',
    tier: 'padrao',
    title: 'Frasco de perfume com névoa d’água e iluminação de estúdio',
    userPrompt: 'Frasco de vidro com gotas de orvalho frescas e iluminação lateral suave em estúdio de cosméticos.',
    criteria: [
      'Vidro translúcido com refração realista.',
      'Rótulo e tipografia do produto preservados com legibilidade total.',
    ],
  },
  {
    id: 'com-03',
    category: 'commercial_portrait',
    tool: 'product_photo',
    tier: 'economico',
    title: 'Tênis de corrida em superfície neutra para e-commerce',
    userPrompt: 'Apresentação em catálogo esportivo com iluminação de softbox e sombra sutil.',
    criteria: [
      'Cores originais do calçado preservadas rigorosamente.',
      'Costuras e mesh do tecido em alta definição.',
    ],
  },
  {
    id: 'com-04',
    category: 'commercial_portrait',
    tool: 'improve_lighting',
    tier: 'padrao',
    title: 'Ajuste de iluminação em retrato com contraluz forte',
    userPrompt: 'Corrigir sombra no rosto causada pelo sol vindo de trás, equilibrando a exposição.',
    criteria: [
      'Rosto iluminado naturalmente sem ruído nas sombras.',
      'Tom de pele natural sem aspecto alaranjado ou artificial.',
    ],
  },
  {
    id: 'com-05',
    category: 'commercial_portrait',
    tool: 'sharpen',
    tier: 'padrao',
    title: 'Aprimoramento de nitidez em retrato fotográfico ligeiramente desfocado',
    userPrompt: 'Realçar detalhes dos olhos, cílios e fios de cabelo.',
    criteria: [
      'Olhos com nitidez cristalina e reflexo natural na íris.',
      'Sem halos esbranquiçados de nitidez artificial.',
    ],
  },
  {
    id: 'com-06',
    category: 'commercial_portrait',
    tool: 'restore_photo',
    tier: 'padrao',
    title: 'Restauração de foto antiga de família desbotada e arranhada',
    userPrompt: 'Restaurar rachaduras no papel fotográfico e recuperar contraste original.',
    criteria: [
      'Rachaduras e manchas de mofo eliminadas.',
      'Expressões faciais autênticas mantidas.',
    ],
  },
  {
    id: 'com-07',
    category: 'commercial_portrait',
    tool: 'improve_colors',
    tier: 'economico',
    title: 'Correção de tom amarelado por lâmpada incandescente',
    userPrompt: 'Corrigir balanço de branco para luz de dia neutra e tons de pele naturais.',
    criteria: [
      'Amarelado excessivo neutralizado.',
      'Tons de pele com frescor e saturação balanceada.',
    ],
  },
  {
    id: 'com-08',
    category: 'commercial_portrait',
    tool: 'replace_elements',
    tier: 'premium',
    title: 'Substituição de relógio de pulso simples por relógio clássico de luxo',
    userPrompt: 'Trocar o smartwatch esportivo preto por um relógio analógico clássico com pulseira de couro marrom.',
    criteria: [
      'Relógio novo encaixado perfeitamente na circunferência do pulso.',
      'Fivela e couro com iluminação condizente com o braço.',
    ],
  },
  {
    id: 'com-09',
    category: 'commercial_portrait',
    tool: 'add_elements',
    tier: 'padrao',
    title: 'Adição de plantas ornamentais ao fundo de foto de interiores',
    userPrompt: 'Adicionar uma planta costela-de-adão em vaso de cerâmica no canto vazio da sala.',
    criteria: [
      'Folhas com textura botânica realista e sombra de chão consistente.',
      'Escala da planta compatível com o mobiliário ao redor.',
    ],
  },
  {
    id: 'com-10',
    category: 'commercial_portrait',
    tool: 'variations',
    tier: 'premium',
    title: 'Variação editorial de moda com iluminação preto e branco dramática',
    userPrompt: 'Gerar versão editorial em preto e branco de alto contraste estilo revista de moda.',
    criteria: [
      'Gradação tonal em escala de cinzas rica, pretos profundos e brancos puros.',
      'Manutenção estrita da identidade e fisionomia da modelo.',
    ],
  },
];
