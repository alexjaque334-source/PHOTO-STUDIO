/**
 * Gerenciador e sanitizador de prompts de IA — ALEGON AI Photo Studio.
 * Dono: Subagente OpenRouter.
 * 
 * Regras:
 * - Templates em inglês de alta precisão técnica para máxima fidelidade dos modelos.
 * - Preservação estrita de identidade facial, textura de pele e anatomia natural.
 * - Sanitização contra Prompt Injection, jailbreaks e quebra de delimitadores.
 */

import type { EditTool } from '../contracts';
import { DomainError } from '../contracts';

/**
 * Padrões perigosos para injeção de prompt e jailbreak.
 */
const SUSPICIOUS_PATTERNS: RegExp[] = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+instructions/i,
  /disregard\s+(all\s+)?(previous|prior|above)\s+instructions/i,
  /you\s+are\s+now\s+(unrestricted|DAN|jailbroken)/i,
  /system\s*(override|instruction|prompt)\s*:/i,
  /system\s*(override|instruction|prompt)/i,
  /(bypass|disable)\s+(safety|content\s+filters?)/i,
  /<\|im_start\|>/i,
  /<\|im_end\|>/i,
  /\[INST\]/i,
  /\[\/INST\]/i,
  /```\s*(system|instruction)/i,
  /override\s+safety\s+guidelines/i,
];

/**
 * Sanitiza o texto livre digitado pelo usuário.
 * Remove caracteres de controle invisíveis, trunca para 2000 caracteres
 * e lança DomainError se detectar tentativa maliciosa de prompt injection.
 */
export function sanitizeUserPrompt(raw: string): string {
  if (!raw || typeof raw !== 'string') {
    return '';
  }

  // Remove caracteres de controle ASCII/Unicode não imprimíveis (exceto quebras de linha e tabs comuns)
  let cleaned = raw.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\u200B-\u200F\uFEFF]/g, '');

  cleaned = cleaned.trim();

  // Limite máximo do contrato
  if (cleaned.length > 2000) {
    cleaned = cleaned.slice(0, 2000).trim();
  }

  // Validação contra ataques de substituição de instrução do sistema
  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(cleaned)) {
      throw new DomainError(
        'AI_CONTENT_REFUSED',
        'O texto do prompt contém comandos de controle não permitidos.',
        422,
        { pattern: pattern.source },
      );
    }
  }

  return cleaned;
}

/**
 * Diretivas essenciais de qualidade fotográfica e preservação anatômica.
 */
const PRESERVATION_DIRECTIVES = [
  'Strict photo preservation rules:',
  '1. Maintain authentic camera physics, natural skin pores, realistic hair, and anatomically correct hands/fingers.',
  '2. Do NOT apply plastic AI smoothing, hyper-stylization, unnatural eye glow, or distorted limbs.',
  '3. Keep subject facial identity, bone structure, and facial expression perfectly true to the original reference image.',
  '4. Preserve original image aspect ratio, resolution scale, and consistent lighting geometry.',
].join('\n');

/**
 * Templates técnicos em inglês para cada ferramenta do contrato.
 */
export const TOOL_PROMPT_TEMPLATES: Record<EditTool, (userInput: string) => string> = {
  free_prompt: (userInput: string) => {
    return [
      'TASK: Professional Photo Editing & Compositing.',
      `USER INSTRUCTION: "${userInput}"`,
      '',
      PRESERVATION_DIRECTIVES,
      'Execute the user instruction with maximum photographic realism, integrating seamlessly into the source image.',
    ].join('\n');
  },

  remove_people: (userInput: string) => {
    const details = userInput ? `Target people to remove: "${userInput}".` : 'Remove unwanted background persons, photobombers, and crowd.';
    return [
      'TASK: Seamless Inpainting - Person Removal.',
      details,
      'Maintain the main primary foreground subject completely intact.',
      'Reconstruct and fill the occluded background areas using matching architecture, perspective lines, environmental textures, and natural ambient light.',
      '',
      PRESERVATION_DIRECTIVES,
    ].join('\n');
  },

  remove_objects: (userInput: string) => {
    return [
      'TASK: Seamless Inpainting - Object Removal.',
      `Target object(s) to remove: "${userInput}".`,
      'Completely eliminate the specified object(s), their artificial shadows, and reflections.',
      'Inpaint the underlying ground, wall, or scenery with authentic textures and correct light falloff.',
      '',
      PRESERVATION_DIRECTIVES,
    ].join('\n');
  },

  replace_background: (userInput: string) => {
    return [
      'TASK: Professional Studio Background Replacement.',
      `Desired new background: "${userInput}".`,
      'Carefully segment the foreground subject(s) with sub-pixel edge feathering for hair, clothing, and silhouette.',
      'Synthesize the new background matching the camera focal length, depth of field, horizon line, and contact ground shadows.',
      'Harmonize light bounce and ambient color temperature on the subject edges to ensure natural composite realism.',
      '',
      PRESERVATION_DIRECTIVES,
    ].join('\n');
  },

  remove_background: (userInput: string) => {
    const customStyle = userInput ? `Note: "${userInput}".` : 'Clean seamless studio isolation.';
    return [
      'TASK: Professional Studio Background Isolation.',
      customStyle,
      'Remove existing busy background and replace with a clean, high-end neutral studio backdrop (soft off-white or neutral light gradient).',
      'Preserve soft realistic contact floor drop shadows under the subject for natural grounding.',
      '',
      PRESERVATION_DIRECTIVES,
    ].join('\n');
  },

  transparent_background: (_userInput: string) => {
    return [
      'TASK: Alpha Cutout - Clean Background Removal.',
      'Extract the primary foreground subject completely isolated with crisp, clean silhouette edges.',
      'Clean edge matting around hair, fine flyaways, and fabric seams.',
      'Remove all background pixels, rendering transparency or pure neutral matte ready for graphic compositing.',
      '',
      PRESERVATION_DIRECTIVES,
    ].join('\n');
  },

  improve_lighting: (userInput: string) => {
    const extra = userInput ? `Specific emphasis: "${userInput}".` : 'Commercial studio three-point lighting balance.';
    return [
      'TASK: Professional Photographic Lighting Enhancement.',
      extra,
      'Balance global exposure, lift underexposed shadows with zero noise artifacting, and control harsh blown highlights.',
      'Add subtle key, fill, and rim light shaping to emphasize depth and subject volume.',
      'Retain natural skin tones and organic shadow roll-off.',
      '',
      PRESERVATION_DIRECTIVES,
    ].join('\n');
  },

  improve_colors: (userInput: string) => {
    const extra = userInput ? `Color grading direction: "${userInput}".` : 'Cinematic commercial catalog color grading.';
    return [
      'TASK: Color Grading and White Balance Calibration.',
      extra,
      'Neutralize color casts, correct white balance, and balance chromatic harmony.',
      'Enhance vibrance and micro-contrast while keeping human skin tones naturally calibrated and radiant.',
      'Avoid oversaturation and color banding.',
      '',
      PRESERVATION_DIRECTIVES,
    ].join('\n');
  },

  sharpen: (userInput: string) => {
    const extra = userInput ? `Target details: "${userInput}".` : 'Micro-texture clarity and edge resolution.';
    return [
      'TASK: Super-Resolution & Clarity Enhancement.',
      extra,
      'Enhance optical clarity, eyelash definition, fabric weave, and architectural edges.',
      'Suppress digital compression noise and sensor grain without ringing halos or artificial sharpening artifacts.',
      '',
      PRESERVATION_DIRECTIVES,
    ].join('\n');
  },

  restore_photo: (userInput: string) => {
    const extra = userInput ? `Additional request: "${userInput}".` : 'Vintage photo damage restoration.';
    return [
      'TASK: Archival Photo Restoration.',
      extra,
      'Heal physical tears, scratches, dust specks, water damage, and paper creases.',
      'Reconstruct faded contrast and correct chemical yellowing or discoloration.',
      'Sharpen soft facial features while strictly respecting historical realism and true facial identity.',
      '',
      PRESERVATION_DIRECTIVES,
    ].join('\n');
  },

  product_photo: (userInput: string) => {
    const extra = userInput ? `Product staging note: "${userInput}".` : 'Luxury e-commerce commercial catalog presentation.';
    return [
      'TASK: High-End E-Commerce Product Photography.',
      extra,
      'Showcase the product with studio diffuse softbox illumination, crisp product reflections, and pristine surface texture.',
      'Ensure brand typography, logos, and product geometry remain sharp, undistorted, and perfectly legible.',
      '',
      PRESERVATION_DIRECTIVES,
    ].join('\n');
  },

  add_elements: (userInput: string) => {
    return [
      'TASK: Seamless Scene Compositing - Addition.',
      `Element(s) to add: "${userInput}".`,
      'Composite the requested item(s) into the scene with proper spatial perspective, physical scale, and contact occlusion.',
      'Match the existing light source angle, color temperature, and camera depth-of-field blur.',
      '',
      PRESERVATION_DIRECTIVES,
    ].join('\n');
  },

  replace_elements: (userInput: string) => {
    return [
      'TASK: Seamless Inpainting - Element Replacement.',
      `Replacement instruction: "${userInput}".`,
      'Replace the specified item with the new target item while respecting boundary lines and environmental interactions.',
      'Ensure realistic physics, cast shadows, and reflections on surrounding surfaces.',
      '',
      PRESERVATION_DIRECTIVES,
    ].join('\n');
  },

  variations: (userInput: string) => {
    const extra = userInput ? `Creative variation hint: "${userInput}".` : 'Refined aesthetic variation.';
    return [
      'TASK: Creative Photographic Variations.',
      extra,
      'Generate a refined, high-end alternative version of the scene with subtle shifts in composition, atmosphere, and mood.',
      'Preserve the core identity of the subject and main narrative elements.',
      '',
      PRESERVATION_DIRECTIVES,
    ].join('\n');
  },
};

/**
 * Constrói o prompt final pronto para envio ao modelo de IA.
 */
export function buildFinalPrompt(tool: EditTool, userInput: string): string {
  const sanitized = sanitizeUserPrompt(userInput);
  const templateFn = TOOL_PROMPT_TEMPLATES[tool] || TOOL_PROMPT_TEMPLATES.free_prompt;
  return templateFn(sanitized);
}
