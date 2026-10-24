/**
 * Testes unitários e de integração de Autenticação e Sessões — ALEGON AI Photo Studio.
 * Dono: Subagente 8 (QA e Testes).
 */
import { describe, expect, it, beforeEach } from 'vitest';
import {
  hashPassword,
  verifyPassword,
  constantTimeCompare,
  sha256Hex,
  randomToken,
  hmacSha256,
  encryptAesGcm,
  decryptAesGcm,
} from '../src/auth/crypto';
import { validatePasswordStrength } from '../src/auth/passwords';
import {
  createSession,
  validateSessionToken,
  revokeSession,
  revokeAllUserSessions,
  revokeOtherUserSessions,
  handleFailedLogin,
  resetFailedLogin,
} from '../src/auth/session';
import {
  generateTotpSecret,
  verifyTotp,
  buildOtpauthUrl,
  generateRecoveryCodes,
} from '../src/auth/totp';
import { DomainError } from '../src/contracts';
import { createMockD1 } from './mock-d1';
import { nowIso } from '../src/lib/http';

describe('Criptografia e Hashing de Senhas (PBKDF2-SHA256)', () => {
  it('deve gerar hash no formato canônico pbkdf2-sha256 com 100.000 iterações', async () => {
    const password = 'MinhaSenhaSegura2026!';
    const hash = await hashPassword(password);

    expect(hash).toMatch(/^pbkdf2-sha256\$100000\$[A-Za-z0-9+/=]+\$[A-Za-z0-9+/=]+$/);
  });

  it('deve verificar com sucesso a senha correta e rejeitar senha incorreta', async () => {
    const password = 'StudioAlegonUltraForte#99';
    const hash = await hashPassword(password);

    const isMatch = await verifyPassword(password, hash);
    expect(isMatch).toBe(true);

    const isWrongMatch = await verifyPassword('SenhaIncorretaErrada123', hash);
    expect(isWrongMatch).toBe(false);
  });

  it('deve gerar salts distintos para a mesma senha (proteção contra rainbow tables)', async () => {
    const password = 'SenhaIdentica1234!';
    const hash1 = await hashPassword(password);
    const hash2 = await hashPassword(password);

    expect(hash1).not.toBe(hash2);
    expect(await verifyPassword(password, hash1)).toBe(true);
    expect(await verifyPassword(password, hash2)).toBe(true);
  });

  it('deve rejeitar hashes malformados ou adulterados com segurança', async () => {
    expect(await verifyPassword('teste', 'invalido')).toBe(false);
    expect(await verifyPassword('teste', 'pbkdf2-sha256$50$salt$hash')).toBe(false);
    expect(await verifyPassword('teste', 'md5$12345$salt$hash')).toBe(false);
  });

  it('deve executar constantTimeCompare protegendo contra timing attacks', () => {
    const a = new Uint8Array([1, 2, 3, 4, 5]);
    const b = new Uint8Array([1, 2, 3, 4, 5]);
    const c = new Uint8Array([1, 2, 3, 4, 6]);
    const d = new Uint8Array([1, 2, 3]);

    expect(constantTimeCompare(a, b)).toBe(true);
    expect(constantTimeCompare(a, c)).toBe(false);
    expect(constantTimeCompare(a, d)).toBe(false);
  });

  it('deve criptografar e descriptografar segredos com AES-GCM', async () => {
    // Chave de 256 bits (32 bytes) em base64
    const keyBytes = crypto.getRandomValues(new Uint8Array(32));
    let binary = '';
    for (let i = 0; i < keyBytes.length; i++) binary += String.fromCharCode(keyBytes[i]!);
    const keyBase64 = btoa(binary);

    const secret = 'JBSWY3DPEHPK3PXP'; // Base32 TOTP secret
    const encrypted = await encryptAesGcm(keyBase64, secret);
    expect(encrypted).not.toBe(secret);

    const decrypted = await decryptAesGcm(keyBase64, encrypted);
    expect(decrypted).toBe(secret);
  });
});

describe('Validação de Força de Senha (passwords.ts)', () => {
  it('deve aceitar senhas fortes que atendem aos requisitos de segurança', () => {
    expect(() => validatePasswordStrength('FotografiaAlegon2026!')).not.toThrow();
    expect(() => validatePasswordStrength('c0mpl3x#P@ssw0rd!Pro')).not.toThrow();
  });

  it('deve rejeitar senhas com menos de 10 caracteres', () => {
    expect(() => validatePasswordStrength('Curta12!')).toThrow(DomainError);
    try {
      validatePasswordStrength('123456789');
    } catch (e: any) {
      expect(e.code).toBe('PASSWORD_TOO_SHORT');
      expect(e.status).toBe(422);
    }
  });

  it('deve rejeitar senhas que excedam 128 caracteres', () => {
    const hugePassword = 'A'.repeat(129);
    expect(() => validatePasswordStrength(hugePassword)).toThrow(DomainError);
  });

  it('deve rejeitar senhas comuns e previsíveis do dicionário', () => {
    const commonList = ['password123', 'admin123456', 'alegon2026', 'letmein1234', 'photo123456'];
    for (const pwd of commonList) {
      try {
        validatePasswordStrength(pwd);
        expect.unreachable(`Deveria ter rejeitado senha comum: ${pwd}`);
      } catch (e: any) {
        expect(e.code).toBe('PASSWORD_TOO_COMMON');
      }
    }
  });

  it('deve rejeitar senhas formadas por caracteres repetidos', () => {
    try {
      validatePasswordStrength('aaaaaaaaaaaaa');
      expect.unreachable();
    } catch (e: any) {
      expect(e.code).toBe('PASSWORD_TOO_SIMPLE');
    }
  });
});

describe('Sessões e Bloqueio Progressivo de Conta (session.ts)', () => {
  let mock: ReturnType<typeof createMockD1>;

  beforeEach(() => {
    mock = createMockD1();
    const now = nowIso();
    // Cria usuário de teste ativo
    mock.sqlite.exec(`
      INSERT INTO users (id, email, password_hash, status, created_at, updated_at)
      VALUES ('user-test-1', 'cliente@alegon.com.br', 'fake-hash', 'active', '${now}', '${now}');
      INSERT INTO profiles (user_id, full_name, updated_at)
      VALUES ('user-test-1', 'Cliente de Teste', '${now}');
      INSERT INTO user_roles (user_id, role, granted_at)
      VALUES ('user-test-1', 'user', '${now}');
    `);
  });

  it('deve criar uma nova sessão com token opaco e salvar o SHA-256 no banco', async () => {
    const { token, session } = await createSession(mock.d1, 'user-test-1', false, {
      userAgent: 'Mozilla/5.0 Vitest',
      ip: '192.168.1.50',
    });

    expect(token).toBeDefined();
    expect(token.length).toBe(64); // 32 bytes em hex = 64 chars
    expect(session.id).toBe(await sha256Hex(token));
    expect(session.mfaVerified).toBe(false);

    // Valida no banco
    const row = mock.sqlite
      .prepare('SELECT id, user_id, user_agent FROM sessions WHERE id = ?')
      .get(session.id) as any;
    expect(row).toBeDefined();
    expect(row.user_id).toBe('user-test-1');
    expect(row.user_agent).toBe('Mozilla/5.0 Vitest');
  });

  it('deve validar token de sessão e recuperar dados do usuário e roles', async () => {
    const { token, session } = await createSession(mock.d1, 'user-test-1', true, {
      userAgent: 'Agent 008',
    });

    const result = await validateSessionToken(mock.d1, token);
    expect(result).not.toBeNull();
    expect(result?.user.id).toBe('user-test-1');
    expect(result?.user.email).toBe('cliente@alegon.com.br');
    expect(result?.user.roles).toContain('user');
    expect(result?.session.id).toBe(session.id);
    expect(result?.session.mfaVerified).toBe(true);
  });

  it('deve rejeitar token inexistente ou expirado', async () => {
    const invalid = await validateSessionToken(mock.d1, 'token-inexistente-123456');
    expect(invalid).toBeNull();

    // Cria sessão já expirada
    const { token, session } = await createSession(mock.d1, 'user-test-1', false, {});
    mock.sqlite.exec(`UPDATE sessions SET expires_at = '2020-01-01T00:00:00.000Z' WHERE id = '${session.id}'`);

    const expiredResult = await validateSessionToken(mock.d1, token);
    expect(expiredResult).toBeNull();
  });

  it('deve revogar sessão específica', async () => {
    const { token, session } = await createSession(mock.d1, 'user-test-1', false, {});
    expect(await validateSessionToken(mock.d1, token)).not.toBeNull();

    await revokeSession(mock.d1, session.id);
    expect(await validateSessionToken(mock.d1, token)).toBeNull();
  });

  it('deve revogar outras sessões mantendo a sessão atual ativa', async () => {
    const sess1 = await createSession(mock.d1, 'user-test-1', false, {});
    const sess2 = await createSession(mock.d1, 'user-test-1', false, {});
    const sess3 = await createSession(mock.d1, 'user-test-1', false, {});

    await revokeOtherUserSessions(mock.d1, 'user-test-1', sess2.session.id);

    expect(await validateSessionToken(mock.d1, sess1.token)).toBeNull();
    expect(await validateSessionToken(mock.d1, sess2.token)).not.toBeNull();
    expect(await validateSessionToken(mock.d1, sess3.token)).toBeNull();
  });

  it('deve revogar todas as sessões de um usuário', async () => {
    const sess1 = await createSession(mock.d1, 'user-test-1', false, {});
    const sess2 = await createSession(mock.d1, 'user-test-1', false, {});

    await revokeAllUserSessions(mock.d1, 'user-test-1');

    expect(await validateSessionToken(mock.d1, sess1.token)).toBeNull();
    expect(await validateSessionToken(mock.d1, sess2.token)).toBeNull();
  });

  it('deve aplicar bloqueio progressivo após 5 falhas consecutivas de login', async () => {
    // Falhas 1 a 4 incrementam sem bloqueio
    for (let i = 0; i < 4; i++) {
      await handleFailedLogin(mock.d1, 'user-test-1', i);
      const user = mock.sqlite.prepare('SELECT failed_login_count, locked_until FROM users WHERE id = ?').get('user-test-1') as any;
      expect(user.failed_login_count).toBe(i + 1);
      expect(user.locked_until).toBeNull();
    }

    // 5ª falha aplica bloqueio de 15 minutos e lança ACCOUNT_LOCKED
    try {
      await handleFailedLogin(mock.d1, 'user-test-1', 4);
      expect.unreachable('Deveria ter lançado erro de conta bloqueada');
    } catch (e: any) {
      expect(e.code).toBe('ACCOUNT_LOCKED');
      expect(e.status).toBe(403);
      expect(e.details.lockedUntil).toBeDefined();
    }

    const lockedUser = mock.sqlite.prepare('SELECT failed_login_count, locked_until FROM users WHERE id = ?').get('user-test-1') as any;
    expect(lockedUser.failed_login_count).toBe(5);
    expect(lockedUser.locked_until).not.toBeNull();

    // Reseta contador após login bem-sucedido
    await resetFailedLogin(mock.d1, 'user-test-1');
    const resetUser = mock.sqlite.prepare('SELECT failed_login_count, locked_until FROM users WHERE id = ?').get('user-test-1') as any;
    expect(resetUser.failed_login_count).toBe(0);
    expect(resetUser.locked_until).toBeNull();
  });
});

describe('MFA TOTP e Códigos de Recuperação (totp.ts)', () => {
  it('deve gerar segredo TOTP em Base32 e URL otpauth válida', () => {
    const secret = generateTotpSecret();
    expect(secret).toMatch(/^[A-Z2-7]{32}$/);

    const otpauthUrl = buildOtpauthUrl('admin@alegon.com.br', 'ALEGON', secret);
    expect(otpauthUrl).toContain('otpauth://totp/ALEGON:admin%40alegon.com.br');
    expect(otpauthUrl).toContain(`secret=${secret}`);
    expect(otpauthUrl).toContain('issuer=ALEGON');
  });

  it('deve gerar códigos de recuperação de uso único com hashes SHA-256', async () => {
    const { codes, hashes } = await generateRecoveryCodes(8);

    expect(codes.length).toBe(8);
    expect(hashes.length).toBe(8);

    for (let i = 0; i < codes.length; i++) {
      expect(codes[i]).toMatch(/^[A-Z0-9]{5}-[A-Z0-9]{5}$/);
      expect(await sha256Hex(codes[i]!)).toBe(hashes[i]);
    }
  });
});
