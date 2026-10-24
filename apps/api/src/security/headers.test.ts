import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';
import type { AppContext } from '../env';
import { securityHeaders } from './headers';

describe('securityHeaders middleware', () => {
  it('applies strict API CSP and production headers to /api/*', async () => {
    const app = new Hono<AppContext>();
    app.use('*', async (c, next) => {
      c.env = { ENVIRONMENT: 'production' } as any;
      await next();
    });
    app.use('*', securityHeaders());
    app.get('/api/users', (c) => c.text('ok'));

    const res = await app.request('/api/users');
    expect(res.status).toBe(200);

    // Headers de proteção
    expect(res.headers.get('Content-Security-Policy')).toBe(
      "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
    );
    expect(res.headers.get('Strict-Transport-Security')).toContain('max-age=31536000');
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(res.headers.get('X-Frame-Options')).toBe('DENY');
    expect(res.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
    expect(res.headers.get('Permissions-Policy')).toContain('camera=(self)');
    expect(res.headers.get('Cross-Origin-Opener-Policy')).toBe('same-origin');
    expect(res.headers.get('Cross-Origin-Resource-Policy')).toBe('same-origin');
  });

  it('omits HSTS header in development environment', async () => {
    const app = new Hono<AppContext>();
    app.use('*', async (c, next) => {
      c.env = { ENVIRONMENT: 'development' } as any;
      await next();
    });
    app.use('*', securityHeaders());
    app.get('/api/health', (c) => c.text('ok'));

    const res = await app.request('/api/health');
    expect(res.status).toBe(200);
    expect(res.headers.get('Strict-Transport-Security')).toBeNull();
  });

  it('applies SPA CSP for non-api routes', async () => {
    const app = new Hono<AppContext>();
    app.use('*', async (c, next) => {
      c.env = { ENVIRONMENT: 'production' } as any;
      await next();
    });
    app.use('*', securityHeaders());
    app.get('/dashboard', (c) => c.html('<html></html>'));

    const res = await app.request('/dashboard');
    expect(res.status).toBe(200);

    const csp = res.headers.get('Content-Security-Policy') || '';
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("script-src 'self' 'unsafe-inline'");
  });
});
