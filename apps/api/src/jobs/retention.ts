/**
 * Rotina programada (Cron) de retenção de fotos (90 dias) e conformidade LGPD.
 * Dono: Backend Engineer
 */
import type { Env } from '../env';
import { execute, queryAll } from '../db';
import { addDays, newId, nowIso } from '../lib/http';
import { createStorageService } from '../storage';
import { sendEmail } from '../email';

export async function runRetention(env: Env): Promise<void> {
  const now = nowIso();
  const storage = createStorageService(env);
  console.log(`[Retention] Iniciando rotina programada de retenção e expurgo em ${now}`);

  // 1. Aviso de retenção prévio (7 dias antes da expiração)
  const sevenDaysFromNow = addDays(now, 7);

  interface UserExpiringPhotos {
    user_id: string;
    email: string;
    photo_count: number;
  }

  const expiring7d = await queryAll<UserExpiringPhotos>(
    env.DB,
    `SELECT i.user_id, u.email, COUNT(i.id) as photo_count
     FROM images i
     JOIN users u ON u.id = i.user_id
     WHERE i.expires_at <= ? AND i.expiry_notified_at IS NULL AND i.deleted_at IS NULL
     GROUP BY i.user_id`,
    [sevenDaysFromNow],
  );

  for (const group of expiring7d) {
    try {
      // Notificação in-app
      await execute(
        env.DB,
        `INSERT INTO notifications (id, user_id, type, title, body, link, created_at)
         VALUES (?, ?, 'retention_warning', 'Fotos prestes a expirar', ?, '/dashboard', ?)`,
        [
          newId(),
          group.user_id,
          `Você possui ${group.photo_count} foto(s) que serão excluídas em 7 dias conforme a política de 90 dias. Baixe seus arquivos agora!`,
          now,
        ],
      );

      // E-mail de aviso
      await sendEmail(env, {
        to: group.email,
        template: 'retention_warning_7d',
        payload: { days: 7, count: group.photo_count },
        userId: group.user_id,
      });

      // Marca fotos como notificadas
      await execute(
        env.DB,
        `UPDATE images SET expiry_notified_at = ?
         WHERE user_id = ? AND expires_at <= ? AND expiry_notified_at IS NULL AND deleted_at IS NULL`,
        [now, group.user_id, sevenDaysFromNow],
      );
    } catch (err) {
      console.error(`[Retention] Erro ao notificar usuário ${group.user_id}:`, err);
    }
  }

  // 2. Exclusão física e lógica de imagens expiradas (expires_at <= now)
  interface ExpiredVersion {
    id: string;
    image_id: string;
    r2_key: string;
    thumb_r2_key: string | null;
  }

  const expiredVersions = await queryAll<ExpiredVersion>(
    env.DB,
    `SELECT v.id, v.image_id, v.r2_key, v.thumb_r2_key
     FROM image_versions v
     JOIN images i ON i.id = v.image_id
     WHERE i.expires_at <= ? AND i.deleted_at IS NULL`,
    [now],
  );

  if (expiredVersions.length > 0) {
    console.log(`[Retention] Excluindo ${expiredVersions.length} versões de imagens expiradas.`);

    const keysToDelete: string[] = [];
    const imageIds = new Set<string>();

    for (const v of expiredVersions) {
      keysToDelete.push(v.r2_key);
      if (v.thumb_r2_key) keysToDelete.push(v.thumb_r2_key);
      imageIds.add(v.image_id);
    }

    // Exclui arquivos do R2
    await storage.deleteKeys(keysToDelete);

    // Marca versões como deletadas
    for (const v of expiredVersions) {
      await execute(env.DB, `UPDATE image_versions SET deleted_at = ? WHERE id = ?`, [now, v.id]);
    }

    // Marca imagens como deletadas por retenção
    for (const imgId of imageIds) {
      await execute(
        env.DB,
        `UPDATE images SET deleted_at = ?, deletion_reason = 'retention' WHERE id = ?`,
        [now, imgId],
      );
    }
  }

  // 3. Processamento de solicitações de exclusão definitiva de conta (LGPD)
  interface DeletionReq {
    id: string;
    user_id: string;
  }

  const pendingAccountDeletions = await queryAll<DeletionReq>(
    env.DB,
    `SELECT id, user_id FROM deletion_requests
     WHERE type = 'account' AND status = 'pending' AND scheduled_for <= ?`,
    [now],
  );

  for (const req of pendingAccountDeletions) {
    try {
      console.log(`[Retention-LGPD] Anonimizando usuário ${req.user_id}`);

      // 1. Limpa todas as imagens restantes no R2
      await storage.deletePrefix(`u/${req.user_id}/`);

      // 2. Anonimiza tabela users
      const anonEmail = `anon-${req.user_id.slice(0, 8)}@deleted.alegon.local`;
      await execute(
        env.DB,
        `UPDATE users SET
          email = ?,
          password_hash = 'deleted',
          status = 'deleted',
          updated_at = ?
         WHERE id = ?`,
        [anonEmail, now, req.user_id],
      );

      // 3. Limpa perfil pessoal
      await execute(
        env.DB,
        `UPDATE profiles SET
          full_name = 'Usuário Anonimizado',
          cpf_cnpj = NULL,
          phone = NULL,
          marketing_opt_in = 0,
          updated_at = ?
         WHERE user_id = ?`,
        [now, req.user_id],
      );

      // 4. Limpa sessões e tokens
      await execute(env.DB, `DELETE FROM sessions WHERE user_id = ?`, [req.user_id]);
      await execute(env.DB, `DELETE FROM auth_tokens WHERE user_id = ?`, [req.user_id]);
      await execute(env.DB, `DELETE FROM mfa_secrets WHERE user_id = ?`, [req.user_id]);

      // 5. Conclui a requisição
      await execute(
        env.DB,
        `UPDATE deletion_requests SET status = 'completed', completed_at = ? WHERE id = ?`,
        [now, req.id],
      );
    } catch (err) {
      console.error(`[Retention-LGPD] Falha ao processar exclusão de ${req.user_id}:`, err);
      await execute(
        env.DB,
        `UPDATE deletion_requests SET status = 'failed', error = ? WHERE id = ?`,
        [String(err), req.id],
      );
    }
  }

  // 4. Limpeza de tabelas efêmeras
  await execute(
    env.DB,
    `DELETE FROM auth_tokens WHERE used_at IS NOT NULL OR expires_at < ?`,
    [addDays(now, -7)],
  );

  await execute(
    env.DB,
    `DELETE FROM sessions WHERE revoked_at IS NOT NULL OR expires_at < ?`,
    [addDays(now, -30)],
  );

  await execute(
    env.DB,
    `DELETE FROM rate_limit_buckets WHERE expires_at < ?`,
    [now],
  );

  console.log(`[Retention] Rotina de retenção concluída com sucesso.`);
}
