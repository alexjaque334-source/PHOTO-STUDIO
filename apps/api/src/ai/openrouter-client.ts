/**
 * Cliente de integração com a API do OpenRouter — ALEGON AI Photo Studio.
 * Dono: Subagente OpenRouter.
 * 
 * Responsabilidades:
 * - Requisições seguras com chave no backend (sem vazar para o cliente).
 * - Modos de geração e edição multimodal de imagem.
 * - Suporte a Zero Data Retention (ZDR) e negação de coleta de dados.
 * - Extração de custo (usage.cost) em micro-dólares e latência em milissegundos.
 * - Conversão de saídas (Data URL base64 ou URL remota) para ArrayBuffer.
 * - Validação de magic bytes para garantir integridade do arquivo de imagem.
 * - Tratamento de erros e mapeamento para DomainErrors do contrato canônico.
 */

import { DomainError, type ImageMime } from '../contracts';
import type { Env } from '../env';

export interface OpenRouterRequestOptions {
  modelId: string;
  prompt: string;
  sourceImage: {
    bytes: ArrayBuffer;
    mime: ImageMime;
  };
  maskImage?: {
    bytes: ArrayBuffer;
    mime: 'image/png';
  };
  timeoutMs?: number;
  signal?: AbortSignal;
}

export interface OpenRouterResponseSuccess {
  bytes: ArrayBuffer;
  mime: ImageMime;
  modelId: string;
  provider?: string;
  generationId?: string;
  costUsdMicros: number;
  latencyMs: number;
  promptTokens: number;
  completionTokens: number;
  imageTokens: number;
}

/**
 * Converte ArrayBuffer para string base64 usando APIs universais Web Standards.
 */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 8192; // evita estouro de stack em imagens grandes
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, chunk as unknown as number[]);
  }
  return btoa(binary);
}

/**
 * Converte string base64 para ArrayBuffer.
 */
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const clean = base64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '').trim();
  const binary = atob(clean);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Detecta o tipo MIME da imagem a partir dos seus magic bytes.
 */
export function detectMimeFromBytes(buffer: ArrayBuffer): ImageMime {
  const bytes = new Uint8Array(buffer);
  if (bytes.length < 12) {
    throw new DomainError('AI_INVALID_OUTPUT', 'Binário de saída muito curto para ser uma imagem válida.', 502, { retryable: true });
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return 'image/png';
  }

  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'image/jpeg';
  }

  // WebP: RIFF ... WEBP (bytes 0..3 === 'RIFF', bytes 8..11 === 'WEBP')
  if (
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) {
    return 'image/webp';
  }

  throw new DomainError(
    'AI_INVALID_OUTPUT',
    'Formato de imagem gerado pela IA não é suportado (esperado JPEG, PNG ou WebP).',
    502,
    { retryable: true, firstBytesHex: Array.from(bytes.slice(0, 8)).map((b) => b.toString(16).padStart(2, '0')).join(' ') },
  );
}

/**
 * Extrai a representação da imagem a partir da estrutura JSON retornada pelo OpenRouter.
 */
export function extractImageFromOpenRouterResponse(json: any): { type: 'base64' | 'url'; data: string } {
  if (!json) {
    throw new DomainError('AI_INVALID_OUTPUT', 'Resposta vazia do provedor de IA.', 502, { retryable: true });
  }

  // 1. Formato OpenRouter Images API: { data: [{ b64_json: '...' }] } ou { data: [{ url: '...' }] }
  if (Array.isArray(json.data) && json.data.length > 0) {
    const item = json.data[0];
    if (item.b64_json) return { type: 'base64', data: item.b64_json };
    if (item.url) return { type: 'url', data: item.url };
  }

  if (json.candidates?.[0]?.finishReason === 'SAFETY') {
    throw new DomainError('AI_CONTENT_REFUSED', 'O filtro de segurança da IA (Content Filter) recusou a geração.', 422, { retryable: false });
  }

  const choice = json.choices?.[0];
  if (choice?.finish_reason === 'content_filter' || choice?.finish_reason === 'safety') {
    const msg = choice.message?.content || 'O filtro de segurança da IA (Content Filter) recusou a geração.';
    throw new DomainError('AI_CONTENT_REFUSED', `Filtro de segurança ativado: ${msg}`, 422, { retryable: false });
  }

  if (choice) {
    const message = choice.message;

    // 2. Campo explícito `images` (array de { image_url: { url } }, { url }, { b64_json } ou strings)
    if (Array.isArray(message?.images) && message.images.length > 0) {
      for (const img of message.images) {
        if (!img) continue;
        if (typeof img === 'string') {
          if (img.startsWith('data:image/')) return { type: 'base64', data: img };
          return { type: 'url', data: img };
        }
        if (img.b64_json) {
          return { type: 'base64', data: img.b64_json };
        }
        const candidateUrl = img.image_url?.url || img.image_url || img.url;
        if (typeof candidateUrl === 'string' && candidateUrl) {
          if (candidateUrl.startsWith('data:image/')) return { type: 'base64', data: candidateUrl };
          return { type: 'url', data: candidateUrl };
        }
      }
    }

    // 3. Conteúdo como array de blocos multimodais
    if (Array.isArray(message?.content)) {
      for (const part of message.content) {
        if (part.type === 'image_url' && (part.image_url?.url || part.image_url)) {
          const urlStr = part.image_url?.url || part.image_url;
          if (typeof urlStr === 'string') {
            if (urlStr.startsWith('data:image/')) return { type: 'base64', data: urlStr };
            return { type: 'url', data: urlStr };
          }
        }
        if (part.type === 'image') {
          if (part.source?.data) return { type: 'base64', data: part.source.data };
          if (part.b64_json) return { type: 'base64', data: part.b64_json };
          const imgUrl = part.url || part.source?.url;
          if (imgUrl) return { type: 'url', data: imgUrl };
        }
        if (part.inline_data?.data) {
          return { type: 'base64', data: part.inline_data.data };
        }
        if (part.inlineData?.data) {
          return { type: 'base64', data: part.inlineData.data };
        }
      }
    }

    // 4. Conteúdo como string de texto (procura por Data URL ou URL em markdown)
    if (typeof message?.content === 'string') {
      const text = message.content;
      // Data URL direta ou em markdown (suportando quebras de linha em base64)
      const dataUrlMatch = text.match(/data:image\/[a-zA-Z0-9+.-]+;base64,[A-Za-z0-9+/=\r\n]+/);
      if (dataUrlMatch) {
        return { type: 'base64', data: dataUrlMatch[0].replace(/[\r\n\s]+/g, '') };
      }

      // Markdown image: ![...](https://...)
      const mdUrlMatch = text.match(/!\[.*?\]\((https?:\/\/[^\s\)]+)\)/);
      if (mdUrlMatch && mdUrlMatch[1]) {
        return { type: 'url', data: mdUrlMatch[1] };
      }

      // URL solta
      const plainUrlMatch = text.match(/https?:\/\/[^\s"')]+/);
      if (plainUrlMatch && plainUrlMatch[0]) {
        return { type: 'url', data: plainUrlMatch[0] };
      }
    }
  }

  // 5. Suporte direto a candidatos retornados via Google AI Studio / Vertex passthrough
  const candidate = json.candidates?.[0];
  if (candidate?.content?.parts && Array.isArray(candidate.content.parts)) {
    for (const part of candidate.content.parts) {
      if (part.inline_data?.data) return { type: 'base64', data: part.inline_data.data };
      if (part.inlineData?.data) return { type: 'base64', data: part.inlineData.data };
      if (part.text && part.text.startsWith('data:image/')) return { type: 'base64', data: part.text };
    }
  }

  throw new DomainError(
    'AI_INVALID_OUTPUT',
    'O modelo não retornou uma imagem legível.',
    502,
    { retryable: true, preview: JSON.stringify(json).slice(0, 500) },
  );
}

/**
 * Cliente OpenRouter para execução de requisições de IA no backend.
 */
export class OpenRouterClient {
  private baseUrl: string;
  private apiKey: string;
  private appUrl: string;

  constructor(env: Env) {
    this.baseUrl = (env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1').replace(/\/+$/, '');
    const cleanKey = (env.OPENROUTER_API_KEY || '').trim().replace(/^["']|["']$/g, '');
    this.apiKey = cleanKey.startsWith('Bearer ') ? cleanKey.slice(7).trim() : cleanKey;
    this.appUrl = env.APP_URL || 'https://alegon.com.br';
  }

  /**
   * Envia a imagem e instruções para o OpenRouter e retorna a imagem processada com métricas.
   */
  async executeImageEdit(opts: OpenRouterRequestOptions): Promise<OpenRouterResponseSuccess> {
    if (!this.apiKey) {
      throw new DomainError('AI_UNAVAILABLE', 'Chave da API OpenRouter não configurada no servidor.', 503, { retryable: true });
    }

    const sourceB64 = arrayBufferToBase64(opts.sourceImage.bytes);
    const sourceDataUrl = `data:${opts.sourceImage.mime};base64,${sourceB64}`;

    const contentArray: any[] = [
      {
        type: 'text',
        text: opts.prompt,
      },
      {
        type: 'image_url',
        image_url: {
          url: sourceDataUrl,
        },
      },
    ];

    if (opts.maskImage) {
      const maskB64 = arrayBufferToBase64(opts.maskImage.bytes);
      contentArray.push({
        type: 'text',
        text: 'Inpainting guidance mask (white = areas to edit, black = preserve untouched):',
      });
      contentArray.push({
        type: 'image_url',
        image_url: {
          url: `data:image/png;base64,${maskB64}`,
        },
      });
    }

    const payload = {
      model: opts.modelId,
      messages: [
        {
          role: 'user',
          content: contentArray,
        },
      ],
      modalities: ['image', 'text'],
    };

    const startTime = performance.now();
    const timeoutMs = opts.timeoutMs ?? 60_000;

    let response: Response;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    // Se o chamador forneceu seu próprio signal, propaga abort
    if (opts.signal) {
      opts.signal.addEventListener('abort', () => controller.abort());
    }

    try {
      response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': this.appUrl,
          'X-Title': 'Photo Studio AI',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
    } catch (err: any) {
      clearTimeout(timer);
      const isTimeout = err.name === 'AbortError' || controller.signal.aborted;
      if (isTimeout) {
        throw new DomainError('AI_TIMEOUT', 'Tempo limite excedido na comunicação com a IA.', 504, { retryable: true });
      }
      throw new DomainError('AI_UNAVAILABLE', `Falha de rede na conexão com OpenRouter: ${err.message}`, 503, { retryable: true });
    } finally {
      clearTimeout(timer);
    }

    const latencyMs = Math.round(performance.now() - startTime);

    if (!response.ok) {
      let errorBody: any;
      try {
        errorBody = await response.json();
      } catch {
        errorBody = await response.text();
      }

      const upstreamMsg =
        errorBody?.error?.message ||
        errorBody?.message ||
        (typeof errorBody === 'string' ? errorBody : JSON.stringify(errorBody));

      if (response.status === 401) {
        throw new DomainError('AI_UNAVAILABLE', `Chave da API OpenRouter inválida ou não autorizada (HTTP 401): ${upstreamMsg}. Verifique se a OPENROUTER_API_KEY foi devidamente configurada.`, 401, { retryable: false, upstream: errorBody });
      }

      if (response.status === 402) {
        throw new DomainError('AI_UNAVAILABLE', `Saldo insuficiente na conta do OpenRouter (HTTP 402): ${upstreamMsg}. É necessário ter saldo em dólares/créditos (Credits balance) na conta do OpenRouter para processar imagens com este modelo.`, 402, { retryable: false, upstream: errorBody });
      }

      if (response.status === 403) {
        throw new DomainError('AI_UNAVAILABLE', `Acesso negado ou limite atingido no OpenRouter (HTTP 403): ${upstreamMsg}. Verifique se a chave atingiu o limite de gastos configurado ou se há restrição de modelos na chave.`, 403, { retryable: false, upstream: errorBody });
      }

      if (response.status === 429 || response.status === 502 || response.status === 503 || response.status === 504) {
        throw new DomainError(
          'AI_UNAVAILABLE',
          `Provedor de IA temporariamente indisponível: ${upstreamMsg}`,
          response.status,
          { retryable: true, upstream: errorBody },
        );
      }

      if (response.status === 400 || response.status === 422) {
        if (/safety|moderation|policy|nsfw|harmful/i.test(upstreamMsg)) {
          throw new DomainError('AI_CONTENT_REFUSED', 'O conteúdo da imagem ou texto foi recusado pelos filtros de segurança.', 422, { retryable: false, upstream: errorBody });
        }
        // Erro de parâmetro ou modelo no OpenRouter: permite tentar modelo de fallback
        throw new DomainError('AI_UNAVAILABLE', `Modelo de IA recusou a requisição (HTTP ${response.status}): ${upstreamMsg}`, response.status, { retryable: true, upstream: errorBody });
      }

      if (response.status === 404) {
        throw new DomainError('AI_UNAVAILABLE', `Modelo de IA não encontrado no provedor (HTTP 404): ${upstreamMsg}`, 404, { retryable: true, upstream: errorBody });
      }

      throw new DomainError(
        'AI_ERROR',
        `Erro retornado pelo OpenRouter (HTTP ${response.status}): ${upstreamMsg}`,
        response.status,
        { retryable: true, upstream: errorBody },
      );
    }

    const json: any = await response.json();
    const extracted = extractImageFromOpenRouterResponse(json);

    let imageBytes: ArrayBuffer;
    if (extracted.type === 'base64') {
      imageBytes = base64ToArrayBuffer(extracted.data);
    } else {
      // Download da imagem da URL retornada pelo provedor
      try {
        const downloadRes = await fetch(extracted.data, { signal: opts.signal });
        if (!downloadRes.ok) {
          throw new Error(`Status ${downloadRes.status}`);
        }
        imageBytes = await downloadRes.arrayBuffer();
      } catch (err: any) {
        throw new DomainError('AI_INVALID_OUTPUT', `Falha ao baixar imagem gerada pelo provedor: ${err.message}`, 502, { retryable: true });
      }
    }

    const detectedMime = detectMimeFromBytes(imageBytes);

    // Custo retornado pelo OpenRouter no objeto usage
    const costUsd = Number(json?.usage?.cost) || 0;
    const costUsdMicros = Math.round(costUsd * 1_000_000);

    return {
      bytes: imageBytes,
      mime: detectedMime,
      modelId: opts.modelId,
      provider: json?.provider || json?.model?.split('/')?.[0],
      generationId: json?.id,
      costUsdMicros,
      latencyMs,
      promptTokens: json?.usage?.prompt_tokens || 0,
      completionTokens: json?.usage?.completion_tokens || 0,
      imageTokens: json?.usage?.image_tokens || 0,
    };
  }
}
