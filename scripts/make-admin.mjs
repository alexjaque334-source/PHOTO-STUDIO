#!/usr/bin/env node
/**
 * Promove um usuário existente ao papel de 'admin' no banco D1 local.
 * Uso: node scripts/make-admin.mjs seu-email@exemplo.com
 */
import { execSync } from 'child_process';

const email = process.argv[2];
if (!email) {
  console.error('Uso: node scripts/make-admin.mjs <email>');
  process.exit(1);
}

console.log(`Promovendo ${email} a administrador no banco D1 local...`);

const sql = `
INSERT OR IGNORE INTO user_roles (user_id, role, granted_by, granted_at)
SELECT id, 'admin', 'system_script', datetime('now')
FROM users WHERE email = '${email.trim().toLowerCase()}';
`;

try {
  const result = execSync(
    `npx.cmd wrangler d1 execute alegon-photo-db --local --command="${sql.replace(/"/g, '\\"')}"`,
    { cwd: './apps/api', encoding: 'utf-8' }
  );
  console.log(result);
  console.log(`Sucesso: Usuário ${email} agora possui a role 'admin'!`);
} catch (err) {
  console.error('Erro ao executar promoção:', err.message);
  process.exit(1);
}
