#!/usr/bin/env node
/**
 * ALEGON AI Photo Studio — Local Environment Setup Script
 * Dono: Subagente Cloudflare / DevOps
 * 
 * Configura o ambiente de desenvolvimento local:
 * 1. Gera apps/api/.dev.vars com chaves criptográficas seguras (WebCrypto / AES-256 / HMAC)
 * 2. Executa as migrações D1 localmente usando wrangler
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';
import { spawnSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..');
const apiDir = resolve(rootDir, 'apps', 'api');

console.log('[INFO] ALEGON AI Photo Studio - Configuração do Ambiente Local');
console.log('===============================================================');

// 1. Gerenciamento do arquivo .dev.vars
const devVarsExamplePath = resolve(apiDir, '.dev.vars.example');
const devVarsPath = resolve(apiDir, '.dev.vars');

if (!existsSync(devVarsExamplePath)) {
  console.error(`[ERROR] Arquivo de exemplo não encontrado: ${devVarsExamplePath}`);
  process.exit(1);
}

const shouldOverwrite = process.argv.includes('--force');

if (existsSync(devVarsPath) && !shouldOverwrite) {
  console.log('[INFO] apps/api/.dev.vars já existe. Mantendo configurações existentes.');
  console.log('       (Use --force para sobrescrever e regerar chaves criptográficas)');
} else {
  console.log('[INFO] Gerando apps/api/.dev.vars com chaves criptográficas seguras...');
  let content = readFileSync(devVarsExamplePath, 'utf-8');

  // Chaves criptográficas seguras
  const sessionSecret = randomBytes(32).toString('hex');
  const dataEncryptionKey = randomBytes(32).toString('base64');
  const webhookToken = randomBytes(24).toString('hex');

  content = content.replace(
    'replace_with_64_character_hex_random_string_min_32_bytes',
    sessionSecret
  );
  content = content.replace(
    'replace_with_44_character_base64_string_32_bytes_aes_key',
    dataEncryptionKey
  );
  content = content.replace(
    'replace_with_secure_webhook_token_for_asaas',
    webhookToken
  );

  writeFileSync(devVarsPath, content, 'utf-8');
  console.log('[OK] apps/api/.dev.vars criado com sucesso!');
  console.log('     - SESSION_SECRET gerado (HMAC 256-bit)');
  console.log('     - DATA_ENCRYPTION_KEY gerado (AES-256 Base64)');
  console.log('     - ASAAS_WEBHOOK_TOKEN gerado');
  console.log('[WARN] Para utilizar OpenRouter e Asaas, configure suas credenciais de sandbox em apps/api/.dev.vars');
}

// 2. Execução das migrações do D1 local
console.log('\n[INFO] Aplicando migrações no banco local D1 (alegon-photo-db)...');

const isWindows = process.platform === 'win32';
const npxCmd = isWindows ? 'npx.cmd' : 'npx';

const migrationResult = spawnSync(
  npxCmd,
  ['wrangler', 'd1', 'migrations', 'apply', 'alegon-photo-db', '--local'],
  {
    cwd: apiDir,
    stdio: 'inherit',
    shell: true,
  }
);

if (migrationResult.status !== 0) {
  console.error('[ERROR] Falha ao aplicar migrações locais do D1.');
  process.exit(migrationResult.status ?? 1);
}

console.log('\n[OK] Migrações locais aplicadas com sucesso!');
console.log('===============================================================');
console.log('[INFO] Próximos passos para iniciar:');
console.log('       1. Terminal 1: npm run dev:api   (Inicia API Cloudflare Worker na porta 8787)');
console.log('       2. Terminal 2: npm run dev:web   (Inicia Vite Dev Server na porta 5173)');
console.log('===============================================================');
