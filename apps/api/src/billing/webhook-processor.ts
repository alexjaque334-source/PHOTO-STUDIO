/**
 * ALEGON AI Photo Studio — Processador de Fila de Webhooks Asaas
 * Dono: Subagente 5 (Asaas e Billing)
 *
 * Processamento idempotente de eventos Asaas via Cloudflare Queues:
 * - Concessão de créditos apenas em PAYMENT_CONFIRMED ou PAYMENT_RECEIVED
 * - Estorno seguro em PAYMENT_REFUNDED
 * - Gerenciamento de ciclos de assinatura
 * - Notificação ao usuário
 */
import type { Env } from '../env';
import type { WebhookMessage } from '../contracts';
import { createWalletService } from '../wallet';
import { newId, nowIso, addDays } from '../lib/http';

interface WebhookEventRow {
  id: string;
  asaas_event_id: string;
  event_type: string;
  asaas_payment_id: string | null;
  asaas_subscription_id: string | null;
  payload_json: string;
  status: 'pending' | 'processed' | 'ignored' | 'failed';
  attempts: number;
}

interface PaymentDbRow {
  id: string;
  user_id: string;
  asaas_payment_id: string | null;
  kind: 'single_edit' | 'credit_pack' | 'subscription';
  product_id: string | null;
  subscription_id: string | null;
  value_cents: number;
  credits: number;
  status: string;
  credits_granted_at: string | null;
  credits_reversed_at: string | null;
}

interface ProductValidityRow {
  credit_validity_days: number | null;
}

interface SubscriptionDbRow {
  id: string;
  user_id: string;
  plan_id: string;
  status: string;
  monthly_credits: number;
}

export async function handleWebhookQueue(
  batch: MessageBatch<WebhookMessage>,
  env: Env,
  ctx?: ExecutionContext,
): Promise<void> {
  const db = env.DB;
  const walletService = createWalletService(env);

  for (const message of batch.messages) {
    const { eventRowId } = message.body;

    const eventRow = await db
      .prepare(
        'SELECT id, asaas_event_id, event_type, asaas_payment_id, asaas_subscription_id, payload_json, status, attempts FROM asaas_webhook_events WHERE id = ?',
      )
      .bind(eventRowId)
      .first<WebhookEventRow>();

    if (!eventRow) {
      message.ack();
      continue;
    }

    if (eventRow.status === 'processed' || eventRow.status === 'ignored') {
      message.ack();
      continue;
    }

    try {
      const payload = JSON.parse(eventRow.payload_json);
      const eventType = payload.event || eventRow.event_type;
      const paymentData = payload.payment;
      const subscriptionData = payload.subscription;
      const now = nowIso();

      if (eventType === 'PAYMENT_RECEIVED' || eventType === 'PAYMENT_CONFIRMED') {
        if (!paymentData || !paymentData.id) {
          await markEvent(db, eventRow.id, 'ignored', 'Payload sem objeto payment válido.');
          message.ack();
          continue;
        }

        // Localiza pagamento pelo asaas_payment_id ou external_reference
        let payment = await db
          .prepare(
            'SELECT id, user_id, asaas_payment_id, kind, product_id, subscription_id, value_cents, credits, status, credits_granted_at, credits_reversed_at FROM asaas_payments WHERE asaas_payment_id = ? OR external_reference = ?',
          )
          .bind(paymentData.id, paymentData.externalReference ?? '')
          .first<PaymentDbRow>();

        // Se for fatura recorrente de assinatura que ainda não estava mapeada
        if (!payment && paymentData.subscription) {
          const sub = await db
            .prepare(
              `SELECT s.id, s.user_id, s.plan_id, s.status, p.monthly_credits 
               FROM subscriptions s 
               JOIN plans p ON p.id = s.plan_id 
               WHERE s.asaas_subscription_id = ?`,
            )
            .bind(paymentData.subscription)
            .first<SubscriptionDbRow>();

          if (sub) {
            const newPaymentId = `pay_${newId()}`;
            await db
              .prepare(
                `INSERT INTO asaas_payments (
                  id, user_id, asaas_payment_id, external_reference, kind, product_id, subscription_id,
                  billing_type, value_cents, net_value_cents, credits, status, due_date, paid_at,
                  invoice_url, credits_granted_at, credits_reversed_at, idempotency_key, created_at, updated_at
                ) VALUES (?, ?, ?, ?, 'subscription', NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, ?, ?, ?)`,
              )
              .bind(
                newPaymentId,
                sub.user_id,
                paymentData.id,
                newPaymentId,
                sub.id,
                paymentData.billingType || 'CREDIT_CARD',
                Math.round((paymentData.value || 0) * 100),
                paymentData.netValue ? Math.round(paymentData.netValue * 100) : null,
                sub.monthly_credits,
                paymentData.status,
                paymentData.dueDate || now.slice(0, 10),
                now,
                paymentData.invoiceUrl || null,
                `sub_renewal:${paymentData.id}`,
                now,
                now,
              )
              .run();

            payment = await db
              .prepare(
                'SELECT id, user_id, asaas_payment_id, kind, product_id, subscription_id, value_cents, credits, status, credits_granted_at, credits_reversed_at FROM asaas_payments WHERE id = ?',
              )
              .bind(newPaymentId)
              .first<PaymentDbRow>();
          }
        }

        if (!payment) {
          console.warn(`[Asaas Webhook] Cobrança não encontrada no banco: ${paymentData.id}`);
          await markEvent(db, eventRow.id, 'ignored', 'Cobrança não encontrada no banco.');
          message.ack();
          continue;
        }

        // Verifica se os créditos já foram concedidos (Idempotência Estrita)
        if (payment.credits_granted_at) {
          await db
            .prepare(
              'UPDATE asaas_payments SET status = ?, paid_at = COALESCE(paid_at, ?), updated_at = ? WHERE id = ?',
            )
            .bind(paymentData.status, now, now, payment.id)
            .run();

          await markEvent(db, eventRow.id, 'processed');
          message.ack();
          continue;
        }

        // 1. Concede créditos de acordo com o tipo
        if (payment.kind === 'single_edit') {
          const validityDays = 30; // Edição avulsa válida por 30 dias
          const expiresAt = addDays(now, validityDays);
          await walletService.grant({
            userId: payment.user_id,
            bucket: 'purchased',
            amount: payment.credits,
            type: 'grant_single_edit',
            sourceType: 'payment',
            sourceId: payment.id,
            expiresAt,
            idempotencyKey: `grant:payment:${payment.id}`,
            note: 'Edição avulsa (validade 30 dias)',
          });
        } else if (payment.kind === 'credit_pack') {
          let validityDays = 365;
          if (payment.product_id) {
            const prod = await db
              .prepare('SELECT credit_validity_days FROM products WHERE id = ?')
              .bind(payment.product_id)
              .first<ProductValidityRow>();
            if (prod?.credit_validity_days) {
              validityDays = prod.credit_validity_days;
            }
          }
          const expiresAt = addDays(now, validityDays);
          await walletService.grant({
            userId: payment.user_id,
            bucket: 'purchased',
            amount: payment.credits,
            type: 'grant_purchase',
            sourceType: 'payment',
            sourceId: payment.id,
            expiresAt,
            idempotencyKey: `grant:payment:${payment.id}`,
            note: `Pacote de créditos (validade ${validityDays} dias)`,
          });
        } else if (payment.kind === 'subscription') {
          const periodEnd = addDays(now, 30);
          if (payment.subscription_id) {
            await db
              .prepare(
                `UPDATE subscriptions 
                 SET status = 'active', current_period_start = ?, current_period_end = ?, updated_at = ? 
                 WHERE id = ?`,
              )
              .bind(now, periodEnd, now, payment.subscription_id)
              .run();
          }
          await walletService.grant({
            userId: payment.user_id,
            bucket: 'subscription',
            amount: payment.credits,
            type: 'grant_subscription',
            sourceType: 'subscription_cycle',
            sourceId: payment.id,
            expiresAt: periodEnd,
            idempotencyKey: `grant:sub_cycle:${payment.id}`,
            note: `Assinatura mensal (ciclo até ${periodEnd.slice(0, 10)})`,
          });
        }

        // 2. Atualiza pagamento como quitado e créditos concedidos
        await db
          .prepare(
            `UPDATE asaas_payments 
             SET status = ?, paid_at = COALESCE(paid_at, ?), credits_granted_at = ?, updated_at = ? 
             WHERE id = ?`,
          )
          .bind(paymentData.status, now, now, now, payment.id)
          .run();

        // 3. Emite notificação in-app
        await db
          .prepare(
            `INSERT INTO notifications (id, user_id, type, title, body, link, read_at, emailed_at, created_at)
             VALUES (?, ?, 'payment_confirmed', 'Pagamento Confirmado!', ?, '/wallet', NULL, NULL, ?)`,
          )
          .bind(
            newId(),
            payment.user_id,
            `Seu pagamento de R$ ${(payment.value_cents / 100).toFixed(2).replace('.', ',')} foi confirmado. ${payment.credits} créditos foram adicionados à sua carteira.`,
            now,
          )
          .run();
      } else if (eventType === 'PAYMENT_REFUNDED') {
        if (paymentData && paymentData.id) {
          const payment = await db
            .prepare(
              'SELECT id, user_id, value_cents, credits, credits_granted_at, credits_reversed_at FROM asaas_payments WHERE asaas_payment_id = ? OR external_reference = ?',
            )
            .bind(paymentData.id, paymentData.externalReference ?? '')
            .first<PaymentDbRow>();

          if (payment) {
            // Estorna créditos se concedidos e ainda não estornados
            let debited = 0;
            if (payment.credits_granted_at && !payment.credits_reversed_at) {
              const debitRes = await walletService.debit({
                userId: payment.user_id,
                amount: payment.credits,
                type: 'refund_reversal',
                referenceId: payment.id,
                idempotencyKey: `refund:${payment.id}`,
                note: `Estorno de créditos por reembolso do pagamento ${payment.id}`,
              });
              debited = debitRes.debited;

              await db
                .prepare('UPDATE asaas_payments SET credits_reversed_at = ?, updated_at = ? WHERE id = ?')
                .bind(now, now, payment.id)
                .run();
            }

            await db
              .prepare('UPDATE asaas_payments SET status = ?, updated_at = ? WHERE id = ?')
              .bind(paymentData.status, now, payment.id)
              .run();

            // Registra em refunds
            const refundId = `ref_${newId()}`;
            await db
              .prepare(
                `INSERT INTO refunds (id, payment_id, user_id, value_cents, credits_reversed, status, reason, requested_by, created_at, processed_at)
                 VALUES (?, ?, ?, ?, ?, 'done', 'Webhook Asaas PAYMENT_REFUNDED', 'asaas_webhook', ?, ?)`,
              )
              .bind(
                refundId,
                payment.id,
                payment.user_id,
                payment.value_cents,
                debited,
                now,
                now,
              )
              .run();
          }
        }
      } else if (eventType === 'SUBSCRIPTION_DELETED') {
        if (subscriptionData && subscriptionData.id) {
          await db
            .prepare(
              `UPDATE subscriptions 
               SET status = 'cancelled', cancelled_at = ?, updated_at = ? 
               WHERE asaas_subscription_id = ?`,
            )
            .bind(now, now, subscriptionData.id)
            .run();
        }
      } else if (eventType === 'PAYMENT_OVERDUE') {
        if (paymentData && paymentData.id) {
          await db
            .prepare('UPDATE asaas_payments SET status = ?, updated_at = ? WHERE asaas_payment_id = ?')
            .bind(paymentData.status, now, paymentData.id)
            .run();
        }
      }

      await markEvent(db, eventRow.id, 'processed');
      message.ack();
    } catch (err: unknown) {
      console.error(`Erro ao processar webhook ${eventRow.id}:`, err);
      const attempts = (eventRow.attempts ?? 0) + 1;
      await db
        .prepare(
          `UPDATE asaas_webhook_events 
           SET attempts = ?, error = ?, updated_at = ? 
           WHERE id = ?`,
        )
        .bind(attempts, (err as Error).message, nowIso(), eventRow.id)
        .run();

      if (attempts >= 5) {
        await markEvent(db, eventRow.id, 'failed', (err as Error).message);
        message.ack(); // Não deixa a fila travar indefinidamente após 5 retries
      } else {
        message.retry();
      }
    }
  }
}

async function markEvent(
  db: D1Database,
  id: string,
  status: 'processed' | 'ignored' | 'failed',
  error?: string,
): Promise<void> {
  await db
    .prepare(
      'UPDATE asaas_webhook_events SET status = ?, error = ?, processed_at = ? WHERE id = ?',
    )
    .bind(status, error ?? null, nowIso(), id)
    .run();
}
