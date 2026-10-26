/**
 * Consumidor da fila EDIT_QUEUE (alegon-edit-jobs).
 * Dono: Backend Engineer
 */
import type { MessageBatch, ExecutionContext } from '@cloudflare/workers-types';
import type { EditJobMessage, EditTool, ImageMime, Tier } from '../contracts';
import { DomainError } from '../contracts';
import type { Env } from '../env';
import { execute, queryOne } from '../db';
import { addDays, newId, nowIso } from '../lib/http';
import { calculateUserRetentionDays } from '../lib/retention-calculator';
import { createStorageService } from '../storage';
import { createAiEditService } from '../ai';
import { validateImageUpload } from '../security/upload';
import { sha256Hex } from '../auth/crypto';
import { getWalletService } from '../routes/edits';
import { sendEmail } from '../email';

function getExtension(mime: ImageMime): string {
  switch (mime) {
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    default:
      return 'png';
  }
}

export async function processSingleEditJob(
  jobId: string,
  env: Env,
  ctx?: ExecutionContext,
): Promise<void> {
  interface JobDetails {
    id: string;
    user_id: string;
    status: string;
    reservation_id: string | null;
    attempts: number;
    prompt: string;
    tool: EditTool;
    tier: Tier;
    source_version_id: string;
    image_id: string;
    email: string;
  }

  const job = await queryOne<JobDetails>(
    env.DB,
    `SELECT j.id, j.user_id, j.status, j.reservation_id, j.attempts,
            r.prompt, r.tool, r.tier, r.source_version_id, r.image_id,
            u.email
     FROM edit_jobs j
     JOIN edit_requests r ON r.id = j.edit_request_id
     JOIN users u ON u.id = j.user_id
     WHERE j.id = ?`,
    [jobId],
  );

  if (!job || (job.status !== 'queued' && job.status !== 'processing')) {
    return;
  }

  const userId = job.user_id;
  const startTime = nowIso();
  await execute(
    env.DB,
    `UPDATE edit_jobs SET status = 'processing', started_at = ?, attempts = attempts + 1 WHERE id = ?`,
    [startTime, jobId],
  );

  try {
    // 1. Carrega versão de origem
    interface SourceVersion {
      r2_key: string;
      mime: ImageMime;
      width: number | null;
      height: number | null;
    }

    const sourceVersion = await queryOne<SourceVersion>(
      env.DB,
      'SELECT r2_key, mime, width, height FROM image_versions WHERE id = ?',
      [job.source_version_id],
    );

    if (!sourceVersion) {
      throw new DomainError('SOURCE_NOT_FOUND', 'Versão original da foto não encontrada.', 404);
    }

    // 2. Busca binário no R2
    const storage = createStorageService(env);
    const fileData = await storage.getObject(sourceVersion.r2_key);

    if (!fileData) {
      throw new DomainError('MEDIA_NOT_FOUND', 'Arquivo de origem ausente no armazenamento.', 404);
    }

    // 3. Executa a edição na IA (OpenRouter)
    const ai = createAiEditService(env);
    const aiResult = await ai.runEdit({
      jobId,
      userId,
      prompt: job.prompt,
      tool: job.tool,
      tier: job.tier,
      source: {
        bytes: fileData.bytes,
        mime: sourceVersion.mime,
        width: sourceVersion.width ?? undefined,
        height: sourceVersion.height ?? undefined,
      },
    });

    // 4. Valida a imagem resultante (magic bytes, dimensões, polyglots)
    const validated = validateImageUpload(aiResult.bytes, aiResult.mime);

    // 5. Determina número da versão
    const maxVer = await queryOne<{ nextVersion: number }>(
      env.DB,
      'SELECT COALESCE(MAX(version_number), 1) + 1 as nextVersion FROM image_versions WHERE image_id = ?',
      [job.image_id],
    );
    const nextVersionNumber = maxVer?.nextVersion ?? 2;

    // 6. Grava a nova versão no R2
    const newVersionId = newId();
    const ext = getExtension(validated.mime);
    const newR2Key = `u/${userId}/i/${job.image_id}/v/${newVersionId}.${ext}`;

    await storage.putObject(newR2Key, aiResult.bytes, validated.mime);

    const fileHash = await sha256Hex(new Uint8Array(aiResult.bytes));
    const now = nowIso();
    const retentionDays = await calculateUserRetentionDays(env.DB, userId);
    const expiresAt = addDays(now, retentionDays);

    // 7. Insere nova versão em image_versions
    await execute(
      env.DB,
      `INSERT INTO image_versions (
        id, image_id, user_id, parent_version_id, version_number, kind, r2_key,
        mime, width, height, size_bytes, sha256, edit_job_id, prompt_summary, created_at, expires_at
       ) VALUES (?, ?, ?, ?, ?, 'edit', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newVersionId,
        job.image_id,
        userId,
        job.source_version_id,
        nextVersionNumber,
        newR2Key,
        validated.mime,
        validated.width,
        validated.height,
        aiResult.bytes.byteLength,
        fileHash,
        jobId,
        job.prompt.slice(0, 100),
        now,
        expiresAt,
      ],
    );

    // 8. Atualiza ponteiro da imagem para a nova versão
    await execute(
      env.DB,
      'UPDATE images SET current_version_id = ?, expires_at = ? WHERE id = ?',
      [newVersionId, expiresAt, job.image_id],
    );

    // 9. Atualiza job como bem-sucedido
    await execute(
      env.DB,
      `UPDATE edit_jobs SET status = 'succeeded', result_version_id = ?, model_id = ?, finished_at = ? WHERE id = ?`,
      [newVersionId, aiResult.modelId, now, jobId],
    );

    // 10. Consome a reserva de créditos na carteira
    if (job.reservation_id) {
      const wallet = await getWalletService(env);
      await wallet.consume(job.reservation_id);
    }

    // 11. Insere notificação no sistema
    const notifId = newId();
    await execute(
      env.DB,
      `INSERT INTO notifications (id, user_id, type, title, body, link, created_at)
       VALUES (?, ?, 'edit_done', 'Edição com IA concluída!', 'Sua foto foi processada com sucesso. Clique para visualizar.', ?, ?)`,
      [notifId, userId, `/images/${job.image_id}`, now],
    );

    // 12. Envia e-mail notificando o usuário
    if (ctx) {
      ctx.waitUntil(
        sendEmail(env, {
          to: job.email,
          template: 'edit_completed',
          payload: { imageId: job.image_id },
          userId,
        }),
      );
    } else {
      await sendEmail(env, {
        to: job.email,
        template: 'edit_completed',
        payload: { imageId: job.image_id },
        userId,
      });
    }
  } catch (err: unknown) {
    const now = nowIso();
    const isDomain = err instanceof DomainError;
    const errorCode = isDomain ? (err as DomainError).code : 'EDIT_FAILED';
    const errorMessage = err instanceof Error ? err.message : String(err);

    // Falhas técnicas elegíveis para estorno/liberação de créditos
    const isTechnicalFailure =
      errorCode === 'AI_TIMEOUT' ||
      errorCode === 'AI_UNAVAILABLE' ||
      errorCode === 'AI_INVALID_OUTPUT' ||
      errorCode === 'AI_ERROR' ||
      errorCode === 'MEDIA_NOT_FOUND' ||
      errorCode === 'SOURCE_NOT_FOUND';

    if (job.reservation_id && isTechnicalFailure) {
      try {
        const wallet = await getWalletService(env);
        await wallet.release(job.reservation_id, `Falha técnica: ${errorMessage}`);
      } catch (releaseErr) {
        console.error(`[EditConsumer] Falha ao liberar reserva ${job.reservation_id}:`, releaseErr);
      }
    }

    await execute(
      env.DB,
      `UPDATE edit_jobs SET status = 'failed', error_code = ?, error_message = ?, finished_at = ? WHERE id = ?`,
      [errorCode, errorMessage.slice(0, 500), now, jobId],
    );

    // Notifica o usuário sobre a falha
    await execute(
      env.DB,
      `INSERT INTO notifications (id, user_id, type, title, body, link, created_at)
       VALUES (?, ?, 'edit_failed', 'Não foi possível concluir a edição', ?, ?, ?)`,
      [
        newId(),
        userId,
        `Ocorreu um erro no processamento: ${errorMessage}. Seus créditos foram mantidos intactos.`,
        `/images/${job.image_id}`,
        now,
      ],
    );
  }
}

export async function handleEditQueue(
  batch: MessageBatch<EditJobMessage>,
  env: Env,
  ctx?: ExecutionContext,
): Promise<void> {
  for (const message of batch.messages) {
    await processSingleEditJob(message.body.jobId, env, ctx);
    message.ack();
  }
}
