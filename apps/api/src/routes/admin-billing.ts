/**
 * ALEGON AI Photo Studio — Rotas Administrativas de Cobrança e Finanças
 * Dono: Subagente 5 (Asaas e Billing)
 *
 * Painel administrativo financeiro (exige role 'admin' e sessão 'mfa_verified'):
 * - Gestão de Catálogo de Produtos e Planos de Assinatura
 * - Visão Geral de Cobranças e Assinaturas
 * - Emissão de Reembolsos e Estorno de Créditos
 * - Monitoramento e Reprocessamento de Eventos de Webhook
 * - Relatórios de Conciliação e Resumo Financeiro
 */
import { Hono } from 'hono';
import { z } from 'zod';
import type { AppContext } from '../env';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { DomainError } from '../contracts';
import { newId, nowIso, parseJson } from '../lib/http';
import { AsaasClient } from '../billing/asaas-client';
import { createWalletService } from '../wallet';
import { audit } from '../security/audit';
import { paginate } from '../db';

const adminBillingApp = new Hono<AppContext>();

// Proteção global: exige autenticação com perfil admin e MFA validado
adminBillingApp.use('*', requireAuth(), requireAdmin());

// ───────────────────────────── Gestão de Produtos ─────────────────────────────
adminBillingApp.get('/products', async (c) => {
  const db = c.env.DB;
  const products = await db
    .prepare('SELECT * FROM products ORDER BY sort_order ASC, price_cents ASC')
    .all();

  return c.json({ items: products.results ?? [] });
});

const updateProductSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  priceCents: z.number().int().positive().optional(),
  credits: z.number().int().positive().optional(),
  creditValidityDays: z.number().int().positive().nullable().optional(),
  active: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

adminBillingApp.put('/products/:id', async (c) => {
  const admin = c.get('user');
  const productId = c.req.param('id');
  const body = await parseJson(c, updateProductSchema);
  const db = c.env.DB;

  const current = await db
    .prepare('SELECT id, code, name, price_cents, credits FROM products WHERE id = ?')
    .bind(productId)
    .first();

  if (!current) {
    throw new DomainError('PRODUCT_NOT_FOUND', 'Produto não encontrado.', 404);
  }

  const now = nowIso();

  await db
    .prepare(
      `UPDATE products 
       SET name = COALESCE(?, name),
           description = COALESCE(?, description),
           price_cents = COALESCE(?, price_cents),
           credits = COALESCE(?, credits),
           credit_validity_days = COALESCE(?, credit_validity_days),
           active = COALESCE(?, active),
           sort_order = COALESCE(?, sort_order),
           updated_at = ?,
           updated_by = ? 
       WHERE id = ?`,
    )
    .bind(
      body.name ?? null,
      body.description ?? null,
      body.priceCents ?? null,
      body.credits ?? null,
      body.creditValidityDays !== undefined ? body.creditValidityDays : null,
      body.active !== undefined ? (body.active ? 1 : 0) : null,
      body.sortOrder ?? null,
      now,
      admin.id,
      productId,
    )
    .run();

  await audit(c.env, {
    actorUserId: admin.id,
    actorType: 'admin',
    action: 'admin.products.update',
    targetType: 'product',
    targetId: productId,
    metadata: { changes: body },
  });

  return c.json({ ok: true, id: productId });
});

// ───────────────────────────── Gestão de Planos ─────────────────────────────
adminBillingApp.get('/plans', async (c) => {
  const db = c.env.DB;
  const plans = await db
    .prepare('SELECT * FROM plans ORDER BY sort_order ASC, price_cents ASC')
    .all();

  return c.json({ items: plans.results ?? [] });
});

const updatePlanSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  priceCents: z.number().int().positive().optional(),
  monthlyCredits: z.number().int().positive().optional(),
  active: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

adminBillingApp.put('/plans/:id', async (c) => {
  const admin = c.get('user');
  const planId = c.req.param('id');
  const body = await parseJson(c, updatePlanSchema);
  const db = c.env.DB;

  const current = await db
    .prepare('SELECT id, code FROM plans WHERE id = ?')
    .bind(planId)
    .first();

  if (!current) {
    throw new DomainError('PLAN_NOT_FOUND', 'Plano não encontrado.', 404);
  }

  const now = nowIso();

  await db
    .prepare(
      `UPDATE plans 
       SET name = COALESCE(?, name),
           description = COALESCE(?, description),
           price_cents = COALESCE(?, price_cents),
           monthly_credits = COALESCE(?, monthly_credits),
           active = COALESCE(?, active),
           sort_order = COALESCE(?, sort_order),
           updated_at = ?,
           updated_by = ? 
       WHERE id = ?`,
    )
    .bind(
      body.name ?? null,
      body.description ?? null,
      body.priceCents ?? null,
      body.monthlyCredits ?? null,
      body.active !== undefined ? (body.active ? 1 : 0) : null,
      body.sortOrder ?? null,
      now,
      admin.id,
      planId,
    )
    .run();

  await audit(c.env, {
    actorUserId: admin.id,
    actorType: 'admin',
    action: 'admin.plans.update',
    targetType: 'plan',
    targetId: planId,
    metadata: { changes: body },
  });

  return c.json({ ok: true, id: planId });
});

const createPlanSchema = z.object({
  code: z.string().min(2).max(50),
  name: z.string().min(2).max(100),
  description: z.string().optional(),
  priceCents: z.number().int().positive(),
  monthlyCredits: z.number().int().positive(),
  active: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

adminBillingApp.post('/plans', async (c) => {
  const admin = c.get('user');
  const body = await parseJson(c, createPlanSchema);
  const db = c.env.DB;

  const planId = newId();
  const now = nowIso();
  const cleanCode = body.code.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '_');

  await db
    .prepare(
      `INSERT INTO plans (id, code, name, description, monthly_credits, price_cents, cycle, active, sort_order, updated_at, updated_by)
       VALUES (?, ?, ?, ?, ?, ?, 'MONTHLY', ?, ?, ?, ?)`,
    )
    .bind(
      planId,
      cleanCode,
      body.name.trim(),
      body.description?.trim() ?? null,
      body.monthlyCredits,
      body.priceCents,
      body.active ? 1 : 0,
      body.sortOrder,
      now,
      admin.id,
    )
    .run();

  await audit(c.env, {
    actorUserId: admin.id,
    actorType: 'admin',
    action: 'admin.plans.create',
    targetType: 'plan',
    targetId: planId,
    metadata: { code: cleanCode, name: body.name },
  });

  return c.json({
    ok: true,
    plan: {
      id: planId,
      code: cleanCode,
      name: body.name.trim(),
      description: body.description?.trim() ?? null,
      monthly_credits: body.monthlyCredits,
      price_cents: body.priceCents,
      cycle: 'MONTHLY',
      active: body.active ? 1 : 0,
      sort_order: body.sortOrder,
      updated_at: now,
      updated_by: admin.id,
    },
  }, 201);
});

adminBillingApp.delete('/plans/:id', async (c) => {
  const admin = c.get('user');
  const planId = c.req.param('id');
  const db = c.env.DB;

  const current = await db
    .prepare('SELECT id, code, name FROM plans WHERE id = ?')
    .bind(planId)
    .first<{ id: string; code: string; name: string }>();

  if (!current) {
    throw new DomainError('PLAN_NOT_FOUND', 'Plano não encontrado.', 404);
  }

  await db.prepare('DELETE FROM plans WHERE id = ?').bind(planId).run();

  await audit(c.env, {
    actorUserId: admin.id,
    actorType: 'admin',
    action: 'admin.plans.delete',
    targetType: 'plan',
    targetId: planId,
    metadata: { code: current.code, name: current.name },
  });

  return c.json({ ok: true, id: planId, message: 'Plano excluído com sucesso.' });
});

// ───────────────────────────── Listagem Geral de Pagamentos ─────────────────────────────
adminBillingApp.get('/payments', async (c) => {
  const cursor = c.req.query('cursor') ?? null;
  const status = c.req.query('status') ?? null;
  const userId = c.req.query('userId') ?? null;
  const limitParam = parseInt(c.req.query('limit') || '20', 10);

  const conditions: string[] = ['1=1'];
  const params: unknown[] = [];

  if (status) {
    conditions.push('status = ?');
    params.push(status);
  }
  if (userId) {
    conditions.push('user_id = ?');
    params.push(userId);
  }

  const result = await paginate(c.env.DB, {
    table: 'asaas_payments',
    select: '*',
    whereClause: conditions.join(' AND '),
    params,
    sortColumn: 'created_at',
    order: 'DESC',
    cursor,
    limit: limitParam,
  });

  return c.json(result);
});

// ───────────────────────────── Listagem de Assinaturas ─────────────────────────────
adminBillingApp.get('/subscriptions', async (c) => {
  const cursor = c.req.query('cursor') ?? null;
  const status = c.req.query('status') ?? null;
  const limitParam = parseInt(c.req.query('limit') || '20', 10);

  const conditions: string[] = ['1=1'];
  const params: unknown[] = [];

  if (status) {
    conditions.push('status = ?');
    params.push(status);
  }

  const result = await paginate(c.env.DB, {
    table: 'subscriptions',
    select: '*',
    whereClause: conditions.join(' AND '),
    params,
    sortColumn: 'created_at',
    order: 'DESC',
    cursor,
    limit: limitParam,
  });

  return c.json(result);
});

// ───────────────────────────── Emissão de Reembolso Administrativo ─────────────────────────────
const refundSchema = z.object({
  reason: z.string().min(3, 'Motivo do reembolso é obrigatório'),
});

adminBillingApp.post('/payments/:id/refund', async (c) => {
  const admin = c.get('user');
  const paymentId = c.req.param('id');
  const body = await parseJson(c, refundSchema);
  const db = c.env.DB;

  const payment = await db
    .prepare(
      `SELECT id, user_id, asaas_payment_id, value_cents, credits, status, credits_granted_at, credits_reversed_at 
       FROM asaas_payments 
       WHERE id = ?`,
    )
    .bind(paymentId)
    .first<{
      id: string;
      user_id: string;
      asaas_payment_id: string | null;
      value_cents: number;
      credits: number;
      status: string;
      credits_granted_at: string | null;
      credits_reversed_at: string | null;
    }>();

  if (!payment) {
    throw new DomainError('PAYMENT_NOT_FOUND', 'Cobrança não encontrada.', 404);
  }

  if (payment.status === 'REFUNDED') {
    throw new DomainError('ALREADY_REFUNDED', 'Esta cobrança já foi reembolsada.', 409);
  }

  // Se tiver ID do Asaas, processa o reembolso no gateway
  if (payment.asaas_payment_id && c.env.ASAAS_API_KEY) {
    const client = new AsaasClient(c.env);
    await client.refundPayment(payment.asaas_payment_id, {
      description: body.reason,
    });
  }

  const now = nowIso();
  const walletService = createWalletService(c.env);

  // Estorna os créditos ainda disponíveis
  let debited = 0;
  if (payment.credits_granted_at && !payment.credits_reversed_at) {
    const debitRes = await walletService.debit({
      userId: payment.user_id,
      amount: payment.credits,
      type: 'refund_reversal',
      referenceId: payment.id,
      idempotencyKey: `admin_refund:${payment.id}`,
      createdBy: admin.id,
      note: `Reembolso administrativo: ${body.reason}`,
    });
    debited = debitRes.debited;
  }

  // Atualiza pagamento
  await db
    .prepare(
      "UPDATE asaas_payments SET status = 'REFUNDED', credits_reversed_at = ?, updated_at = ? WHERE id = ?",
    )
    .bind(now, now, payment.id)
    .run();

  // Registra em refunds
  const refundId = `ref_${newId()}`;
  await db
    .prepare(
      `INSERT INTO refunds (
        id, payment_id, user_id, value_cents, credits_reversed, status, reason, requested_by, created_at, processed_at
      ) VALUES (?, ?, ?, ?, ?, 'done', ?, ?, ?, ?)`,
    )
    .bind(
      refundId,
      payment.id,
      payment.user_id,
      payment.value_cents,
      debited,
      body.reason,
      admin.id,
      now,
      now,
    )
    .run();

  await audit(c.env, {
    actorUserId: admin.id,
    actorType: 'admin',
    action: 'admin.payments.refund',
    targetType: 'payment',
    targetId: payment.id,
    metadata: {
      valueCents: payment.value_cents,
      creditsReversed: debited,
      reason: body.reason,
    },
  });

  return c.json({
    ok: true,
    refundId,
    creditsReversed: debited,
    status: 'REFUNDED',
  });
});

// ───────────────────────────── Webhook Events e Reprocessamento ─────────────────────────────
adminBillingApp.get('/webhook-events', async (c) => {
  const cursor = c.req.query('cursor') ?? null;
  const status = c.req.query('status') ?? null;
  const limitParam = parseInt(c.req.query('limit') || '20', 10);

  const conditions: string[] = ['1=1'];
  const params: unknown[] = [];

  if (status) {
    conditions.push('status = ?');
    params.push(status);
  }

  const result = await paginate(c.env.DB, {
    table: 'asaas_webhook_events',
    select: 'id, asaas_event_id, event_type, asaas_payment_id, status, attempts, error, received_at, processed_at',
    whereClause: conditions.join(' AND '),
    params,
    sortColumn: 'received_at',
    order: 'DESC',
    cursor,
    limit: limitParam,
  });

  return c.json(result);
});

adminBillingApp.post('/webhook-events/:id/reprocess', async (c) => {
  const admin = c.get('user');
  const eventId = c.req.param('id');
  const db = c.env.DB;

  const event = await db
    .prepare('SELECT id, status FROM asaas_webhook_events WHERE id = ?')
    .bind(eventId)
    .first<{ id: string; status: string }>();

  if (!event) {
    throw new DomainError('EVENT_NOT_FOUND', 'Evento de webhook não encontrado.', 404);
  }

  // Reseta para pending e re-enfileira
  await db
    .prepare(
      "UPDATE asaas_webhook_events SET status = 'pending', error = NULL, processed_at = NULL WHERE id = ?",
    )
    .bind(eventId)
    .run();

  if (c.env.WEBHOOK_QUEUE) {
    await c.env.WEBHOOK_QUEUE.send({
      type: 'asaas_webhook',
      eventRowId: eventId,
    });
  }

  await audit(c.env, {
    actorUserId: admin.id,
    actorType: 'admin',
    action: 'admin.webhooks.reprocess',
    targetType: 'webhook_event',
    targetId: eventId,
  });

  return c.json({ ok: true, id: eventId, status: 'enqueued' });
});

// ───────────────────────────── Conciliação e Resumo Financeiro ─────────────────────────────
adminBillingApp.get('/reconciliation', async (c) => {
  const db = c.env.DB;
  const date = c.req.query('date') || nowIso().slice(0, 10);

  const [confirmedPayments, grantedCredits, reversedCredits] = await Promise.all([
    db
      .prepare(
        `SELECT COUNT(*) as count, COALESCE(SUM(value_cents), 0) as total_value_cents, COALESCE(SUM(net_value_cents), 0) as total_net_cents 
         FROM asaas_payments 
         WHERE status IN ('RECEIVED', 'CONFIRMED') AND (paid_at LIKE ? OR created_at LIKE ?)`,
      )
      .bind(`${date}%`, `${date}%`)
      .first<{ count: number; total_value_cents: number; total_net_cents: number }>(),
    db
      .prepare(
        `SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total_credits 
         FROM credit_transactions 
         WHERE type IN ('grant_purchase', 'grant_subscription', 'grant_single_edit') AND created_at LIKE ?`,
      )
      .bind(`${date}%`)
      .first<{ count: number; total_credits: number }>(),
    db
      .prepare(
        `SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total_reversed 
         FROM credit_transactions 
         WHERE type = 'refund_reversal' AND created_at LIKE ?`,
      )
      .bind(`${date}%`)
      .first<{ count: number; total_reversed: number }>(),
  ]);

  return c.json({
    date,
    payments: {
      count: confirmedPayments?.count ?? 0,
      totalGrossCents: confirmedPayments?.total_value_cents ?? 0,
      totalNetCents: confirmedPayments?.total_net_cents ?? 0,
    },
    credits: {
      granted: grantedCredits?.total_credits ?? 0,
      reversed: Math.abs(reversedCredits?.total_reversed ?? 0),
    },
  });
});

adminBillingApp.get('/finance/summary', async (c) => {
  const db = c.env.DB;
  const from = c.req.query('from') || '2000-01-01';
  const to = c.req.query('to') || '2100-01-01';

  const [salesSummary, creditsSummary, activeSubs] = await Promise.all([
    db
      .prepare(
        `SELECT 
           COUNT(*) as total_orders,
           COALESCE(SUM(value_cents), 0) as gross_revenue_cents,
           COALESCE(SUM(net_value_cents), 0) as net_revenue_cents,
           SUM(CASE WHEN billing_type = 'PIX' THEN 1 ELSE 0 END) as pix_orders,
           SUM(CASE WHEN billing_type = 'CREDIT_CARD' THEN 1 ELSE 0 END) as card_orders
         FROM asaas_payments 
         WHERE status IN ('RECEIVED', 'CONFIRMED') AND created_at >= ? AND created_at <= ?`,
      )
      .bind(from, to)
      .first<{
        total_orders: number;
        gross_revenue_cents: number;
        net_revenue_cents: number;
        pix_orders: number;
        card_orders: number;
      }>(),
    db
      .prepare(
        `SELECT 
           COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0) as total_granted,
           COALESCE(SUM(CASE WHEN type = 'consume' THEN ABS(amount) ELSE 0 END), 0) as total_consumed,
           COALESCE(SUM(CASE WHEN type = 'expire' THEN ABS(amount) ELSE 0 END), 0) as total_expired,
           COALESCE(SUM(CASE WHEN type = 'refund_reversal' THEN ABS(amount) ELSE 0 END), 0) as total_refunded
         FROM credit_transactions 
         WHERE created_at >= ? AND created_at <= ?`,
      )
      .bind(from, to)
      .first<{
        total_granted: number;
        total_consumed: number;
        total_expired: number;
        total_refunded: number;
      }>(),
    db
      .prepare("SELECT COUNT(*) as count FROM subscriptions WHERE status = 'active'")
      .first<{ count: number }>(),
  ]);

  return c.json({
    period: { from, to },
    sales: salesSummary,
    credits: creditsSummary,
    activeSubscriptions: activeSubs?.count ?? 0,
  });
});

export default adminBillingApp;
