/**
 * ALEGON AI Photo Studio — Rotas da Carteira de Créditos
 * Dono: Subagente 5 (Asaas e Billing)
 *
 * Endpoints de consulta de saldo e extrato detalhado de créditos:
 * - Saldo disponível, reservado e buckets (purchased/subscription)
 * - Alerta de créditos a expirar nos próximos 7 dias
 * - Extrato paginado de movimentações (double-entry ledger)
 */
import { Hono } from 'hono';
import type { AppContext } from '../env';
import { requireAuth } from '../middleware/auth';
import { createWalletService } from '../wallet';
import { paginate } from '../db';

const walletApp = new Hono<AppContext>();

// ───────────────────────────── Saldo Consolidado ─────────────────────────────
walletApp.get('/', requireAuth(), async (c) => {
  const user = c.get('user');
  const walletService = createWalletService(c.env);

  const balance = await walletService.getBalance(user.id);
  return c.json(balance);
});

// ───────────────────────────── Extrato de Movimentações ─────────────────────────────
walletApp.get('/transactions', requireAuth(), async (c) => {
  const user = c.get('user');
  const cursor = c.req.query('cursor') ?? null;
  const limitParam = parseInt(c.req.query('limit') || '20', 10);

  const result = await paginate<{
    id: string;
    type: string;
    bucket: string | null;
    amount: number;
    note: string | null;
    created_at: string;
  }>(c.env.DB, {
    table: 'credit_transactions',
    select: 'id, type, bucket, amount, note, created_at',
    whereClause: 'user_id = ?',
    params: [user.id],
    sortColumn: 'created_at',
    order: 'DESC',
    cursor,
    limit: limitParam,
  });

  const items = result.items.map((tx) => ({
    id: tx.id,
    type: tx.type,
    bucket: tx.bucket,
    amount: tx.amount,
    note: tx.note,
    createdAt: tx.created_at,
  }));

  return c.json({
    items,
    nextCursor: result.nextCursor,
  });
});

export default walletApp;
