#!/usr/bin/env node
/**
 * Realiza export/backup local do banco D1 em arquivo SQL carimbado com data/hora.
 * Uso: node scripts/backup-d1.mjs
 */
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const backupsDir = path.resolve('./backups');
if (!fs.existsSync(backupsDir)) {
  fs.mkdirSync(backupsDir, { recursive: true });
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const outputFile = path.join(backupsDir, `d1-backup-local-${timestamp}.sql`);

console.log(`Iniciando backup local do Cloudflare D1 para: ${outputFile}...`);

try {
  const output = execSync(
    `npx.cmd wrangler d1 export alegon-photo-db --local --output="${outputFile}"`,
    { cwd: './apps/api', encoding: 'utf-8' }
  );
  console.log(output);
  console.log(`Backup concluído com sucesso: ${outputFile}`);
} catch (err) {
  console.error('Falha no backup do D1:', err.message);
  process.exit(1);
}
