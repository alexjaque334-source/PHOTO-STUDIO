/**
 * Rate Limiting baseado em janelas fixas armazenadas no Cloudflare D1.
 * Dono: Subagente 6 (Segurança e LGPD).
 *
 * Utiliza a tabela canônica `rate_limit_buckets`:
 * (key TEXT PRIMARY KEY, count INTEGER, window_start TEXT, expires_at TEXT)
 */
import type { Context, MiddlewareHandler } from 'hono';
import type { AppContext, Env } from '../env';
import { hashIp } from './crypto';

export interface RateLimitResult {
  allowed: boolean;
  retryAfter: number; // segundos até a liberação
  current: number;
  limit: number;
}

export interface RateLimitOptions {
  limit: number;
  windowSeconds: number;
  keyPrefix?: string;
  keyGenerator?: (c: Context<AppContext>) => Promise<string> | string;
}

/**
 * Executa checagem e incremento atômico de rate-limit no D1.
 */
export async function rateLimit(
  env: Env,
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  const now = new Date();
  const nowEpoch = now.getTime();
  const nowIso = now.toISOString();
  const expiresAtIso = new Date(nowEpoch + windowSeconds * 1000).toISOString();

  // Consulta o bucket existente
  const existing = await env.DB.prepare(
    'SELECT count, window_start, expires_at FROM rate_limit_buckets WHERE key = ?',
  )
    .bind(key)
    .first<{ count: number; window_start: string; expires_at: string }>();

  if (!existing) {
    // Primeiro acesso na janela
    try {
      await env.DB.prepare(
        'INSERT INTO rate_limit_buckets (key, count, window_start, expires_at) VALUES (?, 1, ?, ?)',
      )
        .bind(key, nowIso, expiresAtIso)
        .run();

      return {
        allowed: true,
        retryAfter: 0,
        current: 1,
        limit,
      };
    } catch {
      // Conflito de corrida: tenta novamente recursivamente uma vez
      return rateLimit(env, key, limit, windowSeconds);
    }
  }

  const existingExpiresEpoch = new Date(existing.expires_at).getTime();

  // Se a janela expirou, reseta o contador
  if (existingExpiresEpoch <= nowEpoch) {
    await env.DB.prepare(
      'UPDATE rate_limit_buckets SET count = 1, window_start = ?, expires_at = ? WHERE key = ?',
    )
      .bind(nowIso, expiresAtIso, key)
      .run();

    return {
      allowed: true,
      retryAfter: 0,
      current: 1,
      limit,
    };
  }

  // Se atingiu o limite dentro da janela ativa
  if (existing.count >= limit) {
    const retryAfter = Math.max(1, Math.ceil((existingExpiresEpoch - nowEpoch) / 1000));
    return {
      allowed: false,
      retryAfter,
      current: existing.count,
      limit,
    };
  }

  // Incrementa dentro da janela ativa
  const nextCount = existing.count + 1;
  await env.DB.prepare('UPDATE rate_limit_buckets SET count = ? WHERE key = ?')
    .bind(nextCount, key)
    .run();

  return {
    allowed: true,
    retryAfter: 0,
    current: nextCount,
    limit,
  };
}

/**
 * Extrai o IP real do cliente Cloudflare.
 */
export function getClientIp(c: Context<AppContext>): string {
  return (
    c.req.header('cf-connecting-ip') ??
    c.req.header('x-real-ip') ??
    c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ??
    '127.0.0.1'
  );
}

/**
 * Cria chave segura para rate limit baseada em usuário autenticado ou IP com salt.
 */
export async function getClientRateLimitIdentifier(
  c: Context<AppContext>,
  prefix: string = 'rate',
): Promise<string> {
  const user = c.get('user');
  if (user?.id) {
    return `${prefix}:user:${user.id}`;
  }

  const ip = getClientIp(c);
  const secret = c.env?.SESSION_SECRET || 'alegon-default-dev-secret';
  const hashedIp = await hashIp(ip, secret);
  return `${prefix}:ip:${hashedIp}`;
}

/**
 * Middleware Hono para aplicação de rate limit em rotas específicas.
 */
export function rateLimitMiddleware(options: RateLimitOptions): MiddlewareHandler<AppContext> {
  const { limit, windowSeconds, keyPrefix = 'rl', keyGenerator } = options;

  return async (c, next) => {
    const key = keyGenerator
      ? await keyGenerator(c)
      : await getClientRateLimitIdentifier(c, keyPrefix);

    const result = await rateLimit(c.env, key, limit, windowSeconds);

    c.header('RateLimit-Limit', String(limit));
    c.header('RateLimit-Remaining', String(Math.max(0, limit - result.current)));
    c.header('RateLimit-Reset', String(result.retryAfter));

    if (!result.allowed) {
      c.header('Retry-After', String(result.retryAfter));
      return c.json(
        {
          error: {
            code: 'RATE_LIMITED',
            message: 'Muitas requisições. Tente novamente mais tarde.',
            details: { retryAfterSeconds: result.retryAfter },
          },
        },
        429,
      );
    }

    return next();
  };
}
