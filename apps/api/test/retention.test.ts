/**
 * Testes unitários da Rotina de Retenção de 90 Dias e Purga LGPD — ALEGON AI Photo Studio.
 * Dono: Subagente 8 (QA e Testes).
 */
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { runRetention } from '../src/jobs/retention';
import { createMockD1 } from './mock-d1';
import { nowIso, addDays } from '../src/lib/http';

const { mockDeleteKeys, mockDeletePrefix, mockSendEmail } = vi.hoisted(() => ({
  mockDeleteKeys: vi.fn(),
  mockDeletePrefix: vi.fn(),
  mockSendEmail: vi.fn(async () => ({ success: true })),
}));

vi.mock('../src/storage', () => ({
  createStorageService: () => ({
    deleteKeys: mockDeleteKeys,
    deletePrefix: mockDeletePrefix,
    putObject: vi.fn(),
    getObject: vi.fn(),
    signedUrl: vi.fn(),
  }),
}));

vi.mock('../src/email', () => ({
  sendEmail: mockSendEmail,
}));

describe('Rotina de Retenção de 90 Dias e Expurgo LGPD (retention.ts)', () => {
  let mock: ReturnType<typeof createMockD1>;
  let envMock: any;

  beforeEach(() => {
    mock = createMockD1();
    mockDeleteKeys.mockClear();
    mockDeletePrefix.mockClear();
    mockSendEmail.mockClear();

    envMock = {
      DB: mock.d1,
      PHOTOS_BUCKET: {} as any,
      RESEND_API_KEY: 'test-key',
      ENVIRONMENT: 'test',
    };

    const now = nowIso();
    // Insere dados básicos de teste
    mock.sqlite.exec(`
      INSERT INTO users (id, email, password_hash, status, created_at, updated_at)
      VALUES 
        ('user-1', 'titular1@alegon.com.br', 'hash1', 'active', '${now}', '${now}'),
        ('user-2', 'titular2@alegon.com.br', 'hash2', 'active', '${now}', '${now}');

      INSERT INTO profiles (user_id, full_name, cpf_cnpj, phone, updated_at)
      VALUES 
        ('user-1', 'Titular Um', '12345678901', '11999998888', '${now}'),
        ('user-2', 'Titular Dois', '98765432100', '11977776666', '${now}');
    `);
  });

  it('deve notificar usuário sobre fotos que expiram nos próximos 7 dias', async () => {
    const now = nowIso();
    const inFourDays = addDays(now, 4);

    // Foto que vence em 4 dias (elegível para aviso)
    mock.sqlite.exec(`
      INSERT INTO images (id, user_id, title, created_at, expires_at)
      VALUES ('img-exp-7d', 'user-1', 'Foto Campanha', '${addDays(now, -86)}', '${inFourDays}');
    `);

    await runRetention(envMock);

    // Verifica se gerou notificação in-app
    const notifications = mock.sqlite
      .prepare('SELECT user_id, type, title, body FROM notifications WHERE user_id = ?')
      .all('user-1') as any[];

    expect(notifications.length).toBe(1);
    expect(notifications[0].type).toBe('retention_warning');
    expect(notifications[0].title).toBe('Fotos prestes a expirar');
    expect(notifications[0].body).toContain('7 dias');

    // Verifica se marcou expiry_notified_at para evitar duplicação no próximo dia
    const img = mock.sqlite.prepare('SELECT expiry_notified_at FROM images WHERE id = ?').get('img-exp-7d') as any;
    expect(img.expiry_notified_at).not.toBeNull();
  });

  it('deve purgar e deletar fisicamente do R2 imagens com mais de 90 dias vencidas', async () => {
    const now = nowIso();
    const yesterday = addDays(now, -1);

    // Imagem 1: vencida (expires_at no passado) com duas versões e miniaturas
    mock.sqlite.exec(`
      INSERT INTO images (id, user_id, title, created_at, expires_at)
      VALUES ('img-vencida-1', 'user-1', 'Foto Expirada', '${addDays(now, -91)}', '${yesterday}');

      INSERT INTO image_versions (id, image_id, user_id, version_number, kind, r2_key, thumb_r2_key, mime, size_bytes, created_at, expires_at)
      VALUES 
        ('ver-1', 'img-vencida-1', 'user-1', 1, 'original', 'u/user-1/i/img-vencida-1/v/ver-1.jpg', 'u/user-1/i/img-vencida-1/v/ver-1/thumb.webp', 'image/jpeg', 1024, '${addDays(now, -91)}', '${yesterday}'),
        ('ver-2', 'img-vencida-1', 'user-1', 2, 'edit', 'u/user-1/i/img-vencida-1/v/ver-2.png', 'u/user-1/i/img-vencida-1/v/ver-2/thumb.webp', 'image/png', 2048, '${addDays(now, -91)}', '${yesterday}');
    `);

    // Imagem 2: ativa (expires_at no futuro) que NÃO deve ser deletada
    mock.sqlite.exec(`
      INSERT INTO images (id, user_id, title, created_at, expires_at)
      VALUES ('img-ativa-2', 'user-1', 'Foto Recente', '${now}', '${addDays(now, 80)}');

      INSERT INTO image_versions (id, image_id, user_id, version_number, kind, r2_key, thumb_r2_key, mime, size_bytes, created_at, expires_at)
      VALUES ('ver-ativa', 'img-ativa-2', 'user-1', 1, 'original', 'u/user-1/i/img-ativa-2/v/ver-ativa.jpg', null, 'image/jpeg', 1024, '${now}', '${addDays(now, 80)}');
    `);

    await runRetention(envMock);

    // Valida que as chaves da imagem vencida foram excluídas do R2
    expect(mockDeleteKeys).toHaveBeenCalled();
    const passedKeys = mockDeleteKeys.mock.calls.flatMap((call: any[]) => call[0]);
    expect(passedKeys).toContain('u/user-1/i/img-vencida-1/v/ver-1.jpg');
    expect(passedKeys).toContain('u/user-1/i/img-vencida-1/v/ver-1/thumb.webp');
    expect(passedKeys).toContain('u/user-1/i/img-vencida-1/v/ver-2.png');
    expect(passedKeys).toContain('u/user-1/i/img-vencida-1/v/ver-2/thumb.webp');

    // Valida que a imagem ativa NÃO foi deletada
    expect(passedKeys).not.toContain('u/user-1/i/img-ativa-2/v/ver-ativa.jpg');

    // Valida atualização de metadados no banco D1
    const imgRow = mock.sqlite.prepare('SELECT deleted_at, deletion_reason FROM images WHERE id = ?').get('img-vencida-1') as any;
    expect(imgRow.deleted_at).not.toBeNull();
    expect(imgRow.deletion_reason).toBe('retention');

    const activeRow = mock.sqlite.prepare('SELECT deleted_at FROM images WHERE id = ?').get('img-ativa-2') as any;
    expect(activeRow.deleted_at).toBeNull();
  });

  it('deve processar solicitação de exclusão definitiva de conta (Direito ao Esquecimento LGPD)', async () => {
    const now = nowIso();

    // Cria sessão e solicitação de exclusão para user-2
    mock.sqlite.exec(`
      INSERT INTO sessions (id, user_id, mfa_verified, created_at, last_seen_at, expires_at)
      VALUES ('sess-user-2', 'user-2', 0, '${now}', '${now}', '${addDays(now, 30)}');

      INSERT INTO auth_tokens (id, user_id, type, token_hash, expires_at, created_at)
      VALUES ('token-user-2', 'user-2', 'email_verify', 'hash-tok-2', '${addDays(now, 1)}', '${now}');

      INSERT INTO deletion_requests (id, user_id, type, status, requested_at, scheduled_for)
      VALUES ('del-req-1', 'user-2', 'account', 'pending', '${now}', '${now}');
    `);

    await runRetention(envMock);

    // 1. Limpeza total de arquivos no R2 por prefixo
    expect(mockDeletePrefix).toHaveBeenCalledWith('u/user-2/');

    // 2. Anonimização na tabela users
    const userRow = mock.sqlite.prepare('SELECT email, password_hash, status FROM users WHERE id = ?').get('user-2') as any;
    expect(userRow.email).toBe('anon-user-2@deleted.alegon.local');
    expect(userRow.password_hash).toBe('deleted');
    expect(userRow.status).toBe('deleted');

    // 3. Anonimização do perfil
    const profRow = mock.sqlite.prepare('SELECT full_name, cpf_cnpj, phone, marketing_opt_in FROM profiles WHERE user_id = ?').get('user-2') as any;
    expect(profRow.full_name).toBe('Usuário Anonimizado');
    expect(profRow.cpf_cnpj).toBeNull();
    expect(profRow.phone).toBeNull();
    expect(profRow.marketing_opt_in).toBe(0);

    // 4. Remoção de sessões e tokens
    const sessions = mock.sqlite.prepare('SELECT id FROM sessions WHERE user_id = ?').all('user-2') as any[];
    expect(sessions.length).toBe(0);

    const tokens = mock.sqlite.prepare('SELECT id FROM auth_tokens WHERE user_id = ?').all('user-2') as any[];
    expect(tokens.length).toBe(0);

    // 5. Conclusão da solicitação
    const delReq = mock.sqlite.prepare('SELECT status, completed_at FROM deletion_requests WHERE id = ?').get('del-req-1') as any;
    expect(delReq.status).toBe('completed');
    expect(delReq.completed_at).not.toBeNull();
  });

  it('deve limpar buckets de rate limit e tokens expirados periodicamente', async () => {
    const now = nowIso();
    const pastDate = addDays(now, -10);

    mock.sqlite.exec(`
      INSERT INTO rate_limit_buckets (key, count, window_start, expires_at)
      VALUES 
        ('rl-expired', 5, '${pastDate}', '${addDays(now, -1)}'),
        ('rl-active', 1, '${now}', '${addDays(now, 1)}');
    `);

    await runRetention(envMock);

    const expiredBucket = mock.sqlite.prepare('SELECT key FROM rate_limit_buckets WHERE key = ?').get('rl-expired');
    const activeBucket = mock.sqlite.prepare('SELECT key FROM rate_limit_buckets WHERE key = ?').get('rl-active');

    expect(expiredBucket).toBeUndefined();
    expect(activeBucket).toBeDefined();
  });
});
