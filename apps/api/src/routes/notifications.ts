/**
 * Rotas de Notificações do Usuário.
 * Dono: Backend Engineer
 */
import { Hono } from 'hono';
import type { AppContext } from '../env';
import { DomainError } from '../contracts';
import { execute, paginate, queryOne } from '../db';
import { nowIso } from '../lib/http';
import { requireAuth } from '../middleware/auth';

const notificationRoutes = new Hono<AppContext>();

// GET /notifications - Listagem paginada e contador de não lidas
notificationRoutes.get('/', requireAuth(), async (c) => {
  const user = c.get('user');
  const cursor = c.req.query('cursor') || null;
  const limit = parseInt(c.req.query('limit') || '20', 10);

  interface NotificationItem {
    id: string;
    type: string;
    title: string;
    body: string;
    link: string | null;
    read_at: string | null;
    created_at: string;
  }

  const paginated = await paginate<NotificationItem>(c.env.DB, {
    table: 'notifications',
    select: 'id, type, title, body, link, read_at, created_at',
    whereClause: 'user_id = ?',
    params: [user.id],
    sortColumn: 'created_at',
    order: 'DESC',
    cursor,
    limit,
  });

  const unreadCount = await queryOne<{ total: number }>(
    c.env.DB,
    'SELECT COUNT(id) as total FROM notifications WHERE user_id = ? AND read_at IS NULL',
    [user.id],
  );

  return c.json({
    items: paginated.items.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      body: n.body,
      link: n.link,
      read: Boolean(n.read_at),
      readAt: n.read_at,
      createdAt: n.created_at,
    })),
    nextCursor: paginated.nextCursor,
    unreadCount: unreadCount?.total ?? 0,
  });
});

// POST /notifications/:id/read - Marcar como lida
notificationRoutes.post('/:id/read', requireAuth(), async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  const now = nowIso();

  const existing = await queryOne<{ id: string }>(
    c.env.DB,
    'SELECT id FROM notifications WHERE id = ? AND user_id = ?',
    [id, user.id],
  );

  if (!existing) {
    throw new DomainError('NOT_FOUND', 'Notificação não encontrada.', 404);
  }

  await execute(
    c.env.DB,
    'UPDATE notifications SET read_at = ? WHERE id = ? AND read_at IS NULL',
    [now, id],
  );

  return c.json({ message: 'Notificação marcada como lida.' });
});

// POST /notifications/read-all - Marcar todas como lidas
notificationRoutes.post('/read-all', requireAuth(), async (c) => {
  const user = c.get('user');
  const now = nowIso();

  await execute(
    c.env.DB,
    'UPDATE notifications SET read_at = ? WHERE user_id = ? AND read_at IS NULL',
    [now, user.id],
  );

  return c.json({ message: 'Todas as notificações foram marcadas como lidas.' });
});

export default notificationRoutes;
