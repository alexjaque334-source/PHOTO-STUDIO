import { describe, it, expect, beforeEach } from 'vitest';
import { createMockD1, MockD1Instance } from './mock-d1';
import { paginate } from '../src/db';

describe('Helper de Paginação D1 (paginate)', () => {
  let mock: MockD1Instance;

  beforeEach(() => {
    mock = createMockD1();
  });

  it('não deve lançar erro de coluna ambígua ao paginar tabelas unidas com JOIN (images + image_versions)', async () => {
    // Insere dados de teste com IDs em ambas as tabelas
    mock.sqlite.exec(`
      INSERT INTO users (id, email, password_hash, created_at, updated_at)
      VALUES ('u1', 'teste@teste.com', 'hash', '2026-10-25T10:00:00Z', '2026-10-25T10:00:00Z');

      INSERT INTO images (id, user_id, title, created_at, expires_at)
      VALUES ('img-1', 'u1', 'Foto 1', '2026-10-25T10:01:00Z', '2026-11-25T10:00:00Z'),
             ('img-2', 'u1', 'Foto 2', '2026-10-25T10:02:00Z', '2026-11-25T10:00:00Z');

      INSERT INTO image_versions (id, image_id, user_id, version_number, kind, r2_key, mime, size_bytes, width, height, created_at, expires_at)
      VALUES ('ver-1', 'img-1', 'u1', 1, 'original', 'u/u1/img-1/v1.jpg', 'image/jpeg', 1000, 800, 600, '2026-10-25T10:01:00Z', '2026-11-25T10:00:00Z'),
             ('ver-2', 'img-2', 'u1', 1, 'original', 'u/u1/img-2/v1.jpg', 'image/jpeg', 2000, 800, 600, '2026-10-25T10:02:00Z', '2026-11-25T10:00:00Z');

      UPDATE images SET current_version_id = 'ver-1' WHERE id = 'img-1';
      UPDATE images SET current_version_id = 'ver-2' WHERE id = 'img-2';
    `);

    // Consulta idêntica à de imageRoutes.get('/')
    const res = await paginate<{ id: string; title: string; r2_key: string }>(mock.d1, {
      table: 'images i LEFT JOIN image_versions v ON v.id = i.current_version_id',
      select: 'i.id, i.title, v.r2_key, i.created_at',
      whereClause: 'i.user_id = ? AND i.deleted_at IS NULL',
      params: ['u1'],
      sortColumn: 'i.created_at',
      order: 'DESC',
      limit: 10,
    });

    expect(res.items).toHaveLength(2);
    expect(res.items[0]?.id).toBe('img-2');
    expect(res.items[1]?.id).toBe('img-1');
  });

  it('deve desambiguar corretamente o ID de usuários em JOIN com perfis e carteiras', async () => {
    mock.sqlite.exec(`
      INSERT INTO users (id, email, password_hash, created_at, updated_at)
      VALUES ('u1', 'user1@teste.com', 'hash', '2026-10-25T10:00:00Z', '2026-10-25T10:00:00Z'),
             ('u2', 'user2@teste.com', 'hash', '2026-10-25T10:05:00Z', '2026-10-25T10:05:00Z');

      INSERT INTO profiles (user_id, full_name, updated_at)
      VALUES ('u1', 'Usuário Um', '2026-10-25T10:00:00Z'),
             ('u2', 'Usuário Dois', '2026-10-25T10:05:00Z');

      INSERT INTO wallets (user_id, purchased_balance, subscription_balance, reserved, version, updated_at)
      VALUES ('u1', 50, 0, 0, 0, '2026-10-25T10:00:00Z'),
             ('u2', 20, 0, 0, 0, '2026-10-25T10:05:00Z');
    `);

    const res = await paginate<{ id: string; email: string; full_name: string }>(mock.d1, {
      table: 'users u LEFT JOIN profiles p ON p.user_id = u.id LEFT JOIN wallets w ON w.user_id = u.id',
      select: 'u.id, u.email, p.full_name, u.created_at',
      whereClause: '1=1',
      sortColumn: 'u.created_at',
      idColumn: 'u.id',
      order: 'DESC',
      limit: 10,
    });

    expect(res.items).toHaveLength(2);
    expect(res.items[0]?.email).toBe('user2@teste.com');
  });
});
