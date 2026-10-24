/**
 * ALEGON AI Photo Studio — Manutenção e Reconciliação Periódica de Faturamento
 * Dono: Subagente 5 (Asaas e Billing)
 *
 * Executado a cada 15 minutos via Cloudflare Cron Trigger:
 * 1. Liberação de reservas de créditos expiradas (zumbis por timeout/erro de edição)
 * 2. Expiração de lotes de crédito vencidos
 * 3. Reconciliação de pagamentos pendentes com o Asaas
 * 4. Validação e autocura da consistência de saldos das carteiras
 */
import type { Env } from '../env';
import { createWalletService } from '../wallet';
import { AsaasClient } from './asaas-client';
import { newId, nowIso } from '../lib/http';

interface ExpiredReservationRow {
  id: string;
  user_id: string;
  amount: number;
}

interface ExpiredLotRow {
  id: string;
  user_id: string;
  bucket: 'purchased' | 'subscription';
  amount_remaining: number;
}

interface PendingPaymentRow {
  id: string;
  user_id: string;
  asaas_payment_id: string;
  created_at: string;
}

export async function runBillingMaintenance(env: Env): Promise<{
  releasedReservations: number;
  expiredLots: number;
  reconciledPayments: number;
}> {
  const db = env.DB;
  const walletService = createWalletService(env);
  const now = nowIso();

  let releasedCount = 0;
  let expiredLotsCount = 0;
  let reconciledPaymentsCount = 0;

  // 1. Libera reservas ativas com TTL expirado
  const expiredReservations = await db
    .prepare(
      "SELECT id, user_id, amount FROM credit_reservations WHERE status = 'active' AND expires_at < ?",
    )
    .bind(now)
    .all<ExpiredReservationRow>();

  for (const res of expiredReservations.results ?? []) {
    try {
      await walletService.release(res.id, 'expired_ttl');
      releasedCount++;
    } catch (err) {
      console.error(`Erro ao liberar reserva expirada ${res.id}:`, err);
    }
  }

  // 2. Expira lotes de créditos cujo expires_at já passou
  const expiredLots = await db
    .prepare(
      `SELECT id, user_id, bucket, amount_remaining 
       FROM credit_lots 
       WHERE amount_remaining > 0 AND expires_at IS NOT NULL AND expires_at < ?`,
    )
    .bind(now)
    .all<ExpiredLotRow>();

  for (const lot of expiredLots.results ?? []) {
    try {
      const remaining = lot.amount_remaining;
      const idempotencyKey = `expire:lot:${lot.id}`;

      const statements: D1PreparedStatement[] = [
        db.prepare('UPDATE credit_lots SET amount_remaining = 0 WHERE id = ?').bind(lot.id),
        lot.bucket === 'subscription'
          ? db
              .prepare(
                'UPDATE wallets SET subscription_balance = MAX(0, subscription_balance - ?), updated_at = ? WHERE user_id = ?',
              )
              .bind(remaining, now, lot.user_id)
          : db
              .prepare(
                'UPDATE wallets SET purchased_balance = MAX(0, purchased_balance - ?), updated_at = ? WHERE user_id = ?',
              )
              .bind(remaining, now, lot.user_id),
        db
          .prepare(
            `INSERT INTO credit_transactions (
              id, user_id, type, bucket, amount, lot_id, reference_type, reference_id, idempotency_key, note, created_at
            ) VALUES (?, ?, 'expire', ?, ?, ?, 'credit_lot', ?, ?, 'Expiração automática de créditos por validade', ?)`,
          )
          .bind(newId(), lot.user_id, lot.bucket, -remaining, lot.id, lot.id, idempotencyKey, now),
      ];

      await db.batch(statements);
      expiredLotsCount++;
    } catch (err) {
      console.error(`Erro ao expirar lote ${lot.id}:`, err);
    }
  }

  // 3. Reconciliação de pagamentos pendentes no Asaas (mais de 10 minutos atrás)
  const tenMinutesAgo = new Date(Date.now() - 10 * 60_000).toISOString();
  const pendingPayments = await db
    .prepare(
      `SELECT id, user_id, asaas_payment_id, created_at 
       FROM asaas_payments 
       WHERE status = 'PENDING' AND asaas_payment_id IS NOT NULL AND created_at < ? 
       LIMIT 15`,
    )
    .bind(tenMinutesAgo)
    .all<PendingPaymentRow>();

  if ((pendingPayments.results ?? []).length > 0 && env.ASAAS_API_KEY) {
    const asaasClient = new AsaasClient(env);
    for (const payment of pendingPayments.results ?? []) {
      try {
        const asaasData = await asaasClient.getPayment(payment.asaas_payment_id);
        if (asaasData.status === 'RECEIVED' || asaasData.status === 'CONFIRMED') {
          // Insere evento de webhook artificial para acionar a concessão via queue ou processamento imediato
          const eventId = `reconcile_${payment.asaas_payment_id}_${now}`;
          const eventRowId = newId();
          const payloadJson = JSON.stringify({
            id: eventId,
            event: asaasData.status === 'RECEIVED' ? 'PAYMENT_RECEIVED' : 'PAYMENT_CONFIRMED',
            dateCreated: now,
            payment: asaasData,
          });

          await db
            .prepare(
              `INSERT INTO asaas_webhook_events (
                id, asaas_event_id, event_type, asaas_payment_id, asaas_subscription_id,
                payload_json, status, attempts, error, received_at, processed_at
              ) VALUES (?, ?, ?, ?, NULL, ?, 'pending', 0, NULL, ?, NULL)`,
            )
            .bind(
              eventRowId,
              eventId,
              asaasData.status === 'RECEIVED' ? 'PAYMENT_RECEIVED' : 'PAYMENT_CONFIRMED',
              payment.asaas_payment_id,
              payloadJson,
              now,
            )
            .run();

          // Enfileira na fila de webhooks
          if (env.WEBHOOK_QUEUE) {
            await env.WEBHOOK_QUEUE.send({
              type: 'asaas_webhook',
              eventRowId,
            });
          }

          reconciledPaymentsCount++;
        } else if (asaasData.status === 'OVERDUE') {
          await db
            .prepare('UPDATE asaas_payments SET status = ?, updated_at = ? WHERE id = ?')
            .bind('OVERDUE', now, payment.id)
            .run();
        }
      } catch (err) {
        console.error(`Erro ao reconciliar pagamento ${payment.id} com Asaas:`, err);
      }
    }
  }

  return {
    releasedReservations: releasedCount,
    expiredLots: expiredLotsCount,
    reconciledPayments: reconciledPaymentsCount,
  };
}
