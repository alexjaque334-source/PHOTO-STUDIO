/**
 * ALEGON AI Photo Studio — Rotas de Cobrança e Checkout (Asaas)
 * Dono: Subagente 5 (Asaas e Billing)
 *
 * Endpoints públicos e autenticados de cobrança:
 * - Catálogo público de produtos e planos
 * - Checkout pontual (Pix e Cartão via Asaas)
 * - Assinaturas recorrentes e cancelamento
 * - Histórico e sincronização de faturas
 */
import { Hono } from 'hono';
import { z } from 'zod';
import type { AppContext } from '../env';
import { requireAuth } from '../middleware/auth';
import { DomainError } from '../contracts';
import { parseJson } from '../lib/http';
import { AsaasClient } from '../billing/asaas-client';
import { processCheckout } from '../billing/checkout';
import {
  createSubscription,
  getUserSubscription,
  cancelUserSubscription,
} from '../billing/subscriptions';
import { paginate } from '../db';

const billingApp = new Hono<AppContext>();

// ───────────────────────────── Catálogo Público ─────────────────────────────
billingApp.get('/catalog', async (c) => {
  const db = c.env.DB;

  const [productsRes, plansRes] = await Promise.all([
    db
      .prepare(
        `SELECT code, kind, name, description, credits, price_cents, credit_validity_days 
         FROM products 
         WHERE active = 1 
         ORDER BY sort_order ASC, price_cents ASC`,
      )
      .all<{
        code: string;
        kind: string;
        name: string;
        description: string | null;
        credits: number;
        price_cents: number;
        credit_validity_days: number | null;
      }>(),
    db
      .prepare(
        `SELECT id, code, name, description, monthly_credits, price_cents 
         FROM plans 
         WHERE active = 1 
         ORDER BY sort_order ASC, price_cents ASC`,
      )
      .all<{
        id: string;
        code: string;
        name: string;
        description: string | null;
        monthly_credits: number;
        price_cents: number;
      }>(),
  ]);

  const products = (productsRes.results ?? []).map((p) => ({
    code: p.code,
    kind: p.kind,
    name: p.name,
    description: p.description,
    credits: p.credits,
    priceCents: p.price_cents,
    price_cents: p.price_cents,
    creditValidityDays: p.credit_validity_days,
  }));

  const plans = (plansRes.results ?? []).map((pl) => ({
    id: pl.id,
    code: pl.code,
    name: pl.name,
    description: pl.description,
    monthlyCredits: pl.monthly_credits,
    monthly_credits: pl.monthly_credits,
    priceCents: pl.price_cents,
    price_cents: pl.price_cents,
  }));

  return c.json({ products, plans });
});

// ───────────────────────────── Checkout Pontual ─────────────────────────────
const checkoutSchema = z.object({
  productCode: z.string().min(1, 'Código do produto obrigatório'),
  billingType: z.enum(['PIX', 'CREDIT_CARD']),
  cpfCnpj: z.string().optional(),
  name: z.string().optional(),
  phone: z.string().optional(),
});

billingApp.post('/checkout', requireAuth(), async (c) => {
  const user = c.get('user');
  const idempotencyKey = c.req.header('Idempotency-Key');

  if (!idempotencyKey) {
    throw new DomainError('IDEMPOTENCY_KEY_REQUIRED', 'Cabeçalho Idempotency-Key é obrigatório.', 400);
  }

  const body = await parseJson(c, checkoutSchema);
  const client = new AsaasClient(c.env);

  const result = await processCheckout(c.env, client, {
    userId: user.id,
    productCode: body.productCode,
    billingType: body.billingType,
    cpfCnpj: body.cpfCnpj,
    name: body.name,
    phone: body.phone,
    idempotencyKey,
  });

  return c.json(result, 201);
});

// ───────────────────────────── Histórico de Pagamentos ─────────────────────────────
billingApp.get('/payments', requireAuth(), async (c) => {
  const user = c.get('user');
  const cursor = c.req.query('cursor') ?? null;
  const limitParam = parseInt(c.req.query('limit') || '20', 10);

  const result = await paginate<{
    id: string;
    kind: string;
    billing_type: string;
    value_cents: number;
    credits: number;
    status: string;
    invoice_url: string | null;
    paid_at: string | null;
    created_at: string;
  }>(c.env.DB, {
    table: 'asaas_payments',
    select: 'id, kind, billing_type, value_cents, credits, status, invoice_url, paid_at, created_at',
    whereClause: 'user_id = ?',
    params: [user.id],
    sortColumn: 'created_at',
    order: 'DESC',
    cursor,
    limit: limitParam,
  });

  const items = result.items.map((item) => ({
    id: item.id,
    kind: item.kind,
    billingType: item.billing_type,
    valueCents: item.value_cents,
    credits: item.credits,
    status: item.status,
    invoiceUrl: item.invoice_url,
    paidAt: item.paid_at,
    createdAt: item.created_at,
  }));

  return c.json({ items, nextCursor: result.nextCursor });
});

billingApp.get('/payments/:id', requireAuth(), async (c) => {
  const user = c.get('user');
  const paymentId = c.req.param('id');
  const db = c.env.DB;

  const payment = await db
    .prepare(
      `SELECT id, asaas_payment_id, kind, billing_type, value_cents, credits, status, 
              invoice_url, due_date, paid_at, credits_granted_at, created_at 
       FROM asaas_payments 
       WHERE id = ? AND user_id = ?`,
    )
    .bind(paymentId, user.id)
    .first<{
      id: string;
      asaas_payment_id: string | null;
      kind: string;
      billing_type: string;
      value_cents: number;
      credits: number;
      status: string;
      invoice_url: string | null;
      due_date: string | null;
      paid_at: string | null;
      credits_granted_at: string | null;
      created_at: string;
    }>();

  if (!payment) {
    throw new DomainError('PAYMENT_NOT_FOUND', 'Cobrança não encontrada.', 404);
  }

  // Se a cobrança estiver pendente e possuir ID no Asaas, sincroniza em tempo real
  let currentStatus = payment.status;
  if (payment.status === 'PENDING' && payment.asaas_payment_id && c.env.ASAAS_API_KEY) {
    try {
      const client = new AsaasClient(c.env);
      const asaasPayment = await client.getPayment(payment.asaas_payment_id);
      if (asaasPayment.status !== payment.status) {
        currentStatus = asaasPayment.status;
        await db
          .prepare('UPDATE asaas_payments SET status = ? WHERE id = ?')
          .bind(currentStatus, payment.id)
          .run();
      }
    } catch {
      // Ignora erro de consulta temporária
    }
  }

  let pixData = undefined;
  if (payment.billing_type === 'PIX' && currentStatus === 'PENDING' && payment.asaas_payment_id) {
    try {
      const client = new AsaasClient(c.env);
      pixData = await client.getPixQrCode(payment.asaas_payment_id);
    } catch {
      // QR code pode ter expirado ou estar indisponível
    }
  }

  return c.json({
    id: payment.id,
    kind: payment.kind,
    billingType: payment.billing_type,
    valueCents: payment.value_cents,
    credits: payment.credits,
    status: currentStatus,
    invoiceUrl: payment.invoice_url,
    dueDate: payment.due_date,
    paidAt: payment.paid_at,
    creditsGranted: !!payment.credits_granted_at,
    createdAt: payment.created_at,
    pix: pixData,
  });
});

// ───────────────────────────── Assinaturas ─────────────────────────────
const subscriptionSchema = z.object({
  planCode: z.string().min(1, 'Código do plano obrigatório'),
  billingType: z.enum(['PIX', 'CREDIT_CARD']),
  cpfCnpj: z.string().optional(),
  name: z.string().optional(),
  phone: z.string().optional(),
});

billingApp.post('/subscriptions', requireAuth(), async (c) => {
  const user = c.get('user');
  const idempotencyKey = c.req.header('Idempotency-Key');

  if (!idempotencyKey) {
    throw new DomainError('IDEMPOTENCY_KEY_REQUIRED', 'Cabeçalho Idempotency-Key obrigatório.', 400);
  }

  const body = await parseJson(c, subscriptionSchema);
  const client = new AsaasClient(c.env);

  const result = await createSubscription(c.env, client, {
    userId: user.id,
    planCode: body.planCode,
    billingType: body.billingType,
    cpfCnpj: body.cpfCnpj,
    name: body.name,
    phone: body.phone,
    idempotencyKey,
  });

  return c.json(result, 201);
});

billingApp.get('/subscription', requireAuth(), async (c) => {
  const user = c.get('user');
  const sub = await getUserSubscription(c.env, user.id);

  if (!sub) {
    return c.json(null);
  }

  return c.json({
    id: sub.id,
    planCode: sub.plan_code,
    planName: sub.plan_name,
    monthlyCredits: sub.monthly_credits,
    billingType: sub.billing_type,
    status: sub.status,
    priceCents: sub.price_cents,
    currentPeriodStart: sub.current_period_start,
    currentPeriodEnd: sub.current_period_end,
    cancelAtPeriodEnd: Boolean(sub.cancel_at_period_end),
    createdAt: sub.created_at,
  });
});

const cancelSubSchema = z.object({
  atPeriodEnd: z.boolean(),
});

billingApp.post('/subscription/cancel', requireAuth(), async (c) => {
  const user = c.get('user');
  const body = await parseJson(c, cancelSubSchema);
  const client = new AsaasClient(c.env);

  const result = await cancelUserSubscription(c.env, client, user.id, body.atPeriodEnd);
  return c.json(result);
});

export default billingApp;
