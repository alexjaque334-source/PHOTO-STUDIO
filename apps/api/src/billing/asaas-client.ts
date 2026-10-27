/**
 * ALEGON AI Photo Studio — Cliente HTTP Asaas v3
 * Dono: Subagente 5 (Asaas e Billing)
 *
 * Cliente seguro para comunicação com a API v3 do Asaas (Sandbox e Produção):
 * - Timeout estrito de 15 segundos
 * - Tratamento tipado de erros da API Asaas
 * - Nenhum dado de cartão trafegado
 */
import type { Env } from '../env';
import { DomainError } from '../contracts';

export interface AsaasCustomer {
  id: string;
  name: string;
  email?: string;
  cpfCnpj?: string;
  phone?: string;
  mobilePhone?: string;
  externalReference?: string;
  deleted?: boolean;
}

export interface AsaasPayment {
  id: string;
  customer: string;
  subscription?: string | null;
  installment?: string | null;
  value: number;
  netValue?: number;
  originalValue?: number;
  description?: string;
  billingType: 'PIX' | 'CREDIT_CARD' | 'BOLETO' | 'UNDEFINED';
  status: string; // PENDING, RECEIVED, CONFIRMED, OVERDUE, REFUNDED, etc.
  dueDate: string;
  originalDueDate?: string;
  paymentDate?: string | null;
  clientPaymentDate?: string | null;
  invoiceUrl?: string;
  invoiceNumber?: string;
  externalReference?: string;
  deleted?: boolean;
}

export interface AsaasPixQrCode {
  encodedImage: string; // Base64 PNG
  payload: string;      // Pix Copia-e-Cola
  expirationDate: string;
}

export interface AsaasCreditCard {
  holderName: string;
  number: string;
  expiryMonth: string;
  expiryYear: string;
  ccv: string;
}

export interface AsaasCreditCardHolderInfo {
  name: string;
  email: string;
  cpfCnpj: string;
  postalCode: string;
  addressNumber: string;
  addressComplement?: string;
  phone: string;
  mobilePhone?: string;
}

export interface AsaasSubscription {
  id: string;
  customer: string;
  billingType: 'PIX' | 'CREDIT_CARD' | 'BOLETO';
  value: number;
  nextDueDate: string;
  cycle: 'MONTHLY' | 'WEEKLY' | 'BIWEEKLY' | 'QUARTERLY' | 'SEMIANNUALLY' | 'YEARLY';
  description?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED';
  externalReference?: string;
  deleted?: boolean;
}

export class AsaasClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(env: Env) {
    this.baseUrl = (env.ASAAS_BASE_URL || 'https://api-sandbox.asaas.com/v3').replace(/\/+$/, '');
    this.apiKey = env.ASAAS_API_KEY || '';
  }

  private async request<T>(
    endpoint: string,
    options: {
      method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
      body?: unknown;
      timeoutMs?: number;
    } = {},
  ): Promise<T> {
    const { method = 'GET', body, timeoutMs = 15000 } = options;
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'User-Agent': 'ALEGON-AI-Photo-Studio/1.0',
    };

    if (this.apiKey) {
      headers['access_token'] = this.apiKey;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const responseText = await response.text();
      let responseJson: any = null;
      try {
        responseJson = responseText ? JSON.parse(responseText) : {};
      } catch {
        responseJson = { raw: responseText };
      }

      if (!response.ok) {
        const errorList = responseJson?.errors as Array<{ code: string; description: string }> | undefined;
        const mainMessage =
          errorList && errorList.length > 0 && errorList[0]
            ? errorList[0].description
            : responseJson?.message || `Erro na comunicação com gateway Asaas (${response.status})`;

        throw new DomainError('ASAAS_ERROR', mainMessage, response.status >= 500 ? 502 : response.status, {
          status: response.status,
          errors: errorList ?? responseJson,
        });
      }

      return responseJson as T;
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      if (err instanceof DomainError) {
        throw err;
      }
      if ((err as Error).name === 'AbortError') {
        throw new DomainError('ASAAS_TIMEOUT', 'Tempo limite de resposta do gateway Asaas excedido.', 504);
      }
      throw new DomainError('ASAAS_CONNECTION_ERROR', `Falha de rede com gateway Asaas: ${(err as Error).message}`, 502);
    }
  }

  // ───────────────────────────── Clientes ─────────────────────────────
  async createCustomer(input: {
    name: string;
    cpfCnpj: string;
    email?: string;
    mobilePhone?: string;
    externalReference?: string;
  }): Promise<AsaasCustomer> {
    return this.request<AsaasCustomer>('/customers', {
      method: 'POST',
      body: input,
    });
  }

  async getCustomer(id: string): Promise<AsaasCustomer> {
    return this.request<AsaasCustomer>(`/customers/${id}`);
  }

  async findCustomerByCpfCnpj(cpfCnpj: string): Promise<AsaasCustomer | null> {
    const cleanCpf = cpfCnpj.replace(/\D/g, '');
    const res = await this.request<{ data: AsaasCustomer[] }>(`/customers?cpfCnpj=${cleanCpf}`);
    return res.data && res.data.length > 0 ? (res.data[0] ?? null) : null;
  }

  async findCustomerByEmail(email: string): Promise<AsaasCustomer | null> {
    const res = await this.request<{ data: AsaasCustomer[] }>(
      `/customers?email=${encodeURIComponent(email)}`,
    );
    return res.data && res.data.length > 0 ? (res.data[0] ?? null) : null;
  }

  // ───────────────────────────── Cobranças (Pix / Cartão) ─────────────────────────────
  async createPayment(input: {
    customer: string;
    billingType: 'PIX' | 'CREDIT_CARD' | 'BOLETO';
    value: number;
    dueDate: string;
    description?: string;
    externalReference?: string;
    postalService?: boolean;
    creditCard?: AsaasCreditCard;
    creditCardHolderInfo?: AsaasCreditCardHolderInfo;
    remoteIp?: string;
  }): Promise<AsaasPayment> {
    return this.request<AsaasPayment>('/payments', {
      method: 'POST',
      body: {
        postalService: false,
        ...input,
      },
    });
  }

  async getPayment(id: string): Promise<AsaasPayment> {
    return this.request<AsaasPayment>(`/payments/${id}`);
  }

  async getPixQrCode(paymentId: string): Promise<AsaasPixQrCode> {
    return this.request<AsaasPixQrCode>(`/payments/${paymentId}/pixQrCode`);
  }

  async refundPayment(
    paymentId: string,
    input?: { value?: number; description?: string },
  ): Promise<AsaasPayment> {
    return this.request<AsaasPayment>(`/payments/${paymentId}/refund`, {
      method: 'POST',
      body: input ?? {},
    });
  }

  // ───────────────────────────── Assinaturas ─────────────────────────────
  async createSubscription(input: {
    customer: string;
    billingType: 'PIX' | 'CREDIT_CARD';
    value: number;
    nextDueDate: string;
    cycle: 'MONTHLY';
    description?: string;
    externalReference?: string;
    creditCard?: AsaasCreditCard;
    creditCardHolderInfo?: AsaasCreditCardHolderInfo;
    remoteIp?: string;
  }): Promise<AsaasSubscription> {
    return this.request<AsaasSubscription>('/subscriptions', {
      method: 'POST',
      body: input,
    });
  }

  async getSubscription(id: string): Promise<AsaasSubscription> {
    return this.request<AsaasSubscription>(`/subscriptions/${id}`);
  }

  async getSubscriptionPayments(subscriptionId: string): Promise<{ data: AsaasPayment[] }> {
    return this.request<{ data: AsaasPayment[] }>(`/subscriptions/${subscriptionId}/payments`);
  }

  async cancelSubscription(id: string): Promise<{ deleted: boolean; id: string }> {
    return this.request<{ deleted: boolean; id: string }>(`/subscriptions/${id}`, {
      method: 'DELETE',
    });
  }
}
