import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const webDir = path.join(rootDir, 'apps', 'web');
const webDist = path.join(webDir, 'dist');
const rootDist = path.join(rootDir, 'dist');

console.log('🚀 [Build] Iniciando compilação do Photo Studio AI...');

// 1. Build do SPA React com Vite
console.log('📦 [Build] Compilando front-end (apps/web)...');
execSync('npm run build -w apps/web', { cwd: rootDir, stdio: 'inherit' });

// 2. Build do Worker Fullstack (_worker.js) para Cloudflare Pages e Workers
console.log('⚡ [Build] Empacotando backend Worker (_worker.js)...');
const esbuildCmd = `npx esbuild apps/api/src/index.ts --bundle --format=esm --platform=neutral --target=es2022 --outfile=apps/web/dist/_worker.js`;
execSync(esbuildCmd, { cwd: rootDir, stdio: 'inherit' });

// 3. Cria _routes.json para Cloudflare Pages rotear /api/* e deixar assets estáticos
const routesJson = {
  version: 1,
  include: ['/*'],
  exclude: ['/assets/*', '/favicon.ico', '/robots.txt', '/vite.svg']
};
fs.writeFileSync(path.join(webDist, '_routes.json'), JSON.stringify(routesJson, null, 2));
console.log('🗺️ [Build] _routes.json gerado com sucesso.');

// 4. Cria .assetsignore para evitar que o Cloudflare Wrangler bloqueie o upload de assets com erro de _worker.js
const assetsIgnoreContent = '_worker.js\n_routes.json\n';
fs.writeFileSync(path.join(webDist, '.assetsignore'), assetsIgnoreContent);
console.log('🛡️ [Build] .assetsignore criado com sucesso para o Cloudflare Wrangler.');

// 5. Copia apps/web/dist para dist na raiz para compatibilidade universal com Cloudflare Pages
console.log('📂 [Build] Sincronizando saída para dist/ na raiz...');
if (fs.existsSync(rootDist)) {
  fs.rmSync(rootDist, { recursive: true, force: true });
}
fs.cpSync(webDist, rootDist, { recursive: true });

console.log('✅ [Build] Build finalizado com sucesso! Pronto para Cloudflare Pages & Workers.');
