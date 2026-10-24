/**
 * Rotas de Autenticação e Gestão de Credenciais / MFA.
 * Dono: Backend Engineer
 */
import { Hono } from 'hono';
import { z } from 'zod';
import type { AppContext, AuthUser } from '../env';
import { DomainError } from '../contracts';
import { execute, queryAll, queryOne } from '../db';
import { newId, nowIso, parseJson } from '../lib/http';
import {
  decryptAesGcm,
  encryptAesGcm,
  hashPassword,
  randomToken,
  sha256Hex,
  verifyPassword,
} from '../auth/crypto';
import { validatePasswordStrength } from '../auth/passwords';
import {
  clearSessionCookie,
  createSession,
  getSessionTokenFromCookie,
  handleFailedLogin,
  resetFailedLogin,
  revokeAllUserSessions,
  revokeOtherUserSessions,
  revokeSession,
  setSessionCookie,
  validateSessionToken,
} from '../auth/session';
import {
  buildOtpauthUrl,
  generateRecoveryCodes,
  generateTotpSecret,
  verifyTotp,
} from '../auth/totp';
import { requireAuth } from '../middleware/auth';
import { sendEmail } from '../email';
import { audit } from '../security/audit';

const authRoutes = new Hono<AppContext>();

const RegisterSchema = z.object({
  email: z.string().email('E-mail inválido.').max(255),
  password: z.string().min(10, 'A senha deve ter no mínimo 10 caracteres.'),
  fullName: z.string().min(2, 'Nome completo obrigatório.').max(150),
  acceptTerms: z.literal(true, {
    errorMap: () => ({ message: 'É obrigatório aceitar os Termos de Uso.' }),
  }),
  acceptPrivacy: z.literal(true, {
    errorMap: () => ({ message: 'É obrigatório aceitar a Política de Privacidade.' }),
  }),
  marketingOptIn: z.boolean().optional().default(false),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const MfaVerifySchema = z.object({
  code: z.string().min(6).max(32),
});

const VerifyEmailSchema = z.object({
  token: z.string().min(10),
});

const ForgotPasswordSchema = z.object({
  email: z.string().email(),
});

const ResetPasswordSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(10),
});

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(10),
});

const MfaEnableSchema = z.object({
  code: z.string().length(6),
});

const MfaDisableSchema = z.object({
  code: z.string().length(6),
  password: z.string().min(1),
});

// POST /auth/register
authRoutes.post('/register', async (c) => {
  const body = await parseJson(c, RegisterSchema);
  validatePasswordStrength(body.password);

  const normalizedEmail = body.email.toLowerCase().trim();

  // Verifica se o e-mail já existe
  const existing = await queryOne<{ id: string }>(
    c.env.DB,
    'SELECT id FROM users WHERE email = ?',
    [normalizedEmail],
  );
  if (existing) {
    throw new DomainError('EMAIL_EXISTS', 'Este e-mail já está cadastrado na plataforma.', 409);
  }

  const userId = newId();
  const now = nowIso();
  const passwordHash = await hashPassword(body.password);

  // Verifica se é super-admin (configurado via env ADMIN_EMAILS ou se é o primeiro usuário do sistema)
  const configuredAdmins = (c.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const countRow = await queryOne<{ total: number }>(
    c.env.DB,
    'SELECT COUNT(*) as total FROM users',
  );
  const isFirstOrAdmin = (countRow?.total ?? 0) === 0 || configuredAdmins.includes(normalizedEmail);

  // Insere usuário e perfil (se for admin/primeiro usuário, e-mail já nasce verificado)
  await execute(
    c.env.DB,
    `INSERT INTO users (id, email, password_hash, email_verified_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`,
    [userId, normalizedEmail, passwordHash, isFirstOrAdmin ? now : null, now, now],
  );

  await execute(
    c.env.DB,
    `INSERT INTO profiles (user_id, full_name, marketing_opt_in, accepted_terms_version, accepted_terms_at, accepted_privacy_version, accepted_privacy_at, updated_at)
     VALUES (?, ?, ?, 'v1.0', ?, 'v1.0', ?, ?)`,
    [userId, body.fullName.trim(), body.marketingOptIn ? 1 : 0, now, now, now],
  );

  // Atribui role 'user' (e 'admin' caso elegível)
  await execute(
    c.env.DB,
    `INSERT INTO user_roles (user_id, role, granted_at) VALUES (?, 'user', ?)`,
    [userId, now],
  );
  if (isFirstOrAdmin) {
    await execute(
      c.env.DB,
      `INSERT OR IGNORE INTO user_roles (user_id, role, granted_by, granted_at) VALUES (?, 'admin', 'system_bootstrap', ?)`,
      [userId, now],
    );
  }

  // Inicializa carteira de créditos (bônus inicial de 50 créditos se for o administrador)
  const initialCredits = isFirstOrAdmin ? 50 : 0;
  await execute(
    c.env.DB,
    `INSERT INTO wallets (user_id, purchased_balance, subscription_balance, reserved, version, updated_at)
     VALUES (?, ?, 0, 0, 0, ?)`,
    [userId, initialCredits, now],
  );

  // Gera token de confirmação de e-mail (24h)
  const token = randomToken(32);
  const tokenHash = await sha256Hex(token);
  const expiresAt = new Date(Date.now() + 24 * 3600 * 1000).toISOString();

  await execute(
    c.env.DB,
    `INSERT INTO auth_tokens (id, user_id, type, token_hash, expires_at, created_at)
     VALUES (?, ?, 'email_verify', ?, ?, ?)`,
    [newId(), userId, tokenHash, expiresAt, now],
  );

  // Dispara e-mail de confirmação
  await sendEmail(c.env, {
    to: normalizedEmail,
    template: 'verification',
    payload: { token },
    userId,
  });

  await audit(c.env, {
    actorUserId: userId,
    actorType: 'user',
    action: 'auth.register',
    targetType: 'user',
    targetId: userId,
    ip: c.req.header('cf-connecting-ip') ?? c.req.header('x-forwarded-for'),
  });

  return c.json(
    {
      user: {
        id: userId,
        email: normalizedEmail,
        fullName: body.fullName.trim(),
        emailVerified: false,
      },
    },
    201,
  );
});

// POST /auth/login
authRoutes.post('/login', async (c) => {
  const body = await parseJson(c, LoginSchema);
  const normalizedEmail = body.email.toLowerCase().trim();

  interface DbUser {
    id: string;
    email: string;
    password_hash: string;
    email_verified_at: string | null;
    status: 'active' | 'blocked' | 'pending_deletion' | 'deleted';
    failed_login_count: number;
    locked_until: string | null;
  }

  const user = await queryOne<DbUser>(
    c.env.DB,
    `SELECT id, email, password_hash, email_verified_at, status, failed_login_count, locked_until
     FROM users WHERE email = ?`,
    [normalizedEmail],
  );

  if (!user) {
    throw new DomainError('UNAUTHENTICATED', 'E-mail ou senha incorretos.', 401);
  }

  if (user.status === 'blocked') {
    throw new DomainError('ACCOUNT_BLOCKED', 'Esta conta está suspensa por violação dos termos.', 403);
  }

  if (user.locked_until && new Date(user.locked_until).getTime() > Date.now()) {
    throw new DomainError(
      'ACCOUNT_LOCKED',
      `Conta bloqueada por excesso de tentativas. Tente novamente mais tarde.`,
      403,
      { lockedUntil: user.locked_until },
    );
  }

  const isPasswordValid = await verifyPassword(body.password, user.password_hash);
  if (!isPasswordValid) {
    await handleFailedLogin(c.env.DB, user.id, user.failed_login_count);
    throw new DomainError('UNAUTHENTICATED', 'E-mail ou senha incorretos.', 401);
  }

  // Reseta falhas
  await resetFailedLogin(c.env.DB, user.id);

  // Carrega roles
  const roles = await queryAll<{ role: 'user' | 'support' | 'admin' }>(
    c.env.DB,
    'SELECT role FROM user_roles WHERE user_id = ?',
    [user.id],
  );
  const roleNames = roles.map((r) => r.role);

  // Checa MFA
  const mfaRecord = await queryOne<{ enabled_at: string | null }>(
    c.env.DB,
    'SELECT enabled_at FROM mfa_secrets WHERE user_id = ? AND enabled_at IS NOT NULL',
    [user.id],
  );
  const mfaEnabled = Boolean(mfaRecord && mfaRecord.enabled_at);

  const isAdmin = roleNames.includes('admin');
  const mfaRequired = mfaEnabled || isAdmin;

  // Cria sessão (se mfaRequired for true, inicia com mfa_verified = false)
  const reqInfo = {
    userAgent: c.req.header('user-agent'),
    ip: c.req.header('cf-connecting-ip') ?? c.req.header('x-forwarded-for'),
  };

  const { token, session } = await createSession(c.env.DB, user.id, !mfaRequired, reqInfo);
  setSessionCookie(c, token, new Date(session.expiresAt));

  await audit(c.env, {
    actorUserId: user.id,
    actorType: isAdmin ? 'admin' : 'user',
    action: 'auth.login',
    targetType: 'user',
    targetId: user.id,
    ip: reqInfo.ip,
    metadata: { mfaRequired },
  });

  return c.json({
    user: {
      id: user.id,
      email: user.email,
      emailVerified: Boolean(user.email_verified_at),
      roles: roleNames,
      mfaEnabled,
    },
    mfaRequired,
  });
});

// POST /auth/mfa/verify
authRoutes.post('/mfa/verify', requireAuth(), async (c) => {
  const body = await parseJson(c, MfaVerifySchema);
  const user = c.get('user');
  const session = c.get('session');

  const mfaSecret = await queryOne<{
    secret_encrypted: string;
    recovery_codes_json: string | null;
  }>(c.env.DB, 'SELECT secret_encrypted, recovery_codes_json FROM mfa_secrets WHERE user_id = ?', [
    user.id,
  ]);

  if (!mfaSecret) {
    throw new DomainError('MFA_NOT_CONFIGURED', 'MFA não configurado nesta conta.', 400);
  }

  const plainSecret = await decryptAesGcm(c.env.DATA_ENCRYPTION_KEY, mfaSecret.secret_encrypted);
  let verified = await verifyTotp(plainSecret, body.code);

  // Se falhar, checa recovery codes
  if (!verified && mfaSecret.recovery_codes_json) {
    try {
      const hashes: string[] = JSON.parse(mfaSecret.recovery_codes_json);
      const codeHash = await sha256Hex(body.code.trim().toUpperCase());
      const matchIndex = hashes.indexOf(codeHash);
      if (matchIndex !== -1) {
        verified = true;
        hashes.splice(matchIndex, 1);
        await execute(
          c.env.DB,
          'UPDATE mfa_secrets SET recovery_codes_json = ? WHERE user_id = ?',
          [JSON.stringify(hashes), user.id],
        );
      }
    } catch {
      // Ignora erro de parse
    }
  }

  if (!verified) {
    throw new DomainError('MFA_CODE_INVALID', 'Código de autenticação inválido ou expirado.', 400);
  }

  // Atualiza sessão para mfa_verified = 1
  await execute(c.env.DB, 'UPDATE sessions SET mfa_verified = 1 WHERE id = ?', [session.id]);

  await audit(c.env, {
    actorUserId: user.id,
    actorType: user.roles.includes('admin') ? 'admin' : 'user',
    action: 'auth.mfa_verified',
    targetType: 'session',
    targetId: session.id,
    ip: c.req.header('cf-connecting-ip') ?? c.req.header('x-forwarded-for'),
  });

  return c.json({
    user: {
      ...user,
      mfaVerified: true,
    },
  });
});

// POST /auth/logout
authRoutes.post('/logout', async (c) => {
  const token = getSessionTokenFromCookie(c);
  if (token) {
    const sessionId = await sha256Hex(token);
    await revokeSession(c.env.DB, sessionId);
  }
  clearSessionCookie(c);
  return c.body(null, 204);
});

// GET /auth/me
authRoutes.get('/me', requireAuth(), async (c) => {
  const user = c.get('user');
  const session = c.get('session');

  const profile = await queryOne<{ full_name: string | null }>(
    c.env.DB,
    'SELECT full_name FROM profiles WHERE user_id = ?',
    [user.id],
  );

  return c.json({
    user: {
      ...user,
      fullName: profile?.full_name ?? '',
    },
    session: {
      mfaVerified: session.mfaVerified,
      expiresAt: session.expiresAt,
    },
  });
});

// POST /auth/verify-email
authRoutes.post('/verify-email', async (c) => {
  const body = await parseJson(c, VerifyEmailSchema);
  const tokenHash = await sha256Hex(body.token);
  const now = nowIso();

  const tokenRecord = await queryOne<{ id: string; user_id: string }>(
    c.env.DB,
    `SELECT id, user_id FROM auth_tokens
     WHERE type = 'email_verify' AND token_hash = ? AND used_at IS NULL AND expires_at > ?`,
    [tokenHash, now],
  );

  if (!tokenRecord) {
    throw new DomainError(
      'INVALID_TOKEN',
      'Link de confirmação inválido ou expirado. Solicite um novo link.',
      400,
    );
  }

  await execute(c.env.DB, 'UPDATE auth_tokens SET used_at = ? WHERE id = ?', [now, tokenRecord.id]);
  await execute(c.env.DB, 'UPDATE users SET email_verified_at = ?, updated_at = ? WHERE id = ?', [
    now,
    now,
    tokenRecord.user_id,
  ]);

  await audit(c.env, {
    actorUserId: tokenRecord.user_id,
    actorType: 'user',
    action: 'auth.email_verified',
    targetType: 'user',
    targetId: tokenRecord.user_id,
  });

  return c.body(null, 204);
});

// POST /auth/resend-verification
authRoutes.post('/resend-verification', requireAuth(), async (c) => {
  const user = c.get('user');
  if (user.emailVerified) {
    return c.json({ message: 'E-mail já está verificado.' }, 202);
  }

  const token = randomToken(32);
  const tokenHash = await sha256Hex(token);
  const now = nowIso();
  const expiresAt = new Date(Date.now() + 24 * 3600 * 1000).toISOString();

  await execute(
    c.env.DB,
    `INSERT INTO auth_tokens (id, user_id, type, token_hash, expires_at, created_at)
     VALUES (?, ?, 'email_verify', ?, ?, ?)`,
    [newId(), user.id, tokenHash, expiresAt, now],
  );

  await sendEmail(c.env, {
    to: user.email,
    template: 'verification',
    payload: { token },
    userId: user.id,
  });

  return c.json({ message: 'E-mail de confirmação reenviado.' }, 202);
});

// POST /auth/forgot-password
authRoutes.post('/forgot-password', async (c) => {
  const body = await parseJson(c, ForgotPasswordSchema);
  const normalizedEmail = body.email.toLowerCase().trim();

  const user = await queryOne<{ id: string; email: string }>(
    c.env.DB,
    'SELECT id, email FROM users WHERE email = ? AND status = "active"',
    [normalizedEmail],
  );

  if (user) {
    const token = randomToken(32);
    const tokenHash = await sha256Hex(token);
    const now = nowIso();
    const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString(); // 1 hora

    await execute(
      c.env.DB,
      `INSERT INTO auth_tokens (id, user_id, type, token_hash, expires_at, created_at)
       VALUES (?, ?, 'password_reset', ?, ?, ?)`,
      [newId(), user.id, tokenHash, expiresAt, now],
    );

    await sendEmail(c.env, {
      to: user.email,
      template: 'password_reset',
      payload: { token },
      userId: user.id,
    });
  }

  // Resposta idêntica para evitar enumeração de contas
  return c.json(
    { message: 'Se o e-mail informado estiver cadastrado, as instruções para redefinição foram enviadas.' },
    202,
  );
});

// POST /auth/reset-password
authRoutes.post('/reset-password', async (c) => {
  const body = await parseJson(c, ResetPasswordSchema);
  validatePasswordStrength(body.password);

  const tokenHash = await sha256Hex(body.token);
  const now = nowIso();

  const tokenRecord = await queryOne<{ id: string; user_id: string }>(
    c.env.DB,
    `SELECT id, user_id FROM auth_tokens
     WHERE type = 'password_reset' AND token_hash = ? AND used_at IS NULL AND expires_at > ?`,
    [tokenHash, now],
  );

  if (!tokenRecord) {
    throw new DomainError('INVALID_TOKEN', 'Link de redefinição inválido ou expirado.', 400);
  }

  const passwordHash = await hashPassword(body.password);

  await execute(c.env.DB, 'UPDATE auth_tokens SET used_at = ? WHERE id = ?', [now, tokenRecord.id]);
  await execute(c.env.DB, 'UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?', [
    passwordHash,
    now,
    tokenRecord.user_id,
  ]);

  // Revoga todas as sessões para segurança
  await revokeAllUserSessions(c.env.DB, tokenRecord.user_id);

  await audit(c.env, {
    actorUserId: tokenRecord.user_id,
    actorType: 'user',
    action: 'auth.password_reset',
    targetType: 'user',
    targetId: tokenRecord.user_id,
  });

  return c.body(null, 204);
});

// POST /auth/change-password
authRoutes.post('/change-password', requireAuth(), async (c) => {
  const body = await parseJson(c, ChangePasswordSchema);
  validatePasswordStrength(body.newPassword);

  const user = c.get('user');
  const session = c.get('session');

  const dbUser = await queryOne<{ password_hash: string }>(
    c.env.DB,
    'SELECT password_hash FROM users WHERE id = ?',
    [user.id],
  );

  if (!dbUser) {
    throw new DomainError('NOT_FOUND', 'Usuário não encontrado.', 404);
  }

  const isCurrentValid = await verifyPassword(body.currentPassword, dbUser.password_hash);
  if (!isCurrentValid) {
    throw new DomainError('INVALID_CREDENTIALS', 'A senha atual está incorreta.', 400);
  }

  const newHash = await hashPassword(body.newPassword);
  const now = nowIso();

  await execute(c.env.DB, 'UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?', [
    newHash,
    now,
    user.id,
  ]);

  // Revoga outras sessões, mantendo a atual
  await revokeOtherUserSessions(c.env.DB, user.id, session.id);

  await audit(c.env, {
    actorUserId: user.id,
    actorType: 'user',
    action: 'auth.password_change',
    targetType: 'user',
    targetId: user.id,
  });

  return c.body(null, 204);
});

// GET /auth/sessions
authRoutes.get('/sessions', requireAuth(), async (c) => {
  const user = c.get('user');
  const session = c.get('session');
  const now = nowIso();

  interface SessionRow {
    id: string;
    user_agent: string | null;
    created_at: string;
    last_seen_at: string;
  }

  const rows = await queryAll<SessionRow>(
    c.env.DB,
    `SELECT id, user_agent, created_at, last_seen_at
     FROM sessions
     WHERE user_id = ? AND revoked_at IS NULL AND expires_at > ?
     ORDER BY last_seen_at DESC`,
    [user.id, now],
  );

  return c.json({
    items: rows.map((r) => ({
      id: r.id,
      current: r.id === session.id,
      userAgent: r.user_agent,
      createdAt: r.created_at,
      lastSeenAt: r.last_seen_at,
    })),
  });
});

// DELETE /auth/sessions/:id
authRoutes.delete('/sessions/:id', requireAuth(), async (c) => {
  const user = c.get('user');
  const currentSession = c.get('session');
  const sessionIdToDelete = c.req.param('id');

  const row = await queryOne<{ id: string }>(
    c.env.DB,
    'SELECT id FROM sessions WHERE id = ? AND user_id = ?',
    [sessionIdToDelete, user.id],
  );

  if (!row) {
    throw new DomainError('NOT_FOUND', 'Sessão não encontrada.', 404);
  }

  await revokeSession(c.env.DB, sessionIdToDelete);

  if (sessionIdToDelete === currentSession.id) {
    clearSessionCookie(c);
  }

  return c.body(null, 204);
});

// POST /auth/sessions/revoke-others
authRoutes.post('/sessions/revoke-others', requireAuth(), async (c) => {
  const user = c.get('user');
  const currentSession = c.get('session');

  await revokeOtherUserSessions(c.env.DB, user.id, currentSession.id);
  return c.body(null, 204);
});

// POST /auth/mfa/setup
authRoutes.post('/mfa/setup', requireAuth(), async (c) => {
  const user = c.get('user');
  const secret = generateTotpSecret(20);
  const otpauthUrl = buildOtpauthUrl(user.email, 'ALEGON AI Photo Studio', secret);
  const encryptedSecret = await encryptAesGcm(c.env.DATA_ENCRYPTION_KEY, secret);
  const now = nowIso();

  await execute(
    c.env.DB,
    `INSERT INTO mfa_secrets (user_id, secret_encrypted, created_at)
     VALUES (?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET secret_encrypted = excluded.secret_encrypted, enabled_at = NULL`,
    [user.id, encryptedSecret, now],
  );

  return c.json({
    secret,
    otpauthUrl,
  });
});

// POST /auth/mfa/enable
authRoutes.post('/mfa/enable', requireAuth(), async (c) => {
  const body = await parseJson(c, MfaEnableSchema);
  const user = c.get('user');
  const session = c.get('session');

  const mfaRecord = await queryOne<{ secret_encrypted: string }>(
    c.env.DB,
    'SELECT secret_encrypted FROM mfa_secrets WHERE user_id = ?',
    [user.id],
  );

  if (!mfaRecord) {
    throw new DomainError('MFA_NOT_STARTED', 'Inicie a configuração do MFA antes de ativá-lo.', 400);
  }

  const plainSecret = await decryptAesGcm(c.env.DATA_ENCRYPTION_KEY, mfaRecord.secret_encrypted);
  const isValid = await verifyTotp(plainSecret, body.code);

  if (!isValid) {
    throw new DomainError('MFA_CODE_INVALID', 'Código de autenticação incorreto.', 400);
  }

  const { codes, hashes } = await generateRecoveryCodes(8);
  const now = nowIso();

  await execute(
    c.env.DB,
    `UPDATE mfa_secrets SET enabled_at = ?, recovery_codes_json = ? WHERE user_id = ?`,
    [now, JSON.stringify(hashes), user.id],
  );

  // Marca sessão atual como mfa_verified
  await execute(c.env.DB, 'UPDATE sessions SET mfa_verified = 1 WHERE id = ?', [session.id]);

  await audit(c.env, {
    actorUserId: user.id,
    actorType: 'user',
    action: 'auth.mfa_enabled',
    targetType: 'user',
    targetId: user.id,
  });

  return c.json({
    recoveryCodes: codes,
  });
});

// POST /auth/mfa/disable
authRoutes.post('/mfa/disable', requireAuth(), async (c) => {
  const body = await parseJson(c, MfaDisableSchema);
  const user = c.get('user');

  if (user.roles.includes('admin')) {
    throw new DomainError(
      'ADMIN_MFA_MANDATORY',
      'Administradores são obrigados a manter a autenticação em dois fatores ativada.',
      403,
    );
  }

  const dbUser = await queryOne<{ password_hash: string }>(
    c.env.DB,
    'SELECT password_hash FROM users WHERE id = ?',
    [user.id],
  );

  if (!dbUser || !(await verifyPassword(body.password, dbUser.password_hash))) {
    throw new DomainError('INVALID_CREDENTIALS', 'Senha incorreta.', 400);
  }

  const mfaRecord = await queryOne<{ secret_encrypted: string }>(
    c.env.DB,
    'SELECT secret_encrypted FROM mfa_secrets WHERE user_id = ? AND enabled_at IS NOT NULL',
    [user.id],
  );

  if (!mfaRecord) {
    return c.body(null, 204);
  }

  const plainSecret = await decryptAesGcm(c.env.DATA_ENCRYPTION_KEY, mfaRecord.secret_encrypted);
  const isValid = await verifyTotp(plainSecret, body.code);
  if (!isValid) {
    throw new DomainError('MFA_CODE_INVALID', 'Código TOTP incorreto.', 400);
  }

  await execute(c.env.DB, 'DELETE FROM mfa_secrets WHERE user_id = ?', [user.id]);

  await audit(c.env, {
    actorUserId: user.id,
    actorType: 'user',
    action: 'auth.mfa_disabled',
    targetType: 'user',
    targetId: user.id,
  });

  return c.body(null, 204);
});

export default authRoutes;
