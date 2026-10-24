import { describe, expect, it } from 'vitest';
import type { Env } from '../env';
import { audit, sanitizeAuditMetadata } from './audit';

describe('audit and security logging', () => {
  it('redacts sensitive fields in metadata automatically', () => {
    const dirty = {
      username: 'alex',
      password: 'super-secret-password-123',
      apiKey: 'sk-or-v1-abcdef1234567890',
      nested: {
        token: 'sess_99887766',
        cvv: '123',
        authHeader: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
      cpf: '12345678900',
      safeInfo: 'Plano Pro 50 créditos',
    };

    const clean: any = sanitizeAuditMetadata(dirty);

    expect(clean.username).toBe('alex');
    expect(clean.password).toBe('[REDACTED]');
    expect(clean.apiKey).toBe('[REDACTED]');
    expect(clean.nested.token).toBe('[REDACTED]');
    expect(clean.nested.cvv).toBe('[REDACTED]');
    expect(clean.nested.authHeader).toContain('Bearer [REDACTED]');
    expect(clean.cpf).toBe('123***00');
    expect(clean.safeInfo).toBe('Plano Pro 50 créditos');
  });

  it('inserts audited log entry with hashed IP into D1', async () => {
    let insertedRow: any = null;

    const mockDb = {
      prepare(query: string) {
        return {
          bind(...args: any[]) {
            insertedRow = {
              id: args[0],
              actor_user_id: args[1],
              actor_type: args[2],
              action: args[3],
              target_type: args[4],
              target_id: args[5],
              ip_hash: args[6],
              metadata_json: args[7],
              created_at: args[8],
            };
            return this;
          },
          async run() {
            return { success: true };
          },
        };
      },
    } as unknown as D1Database;

    const env = {
      DB: mockDb,
      SESSION_SECRET: 'test-audit-secret',
    } as Env;

    await audit(env, {
      actorUserId: 'usr_123',
      actorType: 'user',
      action: 'image.delete',
      targetType: 'image',
      targetId: 'img_456',
      ip: '201.55.10.2',
      metadata: {
        reason: 'Solicitação do usuário',
        token: 'leak_token_attempt',
      },
    });

    expect(insertedRow).not.toBeNull();
    expect(insertedRow.actor_user_id).toBe('usr_123');
    expect(insertedRow.action).toBe('image.delete');
    expect(insertedRow.ip_hash).toMatch(/^[0-9a-f]{64}$/); // IP anonimizado via SHA-256

    const meta = JSON.parse(insertedRow.metadata_json);
    expect(meta.reason).toBe('Solicitação do usuário');
    expect(meta.token).toBe('[REDACTED]');
  });
});
