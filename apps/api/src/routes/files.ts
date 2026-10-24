/**
 * Rota de Entrega Segura de Arquivos R2 via Tokens Assinados.
 * Dono: Backend Engineer
 */
import { Hono } from 'hono';
import type { AppContext } from '../env';
import { DomainError } from '../contracts';
import { verifySignedFileToken } from '../storage';
import { optionalAuth } from '../middleware/auth';

const fileRoutes = new Hono<AppContext>();

// GET /files/:token
fileRoutes.get('/:token', optionalAuth(), async (c) => {
  const token = c.req.param('token');
  const payload = await verifySignedFileToken(c.env.SESSION_SECRET, token);

  if (!payload) {
    throw new DomainError('FORBIDDEN', 'Link de arquivo inválido ou expirado.', 403);
  }

  // Se o usuário estiver autenticado na sessão, valida se o token pertence a ele
  const currentUser = c.get('user');
  if (currentUser && currentUser.id !== payload.userId) {
    throw new DomainError('FORBIDDEN', 'Você não tem permissão para acessar este arquivo.', 403);
  }

  const obj = await c.env.MEDIA.get(payload.key);
  if (!obj) {
    throw new DomainError('NOT_FOUND', 'Arquivo não encontrado no servidor de mídia.', 404);
  }

  const headers = new Headers();
  headers.set('Content-Type', obj.httpMetadata?.contentType || 'application/octet-stream');
  headers.set('Cache-Control', 'private, max-age=60');

  if (payload.dl) {
    const filename = payload.fn || 'foto-alegon';
    headers.set('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
  }

  if (obj.size) {
    headers.set('Content-Length', obj.size.toString());
  }

  return new Response(obj.body, {
    status: 200,
    headers,
  });
});

export default fileRoutes;
