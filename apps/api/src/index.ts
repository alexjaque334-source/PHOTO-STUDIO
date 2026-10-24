/**
 * Entry point do Worker — CANÔNICO (dono: Tech Lead; Backend pode editar com coordenação).
 * Monta os sub-apps de cada módulo. Cada arquivo de rota exporta `default` um `new Hono<AppContext>()`.
 */
import { Hono } from 'hono';
import type { AppContext, Env } from './env';
import type { EditJobMessage, WebhookMessage } from './contracts';
import { errorHandler, requestId } from './lib/http';

// Segurança (Subagente Segurança/LGPD)
import { securityHeaders } from './security/headers';
import { csrfProtection } from './security/csrf';
import { ensureDatabaseSchema } from './db/auto-migrate';

// Backend
import authRoutes from './routes/auth';
import accountRoutes from './routes/account';
import projectRoutes from './routes/projects';
import imageRoutes from './routes/images';
import fileRoutes from './routes/files';
import editRoutes from './routes/edits';
import notificationRoutes from './routes/notifications';
import feedbackRoutes from './routes/feedback';
import adminRoutes from './routes/admin';
import { handleEditQueue } from './jobs/edit-consumer';
import { runRetention } from './jobs/retention';

// Billing (Subagente Asaas)
import billingRoutes from './routes/billing';
import walletRoutes from './routes/wallet';
import webhookRoutes from './routes/webhooks';
import adminBillingRoutes from './routes/admin-billing';
import { handleWebhookQueue, runBillingMaintenance } from './billing';

// AI (Subagente OpenRouter)
import adminAiRoutes from './routes/admin-ai';

const app = new Hono<AppContext>();

app.use('*', requestId());
app.use('/api/*', securityHeaders());
app.use('/api/*', csrfProtection()); // isenta /api/webhooks/* (autenticação por token)
app.use('/api/*', async (c, next) => {
  if (c.env.DB) {
    await ensureDatabaseSchema(c.env);
  }
  await next();
});

app.get('/api/health', (c) => c.json({ ok: true, env: c.env.ENVIRONMENT }));

app.route('/api/auth', authRoutes);
app.route('/api/account', accountRoutes);
app.route('/api/projects', projectRoutes);
app.route('/api/images', imageRoutes);
app.route('/api/files', fileRoutes);
app.route('/api/edits', editRoutes);
app.route('/api/notifications', notificationRoutes);
app.route('/api/feedback', feedbackRoutes);
app.route('/api/wallet', walletRoutes);
app.route('/api/billing', billingRoutes);
app.route('/api/webhooks', webhookRoutes);
app.route('/api/admin', adminRoutes);
app.route('/api/admin', adminBillingRoutes);
app.route('/api/admin', adminAiRoutes);

app.notFound((c) =>
  c.req.path.startsWith('/api/')
    ? c.json({ error: { code: 'NOT_FOUND', message: 'Recurso não encontrado.' } }, 404)
    : c.env.ASSETS.fetch(c.req.raw),
);
app.onError(errorHandler);

export default {
  fetch: app.fetch,

  async queue(batch: MessageBatch<EditJobMessage | WebhookMessage>, env: Env, ctx: ExecutionContext) {
    if (batch.queue.startsWith('alegon-edit-jobs')) {
      await handleEditQueue(batch as MessageBatch<EditJobMessage>, env, ctx);
    } else if (batch.queue.startsWith('alegon-asaas-webhooks')) {
      await handleWebhookQueue(batch as MessageBatch<WebhookMessage>, env, ctx);
    }
  },

  async scheduled(event: ScheduledController, env: Env, ctx: ExecutionContext) {
    if (event.cron === '0 3 * * *') {
      ctx.waitUntil(runRetention(env));
    } else {
      ctx.waitUntil(runBillingMaintenance(env));
    }
  },
} satisfies ExportedHandler<Env, EditJobMessage | WebhookMessage>;

export { app };
