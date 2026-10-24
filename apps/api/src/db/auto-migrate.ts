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

    // Garante tabela de feedbacks dos clientes
    try {
      await db
        .prepare(
          `CREATE TABLE IF NOT EXISTS customer_feedbacks (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            user_email TEXT NOT NULL,
            user_name TEXT,
            rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
            category TEXT NOT NULL DEFAULT 'geral',
            message TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'novo',
            created_at TEXT NOT NULL
          )`,
        )
        .run();

      const existingFeedback = await db
        .prepare('SELECT COUNT(id) as count FROM customer_feedbacks')
        .first<{ count: number }>();

      if (!existingFeedback || existingFeedback.count === 0) {
        const nowInit = nowIso();
        await db
          .prepare(
            `INSERT INTO customer_feedbacks (id, user_email, user_name, rating, category, message, status, created_at)
             VALUES 
             (?, 'juliana.fotografia@gmail.com', 'Juliana Rios', 5, 'qualidade_ia', 'A restauração de fotos antigas com o Imagen 3 ficou simplesmente espetacular! Clientes elogiaram muito.', 'novo', ?),
             (?, 'marcos.ecommerce@lojas.com.br', 'Marcos Vinicius', 4, 'velocidade', 'Gostei muito da rapidez do Gemini Flash para remover fundos em lote. Podia ter mais opções de cores sólidas.', 'lido', ?),
             (?, 'clara.design@estudio.art', 'Clara Mendes', 5, 'sugestao', 'O plano Studio de 150 créditos vale cada centavo. Excelente interface escura e muito intuitiva.', 'novo', ?)`,
          )
          .bind(newId(), nowInit, newId(), nowInit, newId(), nowInit)
          .run();
      }
    } catch {
      // ignora se já criada
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
           VALUES (?, 'Administrador Photo Studio AI', 0, 'v1.0', ?, 'v1.0', ?, 'system', ?)`,
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
    } else {
      // Garante SEMPRE a role 'admin', status ativo e email verificado para o Super Administrador
      await db
        .prepare(`INSERT OR IGNORE INTO user_roles (user_id, role, granted_by, granted_at) VALUES (?, 'admin', 'system_bootstrap', ?)`)
        .bind(existingAdmin.id, now)
        .run();

      await db
        .prepare(`UPDATE users SET email_verified_at = COALESCE(email_verified_at, ?), status = 'active' WHERE id = ?`)
        .bind(now, existingAdmin.id)
        .run();

      if (env.ADMIN_PASSWORD || env.PASSWORD) {
        // Se o usuário configurou uma senha explicitamente via variável, atualiza a senha no banco
        const updatedHash = await hashPassword(adminPassword);
        await db
          .prepare('UPDATE users SET password_hash = ?, failed_login_count = 0, locked_until = NULL, updated_at = ? WHERE id = ?')
          .bind(updatedHash, now, existingAdmin.id)
          .run();

        console.log(`[AutoMigrate] Senha do Super Administrador ${adminEmail} atualizada a partir das variáveis de ambiente!`);
      }
    }

    // Auto-bootstrap da conta de usuário solicitada (exemplo25@gmail.com)
    const clientUserEmail = 'exemplo25@gmail.com';
    const clientUserPassword = 'User@123456';

    const existingClient = await db
      .prepare('SELECT id FROM users WHERE email = ?')
      .bind(clientUserEmail)
      .first<{ id: string }>();

    if (!existingClient) {
      console.log(`[AutoMigrate] Criando conta de usuário para ${clientUserEmail}...`);
      const clientUserId = newId();
      const clientHash = await hashPassword(clientUserPassword);

      await db
        .prepare(
          `INSERT INTO users (id, email, password_hash, email_verified_at, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
        )
        .bind(clientUserId, clientUserEmail, clientHash, now, now, now)
        .run();

      await db
        .prepare(
          `INSERT OR REPLACE INTO profiles (user_id, full_name, marketing_opt_in, accepted_terms_version, accepted_terms_at, accepted_privacy_version, accepted_privacy_at, theme, updated_at)
           VALUES (?, 'Usuário Photo Studio AI', 0, 'v1.0', ?, 'v1.0', ?, 'system', ?)`,
        )
        .bind(clientUserId, now, now, now)
        .run();

      await db
        .prepare(`INSERT OR IGNORE INTO user_roles (user_id, role, granted_by, granted_at) VALUES (?, 'user', 'system', ?)`)
        .bind(clientUserId, now)
        .run();

      await db
        .prepare(
          `INSERT OR REPLACE INTO wallets (user_id, purchased_balance, subscription_balance, reserved, version, updated_at)
           VALUES (?, 50, 0, 0, 0, ?)`,
        )
        .bind(clientUserId, now)
        .run();

      const clientLotId = newId();
      await db
        .prepare(
          `INSERT OR REPLACE INTO credit_lots (id, user_id, bucket, amount_initial, amount_remaining, source_type, source_id, created_at)
           VALUES (?, ?, 'purchased', 50, 50, 'user_bootstrap', 'system', ?)`,
        )
        .bind(clientLotId, clientUserId, now)
        .run();

      await db
        .prepare(
          `INSERT INTO credit_transactions (id, user_id, type, bucket, amount, lot_id, reference_type, reference_id, note, created_by, created_at)
           VALUES (?, ?, 'grant_admin', 'purchased', 50, ?, 'user_bootstrap', 'system', 'Créditos concedidos da conta de usuário', 'system', ?)`,
        )
        .bind(newId(), clientUserId, clientLotId, now)
        .run();

      console.log(`[AutoMigrate] Conta de usuário ${clientUserEmail} configurada com sucesso e 50 créditos liberados!`);
    } else {
      await db
        .prepare('UPDATE wallets SET purchased_balance = MAX(purchased_balance, 50), updated_at = ? WHERE user_id = ?')
        .bind(now, existingClient.id)
        .run();
    }

    isMigrated = true;
  } catch (err) {
    console.error('[AutoMigrate] Erro ao verificar ou aplicar schema D1:', err);
  }
}
