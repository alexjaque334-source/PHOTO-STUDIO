/**
 * Middleware de proteção contra Cross-Site Request Forgery (CSRF).
 * Dono: Subagente 6 (Segurança e LGPD).
 *
 * Estratégia:
 * 1. Exige cabeçalho customizado `X-Requested-With: alegon` em requisições de mutação
 *    (POST, PUT, PATCH, DELETE). Navegadores não permitem que formulários cruzados (HTML forms)
 *    adicionem cabeçalhos customizados sem preflight CORS.
 * 2. Valida cabeçalhos `Origin` e `Referer` contra as origens autorizadas (APP_URL e request URL).
 * 3. Isenta explicitamente rotas de webhooks externos (/api/webhooks/*).
 */
import type { MiddlewareHandler } from 'hono';
import type { AppContext } from '../env';
import { DomainError } from '../contracts';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export function csrfProtection(): MiddlewareHandler<AppContext> {
  return async (c, next) => {
    const method = c.req.method.toUpperCase();

    // Métodos idempotentes de leitura são seguros contra efeitos colaterais de CSRF
    if (SAFE_METHODS.has(method)) {
      return next();
    }

    const path = c.req.path;

    // Isenção explícita para webhooks autenticados por token/assinatura própria
    if (path.startsWith('/api/webhooks/')) {
      return next();
    }

    // 1. Verificação do cabeçalho customizado obrigatório
    const requestedWith = c.req.header('x-requested-with');
    if (!requestedWith || requestedWith.trim().toLowerCase() !== 'alegon') {
      throw new DomainError(
        'CSRF_INVALID',
        'Cabeçalho de segurança X-Requested-With: alegon ausente ou inválido.',
        403,
      );
    }

    // 2. Verificação de Origem (Origin / Referer)
    const originHeader = c.req.header('origin');
    const refererHeader = c.req.header('referer');

    // Determina origens permitidas
    const allowedOrigins = new Set<string>();

    if (c.env?.APP_URL) {
      try {
        allowedOrigins.add(new URL(c.env.APP_URL).origin.toLowerCase());
      } catch {
        // ignora se APP_URL for malformada
      }
    }

    try {
      allowedOrigins.add(new URL(c.req.url).origin.toLowerCase());
    } catch {
      // ignora
    }

    // Adiciona localhost / 127.0.0.1 em modo development
    if (c.env?.ENVIRONMENT === 'development') {
      allowedOrigins.add('http://localhost:5173');
      allowedOrigins.add('http://localhost:8787');
      allowedOrigins.add('http://127.0.0.1:5173');
      allowedOrigins.add('http://127.0.0.1:8787');
    }

    if (originHeader) {
      let reqOrigin: string;
      try {
        reqOrigin = new URL(originHeader).origin.toLowerCase();
      } catch {
        throw new DomainError('CSRF_INVALID', 'Cabeçalho Origin inválido.', 403);
      }

      if (!allowedOrigins.has(reqOrigin)) {
        throw new DomainError('CSRF_INVALID', 'Origem da requisição não autorizada.', 403, {
          origin: originHeader,
        });
      }
    } else if (refererHeader) {
      let refererOrigin: string;
      try {
        refererOrigin = new URL(refererHeader).origin.toLowerCase();
      } catch {
        throw new DomainError('CSRF_INVALID', 'Cabeçalho Referer inválido.', 403);
      }

      if (!allowedOrigins.has(refererOrigin)) {
        throw new DomainError('CSRF_INVALID', 'Referer da requisição não autorizado.', 403, {
          referer: refererHeader,
        });
      }
    }

    return next();
  };
}
