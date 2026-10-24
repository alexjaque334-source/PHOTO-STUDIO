/**
 * ALEGON AI Photo Studio — Auto-inicialização e Auto-migração do D1
 * Dono: Tech Lead
 *
 * Garante que em ambientes Cloudflare novos ou remotos, se as tabelas ainda não existirem,
 * o banco é automaticamente populado com schema, índices, modelos de IA, catálogo de produtos
 * e o super-administrador inicial com 50 créditos na primeira requisição.
 */
import type { Env } from '../env';
import { INITIAL_SCHEMA_SQL } from './schema-bundle';
import { hashPassword } from '../auth/crypto';
import { newId, nowIso } from '../lib/http';

let isMigrated = false;

function cleanAndSplitSql(sql: string): string[] {
  const lines = sql.split('\n');
  const cleanedLines: string[] = [];
  for (const line of lines) {
    const noComment = line.replace(/--.*$/, '').trim();
    if (noComment.length === 0 || noComment.toLowerCase().startsWith('pragma')) {
      continue;
    }
    cleanedLines.push(noComment);
  }
  return cleanedLines
    .join('\n')
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 5);
}

export async function ensureDatabaseSchema(env: Env): Promise<void> {
  if (isMigrated || !env.DB) {
    return;
  }

  const db = env.DB;

  try {
    const existing = await db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
      .first<{ name: string }>();

    if (!existing) {
      console.log('[AutoMigrate] Banco D1 virgem detectado. Executando schema e sementes iniciais...');
      const statements = cleanAndSplitSql(INITIAL_SCHEMA_SQL);
      for (const stmt of statements) {
        try {
          await db.prepare(stmt).run();
        } catch (err) {
          console.warn('[AutoMigrate] Aviso em instrução SQL:', (err as any)?.message);
        }
      }
      console.log('[AutoMigrate] Tabelas principais e sementes criadas com sucesso!');
    }

    // Garante que a tabela de fallback de mídia no D1 existe
    try {
      await db
        .prepare(
          `CREATE TABLE IF NOT EXISTS media_blobs (
            key TEXT PRIMARY KEY,
            bytes BLOB NOT NULL,
            mime TEXT NOT NULL,
            size_bytes INTEGER NOT NULL,
            created_at TEXT NOT NULL
          )`,
        )
        .run();
    } catch {
      // ignora
    }

    // Auto-bootstrap do Super Administrador
    const adminEmail = (env.ADMIN_EMAILS ? env.ADMIN_EMAILS.split(',')[0]!.trim() : 'apacessoria25@gmail.com').toLowerCase();
    const adminPassword = env.ADMIN_PASSWORD || env.ADMIN_INITIAL_PASSWORD || env.PASSWORD || 'Admin@123456';

    const existingAdmin = await db
      .prepare('SELECT id, password_hash FROM users WHERE email = ?')
      .bind(adminEmail)
      .first<{ id: string; password_hash: string }>();

    const now = nowIso();

    if (!existingAdmin) {
      console.log(`[AutoMigrate] Criando conta de Super Administrador para ${adminEmail}...`);
      const userId = newId();
      const passwordHash = await hashPassword(adminPassword);

      await db
        .prepare(
          `INSERT INTO users (id, email, password_hash, email_verified_at, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
        )
        .bind(userId, adminEmail, passwordHash, now, now, now)
        .run();

      await db
        .prepare(
          `INSERT OR REPLACE INTO profiles (user_id, full_name, marketing_opt_in, accepted_terms_version, accepted_terms_at, accepted_privacy_version, accepted_privacy_at, theme, updated_at)
           VALUES (?, 'Administrador ALEGON', 0, 'v1.0', ?, 'v1.0', ?, 'system', ?)`,
        )
        .bind(userId, now, now, now)
        .run();

      await db
        .prepare(`INSERT OR IGNORE INTO user_roles (user_id, role, granted_by, granted_at) VALUES (?, 'user', 'system', ?)`)
        .bind(userId, now)
        .run();

      await db
        .prepare(`INSERT OR IGNORE INTO user_roles (user_id, role, granted_by, granted_at) VALUES (?, 'admin', 'system_bootstrap', ?)`)
        .bind(userId, now)
        .run();

      await db
        .prepare(
          `INSERT OR REPLACE INTO wallets (user_id, purchased_balance, subscription_balance, reserved, version, updated_at)
           VALUES (?, 50, 0, 0, 0, ?)`,
        )
        .bind(userId, now)
        .run();

      const lotId = newId();
      await db
        .prepare(
          `INSERT OR REPLACE INTO credit_lots (id, user_id, bucket, amount_initial, amount_remaining, source_type, source_id, created_at)
           VALUES (?, ?, 'purchased', 50, 50, 'admin_bootstrap', 'system', ?)`,
        )
        .bind(lotId, userId, now)
        .run();

      await db
        .prepare(
          `INSERT INTO credit_transactions (id, user_id, type, bucket, amount, lot_id, reference_type, reference_id, note, created_by, created_at)
           VALUES (?, ?, 'grant_admin', 'purchased', 50, ?, 'admin_bootstrap', 'system', 'Créditos de boas-vindas do Administrador', 'system', ?)`,
        )
        .bind(newId(), userId, lotId, now)
        .run();

      console.log(`[AutoMigrate] Super Administrador ${adminEmail} configurado com sucesso e 50 créditos liberados!`);
    } else if (env.ADMIN_PASSWORD || env.PASSWORD) {
      // Se o usuário configurou uma senha explicitamente via variável, atualiza a senha no banco
      const updatedHash = await hashPassword(adminPassword);
      await db
        .prepare('UPDATE users SET password_hash = ?, failed_login_count = 0, locked_until = NULL, updated_at = ? WHERE id = ?')
        .bind(updatedHash, now, existingAdmin.id)
        .run();

      await db
        .prepare(`INSERT OR IGNORE INTO user_roles (user_id, role, granted_by, granted_at) VALUES (?, 'admin', 'system_bootstrap', ?)`)
        .bind(existingAdmin.id, now)
        .run();

      console.log(`[AutoMigrate] Senha do Super Administrador ${adminEmail} atualizada a partir das variáveis de ambiente!`);
    }

    isMigrated = true;
  } catch (err) {
    console.error('[AutoMigrate] Erro ao verificar ou aplicar schema D1:', err);
  }
}
