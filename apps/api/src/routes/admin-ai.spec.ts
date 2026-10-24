/**
 * Testes das rotas administrativas de IA — ALEGON AI Photo Studio.
 * Dono: Subagente OpenRouter.
 */

import { describe, expect, it, vi } from 'vitest';
import { Hono } from 'hono';
import adminAiRoutes from './admin-ai';
import type { AppContext } from '../env';
import { errorHandler } from '../lib/http';

describe('Rotas Admin AI (admin-ai.ts)', () => {
  function createApp(ctxOverride: Partial<AppContext['Variables']> = {}, dbMock: any = {}) {
    const app = new Hono<AppContext>();
    app.use('*', async (c, next) => {
      c.set('user', ctxOverride.user as any);
      c.set('session', ctxOverride.session as any);
      c.set('requestId', 'req-123');
      (c.env as any) = { DB: dbMock, OPENROUTER_API_KEY: 'test', OPENROUTER_BASE_URL: 'https://test', APP_URL: 'https://test' };
      await next();
    });
    app.route('/api/admin', adminAiRoutes);
    app.onError(errorHandler);
    return app;
  }

  it('deve bloquear usuário sem role admin (HTTP 403 FORBIDDEN)', async () => {
    const app = createApp({
      user: { id: 'u1', email: 'user@test.com', roles: ['user'], emailVerified: true, mfaEnabled: false, status: 'active' },
      session: { id: 's1', mfaVerified: false, expiresAt: '2026-12-31' },
    });

    const res = await app.request('/api/admin/models');
    expect(res.status).toBe(403);
    const json: any = await res.json();
    expect(json.error.code).toBe('FORBIDDEN');
  });

  it('deve bloquear admin sem sessão MFA verificada (HTTP 403 MFA_REQUIRED)', async () => {
    const app = createApp({
      user: { id: 'admin1', email: 'admin@test.com', roles: ['admin'], emailVerified: true, mfaEnabled: true, status: 'active' },
      session: { id: 's1', mfaVerified: false, expiresAt: '2026-12-31' },
    });

    const res = await app.request('/api/admin/models');
    expect(res.status).toBe(403);
    const json: any = await res.json();
    expect(json.error.code).toBe('MFA_REQUIRED');
  });

  it('deve permitir listar modelos para admin com MFA verificado', async () => {
    const mockDb = {
      prepare: vi.fn().mockReturnValue({
        all: async () => ({
          results: [
            {
              id: 'mod_gemini_flash_img',
              tier: 'economico',
              model_id: 'google/gemini-2.5-flash-image',
              display_name: 'ALEGON Fast',
              credits_cost: 1,
              priority: 10,
              active: 1,
            },
          ],
        }),
      }),
    };

    const app = createApp(
      {
        user: { id: 'admin1', email: 'admin@test.com', roles: ['admin'], emailVerified: true, mfaEnabled: true, status: 'active' },
        session: { id: 's1', mfaVerified: true, expiresAt: '2026-12-31' },
      },
      mockDb,
    );

    const res = await app.request('/api/admin/models');
    expect(res.status).toBe(200);
    const json: any = await res.json();
    expect(json.items.length).toBe(1);
    expect(json.items[0].model_id).toBe('google/gemini-2.5-flash-image');
  });

  it('deve consultar métricas de uso com agrupamento em GET /api/admin/ai/usage', async () => {
    const mockDb = {
      prepare: vi.fn().mockReturnValue({
        bind: vi.fn().mockReturnValue({
          all: async () => ({
            results: [
              {
                model_id: 'google/gemini-2.5-flash-image',
                total_requests: 42,
                successful_requests: 40,
                failed_requests: 2,
                total_cost_usd_micros: 168000,
                avg_latency_ms: 3200,
              },
            ],
          }),
        }),
      }),
    };

    const app = createApp(
      {
        user: { id: 'admin1', email: 'admin@test.com', roles: ['admin'], emailVerified: true, mfaEnabled: true, status: 'active' },
        session: { id: 's1', mfaVerified: true, expiresAt: '2026-12-31' },
      },
      mockDb,
    );

    const res = await app.request('/api/admin/ai/usage?groupBy=model');
    expect(res.status).toBe(200);
    const json: any = await res.json();
    expect(json.groupBy).toBe('model');
    expect(json.items.length).toBe(1);
    expect(json.items[0].total_requests).toBe(42);
  });
});
