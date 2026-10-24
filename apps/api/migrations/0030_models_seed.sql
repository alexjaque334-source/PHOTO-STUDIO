-- ALEGON AI Photo Studio — Seed de Modelos OpenRouter (IA)
-- Faixa de migração: 0030-0039 (Dono exclusivo: Subagente OpenRouter)

INSERT OR REPLACE INTO model_configurations (
  id,
  tier,
  model_id,
  display_name,
  credits_cost,
  priority,
  active,
  supports_mask,
  params_json,
  validated_at,
  notes,
  updated_at,
  updated_by
) VALUES
  -- Tier Econômico (1 Crédito)
  (
    'mod_gemini_flash_img',
    'economico',
    'google/gemini-2.5-flash-image',
    'ALEGON Fast (Gemini Flash)',
    1,
    10,
    1,
    0,
    '{"temperature":0.2}',
    '2026-10-24T00:00:00Z',
    'Modelo primário do tier Econômico: latência ultra-baixa (~3s) e excelente custo-benefício.',
    datetime('now'),
    'system_seed'
  ),
  (
    'mod_flux_schnell',
    'economico',
    'black-forest-labs/flux-1-schnell',
    'FLUX.1 Schnell',
    1,
    20,
    1,
    1,
    '{"steps":4}',
    '2026-10-24T00:00:00Z',
    'Fallback rápido do tier Econômico com suporte a inpainting.',
    datetime('now'),
    'system_seed'
  ),

  -- Tier Padrão (1 Crédito)
  (
    'mod_imagen_3',
    'padrao',
    'google/imagen-3',
    'ALEGON Studio Pro (Imagen 3)',
    1,
    10,
    1,
    1,
    '{"quality":"standard"}',
    '2026-10-24T00:00:00Z',
    'Modelo padrão equilibrado de altíssima fidelidade e fotorrealismo de estúdio.',
    datetime('now'),
    'system_seed'
  ),
  (
    'mod_gemini_flash_fallback',
    'padrao',
    'google/gemini-2.5-flash-image',
    'ALEGON Fast (Fallback)',
    1,
    20,
    1,
    0,
    NULL,
    '2026-10-24T00:00:00Z',
    'Fallback de alta disponibilidade para o tier Padrão.',
    datetime('now'),
    'system_seed'
  ),
  (
    'mod_flux_dev',
    'padrao',
    'black-forest-labs/flux-1-dev',
    'FLUX.1 Dev',
    1,
    30,
    1,
    1,
    '{"guidance_scale":3.5}',
    '2026-10-24T00:00:00Z',
    'Segundo fallback com inpainting e controle de difusão refinado.',
    datetime('now'),
    'system_seed'
  ),

  -- Tier Premium (2 Créditos)
  (
    'mod_flux_1_1_pro',
    'premium',
    'black-forest-labs/flux-1.1-pro',
    'ALEGON Master Ultra (FLUX Pro)',
    2,
    10,
    1,
    1,
    '{"raw":true}',
    '2026-10-24T00:00:00Z',
    'Modelo Ultra-HD para estúdio comercial de moda e e-commerce de luxo.',
    datetime('now'),
    'system_seed'
  ),
  (
    'mod_imagen_3_premium_fallback',
    'premium',
    'google/imagen-3',
    'ALEGON Studio (Fallback)',
    2,
    20,
    1,
    1,
    '{"quality":"hd"}',
    '2026-10-24T00:00:00Z',
    'Fallback do tier Premium mantendo renderização fotorrealista.',
    datetime('now'),
    'system_seed'
  );
