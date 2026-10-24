# CHECKLIST DE HOMOLOGAÇÃO E LANÇAMENTO EM PRODUÇÃO
**ALEGON AI Photo Studio — ALEGON Marketing & Tecnologia**

Antes de qualquer publicação em ambiente de produção com cobranças reais, todos os itens abaixo devem estar verificados e aprovados:

---

### 1. Segurança e Segredos
- [ ] O arquivo `.dev.vars` **não** está versionado no Git.
- [ ] Todos os segredos de produção foram injetados exclusivamente via `wrangler secret put`.
- [ ] `SESSION_SECRET` e `DATA_ENCRYPTION_KEY` foram gerados com 32 bytes criptográficos aleatórios.
- [ ] Chave de produção do Asaas foi configurada apenas após validação completa em Sandbox.
- [ ] Token de Webhook Asaas (`ASAAS_WEBHOOK_TOKEN`) está sincronizado entre o painel Asaas e o Worker.
- [ ] O bucket R2 de produção está estritamente **privado** (sem acesso público habilitado).
- [ ] O bucket R2 possui regra de ciclo de vida configurada para 95 dias.

---

### 2. Banco de Dados e Faturamento
- [ ] Todas as migrações D1 foram aplicadas com sucesso no banco remoto (`wrangler d1 migrations apply ... --remote`).
- [ ] Catálogo de preços e planos foi validado em `products` e `plans`.
- [ ] Teto diário de orçamento de IA configurado em `system_settings` (`limits.global_daily_ai_budget_usd`).
- [ ] Webhook Asaas testado com entrega de evento `PAYMENT_RECEIVED` e concessão de créditos validada.
- [ ] Proteção contra cobrança duplicada testada e homologada.

---

### 3. Experiência do Usuário e Frontend
- [ ] Build de produção do SPA (`vite build`) executado sem erros ou avisos críticos.
- [ ] Fluxo de upload e edição testado em dispositivo móvel real (captura via câmera e galeria).
- [ ] Visualizador interativo antes/depois testado com mouse e toque.
- [ ] Conversão de download (PNG, JPG, WebP) testada no navegador.
- [ ] Termos de Uso e Política de Privacidade publicados e acessíveis no rodapé e no cadastro.
- [ ] Painel administrativo protegido por MFA TOTP obrigatório.

---

### 4. Observabilidade e Monitoramento
- [ ] Logs estruturados habilitados no Cloudflare Workers (`observability.enabled = true`).
- [ ] Alertas de Dead Letter Queue (DLQ) configurados.
- [ ] Canal de contato do DPO (`privacidade@alegon.com.br`) ativo e monitorado.
