/**
 * Rotas de Feedback de Clientes e Assinantes.
 */
import { Hono } from 'hono';
import { z } from 'zod';
import type { AppContext } from '../env';
import { newId, nowIso, parseJson } from '../lib/http';
import { getSessionTokenFromCookie } from '../auth/session';
import { queryOne } from '../db';

const feedbackRoutes = new Hono<AppContext>();

const FeedbackSchema = z.object({
  rating: z.number().int().min(1).max(5),
  category: z.enum(['qualidade_ia', 'velocidade', 'sugestao', 'geral', 'bug']).default('geral'),
  message: z.string().min(2, 'O comentário deve ter no mínimo 2 caracteres').max(1000, 'Máximo 1000 caracteres'),
  email: z.string().email().optional(),
  name: z.string().optional(),
});

feedbackRoutes.post('/', async (c) => {
  const body = await parseJson(c, FeedbackSchema);

  // Tenta obter usuário autenticado via sessão
  let userId: string | null = null;
  let userEmail = body.email || 'assinante@photostudio.ai';
  let userName = body.name || 'Assinante Studio';

  const sessionToken = getSessionTokenFromCookie(c);
  if (sessionToken && c.env.DB) {
    try {
      const sessionUser = await queryOne<{ id: string; email: string; full_name: string | null }>(
        c.env.DB,
        `SELECT u.id, u.email, p.full_name 
         FROM sessions s 
         JOIN users u ON u.id = s.user_id 
         LEFT JOIN profiles p ON p.user_id = u.id 
         WHERE s.token = ? AND s.expires_at > ?`,
        [sessionToken, nowIso()],
      );
      if (sessionUser) {
        userId = sessionUser.id;
        userEmail = sessionUser.email;
        if (sessionUser.full_name) {
          userName = sessionUser.full_name;
        }
      }
    } catch {
      // continua com os dados fornecidos no body ou defaults
    }
  }

  const feedbackId = newId();
  const createdAt = nowIso();

  if (c.env.DB) {
    await c.env.DB
      .prepare(
        `INSERT INTO customer_feedbacks (id, user_id, user_email, user_name, rating, category, message, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'novo', ?)`
      )
      .bind(feedbackId, userId, userEmail, userName, body.rating, body.category, body.message, createdAt)
      .run();
  }

  return c.json({
    ok: true,
    id: feedbackId,
    message: 'Feedback recebido com sucesso! Muito obrigado pela sua contribuição.',
  }, 201);
});

export default feedbackRoutes;
