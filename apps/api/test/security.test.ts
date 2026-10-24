/**
 * Testes unitários de Segurança, Uploads, CSRF e Rate Limiting — ALEGON AI Photo Studio.
 * Dono: Subagente 8 (QA e Testes).
 */
import { describe, expect, it, beforeEach } from 'vitest';
import { Hono } from 'hono';
import {
  validateImageUpload,
  MAX_FILE_SIZE_BYTES,
  MIN_DIMENSION_PX,
  MAX_MEGAPIXELS,
} from '../src/security/upload';
import { csrfProtection } from '../src/security/csrf';
import { rateLimit, rateLimitMiddleware } from '../src/security/rate-limit';
import { securityHeaders } from '../src/security/headers';
import { DomainError } from '../src/contracts';
import { createMockD1 } from './mock-d1';
import { errorHandler } from '../src/lib/http';
import type { AppContext } from '../src/env';

// Helpers para montagem de buffers binários válidos com dimensões em bytes puros
function createValidPng(width: number, height: number): ArrayBuffer {
  const buffer = new ArrayBuffer(33);
  const u8 = new Uint8Array(buffer);
  const view = new DataView(buffer);
  u8.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0); // PNG header
  view.setUint32(8, 13, false); // IHDR length
  u8.set([0x49, 0x48, 0x44, 0x52], 12); // 'IHDR'
  view.setUint32(16, width, false);
  view.setUint32(20, height, false);
  u8.set([8, 2, 0, 0, 0], 24); // 8-bit truecolor
  view.setUint32(29, 0x99887766, false); // CRC
  return buffer;
}

function createValidJpeg(width: number, height: number): ArrayBuffer {
  const buffer = new ArrayBuffer(24);
  const u8 = new Uint8Array(buffer);
  const view = new DataView(buffer);
  u8[0] = 0xff; // SOI
  u8[1] = 0xd8;
  u8[2] = 0xff; // SOF0
  u8[3] = 0xc0;
  view.setUint16(4, 11, false); // length
  u8[6] = 8; // precision
  view.setUint16(7, height, false);
  view.setUint16(9, width, false);
  u8[11] = 3; // components
  u8[12] = 0xff; // EOI
  u8[13] = 0xd9;
  return buffer;
}

function createValidWebp(width: number, height: number): ArrayBuffer {
  const buffer = new ArrayBuffer(32);
  const u8 = new Uint8Array(buffer);
  const view = new DataView(buffer);
  u8.set([0x52, 0x49, 0x46, 0x46], 0); // 'RIFF'
  view.setUint32(4, 24, true);
  u8.set([0x57, 0x45, 0x42, 0x50], 8); // 'WEBP'
  u8.set([0x56, 0x50, 0x38, 0x20], 12); // 'VP8 '
  view.setUint32(16, 12, true);
  u8.set([0x00, 0x00, 0x00], 20);
  u8.set([0x9d, 0x01, 0x2a], 23); // start code
  u8[26] = width & 0xff;
  u8[27] = (width >> 8) & 0x3f;
  u8[28] = height & 0xff;
  u8[29] = (height >> 8) & 0x3f;
  return buffer;
}

describe('Validação de Uploads e Magic Bytes (upload.ts)', () => {
  it('deve aceitar imagem PNG legítima e extrair metadados exatos', () => {
    const png = createValidPng(1280, 720);
    const validated = validateImageUpload(png, 'image/png');

    expect(validated.mime).toBe('image/png');
    expect(validated.width).toBe(1280);
    expect(validated.height).toBe(720);
    expect(validated.sizeBytes).toBe(33);
  });

  it('deve aceitar imagem JPEG legítima e extrair metadados exatos', () => {
    const jpeg = createValidJpeg(1920, 1080);
    const validated = validateImageUpload(jpeg, 'image/jpeg');

    expect(validated.mime).toBe('image/jpeg');
    expect(validated.width).toBe(1920);
    expect(validated.height).toBe(1080);
  });

  it('deve aceitar imagem WebP legítima e extrair metadados exatos', () => {
    const webp = createValidWebp(800, 600);
    const validated = validateImageUpload(webp, 'image/webp');

    expect(validated.mime).toBe('image/webp');
    expect(validated.width).toBe(800);
    expect(validated.height).toBe(600);
  });

  it('deve bloquear upload vazio com HTTP 400', () => {
    expect(() => validateImageUpload(new ArrayBuffer(0))).toThrow(DomainError);
    try {
      validateImageUpload(new ArrayBuffer(0));
    } catch (e: any) {
      expect(e.code).toBe('UPLOAD_EMPTY');
      expect(e.status).toBe(400);
    }
  });

  it('deve bloquear arquivos maiores que o limite de 15 MB com HTTP 413', () => {
    const mockOversized = {
      byteLength: MAX_FILE_SIZE_BYTES + 512,
    } as unknown as ArrayBuffer;

    try {
      validateImageUpload(mockOversized);
      expect.unreachable();
    } catch (e: any) {
      expect(e.code).toBe('UPLOAD_TOO_LARGE');
      expect(e.status).toBe(413);
    }
  });

  it('deve bloquear arquivos menores que a dimensão mínima de 64x64 com HTTP 422', () => {
    const tinyPng = createValidPng(MIN_DIMENSION_PX - 1, 100);
    try {
      validateImageUpload(tinyPng);
      expect.unreachable();
    } catch (e: any) {
      expect(e.code).toBe('UPLOAD_DIMENSIONS_TOO_SMALL');
      expect(e.status).toBe(422);
    }
  });

  it('deve bloquear imagens que excedam 40 Megapixels com HTTP 422', () => {
    const hugeJpeg = createValidJpeg(8000, 6000); // 48 MP
    try {
      validateImageUpload(hugeJpeg);
      expect.unreachable();
    } catch (e: any) {
      expect(e.code).toBe('UPLOAD_PIXELS_TOO_LARGE');
      expect(e.status).toBe(422);
    }
  });

  it('deve detectar e rejeitar arquivos polyglot mascarando HTML, SVG ou Scripts', () => {
    const maliciousPayloads = [
      '<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)">',
      '<?xml version="1.0" encoding="utf-8"?><script>evil()</script>',
      '<!DOCTYPE html><html><script src="evil.js"></script></html>',
      '<iframe src="javascript:alert(1)"></iframe>',
      'GIF89a<?php system($_GET["c"]); ?>',
    ];

    for (const payload of maliciousPayloads) {
      const buffer = new ArrayBuffer(payload.length + 8);
      const u8 = new Uint8Array(buffer);
      // Coloca magic byte de PNG no início para tentar burlar
      u8.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0);
      new TextEncoder().encodeInto(payload, u8.subarray(8));

      try {
        validateImageUpload(buffer);
        expect.unreachable(`Deveria ter bloqueado polyglot: ${payload}`);
      } catch (e: any) {
        expect(e.code).toBe('UPLOAD_INVALID_CONTENT');
        expect(e.status).toBe(415);
      }
    }
  });

  it('deve rejeitar formatos não permitidos (PDF, executáveis, texto simples)', () => {
    const pdfBytes = new TextEncoder().encode('%PDF-1.5 fake content').buffer as ArrayBuffer;
    try {
      validateImageUpload(pdfBytes);
      expect.unreachable();
    } catch (e: any) {
      expect(e.code).toBe('UPLOAD_INVALID_FORMAT');
      expect(e.status).toBe(415);
    }
  });
});

describe('Proteção CSRF (csrf.ts)', () => {
  function createTestApp() {
    const app = new Hono<AppContext>();
    app.use('*', async (c, next) => {
      (c.env as any) = {
        APP_URL: 'https://studio.alegon.com.br',
        ENVIRONMENT: 'production',
      };
      await next();
    });
    app.use('*', csrfProtection());
    app.onError(errorHandler);

    app.get('/api/photos', (c) => c.json({ ok: true }));
    app.post('/api/photos', (c) => c.json({ created: true }));
    app.delete('/api/photos/:id', (c) => c.json({ deleted: true }));
    app.post('/api/webhooks/asaas', (c) => c.json({ webhook: true }));

    return app;
  }

  it('deve permitir requisições GET sem exigir cabeçalho X-Requested-With', async () => {
    const app = createTestApp();
    const res = await app.request('/api/photos', { method: 'GET' });
    expect(res.status).toBe(200);
  });

  it('deve bloquear POST sem cabeçalho X-Requested-With com HTTP 403 CSRF_INVALID', async () => {
    const app = createTestApp();
    const res = await app.request('/api/photos', {
      method: 'POST',
      body: JSON.stringify({ name: 'foto' }),
    });

    expect(res.status).toBe(403);
    const json: any = await res.json();
    expect(json.error.code).toBe('CSRF_INVALID');
  });

  it('deve permitir POST com X-Requested-With: alegon e Origin autorizada', async () => {
    const app = createTestApp();
    const res = await app.request('/api/photos', {
      method: 'POST',
      headers: {
        'x-requested-with': 'alegon',
        origin: 'https://studio.alegon.com.br',
      },
      body: JSON.stringify({ name: 'foto' }),
    });

    expect(res.status).toBe(200);
    const json: any = await res.json();
    expect(json.created).toBe(true);
  });

  it('deve bloquear POST com Origin não autorizada / cruzada', async () => {
    const app = createTestApp();
    const res = await app.request('/api/photos', {
      method: 'POST',
      headers: {
        'x-requested-with': 'alegon',
        origin: 'https://evil-attacker.com',
      },
      body: JSON.stringify({ name: 'foto' }),
    });

    expect(res.status).toBe(403);
    const json: any = await res.json();
    expect(json.error.code).toBe('CSRF_INVALID');
  });

  it('deve isentar explicitamente rotas de webhooks externos (/api/webhooks/*)', async () => {
    const app = createTestApp();
    // Webhook Asaas não envia cabeçalho customizado alegon
    const res = await app.request('/api/webhooks/asaas', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ event: 'PAYMENT_RECEIVED' }),
    });

    expect(res.status).toBe(200);
  });
});

describe('Rate Limiting no D1 (rate-limit.ts)', () => {
  let mock: ReturnType<typeof createMockD1>;

  beforeEach(() => {
    mock = createMockD1();
  });

  it('deve permitir acessos dentro do limite e bloquear ao exceder', async () => {
    const env: any = { DB: mock.d1 };
    const key = 'test-ip-key-1';
    const limit = 3;
    const windowSeconds = 60;

    // Tentativas 1 a 3 devem ser autorizadas
    for (let i = 1; i <= 3; i++) {
      const res = await rateLimit(env, key, limit, windowSeconds);
      expect(res.allowed).toBe(true);
      expect(res.current).toBe(i);
    }

    // 4ª tentativa deve ser bloqueada
    const blocked = await rateLimit(env, key, limit, windowSeconds);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfter).toBeGreaterThan(0);
    expect(blocked.current).toBe(3);
  });

  it('deve retornar cabeçalhos HTTP RateLimit e código 429 no middleware', async () => {
    const env: any = { DB: mock.d1, SESSION_SECRET: 'test-secret' };
    const app = new Hono<AppContext>();
    app.use('*', async (c, next) => {
      c.env = env;
      await next();
    });
    app.use(
      '/api/test-limit',
      rateLimitMiddleware({
        limit: 2,
        windowSeconds: 30,
        keyGenerator: () => 'static-test-key',
      }),
    );
    app.get('/api/test-limit', (c) => c.text('ok'));

    const res1 = await app.request('/api/test-limit');
    expect(res1.status).toBe(200);
    expect(res1.headers.get('RateLimit-Remaining')).toBe('1');

    const res2 = await app.request('/api/test-limit');
    expect(res2.status).toBe(200);
    expect(res2.headers.get('RateLimit-Remaining')).toBe('0');

    const res3 = await app.request('/api/test-limit');
    expect(res3.status).toBe(429);
    expect(res3.headers.get('Retry-After')).toBeDefined();
    const body: any = await res3.json();
    expect(body.error.code).toBe('RATE_LIMITED');
  });
});

describe('Cabeçalhos de Segurança HTTP (headers.ts)', () => {
  it('deve aplicar cabeçalhos recomendados de segurança e proteção no navegador', async () => {
    const app = new Hono<AppContext>();
    app.use('*', async (c, next) => {
      (c.env as any) = { ENVIRONMENT: 'production' };
      await next();
    });
    app.use('*', securityHeaders());
    app.get('/api/ping', (c) => c.text('pong'));

    const res = await app.request('/api/ping');
    expect(res.status).toBe(200);
    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
    expect(res.headers.get('x-frame-options')).toBe('DENY');
    expect(res.headers.get('strict-transport-security')).toContain('max-age=');
    expect(res.headers.get('referrer-policy')).toBe('strict-origin-when-cross-origin');
    expect(res.headers.get('content-security-policy')).toBeDefined();
  });
});
