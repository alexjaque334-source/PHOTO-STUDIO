/**
 * Módulo de prevenção a abuso e moderação de prompts de IA.
 * Dono: Subagente 6 (Segurança e LGPD).
 *
 * Filtra termos ilegais e violações aos termos de serviço e à legislação brasileira:
 * - CSAM / Exploração infantil (Tolerância Zero - Art. 241 ECA).
 * - NCII / Deepfakes não consensuais e pornografia de vingança (Art. 216-B Código Penal / Marco Civil da Internet).
 * - Violência extrema, apologia a crimes e terrorismo.
 * - Fabricação de armas, explosivos e bioterrorismo.
 * - Discurso de ódio discriminatório.
 */

export type AbuseCategory =
  | 'csam'
  | 'ncii'
  | 'violence'
  | 'hate'
  | 'weapons'
  | 'illegal';

export type AbuseSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface ModerationResult {
  allowed: boolean;
  reason?: string;
  category?: AbuseCategory;
  severity?: AbuseSeverity;
}

interface AbuseRule {
  pattern: RegExp;
  category: AbuseCategory;
  severity: AbuseSeverity;
  reason: string;
}

// Conjunto de regras determinísticas em PT-BR e EN
const ABUSE_RULES: AbuseRule[] = [
  // 1. Exploração Sexual Infantil / CSAM (CRITICAL - Art. 241 Lei 8.069/1990)
  {
    pattern:
      /\b(child\s*porn|pedophil|pedo|infantil\s*nu|crian[cç]a\s*nu[ad]|menor\s*nu[ad]|pornografia\s*infantil|estupro\s*infantil|underage\s*nude|loli\s*nude|shota\s*nude)\b/i,
    category: 'csam',
    severity: 'critical',
    reason: 'Violação grave: Conteúdo associado a exploração infantil é estritamente proibido por lei.',
  },

  // 2. NCII / Nudez não consensual / Deepfakes pornográficos (HIGH)
  {
    pattern:
      /\b(deepfake\s*porn|nude\s*celebrity|nude\s*leak|vazar\s*nudes|remover\s*roupa|undress\s*app|despir\s*foto|nua\s*sem\s*autoriza[cç][aã]o|revenge\s*porn|pornografia\s*de\s*vingan[cç]a)\b/i,
    category: 'ncii',
    severity: 'high',
    reason: 'Violação de privacidade: Geração de nudez não consensual ou deepfake sexual é proibida.',
  },

  // 3. Violência extrema, automutilação e terrorismo (HIGH)
  {
    pattern:
      /\b(como\s*se\s*matar|suicide\s*method|como\s*cortar\s*os\s*pulsos|terrorist\s*attack|atentado\s*terrorista|decapita[cç][aã]o|estupro|massacre\s*escolar|school\s*shooting)\b/i,
    category: 'violence',
    severity: 'high',
    reason: 'Conteúdo promovendo violência extrema, automutilação ou terrorismo é proibido.',
  },

  // 4. Armas de fogo, bombas e explosivos (HIGH)
  {
    pattern:
      /\b(como\s*fazer\s*bomba|how\s*to\s*make\s*a\s*bomb|fabricar\s*explosivo|molotov\s*cocktail|veneno\s*letal|anthrax|ricin)\b/i,
    category: 'weapons',
    severity: 'high',
    reason: 'Instruções para confecção de armas, explosivos ou compostos letais são proibidas.',
  },

  // 5. Discurso de ódio e discriminação (HIGH)
  {
    pattern:
      /\b(nazis[mtao]*|su[aá]stica|swastika|supremacista\s*branco|white\s*supremac|morte\s*aos\s*judeus|exterminar\s*(negros|gays|ind[ií]genas))\b/i,
    category: 'hate',
    severity: 'high',
    reason: 'Discurso de ódio, racismo ou incitação a crimes contra grupos vulneráveis é proibido.',
  },

  // 6. Fraude e documentos falsificados (MEDIUM)
  {
    pattern:
      /\b(falsificar\s*(rg|cpf|passaporte|cnh)|fake\s*id\s*maker|clonar\s*cart[aã]o|gerador\s*de\s*cart[aã]o\s*de\s*cr[eé]dito)\b/i,
    category: 'illegal',
    severity: 'medium',
    reason: 'Tentativa de geração ou manipulação de documentos oficiais falsificados é proibida.',
  },
];

/**
 * Valida o texto do prompt de edição antes de enviar para processamento de IA.
 */
export function validatePrompt(prompt: string): ModerationResult {
  if (!prompt || typeof prompt !== 'string') {
    return { allowed: true };
  }

  const normalized = prompt.trim();

  for (const rule of ABUSE_RULES) {
    if (rule.pattern.test(normalized)) {
      return {
        allowed: false,
        reason: rule.reason,
        category: rule.category,
        severity: rule.severity,
      };
    }
  }

  return { allowed: true };
}
