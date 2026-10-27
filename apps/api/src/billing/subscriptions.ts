/**
 * ALEGON AI Photo Studio — Gerenciamento de Assinaturas Recorrentes
 * Dono: Subagente 5 (Asaas e Billing)
 *
 * Contratação, consulta e cancelamento de assinaturas com Asaas:
 * - Ciclo mensal com renovação automática
 * - Suporte a cancelamento ao final do período pago ou imediato
 * - Registro e rastreamento da primeira fatura
 */
import type { Env } from '../env';
import { AsaasClient, type AsaasCreditCard, type AsaasCreditCardHolderInfo } from './asaas-client';
import { getOrCreateAsaasCustomer } from './customer-manager';
import { createWalletService } from '../wallet';
import { newId, nowIso, addDays } from '../lib/http';
import { DomainError } from '../contracts';

export interface CreateSubscriptionInput {
  userId: string;
  planCode: string;
  billingType: 'PIX' | 'CREDIT_CARD';
  cpfCnpj?: string;
  name?: string;
  phone?: string;
  creditCard?: AsaasCreditCard;
  creditCardHolderInfo?: AsaasCreditCardHolderInfo;
  remoteIp?: string;
  idempotencyKey: string;
}

export interface SubscriptionResult {
  subscriptionId: string;
  status: string;
  planName: string;
  monthlyCredits: number;
  creditsGranted?: boolean;
  firstPayment: {
    paymentId: string;
    status: string;
    valueCents: number;
    creditsGranted?: boolean;
    invoiceUrl?: string;
    pix?: {
      encodedImage: string;
      payload: string;
      expirationDate: string;
    };
  };
}

interface PlanRow {
  id: string;
  code: string;
  name: string;
  description: string | null;
  monthly_credits: number;
  price_cents: number;
  cycle: string;
  active: number;
}

interface SubscriptionRow {
  id: string;
  user_id: string;
  plan_id: string;
  asaas_subscription_id: string | null;
  billing_type: string;
  status: string;
  price_cents: number;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: number;
  created_at: string;
  updated_at: string;
  cancelled_at: string | null;
  plan_name?: string;
  plan_code?: string;
  monthly_credits?: number;
}

export async function createSubscription(
  env: Env,
  client: AsaasClient,
  input: CreateSubscriptionInput,
): Promise<SubscriptionResult> {
  const db = env.DB;
  const { userId, planCode, billingType, idempotencyKey } = input;

  if (!idempotencyKey) {
    throw new DomainError('IDEMPOTENCY_KEY_REQUIRED', 'Cabeçalho Idempotency-Key obrigatório.', 400);
  }

  // 1. Verifica se o plano existe e está ativo
  const plan = await db
    .prepare(
      'SELECT id, code, name, description, monthly_credits, price_cents, cycle, active FROM plans WHERE code = ? AND active = 1',
    )
    .bind(planCode)
    .first<PlanRow>();

  if (!plan) {
    throw new DomainError('PLAN_NOT_FOUND', 'Plano de assinatura não encontrado ou inativo.', 404);
  }

  // 2. Verifica se o usuário já tem assinatura ativa ou pendente
  const activeSub = await db
    .prepare(
      "SELECT id, status, plan_id FROM subscriptions WHERE user_id = ? AND status IN ('active', 'pending')",
    )
    .bind(userId)
    .first<SubscriptionRow>();

  if (activeSub) {
    throw new DomainError(
      'ACTIVE_SUBSCRIPTION_EXISTS',
      'Você já possui uma assinatura ativa ou pendente. Cancele-a antes de assinar outro plano.',
      409,
    );
  }

  // 3. Localiza ou cadastra cliente no Asaas
  const asaasCustomerId = await getOrCreateAsaasCustomer(env, client, userId, {
    cpfCnpj: input.cpfCnpj,
    name: input.name,
    phone: input.phone,
  });

  const internalSubId = `sub_${newId()}`;
  const now = nowIso();
  const nextDueDate = now.slice(0, 10); // Cobrança do 1º ciclo imediata
  const valueFloat = plan.price_cents / 100;

  // 4. Cria assinatura no Asaas
  const asaasSub = await client.createSubscription({
    customer: asaasCustomerId,
    billingType,
    value: valueFloat,
    nextDueDate,
    cycle: 'MONTHLY',
    description: `Photo Studio AI - Plano ${plan.name} (${plan.monthly_credits} créditos/mês)`,
    externalReference: internalSubId,
    creditCard: input.creditCard,
    creditCardHolderInfo: input.creditCardHolderInfo,
    remoteIp: input.remoteIp,
  });

  // 5. Asaas gera automaticamente a primeira cobrança do ciclo. Buscamos essa cobrança
  let asaasPaymentId = '';
  let invoiceUrl = '';
  let paymentStatus = 'PENDING';

  try {
    const paymentsList = await client.getSubscriptionPayments(asaasSub.id);
    if (paymentsList.data && paymentsList.data.length > 0) {
      const firstPay = paymentsList.data[0];
      if (firstPay) {
        asaasPaymentId = firstPay.id;
        invoiceUrl = firstPay.invoiceUrl ?? '';
        paymentStatus = firstPay.status;
      }
    }
  } catch (err) {
    console.error('Falha ao obter faturas da assinatura no Asaas:', err);
  }

  const internalPaymentId = `pay_${newId()}`;
  const isApproved = ['CONFIRMED', 'RECEIVED'].includes(paymentStatus) || asaasSub.status === 'ACTIVE';
  const initialSubStatus = isApproved ? 'active' : 'pending';
  const periodEnd = addDays(now, 30);
  let paidAt: string | null = null;
  let creditsGrantedAt: string | null = null;

  // Se o cartão foi aprovado na hora, libera os créditos do plano imediatamente
  if (isApproved) {
    paidAt = now;
    creditsGrantedAt = now;
    paymentStatus = ['CONFIRMED', 'RECEIVED'].includes(paymentStatus) ? paymentStatus : 'CONFIRMED';
    const walletService = createWalletService(env);
    await walletService.grant({
      userId,
      bucket: 'subscription',
      amount: plan.monthly_credits,
      type: 'grant_subscription',
      sourceType: 'subscription_cycle',
      sourceId: internalPaymentId,
      expiresAt: periodEnd,
      idempotencyKey: `grant:sub_cycle:${internalPaymentId}`,
      note: `Assinatura Plano ${plan.name} ativada instantaneamente via Cartão`,
    });
  }

  // 6. Salva na tabela subscriptions
  await db
    .prepare(
      `INSERT INTO subscriptions (
        id, user_id, plan_id, asaas_subscription_id, billing_type, status,
        price_cents, current_period_start, current_period_end, cancel_at_period_end,
        created_at, updated_at, cancelled_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, NULL)`,
    )
    .bind(
      internalSubId,
      userId,
      plan.id,
      asaasSub.id,
      billingType,
      initialSubStatus,
      plan.price_cents,
      isApproved ? now : null,
      isApproved ? periodEnd : null,
      now,
      now,
    )
    .run();

  let pixData: { encodedImage: string; payload: string; expirationDate: string } | undefined = undefined;

  if (asaasPaymentId && billingType === 'PIX') {
    try {
      pixData = await client.getPixQrCode(asaasPaymentId);
    } catch (err) {
      console.error('Falha ao obter QR Code Pix da primeira fatura:', err);
    }
  }

  // 7. Registra a fatura em asaas_payments vinculada à subscription
  await db
    .prepare(
      `INSERT INTO asaas_payments (
        id, user_id, asaas_payment_id, external_reference, kind, product_id, subscription_id,
        billing_type, value_cents, net_value_cents, credits, status, due_date, paid_at,
        invoice_url, credits_granted_at, credits_reversed_at, idempotency_key, created_at, updated_at
      ) VALUES (?, ?, ?, ?, 'subscription', NULL, ?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?)`,
    )
    .bind(
      internalPaymentId,
      userId,
      asaasPaymentId || null,
      internalPaymentId,
      internalSubId,
      billingType,
      plan.price_cents,
      plan.monthly_credits,
      paymentStatus,
      nextDueDate,
      paidAt,
      invoiceUrl || null,
      creditsGrantedAt,
      idempotencyKey,
      now,
      now,
    )
    .run();

  return {
    subscriptionId: internalSubId,
    status: initialSubStatus,
    planName: plan.name,
    monthlyCredits: plan.monthly_credits,
    creditsGranted: isApproved,
    firstPayment: {
      paymentId: internalPaymentId,
      status: paymentStatus,
      valueCents: plan.price_cents,
      creditsGranted: isApproved,
      invoiceUrl: invoiceUrl || undefined,
      pix: pixData,
    },
  };
}

export async function getUserSubscription(
  env: Env,
  userId: string,
): Promise<SubscriptionRow | null> {
  const db = env.DB;
  const row = await db
    .prepare(
      `SELECT s.id, s.user_id, s.plan_id, s.asaas_subscription_id, s.billing_type, s.status,
              s.price_cents, s.current_period_start, s.current_period_end, s.cancel_at_period_end,
              s.created_at, s.updated_at, s.cancelled_at,
              p.name as plan_name, p.code as plan_code, p.monthly_credits
       FROM subscriptions s
       JOIN plans p ON p.id = s.plan_id
       WHERE s.user_id = ? AND s.status IN ('active', 'pending', 'overdue')
       ORDER BY s.created_at DESC
       LIMIT 1`,
    )
    .bind(userId)
    .first<SubscriptionRow>();

  return row ?? null;
}

export async function cancelUserSubscription(
  env: Env,
  client: AsaasClient,
  userId: string,
  atPeriodEnd: boolean,
): Promise<{ id: string; status: string; cancelAtPeriodEnd: boolean }> {
  const db = env.DB;

  const sub = await db
    .prepare(
      "SELECT id, asaas_subscription_id, status FROM subscriptions WHERE user_id = ? AND status IN ('active', 'pending')",
    )
    .bind(userId)
    .first<SubscriptionRow>();

  if (!sub) {
    throw new DomainError('SUBSCRIPTION_NOT_FOUND', 'Nenhuma assinatura ativa encontrada para cancelamento.', 404);
  }

  const now = nowIso();

  if (atPeriodEnd) {
    // Mantém acesso até o final do período vigente
    await db
      .prepare('UPDATE subscriptions SET cancel_at_period_end = 1, updated_at = ? WHERE id = ?')
      .bind(now, sub.id)
      .run();

    return {
      id: sub.id,
      status: sub.status,
      cancelAtPeriodEnd: true,
    };
  }

  // Cancelamento imediato no Asaas
  if (sub.asaas_subscription_id) {
    try {
      await client.cancelSubscription(sub.asaas_subscription_id);
    } catch (err) {
      console.error('Falha ao cancelar assinatura no Asaas:', err);
    }
  }

  await db
    .prepare(
      "UPDATE subscriptions SET status = 'cancelled', cancel_at_period_end = 0, cancelled_at = ?, updated_at = ? WHERE id = ?",
    )
    .bind(now, now, sub.id)
    .run();

  return {
    id: sub.id,
    status: 'cancelled',
    cancelAtPeriodEnd: false,
  };
}
