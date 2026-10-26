-- ALEGON AI Photo Studio — Sementes Oficiais de Catálogo e Configurações Financeiras
-- Migração: 0050_catalog_seed.sql
-- Faixa de Propriedade: 0050–0059 (Dono: Especialista Financeiro SaaS)
-- Data: 2026-10-24T00:00:00Z

-- =====================================================================
-- 1. PRODUTOS AVULSOS E PACOTES DE CRÉDITOS
-- =====================================================================
-- Preços em centavos:
-- single_edit:        R$  7,90 =   790 centavos (1 crédito, validade 30 dias)
-- pack_inicial:       R$ 19,90 =  1990 centavos (5 créditos, validade 365 dias)
-- pack_criador:       R$ 39,90 =  3990 centavos (12 créditos, validade 365 dias)
-- pack_profissional:  R$ 59,90 =  5990 centavos (20 créditos, validade 365 dias)

INSERT OR REPLACE INTO products (
  id,
  code,
  kind,
  name,
  description,
  credits,
  price_cents,
  credit_validity_days,
  active,
  sort_order,
  updated_at,
  updated_by
) VALUES
  (
    '0192a000-0000-7000-8000-000000000001',
    'single_edit',
    'single_edit',
    'Edição Avulsa',
    '1 crédito para realizar 1 edição com inteligência artificial profissional.',
    1,
    790,
    30,
    1,
    10,
    '2026-10-24T00:00:00Z',
    'system_seed'
  ),
  (
    '0192a000-0000-7000-8000-000000000002',
    'pack_inicial',
    'credit_pack',
    'Pacote Inicial',
    '5 créditos de edição em alta resolução válidos por 12 meses.',
    5,
    1990,
    365,
    1,
    20,
    '2026-10-24T00:00:00Z',
    'system_seed'
  ),
  (
    '0192a000-0000-7000-8000-000000000003',
    'pack_criador',
    'credit_pack',
    'Pacote Criador',
    '10 créditos de edição perfeitos para criadores de conteúdo e anúncios de produtos.',
    10,
    3990,
    365,
    1,
    30,
    '2026-10-24T00:00:00Z',
    'system_seed'
  ),
  (
    '0192a000-0000-7000-8000-000000000004',
    'pack_profissional',
    'credit_pack',
    'Pacote Profissional',
    '30 créditos de edição para profissionais com todos os 8 tipos de fotos liberados.',
    30,
    7490,
    365,
    1,
    40,
    '2026-10-24T00:00:00Z',
    'system_seed'
  );

-- =====================================================================
-- 2. PLANOS DE ASSINATURA RECORRENTE (MENSAIS)
-- =====================================================================
-- Preços em centavos:
-- pessoal:   R$  29,90/mês =  2990 centavos (15 créditos mensais)
-- pro:       R$  69,90/mês =  6990 centavos (40 créditos mensais)
-- business:  R$ 149,90/mês = 14990 centavos (100 créditos mensais)

INSERT OR REPLACE INTO plans (
  id,
  code,
  name,
  description,
  monthly_credits,
  price_cents,
  cycle,
  active,
  sort_order,
  updated_at,
  updated_by
) VALUES
  (
    '0192a000-0000-7000-8000-000000000011',
    'pessoal',
    'Plano Pessoal',
    '15 créditos mensais para criadores individuais e fotos pessoais.',
    15,
    2990,
    'MONTHLY',
    1,
    10,
    '2026-10-24T00:00:00Z',
    'system_seed'
  ),
  (
    '0192a000-0000-7000-8000-000000000012',
    'pro',
    'Plano Pro',
    '40 créditos mensais para lojas virtuais, fotógrafos e produção contínua.',
    40,
    6990,
    'MONTHLY',
    1,
    20,
    '2026-10-24T00:00:00Z',
    'system_seed'
  ),
  (
    '0192a000-0000-7000-8000-000000000013',
    'business',
    'Plano Business',
    '100 créditos mensais com todos os 8 tipos de fotos e 90 dias de histórico.',
    100,
    15990,
    'MONTHLY',
    1,
    30,
    '2026-10-24T00:00:00Z',
    'system_seed'
  );

-- =====================================================================
-- 3. CONFIGURAÇÕES FINANCEIRAS DO SISTEMA (system_settings)
-- =====================================================================

-- Cotação Cambial e Spread de Proteção USD/BRL
INSERT OR REPLACE INTO system_settings (key, value_json, updated_at, updated_by)
VALUES (
  'fx.usd_brl',
  '{"base_rate":5.85,"spread_buffer_pct":0.08,"effective_rate":6.318,"iof_pct":0.0538,"currency":"BRL","description":"Taxa de conversao efetiva USD para BRL com buffer de protecao cambial e IOF","updated_at":"2026-10-24T00:00:00Z"}',
  '2026-10-24T00:00:00Z',
  'system_seed'
);

-- Alvos e Limites de Margem Operacional
INSERT OR REPLACE INTO system_settings (key, value_json, updated_at, updated_by)
VALUES (
  'finance.target_margin',
  '{"gross_margin_target_pct":0.75,"min_contribution_margin_pct":0.70,"ai_cost_ceiling_pct":0.20,"buffer_retry_pct":0.15,"description":"Metas e pisos de rentabilidade e protecao operacional","updated_at":"2026-10-24T00:00:00Z"}',
  '2026-10-24T00:00:00Z',
  'system_seed'
);

-- Tabela de Tarifas Asaas Adotadas para Referência
INSERT OR REPLACE INTO system_settings (key, value_json, updated_at, updated_by)
VALUES (
  'finance.asaas_rates',
  '{"pix_fixed_brl":0.99,"credit_card_fixed_brl":0.49,"credit_card_percent":0.0299,"payout_pix_brl":0.00,"mix_pix_pct":0.60,"mix_credit_card_pct":0.40,"updated_at":"2026-10-24T00:00:00Z"}',
  '2026-10-24T00:00:00Z',
  'system_seed'
);

-- Parâmetros Tributários de Referência (Simples Nacional - Anexo III com Fator R)
INSERT OR REPLACE INTO system_settings (key, value_json, updated_at, updated_by)
VALUES (
  'finance.tax_rates',
  '{"simples_nacional_base_pct":0.06,"annex":"III","fator_r_min_pct":0.28,"cnae":"6202-3/00","updated_at":"2026-10-24T00:00:00Z"}',
  '2026-10-24T00:00:00Z',
  'system_seed'
);
