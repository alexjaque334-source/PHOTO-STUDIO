/**
 * Rotas de Orçamento, Confirmação e Acompanhamento de Edições de Fotos com IA.
 * Dono: Backend Engineer
 */
import { Hono } from 'hono';
import { z } from 'zod';
import type { AppContext, Env } from '../env';
import {
  DomainError,
  InsufficientCreditsError,
  type AiToolDescriptor,
  type EditTool,
  type Tier,
  type WalletBalance,
  type WalletService,
} from '../contracts';
import { execute, getSystemSetting, paginate, queryAll, queryOne } from '../db';
import { newId, nowIso, parseJson } from '../lib/http';
import { requireAuth } from '../middleware/auth';
import { createAiEditService } from '../ai';
import { createWalletService } from '../wallet';
import { processSingleEditJob } from '../jobs/edit-consumer';

const editRoutes = new Hono<AppContext>();

const QuoteRequestSchema = z.object({
  imageId: z.string().min(1),
  versionId: z.string().min(1),
  prompt: z.string().min(3).max(2000),
  tool: z.string().optional().default('free_prompt'),
  tier: z.enum(['economico', 'padrao', 'premium']).optional().default('padrao'),
});

const InterpretSchema = z.object({
  prompt: z.string().min(1).max(2000),
});

const ConfirmEditSchema = z.object({
  editRequestId: z.string().min(1),
});

/**
 * Obtém o serviço de Wallet: tenta importar o módulo oficial de billing/wallet;
 * se ainda não estiver carregado, utiliza implementação direta D1 garantindo conformidade.
 */
export function getWalletService(env: Env): WalletService {
  return createWalletService(env);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function _legacyWallet(env: Env) {
  try {
    // @ts-ignore - dynamic import do módulo Asaas/Billing
    const walletModule = await import('../wallet');
    if (walletModule && typeof walletModule.createWalletService === 'function') {
      return walletModule.createWalletService(env);
    }
  } catch {
    // Usa fallback D1 direto
  }

  return {
    async getBalance(userId: string): Promise<WalletBalance> {
      interface WalletRow {
        purchased_balance: number;
        subscription_balance: number;
        reserved: number;
      }
      const wallet = await queryOne<WalletRow>(
        env.DB,
        'SELECT purchased_balance, subscription_balance, reserved FROM wallets WHERE user_id = ?',
        [userId],
      );

      const purchased = wallet?.purchased_balance ?? 0;
      const subscription = wallet?.subscription_balance ?? 0;
      const reserved = wallet?.reserved ?? 0;
      const available = Math.max(0, purchased + subscription - reserved);

      interface LotRow {
        bucket: 'purchased' | 'subscription';
        amount_remaining: number;
        expires_at: string | null;
      }

      const lots = await queryAll<LotRow>(
        env.DB,
        `SELECT bucket, amount_remaining, expires_at FROM credit_lots
         WHERE user_id = ? AND amount_remaining > 0 AND (expires_at IS NULL OR expires_at > ?)
         ORDER BY expires_at ASC`,
        [userId, nowIso()],
      );

      return {
        purchased,
        subscription,
        reserved,
        available,
        expiringSoon: lots.map((l) => ({
          bucket: l.bucket,
          amount: l.amount_remaining,
          expiresAt: l.expires_at || '',
        })),
      };
    },

    async reserve(input: {
      userId: string;
      editRequestId: string;
      amount: number;
      ttlMinutes?: number;
    }): Promise<{ reservationId: string }> {
      const existing = await queryOne<{ id: string }>(
        env.DB,
        'SELECT id FROM credit_reservations WHERE edit_request_id = ?',
        [input.editRequestId],
      );
      if (existing) {
        return { reservationId: existing.id };
      }

      const balance = await this.getBalance(input.userId);
      if (balance.available < input.amount) {
        throw new InsufficientCreditsError(input.amount, balance.available);
      }

      const reservationId = newId();
      const now = nowIso();
      const ttl = input.ttlMinutes ?? 30;
      const expiresAt = new Date(Date.now() + ttl * 60_000).toISOString();

      await execute(
        env.DB,
        `INSERT INTO credit_reservations (id, user_id, edit_request_id, amount, allocation_json, status, created_at, expires_at)
         VALUES (?, ?, ?, ?, '[]', 'active', ?, ?)`,
        [reservationId, input.userId, input.editRequestId, input.amount, now, expiresAt],
      );

      await execute(
        env.DB,
        `UPDATE wallets SET reserved = reserved + ?, updated_at = ? WHERE user_id = ?`,
        [input.amount, now, input.userId],
      );

      return { reservationId };
    },

    async consume(reservationId: string): Promise<void> {
      interface ResRow {
        user_id: string;
        amount: number;
        status: string;
      }
      const res = await queryOne<ResRow>(
        env.DB,
        'SELECT user_id, amount, status FROM credit_reservations WHERE id = ?',
        [reservationId],
      );
      if (!res || res.status !== 'active') return;

      const now = nowIso();

      // Prioridade: deduz do saldo de assinatura primeiro, depois comprado
      const wallet = await queryOne<{ purchased_balance: number; subscription_balance: number }>(
        env.DB,
        'SELECT purchased_balance, subscription_balance FROM wallets WHERE user_id = ?',
        [res.user_id],
      );

      let subDeduct = Math.min(wallet?.subscription_balance ?? 0, res.amount);
      let purDeduct = res.amount - subDeduct;

      await execute(
        env.DB,
        `UPDATE wallets SET
          subscription_balance = MAX(0, subscription_balance - ?),
          purchased_balance = MAX(0, purchased_balance - ?),
          reserved = MAX(0, reserved - ?),
          updated_at = ?
         WHERE user_id = ?`,
        [subDeduct, purDeduct, res.amount, now, res.user_id],
      );

      await execute(
        env.DB,
        `UPDATE credit_reservations SET status = 'consumed', settled_at = ? WHERE id = ?`,
        [now, reservationId],
      );

      await execute(
        env.DB,
        `INSERT INTO credit_transactions (id, user_id, type, amount, reference_type, reference_id, created_at)
         VALUES (?, ?, 'consume', ?, 'reservation', ?, ?)`,
        [newId(), res.user_id, -res.amount, reservationId, now],
      );
    },

    async release(reservationId: string, reason: string): Promise<void> {
      interface ResRow {
        user_id: string;
        amount: number;
        status: string;
      }
      const res = await queryOne<ResRow>(
        env.DB,
        'SELECT user_id, amount, status FROM credit_reservations WHERE id = ?',
        [reservationId],
      );
      if (!res || res.status !== 'active') return;

      const now = nowIso();
      await execute(
        env.DB,
        `UPDATE wallets SET reserved = MAX(0, reserved - ?), updated_at = ? WHERE user_id = ?`,
        [res.amount, now, res.user_id],
      );

      await execute(
        env.DB,
        `UPDATE credit_reservations SET status = 'released', settled_at = ?, release_reason = ? WHERE id = ?`,
        [now, reason, reservationId],
      );

      await execute(
        env.DB,
        `INSERT INTO credit_transactions (id, user_id, type, amount, reference_type, reference_id, note, created_at)
         VALUES (?, ?, 'release', ?, 'reservation', ?, ?, ?)`,
        [newId(), res.user_id, res.amount, reservationId, reason, now],
      );
    },

    async grant(input: {
      userId: string;
      bucket: 'purchased' | 'subscription';
      amount: number;
      type: string;
      sourceType: string;
      sourceId: string;
      expiresAt: string | null;
      idempotencyKey: string;
      createdBy?: string;
      note?: string;
    }): Promise<{ lotId: string; alreadyApplied: boolean }> {
      const existingTx = await queryOne<{ id: string }>(
        env.DB,
        'SELECT id FROM credit_transactions WHERE idempotency_key = ?',
        [input.idempotencyKey],
      );
      if (existingTx) {
        return { lotId: existingTx.id, alreadyApplied: true };
      }

      const lotId = newId();
      const now = nowIso();

      await execute(
        env.DB,
        `INSERT INTO credit_lots (id, user_id, bucket, amount_initial, amount_remaining, source_type, source_id, expires_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          lotId,
          input.userId,
          input.bucket,
          input.amount,
          input.amount,
          input.sourceType,
          input.sourceId,
          input.expiresAt,
          now,
        ],
      );

      const balanceColumn =
        input.bucket === 'subscription' ? 'subscription_balance' : 'purchased_balance';
      await execute(
        env.DB,
        `UPDATE wallets SET ${balanceColumn} = ${balanceColumn} + ?, updated_at = ? WHERE user_id = ?`,
        [input.amount, now, input.userId],
      );

      await execute(
        env.DB,
        `INSERT INTO credit_transactions (id, user_id, type, bucket, amount, lot_id, reference_type, reference_id, idempotency_key, note, created_by, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          newId(),
          input.userId,
          input.type,
          input.bucket,
          input.amount,
          lotId,
          input.sourceType,
          input.sourceId,
          input.idempotencyKey,
          input.note ?? null,
          input.createdBy ?? null,
          now,
        ],
      );

      return { lotId, alreadyApplied: false };
    },

    async debit(input: {
      userId: string;
      amount: number;
      type: string;
      referenceId: string;
      idempotencyKey: string;
      createdBy?: string;
      note?: string;
    }): Promise<{ debited: number }> {
      const balance = await this.getBalance(input.userId);
      const toDebit = Math.min(balance.available, input.amount);
      if (toDebit <= 0) return { debited: 0 };

      const now = nowIso();
      await execute(
        env.DB,
        `UPDATE wallets SET purchased_balance = MAX(0, purchased_balance - ?), updated_at = ? WHERE user_id = ?`,
        [toDebit, now, input.userId],
      );

      await execute(
        env.DB,
        `INSERT INTO credit_transactions (id, user_id, type, amount, reference_id, idempotency_key, note, created_by, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          newId(),
          input.userId,
          input.type,
          -toDebit,
          input.referenceId,
          input.idempotencyKey,
          input.note ?? null,
          input.createdBy ?? null,
          now,
        ],
      );

      return { debited: toDebit };
    },
  };
}

// GET /edits/tools - Catálogo de ferramentas e tiers
editRoutes.get('/tools', async (c) => {
  const ai = createAiEditService(c.env);
  const tools = ai.listTools();

  const tiers = [
    { tier: 'economico', label: 'Econômico (Rápido)', credits: 1, available: true },
    { tier: 'padrao', label: 'Padrão (Alta Qualidade)', credits: 1, available: true },
    { tier: 'premium', label: 'Premium (Ultra Definição)', credits: 2, available: true },
  ];

  return c.json({ tools, tiers });
});

// POST /edits/quote - Orçamento prévio de créditos
editRoutes.post('/quote', requireAuth(), async (c) => {
  const body = await parseJson(c, QuoteRequestSchema);
  const user = c.get('user');
  const now = nowIso();

  // Limite de tamanho de prompt
  const maxPromptChars = await getSystemSetting<number>(
    c.env.DB,
    'limits.max_prompt_chars',
    2000,
  );
  if (body.prompt.length > maxPromptChars) {
    throw new DomainError(
      'VALIDATION_ERROR',
      `O prompt não pode ultrapassar ${maxPromptChars} caracteres.`,
      422,
    );
  }

  // Limite diário de edições
  const maxEditsPerDay = await getSystemSetting<number>(
    c.env.DB,
    'limits.edits_per_user_per_day',
    50,
  );
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  const editsToday = await queryOne<{ total: number }>(
    c.env.DB,
    `SELECT COUNT(id) as total FROM edit_requests
     WHERE user_id = ? AND status != 'cancelled' AND created_at >= ?`,
    [user.id, todayStart.toISOString()],
  );

  if ((editsToday?.total ?? 0) >= maxEditsPerDay) {
    throw new DomainError(
      'DAILY_LIMIT_REACHED',
      `Você atingiu o limite de ${maxEditsPerDay} edições por dia.`,
      429,
    );
  }

  // Limite de concorrência
  const maxConcurrent = await getSystemSetting<number>(
    c.env.DB,
    'limits.concurrent_jobs_per_user',
    2,
  );
  const activeJobs = await queryOne<{ total: number }>(
    c.env.DB,
    `SELECT COUNT(id) as total FROM edit_jobs
     WHERE user_id = ? AND status IN ('queued', 'processing')`,
    [user.id],
  );

  if ((activeJobs?.total ?? 0) >= maxConcurrent) {
    throw new DomainError(
      'RATE_LIMITED',
      `Aguarde a conclusão das suas ${maxConcurrent} edições em andamento antes de solicitar novas.`,
      429,
    );
  }

  // Valida imagem e versão
  const version = await queryOne<{ id: string; image_id: string }>(
    c.env.DB,
    `SELECT id, image_id FROM image_versions
     WHERE id = ? AND image_id = ? AND user_id = ? AND deleted_at IS NULL`,
    [body.versionId, body.imageId, user.id],
  );

  if (!version) {
    throw new DomainError('NOT_FOUND', 'Imagem ou versão de origem não encontrada.', 404);
  }

  // Interpretação de linguagem natural via motor inteligente NLU (70 comandos)
  const { interpretNaturalLanguage } = await import('../ai/nlu');
  const interpretation = interpretNaturalLanguage(body.prompt);

  const wallet = await getWalletService(c.env);
  const balance = await wallet.getBalance(user.id);

  const editRequestId = newId();
  const quoteExpiresAt = new Date(Date.now() + 10 * 60_000).toISOString(); // 10 min

  await execute(
    c.env.DB,
    `INSERT INTO edit_requests (
      id, user_id, image_id, source_version_id, prompt, tool, tier,
      credits_quoted, status, quote_expires_at, created_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'quoted', ?, ?)`,
    [
      editRequestId,
      user.id,
      body.imageId,
      body.versionId,
      body.prompt,
      interpretation.primaryIntent.internalName,
      body.tier || 'padrao',
      interpretation.suggestedCredits,
      quoteExpiresAt,
      now,
    ],
  );

  return c.json({
    editRequestId,
    credits: interpretation.suggestedCredits,
    priceInCents: interpretation.priceInCents,
    humanFriendlySummary: interpretation.humanFriendlySummary,
    primaryIntent: interpretation.primaryIntent.internalName,
    detectedIntents: interpretation.allDetectedCommands.map((cmd) => ({
      id: cmd.id,
      name: cmd.internalName,
      intent: cmd.intent,
      category: cmd.category,
      complexity: cmd.complexity,
    })),
    tier: body.tier || 'padrao',
    modelLabel: 'Motor Inteligente Photo Studio AI (70 Comandos)',
    expiresAt: quoteExpiresAt,
    balance,
  });
});

// POST /edits/interpret - Análise semântica rápida de intenções sem gerar requisição
editRoutes.post('/interpret', requireAuth(), async (c) => {
  const body = await parseJson(c, InterpretSchema);
  const { interpretNaturalLanguage } = await import('../ai/nlu');
  const interpretation = interpretNaturalLanguage(body.prompt);
  return c.json(interpretation);
});

// GET /edits/catalog - Catálogo completo dos 70 comandos internos
editRoutes.get('/catalog', async (c) => {
  const { COMMANDS_CATALOG } = await import('../ai/catalog');
  return c.json({
    total: COMMANDS_CATALOG.length,
    commands: COMMANDS_CATALOG,
  });
});

// POST /edits/confirm - Reserva de créditos e enfileiramento na Cloudflare Queue
editRoutes.post('/confirm', requireAuth(), async (c) => {
  const body = await parseJson(c, ConfirmEditSchema);
  const user = c.get('user');
  const idempotencyKey = c.req.header('Idempotency-Key');

  if (!idempotencyKey) {
    throw new DomainError('VALIDATION_ERROR', 'Header Idempotency-Key obrigatório.', 422);
  }

  interface RequestRow {
    id: string;
    user_id: string;
    image_id: string;
    credits_quoted: number;
    status: string;
    quote_expires_at: string;
    idempotency_key: string | null;
  }

  const editReq = await queryOne<RequestRow>(
    c.env.DB,
    'SELECT id, user_id, image_id, credits_quoted, status, quote_expires_at, idempotency_key FROM edit_requests WHERE id = ? AND user_id = ?',
    [body.editRequestId, user.id],
  );

  if (!editReq) {
    throw new DomainError('NOT_FOUND', 'Cotação de edição não encontrada.', 404);
  }

  // Idempotência: se já confirmada com a mesma chave, retorna o jobId existente
  if (editReq.status === 'confirmed') {
    const existingJob = await queryOne<{ id: string }>(
      c.env.DB,
      'SELECT id FROM edit_jobs WHERE edit_request_id = ?',
      [editReq.id],
    );
    if (existingJob) {
      return c.json({ jobId: existingJob.id }, 202);
    }
  }

  if (editReq.status !== 'quoted') {
    throw new DomainError('CONFLICT', `Cotação com status inválido: ${editReq.status}`, 409);
  }

  if (new Date(editReq.quote_expires_at).getTime() < Date.now()) {
    await execute(
      c.env.DB,
      "UPDATE edit_requests SET status = 'expired' WHERE id = ?",
      [editReq.id],
    );
    throw new DomainError(
      'QUOTE_EXPIRED',
      'A cotação de edição expirou. Solicite um novo orçamento.',
      409,
    );
  }

  // 1. Reserva atômica dos créditos na carteira
  const wallet = await getWalletService(c.env);
  const { reservationId } = await wallet.reserve({
    userId: user.id,
    editRequestId: editReq.id,
    amount: editReq.credits_quoted,
    ttlMinutes: 30,
  });

  const jobId = newId();
  const now = nowIso();

  // 2. Registra o job no banco
  await execute(
    c.env.DB,
    `INSERT INTO edit_jobs (id, edit_request_id, user_id, image_id, status, reservation_id, created_at)
     VALUES (?, ?, ?, ?, 'queued', ?, ?)`,
    [jobId, editReq.id, user.id, editReq.image_id, reservationId, now],
  );

  // 3. Atualiza edit_requests
  await execute(
    c.env.DB,
    `UPDATE edit_requests SET status = 'confirmed', confirmed_at = ?, idempotency_key = ? WHERE id = ?`,
    [now, idempotencyKey, editReq.id],
  );

  // 4. Enfileira na Cloudflare Queue ou executa em background se Queue não estiver configurada
  if (c.env.EDIT_QUEUE) {
    await c.env.EDIT_QUEUE.send({
      type: 'edit_job',
      jobId,
      userId: user.id,
      enqueuedAt: now,
    });
  } else {
    c.executionCtx.waitUntil(processSingleEditJob(jobId, c.env, c.executionCtx as any));
  }

  return c.json({ jobId }, 202);
});

// GET /edits/jobs/:id - Polling do status do processamento
editRoutes.get('/jobs/:id', requireAuth(), async (c) => {
  const user = c.get('user');
  const jobId = c.req.param('id');

  interface JobRow {
    id: string;
    status: string;
    result_version_id: string | null;
    error_code: string | null;
    error_message: string | null;
    created_at: string;
    finished_at: string | null;
    credits_quoted: number;
  }

  const job = await queryOne<JobRow>(
    c.env.DB,
    `SELECT j.id, j.status, j.result_version_id, j.error_code, j.error_message, j.created_at, j.finished_at,
            r.credits_quoted
     FROM edit_jobs j
     JOIN edit_requests r ON r.id = j.edit_request_id
     WHERE j.id = ? AND j.user_id = ?`,
    [jobId, user.id],
  );

  if (!job) {
    throw new DomainError('NOT_FOUND', 'Job de edição não encontrado.', 404);
  }

  return c.json({
    id: job.id,
    status: job.status,
    resultVersionId: job.result_version_id,
    errorCode: job.error_code,
    errorMessage: job.error_message,
    creditsCharged: job.status === 'succeeded' ? job.credits_quoted : 0,
    createdAt: job.created_at,
    finishedAt: job.finished_at,
  });
});

// GET /edits/jobs - Listagem de jobs
editRoutes.get('/jobs', requireAuth(), async (c) => {
  const user = c.get('user');
  const imageId = c.req.query('imageId');
  const cursor = c.req.query('cursor') || null;
  const limit = parseInt(c.req.query('limit') || '20', 10);

  const whereParts = ['user_id = ?'];
  const params: unknown[] = [user.id];

  if (imageId) {
    whereParts.push('image_id = ?');
    params.push(imageId);
  }

  interface JobItem {
    id: string;
    image_id: string;
    status: string;
    result_version_id: string | null;
    error_code: string | null;
    created_at: string;
    finished_at: string | null;
  }

  const paginated = await paginate<JobItem>(c.env.DB, {
    table: 'edit_jobs',
    select: 'id, image_id, status, result_version_id, error_code, created_at, finished_at',
    whereClause: whereParts.join(' AND '),
    params,
    sortColumn: 'created_at',
    order: 'DESC',
    cursor,
    limit,
  });

  return c.json(paginated);
});

// POST /edits/jobs/:id/cancel
editRoutes.post('/jobs/:id/cancel', requireAuth(), async (c) => {
  const user = c.get('user');
  const jobId = c.req.param('id');

  interface JobRow {
    id: string;
    status: string;
    reservation_id: string | null;
  }

  const job = await queryOne<JobRow>(
    c.env.DB,
    'SELECT id, status, reservation_id FROM edit_jobs WHERE id = ? AND user_id = ?',
    [jobId, user.id],
  );

  if (!job) {
    throw new DomainError('NOT_FOUND', 'Job de edição não encontrado.', 404);
  }

  if (job.status !== 'queued') {
    throw new DomainError(
      'CONFLICT',
      'Apenas edições na fila de espera podem ser canceladas.',
      409,
    );
  }

  const now = nowIso();
  await execute(c.env.DB, "UPDATE edit_jobs SET status = 'cancelled', finished_at = ? WHERE id = ?", [
    now,
    job.id,
  ]);

  if (job.reservation_id) {
    const wallet = await getWalletService(c.env);
    await wallet.release(job.reservation_id, 'Cancelado pelo usuário');
  }

  return c.json({ message: 'Edição cancelada e créditos liberados.' });
});

export default editRoutes;
