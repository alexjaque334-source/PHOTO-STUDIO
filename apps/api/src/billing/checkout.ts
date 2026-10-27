/**
 * ALEGON AI Photo Studio — Serviço de Checkout de Produtos e Pacotes
 * Dono: Subagente 5 (Asaas e Billing)
 *
 * Criação segura de cobranças Pix e Cartão com Asaas:
 * - Idempotência por Idempotency-Key
 * - Geração de Pix QR Code dinâmico e Copia-e-Cola
 * - Redirecionamento de cartão via invoiceUrl hospedado do Asaas
 */
import type { Env } from '../env';
import { AsaasClient, type AsaasCreditCard, type AsaasCreditCardHolderInfo } from './asaas-client';
import { getOrCreateAsaasCustomer } from './customer-manager';
import { createWalletService } from '../wallet';
import { newId, nowIso, addDays } from '../lib/http';
import { DomainError } from '../contracts';

export interface CheckoutInput {
  userId: string;
  productCode: string;
  billingType: 'PIX' | 'CREDIT_CARD';
  cpfCnpj?: string;
  name?: string;
  phone?: string;
  creditCard?: AsaasCreditCard;
  creditCardHolderInfo?: AsaasCreditCardHolderInfo;
  remoteIp?: string;
  idempotencyKey: string;
}

export interface CheckoutResult {
  paymentId: string;
  status: string;
  valueCents: number;
  credits: number;
  invoiceUrl?: string;
  creditsGranted?: boolean;
  pix?: {
    encodedImage: string;
    payload: string;
    expirationDate: string;
  };
}

interface ProductRow {
  id: string;
  code: string;
  kind: 'single_edit' | 'credit_pack';
  name: string;
  description: string | null;
  credits: number;
  price_cents: number;
  credit_validity_days: number | null;
  active: number;
}

interface ExistingPaymentRow {
  id: string;
  user_id: string;
  asaas_payment_id: string;
  status: string;
  value_cents: number;
  credits: number;
  invoice_url: string | null;
  billing_type: string;
}

export async function processCheckout(
  env: Env,
  client: AsaasClient,
  input: CheckoutInput,
): Promise<CheckoutResult> {
  const db = env.DB;
  const { userId, productCode, billingType, idempotencyKey } = input;

  if (!idempotencyKey) {
    throw new DomainError('IDEMPOTENCY_KEY_REQUIRED', 'Cabeçalho Idempotency-Key obrigatório.', 400);
  }

  // 1. Verifica se já existe pagamento processado com este idempotency_key
  const existing = await db
    .prepare(
      `SELECT id, user_id, asaas_payment_id, status, value_cents, credits, invoice_url, billing_type 
       FROM asaas_payments 
       WHERE user_id = ? AND idempotency_key = ?`,
    )
    .bind(userId, idempotencyKey)
    .first<ExistingPaymentRow>();

  if (existing) {
    let pixData = undefined;
    if (existing.billing_type === 'PIX' && existing.status === 'PENDING') {
      try {
        pixData = await client.getPixQrCode(existing.asaas_payment_id);
      } catch {
        // Se falhar ao buscar QR Code existente, o usuário pode tentar novamente ou pagar via invoiceUrl
      }
    }
    return {
      paymentId: existing.id,
      status: existing.status,
      valueCents: existing.value_cents,
      credits: existing.credits,
      invoiceUrl: existing.invoice_url ?? undefined,
      pix: pixData,
    };
  }

  // 2. Localiza o produto no catálogo
  const product = await db
    .prepare(
      'SELECT id, code, kind, name, description, credits, price_cents, credit_validity_days, active FROM products WHERE code = ? AND active = 1',
    )
    .bind(productCode)
    .first<ProductRow>();

  if (!product) {
    throw new DomainError('PRODUCT_NOT_FOUND', 'Produto não encontrado ou inativo no catálogo.', 404);
  }

  // 3. Localiza ou cria cliente no Asaas
  const asaasCustomerId = await getOrCreateAsaasCustomer(env, client, userId, {
    cpfCnpj: input.cpfCnpj,
    name: input.name,
    phone: input.phone,
  });

  // 4. Cria cobrança no Asaas
  const internalPaymentId = `pay_${newId()}`;
  const now = nowIso();
  const dueDate = addDays(now, 3).slice(0, 10); // Vencimento em 3 dias corridos
  const valueFloat = product.price_cents / 100;

  const asaasPayment = await client.createPayment({
    customer: asaasCustomerId,
    billingType,
    value: valueFloat,
    dueDate,
    description: `Photo Studio AI - ${product.name} (${product.credits} créditos)`,
    externalReference: internalPaymentId,
    creditCard: input.creditCard,
    creditCardHolderInfo: input.creditCardHolderInfo,
    remoteIp: input.remoteIp,
  });

  const isApproved = ['CONFIRMED', 'RECEIVED'].includes(asaasPayment.status);
  let paidAt: string | null = null;
  let creditsGrantedAt: string | null = null;

  // Se o pagamento por cartão foi aprovado instantaneamente, libera os créditos imediatamente
  if (isApproved) {
    paidAt = now;
    creditsGrantedAt = now;
    const walletService = createWalletService(env);
    let validityDays = 30;
    if (product.credit_validity_days) {
      validityDays = product.credit_validity_days;
    }
    const expiresAt = addDays(now, validityDays);
    await walletService.grant({
      userId,
      bucket: 'purchased',
      amount: product.credits,
      type: product.kind === 'single_edit' ? 'grant_single_edit' : 'grant_purchase',
      sourceType: 'payment',
      sourceId: internalPaymentId,
      expiresAt,
      idempotencyKey: `grant:payment:${internalPaymentId}`,
      note: `Pagamento instantâneo via Cartão confirmado (${product.name})`,
    });
  }

  // 5. Se for Pix, obtém o QR Code e Payload
  let pixData: { encodedImage: string; payload: string; expirationDate: string } | undefined = undefined;
  if (billingType === 'PIX') {
    try {
      pixData = await client.getPixQrCode(asaasPayment.id);
    } catch (err) {
      console.error('Falha ao obter QR Code Pix do Asaas:', err);
    }
  }

  const netValueCents = asaasPayment.netValue ? Math.round(asaasPayment.netValue * 100) : null;

  // 6. Grava na tabela asaas_payments
  await db
    .prepare(
      `INSERT INTO asaas_payments (
        id, user_id, asaas_payment_id, external_reference, kind, product_id, subscription_id,
        billing_type, value_cents, net_value_cents, credits, status, due_date, paid_at,
        invoice_url, credits_granted_at, credits_reversed_at, idempotency_key, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?)`,
    )
    .bind(
      internalPaymentId,
      userId,
      asaasPayment.id,
      internalPaymentId,
      product.kind,
      product.id,
      billingType,
      product.price_cents,
      netValueCents,
      product.credits,
      asaasPayment.status,
      asaasPayment.dueDate,
      paidAt,
      asaasPayment.invoiceUrl ?? null,
      creditsGrantedAt,
      idempotencyKey,
      now,
      now,
    )
    .run();

  return {
    paymentId: internalPaymentId,
    status: asaasPayment.status,
    valueCents: product.price_cents,
    credits: product.credits,
    creditsGranted: isApproved,
    invoiceUrl: asaasPayment.invoiceUrl,
    pix: pixData,
  };
}
