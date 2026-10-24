import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';
import type { AppContext } from '../env';
import { errorHandler } from '../lib/http';
import { csrfProtection } from './csrf';

describe('CSRF protection middleware', () => {
  function createTestApp() {
    const app = new Hono<AppContext>();
    app.use('*', async (c, next) => {
      // Mock das variáveis de ambiente
      c.env = {
        APP_URL: 'https://alegon.com.br',
        ENVIRONMENT: 'production',
      } as any;
      await next();
    });
    app.use('*', csrfProtection());
    app.onError(errorHandler);

    app.get('/api/test', (c) => c.json({ ok: true }));
    app.post('/api/test', (c) => c.json({ saved: true }));
    app.post('/api/webhooks/asaas', (c) => c.json({ received: true }));

    return app;
  }

  it('allows safe methods (GET) without custom headers', async () => {
    const app = createTestApp();
    const res = await app.request('/api/test', { method: 'GET' });
    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body.ok).toBe(true);
  });

  it('exempts /api/webhooks/* from CSRF check', async () => {
    const app = createTestApp();
    const res = await app.request('/api/webhooks/asaas', {
      method: 'POST',
      body: JSON.stringify({ event: 'PAYMENT_RECEIVED' }),
    });
    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body.received).toBe(true);
  });

  it('blocks POST request missing X-Requested-With', async () => {
    const app = createTestApp();
    const res = await app.request('/api/test', {
      method: 'POST',
      headers: {
        Origin: 'https://alegon.com.br',
      },
    });
    expect(res.status).toBe(403);
    const body: any = await res.json();
    expect(body.error.code).toBe('CSRF_INVALID');
  });

  it('blocks POST request with invalid X-Requested-With value', async () => {
    const app = createTestApp();
    const res = await app.request('/api/test', {
      method: 'POST',
      headers: {
        'x-requested-with': 'XMLHttpRequest',
        Origin: 'https://alegon.com.br',
      },
    });
    expect(res.status).toBe(403);
    const body: any = await res.json();
    expect(body.error.code).toBe('CSRF_INVALID');
  });

  it('blocks POST request from untrusted origin', async () => {
    const app = createTestApp();
    const res = await app.request('/api/test', {
      method: 'POST',
      headers: {
        'x-requested-with': 'alegon',
        Origin: 'https://malicious-site.com',
      },
    });
    expect(res.status).toBe(403);
    const body: any = await res.json();
    expect(body.error.code).toBe('CSRF_INVALID');
  });

  it('allows legitimate POST with valid header and authorized origin', async () => {
    const app = createTestApp();
    const res = await app.request('https://alegon.com.br/api/test', {
      method: 'POST',
      headers: {
        'x-requested-with': 'alegon',
        Origin: 'https://alegon.com.br',
      },
    });
    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body.saved).toBe(true);
  });
});
