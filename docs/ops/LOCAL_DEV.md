# GUIA DE DESENVOLVIMENTO LOCAL
**ALEGON AI Photo Studio — ALEGON Marketing & Tecnologia**

Este guia descreve como executar o ambiente completo de desenvolvimento local da ALEGON AI Photo Studio, incluindo o Worker de API com simulação de D1 e R2 e o servidor de desenvolvimento do frontend Vite.

---

### 1. Pré-Requisitos
* **Node.js:** Versão 20 ou superior (versão 24 LTS recomendada).
* **NPM:** Versão 10 ou 11.
* No Windows com restrição de scripts PowerShell, utilize sempre `npm.cmd` e `npx.cmd`.

---

### 2. Configuração Inicial em Um Comando
Na raiz do projeto (`C:\Users\Alex\.gemini\antigravity\scratch\alegon-ai-photo-studio`), execute o script automatizado de setup:
```bash
node scripts/setup-local.mjs
```
Esse script irá:
1. Criar o arquivo `apps/api/.dev.vars` a partir de `.dev.vars.example` gerando chaves criptográficas aleatórias (`SESSION_SECRET`, `DATA_ENCRYPTION_KEY`).
2. Configurar os identificadores de ambiente e URLs locais.

---

### 3. Aplicação das Migrações no D1 Local
Para criar as tabelas e sementes iniciais no banco SQLite local do D1:
```bash
cd apps/api
npx.cmd wrangler d1 migrations apply alegon-photo-db --local
```
As 5 migrações (`0001_init.sql`, `0010_settings_seed.sql`, `0020_billing_indexes.sql`, `0030_models_seed.sql`, `0050_catalog_seed.sql`) serão aplicadas em sequência.

---

### 4. Executando os Servidores de Desenvolvimento

O projeto foi projetado para rodar com duas instâncias locais comunicando-se perfeitamente:
1. **API Backend (Cloudflare Worker via Wrangler na porta 8787):**
   ```bash
   cd apps/api
   npx.cmd wrangler dev --port 8787
   ```
2. **Frontend SPA (Vite na porta 5173 com proxy reverso automático para `/api`):**
   ```bash
   cd apps/web
   npx.cmd vite
   ```

Acesse no navegador: **`http://localhost:5173`**
As requisições para `/api/*` serão redirecionadas automaticamente pelo proxy do Vite para `http://127.0.0.1:8787`.

---

### 5. Simulação de Webhook Asaas Localmente
Para testar a confirmação de pagamentos Pix ou cartão sem depender de requisição externa do Asaas:
```bash
curl.exe -X POST http://localhost:8787/api/webhooks/asaas `
  -H "Content-Type: application/json" `
  -H "asaas-access-token: webhook_token_local_dev" `
  -d '{\"id\": \"evt_teste_123\", \"event\": \"PAYMENT_RECEIVED\", \"payment\": {\"id\": \"pay_123\", \"customer\": \"cus_123\", \"value\": 19.9, \"status\": \"RECEIVED\"}}'
```

---

### 6. Como Criar um Usuário Administrador Local
Para promover um usuário a administrador e testar o painel restrito `/admin`:
```bash
node scripts/make-admin.mjs seu-email@exemplo.com
```
