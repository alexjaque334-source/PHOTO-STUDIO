/**
 * Gerenciamento de sessões seguras e lockout progressivo.
 * Dono: Backend Engineer
 */
import type { Context } from 'hono';
import type { AppContext, AuthSession, AuthUser, Env } from '../env';
import { DomainError } from '../contracts';
import { execute, queryAll, queryOne } from '../db';
import { nowIso } from '../lib/http';
import { randomToken, sha256Hex } from './crypto';

export const SESSION_COOKIE_PROD = '__Host-alegon_session';
export const SESSION_COOKIE_DEV = 'alegon_session';
export const SESSION_TTL_DAYS = 30;

export function getSessionCookieName(env: Env): string {
  return env.ENVIRONMENT === 'development' ? SESSION_COOKIE_DEV : SESSION_COOKIE_PROD;
}

export function parseCookies(header: string | undefined): Record<string, string> {
  const list: Record<string, string> = {};
  if (!header) return list;
  for (const item of header.split(';')) {
    const parts = item.split('=');
    const key = parts[0]?.trim();
    if (!key) continue;
    const val = parts.slice(1).join('=').trim();
    list[key] = decodeURIComponent(val);
  }
  return list;
}

export function getSessionTokenFromCookie(c: Context<AppContext>): string | null {
  const cookieName = getSessionCookieName(c.env);
  const header = c.req.header('Cookie');
  const cookies = parseCookies(header);
  return cookies[cookieName] ?? null;
}

export function setSessionCookie(c: Context<AppContext>, token: string, expiresDate: Date): void {
  const cookieName = getSessionCookieName(c.env);
  const isProd = c.env.ENVIRONMENT !== 'development';
  const expiresGmt = expiresDate.toUTCString();
  const sameSite = 'Lax';
  let cookie = `${cookieName}=${encodeURIComponent(token)}; Path=/; Expires=${expiresGmt}; HttpOnly; SameSite=${sameSite}`;
  if (isProd) {
    cookie += '; Secure';
  }
  c.header('Set-Cookie', cookie, { append: true });
}

export function clearSessionCookie(c: Context<AppContext>): void {
  const cookieName = getSessionCookieName(c.env);
  const isProd = c.env.ENVIRONMENT !== 'development';
  let cookie = `${cookieName}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax`;
  if (isProd) {
    cookie += '; Secure';
  }
  c.header('Set-Cookie', cookie, { append: true });
}

/**
 * Registra falha de login e aplica bloqueio progressivo após 5 falhas.
 */
export async function handleFailedLogin(db: D1Database, userId: string, currentFailed: number): Promise<void> {
  const newFailed = currentFailed + 1;
  const now = new Date();
  let lockedUntil: string | null = null;

  if (newFailed >= 5) {
    // Escala progressiva: 5 tentativas = 15min, 6 = 30min, 7 = 60min, etc.
    const multiplier = Math.pow(2, Math.min(newFailed - 5, 5));
    const lockMinutes = 15 * multiplier;
    lockedUntil = new Date(now.getTime() + lockMinutes * 60_000).toISOString();
  }

  await execute(
    db,
    `UPDATE users SET failed_login_count = ?, locked_until = ?, updated_at = ? WHERE id = ?`,
    [newFailed, lockedUntil, now.toISOString(), userId],
  );

  if (lockedUntil) {
    throw new DomainError(
      'ACCOUNT_LOCKED',
      `Conta temporariamente bloqueada por excesso de tentativas. Tente novamente após ${new Date(lockedUntil).toLocaleTimeString('pt-BR')}.`,
      403,
      { lockedUntil },
    );
  }
}

/**
 * Reseta o contador de falhas de login quando a autenticação é bem-sucedida.
 */
export async function resetFailedLogin(db: D1Database, userId: string): Promise<void> {
  const now = nowIso();
  await execute(
    db,
    `UPDATE users SET failed_login_count = 0, locked_until = NULL, last_login_at = ?, updated_at = ? WHERE id = ?`,
    [now, now, userId],
  );
}

/**
 * Cria uma nova sessão no D1 e retorna o token em texto claro.
 */
export async function createSession(
  db: D1Database,
  userId: string,
  mfaVerified: boolean,
  req: { userAgent?: string; ip?: string },
): Promise<{ token: string; session: AuthSession }> {
  const token = randomToken(32);
  const sessionId = await sha256Hex(token);
  const now = new Date();
  const expiresDate = new Date(now.getTime() + SESSION_TTL_DAYS * 86_400_000);
  const expiresAt = expiresDate.toISOString();
  const createdAt = now.toISOString();

  let ipHash: string | null = null;
  if (req.ip) {
    ipHash = await sha256Hex(req.ip);
  }

  await execute(
    db,
    `INSERT INTO sessions (id, user_id, mfa_verified, ip_hash, user_agent, created_at, last_seen_at, expires_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      sessionId,
      userId,
      mfaVerified ? 1 : 0,
      ipHash,
      req.userAgent ?? null,
      createdAt,
      createdAt,
      expiresAt,
    ],
  );

  return {
    token,
    session: {
      id: sessionId,
      mfaVerified,
      expiresAt,
    },
  };
}

/**
 * Valida o token de sessão, atualiza last_seen_at e carrega dados completos de usuário e sessão.
 */
export async function validateSessionToken(
  db: D1Database,
  token: string,
): Promise<{ user: AuthUser; session: AuthSession } | null> {
  const sessionId = await sha256Hex(token);
  const now = nowIso();

  interface SessionRow {
    id: string;
    user_id: string;
    mfa_verified: number;
    expires_at: string;
    revoked_at: string | null;
  }

  const sessionRow = await queryOne<SessionRow>(
    db,
    `SELECT id, user_id, mfa_verified, expires_at, revoked_at
     FROM sessions
     WHERE id = ? AND revoked_at IS NULL AND expires_at > ?`,
    [sessionId, now],
  );

  if (!sessionRow) {
    return null;
  }

  interface UserRow {
    id: string;
    email: string;
    email_verified_at: string | null;
    status: 'active' | 'blocked' | 'pending_deletion' | 'deleted';
  }

  const userRow = await queryOne<UserRow>(
    db,
    `SELECT id, email, email_verified_at, status FROM users WHERE id = ?`,
    [sessionRow.user_id],
  );

  if (!userRow || userRow.status !== 'active') {
    return null;
  }

  // Carrega roles
  const roleRows = await queryAll<{ role: 'user' | 'support' | 'admin' }>(
    db,
    `SELECT role FROM user_roles WHERE user_id = ?`,
    [userRow.id],
  );
  const roles = roleRows.length > 0 ? roleRows.map((r) => r.role) : (['user'] as Array<'user'>);

  // Checa se MFA está habilitado
  const mfaRow = await queryOne<{ enabled_at: string | null }>(
    db,
    `SELECT enabled_at FROM mfa_secrets WHERE user_id = ? AND enabled_at IS NOT NULL`,
    [userRow.id],
  );
  const mfaEnabled = Boolean(mfaRow && mfaRow.enabled_at);

  // Atualiza last_seen_at periodicamente (ex: em segundo plano)
  await execute(db, `UPDATE sessions SET last_seen_at = ? WHERE id = ?`, [now, sessionId]);

  const user: AuthUser = {
    id: userRow.id,
    email: userRow.email,
    emailVerified: Boolean(userRow.email_verified_at),
    status: userRow.status,
    roles,
    mfaEnabled,
  };

  const session: AuthSession = {
    id: sessionRow.id,
    mfaVerified: Boolean(sessionRow.mfa_verified),
    expiresAt: sessionRow.expires_at,
  };

  return { user, session };
}

/**
 * Revoga uma sessão pelo hash ou ID.
 */
export async function revokeSession(db: D1Database, sessionId: string): Promise<void> {
  const now = nowIso();
  await execute(db, `UPDATE sessions SET revoked_at = ? WHERE id = ?`, [now, sessionId]);
}

/**
 * Revoga todas as sessões de um usuário.
 */
export async function revokeAllUserSessions(db: D1Database, userId: string): Promise<void> {
  const now = nowIso();
  await execute(db, `UPDATE sessions SET revoked_at = ? WHERE user_id = ? AND revoked_at IS NULL`, [
    now,
    userId,
  ]);
}

/**
 * Revoga todas as outras sessões de um usuário exceto a atual.
 */
export async function revokeOtherUserSessions(
  db: D1Database,
  userId: string,
  exceptSessionId: string,
): Promise<void> {
  const now = nowIso();
  await execute(
    db,
    `UPDATE sessions SET revoked_at = ? WHERE user_id = ? AND id != ? AND revoked_at IS NULL`,
    [now, userId, exceptSessionId],
  );
}
