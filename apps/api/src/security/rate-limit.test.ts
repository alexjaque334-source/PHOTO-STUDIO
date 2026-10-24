import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';
import type { AppContext, Env } from '../env';
import { rateLimit, rateLimitMiddleware } from './rate-limit';

function createMockD1Database() {
  const store = new Map<string, { count: number; window_start: string; expires_at: string }>();

  return {
    prepare(query: string) {
      let boundArgs: any[] = [];
      return {
        bind(...args: any[]) {
          boundArgs = args;
          return this;
        },
        async first<T = unknown>(): Promise<T | null> {
          if (query.includes('SELECT count, window_start, expires_at')) {
            const key = boundArgs[0];
            const item = store.get(key);
            return (item as T) || null;
          }
          return null;
        },
        async run() {
          if (query.includes('INSERT INTO rate_limit_buckets')) {
            const [key, window_start, expires_at] = boundArgs;
            store.set(key, { count: 1, window_start, expires_at });
          } else if (query.includes('UPDATE rate_limit_buckets SET count = 1')) {
            const [window_start, expires_at, key] = boundArgs;
            store.set(key, { count: 1, window_start, expires_at });
          } else if (query.includes('UPDATE rate_limit_buckets SET count = ?')) {
            const [nextCount, key] = boundArgs;
            const existing = store.get(key);
            if (existing) {
              existing.count = nextCount;
            }
          }
          return { success: true };
        },
      };
    },
  } as unknown as D1Database;
}

describe('rate-limit module', () => {
  it('allows requests within limit and increments counter', async () => {
    const mockDb = createMockD1Database();
    const env = { DB: mockDb } as Env;

    const r1 = await rateLimit(env, 'test:user1', 3, 60);
    expect(r1.allowed).toBe(true);
    expect(r1.current).toBe(1);

    const r2 = await rateLimit(env, 'test:user1', 3, 60);
    expect(r2.allowed).toBe(true);
    expect(r2.current).toBe(2);

    const r3 = await rateLimit(env, 'test:user1', 3, 60);
    expect(r3.allowed).toBe(true);
    expect(r3.current).toBe(3);

    // Quarto acesso deve ser bloqueado
    const r4 = await rateLimit(env, 'test:user1', 3, 60);
    expect(r4.allowed).toBe(false);
    expect(r4.retryAfter).toBeGreaterThan(0);
  });

  it('middleware sets standard headers and returns 429 when rate limited', async () => {
    const mockDb = createMockD1Database();
    const app = new Hono<AppContext>();

    app.use('*', async (c, next) => {
      c.env = {
        DB: mockDb,
        SESSION_SECRET: 'test-secret',
        ENVIRONMENT: 'production',
      } as any;
      await next();
    });

    app.use(
      '/api/limited',
      rateLimitMiddleware({
        limit: 1,
        windowSeconds: 30,
        keyGenerator: () => 'fixed-test-key',
      }),
    );
    app.get('/api/limited', (c) => c.json({ success: true }));

    // Requisição 1: permitida
    const res1 = await app.request('/api/limited');
    expect(res1.status).toBe(200);
    expect(res1.headers.get('RateLimit-Limit')).toBe('1');
    expect(res1.headers.get('RateLimit-Remaining')).toBe('0');

    // Requisição 2: bloqueada com 429
    const res2 = await app.request('/api/limited');
    expect(res2.status).toBe(429);
    expect(res2.headers.get('Retry-After')).toBeDefined();
    const body: any = await res2.json();
    expect(body.error.code).toBe('RATE_LIMITED');
  });
});
