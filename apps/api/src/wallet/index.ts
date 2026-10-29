/**
 * ALEGON AI Photo Studio — Motor de Carteira e Créditos (Canônico)
 * Dono: Subagente 5 (Asaas e Billing)
 *
 * Implementação completa da interface WalletService:
 * - getBalance(userId)
 * - reserve(input) - atômico e idempotente
 * - consume(reservationId) - atômico e idempotente
 * - release(reservationId, reason) - atômico e idempotente
 * - grant(input) - atômico e idempotente
 * - debit(input) - seguro contra saldo negativo
 */
import type { Env } from '../env';
import {
  type CreditBucket,
  type WalletBalance,
  type WalletService,
  DomainError,
  InsufficientCreditsError,
} from '../contracts';
import { newId, nowIso, addDays } from '../lib/http';

export function addMinutes(iso: string, minutes: number): string {
  return new Date(new Date(iso).getTime() + minutes * 60_000).toISOString();
}

interface LotRow {
  id: string;
  user_id: string;
  bucket: string;
  amount_initial: number;
  amount_remaining: number;
  source_type: string;
  source_id: string | null;
  expires_at: string | null;
  created_at: string;
}

interface ReservationRow {
  id: string;
  user_id: string;
  edit_request_id: string;
  amount: number;
  allocation_json: string;
  status: 'active' | 'consumed' | 'released';
  created_at: string;
  expires_at: string;
  settled_at: string | null;
  release_reason: string | null;
}

interface WalletRow {
  user_id: string;
  purchased_balance: number;
  subscription_balance: number;
  reserved: number;
  version: number;
  updated_at: string;
}

export function createWalletService(env: Env): WalletService {
  const db = env.DB;

  async function ensureWallet(userId: string): Promise<WalletRow> {
    const existing = await db
      .prepare(
        'SELECT user_id, purchased_balance, subscription_balance, reserved, version, updated_at FROM wallets WHERE user_id = ?',
      )
      .bind(userId)
      .first<WalletRow>();

    if (existing) {
      return existing;
    }

    const now = nowIso();
    await db
      .prepare(
        'INSERT INTO wallets (user_id, purchased_balance, subscription_balance, reserved, version, updated_at) VALUES (?, 0, 0, 0, 0, ?) ON CONFLICT (user_id) DO NOTHING',
      )
      .bind(userId, now)
      .run();

    const created = await db
      .prepare(
        'SELECT user_id, purchased_balance, subscription_balance, reserved, version, updated_at FROM wallets WHERE user_id = ?',
      )
      .bind(userId)
      .first<WalletRow>();

    return (
      created ?? {
        user_id: userId,
        purchased_balance: 0,
        subscription_balance: 0,
        reserved: 0,
        version: 0,
        updated_at: now,
      }
    );
  }

  async function releaseInternal(reservationId: string, reason: string): Promise<void> {
    const res = await db
      .prepare('SELECT id, user_id, amount, status FROM credit_reservations WHERE id = ?')
      .bind(reservationId)
      .first<ReservationRow>();

    if (!res) {
      throw new DomainError('NOT_FOUND', 'Reserva de créditos não encontrada.', 404);
    }

    if (res.status === 'released') {
      return; // Idempotente
    }

    if (res.status === 'consumed') {
      throw new DomainError(
        'ALREADY_CONSUMED',
        'A reserva já foi consumida definitivamente e não pode ser liberada.',
        409,
      );
    }

    const now = nowIso();
    const statements = [
      // 1. Marca reserva como liberada
      db
        .prepare(
          `UPDATE credit_reservations 
           SET status = 'released', settled_at = ?, release_reason = ? 
           WHERE id = ? AND status = 'active'`,
        )
        .bind(now, reason, reservationId),

      // 2. Devolve o montante bloqueado em reserved
      db
        .prepare(
          `UPDATE wallets 
           SET reserved = MAX(0, reserved - ?), updated_at = ? 
           WHERE user_id = ?`,
        )
        .bind(res.amount, now, res.user_id),

      // 3. Registra auditoria da liberação no ledger
      db
        .prepare(
          `INSERT INTO credit_transactions (
            id, user_id, type, amount, reference_type, reference_id, idempotency_key, note, created_at
          ) VALUES (?, ?, 'release', 0, 'credit_reservation', ?, ?, ?, ?)`,
        )
        .bind(
          newId(),
          res.user_id,
          reservationId,
          `release:${reservationId}`,
          `Liberação de reserva: ${reason}`,
          now,
        ),
    ];

    await db.batch(statements);
  }

  return {
    async getBalance(userId: string): Promise<WalletBalance> {
      const now = nowIso();

      // Auto-reconciliação de segurança: estorna reservas órfãs, falhas ou expiradas
      try {
        const staleReservations = await db
          .prepare(
            `SELECT r.id, r.amount 
             FROM credit_reservations r
             LEFT JOIN edit_jobs j ON j.reservation_id = r.id
             WHERE r.user_id = ? 
               AND r.status = 'active'
               AND (
                 (r.expires_at IS NOT NULL AND r.expires_at <= ?)
                 OR j.status IN ('failed', 'cancelled')
                 OR (j.created_at IS NOT NULL AND datetime(j.created_at, '+2 minutes') <= datetime(?))
               )`,
          )
          .bind(userId, now, now)
          .all<{ id: string; amount: number }>();

        if (staleReservations.results && staleReservations.results.length > 0) {
          for (const stale of staleReservations.results) {
            await releaseInternal(stale.id, 'Estorno automático de segurança por não conclusão');
          }
        }

        // Sincroniza atomicamente o campo `reserved` da carteira com o total real de reservas ativas
        const activeSum = await db
          .prepare(
            `SELECT COALESCE(SUM(amount), 0) as total_active 
             FROM credit_reservations 
             WHERE user_id = ? AND status = 'active'`,
          )
          .bind(userId)
          .first<{ total_active: number }>();

        const trueReserved = activeSum?.total_active ?? 0;
        await db
          .prepare('UPDATE wallets SET reserved = ?, updated_at = ? WHERE user_id = ? AND reserved != ?')
          .bind(trueReserved, now, userId, trueReserved)
          .run();
      } catch (reconcileErr) {
        console.warn('[Wallet] Aviso na auto-reconciliação:', reconcileErr);
      }

      const wallet = await ensureWallet(userId);
      const inSevenDays = addDays(now, 7);

      // Busca lotes que expiram nos próximos 7 dias
      const expiringRows = await db
        .prepare(
          `SELECT bucket, amount_remaining, expires_at 
           FROM credit_lots 
           WHERE user_id = ? 
             AND amount_remaining > 0 
             AND expires_at IS NOT NULL 
             AND expires_at > ? 
             AND expires_at <= ? 
           ORDER BY expires_at ASC`,
        )
        .bind(userId, now, inSevenDays)
        .all<{ bucket: CreditBucket; amount_remaining: number; expires_at: string }>();

      const expiringSoon = (expiringRows.results ?? []).map((row) => ({
        bucket: row.bucket,
        amount: row.amount_remaining,
        expiresAt: row.expires_at,
      }));

      const totalBalance = wallet.purchased_balance + wallet.subscription_balance;
      const available = Math.max(0, totalBalance - wallet.reserved);

      return {
        purchased: wallet.purchased_balance,
        subscription: wallet.subscription_balance,
        reserved: wallet.reserved,
        available,
        expiringSoon,
      };
    },

    async reserve(input: {
      userId: string;
      editRequestId: string;
      amount: number;
      ttlMinutes?: number;
    }): Promise<{ reservationId: string }> {
      const { userId, editRequestId, amount, ttlMinutes = 30 } = input;
      if (amount <= 0) {
        throw new DomainError('INVALID_AMOUNT', 'Quantidade de créditos para reserva deve ser positiva.', 400);
      }

      // Idempotência por editRequestId
      const existing = await db
        .prepare('SELECT id, status, amount FROM credit_reservations WHERE edit_request_id = ?')
        .bind(editRequestId)
        .first<ReservationRow>();

      if (existing) {
        if (existing.status === 'active' || existing.status === 'consumed') {
          return { reservationId: existing.id };
        }
        if (existing.status === 'released') {
          throw new DomainError(
            'RESERVATION_RELEASED',
            'A reserva vinculada a esta requisição já foi liberada e não pode ser reutilizada.',
            409,
          );
        }
      }

      const wallet = await ensureWallet(userId);
      const available = wallet.purchased_balance + wallet.subscription_balance - wallet.reserved;

      if (available < amount) {
        throw new InsufficientCreditsError(amount, Math.max(0, available));
      }

      const now = nowIso();

      // Ordem canônica de consumo:
      // 1. Assinatura (vencem no fim do ciclo)
      // 2. Comprados (FIFO por expires_at)
      const subLots = await db
        .prepare(
          `SELECT id, user_id, bucket, amount_initial, amount_remaining, source_type, source_id, expires_at, created_at 
           FROM credit_lots 
           WHERE user_id = ? 
             AND bucket = 'subscription' 
             AND amount_remaining > 0 
             AND (expires_at IS NULL OR expires_at > ?) 
           ORDER BY expires_at ASC, created_at ASC`,
        )
        .bind(userId, now)
        .all<LotRow>();

      const purchasedLots = await db
        .prepare(
          `SELECT id, user_id, bucket, amount_initial, amount_remaining, source_type, source_id, expires_at, created_at 
           FROM credit_lots 
           WHERE user_id = ? 
             AND bucket = 'purchased' 
             AND amount_remaining > 0 
             AND (expires_at IS NULL OR expires_at > ?) 
           ORDER BY expires_at ASC, created_at ASC`,
        )
        .bind(userId, now)
        .all<LotRow>();

      const allCandidateLots = [...(subLots.results ?? []), ...(purchasedLots.results ?? [])];

      let remainingToAllocate = amount;
      const allocations: Array<{ lotId: string; bucket: CreditBucket; amount: number }> = [];

      for (const lot of allCandidateLots) {
        if (remainingToAllocate <= 0) break;
        const take = Math.min(lot.amount_remaining, remainingToAllocate);
        allocations.push({
          lotId: lot.id,
          bucket: lot.bucket as CreditBucket,
          amount: take,
        });
        remainingToAllocate -= take;
      }

      // Se por eventual divergência faltou lote mapeado, aloca o residual no bucket de maior saldo
      if (remainingToAllocate > 0) {
        const fallbackBucket: CreditBucket =
          wallet.subscription_balance >= remainingToAllocate ? 'subscription' : 'purchased';
        allocations.push({
          lotId: 'virtual_balance',
          bucket: fallbackBucket,
          amount: remainingToAllocate,
        });
      }

      const reservationId = newId();
      const expiresAt = addMinutes(now, ttlMinutes);
      const idempotencyKey = `reserve:${editRequestId}`;

      // Execução atômica no D1
      const statements = [
        db
          .prepare(
            `INSERT INTO credit_reservations (
              id, user_id, edit_request_id, amount, allocation_json, status, created_at, expires_at
            ) VALUES (?, ?, ?, ?, ?, 'active', ?, ?)`,
          )
          .bind(
            reservationId,
            userId,
            editRequestId,
            amount,
            JSON.stringify(allocations),
            now,
            expiresAt,
          ),
        db
          .prepare(
            `UPDATE wallets 
             SET reserved = reserved + ?, updated_at = ? 
             WHERE user_id = ?`,
          )
          .bind(amount, now, userId),
        db
          .prepare(
            `INSERT INTO credit_transactions (
              id, user_id, type, amount, reference_type, reference_id, idempotency_key, note, created_at
            ) VALUES (?, ?, 'reserve', ?, 'edit_request', ?, ?, 'Reserva atômica para edição de imagem', ?)`,
          )
          .bind(newId(), userId, -amount, editRequestId, idempotencyKey, now),
      ];

      await db.batch(statements);

      return { reservationId };
    },

    async consume(reservationId: string): Promise<void> {
      const res = await db
        .prepare(
          'SELECT id, user_id, amount, allocation_json, status FROM credit_reservations WHERE id = ?',
        )
        .bind(reservationId)
        .first<ReservationRow>();

      if (!res) {
        throw new DomainError('NOT_FOUND', 'Reserva de créditos não encontrada.', 404);
      }

      if (res.status === 'consumed') {
        return; // Idempotente
      }

      if (res.status === 'released') {
        throw new DomainError(
          'RESERVATION_RELEASED',
          'A reserva já foi liberada e não pode ser consumida.',
          409,
        );
      }

      const now = nowIso();
      const allocations = JSON.parse(res.allocation_json) as Array<{
        lotId: string;
        bucket: CreditBucket;
        amount: number;
      }>;

      let subToDeduct = 0;
      let purchasedToDeduct = 0;

      for (const a of allocations) {
        if (a.bucket === 'subscription') {
          subToDeduct += a.amount;
        } else {
          purchasedToDeduct += a.amount;
        }
      }

      const statements: D1PreparedStatement[] = [
        // 1. Marca reserva como consumida
        db
          .prepare(
            `UPDATE credit_reservations 
             SET status = 'consumed', settled_at = ? 
             WHERE id = ? AND status = 'active'`,
          )
          .bind(now, reservationId),

        // 2. Atualiza saldos da carteira
        db
          .prepare(
            `UPDATE wallets 
             SET reserved = MAX(0, reserved - ?), 
                 subscription_balance = MAX(0, subscription_balance - ?), 
                 purchased_balance = MAX(0, purchased_balance - ?), 
                 updated_at = ? 
             WHERE user_id = ?`,
          )
          .bind(res.amount, subToDeduct, purchasedToDeduct, now, res.user_id),
      ];

      // 3. Atualiza cada lote e insere transações
      for (const a of allocations) {
        if (a.lotId !== 'virtual_balance') {
          statements.push(
            db
              .prepare(
                `UPDATE credit_lots 
                 SET amount_remaining = MAX(0, amount_remaining - ?) 
                 WHERE id = ?`,
              )
              .bind(a.amount, a.lotId),
          );
        }

        statements.push(
          db
            .prepare(
              `INSERT INTO credit_transactions (
                id, user_id, type, bucket, amount, lot_id, reference_type, reference_id, idempotency_key, note, created_at
              ) VALUES (?, ?, 'consume', ?, ?, ?, 'credit_reservation', ?, ?, 'Consumo definitivo de edição', ?)`,
            )
            .bind(
              newId(),
              res.user_id,
              a.bucket,
              -a.amount,
              a.lotId === 'virtual_balance' ? null : a.lotId,
              reservationId,
              `consume:${reservationId}:${a.lotId}`,
              now,
            ),
        );
      }

      await db.batch(statements);
    },

    async release(reservationId: string, reason: string): Promise<void> {
      return releaseInternal(reservationId, reason);
    },

    async grant(input: {
      userId: string;
      bucket: CreditBucket;
      amount: number;
      type: 'grant_purchase' | 'grant_subscription' | 'grant_single_edit' | 'grant_admin';
      sourceType: string;
      sourceId: string;
      expiresAt: string | null;
      idempotencyKey: string;
      createdBy?: string;
      note?: string;
    }): Promise<{ lotId: string; alreadyApplied: boolean }> {
      const {
        userId,
        bucket,
        amount,
        type,
        sourceType,
        sourceId,
        expiresAt,
        idempotencyKey,
        createdBy,
        note,
      } = input;

      if (amount <= 0) {
        throw new DomainError('INVALID_AMOUNT', 'Quantidade de créditos a conceder deve ser maior que zero.', 400);
      }

      // Verificação de idempotência no ledger
      const existingTx = await db
        .prepare('SELECT id, lot_id FROM credit_transactions WHERE idempotency_key = ?')
        .bind(idempotencyKey)
        .first<{ id: string; lot_id: string | null }>();

      if (existingTx) {
        return { lotId: existingTx.lot_id ?? '', alreadyApplied: true };
      }

      await ensureWallet(userId);

      const lotId = newId();
      const now = nowIso();

      const statements = [
        // 1. Cria lote de crédito
        db
          .prepare(
            `INSERT INTO credit_lots (
              id, user_id, bucket, amount_initial, amount_remaining, source_type, source_id, expires_at, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          )
          .bind(lotId, userId, bucket, amount, amount, sourceType, sourceId, expiresAt, now),

        // 2. Atualiza saldo da carteira
        bucket === 'subscription'
          ? db
              .prepare(
                `UPDATE wallets 
                 SET subscription_balance = subscription_balance + ?, updated_at = ? 
                 WHERE user_id = ?`,
              )
              .bind(amount, now, userId)
          : db
              .prepare(
                `UPDATE wallets 
                 SET purchased_balance = purchased_balance + ?, updated_at = ? 
                 WHERE user_id = ?`,
              )
              .bind(amount, now, userId),

        // 3. Registra transação no ledger
        db
          .prepare(
            `INSERT INTO credit_transactions (
              id, user_id, type, bucket, amount, lot_id, reference_type, reference_id, idempotency_key, note, created_by, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          )
          .bind(
            newId(),
            userId,
            type,
            bucket,
            amount,
            lotId,
            sourceType,
            sourceId,
            idempotencyKey,
            note ?? 'Concessão de créditos',
            createdBy ?? null,
            now,
          ),
      ];

      await db.batch(statements);

      return { lotId, alreadyApplied: false };
    },

    async debit(input: {
      userId: string;
      amount: number;
      type: 'refund_reversal' | 'admin_debit';
      referenceId: string;
      idempotencyKey: string;
      createdBy?: string;
      note?: string;
    }): Promise<{ debited: number }> {
      const { userId, amount, type, referenceId, idempotencyKey, createdBy, note } = input;

      if (amount <= 0) {
        throw new DomainError('INVALID_AMOUNT', 'Quantidade de débito deve ser maior que zero.', 400);
      }

      // Idempotência
      const existingTx = await db
        .prepare('SELECT id, amount FROM credit_transactions WHERE idempotency_key = ?')
        .bind(idempotencyKey)
        .first<{ id: string; amount: number }>();

      if (existingTx) {
        return { debited: Math.abs(existingTx.amount) };
      }

      const wallet = await ensureWallet(userId);
      const totalBalance = wallet.purchased_balance + wallet.subscription_balance;
      const available = Math.max(0, totalBalance - wallet.reserved);

      if (available <= 0) {
        return { debited: 0 }; // Proteção estrita contra saldo negativo
      }

      const toDebit = Math.min(amount, available);
      const now = nowIso();

      // Busca lotes disponíveis para abater
      // Se for estorno de reembolso por pagamento, tenta abater do lote gerado pelo pagamento primeiro
      let targetLots: LotRow[] = [];
      if (type === 'refund_reversal') {
        const directLot = await db
          .prepare(
            `SELECT id, user_id, bucket, amount_initial, amount_remaining, source_type, source_id, expires_at, created_at 
             FROM credit_lots 
             WHERE source_id = ? AND amount_remaining > 0`,
          )
          .bind(referenceId)
          .first<LotRow>();

        if (directLot) {
          targetLots.push(directLot);
        }
      }

      // Se ainda precisa de mais créditos ou débito genérico, consome lotes purchased em ordem FIFO
      const generalLots = await db
        .prepare(
          `SELECT id, user_id, bucket, amount_initial, amount_remaining, source_type, source_id, expires_at, created_at 
           FROM credit_lots 
           WHERE user_id = ? AND amount_remaining > 0 
           ORDER BY expires_at ASC, created_at ASC`,
        )
        .bind(userId)
        .all<LotRow>();

      for (const l of generalLots.results ?? []) {
        if (!targetLots.some((t) => t.id === l.id)) {
          targetLots.push(l);
        }
      }

      let remaining = toDebit;
      let purchasedDeducted = 0;
      let subDeducted = 0;
      const statements: D1PreparedStatement[] = [];

      for (const lot of targetLots) {
        if (remaining <= 0) break;
        const take = Math.min(lot.amount_remaining, remaining);
        statements.push(
          db
            .prepare(
              'UPDATE credit_lots SET amount_remaining = MAX(0, amount_remaining - ?) WHERE id = ?',
            )
            .bind(take, lot.id),
        );
        if (lot.bucket === 'subscription') {
          subDeducted += take;
        } else {
          purchasedDeducted += take;
        }
        remaining -= take;
      }

      // Se sobrou algum débito não alocado a lote (ex: virtual balance), desconta do purchased ou subscription
      if (remaining > 0) {
        if (wallet.purchased_balance >= remaining) {
          purchasedDeducted += remaining;
        } else {
          subDeducted += remaining;
        }
      }

      // Atualiza wallet
      statements.push(
        db
          .prepare(
            `UPDATE wallets 
             SET purchased_balance = MAX(0, purchased_balance - ?), 
                 subscription_balance = MAX(0, subscription_balance - ?), 
                 updated_at = ? 
             WHERE user_id = ?`,
          )
          .bind(purchasedDeducted, subDeducted, now, userId),
      );

      // Registra transação de débito no ledger
      statements.push(
        db
          .prepare(
            `INSERT INTO credit_transactions (
              id, user_id, type, amount, reference_type, reference_id, idempotency_key, note, created_by, created_at
            ) VALUES (?, ?, ?, ?, 'debit_reference', ?, ?, ?, ?, ?)`,
          )
          .bind(
            newId(),
            userId,
            type,
            -toDebit,
            referenceId,
            idempotencyKey,
            note ?? 'Débito / Reversão de créditos',
            createdBy ?? null,
            now,
          ),
      );

      await db.batch(statements);

      return { debited: toDebit };
    },
  };
}
