/**
 * Utilitários HTTP compartilhados — CANÔNICO (dono: Tech Lead).
 * Formato de erro padrão: { error: { code, message, details? } }
 * Paginação padrão: { items: T[], nextCursor: string | null }
 */
import type { Context, MiddlewareHandler } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { ZodError, type ZodSchema } from 'zod';
import type { AppContext } from '../env';
import { DomainError } from '../contracts';

export function nowIso(): string {
  return new Date().toISOString();
}

export function addDays(iso: string, days: number): string {
  return new Date(new Date(iso).getTime() + days * 86_400_000).toISOString();
}

/** UUID v7 (ordenável por tempo). */
export function newId(): string {
  const ts = BigInt(Date.now());
  const rand = crypto.getRandomValues(new Uint8Array(10));
  const hex = ts.toString(16).padStart(12, '0') + [...rand].map((b) => b.toString(16).padStart(2, '0')).join('');
  const h = hex.split('');
  h[12] = '7';
  h[16] = ((parseInt(h[16]!, 16) & 0x3) | 0x8).toString(16);
  const s = h.join('');
  return `${s.slice(0, 8)}-${s.slice(8, 12)}-${s.slice(12, 16)}-${s.slice(16, 20)}-${s.slice(20, 32)}`;
}

export function requestId(): MiddlewareHandler<AppContext> {
  return async (c, next) => {
    const id = c.req.header('cf-ray') ?? newId();
    c.set('requestId', id);
    await next();
    c.header('X-Request-Id', id);
  };
}

export async function parseJson<T>(c: Context<AppContext>, schema: ZodSchema<T>): Promise<T> {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    throw new DomainError('INVALID_JSON', 'Corpo da requisição inválido.', 400);
  }
  return schema.parse(body);
}

export function errorHandler(err: Error, c: Context<AppContext>) {
  if (err instanceof DomainError) {
    return c.json({ error: { code: err.code, message: err.message, details: err.details } }, err.status as ContentfulStatusCode);
  }
  if (err instanceof ZodError) {
    return c.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Dados inválidos.', details: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })) } },
      422,
    );
  }
  // Log estruturado sem dados sensíveis
  console.error(JSON.stringify({ level: 'error', requestId: c.get('requestId'), path: c.req.path, msg: err.message, stack: err.stack?.split('\n').slice(0, 5) }));
  return c.json({ error: { code: 'INTERNAL_ERROR', message: 'Erro interno. Tente novamente.' } }, 500);
}

export function log(level: 'info' | 'warn' | 'error', msg: string, fields: Record<string, unknown> = {}) {
  console[level === 'info' ? 'log' : level](JSON.stringify({ level, msg, ts: nowIso(), ...fields }));
}
