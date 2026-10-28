-- Atualização dos modelos ativos para OpenRouter
-- Desativa google/imagen-3 e modelos incompatíveis, ativa google/gemini-2.5-flash-image como primário

UPDATE model_configurations
SET active = 0
WHERE model_id LIKE '%imagen-3%' OR model_id LIKE '%flux-1%';

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
  (
    'mod_gemini_2_5_flash_padrao',
    'padrao',
    'google/gemini-2.5-flash-image',
    'ALEGON Studio Pro (Gemini Flash Image)',
    1,
    10,
    1,
    0,
    '{"temperature":0.2}',
    '2026-10-26T00:00:00Z',
    'Modelo primário validado no OpenRouter para edição multimodal.',
    datetime('now'),
    'system_update'
  ),
  (
    'mod_gemini_nano_banana_2_1',
    'padrao',
    'google/gemini-nano-banana-2.1',
    'ALEGON Studio Pro (Nano Banana 2.1)',
    1,
    15,
    1,
    0,
    '{"temperature":0.2}',
    '2026-10-28T00:00:00Z',
    'Modelo Nano Banana 2.1 oficial do OpenRouter.',
    datetime('now'),
    'system_update'
  ),
  (
    'mod_gemini_3_1_flash_padrao',
    'padrao',
    'google/gemini-3.1-flash-image',
    'ALEGON Studio Pro (Gemini 3.1 Flash)',
    1,
    20,
    1,
    0,
    '{"temperature":0.2}',
    '2026-10-26T00:00:00Z',
    'Fallback 1 para o tier Padrão.',
    datetime('now'),
    'system_update'
  ),
  (
    'mod_gemini_3_pro_padrao',
    'padrao',
    'google/gemini-3-pro-image',
    'ALEGON Studio Pro (Gemini 3 Pro)',
    1,
    30,
    1,
    0,
    '{"temperature":0.2}',
    '2026-10-26T00:00:00Z',
    'Fallback 2 para o tier Padrão.',
    datetime('now'),
    'system_update'
  );
