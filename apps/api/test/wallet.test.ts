/**
 * Testes unitários do motor de Carteira e Créditos — ALEGON AI Photo Studio.
 * Dono: Subagente 8 (QA e Testes).
 */
import { describe, expect, it, beforeEach } from 'vitest';
import { createWalletService } from '../src/wallet';
import { createMockD1 } from './mock-d1';
import { nowIso, addDays } from '../src/lib/http';
import { DomainError, InsufficientCreditsError } from '../src/contracts';

describe('Motor de Carteira de Créditos (WalletService)', () => {
  let mock: ReturnType<typeof createMockD1>;
  let walletService: ReturnType<typeof createWalletService>;
  const userId = 'user-wallet-test-1';

  beforeEach(() => {
    mock = createMockD1();
    const env: any = { DB: mock.d1 };
    walletService = createWalletService(env);

    const now = nowIso();
    mock.sqlite.exec(`
      INSERT INTO users (id, email, password_hash, status, created_at, updated_at)
      VALUES ('${userId}', 'wallet@alegon.com.br', 'fake-hash', 'active', '${now}', '${now}');
    `);
  });

  describe('Consulta de Saldo e Carteira Inicial', () => {
    it('deve inicializar automaticamente a carteira com saldo zero para novo usuário', async () => {
      const balance = await walletService.getBalance(userId);

      expect(balance.purchased).toBe(0);
      expect(balance.subscription).toBe(0);
      expect(balance.reserved).toBe(0);
      expect(balance.available).toBe(0);
      expect(balance.expiringSoon).toEqual([]);
    });

    it('deve listar corretamente lotes que expiram nos próximos 7 dias', async () => {
      const now = nowIso();
      const inThreeDays = addDays(now, 3);
      const inTwentyDays = addDays(now, 20);

      // Concede lote com vencimento em 3 dias
      await walletService.grant({
        userId,
        bucket: 'purchased',
        amount: 15,
        type: 'grant_purchase',
        sourceType: 'payment',
        sourceId: 'pay-1',
        expiresAt: inThreeDays,
        idempotencyKey: 'grant-pay-1',
      });

      // Concede lote com vencimento em 20 dias
      await walletService.grant({
        userId,
        bucket: 'purchased',
        amount: 50,
        type: 'grant_purchase',
        sourceType: 'payment',
        sourceId: 'pay-2',
        expiresAt: inTwentyDays,
        idempotencyKey: 'grant-pay-2',
      });

      const balance = await walletService.getBalance(userId);
      expect(balance.available).toBe(65);
      expect(balance.expiringSoon.length).toBe(1);
      expect(balance.expiringSoon[0]!.amount).toBe(15);
      expect(balance.expiringSoon[0]!.expiresAt).toBe(inThreeDays);
    });
  });

  describe('Concessão de Créditos (grant) e Idempotência', () => {
    it('deve conceder créditos de compra e atualizar saldo', async () => {
      const result = await walletService.grant({
        userId,
        bucket: 'purchased',
        amount: 100,
        type: 'grant_purchase',
        sourceType: 'payment',
        sourceId: 'pay-100',
        expiresAt: addDays(nowIso(), 365),
        idempotencyKey: 'idem-grant-100',
        note: 'Compra de pacote avulso',
      });

      expect(result.lotId).toBeDefined();
      expect(result.alreadyApplied).toBe(false);

      const balance = await walletService.getBalance(userId);
      expect(balance.purchased).toBe(100);
      expect(balance.available).toBe(100);
    });

    it('deve ser estritamente idempotente por idempotencyKey sem duplicar saldo', async () => {
      const input = {
        userId,
        bucket: 'subscription' as const,
        amount: 200,
        type: 'grant_subscription' as const,
        sourceType: 'subscription_cycle',
        sourceId: 'sub-cycle-1',
        expiresAt: addDays(nowIso(), 30),
        idempotencyKey: 'idem-sub-cycle-1',
      };

      const first = await walletService.grant(input);
      expect(first.alreadyApplied).toBe(false);

      const second = await walletService.grant(input);
      expect(second.alreadyApplied).toBe(true);
      expect(second.lotId).toBe(first.lotId);

      const balance = await walletService.getBalance(userId);
      expect(balance.subscription).toBe(200); // Não duplicou para 400
      expect(balance.available).toBe(200);
    });

    it('deve rejeitar valor de crédito menor ou igual a zero', async () => {
      await expect(
        walletService.grant({
          userId,
          bucket: 'purchased',
          amount: 0,
          type: 'grant_purchase',
          sourceType: 'payment',
          sourceId: 'pay-0',
          expiresAt: null,
          idempotencyKey: 'idem-zero',
        }),
      ).rejects.toThrow(DomainError);
    });
  });

  describe('Reserva Atômica de Créditos (reserve)', () => {
    it('deve lançar InsufficientCreditsError se saldo for insuficiente', async () => {
      await expect(
        walletService.reserve({
          userId,
          editRequestId: 'req-falha-saldo',
          amount: 5,
        }),
      ).rejects.toThrow(InsufficientCreditsError);
    });

    it('deve reservar créditos, deduzir de available e incrementar reserved', async () => {
      await walletService.grant({
        userId,
        bucket: 'purchased',
        amount: 10,
        type: 'grant_purchase',
        sourceType: 'payment',
        sourceId: 'pay-res',
        expiresAt: null,
        idempotencyKey: 'grant-res',
      });

      const { reservationId } = await walletService.reserve({
        userId,
        editRequestId: 'req-edit-1',
        amount: 2,
      });

      expect(reservationId).toBeDefined();

      const balance = await walletService.getBalance(userId);
      expect(balance.purchased).toBe(10);
      expect(balance.reserved).toBe(2);
      expect(balance.available).toBe(8); // 10 - 2
    });

    it('deve ser idempotente por editRequestId retornando a mesma reserva', async () => {
      await walletService.grant({
        userId,
        bucket: 'purchased',
        amount: 20,
        type: 'grant_purchase',
        sourceType: 'payment',
        sourceId: 'pay-idem',
        expiresAt: null,
        idempotencyKey: 'grant-idem',
      });

      const res1 = await walletService.reserve({
        userId,
        editRequestId: 'req-edit-idem',
        amount: 3,
      });

      const res2 = await walletService.reserve({
        userId,
        editRequestId: 'req-edit-idem',
        amount: 3,
      });

      expect(res1.reservationId).toBe(res2.reservationId);

      const balance = await walletService.getBalance(userId);
      expect(balance.reserved).toBe(3); // Reservou apenas 3, não 6
      expect(balance.available).toBe(17);
    });
  });

  describe('Consumo Definitivo (consume) e Ordem Canônica de Débito', () => {
    it('deve consumir créditos prioritariamente do bucket subscription antes de purchased', async () => {
      // Concede 2 créditos de assinatura
      await walletService.grant({
        userId,
        bucket: 'subscription',
        amount: 2,
        type: 'grant_subscription',
        sourceType: 'sub',
        sourceId: 'sub-1',
        expiresAt: addDays(nowIso(), 10),
        idempotencyKey: 'g-sub',
      });

      // Concede 5 créditos comprados
      await walletService.grant({
        userId,
        bucket: 'purchased',
        amount: 5,
        type: 'grant_purchase',
        sourceType: 'pay',
        sourceId: 'pay-1',
        expiresAt: addDays(nowIso(), 365),
        idempotencyKey: 'g-pur',
      });

      // Reserva 3 créditos (deve alocar 2 de subscription + 1 de purchased)
      const { reservationId } = await walletService.reserve({
        userId,
        editRequestId: 'req-multi-bucket',
        amount: 3,
      });

      // Consumo definitivo
      await walletService.consume(reservationId);

      const balance = await walletService.getBalance(userId);
      expect(balance.reserved).toBe(0);
      expect(balance.subscription).toBe(0); // 2 consumidos
      expect(balance.purchased).toBe(4);    // 1 consumido de 5
      expect(balance.available).toBe(4);
    });

    it('deve ser idempotente se chamado repetidas vezes', async () => {
      await walletService.grant({
        userId,
        bucket: 'purchased',
        amount: 10,
        type: 'grant_purchase',
        sourceType: 'pay',
        sourceId: 'pay-c-idem',
        expiresAt: null,
        idempotencyKey: 'g-c-idem',
      });

      const { reservationId } = await walletService.reserve({
        userId,
        editRequestId: 'req-consume-repeat',
        amount: 4,
      });

      await walletService.consume(reservationId);
      await walletService.consume(reservationId); // Repetição

      const balance = await walletService.getBalance(userId);
      expect(balance.purchased).toBe(6);
      expect(balance.reserved).toBe(0);
      expect(balance.available).toBe(6);
    });
  });

  describe('Liberação de Reserva por Falha Técnica (release)', () => {
    it('deve liberar créditos bloqueados e restaurá-los ao saldo disponível', async () => {
      await walletService.grant({
        userId,
        bucket: 'purchased',
        amount: 10,
        type: 'grant_purchase',
        sourceType: 'pay',
        sourceId: 'pay-rel',
        expiresAt: null,
        idempotencyKey: 'g-rel',
      });

      const { reservationId } = await walletService.reserve({
        userId,
        editRequestId: 'req-release-test',
        amount: 4,
      });

      let balance = await walletService.getBalance(userId);
      expect(balance.reserved).toBe(4);
      expect(balance.available).toBe(6);

      // Falha técnica na IA -> libera reserva
      await walletService.release(reservationId, 'AI_TIMEOUT');

      balance = await walletService.getBalance(userId);
      expect(balance.reserved).toBe(0);
      expect(balance.available).toBe(10);
    });

    it('deve ser idempotente em chamadas repetidas de release', async () => {
      await walletService.grant({
        userId,
        bucket: 'purchased',
        amount: 8,
        type: 'grant_purchase',
        sourceType: 'pay',
        sourceId: 'pay-rel-repeat',
        expiresAt: null,
        idempotencyKey: 'g-rel-repeat',
      });

      const { reservationId } = await walletService.reserve({
        userId,
        editRequestId: 'req-rel-repeat',
        amount: 2,
      });

      await walletService.release(reservationId, 'ERRO_1');
      await walletService.release(reservationId, 'ERRO_2');

      const balance = await walletService.getBalance(userId);
      expect(balance.reserved).toBe(0);
      expect(balance.available).toBe(8);
    });

    it('deve proibir liberação de uma reserva que já foi consumida', async () => {
      await walletService.grant({
        userId,
        bucket: 'purchased',
        amount: 5,
        type: 'grant_purchase',
        sourceType: 'pay',
        sourceId: 'pay-con-rel',
        expiresAt: null,
        idempotencyKey: 'g-con-rel',
      });

      const { reservationId } = await walletService.reserve({
        userId,
        editRequestId: 'req-con-then-rel',
        amount: 2,
      });

      await walletService.consume(reservationId);

      await expect(
        walletService.release(reservationId, 'tentativa errônea'),
      ).rejects.toThrow(DomainError);
    });
  });

  describe('Proteção Rigorosa contra Saldo Negativo (debit)', () => {
    it('deve debitar no máximo o saldo disponível e nunca deixar a carteira negativa', async () => {
      // Concede 5 créditos
      await walletService.grant({
        userId,
        bucket: 'purchased',
        amount: 5,
        type: 'grant_purchase',
        sourceType: 'pay',
        sourceId: 'pay-reb-1',
        expiresAt: null,
        idempotencyKey: 'g-reb-1',
      });

      // Tenta debitar 20 créditos (reembolso superior ao saldo remanescente)
      const debitResult = await walletService.debit({
        userId,
        amount: 20,
        type: 'refund_reversal',
        referenceId: 'pay-reb-1',
        idempotencyKey: 'debit-reb-1',
      });

      expect(debitResult.debited).toBe(5); // Debitou apenas os 5 disponíveis

      const balance = await walletService.getBalance(userId);
      expect(balance.purchased).toBe(0);
      expect(balance.available).toBe(0);
      expect(balance.purchased).toBeGreaterThanOrEqual(0);
    });

    it('não deve debitar nada se o saldo disponível já estiver zerado', async () => {
      const debitResult = await walletService.debit({
        userId,
        amount: 10,
        type: 'admin_debit',
        referenceId: 'adj-0',
        idempotencyKey: 'debit-zero',
      });

      expect(debitResult.debited).toBe(0);

      const balance = await walletService.getBalance(userId);
      expect(balance.available).toBe(0);
    });

    it('deve ser idempotente por idempotencyKey no débito', async () => {
      await walletService.grant({
        userId,
        bucket: 'purchased',
        amount: 15,
        type: 'grant_purchase',
        sourceType: 'pay',
        sourceId: 'pay-deb-idem',
        expiresAt: null,
        idempotencyKey: 'g-deb-idem',
      });

      const input = {
        userId,
        amount: 5,
        type: 'admin_debit' as const,
        referenceId: 'ref-deb-idem',
        idempotencyKey: 'idem-debit-5',
      };

      const d1 = await walletService.debit(input);
      expect(d1.debited).toBe(5);

      const d2 = await walletService.debit(input);
      expect(d2.debited).toBe(5);

      const balance = await walletService.getBalance(userId);
      expect(balance.purchased).toBe(10); // Debitou apenas 5 uma vez
    });
  });
});
