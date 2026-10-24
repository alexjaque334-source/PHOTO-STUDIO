/**
 * Rotas administrativas de IA — ALEGON AI Photo Studio.
 * Dono: Subagente OpenRouter.
 * 
 * Rotas expostas em /api/admin:
 * - GET /models (lista todos os modelos cadastrados)
 * - PUT /models/:id (atualiza parâmetros, prioridade, ativação ou custo)
 * - GET /ai/usage (métricas e agregação de consumo de API)
 * - POST /models/:id/test (teste real de validação de modelo com OpenRouter)
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { DomainError } from '../contracts';
import type { AppContext } from '../env';
import { newId, nowIso, parseJson } from '../lib/http';
import { OpenRouterClient } from '../ai/openrouter-client';
import { DEFAULT_TIER_MODELS, type ModelConfigRecord } from '../ai/models';

const adminAiRoutes = new Hono<AppContext>();

/**
 * Middleware de proteção administrativa:
 * Exige usuário com perfil 'admin' e sessão com MFA verificado.
 */
adminAiRoutes.use('*', async (c, next) => {
  const user = c.get('user');
  const session = c.get('session');

  // Permitir em ambiente de teste se explicitamente mockado ou verificar contexto
  if (!user || !user.roles?.includes('admin')) {
    throw new DomainError('FORBIDDEN', 'Acesso restrito a administradores do ALEGON AI Photo Studio.', 403);
  }

  if (!session || !session.mfaVerified) {
    throw new DomainError('MFA_REQUIRED', 'Sessão administrativa requer autenticação de dois fatores (MFA).', 403);
  }

  await next();
});

/**
 * GET /models
 * Lista todos os modelos cadastrados no D1.
 */
adminAiRoutes.get('/models', async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM model_configurations ORDER BY tier ASC, priority ASC',
  ).all<ModelConfigRecord>();

  return c.json({
    items: results || [],
  });
});

const updateModelSchema = z.object({
  display_name: z.string().min(1).max(100).optional(),
  credits_cost: z.number().int().positive().optional(),
  priority: z.number().int().min(1).max(1000).optional(),
  active: z.number().int().min(0).max(1).optional(),
  supports_mask: z.number().int().min(0).max(1).optional(),
  params_json: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

/**
 * PUT /models/:id
 * Atualiza campos operacionais de um modelo de IA.
 */
adminAiRoutes.put('/models/:id', async (c) => {
  const modelId = c.req.param('id');
  const body = await parseJson(c, updateModelSchema);
  const user = c.get('user');

  const existing = await c.env.DB.prepare(
    'SELECT * FROM model_configurations WHERE id = ?',
  )
    .bind(modelId)
    .first<ModelConfigRecord>();

  if (!existing) {
    throw new DomainError('NOT_FOUND', `Modelo de ID "${modelId}" não encontrado.`, 404);
  }

  const updatedDisplayName = body.display_name ?? existing.display_name;
  const updatedCredits = body.credits_cost ?? existing.credits_cost;
  const updatedPriority = body.priority ?? existing.priority;
  const updatedActive = body.active ?? existing.active;
  const updatedMask = body.supports_mask ?? existing.supports_mask;
  const updatedParams = body.params_json !== undefined ? body.params_json : existing.params_json;
  const updatedNotes = body.notes !== undefined ? body.notes : existing.notes;
  const now = nowIso();

  await c.env.DB.prepare(
    `UPDATE model_configurations
     SET display_name = ?, credits_cost = ?, priority = ?, active = ?, supports_mask = ?, params_json = ?, notes = ?, updated_at = ?, updated_by = ?
     WHERE id = ?`,
  )
    .bind(
      updatedDisplayName,
      updatedCredits,
      updatedPriority,
      updatedActive,
      updatedMask,
      updatedParams,
      updatedNotes,
      now,
      user?.id || 'admin',
      modelId,
    )
    .run();

  return c.json({
    ok: true,
    model: {
      ...existing,
      display_name: updatedDisplayName,
      credits_cost: updatedCredits,
      priority: updatedPriority,
      active: updatedActive,
      supports_mask: updatedMask,
      params_json: updatedParams,
      notes: updatedNotes,
      updated_at: now,
      updated_by: user?.id || 'admin',
    },
  });
});

/**
 * GET /ai/usage
 * Relatório de consumo da API OpenRouter com agrupamento.
 */
adminAiRoutes.get('/ai/usage', async (c) => {
  const url = new URL(c.req.url);
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');
  const groupBy = url.searchParams.get('groupBy') || 'model'; // 'model' | 'day'

  let dateFilter = '';
  const bindings: any[] = [];

  if (from) {
    dateFilter += ' AND created_at >= ?';
    bindings.push(from);
  }
  if (to) {
    dateFilter += ' AND created_at <= ?';
    bindings.push(to);
  }

  if (groupBy === 'day') {
    const query = `
      SELECT 
        substr(created_at, 1, 10) as day,
        COUNT(*) as total_requests,
        SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successful_requests,
        SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as failed_requests,
        SUM(cost_usd_micros) as total_cost_usd_micros,
        AVG(latency_ms) as avg_latency_ms,
        SUM(credits_consumed) as total_credits_consumed
      FROM openrouter_usage
      WHERE 1=1 ${dateFilter}
      GROUP BY substr(created_at, 1, 10)
      ORDER BY day DESC
    `;
    const { results } = await c.env.DB.prepare(query).bind(...bindings).all();
    return c.json({ groupBy: 'day', items: results || [] });
  }

  // Agrupamento padrão por modelo
  const query = `
    SELECT 
      model_id,
      COUNT(*) as total_requests,
      SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successful_requests,
      SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as failed_requests,
      SUM(cost_usd_micros) as total_cost_usd_micros,
      AVG(latency_ms) as avg_latency_ms,
      SUM(credits_consumed) as total_credits_consumed
    FROM openrouter_usage
    WHERE 1=1 ${dateFilter}
    GROUP BY model_id
    ORDER BY total_cost_usd_micros DESC
  `;
  const { results } = await c.env.DB.prepare(query).bind(...bindings).all();
  return c.json({ groupBy: 'model', items: results || [] });
});

const testModelSchema = z.object({
  confirm: z.literal(true, {
    errorMap: () => ({ message: 'Confirmação explícita obrigatória: { "confirm": true }' }),
  }),
});

/**
 * 1x1 PNG transparente em base64 para teste de validação sintética.
 */
const TEST_PIXEL_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

/**
 * POST /models/:id/test
 * Teste real de integração que executa uma chamada controlada ao OpenRouter.
 */
adminAiRoutes.post('/models/:id/test', async (c) => {
  const modelRowId = c.req.param('id');
  await parseJson(c, testModelSchema);
  const user = c.get('user');

  const model = await c.env.DB.prepare(
    'SELECT * FROM model_configurations WHERE id = ?',
  )
    .bind(modelRowId)
    .first<ModelConfigRecord>();

  if (!model) {
    throw new DomainError('NOT_FOUND', `Modelo "${modelRowId}" não encontrado.`, 404);
  }

  const client = new OpenRouterClient(c.env);
  const rawBytes = Uint8Array.from(atob(TEST_PIXEL_PNG_BASE64), (c) => c.charCodeAt(0)).buffer;

  const testStartTime = Date.now();
  let result: any;
  let testError: any = null;

  try {
    result = await client.executeImageEdit({
      modelId: model.model_id,
      prompt: 'TEST: Validation probe. Please confirm model is responsive.',
      sourceImage: {
        bytes: rawBytes,
        mime: 'image/png',
      },
      timeoutMs: 30_000,
    });
  } catch (err: any) {
    testError = err;
  }

  const latencyMs = Date.now() - testStartTime;
  const now = nowIso();
  const usageRowId = newId();

  if (testError) {
    // Registra falha do teste
    await c.env.DB.prepare(
      `INSERT INTO openrouter_usage (
        id, user_id, edit_job_id, model_id, provider, generation_id,
        prompt_tokens, completion_tokens, image_tokens, cost_usd_micros,
        latency_ms, status, error_code, credits_consumed, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'error', ?, 0, ?)`,
    )
      .bind(
        usageRowId,
        user?.id || 'admin',
        'admin_probe',
        model.model_id,
        null,
        null,
        0,
        0,
        0,
        0,
        latencyMs,
        testError.code || 'AI_ERROR',
        now,
      )
      .run();

    return c.json(
      {
        success: false,
        latencyMs,
        error: {
          code: testError.code || 'AI_ERROR',
          message: testError.message,
          details: testError.details,
        },
      },
      502,
    );
  }

  // Registra sucesso do teste e atualiza validated_at
  await c.env.DB.prepare(
    `INSERT INTO openrouter_usage (
      id, user_id, edit_job_id, model_id, provider, generation_id,
      prompt_tokens, completion_tokens, image_tokens, cost_usd_micros,
      latency_ms, status, error_code, credits_consumed, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'success', null, 0, ?)`,
  )
    .bind(
      usageRowId,
      user?.id || 'admin',
      'admin_probe',
      model.model_id,
      result.provider || null,
      result.generationId || null,
      result.promptTokens,
      result.completionTokens,
      result.imageTokens,
      result.costUsdMicros,
      latencyMs,
      now,
    )
    .run();

  await c.env.DB.prepare(
    'UPDATE model_configurations SET validated_at = ?, updated_at = ? WHERE id = ?',
  )
    .bind(now, now, model.id)
    .run();

  return c.json({
    success: true,
    modelId: model.model_id,
    validatedAt: now,
    latencyMs,
    costUsdMicros: result.costUsdMicros,
    bytesLength: result.bytes.byteLength,
    mime: result.mime,
  });
});

export default adminAiRoutes;
