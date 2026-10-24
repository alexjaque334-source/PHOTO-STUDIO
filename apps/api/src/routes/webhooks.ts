/**
 * ALEGON AI Photo Studio — Rota de Webhooks do Asaas
 * Dono: Subagente 5 (Asaas e Billing)
 *
 * Endpoint HTTP para recepção de eventos de pagamento e assinaturas:
 * - Validação por asaas-access-token
 * - Deduplicação imediata por asaas_event_id
 * - Enfileiramento na Cloudflare Queue (alegon-asaas-webhooks)
 * - Retorno HTTP 200 rápido para cumprir SLA do Asaas
 */
import { Hono } from 'hono';
import { z } from 'zod';
import type { AppContext } from '../env';
import { DomainError } from '../contracts';
import { newId, nowIso } from '../lib/http';

const webhookApp = new Hono<AppContext>();

const webhookPayloadSchema = z.object({
  id: z.string().optional(),
  event: z.string(),
  dateCreated: z.string().optional(),
  payment: z
    .object({
      id: z.string(),
      customer: z.string().optional(),
      subscription: z.string().nullable().optional(),
      value: z.number().optional(),
      status: z.string().optional(),
      billingType: z.string().optional(),
      externalReference: z.string().nullable().optional(),
    })
    .passthrough()
    .optional(),
  subscription: z
    .object({
      id: z.string(),
      customer: z.string().optional(),
      status: z.string().optional(),
      externalReference: z.string().nullable().optional(),
    })
    .passthrough()
    .optional(),
});

webhookApp.post('/asaas', async (c) => {
  const token = c.req.header('asaas-access-token');
  const expectedToken = c.env.ASAAS_WEBHOOK_TOKEN;

  // Se o token de webhook estiver configurado no ambiente, valida estritamente
  if (expectedToken && token !== expectedToken) {
    throw new DomainError('UNAUTHORIZED_WEBHOOK', 'Cabeçalho asaas-access-token inválido.', 401);
  }

  let rawBody: unknown;
  try {
    rawBody = await c.req.json();
  } catch {
    throw new DomainError('INVALID_JSON', 'Corpo do webhook inválido.', 400);
  }

  const parsed = webhookPayloadSchema.safeParse(rawBody);
  if (!parsed.success) {
    throw new DomainError('INVALID_WEBHOOK_PAYLOAD', 'Payload de webhook mal formatado.', 422, parsed.error.issues);
  }

  const data = parsed.data;
  const paymentId = data.payment?.id ?? null;
  const subscriptionId = data.subscription?.id ?? null;

  // ID do evento Asaas (ex: evt_001928371928 ou fallback determinístico)
  const asaasEventId =
    data.id ||
    `evt_${data.event}_${paymentId || subscriptionId || 'global'}_${data.dateCreated || nowIso()}`;

  const db = c.env.DB;

  // Deduplicação imediata por asaas_event_id
  const existing = await db
    .prepare('SELECT id, status FROM asaas_webhook_events WHERE asaas_event_id = ?')
    .bind(asaasEventId)
    .first<{ id: string; status: string }>();

  if (existing) {
    return c.json({ ok: true, alreadyReceived: true }, 200);
  }

  const eventRowId = newId();
  const now = nowIso();
  const payloadString = JSON.stringify(rawBody);

  await db
    .prepare(
      `INSERT INTO asaas_webhook_events (
        id, asaas_event_id, event_type, asaas_payment_id, asaas_subscription_id,
        payload_json, status, attempts, error, received_at, processed_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'pending', 0, NULL, ?, NULL)`,
    )
    .bind(
      eventRowId,
      asaasEventId,
      data.event,
      paymentId,
      subscriptionId,
      payloadString,
      now,
    )
    .run();

  // Enfileira na fila do Cloudflare Workers
  if (c.env.WEBHOOK_QUEUE) {
    await c.env.WEBHOOK_QUEUE.send({
      type: 'asaas_webhook',
      eventRowId,
    });
  }

  return c.json({ ok: true }, 200);
});

export default webhookApp;
