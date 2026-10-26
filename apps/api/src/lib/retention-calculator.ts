import type { D1Database } from '@cloudflare/workers-types';
import { queryOne } from '../db';

/**
 * Retorna os dias de retenção de armazenamento para o usuário:
 * - Plano Business: 90 dias
 * - Plano Pro: 60 dias
 * - Plano Pessoal: 45 dias
 * - Pacote Profissional: 50 dias
 * - Demais pacotes avulsos (Criador, Inicial, Avulso) e padrão: 30 dias
 */
export async function calculateUserRetentionDays(db: D1Database, userId: string): Promise<number> {
  try {
    // 1. Assinatura ativa (recorrência)
    const sub = await queryOne<{ plan_code: string }>(
      db,
      `SELECT p.code as plan_code 
       FROM user_subscriptions s
       JOIN plans p ON p.id = s.plan_id
       WHERE s.user_id = ? AND s.status IN ('active', 'trialing')
       ORDER BY p.price_cents DESC LIMIT 1`,
      [userId],
    );

    if (sub) {
      if (sub.plan_code === 'business') return 90;
      if (sub.plan_code === 'pro') return 60;
      if (sub.plan_code === 'pessoal') return 45;
    }

    // 2. Pacote Profissional comprado
    const order = await queryOne<{ product_code: string }>(
      db,
      `SELECT p.code as product_code
       FROM orders o
       JOIN products p ON p.id = o.product_id
       WHERE o.user_id = ? AND o.status = 'paid' AND p.code = 'pack_profissional'
       LIMIT 1`,
      [userId],
    );

    if (order) {
      return 50;
    }
  } catch (err) {
    console.warn('[retention-calculator] Erro ao consultar regras de retenção:', err);
  }

  // Pacotes avulsos até criador e padrão: 30 dias
  return 30;
}
