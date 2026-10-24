/**
 * Rotas de Gestão de Conta e Direitos do Titular (LGPD).
 * Dono: Backend Engineer
 */
import { Hono } from 'hono';
import { z } from 'zod';
import type { AppContext } from '../env';
import { DomainError } from '../contracts';
import { execute, queryAll, queryOne } from '../db';
import { newId, nowIso, parseJson } from '../lib/http';
import { verifyPassword } from '../auth/crypto';
import { clearSessionCookie, revokeAllUserSessions } from '../auth/session';
import { requireAuth } from '../middleware/auth';
import { createStorageService } from '../storage';
import { sendEmail } from '../email';
import { audit } from '../security/audit';

const accountRoutes = new Hono<AppContext>();

const UpdateProfileSchema = z.object({
  fullName: z.string().min(2).max(150).optional(),
  phone: z.string().max(30).nullable().optional(),
  marketingOptIn: z.boolean().optional(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
});

const DeleteAccountSchema = z.object({
  password: z.string().min(1),
  confirm: z.literal('EXCLUIR', {
    errorMap: () => ({ message: 'Para confirmar, digite exatamente "EXCLUIR".' }),
  }),
});

// GET /account/profile
accountRoutes.get('/profile', requireAuth(), async (c) => {
  const user = c.get('user');

  interface ProfileRow {
    full_name: string | null;
    phone: string | null;
    marketing_opt_in: number;
    theme: string | null;
  }

  const profile = await queryOne<ProfileRow>(
    c.env.DB,
    'SELECT full_name, phone, marketing_opt_in, theme FROM profiles WHERE user_id = ?',
    [user.id],
  );

  return c.json({
    fullName: profile?.full_name ?? '',
    phone: profile?.phone ?? null,
    marketingOptIn: Boolean(profile?.marketing_opt_in),
    theme: profile?.theme ?? 'system',
  });
});

// PATCH /account/profile
accountRoutes.patch('/profile', requireAuth(), async (c) => {
  const body = await parseJson(c, UpdateProfileSchema);
  const user = c.get('user');
  const now = nowIso();

  const updates: string[] = ['updated_at = ?'];
  const params: unknown[] = [now];

  if (body.fullName !== undefined) {
    updates.push('full_name = ?');
    params.push(body.fullName.trim());
  }
  if (body.phone !== undefined) {
    updates.push('phone = ?');
    params.push(body.phone ? body.phone.trim() : null);
  }
  if (body.marketingOptIn !== undefined) {
    updates.push('marketing_opt_in = ?');
    params.push(body.marketingOptIn ? 1 : 0);
  }
  if (body.theme !== undefined) {
    updates.push('theme = ?');
    params.push(body.theme);
  }

  params.push(user.id);
  await execute(
    c.env.DB,
    `UPDATE profiles SET ${updates.join(', ')} WHERE user_id = ?`,
    params,
  );

  return c.json({ message: 'Perfil atualizado com sucesso.' });
});

// GET /account/export - Exportação de dados do titular (LGPD)
accountRoutes.get('/export', requireAuth(), async (c) => {
  const user = c.get('user');
  const storage = createStorageService(c.env);

  const dbUser = await queryOne<{
    email: string;
    created_at: string;
    last_login_at: string | null;
    status: string;
  }>(
    c.env.DB,
    'SELECT email, created_at, last_login_at, status FROM users WHERE id = ?',
    [user.id],
  );

  const profile = await queryOne(
    c.env.DB,
    'SELECT * FROM profiles WHERE user_id = ?',
    [user.id],
  );

  const projects = await queryAll(
    c.env.DB,
    'SELECT id, name, created_at FROM projects WHERE user_id = ? AND deleted_at IS NULL',
    [user.id],
  );

  interface ImageRow {
    id: string;
    title: string | null;
    project_id: string | null;
    created_at: string;
    expires_at: string;
  }

  const images = await queryAll<ImageRow>(
    c.env.DB,
    'SELECT id, title, project_id, created_at, expires_at FROM images WHERE user_id = ? AND deleted_at IS NULL',
    [user.id],
  );

  interface VersionRow {
    id: string;
    image_id: string;
    version_number: number;
    kind: string;
    r2_key: string;
    mime: string;
    size_bytes: number;
    created_at: string;
  }

  const versions = await queryAll<VersionRow>(
    c.env.DB,
    'SELECT id, image_id, version_number, kind, r2_key, mime, size_bytes, created_at FROM image_versions WHERE user_id = ? AND deleted_at IS NULL',
    [user.id],
  );

  // Gera URLs assinadas temporárias para os arquivos da exportação
  const versionsWithUrls = await Promise.all(
    versions.map(async (v) => {
      const signed = await storage.signedUrl({
        key: v.r2_key,
        userId: user.id,
        ttlSeconds: 3600, // 1 hora
        download: true,
      });
      return {
        ...v,
        downloadUrl: signed.url,
      };
    }),
  );

  const wallet = await queryOne(
    c.env.DB,
    'SELECT purchased_balance, subscription_balance, reserved FROM wallets WHERE user_id = ?',
    [user.id],
  );

  const creditTransactions = await queryAll(
    c.env.DB,
    'SELECT id, type, bucket, amount, created_at, note FROM credit_transactions WHERE user_id = ? ORDER BY created_at DESC',
    [user.id],
  );

  await audit(c.env, {
    actorUserId: user.id,
    actorType: 'user',
    action: 'account.data_export',
    targetType: 'user',
    targetId: user.id,
  });

  return c.json({
    exportedAt: nowIso(),
    userData: dbUser,
    profile,
    projects,
    images: images.map((img) => ({
      ...img,
      versions: versionsWithUrls.filter((v) => v.image_id === img.id),
    })),
    wallet,
    creditTransactions,
  });
});

// POST /account/delete - Solicitação de exclusão definitiva (LGPD)
accountRoutes.post('/delete', requireAuth(), async (c) => {
  const body = await parseJson(c, DeleteAccountSchema);
  const user = c.get('user');
  const now = nowIso();

  const dbUser = await queryOne<{ password_hash: string }>(
    c.env.DB,
    'SELECT password_hash FROM users WHERE id = ?',
    [user.id],
  );

  if (!dbUser || !(await verifyPassword(body.password, dbUser.password_hash))) {
    throw new DomainError('INVALID_CREDENTIALS', 'Senha incorreta.', 400);
  }

  const storage = createStorageService(c.env);

  // 1. Apaga imediatamente todas as imagens do usuário no R2
  await storage.deletePrefix(`u/${user.id}/`);

  // 2. Marca todas as imagens e versões como deletadas no D1
  await execute(
    c.env.DB,
    `UPDATE images SET deleted_at = ?, deletion_reason = 'account_deletion' WHERE user_id = ? AND deleted_at IS NULL`,
    [now, user.id],
  );
  await execute(
    c.env.DB,
    `UPDATE image_versions SET deleted_at = ? WHERE user_id = ? AND deleted_at IS NULL`,
    [now, user.id],
  );

  // 3. Agenda expurgo legal dos dados pessoais (30 dias)
  const scheduledFor = new Date(Date.now() + 30 * 86_400_000).toISOString();
  await execute(
    c.env.DB,
    `INSERT INTO deletion_requests (id, user_id, type, status, requested_at, scheduled_for)
     VALUES (?, ?, 'account', 'pending', ?, ?)`,
    [newId(), user.id, now, scheduledFor],
  );

  // 4. Marca status do usuário como pending_deletion
  await execute(
    c.env.DB,
    `UPDATE users SET status = 'pending_deletion', updated_at = ? WHERE id = ?`,
    [now, user.id],
  );

  // 5. Revoga todas as sessões
  await revokeAllUserSessions(c.env.DB, user.id);
  clearSessionCookie(c);

  // 6. Notifica via e-mail
  await sendEmail(c.env, {
    to: user.email,
    template: 'account_deletion_scheduled',
    payload: { scheduledFor },
    userId: user.id,
  });

  await audit(c.env, {
    actorUserId: user.id,
    actorType: 'user',
    action: 'account.deletion_requested',
    targetType: 'user',
    targetId: user.id,
  });

  return c.json({ scheduledFor }, 202);
});

// GET /account/consents
accountRoutes.get('/consents', requireAuth(), async (c) => {
  const user = c.get('user');

  interface ConsentRow {
    accepted_terms_version: string | null;
    accepted_terms_at: string | null;
    accepted_privacy_version: string | null;
    accepted_privacy_at: string | null;
  }

  const row = await queryOne<ConsentRow>(
    c.env.DB,
    `SELECT accepted_terms_version, accepted_terms_at, accepted_privacy_version, accepted_privacy_at
     FROM profiles WHERE user_id = ?`,
    [user.id],
  );

  return c.json({
    terms: {
      version: row?.accepted_terms_version ?? 'v1.0',
      acceptedAt: row?.accepted_terms_at ?? null,
    },
    privacy: {
      version: row?.accepted_privacy_version ?? 'v1.0',
      acceptedAt: row?.accepted_privacy_at ?? null,
    },
  });
});

export default accountRoutes;
