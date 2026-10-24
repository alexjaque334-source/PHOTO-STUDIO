#!/usr/bin/env node
/**
 * Varredura preventiva de segredos e credenciais no repositório.
 * Falha com código 1 caso encontre padrões de chaves sensíveis fora de arquivos .example.
 */
import fs from 'fs';
import path from 'path';

const SUSPICIOUS_PATTERNS = [
  /sk-or-v1-[a-f0-9]{64}/i,
  /\$aact_[A-Za-z0-9_-]{30,}/i,
  /re_[A-Za-z0-9_-]{24,}/i,
  /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/,
];

const IGNORED_PATHS = [
  'node_modules',
  '.git',
  '.dev.vars',
  '.dev.vars.example',
  '.env',
  '.env.example',
  'dist',
  'package-lock.json',
];

let violations = 0;

function scanDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(process.cwd(), fullPath);

    if (IGNORED_PATHS.some((ignored) => relPath.includes(ignored))) {
      continue;
    }

    if (entry.isDirectory()) {
      scanDir(fullPath);
    } else if (entry.isFile()) {
      try {
        const content = fs.readFileSync(fullPath, 'utf-8');
        for (const pattern of SUSPICIOUS_PATTERNS) {
          if (pattern.test(content)) {
            console.error(`[ALERTA DE SEGURANÇA] Padrão sensível detectado em: ${relPath}`);
            violations++;
          }
        }
      } catch {
        // Ignora binários que não abrem em utf-8
      }
    }
  }
}

console.log('Iniciando varredura preventiva de segredos...');
scanDir(process.cwd());

if (violations > 0) {
  console.error(`Varredura falhou: ${violations} violação(ões) encontrada(s)!`);
  process.exit(1);
} else {
  console.log('Varredura concluída com sucesso: nenhum segredo vazado no código.');
  process.exit(0);
}
