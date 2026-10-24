/**
 * ALEGON AI Photo Studio — Cliente HTTP e Métodos da API
 * Cliente seguro com credentials: 'include', CSRF X-Requested-With,
 * Idempotency-Key para ações financeiras/edições e polling com backoff.
 */

export interface ApiErrorPayload {
  code: string;
  message: string;
  details?: unknown;
}

export class ApiError extends Error {
  code: string;
  status: number;
  details?: unknown;

  constructor(status: number, payload: ApiErrorPayload) {
    super(payload.message || 'Erro na comunicação com o servidor.');
    this.name = 'ApiError';
    this.status = status;
    this.code = payload.code || 'UNKNOWN_ERROR';
    this.details = payload.details;
  }
}

// ─────────────────────────────────────────────
// Tipos de Domínio
// ─────────────────────────────────────────────

export type Tier = 'economico' | 'padrao' | 'premium';
export type CreditBucket = 'purchased' | 'subscription';

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

export interface User {
  id: string;
  email: string;
  fullName: string;
  emailVerified: boolean;
  roles: string[];
  mfaEnabled: boolean;
}

export interface SessionInfo {
  mfaVerified?: boolean;
}

export interface AuthMeResponse {
  user: User;
  session?: SessionInfo;
}

export interface UserSession {
  id: string;
  current: boolean;
  userAgent: string;
  createdAt: string;
  lastSeenAt: string;
}

export interface WalletBalance {
  purchased: number;
  subscription: number;
  reserved: number;
  available: number;
  expiringSoon?: Array<{ bucket: CreditBucket; amount: number; expiresAt: string }>;
}

export interface WalletTransaction {
  id: string;
  type: string;
  bucket: CreditBucket;
  amount: number;
  note?: string;
  createdAt: string;
}

export interface ImageSummary {
  id: string;
  title: string;
  projectId?: string;
  createdAt: string;
  expiresAt: string;
  daysLeft: number;
  versionCount: number;
  currentVersionId: string;
  thumbUrl?: string;
}

export interface ImageVersion {
  id: string;
  versionNumber: number;
  kind: 'original' | 'derivative';
  parentVersionId?: string;
  mime: string;
  width: number;
  height: number;
  sizeBytes: number;
  promptSummary?: string;
  createdAt: string;
  expiresAt: string;
  url?: string;
}

export interface JobSummary {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  resultVersionId?: string;
  errorCode?: string;
  errorMessage?: string;
  creditsCharged?: number;
  createdAt: string;
  finishedAt?: string;
}

export interface AiToolDescriptor {
  id: EditTool;
  label: string;
  description: string;
  promptTemplate: string;
  requiresUserText: boolean;
  supportsMask: boolean;
}

export interface TierDescriptor {
  tier: Tier;
  label: string;
  credits: number;
  available: boolean;
}

export interface EditQuoteResponse {
  editRequestId: string;
  credits: number;
  tier: Tier;
  modelLabel: string;
  expiresAt: string;
  balance: WalletBalance;
}

export interface BillingProduct {
  code: string;
  kind: 'single_edit' | 'credit_pack';
  name: string;
  description: string;
  credits: number;
  priceCents: number;
  creditValidityDays: number;
}

export interface BillingPlan {
  code: string;
  name: string;
  description: string;
  monthlyCredits: number;
  priceCents: number;
}

export interface CheckoutResponse {
  paymentId: string;
  status: 'PENDING' | 'RECEIVED' | 'CONFIRMED' | 'OVERDUE';
  valueCents: number;
  invoiceUrl: string;
  pix?: {
    encodedImage?: string;
    payload: string;
    expirationDate: string;
  };
}

export interface SubscriptionResponse {
  subscriptionId: string;
  status: string;
  firstPayment?: CheckoutResponse;
}

export interface AdminMetrics {
  totalUsers: number;
  payingUsers: number;
  activeSubscriptions: number;
  mrrCents: number;
  totalAiCostUsd: number;
  estimatedContributionMargin: number;
  jobsCompletedToday: number;
}

// ─────────────────────────────────────────────
// Utilitários de Requisição
// ─────────────────────────────────────────────

function createIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'idem-' + Math.random().toString(36).substring(2) + Date.now().toString(36);
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();
  const headers = new Headers(options.headers || {});

  // Header CSRF mandatório em métodos mutantes
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    if (!headers.has('X-Requested-With')) {
      headers.set('X-Requested-With', 'alegon');
    }
  }

  // Define Content-Type JSON para corpos não-FormData
  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(path, {
    ...options,
    headers,
    credentials: 'include', // Essencial para cookies HttpOnly
  });

  if (response.status === 204) {
    return undefined as unknown as T;
  }

  let data: any;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const errorPayload: ApiErrorPayload = data?.error || {
      code: `HTTP_${response.status}`,
      message: typeof data === 'string' && data ? data : response.statusText,
    };
    throw new ApiError(response.status, errorPayload);
  }

  return data as T;
}

// ─────────────────────────────────────────────
// Métodos da API ALEGON
// ─────────────────────────────────────────────

export const api = {
  // ── Auth ──
  auth: {
    async register(data: {
      email: string;
      password: string;
      fullName: string;
      acceptTerms: boolean;
      acceptPrivacy: boolean;
    }) {
      return request<{ user: User }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    async login(data: { email: string; password: string }) {
      return request<{ user: User; mfaRequired: boolean }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    async verifyMfa(code: string) {
      return request<{ user: User }>('/api/auth/mfa/verify', {
        method: 'POST',
        body: JSON.stringify({ code }),
      });
    },

    async logout() {
      return request<void>('/api/auth/logout', { method: 'POST' });
    },

    async me() {
      return request<AuthMeResponse>('/api/auth/me');
    },

    async verifyEmail(token: string) {
      return request<void>('/api/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({ token }),
      });
    },

    async resendVerification() {
      return request<void>('/api/auth/resend-verification', { method: 'POST' });
    },

    async forgotPassword(email: string) {
      return request<void>('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
    },

    async resetPassword(token: string, password: string) {
      return request<void>('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password }),
      });
    },

    async changePassword(currentPassword: string, newPassword: string) {
      return request<void>('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
    },

    async listSessions() {
      return request<{ items: UserSession[] }>('/api/auth/sessions');
    },

    async revokeSession(id: string) {
      return request<void>(`/api/auth/sessions/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
    },

    async revokeOtherSessions() {
      return request<void>('/api/auth/sessions/revoke-others', { method: 'POST' });
    },

    async setupMfa() {
      return request<{ otpauthUrl: string; secret: string }>('/api/auth/mfa/setup', {
        method: 'POST',
      });
    },

    async enableMfa(code: string) {
      return request<{ recoveryCodes: string[] }>('/api/auth/mfa/enable', {
        method: 'POST',
        body: JSON.stringify({ code }),
      });
    },

    async disableMfa(code: string, password: string) {
      return request<void>('/api/auth/mfa/disable', {
        method: 'POST',
        body: JSON.stringify({ code, password }),
      });
    },
  },

  // ── Account & LGPD ──
  account: {
    async getProfile() {
      return request<{
        fullName: string;
        phone?: string;
        marketingOptIn: boolean;
        theme?: string;
      }>('/api/account/profile');
    },

    async updateProfile(data: Partial<{
      fullName: string;
      phone: string;
      marketingOptIn: boolean;
      theme: string;
    }>) {
      return request<void>('/api/account/profile', {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },

    async exportData() {
      return request<any>('/api/account/export');
    },

    async deleteAccount(password: string) {
      return request<{ scheduledFor: string }>('/api/account/delete', {
        method: 'POST',
        body: JSON.stringify({ password, confirm: 'EXCLUIR' }),
      });
    },

    async getConsents() {
      return request<Array<{ consentType: string; version: string; acceptedAt: string }>>(
        '/api/account/consents'
      );
    },
  },

  // ── Images & Versions ──
  images: {
    async upload(file: File, thumbBlob?: Blob, projectId?: string) {
      const formData = new FormData();
      formData.append('file', file);
      if (thumbBlob) {
        formData.append('thumb', thumbBlob, 'thumb.webp');
      }
      if (projectId) {
        formData.append('projectId', projectId);
      }
      return request<{ image: ImageSummary; version: ImageVersion }>('/api/images', {
        method: 'POST',
        body: formData,
      });
    },

    async list(params?: { projectId?: string; cursor?: string; limit?: number; sort?: 'recent' | 'expiring' }) {
      const searchParams = new URLSearchParams();
      if (params?.projectId) searchParams.set('projectId', params.projectId);
      if (params?.cursor) searchParams.set('cursor', params.cursor);
      if (params?.limit) searchParams.set('limit', params.limit.toString());
      if (params?.sort) searchParams.set('sort', params.sort);
      const query = searchParams.toString();
      return request<{ items: ImageSummary[]; nextCursor?: string }>(
        `/api/images${query ? `?${query}` : ''}`
      );
    },

    async get(id: string) {
      return request<{
        image: ImageSummary;
        versions: ImageVersion[];
        jobs: JobSummary[];
      }>(`/api/images/${encodeURIComponent(id)}`);
    },

    async update(id: string, data: { title?: string; projectId?: string }) {
      return request<ImageSummary>(`/api/images/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },

    async delete(id: string) {
      return request<void>(`/api/images/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
    },

    async deleteVersion(imageId: string, versionId: string) {
      return request<void>(
        `/api/images/${encodeURIComponent(imageId)}/versions/${encodeURIComponent(versionId)}`,
        { method: 'DELETE' }
      );
    },

    async getVersionUrl(
      imageId: string,
      versionId: string,
      opts?: { variant?: 'full' | 'thumb'; download?: boolean }
    ) {
      return request<{ url: string; expiresAt: string }>(
        `/api/images/${encodeURIComponent(imageId)}/versions/${encodeURIComponent(versionId)}/url`,
        {
          method: 'POST',
          body: JSON.stringify(opts || { variant: 'full' }),
        }
      );
    },
  },

  // ── Edits & AI Pipeline ──
  edits: {
    async getTools() {
      return request<{
        tools: AiToolDescriptor[];
        tiers: TierDescriptor[];
      }>('/api/edits/tools');
    },

    async quote(input: {
      imageId: string;
      versionId: string;
      prompt: string;
      tool: EditTool;
      tier: Tier;
    }) {
      return request<EditQuoteResponse>('/api/edits/quote', {
        method: 'POST',
        body: JSON.stringify(input),
      });
    },

    async confirm(editRequestId: string) {
      return request<{ jobId: string }>('/api/edits/confirm', {
        method: 'POST',
        headers: {
          'Idempotency-Key': createIdempotencyKey(),
        },
        body: JSON.stringify({ editRequestId }),
      });
    },

    async getJob(jobId: string) {
      return request<JobSummary>(`/api/edits/jobs/${encodeURIComponent(jobId)}`);
    },

    async cancelJob(jobId: string) {
      return request<void>(`/api/edits/jobs/${encodeURIComponent(jobId)}/cancel`, {
        method: 'POST',
      });
    },

    /**
     * Polling inteligente com backoff exponencial suave
     */
    async pollJob(
      jobId: string,
      onProgress?: (job: JobSummary, attempt: number) => void,
      signal?: AbortSignal
    ): Promise<JobSummary> {
      let delayMs = 2000;
      let attempt = 0;

      while (!signal?.aborted) {
        attempt++;
        const job = await api.edits.getJob(jobId);
        onProgress?.(job, attempt);

        if (['completed', 'failed', 'cancelled'].includes(job.status)) {
          return job;
        }

        await new Promise((res) => setTimeout(res, delayMs));
        // Aumenta até no máximo 6 segundos por tentativa
        delayMs = Math.min(6000, Math.round(delayMs * 1.3));
      }

      throw new Error('Operação cancelada');
    },
  },

  // ── Wallet ──
  wallet: {
    async getBalance() {
      return request<WalletBalance>('/api/wallet');
    },

    async listTransactions(cursor?: string, limit: number = 20) {
      const params = new URLSearchParams();
      if (cursor) params.set('cursor', cursor);
      params.set('limit', limit.toString());
      return request<{ items: WalletTransaction[]; nextCursor?: string }>(
        `/api/wallet/transactions?${params.toString()}`
      );
    },
  },

  // ── Billing & Asaas ──
  billing: {
    async getCatalog() {
      return request<{ products: BillingProduct[]; plans: BillingPlan[] }>(
        '/api/billing/catalog'
      );
    },

    async checkout(data: {
      productCode: string;
      billingType: 'PIX' | 'CREDIT_CARD';
      cpfCnpj?: string;
      name?: string;
    }) {
      return request<CheckoutResponse>('/api/billing/checkout', {
        method: 'POST',
        headers: {
          'Idempotency-Key': createIdempotencyKey(),
        },
        body: JSON.stringify(data),
      });
    },

    async getPayment(paymentId: string) {
      return request<CheckoutResponse & { creditsGranted?: number }>(
        `/api/billing/payments/${encodeURIComponent(paymentId)}`
      );
    },

    async createSubscription(data: {
      planCode: string;
      billingType: 'PIX' | 'CREDIT_CARD';
      cpfCnpj?: string;
    }) {
      return request<SubscriptionResponse>('/api/billing/subscriptions', {
        method: 'POST',
        headers: {
          'Idempotency-Key': createIdempotencyKey(),
        },
        body: JSON.stringify(data),
      });
    },

    async getSubscription() {
      return request<{
        id: string;
        planCode: string;
        status: string;
        currentPeriodEnd: string;
      } | null>('/api/billing/subscription');
    },

    async cancelSubscription(atPeriodEnd: boolean = true) {
      return request<void>('/api/billing/subscription/cancel', {
        method: 'POST',
        body: JSON.stringify({ atPeriodEnd }),
      });
    },
  },

  // ── Admin ──
  admin: {
    async getMetrics(from?: string, to?: string) {
      const params = new URLSearchParams();
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      const query = params.toString();
      return request<AdminMetrics>(`/api/admin/metrics${query ? `?${query}` : ''}`);
    },

    async listUsers(q?: string, cursor?: string) {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (cursor) params.set('cursor', cursor);
      return request<{
        items: Array<{
          id: string;
          email: string;
          fullName: string;
          emailVerified: boolean;
          roles: string[];
          mfaEnabled: boolean;
          isBlocked: boolean;
          createdAt: string;
          balance?: number;
        }>;
        nextCursor?: string;
      }>(`/api/admin/users?${params.toString()}`);
    },

    async blockUser(id: string) {
      return request<void>(`/api/admin/users/${encodeURIComponent(id)}/block`, {
        method: 'POST',
      });
    },

    async unblockUser(id: string) {
      return request<void>(`/api/admin/users/${encodeURIComponent(id)}/unblock`, {
        method: 'POST',
      });
    },

    async grantCredits(
      id: string,
      data: { amount: number; bucket: CreditBucket; note?: string }
    ) {
      return request<void>(`/api/admin/users/${encodeURIComponent(id)}/credits`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    async getModels() {
      return request<Array<{
        id: string;
        tier: Tier;
        modelId: string;
        label: string;
        priority: number;
        active: boolean;
        creditsCost: number;
      }>>('/api/admin/models');
    },

    async updateModel(id: string, data: any) {
      return request<void>(`/api/admin/models/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },

    async getSettings() {
      return request<Record<string, any>>('/api/admin/settings');
    },

    async updateSettings(settings: Record<string, any>) {
      return request<void>('/api/admin/settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      });
    },
  },
};
