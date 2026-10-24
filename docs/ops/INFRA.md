# PROVISIONAMENTO DE INFRAESTRUTURA CLOUDFLARE
**ALEGON AI Photo Studio — ALEGON Marketing & Tecnologia**

Este documento detalha os recursos que devem ser criados na conta Cloudflare quando houver autorização para publicação em ambiente de **Staging** ou **Produção**.

---

### 1. Lista de Recursos Cloudflare Necessários

| Recurso | Tipo | Nome Recomendado (Produção) | Nome Recomendado (Staging) |
|---|---|---|---|
| **D1 Database** | Banco SQL Distribuído | `alegon-photo-db-prod` | `alegon-photo-db-staging` |
| **R2 Bucket** | Armazenamento de Objetos Privado | `alegon-photo-media-prod` | `alegon-photo-media-staging` |
| **Queue** | Fila Assíncrona de Edições | `alegon-edit-jobs-prod` | `alegon-edit-jobs-staging` |
| **Queue (DLQ)** | Dead Letter Queue de Edições | `alegon-edit-jobs-dlq-prod` | `alegon-edit-jobs-dlq-staging` |
| **Queue** | Fila Assíncrona de Webhooks | `alegon-asaas-webhooks-prod` | `alegon-asaas-webhooks-staging` |
| **Queue (DLQ)** | Dead Letter Queue de Webhooks | `alegon-asaas-webhooks-dlq-prod` | `alegon-asaas-webhooks-dlq-staging` |

---

### 2. Comandos de Criação via Wrangler CLI

Quando autorizado pelo cliente, execute:

```bash
# 1. Criação dos Bancos D1
npx wrangler d1 create alegon-photo-db-prod
# (Copie o database_id retornado para o wrangler.toml)

# 2. Criação dos Buckets R2
npx wrangler r2 bucket create alegon-photo-media-prod
# (Certifique-se de que o bucket permaneça PRIVADO, sem domínio público)

# 3. Configuração do Ciclo de Vida do R2 (Rede de segurança para 95 dias)
npx wrangler r2 bucket lifecycle set alegon-photo-media-prod --expire-days 95

# 4. Criação das Filas Cloudflare Queues
npx wrangler queues create alegon-edit-jobs-prod
npx wrangler queues create alegon-edit-jobs-dlq-prod
npx wrangler queues create alegon-asaas-webhooks-prod
npx wrangler queues create alegon-asaas-webhooks-dlq-prod

# 5. Aplicação das Migrações no D1 Remoto
npx wrangler d1 migrations apply alegon-photo-db-prod --remote
```

---

### 3. Configuração de Segredos Remotos

Defina os segredos no Cloudflare Worker sem nunca expô-los em arquivos de texto:
```bash
npx wrangler secret put OPENROUTER_API_KEY
npx wrangler secret put ASAAS_API_KEY
npx wrangler secret put ASAAS_WEBHOOK_TOKEN
npx wrangler secret put SESSION_SECRET
npx wrangler secret put DATA_ENCRYPTION_KEY
npx wrangler secret put RESEND_API_KEY
```
