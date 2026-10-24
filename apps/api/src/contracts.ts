/**
 * CONTRATOS ENTRE MÓDULOS — CANÔNICO (dono: Tech Lead).
 * Cada módulo implementa sua interface em seu diretório e exporta a factory indicada.
 * Alterações neste arquivo exigem aprovação do Tech Lead (abrir nota em docs/CHANGE_REQUESTS.md).
 *
 *  Módulo          Diretório               Factory / export                      Dono
 *  ─────────────── ─────────────────────── ───────────────────────────────────── ─────────────────
 *  Wallet          src/wallet/             createWalletService(env)              Asaas/Billing
 *  Billing         src/billing/            handleWebhookQueue(batch, env)        Asaas/Billing
 *                                          runBillingMaintenance(env)
 *  AI              src/ai/                 createAiEditService(env)              OpenRouter
 *  Storage         src/storage/            createStorageService(env)             Backend
 *  Edit jobs       src/jobs/               handleEditQueue(batch, env)           Backend
 *  Retention       src/jobs/retention.ts   runRetention(env)                     Backend
 *  Security        src/security/           (ver assinaturas abaixo)              Segurança/LGPD
 *  Auth            src/auth/ + middleware  requireAuth / requireAdmin            Backend
 */

// ───────────────────────────── Tipos comuns ─────────────────────────────
export type Tier = 'economico' | 'padrao' | 'premium';
export type CreditBucket = 'purchased' | 'subscription';
export type ImageMime = 'image/jpeg' | 'image/png' | 'image/webp';

export type EditTool =
  | 'free_prompt'
  | 'remove_people'
  | 'remove_objects'
  | 'replace_background'
  | 'remove_background'
  | 'transparent_background'
  | 'improve_lighting'
  | 'improve_colors'
  | 'sharpen'
  | 'restore_photo'
  | 'product_photo'
  | 'add_elements'
  | 'replace_elements'
  | 'variations';

// ───────────────────────────── Mensagens de fila ─────────────────────────────
export interface EditJobMessage {
  type: 'edit_job';
  jobId: string;
  userId: string;
  enqueuedAt: string;
}

export interface WebhookMessage {
  type: 'asaas_webhook';
  eventRowId: string; // id em asaas_webhook_events
}

// ───────────────────────────── Erros de domínio ─────────────────────────────
export class DomainError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number = 400,
    public details?: unknown,
  ) {
    super(message);
  }
}
export class InsufficientCreditsError extends DomainError {
  constructor(needed: number, available: number) {
    super('INSUFFICIENT_CREDITS', 'Saldo de créditos insuficiente.', 402, { needed, available });
  }
}

// ───────────────────────────── Wallet ─────────────────────────────
export interface WalletBalance {
  purchased: number;
  subscription: number;
  reserved: number;
  available: number; // purchased + subscription - reserved (nunca negativo)
  expiringSoon: Array<{ bucket: CreditBucket; amount: number; expiresAt: string }>;
}

export interface WalletService {
  getBalance(userId: string): Promise<WalletBalance>;
  /** Reserva atômica. Consome primeiro créditos de assinatura (vencem antes), depois comprados (FIFO por expires_at).
   *  Idempotente por editRequestId. Lança InsufficientCreditsError. */
  reserve(input: { userId: string; editRequestId: string; amount: number; ttlMinutes?: number }): Promise<{ reservationId: string }>;
  /** Converte reserva em consumo definitivo. Idempotente. */
  consume(reservationId: string): Promise<void>;
  /** Devolve créditos da reserva aos lotes de origem. Idempotente. */
  release(reservationId: string, reason: string): Promise<void>;
  /** Concede créditos (pagamento confirmado, ciclo de assinatura, ajuste admin). Idempotente por idempotencyKey. */
  grant(input: {
    userId: string;
    bucket: CreditBucket;
    amount: number;
    type: 'grant_purchase' | 'grant_subscription' | 'grant_single_edit' | 'grant_admin';
    sourceType: string;
    sourceId: string;
    expiresAt: string | null;
    idempotencyKey: string;
    createdBy?: string;
    note?: string;
  }): Promise<{ lotId: string; alreadyApplied: boolean }>;
  /** Débito administrativo / estorno de reembolso (não deixa saldo negativo; retorna quanto foi efetivamente debitado). */
  debit(input: { userId: string; amount: number; type: 'refund_reversal' | 'admin_debit'; referenceId: string; idempotencyKey: string; createdBy?: string; note?: string }): Promise<{ debited: number }>;
}

// ───────────────────────────── AI (OpenRouter) ─────────────────────────────
export interface AiQuote {
  tier: Tier;
  credits: number;
  modelLabel: string; // nome amigável (não expor slug interno ao usuário comum se não desejado)
}

export interface AiEditInput {
  jobId: string;
  userId: string;
  prompt: string;           // texto livre do usuário (já validado: 3..2000 chars)
  tool: EditTool;
  tier: Tier;
  source: { bytes: ArrayBuffer; mime: ImageMime; width?: number; height?: number };
  mask?: { bytes: ArrayBuffer; mime: 'image/png' }; // somente se o modelo suportar
  signal?: AbortSignal;
}

export interface AiEditResult {
  bytes: ArrayBuffer;
  mime: ImageMime;
  modelId: string;
  provider?: string;
  generationId?: string;
  costUsdMicros?: number;
  latencyMs: number;
  usageRowId: string; // linha criada em openrouter_usage
}

export interface AiToolDescriptor {
  id: EditTool;
  label: string;        // pt-BR
  description: string;  // pt-BR
  promptTemplate: string;
  requiresUserText: boolean;
  supportsMask: boolean; // true somente se algum modelo ativo suportar de fato
}

export interface AiEditService {
  quote(input: { tier: Tier; tool: EditTool }): Promise<AiQuote>;
  listTools(): AiToolDescriptor[];
  /** Executa a edição com fallback entre modelos do mesmo tier. Registra openrouter_usage em TODAS as tentativas.
   *  Lança DomainError com code: 'AI_TIMEOUT' | 'AI_UNAVAILABLE' | 'AI_INVALID_OUTPUT' | 'AI_CONTENT_REFUSED' | 'AI_ERROR'.
   *  `retryable` em details indica falha técnica elegível para liberar créditos. */
  runEdit(input: AiEditInput): Promise<AiEditResult>;
}

// ───────────────────────────── Storage (R2) ─────────────────────────────
export interface StorageService {
  putObject(key: string, bytes: ArrayBuffer, mime: string): Promise<void>;
  getObject(key: string): Promise<{ bytes: ArrayBuffer; mime: string } | null>;
  deletePrefix(prefix: string): Promise<number>;
  deleteKeys(keys: string[]): Promise<void>;
  /** URL assinada (HMAC, TTL curto, vinculada ao userId) servida por GET /api/files/:token */
  signedUrl(input: { key: string; userId: string; ttlSeconds?: number; download?: boolean; filename?: string }): Promise<{ url: string; expiresAt: string }>;
}

// ───────────────────────────── Security (assinaturas) ─────────────────────────────
// src/security/upload.ts      → validateImageUpload(bytes: ArrayBuffer, declaredMime?: string): { mime: ImageMime; width: number; height: number } (lança DomainError)
// src/security/rate-limit.ts  → rateLimit(env, key: string, limit: number, windowSeconds: number): Promise<{ allowed: boolean; retryAfter: number }>
//                                rateLimitMiddleware(opts) (Hono middleware)
// src/security/headers.ts     → securityHeaders() (Hono middleware: CSP, HSTS, XFO, etc.)
// src/security/csrf.ts        → csrfProtection() (Hono middleware: Origin + header X-Requested-With)
// src/security/totp.ts        → generateTotpSecret(), verifyTotp(secretBase32, code, window?), buildOtpauthUrl(...)
// src/security/crypto.ts      → encrypt(env, plaintext), decrypt(env, ciphertext), sha256Hex(data), hmacSha256(secret, data), randomToken(bytes)
// src/security/audit.ts       → audit(env, entry: { actorUserId?, actorType, action, targetType?, targetId?, ip?, metadata? })
