-- Atualização oficial dos preços, créditos e características dos pacotes e planos

-- 1. Pacotes Avulsos
UPDATE products 
SET credits = 1, price_cents = 790, credit_validity_days = 30, updated_at = datetime('now')
WHERE code = 'single_edit';

UPDATE products 
SET credits = 5, price_cents = 1990, credit_validity_days = 365, updated_at = datetime('now')
WHERE code = 'pack_inicial';

UPDATE products 
SET credits = 10, price_cents = 3990, credit_validity_days = 365, updated_at = datetime('now')
WHERE code = 'pack_criador';

UPDATE products 
SET credits = 30, price_cents = 7490, credit_validity_days = 365, updated_at = datetime('now')
WHERE code = 'pack_profissional';

-- 2. Planos Mensais
UPDATE plans
SET monthly_credits = 15, price_cents = 2990, updated_at = datetime('now')
WHERE code = 'pessoal';

UPDATE plans
SET monthly_credits = 40, price_cents = 6990, updated_at = datetime('now')
WHERE code = 'pro';

UPDATE plans
SET monthly_credits = 100, price_cents = 15990, updated_at = datetime('now')
WHERE code = 'business';
