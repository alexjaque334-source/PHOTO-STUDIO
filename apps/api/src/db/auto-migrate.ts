/**
 * ALEGON AI Photo Studio — Auto-inicialização e Auto-migração do D1
 * Dono: Tech Lead
 *
 * Garante que em ambientes Cloudflare novos ou remotos, se as tabelas ainda não existirem,
 * o banco é automaticamente populado com schema, índices, modelos de IA e catálogo de produtos
 * na primeira requisição, sem necessidade de rodar comandos manuais via CLI.
 */
import type { D1Database } from '@cloudflare/workers-types';
import { INITIAL_SCHEMA_SQL } from './schema-bundle';

let isMigrated = false;

export async function ensureDatabaseSchema(db: D1Database): Promise<void> {
  if (isMigrated) {
    return;
  }

  try {
    const existing = await db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
      .first<{ name: string }>();

    if (!existing) {
      console.log('[AutoMigrate] Banco D1 virgem detectado. Aplicando schema e sementes iniciais...');
      await db.exec(INITIAL_SCHEMA_SQL);
      console.log('[AutoMigrate] Schema inicial, configurações, modelos de IA e catálogo aplicados com sucesso!');
    }

    isMigrated = true;
  } catch (err) {
    console.error('[AutoMigrate] Erro ao verificar ou aplicar schema D1:', err);
    // Não trava a requisição se falhar a verificação leve
  }
}
