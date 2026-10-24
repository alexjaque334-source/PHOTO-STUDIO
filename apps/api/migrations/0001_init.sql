-- ALEGON AI Photo Studio — migração inicial (CANÔNICA)
-- Dono: Agente Principal (Tech Lead). Alterações estruturais devem ser feitas em NOVAS migrações
-- usando a faixa numérica de cada módulo (ver docs/ARCHITECTURE.md §6).
-- Convenções: ids TEXT (UUID v7/ULID), datas TEXT ISO-8601 UTC, dinheiro em CENTAVOS (INTEGER),
-- custos de IA em micro-dólares (INTEGER, 1 USD = 1_000_000), créditos INTEGER.
-- NUNCA armazenar binários de imagem no D1 (somente chaves R2).

PRAGMA foreign_keys = ON;

-- =====================================================================
-- IDENTIDADE E ACESSO
-- =====================================================================
CREATE TABLE users (
  id                 TEXT PRIMARY KEY,
  email              TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash      TEXT NOT NULL,                 -- formato: pbkdf2-sha256$iter$saltB64$hashB64
  email_verified_at  TEXT,
  status             TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','blocked','pending_deletion','deleted')),
  blocked_reason     TEXT,
  failed_login_count INTEGER NOT NULL DEFAULT 0,
  locked_until       TEXT,
  last_login_at      TEXT,
  created_at         TEXT NOT NULL,
  updated_at         TEXT NOT NULL
);

CREATE TABLE profiles (
  user_id                  TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  full_name                TEXT,
  cpf_cnpj                 TEXT,                    -- exigido pelo Asaas apenas no checkout (minimização)
  phone                    TEXT,
  marketing_opt_in         INTEGER NOT NULL DEFAULT 0,
  accepted_terms_version   TEXT,
  accepted_terms_at        TEXT,
  accepted_privacy_version TEXT,
  accepted_privacy_at      TEXT,
  theme                    TEXT DEFAULT 'system',
  updated_at               TEXT NOT NULL
);

CREATE TABLE roles (
  name        TEXT PRIMARY KEY CHECK (name IN ('user','support','admin')),
  description TEXT
);

CREATE TABLE user_roles (
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role       TEXT NOT NULL REFERENCES roles(name),
  granted_by TEXT,
  granted_at TEXT NOT NULL,
  PRIMARY KEY (user_id, role)
);

CREATE TABLE sessions (
  id             TEXT PRIMARY KEY,                  -- SHA-256 do token opaco (o token nunca é salvo)
  user_id        TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mfa_verified   INTEGER NOT NULL DEFAULT 0,
  ip_hash        TEXT,
  user_agent     TEXT,
  created_at     TEXT NOT NULL,
  last_seen_at   TEXT NOT NULL,
  expires_at     TEXT NOT NULL,
  revoked_at     TEXT
);
CREATE INDEX idx_sessions_user ON sessions(user_id);

CREATE TABLE auth_tokens (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN ('email_verify','password_reset','mfa_pending')),
  token_hash  TEXT NOT NULL UNIQUE,
  expires_at  TEXT NOT NULL,
  used_at     TEXT,
  created_at  TEXT NOT NULL
);
CREATE INDEX idx_auth_tokens_user ON auth_tokens(user_id, type);

CREATE TABLE mfa_secrets (
  user_id              TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  secret_encrypted     TEXT NOT NULL,               -- AES-GCM com DATA_ENCRYPTION_KEY
  enabled_at           TEXT,
  recovery_codes_json  TEXT,                        -- lista de hashes SHA-256
  created_at           TEXT NOT NULL
);

CREATE TABLE email_outbox (
  id           TEXT PRIMARY KEY,
  user_id      TEXT REFERENCES users(id) ON DELETE SET NULL,
  to_email     TEXT NOT NULL,
  template     TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','failed','dev_logged')),
  attempts     INTEGER NOT NULL DEFAULT 0,
  error        TEXT,
  created_at   TEXT NOT NULL,
  sent_at      TEXT
);

-- =====================================================================
-- PROJETOS, IMAGENS E VERSÕES (arquivos ficam no R2)
-- =====================================================================
CREATE TABLE projects (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL,
  deleted_at  TEXT
);
CREATE INDEX idx_projects_user ON projects(user_id, deleted_at);

CREATE TABLE images (
  id                  TEXT PRIMARY KEY,
  user_id             TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id          TEXT REFERENCES projects(id) ON DELETE SET NULL,
  title               TEXT,
  current_version_id  TEXT,
  created_at          TEXT NOT NULL,
  expires_at          TEXT NOT NULL,                -- created_at + 90 dias
  expiry_notified_at  TEXT,
  deleted_at          TEXT,
  deletion_reason     TEXT CHECK (deletion_reason IN ('user','retention','account_deletion','admin_abuse'))
);
CREATE INDEX idx_images_user ON images(user_id, deleted_at, created_at);
CREATE INDEX idx_images_expiry ON images(expires_at, deleted_at);

CREATE TABLE image_versions (
  id                 TEXT PRIMARY KEY,
  image_id           TEXT NOT NULL REFERENCES images(id) ON DELETE CASCADE,
  user_id            TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_version_id  TEXT REFERENCES image_versions(id),
  version_number     INTEGER NOT NULL,              -- 1 = original
  kind               TEXT NOT NULL CHECK (kind IN ('original','edit')),
  r2_key             TEXT NOT NULL,                 -- u/{userId}/i/{imageId}/v/{versionId}.{ext}
  thumb_r2_key       TEXT,
  mime               TEXT NOT NULL CHECK (mime IN ('image/jpeg','image/png','image/webp')),
  width              INTEGER,
  height             INTEGER,
  size_bytes         INTEGER NOT NULL,
  sha256             TEXT,
  edit_job_id        TEXT,
  prompt_summary     TEXT,
  created_at         TEXT NOT NULL,
  expires_at         TEXT NOT NULL,                 -- created_at da versão + 90 dias
  deleted_at         TEXT,
  UNIQUE (image_id, version_number)
);
CREATE INDEX idx_versions_image ON image_versions(image_id, deleted_at);
CREATE INDEX idx_versions_expiry ON image_versions(expires_at, deleted_at);

-- =====================================================================
-- EDIÇÕES COM IA
-- =====================================================================
CREATE TABLE model_configurations (
  id             TEXT PRIMARY KEY,
  tier           TEXT NOT NULL CHECK (tier IN ('economico','padrao','premium')),
  model_id       TEXT NOT NULL,                     -- slug OpenRouter, ex.: "google/gemini-2.5-flash-image"
  display_name   TEXT NOT NULL,
  credits_cost   INTEGER NOT NULL CHECK (credits_cost > 0),
  priority       INTEGER NOT NULL DEFAULT 100,      -- menor = preferido; demais são fallback
  active         INTEGER NOT NULL DEFAULT 1,
  supports_mask  INTEGER NOT NULL DEFAULT 0,
  params_json    TEXT,
  validated_at   TEXT,                              -- preenchido somente após teste real
  notes          TEXT,
  updated_at     TEXT NOT NULL,
  updated_by     TEXT
);

CREATE TABLE edit_requests (
  id                 TEXT PRIMARY KEY,
  user_id            TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  image_id           TEXT NOT NULL REFERENCES images(id) ON DELETE CASCADE,
  source_version_id  TEXT NOT NULL REFERENCES image_versions(id),
  prompt             TEXT NOT NULL,
  tool               TEXT,
  tier               TEXT NOT NULL CHECK (tier IN ('economico','padrao','premium')),
  credits_quoted     INTEGER NOT NULL,
  status             TEXT NOT NULL DEFAULT 'quoted' CHECK (status IN ('quoted','confirmed','cancelled','expired')),
  quote_expires_at   TEXT NOT NULL,
  idempotency_key    TEXT,
  created_at         TEXT NOT NULL,
  confirmed_at       TEXT,
  UNIQUE (user_id, idempotency_key)
);

CREATE TABLE edit_jobs (
  id                 TEXT PRIMARY KEY,
  edit_request_id    TEXT NOT NULL UNIQUE REFERENCES edit_requests(id),
  user_id            TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  image_id           TEXT NOT NULL REFERENCES images(id) ON DELETE CASCADE,
  status             TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','processing','succeeded','failed','cancelled')),
  reservation_id     TEXT,
  attempts           INTEGER NOT NULL DEFAULT 0,
  model_id           TEXT,
  result_version_id  TEXT,
  error_code         TEXT,
  error_message      TEXT,
  created_at         TEXT NOT NULL,
  started_at         TEXT,
  finished_at        TEXT
);
CREATE INDEX idx_jobs_user ON edit_jobs(user_id, created_at);
CREATE INDEX idx_jobs_status ON edit_jobs(status, created_at);

CREATE TABLE openrouter_usage (
  id                 TEXT PRIMARY KEY,
  user_id            TEXT REFERENCES users(id) ON DELETE SET NULL,
  edit_job_id        TEXT,
  model_id           TEXT NOT NULL,
  provider           TEXT,
  generation_id      TEXT,
  prompt_tokens      INTEGER,
  completion_tokens  INTEGER,
  image_tokens       INTEGER,
  cost_usd_micros    INTEGER,                       -- custo reportado pelo OpenRouter (usage.cost)
  latency_ms         INTEGER,
  status             TEXT NOT NULL CHECK (status IN ('success','error','timeout','invalid_output')),
  error_code         TEXT,
  credits_consumed   INTEGER NOT NULL DEFAULT 0,
  created_at         TEXT NOT NULL
);
CREATE INDEX idx_usage_created ON openrouter_usage(created_at);
CREATE INDEX idx_usage_user ON openrouter_usage(user_id, created_at);

-- =====================================================================
-- CARTEIRA DE CRÉDITOS (ledger imutável + saldo em cache)
-- =====================================================================
CREATE TABLE wallets (
  user_id               TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  purchased_balance     INTEGER NOT NULL DEFAULT 0 CHECK (purchased_balance >= 0),
  subscription_balance  INTEGER NOT NULL DEFAULT 0 CHECK (subscription_balance >= 0),
  reserved              INTEGER NOT NULL DEFAULT 0 CHECK (reserved >= 0),
  version               INTEGER NOT NULL DEFAULT 0,  -- controle otimista
  updated_at            TEXT NOT NULL
);

CREATE TABLE credit_lots (
  id                TEXT PRIMARY KEY,
  user_id           TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bucket            TEXT NOT NULL CHECK (bucket IN ('purchased','subscription')),
  amount_initial    INTEGER NOT NULL CHECK (amount_initial > 0),
  amount_remaining  INTEGER NOT NULL CHECK (amount_remaining >= 0),
  source_type       TEXT NOT NULL,                   -- 'payment','subscription_cycle','admin','refund_compensation'
  source_id         TEXT,
  expires_at        TEXT,
  created_at        TEXT NOT NULL
);
CREATE INDEX idx_lots_user ON credit_lots(user_id, bucket, expires_at);

CREATE TABLE credit_reservations (
  id                 TEXT PRIMARY KEY,
  user_id            TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  edit_request_id    TEXT NOT NULL UNIQUE REFERENCES edit_requests(id),
  amount             INTEGER NOT NULL CHECK (amount > 0),
  allocation_json    TEXT NOT NULL,                  -- [{lotId, bucket, amount}]
  status             TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','consumed','released')),
  created_at         TEXT NOT NULL,
  expires_at         TEXT NOT NULL,
  settled_at         TEXT,
  release_reason     TEXT
);
CREATE INDEX idx_reservations_status ON credit_reservations(status, expires_at);

CREATE TABLE credit_transactions (
  id                TEXT PRIMARY KEY,
  user_id           TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type              TEXT NOT NULL CHECK (type IN ('grant_purchase','grant_subscription','grant_single_edit','grant_admin',
                                                  'reserve','release','consume','expire','refund_reversal','admin_debit')),
  bucket            TEXT CHECK (bucket IN ('purchased','subscription')),
  amount            INTEGER NOT NULL,                -- positivo = entrada, negativo = saída
  lot_id            TEXT,
  reference_type    TEXT,
  reference_id      TEXT,
  idempotency_key   TEXT UNIQUE,
  note              TEXT,
  created_by        TEXT,
  created_at        TEXT NOT NULL
);
CREATE INDEX idx_ctx_user ON credit_transactions(user_id, created_at);

-- =====================================================================
-- CATÁLOGO E ASAAS
-- =====================================================================
CREATE TABLE products (
  id                   TEXT PRIMARY KEY,
  code                 TEXT NOT NULL UNIQUE,         -- 'single_edit','pack_inicial','pack_criador','pack_profissional'
  kind                 TEXT NOT NULL CHECK (kind IN ('single_edit','credit_pack')),
  name                 TEXT NOT NULL,
  description          TEXT,
  credits              INTEGER NOT NULL CHECK (credits > 0),
  price_cents          INTEGER NOT NULL CHECK (price_cents > 0),
  credit_validity_days INTEGER,
  active               INTEGER NOT NULL DEFAULT 1,
  sort_order           INTEGER NOT NULL DEFAULT 0,
  updated_at           TEXT NOT NULL,
  updated_by           TEXT
);

CREATE TABLE plans (
  id               TEXT PRIMARY KEY,
  code             TEXT NOT NULL UNIQUE,             -- 'pessoal','pro','business'
  name             TEXT NOT NULL,
  description      TEXT,
  monthly_credits  INTEGER NOT NULL CHECK (monthly_credits > 0),
  price_cents      INTEGER NOT NULL CHECK (price_cents > 0),
  cycle            TEXT NOT NULL DEFAULT 'MONTHLY',
  active           INTEGER NOT NULL DEFAULT 1,
  sort_order       INTEGER NOT NULL DEFAULT 0,
  updated_at       TEXT NOT NULL,
  updated_by       TEXT
);

CREATE TABLE asaas_customers (
  user_id            TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  asaas_customer_id  TEXT NOT NULL UNIQUE,
  environment        TEXT NOT NULL CHECK (environment IN ('sandbox','production')),
  created_at         TEXT NOT NULL
);

CREATE TABLE subscriptions (
  id                     TEXT PRIMARY KEY,
  user_id                TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id                TEXT NOT NULL REFERENCES plans(id),
  asaas_subscription_id  TEXT UNIQUE,
  billing_type           TEXT NOT NULL CHECK (billing_type IN ('PIX','CREDIT_CARD','BOLETO','UNDEFINED')),
  status                 TEXT NOT NULL CHECK (status IN ('pending','active','overdue','cancelled','expired')),
  price_cents            INTEGER NOT NULL,
  current_period_start   TEXT,
  current_period_end     TEXT,
  cancel_at_period_end   INTEGER NOT NULL DEFAULT 0,
  created_at             TEXT NOT NULL,
  updated_at             TEXT NOT NULL,
  cancelled_at           TEXT
);
CREATE INDEX idx_subs_user ON subscriptions(user_id, status);

CREATE TABLE asaas_payments (
  id                   TEXT PRIMARY KEY,
  user_id              TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  asaas_payment_id     TEXT UNIQUE,
  external_reference   TEXT NOT NULL UNIQUE,         -- = id interno; enviado ao Asaas
  kind                 TEXT NOT NULL CHECK (kind IN ('single_edit','credit_pack','subscription')),
  product_id           TEXT REFERENCES products(id),
  subscription_id      TEXT REFERENCES subscriptions(id),
  billing_type         TEXT NOT NULL,
  value_cents          INTEGER NOT NULL,
  net_value_cents      INTEGER,
  credits              INTEGER NOT NULL,             -- créditos a conceder quando confirmado
  status               TEXT NOT NULL,                -- status Asaas (PENDING, RECEIVED, CONFIRMED, OVERDUE, REFUNDED, ...)
  due_date             TEXT,
  paid_at              TEXT,
  invoice_url          TEXT,
  credits_granted_at   TEXT,                         -- não nulo = já concedido (idempotência)
  credits_reversed_at  TEXT,
  idempotency_key      TEXT,
  created_at           TEXT NOT NULL,
  updated_at           TEXT NOT NULL,
  UNIQUE (user_id, idempotency_key)
);
CREATE INDEX idx_payments_user ON asaas_payments(user_id, created_at);
CREATE INDEX idx_payments_status ON asaas_payments(status, created_at);

CREATE TABLE asaas_webhook_events (
  id                 TEXT PRIMARY KEY,
  asaas_event_id     TEXT NOT NULL UNIQUE,           -- campo "id" do evento Asaas (idempotência)
  event_type         TEXT NOT NULL,
  asaas_payment_id   TEXT,
  asaas_subscription_id TEXT,
  payload_json       TEXT NOT NULL,
  status             TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processed','ignored','failed')),
  attempts           INTEGER NOT NULL DEFAULT 0,
  error              TEXT,
  received_at        TEXT NOT NULL,
  processed_at       TEXT
);
CREATE INDEX idx_whe_status ON asaas_webhook_events(status, received_at);

CREATE TABLE refunds (
  id                TEXT PRIMARY KEY,
  payment_id        TEXT NOT NULL REFERENCES asaas_payments(id),
  user_id           TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  value_cents       INTEGER NOT NULL,
  credits_reversed  INTEGER NOT NULL DEFAULT 0,
  status            TEXT NOT NULL CHECK (status IN ('requested','processing','done','failed')),
  reason            TEXT,
  requested_by      TEXT,
  created_at        TEXT NOT NULL,
  processed_at      TEXT
);

-- =====================================================================
-- GOVERNANÇA, LGPD E CONFIGURAÇÃO
-- =====================================================================
CREATE TABLE audit_logs (
  id              TEXT PRIMARY KEY,
  actor_user_id   TEXT,
  actor_type      TEXT NOT NULL CHECK (actor_type IN ('user','admin','system','webhook')),
  action          TEXT NOT NULL,                     -- ex.: 'auth.login','admin.credits.adjust','image.delete'
  target_type     TEXT,
  target_id       TEXT,
  ip_hash         TEXT,
  metadata_json   TEXT,                              -- NUNCA incluir senhas, tokens ou dados de cartão
  created_at      TEXT NOT NULL
);
CREATE INDEX idx_audit_created ON audit_logs(created_at);
CREATE INDEX idx_audit_actor ON audit_logs(actor_user_id, created_at);

CREATE TABLE deletion_requests (
  id             TEXT PRIMARY KEY,
  user_id        TEXT NOT NULL,
  type           TEXT NOT NULL CHECK (type IN ('account','image','all_images')),
  target_id      TEXT,
  status         TEXT NOT NULL CHECK (status IN ('pending','processing','completed','failed')),
  requested_at   TEXT NOT NULL,
  scheduled_for  TEXT NOT NULL,
  completed_at   TEXT,
  error          TEXT
);

CREATE TABLE notifications (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,                         -- 'image_expiring','edit_done','payment_confirmed',...
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  link        TEXT,
  read_at     TEXT,
  emailed_at  TEXT,
  created_at  TEXT NOT NULL
);
CREATE INDEX idx_notif_user ON notifications(user_id, read_at, created_at);

CREATE TABLE rate_limit_buckets (
  key           TEXT PRIMARY KEY,                    -- ex.: 'login:ip:{hash}', 'edit:user:{id}:day:{yyyy-mm-dd}'
  count         INTEGER NOT NULL,
  window_start  TEXT NOT NULL,
  expires_at    TEXT NOT NULL
);

CREATE TABLE system_settings (
  key          TEXT PRIMARY KEY,
  value_json   TEXT NOT NULL,
  updated_at   TEXT NOT NULL,
  updated_by   TEXT
);

INSERT INTO roles (name, description) VALUES
  ('user','Usuário comum'),
  ('support','Suporte (sem acesso a imagens privadas)'),
  ('admin','Administrador ALEGON (MFA obrigatório)');
