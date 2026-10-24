/**
 * Middlewares de Autenticação e Autorização.
 * Dono: Backend Engineer
 */
import type { MiddlewareHandler } from 'hono';
import type { AppContext } from '../env';
import { DomainError } from '../contracts';
import { getSessionTokenFromCookie, validateSessionToken } from '../auth/session';

export function requireAuth(): MiddlewareHandler<AppContext> {
  return async (c, next) => {
    let token = getSessionTokenFromCookie(c);
    if (!token) {
      const authHeader = c.req.header('Authorization');
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.slice(7).trim();
      }
    }

    if (!token) {
      throw new DomainError('UNAUTHENTICATED', 'Autenticação necessária. Faça login para continuar.', 401);
    }

    const auth = await validateSessionToken(c.env.DB, token);
    if (!auth) {
      throw new DomainError('UNAUTHENTICATED', 'Sessão expirada ou inválida. Faça login novamente.', 401);
    }

    c.set('user', auth.user);
    c.set('session', auth.session);

    await next();
  };
}

export function requireVerifiedEmail(): MiddlewareHandler<AppContext> {
  return async (c, next) => {
    const user = c.get('user');
    if (!user) {
      throw new DomainError('UNAUTHENTICATED', 'Autenticação necessária.', 401);
    }

    if (!user.emailVerified) {
      throw new DomainError(
        'EMAIL_NOT_VERIFIED',
        'Confirmação de e-mail obrigatória para realizar esta ação.',
        403,
      );
    }

    await next();
  };
}

export function requireAdmin(): MiddlewareHandler<AppContext> {
  return async (c, next) => {
    const user = c.get('user');
    const session = c.get('session');

    if (!user || !session) {
      throw new DomainError('UNAUTHENTICATED', 'Autenticação necessária.', 401);
    }

    if (!user.roles.includes('admin')) {
      throw new DomainError('FORBIDDEN', 'Acesso restrito a administradores.', 403);
    }

    if (user.mfaEnabled && !session.mfaVerified) {
      throw new DomainError(
        'MFA_REQUIRED',
        'Verificação em duas etapas (MFA) necessária para acessar o painel administrativo.',
        403,
      );
    }

    await next();
  };
}

export function optionalAuth(): MiddlewareHandler<AppContext> {
  return async (c, next) => {
    let token = getSessionTokenFromCookie(c);
    if (!token) {
      const authHeader = c.req.header('Authorization');
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.slice(7).trim();
      }
    }

    if (token) {
      const auth = await validateSessionToken(c.env.DB, token);
      if (auth) {
        c.set('user', auth.user);
        c.set('session', auth.session);
      }
    }

    await next();
  };
}
