-- Migração 0010: Configurações padrão do sistema e limites operacionais (Dono: Backend Engineer)
-- Tabela system_settings populada com valores default seguros para produção e desenvolvimento.

INSERT OR IGNORE INTO system_settings (key, value_json, updated_at, updated_by) VALUES
  ('limits.edits_per_user_per_day', '50', datetime('now'), 'system'),
  ('limits.concurrent_jobs_per_user', '2', datetime('now'), 'system'),
  ('limits.uploads_per_user_per_day', '100', datetime('now'), 'system'),
  ('limits.global_daily_ai_budget_usd', '20', datetime('now'), 'system'),
  ('limits.max_prompt_chars', '2000', datetime('now'), 'system'),
  ('retention.days', '90', datetime('now'), 'system'),
  ('retention.warning_days', '[7, 1]', datetime('now'), 'system'),
  ('legal.terms_version', '"v1.0"', datetime('now'), 'system'),
  ('legal.privacy_version', '"v1.0"', datetime('now'), 'system'),
  ('storage.max_upload_size_bytes', '15728640', datetime('now'), 'system'),
  ('auth.max_failed_logins', '5', datetime('now'), 'system'),
  ('auth.lockout_minutes', '15', datetime('now'), 'system');
