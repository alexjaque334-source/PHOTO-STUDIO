-- Migração: 0060_seed_test_user.sql
-- Aprovação da conta teste de usuário: exemplo25@gmail.com
-- Senha: Loko1998***
-- Créditos: 50 créditos liberados

INSERT INTO users (
  id,
  email,
  password_hash,
  email_verified_at,
  status,
  failed_login_count,
  locked_until,
  created_at,
  updated_at
) VALUES (
  '0192a000-0000-7000-8000-000000000099',
  'exemplo25@gmail.com',
  'pbkdf2-sha256$100000$OlV+j05cKXADF95k493buA==$Dhza//SOeV2ftL1ROxGaXfzgjWD4UFIe4TZHC6czcKE=',
  '2026-10-25T00:00:00Z',
  'active',
  0,
  NULL,
  '2026-10-25T00:00:00Z',
  '2026-10-25T00:00:00Z'
)
ON CONFLICT (email) DO UPDATE SET
  password_hash = excluded.password_hash,
  email_verified_at = COALESCE(users.email_verified_at, excluded.email_verified_at),
  status = 'active',
  failed_login_count = 0,
  locked_until = NULL,
  updated_at = excluded.updated_at;

-- Perfil de Usuário
INSERT OR REPLACE INTO profiles (
  user_id,
  full_name,
  marketing_opt_in,
  accepted_terms_version,
  accepted_terms_at,
  accepted_privacy_version,
  accepted_privacy_at,
  theme,
  updated_at
) VALUES (
  (SELECT id FROM users WHERE email = 'exemplo25@gmail.com'),
  'Usuário Teste',
  0,
  'v1.0',
  '2026-10-25T00:00:00Z',
  'v1.0',
  '2026-10-25T00:00:00Z',
  'dark',
  '2026-10-25T00:00:00Z'
);

-- Atribui role 'user'
INSERT OR IGNORE INTO user_roles (user_id, role, granted_by, granted_at)
VALUES (
  (SELECT id FROM users WHERE email = 'exemplo25@gmail.com'),
  'user',
  'system_seed',
  '2026-10-25T00:00:00Z'
);

-- Remove qualquer papel admin caso existisse anteriormente (separação estrita)
DELETE FROM user_roles
WHERE user_id = (SELECT id FROM users WHERE email = 'exemplo25@gmail.com')
  AND role = 'admin';

-- Garante Carteira com 50 créditos
INSERT INTO wallets (
  user_id,
  purchased_balance,
  subscription_balance,
  reserved,
  version,
  updated_at
) VALUES (
  (SELECT id FROM users WHERE email = 'exemplo25@gmail.com'),
  50,
  0,
  0,
  0,
  '2026-10-25T00:00:00Z'
)
ON CONFLICT (user_id) DO UPDATE SET
  purchased_balance = MAX(wallets.purchased_balance, 50),
  updated_at = excluded.updated_at;

-- Garante lote de créditos
INSERT OR IGNORE INTO credit_lots (
  id,
  user_id,
  bucket,
  amount_initial,
  amount_remaining,
  source_type,
  source_id,
  expires_at,
  created_at
) VALUES (
  'lot-seed-exemplo25-50',
  (SELECT id FROM users WHERE email = 'exemplo25@gmail.com'),
  'purchased',
  50,
  50,
  'admin',
  'system_test_seed',
  '2027-10-25T00:00:00Z',
  '2026-10-25T00:00:00Z'
);

-- Garante registro no extrato (credit_transactions)
INSERT OR IGNORE INTO credit_transactions (
  id,
  user_id,
  type,
  bucket,
  amount,
  lot_id,
  reference_type,
  reference_id,
  idempotency_key,
  note,
  created_by,
  created_at
) VALUES (
  'tx-seed-exemplo25-50',
  (SELECT id FROM users WHERE email = 'exemplo25@gmail.com'),
  'grant_admin',
  'purchased',
  50,
  'lot-seed-exemplo25-50',
  'system',
  'test_user_setup',
  'idemp-test-exemplo25-50',
  'Créditos iniciais da conta teste de usuário',
  'system',
  '2026-10-25T00:00:00Z'
);
