/**
 * Sistema de auditoria e trilha de segurança (Audit Logs).
 * Dono: Subagente 6 (Segurança e LGPD).
 *
 * Persiste eventos na tabela canônica `audit_logs`:
 * - Redige dados sensíveis automaticamente (senhas, segredos, tokens, cartões, credenciais).
 * - Armazena hash unidirecional de IP com salt da aplicação (respeito à LGPD).
 * - Identificadores gerados com timestamp e unicidade.
 */
import type { Env } from '../env';
import { hashIp } from './crypto';

export type AuditActorType = 'user' | 'admin' | 'system' | 'webhook';

export interface AuditEntry {
  actorUserId?: string | null;
  actorType: AuditActorType;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  ip?: string | null;
  ipHash?: string | null;
  metadata?: Record<string, unknown> | null;
}

const REDACTED_KEY_REGEX =
  /(password|senha|secret|token|authorization|cookie|session|apikey|api_key|privkey|private_key|credit_card|cardnumber|cvv|cvc|salt)/i;

/**
 * Redige recursivamente chaves ou valores sensíveis em objetos de metadados.
 */
export function sanitizeAuditMetadata(data: unknown, depth: number = 0): unknown {
  if (depth > 6) return '[MAX_DEPTH]';
  if (data === null || data === undefined) return data;

  if (typeof data === 'string') {
    // Redige tokens Bearer e formatos óbvios de segredos
    if (/bearer\s+[a-z0-9._-]+/i.test(data)) {
      return data.replace(/bearer\s+[a-z0-9._-]+/gi, 'Bearer [REDACTED]');
    }
    return data;
  }

  if (typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeAuditMetadata(item, depth + 1));
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(data as Record<string, unknown>)) {
    if (REDACTED_KEY_REGEX.test(key)) {
      sanitized[key] = '[REDACTED]';
    } else if (key.toLowerCase() === 'cpf' || key.toLowerCase() === 'cnpj') {
      // Mascara preservando apenas primeiros 3 e últimos 2 dígitos para fins de conciliação
      if (typeof val === 'string' && val.length >= 6) {
        sanitized[key] = `${val.slice(0, 3)}***${val.slice(-2)}`;
      } else {
        sanitized[key] = '[REDACTED]';
      }
    } else {
      sanitized[key] = sanitizeAuditMetadata(val, depth + 1);
    }
  }

  return sanitized;
}

/**
 * Grava um registro de auditoria no D1.
 */
export async function audit(env: Env, entry: AuditEntry): Promise<void> {
  try {
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();

    let computedIpHash = entry.ipHash ?? null;
    if (!computedIpHash && entry.ip) {
      const secret = env?.SESSION_SECRET || 'alegon-audit-secret';
      computedIpHash = await hashIp(entry.ip, secret);
    }

    const sanitizedMeta = entry.metadata ? sanitizeAuditMetadata(entry.metadata) : null;
    const metadataJson = sanitizedMeta ? JSON.stringify(sanitizedMeta) : null;

    await env.DB.prepare(
      `INSERT INTO audit_logs (
        id, actor_user_id, actor_type, action, target_type, target_id, ip_hash, metadata_json, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        id,
        entry.actorUserId ?? null,
        entry.actorType,
        entry.action,
        entry.targetType ?? null,
        entry.targetId ?? null,
        computedIpHash,
        metadataJson,
        createdAt,
      )
      .run();
  } catch (err) {
    // Trilha de auditoria não deve abortar transação de negócio principal, mas deve ser registrada
    console.error(
      JSON.stringify({
        level: 'error',
        msg: 'Falha ao gravar audit log',
        error: (err as Error).message,
        action: entry.action,
      }),
    );
  }
}
