/**
 * Catálogo canônico de ferramentas de edição de IA — ALEGON AI Photo Studio.
 * Dono: Subagente OpenRouter.
 */

import type { AiToolDescriptor, EditTool } from '../contracts';

export const AI_TOOLS_CATALOG: AiToolDescriptor[] = [
  {
    id: 'free_prompt',
    label: 'Edição Livre (Prompt)',
    description: 'Descreva livremente qualquer alteração, estilo ou composição desejada na sua foto.',
    promptTemplate: 'Executa comandos livres com preservação de fotorrealismo e fisionomia humana.',
    requiresUserText: true,
    supportsMask: false,
  },
  {
    id: 'remove_people',
    label: 'Remover Pessoas e Figurantes',
    description: 'Elimine pessoas indesejadas, pedestres e figurantes ao fundo sem alterar o sujeito principal.',
    promptTemplate: 'Inpainting inteligente para preenchimento de cenário com reconstrução de textura e luz.',
    requiresUserText: false,
    supportsMask: true,
  },
  {
    id: 'remove_objects',
    label: 'Remover Objetos',
    description: 'Apague placas, lixeiras, postes, fios, reflexos ou distrações do cenário.',
    promptTemplate: 'Eliminação de elementos e reconstrução fotográfica da superfície de fundo.',
    requiresUserText: true,
    supportsMask: true,
  },
  {
    id: 'replace_background',
    label: 'Substituir Fundo de Cenário',
    description: 'Troque o ambiente de fundo por um novo cenário (ex.: praia, escritório moderno, estúdio, natureza).',
    promptTemplate: 'Segmentação precisa com harmonização de luz ambiente, perspectiva e sombras de contato.',
    requiresUserText: true,
    supportsMask: false,
  },
  {
    id: 'remove_background',
    label: 'Fundo de Estúdio Neutro',
    description: 'Isole o assunto da foto sobre um fundo de estúdio limpo, profissional e com sombra suave natural.',
    promptTemplate: 'Isolamento de assunto com backdrop neutro suave estilo estúdio fotográfico.',
    requiresUserText: false,
    supportsMask: false,
  },
  {
    id: 'transparent_background',
    label: 'Fundo Transparente (Recorte)',
    description: 'Recorte perfeito do assunto em alta resolução com canal alfa para design gráfico e peças comerciais.',
    promptTemplate: 'Extração com máscara sub-pixel precisa para cabelo e vestuário sem fundo.',
    requiresUserText: false,
    supportsMask: false,
  },
  {
    id: 'improve_lighting',
    label: 'Iluminação Profissional',
    description: 'Corrija fotos escuras ou superexpostas criando iluminação de estúdio tridimensional e suave.',
    promptTemplate: 'Equilíbrio de sombras, realces controlados e modelagem de luz suave em estúdio.',
    requiresUserText: false,
    supportsMask: false,
  },
  {
    id: 'improve_colors',
    label: 'Colorização e Balanço de Cores',
    description: 'Calibre o balanço de branco e aplique gradação de cores cinematográfica e tons de pele radiantes.',
    promptTemplate: 'Correção cromática, aumento do alcance dinâmico e calibragem de tons de pele naturais.',
    requiresUserText: false,
    supportsMask: false,
  },
  {
    id: 'sharpen',
    label: 'Nitidez e Super-Resolução',
    description: 'Realce detalhes finos, fios de cabelo, texturas de tecidos e reduza ruído de compressão.',
    promptTemplate: 'Super-resolução sem artefatos de borda artificial mantendo o grão óptico natural.',
    requiresUserText: false,
    supportsMask: false,
  },
  {
    id: 'restore_photo',
    label: 'Restaurar Foto Antiga',
    description: 'Recupere fotos antigas removendo arranhões, manchas, rasgos e recuperando o contraste original.',
    promptTemplate: 'Restauração de perdas físicas, remoção de poeira e reconstrução histórica fidedigna.',
    requiresUserText: false,
    supportsMask: false,
  },
  {
    id: 'product_photo',
    label: 'Foto de Produto (E-Commerce)',
    description: 'Transforme fotos caseiras em fotos de catálogo comercial de luxo com iluminação de estúdio.',
    promptTemplate: 'Staging de produto em estúdio difuso com nitidez nas embalagens e sombras de mesa.',
    requiresUserText: false,
    supportsMask: false,
  },
  {
    id: 'add_elements',
    label: 'Adicionar Elementos',
    description: 'Insira novos objetos, plantas, adereços ou elementos visuais mantendo a física da cena.',
    promptTemplate: 'Composição de novos elementos com oclusão espacial e coerência de ângulo luminoso.',
    requiresUserText: true,
    supportsMask: false,
  },
  {
    id: 'replace_elements',
    label: 'Substituir Elemento',
    description: 'Substitua uma peça de roupa, mobília ou elemento por outro indicado no seu texto.',
    promptTemplate: 'Inpainting contextual de substituição direta de elemento por novo item fotorrealista.',
    requiresUserText: true,
    supportsMask: true,
  },
  {
    id: 'variations',
    label: 'Variações Criativas',
    description: 'Crie versões alternativas requintadas da mesma imagem com nuances estéticas de composição.',
    promptTemplate: 'Geração de variações fotográficas exploratórias preservando a identidade principal.',
    requiresUserText: false,
    supportsMask: false,
  },
];

/**
 * Obtém o descritor de uma ferramenta pelo ID.
 */
export function getToolDescriptor(toolId: EditTool): AiToolDescriptor | undefined {
  return AI_TOOLS_CATALOG.find((t) => t.id === toolId);
}
