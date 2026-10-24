/**
 * Bindings e segredos do Worker. CANÔNICO — dono: Tech Lead.
 * Segredos (OPENROUTER_API_KEY, ASAAS_API_KEY, ...) ficam em `.dev.vars` (local) ou
 * `wrangler secret put` (remoto). NUNCA devem ser enviados ao frontend.
 */
import type { EditJobMessage, WebhookMessage } from './contracts';

export interface Env {
  // Bindings (D1 e ASSETS obrigatórios; MEDIA e QUEUES opcionais para suporte a Cloudflare Free sem cartão)
  DB: D1Database;
  MEDIA?: R2Bucket;
  EDIT_QUEUE?: Queue<EditJobMessage>;
  WEBHOOK_QUEUE?: Queue<WebhookMessage>;
  ASSETS: Fetcher;

  // Vars
  ENVIRONMENT: 'development' | 'staging' | 'production';
  APP_URL: string;
  ASAAS_BASE_URL: string;
  OPENROUTER_BASE_URL: string;
  EMAIL_FROM: string;
  ADMIN_EMAILS?: string;             // e-mails separados por vírgula com permissão de super-admin auto-atribuída
  ADMIN_PASSWORD?: string;           // senha inicial opcional configurada pelo administrador no painel
  ADMIN_INITIAL_PASSWORD?: string;
  PASSWORD?: string;

  // Secrets
  OPENROUTER_API_KEY?: string;
  ASAAS_API_KEY?: string;
  ASAAS_WEBHOOK_TOKEN?: string;      // token configurado no painel Asaas (header asaas-access-token)
  SESSION_SECRET?: string;           // HMAC de URLs assinadas e hashes (possui fallback seguro interno)
  DATA_ENCRYPTION_KEY?: string;      // base64 32 bytes (AES-GCM) — segredos MFA
  RESEND_API_KEY?: string;           // opcional: sem ele, e-mails vão para email_outbox com status dev_logged
}

export type AppVariables = {
  user: AuthUser;
  session: AuthSession;
  requestId: string;
};

export interface AuthUser {
  id: string;
  email: string;
  emailVerified: boolean;
  status: 'active' | 'blocked' | 'pending_deletion' | 'deleted';
  roles: Array<'user' | 'support' | 'admin'>;
  mfaEnabled: boolean;
}

export interface AuthSession {
  id: string;
  mfaVerified: boolean;
  expiresAt: string;
}

export type AppContext = { Bindings: Env; Variables: AppVariables };
