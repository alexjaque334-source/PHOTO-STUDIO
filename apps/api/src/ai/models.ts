/**
 * Catálogo e gerenciador de modelos de IA por Tier — ALEGON AI Photo Studio.
 * Dono: Subagente OpenRouter.
 * 
 * Gerencia o roteamento de modelos, fallback automático dentro do mesmo tier
 * e precificação em créditos.
 */

import type { Tier } from '../contracts';
import type { Env } from '../env';

export interface ModelConfigRecord {
  id: string;
  tier: Tier;
  model_id: string;
  display_name: string;
  credits_cost: number;
  priority: number;
  active: number;
  supports_mask: number;
  params_json: string | null;
  validated_at: string | null;
  notes: string | null;
  updated_at: string;
  updated_by: string | null;
}

/**
 * Modelos padrão validados como fallback em caso de banco inicial limpo.
 */
export const DEFAULT_TIER_MODELS: Record<Tier, Array<Omit<ModelConfigRecord, 'updated_at' | 'updated_by'>>> = {
  economico: [
    {
      id: 'mod_gemini_flash_img',
      tier: 'economico',
      model_id: 'google/gemini-2.5-flash-image',
      display_name: 'ALEGON Fast (Gemini Flash)',
      credits_cost: 1,
      priority: 10,
      active: 1,
      supports_mask: 0,
      params_json: JSON.stringify({ temperature: 0.2 }),
      validated_at: '2026-10-24T00:00:00Z',
      notes: 'Modelo primário do tier Econômico: ultra-rápido e custo reduzido.',
    },
    {
      id: 'mod_flux_schnell',
      tier: 'economico',
      model_id: 'black-forest-labs/flux-1-schnell',
      display_name: 'FLUX.1 Schnell',
      credits_cost: 1,
      priority: 20,
      active: 1,
      supports_mask: 1,
      params_json: JSON.stringify({ steps: 4 }),
      validated_at: '2026-10-24T00:00:00Z',
      notes: 'Fallback rápido do tier Econômico com inpainting.',
    },
  ],
  padrao: [
    {
      id: 'mod_imagen_3',
      tier: 'padrao',
      model_id: 'google/imagen-3',
      display_name: 'ALEGON Studio Pro (Imagen 3)',
      credits_cost: 1,
      priority: 10,
      active: 1,
      supports_mask: 1,
      params_json: JSON.stringify({ quality: 'standard' }),
      validated_at: '2026-10-24T00:00:00Z',
      notes: 'Modelo padrão equilibrado de altíssima fidelidade e fotorrealismo.',
    },
    {
      id: 'mod_gemini_flash_fallback',
      tier: 'padrao',
      model_id: 'google/gemini-2.5-flash-image',
      display_name: 'ALEGON Fast (Fallback)',
      credits_cost: 1,
      priority: 20,
      active: 1,
      supports_mask: 0,
      params_json: null,
      validated_at: '2026-10-24T00:00:00Z',
      notes: 'Fallback rápido em caso de sobrecarga no Imagen 3.',
    },
    {
      id: 'mod_flux_dev',
      tier: 'padrao',
      model_id: 'black-forest-labs/flux-1-dev',
      display_name: 'FLUX.1 Dev',
      credits_cost: 1,
      priority: 30,
      active: 1,
      supports_mask: 1,
      params_json: JSON.stringify({ guidance_scale: 3.5 }),
      validated_at: '2026-10-24T00:00:00Z',
      notes: 'Segundo fallback de alta precisão estética.',
    },
  ],
  premium: [
    {
      id: 'mod_flux_1_1_pro',
      tier: 'premium',
      model_id: 'black-forest-labs/flux-1.1-pro',
      display_name: 'ALEGON Master Ultra (FLUX Pro)',
      credits_cost: 2,
      priority: 10,
      active: 1,
      supports_mask: 1,
      params_json: JSON.stringify({ raw: true }),
      validated_at: '2026-10-24T00:00:00Z',
      notes: 'Modelo Ultra-HD para estúdio comercial de moda e produto.',
    },
    {
      id: 'mod_imagen_3_premium_fallback',
      tier: 'premium',
      model_id: 'google/imagen-3',
      display_name: 'ALEGON Studio (Fallback)',
      credits_cost: 2,
      priority: 20,
      active: 1,
      supports_mask: 1,
      params_json: JSON.stringify({ quality: 'hd' }),
      validated_at: '2026-10-24T00:00:00Z',
      notes: 'Fallback do tier Premium.',
    },
  ],
};

/**
 * Consulta os modelos ativos de um tier no banco D1, ordenados por prioridade.
 * Caso o banco não contenha registros, utiliza os defaults.
 */
export async function getActiveModelsForTier(env: Env, tier: Tier): Promise<ModelConfigRecord[]> {
  try {
    if (env.DB) {
      const { results } = await env.DB.prepare(
        'SELECT * FROM model_configurations WHERE tier = ? AND active = 1 ORDER BY priority ASC',
      )
        .bind(tier)
        .all<ModelConfigRecord>();

      if (results && results.length > 0) {
        return results;
      }
    }
  } catch (err) {
    console.warn(`[models] Falha ao consultar model_configurations em D1: ${err}. Usando defaults em memória.`);
  }

  // Fallback para modelos padrão em memória
  const defaults = DEFAULT_TIER_MODELS[tier] || [];
  return defaults.map((m) => ({
    ...m,
    updated_at: new Date().toISOString(),
    updated_by: 'system_default',
  }));
}

/**
 * Retorna os créditos necessários e o nome amigável do modelo primário para cotação.
 */
export async function getQuoteForTier(env: Env, tier: Tier): Promise<{ credits: number; modelLabel: string }> {
  const models = await getActiveModelsForTier(env, tier);
  const primary = models[0] || DEFAULT_TIER_MODELS[tier]?.[0];
  return {
    credits: primary?.credits_cost ?? 1,
    modelLabel: primary?.display_name ?? 'Modelo IA Padrão',
  };
}
