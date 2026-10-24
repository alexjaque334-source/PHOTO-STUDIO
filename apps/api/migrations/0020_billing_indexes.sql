-- =====================================================================
-- ALEGON AI Photo Studio — Migração 0020 (Billing & Carteira de Créditos)
-- Dono: Subagente 5 (Asaas e Billing)
-- Índices complementares de alta performance para conciliação e idempotência
-- =====================================================================

CREATE INDEX IF NOT EXISTS idx_payments_sub ON asaas_payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payments_asaas_id ON asaas_payments(asaas_payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_ext_ref ON asaas_payments(external_reference);

CREATE INDEX IF NOT EXISTS idx_whe_payment ON asaas_webhook_events(asaas_payment_id);
CREATE INDEX IF NOT EXISTS idx_whe_subscription ON asaas_webhook_events(asaas_subscription_id);

CREATE INDEX IF NOT EXISTS idx_credit_lots_active ON credit_lots(user_id, bucket, amount_remaining, expires_at);
CREATE INDEX IF NOT EXISTS idx_credit_lots_source ON credit_lots(source_type, source_id);

CREATE INDEX IF NOT EXISTS idx_reservations_edit_req ON credit_reservations(edit_request_id);
CREATE INDEX IF NOT EXISTS idx_reservations_user_active ON credit_reservations(user_id, status, expires_at);

CREATE INDEX IF NOT EXISTS idx_ctx_idempotency ON credit_transactions(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_ctx_user_lot ON credit_transactions(user_id, lot_id);

CREATE INDEX IF NOT EXISTS idx_refunds_payment ON refunds(payment_id);
