/**
 * Middleware de cabeçalhos de segurança HTTP.
 * Dono: Subagente 6 (Segurança e LGPD).
 *
 * Aplica defesas em profundidade: CSP rigorosa, HSTS, X-Content-Type-Options,
 * Referrer-Policy, Permissions-Policy, COOP, CORP e X-Frame-Options.
 */
import type { MiddlewareHandler } from 'hono';
import type { AppContext } from '../env';

export interface SecurityHeadersOptions {
  /** Sobrescreve o ambiente padrão (útil em testes) */
  environment?: 'development' | 'staging' | 'production';
}

export function securityHeaders(options?: SecurityHeadersOptions): MiddlewareHandler<AppContext> {
  return async (c, next) => {
    await next();

    const path = c.req.path;
    const isApi = path.startsWith('/api/');
    const envMode = options?.environment ?? c.env?.ENVIRONMENT ?? 'production';

    // 1. Content Security Policy (CSP)
    if (isApi) {
      // API endpoints não devem carregar scripts, frames ou sub-recursos
      c.header('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'");
    } else {
      // CSP do SPA React (Workers Static Assets)
      c.header(
        'Content-Security-Policy',
        [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline'",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data: blob: https:",
          "font-src 'self' data:",
          "connect-src 'self' https:",
          "object-src 'none'",
          "frame-ancestors 'none'",
          "base-uri 'self'",
          "form-action 'self'",
        ].join('; '),
      );
    }

    // 2. HTTP Strict Transport Security (HSTS) — desativado em ambiente de desenvolvimento local
    if (envMode !== 'development') {
      c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    }

    // 3. Prevenção de MIME Sniffing
    c.header('X-Content-Type-Options', 'nosniff');

    // 4. Prevenção de Clickjacking
    c.header('X-Frame-Options', 'DENY');

    // 5. Política de Referrer
    c.header('Referrer-Policy', 'strict-origin-when-cross-origin');

    // 6. Permissions Policy (Câmera autorizada para captura opcional de selfie de avatar, restante bloqueado)
    c.header('Permissions-Policy', 'camera=(self), microphone=(), geolocation=(), payment=()');

    // 7. Cross-Origin Opener Policy (COOP) — isolamento de contexto de janela
    c.header('Cross-Origin-Opener-Policy', 'same-origin');

    // 8. Cross-Origin Resource Policy (CORP)
    c.header('Cross-Origin-Resource-Policy', 'same-origin');

    // 9. X-XSS-Protection (obsoleto em browsers modernos, mas preserva bloqueio em legado)
    c.header('X-XSS-Protection', '0');
  };
}
