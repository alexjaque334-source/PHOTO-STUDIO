# GESTÃO DE SEGREDOS E POLÍTICA DE CHAVES
**ALEGON AI Photo Studio — ALEGON Marketing & Tecnologia**

Este documento detalha o inventário de segredos criptográficos, chaves de API, procedimentos de provisionamento e rotina de rotação de credenciais da ALEGON AI Photo Studio.

---

### 1. Inventário de Segredos

| Identificador | Local de Armazenamento | Finalidade | Nível de Sensibilidade | Política de Rotação |
|---|---|---|---|---|
| `SESSION_SECRET` | Secret do Worker (`.dev.vars` / Cloudflare Secret) | Assinatura HMAC de tokens de sessão, URLs assinadas de imagem R2 e hashes de IP. | **Crítico** | Anual ou imediato em caso de suspeita de comprometimento. |
| `DATA_ENCRYPTION_KEY` | Secret do Worker (Base64 de 32 bytes) | Chave simétrica AES-256-GCM para criptografia de segredos MFA e dados confidenciais no D1. | **Crítico** | Requer migração de dados cifrados no D1. |
| `OPENROUTER_API_KEY` | Secret do Worker | Autenticação no gateway de inteligência artificial OpenRouter. | **Alto** | Semestral ou imediato via painel OpenRouter. |
| `ASAAS_API_KEY` | Secret do Worker | Chave de autorização da API Asaas (Sandbox ou Produção). | **Alto** | Semestral ou imediato via painel Asaas. |
| `ASAAS_WEBHOOK_TOKEN` | Secret do Worker | Token estático conferido no cabeçalho `asaas-access-token` das notificações de webhook. | **Alto** | Semestral junto à configuração do webhook no Asaas. |
| `RESEND_API_KEY` | Secret do Worker | Envio de e-mails transacionais (confirmação, redefinição de senha). | **Médio** | Anual via painel Resend. |

---

### 2. Regras Invioláveis de Segurança
1. **Nenhum Segredo no Frontend:** O código-fonte do cliente (React SPA) **jamais** recebe, embute ou faz referência a chaves secretas do Asaas, OpenRouter ou chaves criptográficas.
2. **Proibição de Commit em Repositório:** O arquivo `.dev.vars` e qualquer arquivo de ambiente `.env` estão explicitamente bloqueados no `.gitignore`.
3. **Varredura Preventiva de Código:** O script `scripts/check-secrets.mjs` é executado na pipeline de integração contínua (CI) para detectar acidentalmente padrões de chaves conhecidas (`sk-or-`, `aact_`, etc.).
4. **Geração Criptograficamente Segura:** Chaves simétricas e segredos de HMAC devem ser gerados com geradores pseudo-aleatórios criptograficamente seguros (CSPRNG):
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```
