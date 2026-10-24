/**
 * Rotas de Gerenciamento e Upload de Imagens e Versões.
 * Dono: Backend Engineer
 */
import { Hono } from 'hono';
import { z } from 'zod';
import type { AppContext } from '../env';
import { DomainError, type ImageMime } from '../contracts';
import { execute, getSystemSetting, paginate, queryAll, queryOne } from '../db';
import { addDays, newId, nowIso, parseJson } from '../lib/http';
import { requireAuth } from '../middleware/auth';
import { createStorageService } from '../storage';
import { validateImageUpload } from '../security/upload';
import { sha256Hex } from '../auth/crypto';

const imageRoutes = new Hono<AppContext>();

const UpdateImageSchema = z.object({
  title: z.string().max(200).optional(),
  projectId: z.string().nullable().optional(),
});

const SignedUrlRequestSchema = z.object({
  variant: z.enum(['full', 'thumb']).default('full'),
  download: z.boolean().optional().default(false),
});

function getExtension(mime: ImageMime): string {
  switch (mime) {
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    default:
      return 'bin';
  }
}

// POST /images - Upload de foto original
imageRoutes.post('/', requireAuth(), async (c) => {
  const user = c.get('user');
  const now = nowIso();

  // Verifica limite diário de uploads
  const maxUploadsPerDay = await getSystemSetting<number>(
    c.env.DB,
    'limits.uploads_per_user_per_day',
    100,
  );

  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  const uploadCountToday = await queryOne<{ total: number }>(
    c.env.DB,
    `SELECT COUNT(id) as total FROM images WHERE user_id = ? AND created_at >= ?`,
    [user.id, todayStart.toISOString()],
  );

  if ((uploadCountToday?.total ?? 0) >= maxUploadsPerDay) {
    throw new DomainError(
      'DAILY_LIMIT_REACHED',
      `Limite diário de ${maxUploadsPerDay} uploads atingido. Tente novamente amanhã.`,
      429,
    );
  }

  const formData = await c.req.formData();
  const file = formData.get('file');

  const isFile = (v: unknown): v is { name: string; type: string; size: number; arrayBuffer(): Promise<ArrayBuffer> } =>
    typeof v === 'object' && v !== null && 'arrayBuffer' in v;

  if (!file || !isFile(file)) {
    throw new DomainError('VALIDATION_ERROR', 'Arquivo de imagem obrigatório no campo "file".', 422);
  }

  const projectId = formData.get('projectId');
  const title = (formData.get('title') as string) || file.name || 'Nova Foto';

  // Se projectId foi passado, valida se pertence ao usuário
  if (projectId && typeof projectId === 'string') {
    const project = await queryOne<{ id: string }>(
      c.env.DB,
      'SELECT id FROM projects WHERE id = ? AND user_id = ? AND deleted_at IS NULL',
      [projectId, user.id],
    );
    if (!project) {
      throw new DomainError('NOT_FOUND', 'Projeto informado não encontrado.', 404);
    }
  }

  const fileBytes = await file.arrayBuffer();
  const validated = validateImageUpload(fileBytes, file.type);

  const imageId = newId();
  const versionId = newId();
  const ext = getExtension(validated.mime);
  const r2Key = `u/${user.id}/i/${imageId}/v/${versionId}.${ext}`;

  const storage = createStorageService(c.env);

  // Grava arquivo principal no R2
  await storage.putObject(r2Key, fileBytes, validated.mime);

  // Miniatura opcional
  let thumbR2Key: string | null = null;
  const thumb = formData.get('thumb');
  if (thumb && isFile(thumb) && thumb.size > 0 && thumb.size <= 300 * 1024) {
    try {
      const thumbBytes = await thumb.arrayBuffer();
      thumbR2Key = `u/${user.id}/i/${imageId}/v/${versionId}/thumb.webp`;
      await storage.putObject(thumbR2Key, thumbBytes, 'image/webp');
    } catch {
      // Miniatura opcional: se falhar, continua sem ela
      thumbR2Key = null;
    }
  }

  const fileHash = await sha256Hex(new Uint8Array(fileBytes));
  const retentionDays = await getSystemSetting<number>(c.env.DB, 'retention.days', 90);
  const expiresAt = addDays(now, retentionDays);

  // Insere na tabela images
  await execute(
    c.env.DB,
    `INSERT INTO images (id, user_id, project_id, title, current_version_id, created_at, expires_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      imageId,
      user.id,
      projectId && typeof projectId === 'string' ? projectId : null,
      title.slice(0, 200),
      versionId,
      now,
      expiresAt,
    ],
  );

  // Insere na tabela image_versions (versão 1, original, imutável)
  await execute(
    c.env.DB,
    `INSERT INTO image_versions (
      id, image_id, user_id, parent_version_id, version_number, kind, r2_key, thumb_r2_key,
      mime, width, height, size_bytes, sha256, created_at, expires_at
     ) VALUES (?, ?, ?, NULL, 1, 'original', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      versionId,
      imageId,
      user.id,
      r2Key,
      thumbR2Key,
      validated.mime,
      validated.width,
      validated.height,
      fileBytes.byteLength,
      fileHash,
      now,
      expiresAt,
    ],
  );

  // Gera URLs assinadas para a resposta
  const fullSigned = await storage.signedUrl({ key: r2Key, userId: user.id });
  const thumbSigned = thumbR2Key
    ? await storage.signedUrl({ key: thumbR2Key, userId: user.id })
    : fullSigned;

  return c.json(
    {
      image: {
        id: imageId,
        title,
        projectId: projectId ?? null,
        currentVersionId: versionId,
        createdAt: now,
        expiresAt,
        daysLeft: retentionDays,
      },
      version: {
        id: versionId,
        versionNumber: 1,
        kind: 'original',
        mime: validated.mime,
        width: validated.width,
        height: validated.height,
        sizeBytes: fileBytes.byteLength,
        url: fullSigned.url,
        thumbUrl: thumbSigned.url,
        createdAt: now,
        expiresAt,
      },
    },
    201,
  );
});

// GET /images - Listagem paginada com contagem regressiva
imageRoutes.get('/', requireAuth(), async (c) => {
  const user = c.get('user');
  const query = c.req.query();
  const projectId = query.projectId;
  const sort = query.sort === 'expiring' ? 'expiring' : 'recent';
  const cursor = query.cursor || null;
  const limit = parseInt(query.limit || '20', 10);

  const whereParts = ['user_id = ?', 'deleted_at IS NULL'];
  const params: unknown[] = [user.id];

  if (projectId) {
    whereParts.push('project_id = ?');
    params.push(projectId);
  }

  interface ImageListRow {
    id: string;
    title: string | null;
    project_id: string | null;
    created_at: string;
    expires_at: string;
    current_version_id: string | null;
    r2_key: string | null;
    thumb_r2_key: string | null;
    version_count: number;
  }

  const sortColumn = sort === 'expiring' ? 'expires_at' : 'created_at';
  const order = sort === 'expiring' ? 'ASC' : 'DESC';

  const select = `
    i.id, i.title, i.project_id, i.created_at, i.expires_at, i.current_version_id,
    v.r2_key, v.thumb_r2_key,
    (SELECT COUNT(iv.id) FROM image_versions iv WHERE iv.image_id = i.id AND iv.deleted_at IS NULL) as version_count
  `;

  const paginated = await paginate<ImageListRow>(c.env.DB, {
    table: 'images i LEFT JOIN image_versions v ON v.id = i.current_version_id',
    select,
    whereClause: whereParts.map((p) => `i.${p}`).join(' AND '),
    params,
    sortColumn: `i.${sortColumn}`,
    order,
    cursor,
    limit,
  });

  const storage = createStorageService(c.env);
  const nowMs = Date.now();

  const items = await Promise.all(
    paginated.items.map(async (item) => {
      const expMs = new Date(item.expires_at).getTime();
      const daysLeft = Math.max(0, Math.ceil((expMs - nowMs) / 86_400_000));

      let thumbUrl: string | null = null;
      const keyForThumb = item.thumb_r2_key || item.r2_key;
      if (keyForThumb) {
        const signed = await storage.signedUrl({ key: keyForThumb, userId: user.id });
        thumbUrl = signed.url;
      }

      return {
        id: item.id,
        title: item.title,
        projectId: item.project_id,
        createdAt: item.created_at,
        expiresAt: item.expires_at,
        daysLeft,
        versionCount: item.version_count ?? 1,
        currentVersionId: item.current_version_id,
        thumbUrl,
      };
    }),
  );

  return c.json({
    items,
    nextCursor: paginated.nextCursor,
  });
});

// GET /images/:id - Detalhes da imagem, versões e jobs
imageRoutes.get('/:id', requireAuth(), async (c) => {
  const user = c.get('user');
  const imageId = c.req.param('id');

  interface ImageDetails {
    id: string;
    title: string | null;
    project_id: string | null;
    created_at: string;
    expires_at: string;
    current_version_id: string | null;
  }

  const image = await queryOne<ImageDetails>(
    c.env.DB,
    'SELECT id, title, project_id, created_at, expires_at, current_version_id FROM images WHERE id = ? AND user_id = ? AND deleted_at IS NULL',
    [imageId, user.id],
  );

  if (!image) {
    throw new DomainError('NOT_FOUND', 'Imagem não encontrada.', 404);
  }

  interface VersionItem {
    id: string;
    version_number: number;
    kind: string;
    parent_version_id: string | null;
    r2_key: string;
    thumb_r2_key: string | null;
    mime: ImageMime;
    width: number | null;
    height: number | null;
    size_bytes: number;
    prompt_summary: string | null;
    created_at: string;
    expires_at: string;
  }

  const versions = await queryAll<VersionItem>(
    c.env.DB,
    `SELECT id, version_number, kind, parent_version_id, r2_key, thumb_r2_key,
            mime, width, height, size_bytes, prompt_summary, created_at, expires_at
     FROM image_versions
     WHERE image_id = ? AND user_id = ? AND deleted_at IS NULL
     ORDER BY version_number ASC`,
    [imageId, user.id],
  );

  const storage = createStorageService(c.env);

  const versionsWithUrls = await Promise.all(
    versions.map(async (v) => {
      const signedFull = await storage.signedUrl({ key: v.r2_key, userId: user.id });
      const signedThumb = v.thumb_r2_key
        ? await storage.signedUrl({ key: v.thumb_r2_key, userId: user.id })
        : signedFull;

      return {
        id: v.id,
        versionNumber: v.version_number,
        kind: v.kind,
        parentVersionId: v.parent_version_id,
        mime: v.mime,
        width: v.width,
        height: v.height,
        sizeBytes: v.size_bytes,
        promptSummary: v.prompt_summary,
        url: signedFull.url,
        thumbUrl: signedThumb.url,
        createdAt: v.created_at,
        expiresAt: v.expires_at,
      };
    }),
  );

  interface JobRow {
    id: string;
    status: string;
    result_version_id: string | null;
    error_code: string | null;
    error_message: string | null;
    created_at: string;
    finished_at: string | null;
  }

  const jobs = await queryAll<JobRow>(
    c.env.DB,
    `SELECT id, status, result_version_id, error_code, error_message, created_at, finished_at
     FROM edit_jobs WHERE image_id = ? AND user_id = ?
     ORDER BY created_at DESC LIMIT 10`,
    [imageId, user.id],
  );

  const nowMs = Date.now();
  const expMs = new Date(image.expires_at).getTime();
  const daysLeft = Math.max(0, Math.ceil((expMs - nowMs) / 86_400_000));

  return c.json({
    image: {
      ...image,
      daysLeft,
    },
    versions: versionsWithUrls,
    jobs: jobs.map((j) => ({
      id: j.id,
      status: j.status,
      resultVersionId: j.result_version_id,
      errorCode: j.error_code,
      errorMessage: j.error_message,
      createdAt: j.created_at,
      finishedAt: j.finished_at,
    })),
  });
});

// PATCH /images/:id - Atualizar metadados
imageRoutes.patch('/:id', requireAuth(), async (c) => {
  const body = await parseJson(c, UpdateImageSchema);
  const user = c.get('user');
  const imageId = c.req.param('id');

  const existing = await queryOne<{ id: string }>(
    c.env.DB,
    'SELECT id FROM images WHERE id = ? AND user_id = ? AND deleted_at IS NULL',
    [imageId, user.id],
  );

  if (!existing) {
    throw new DomainError('NOT_FOUND', 'Imagem não encontrada.', 404);
  }

  const updates: string[] = [];
  const params: unknown[] = [];

  if (body.title !== undefined) {
    updates.push('title = ?');
    params.push(body.title.trim());
  }

  if (body.projectId !== undefined) {
    if (body.projectId) {
      const project = await queryOne<{ id: string }>(
        c.env.DB,
        'SELECT id FROM projects WHERE id = ? AND user_id = ? AND deleted_at IS NULL',
        [body.projectId, user.id],
      );
      if (!project) {
        throw new DomainError('NOT_FOUND', 'Projeto informado não encontrado.', 404);
      }
    }
    updates.push('project_id = ?');
    params.push(body.projectId);
  }

  if (updates.length > 0) {
    params.push(imageId, user.id);
    await execute(
      c.env.DB,
      `UPDATE images SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`,
      params,
    );
  }

  return c.json({ message: 'Imagem atualizada com sucesso.' });
});

// DELETE /images/:id - Exclusão total antecipada
imageRoutes.delete('/:id', requireAuth(), async (c) => {
  const user = c.get('user');
  const imageId = c.req.param('id');
  const now = nowIso();

  const existing = await queryOne<{ id: string }>(
    c.env.DB,
    'SELECT id FROM images WHERE id = ? AND user_id = ? AND deleted_at IS NULL',
    [imageId, user.id],
  );

  if (!existing) {
    throw new DomainError('NOT_FOUND', 'Imagem não encontrada.', 404);
  }

  const storage = createStorageService(c.env);

  // 1. Apaga do R2 pelo prefixo da imagem
  await storage.deletePrefix(`u/${user.id}/i/${imageId}/`);

  // 2. Marca na base como deletada
  await execute(
    c.env.DB,
    `UPDATE images SET deleted_at = ?, deletion_reason = 'user' WHERE id = ?`,
    [now, imageId],
  );
  await execute(
    c.env.DB,
    `UPDATE image_versions SET deleted_at = ? WHERE image_id = ?`,
    [now, imageId],
  );

  return c.body(null, 204);
});

// DELETE /images/:id/versions/:versionId - Exclusão de versão específica
imageRoutes.delete('/:id/versions/:versionId', requireAuth(), async (c) => {
  const user = c.get('user');
  const imageId = c.req.param('id');
  const versionId = c.req.param('versionId');
  const now = nowIso();

  interface VersionRow {
    id: string;
    r2_key: string;
    thumb_r2_key: string | null;
    version_number: number;
    kind: string;
  }

  const version = await queryOne<VersionRow>(
    c.env.DB,
    'SELECT id, r2_key, thumb_r2_key, version_number, kind FROM image_versions WHERE id = ? AND image_id = ? AND user_id = ? AND deleted_at IS NULL',
    [versionId, imageId, user.id],
  );

  if (!version) {
    throw new DomainError('NOT_FOUND', 'Versão não encontrada.', 404);
  }

  // Deleta arquivos do R2
  const storage = createStorageService(c.env);
  const keysToDelete = [version.r2_key];
  if (version.thumb_r2_key) keysToDelete.push(version.thumb_r2_key);
  await storage.deleteKeys(keysToDelete);

  // Marca versão como excluída
  await execute(
    c.env.DB,
    'UPDATE image_versions SET deleted_at = ? WHERE id = ?',
    [now, versionId],
  );

  // Se for a versão atual, atualiza ponteiro da imagem para a versão mais recente restante
  const remaining = await queryOne<{ id: string }>(
    c.env.DB,
    `SELECT id FROM image_versions WHERE image_id = ? AND deleted_at IS NULL ORDER BY version_number DESC LIMIT 1`,
    [imageId],
  );

  if (remaining) {
    await execute(
      c.env.DB,
      'UPDATE images SET current_version_id = ? WHERE id = ?',
      [remaining.id, imageId],
    );
  }

  return c.body(null, 204);
});

// POST /images/:id/versions/:versionId/url - Gera URL assinada para visualização ou download
imageRoutes.post('/:id/versions/:versionId/url', requireAuth(), async (c) => {
  const body = await parseJson(c, SignedUrlRequestSchema);
  const user = c.get('user');
  const imageId = c.req.param('id');
  const versionId = c.req.param('versionId');

  interface VersionRow {
    r2_key: string;
    thumb_r2_key: string | null;
    mime: ImageMime;
  }

  const version = await queryOne<VersionRow>(
    c.env.DB,
    'SELECT r2_key, thumb_r2_key, mime FROM image_versions WHERE id = ? AND image_id = ? AND user_id = ? AND deleted_at IS NULL',
    [versionId, imageId, user.id],
  );

  if (!version) {
    throw new DomainError('NOT_FOUND', 'Versão não encontrada.', 404);
  }

  const storage = createStorageService(c.env);
  const targetKey =
    body.variant === 'thumb' && version.thumb_r2_key ? version.thumb_r2_key : version.r2_key;

  const ext = getExtension(version.mime);
  const filename = `foto-${imageId}-v${versionId}.${ext}`;

  const signed = await storage.signedUrl({
    key: targetKey,
    userId: user.id,
    ttlSeconds: 300, // 5 minutos
    download: body.download,
    filename: body.download ? filename : undefined,
  });

  return c.json({
    url: signed.url,
    expiresAt: signed.expiresAt,
  });
});

export default imageRoutes;
