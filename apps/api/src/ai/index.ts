/**
 * Módulo de IA (OpenRouter) — ALEGON AI Photo Studio.
 * Dono: Subagente OpenRouter.
 * 
 * Implementa a interface AiEditService e exporta a factory createAiEditService(env).
 */

import {
  DomainError,
  type AiEditInput,
  type AiEditResult,
  type AiEditService,
  type AiQuote,
  type AiToolDescriptor,
  type EditTool,
  type Tier,
} from '../contracts';
import type { Env } from '../env';
import { newId, nowIso } from '../lib/http';
import { OpenRouterClient } from './openrouter-client';
import { buildFinalPrompt } from './prompts';
import { AI_TOOLS_CATALOG, getToolDescriptor } from './tools';
import { getActiveModelsForTier, getQuoteForTier } from './models';

export * from './prompts';
export * from './tools';
export * from './models';
export * from './openrouter-client';
export * from './catalog';
export * from './nlu';

export class AiEditServiceImpl implements AiEditService {
  private client: OpenRouterClient;

  constructor(private env: Env) {
    this.client = new OpenRouterClient(env);
  }

  /**
   * Cotação de créditos e modelo para uma ferramenta, tier ou prompt em linguagem natural.
   */
  async quote(input: { tier: Tier; tool?: EditTool; prompt?: string }): Promise<AiQuote> {
    if (input.prompt && input.prompt.trim().length >= 3) {
      const { interpretNaturalLanguage } = await import('./nlu');
      const interpretation = interpretNaturalLanguage(input.prompt);
      return {
        tier: input.tier,
        credits: interpretation.suggestedCredits,
        modelLabel: 'Motor Inteligente Photo Studio AI (70 Comandos)',
      };
    }

    const tool = input.tool || 'free_prompt';
    const descriptor = getToolDescriptor(tool);
    if (!descriptor) {
      throw new DomainError('VALIDATION_ERROR', `Ferramenta de edição inválida: ${tool}`, 422);
    }

    const { credits, modelLabel } = await getQuoteForTier(this.env, input.tier);
    return {
      tier: input.tier,
      credits,
      modelLabel,
    };
  }

  /**
   * Lista o catálogo de ferramentas disponíveis na plataforma.
   */
  listTools(): AiToolDescriptor[] {
    return AI_TOOLS_CATALOG;
  }

  /**
   * Executa a edição fotográfica com fallback automático entre modelos do mesmo tier.
   * Registra cada tentativa em openrouter_usage (auditoria e observabilidade de custos).
   */
  async runEdit(input: AiEditInput): Promise<AiEditResult> {
    const toolDescriptor = getToolDescriptor(input.tool);
    if (!toolDescriptor) {
      throw new DomainError('VALIDATION_ERROR', `Ferramenta desconhecida: ${input.tool}`, 422);
    }

    // Se a ferramenta exige texto do usuário e não foi enviado texto suficiente
    if (toolDescriptor.requiresUserText && (!input.prompt || input.prompt.trim().length < 3)) {
      throw new DomainError(
        'VALIDATION_ERROR',
        `A ferramenta "${toolDescriptor.label}" exige uma descrição textual de no mínimo 3 caracteres.`,
        422,
      );
    }

    // Constrói o prompt técnico final sanitizado e consolidado via NLU de 70 comandos
    let technicalPrompt: string;
    if (input.prompt && input.prompt.trim().length >= 3) {
      const { interpretNaturalLanguage } = await import('./nlu');
      const interpretation = interpretNaturalLanguage(input.prompt);
      technicalPrompt = interpretation.consolidatedTechnicalPrompt;
    } else {
      technicalPrompt = buildFinalPrompt(input.tool, input.prompt);
    }

    // Obtém a cadeia de modelos ativos para este tier ordenados por prioridade
    const models = await getActiveModelsForTier(this.env, input.tier);
    if (models.length === 0) {
      throw new DomainError(
        'AI_UNAVAILABLE',
        `Nenhum modelo ativo encontrado para o tier "${input.tier}".`,
        503,
        { retryable: true },
      );
    }

    let lastError: any = null;

    // Itera pela cadeia de modelos para execução e fallback
    for (let i = 0; i < models.length; i++) {
      const model = models[i];
      if (!model) continue;
      const isLastAttempt = i === models.length - 1;
      const usageRowId = newId();
      const attemptStartTime = Date.now();

      // Verifica se há máscara e se o modelo atual a suporta
      const maskToSend = model.supports_mask && input.mask ? input.mask : undefined;

      try {
        const result = await this.client.executeImageEdit({
          modelId: model.model_id,
          prompt: technicalPrompt,
          sourceImage: {
            bytes: input.source.bytes,
            mime: input.source.mime,
          },
          maskImage: maskToSend,
          signal: input.signal,
        });

        // Grava registro de sucesso em openrouter_usage
        await this.recordUsage({
          id: usageRowId,
          userId: input.userId,
          editJobId: input.jobId,
          modelId: model.model_id,
          provider: result.provider || null,
          generationId: result.generationId || null,
          promptTokens: result.promptTokens,
          completionTokens: result.completionTokens,
          imageTokens: result.imageTokens,
          costUsdMicros: result.costUsdMicros,
          latencyMs: result.latencyMs,
          status: 'success',
          errorCode: null,
          creditsConsumed: model.credits_cost,
        });

        return {
          bytes: result.bytes,
          mime: result.mime,
          modelId: model.model_id,
          provider: result.provider,
          generationId: result.generationId,
          costUsdMicros: result.costUsdMicros,
          latencyMs: result.latencyMs,
          usageRowId,
        };
      } catch (err: any) {
        lastError = err;
        const latencyMs = Date.now() - attemptStartTime;

        let status: 'error' | 'timeout' | 'invalid_output' = 'error';
        let errorCode = 'AI_ERROR';

        if (err instanceof DomainError) {
          errorCode = err.code;
          if (err.code === 'AI_TIMEOUT') status = 'timeout';
          else if (err.code === 'AI_INVALID_OUTPUT') status = 'invalid_output';
        }

        // Grava tentativa falha em openrouter_usage
        await this.recordUsage({
          id: usageRowId,
          userId: input.userId,
          editJobId: input.jobId,
          modelId: model.model_id,
          provider: null,
          generationId: null,
          promptTokens: 0,
          completionTokens: 0,
          imageTokens: 0,
          costUsdMicros: 0,
          latencyMs,
          status,
          errorCode,
          creditsConsumed: 0,
        });

        const isRetryable = err instanceof DomainError ? (err.details as any)?.retryable === true : false;

        // Se o erro for de recusa de conteúdo (moderação), não tenta fallback
        if (err instanceof DomainError && err.code === 'AI_CONTENT_REFUSED') {
          throw err;
        }

        // Se for erro recuperável e ainda tiver modelo de fallback no mesmo tier, continua
        if (isRetryable && !isLastAttempt) {
          const nextModelId = models[i + 1]?.model_id ?? 'próximo';
          console.warn(`[AI Service] Falha no modelo ${model.model_id} (${errorCode}). Acionando fallback para ${nextModelId}...`);
          continue;
        }

        // Caso contrário, lança o erro
        if (err instanceof DomainError) {
          throw err;
        }

        throw new DomainError(
          'AI_ERROR',
          `Falha ao processar edição de IA: ${err.message || 'Erro inesperado'}`,
          500,
          { retryable: isRetryable },
        );
      }
    }

    throw lastError || new DomainError('AI_UNAVAILABLE', 'Todos os modelos de IA falharam.', 503, { retryable: true });
  }

  /**
   * Grava linha de uso no banco D1 em openrouter_usage.
   */
  private async recordUsage(entry: {
    id: string;
    userId: string;
    editJobId: string;
    modelId: string;
    provider: string | null;
    generationId: string | null;
    promptTokens: number;
    completionTokens: number;
    imageTokens: number;
    costUsdMicros: number;
    latencyMs: number;
    status: 'success' | 'error' | 'timeout' | 'invalid_output';
    errorCode: string | null;
    creditsConsumed: number;
  }): Promise<void> {
    try {
      if (!this.env.DB) return;

      await this.env.DB.prepare(
        `INSERT INTO openrouter_usage (
          id, user_id, edit_job_id, model_id, provider, generation_id,
          prompt_tokens, completion_tokens, image_tokens, cost_usd_micros,
          latency_ms, status, error_code, credits_consumed, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
        .bind(
          entry.id,
          entry.userId,
          entry.editJobId,
          entry.modelId,
          entry.provider,
          entry.generationId,
          entry.promptTokens,
          entry.completionTokens,
          entry.imageTokens,
          entry.costUsdMicros,
          entry.latencyMs,
          entry.status,
          entry.errorCode,
          entry.creditsConsumed,
          nowIso(),
        )
        .run();
    } catch (dbErr) {
      console.error(`[AI Service] Erro ao gravar openrouter_usage: ${dbErr}`);
    }
  }
}

/**
 * Factory do serviço de edição de IA (contrato canônico).
 */
export function createAiEditService(env: Env): AiEditService {
  return new AiEditServiceImpl(env);
}
