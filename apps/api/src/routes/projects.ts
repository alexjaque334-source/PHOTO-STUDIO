/**
 * Rotas de Gestão de Projetos / Pastas de Fotos.
 * Dono: Backend Engineer
 */
import { Hono } from 'hono';
import { z } from 'zod';
import type { AppContext } from '../env';
import { DomainError } from '../contracts';
import { execute, queryAll, queryOne } from '../db';
import { newId, nowIso, parseJson } from '../lib/http';
import { requireAuth } from '../middleware/auth';

const projectRoutes = new Hono<AppContext>();

const CreateProjectSchema = z.object({
  name: z.string().min(1, 'O nome do projeto é obrigatório.').max(100),
});

const UpdateProjectSchema = z.object({
  name: z.string().min(1, 'O nome do projeto é obrigatório.').max(100),
});

// GET /projects
projectRoutes.get('/', requireAuth(), async (c) => {
  const user = c.get('user');

  interface ProjectWithCount {
    id: string;
    name: string;
    created_at: string;
    updated_at: string;
    imageCount: number;
  }

  const projects = await queryAll<ProjectWithCount>(
    c.env.DB,
    `SELECT p.id, p.name, p.created_at, p.updated_at,
            COUNT(i.id) as imageCount
     FROM projects p
     LEFT JOIN images i ON i.project_id = p.id AND i.deleted_at IS NULL
     WHERE p.user_id = ? AND p.deleted_at IS NULL
     GROUP BY p.id
     ORDER BY p.updated_at DESC`,
    [user.id],
  );

  return c.json({ items: projects });
});

// POST /projects
projectRoutes.post('/', requireAuth(), async (c) => {
  const body = await parseJson(c, CreateProjectSchema);
  const user = c.get('user');
  const id = newId();
  const now = nowIso();

  await execute(
    c.env.DB,
    `INSERT INTO projects (id, user_id, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`,
    [id, user.id, body.name.trim(), now, now],
  );

  return c.json(
    {
      id,
      name: body.name.trim(),
      created_at: now,
      updated_at: now,
      imageCount: 0,
    },
    201,
  );
});

// PATCH /projects/:id
projectRoutes.patch('/:id', requireAuth(), async (c) => {
  const body = await parseJson(c, UpdateProjectSchema);
  const user = c.get('user');
  const projectId = c.req.param('id');
  const now = nowIso();

  const existing = await queryOne<{ id: string }>(
    c.env.DB,
    'SELECT id FROM projects WHERE id = ? AND user_id = ? AND deleted_at IS NULL',
    [projectId, user.id],
  );

  if (!existing) {
    throw new DomainError('NOT_FOUND', 'Projeto não encontrado.', 404);
  }

  await execute(
    c.env.DB,
    'UPDATE projects SET name = ?, updated_at = ? WHERE id = ?',
    [body.name.trim(), now, projectId],
  );

  return c.json({ id: projectId, name: body.name.trim(), updated_at: now });
});

// DELETE /projects/:id
projectRoutes.delete('/:id', requireAuth(), async (c) => {
  const user = c.get('user');
  const projectId = c.req.param('id');
  const now = nowIso();

  const existing = await queryOne<{ id: string }>(
    c.env.DB,
    'SELECT id FROM projects WHERE id = ? AND user_id = ? AND deleted_at IS NULL',
    [projectId, user.id],
  );

  if (!existing) {
    throw new DomainError('NOT_FOUND', 'Projeto não encontrado.', 404);
  }

  // Desassocia imagens do projeto
  await execute(
    c.env.DB,
    'UPDATE images SET project_id = NULL WHERE project_id = ? AND user_id = ?',
    [projectId, user.id],
  );

  // Marca projeto como deletado
  await execute(
    c.env.DB,
    'UPDATE projects SET deleted_at = ?, updated_at = ? WHERE id = ?',
    [now, now, projectId],
  );

  return c.body(null, 204);
});

export default projectRoutes;
