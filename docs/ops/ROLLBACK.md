# PROCEDIMENTOS DE ROLLBACK E COMPATIBILIDADE DE MIGRAÇÕES
**ALEGON AI Photo Studio — ALEGON Marketing & Tecnologia**

Este documento detalha o protocolo seguro de reversão (*rollback*) de deploys e a estratégia de compatibilidade retroativa de banco de dados.

---

### 1. Reversão Instantânea de Código (Workers Deployments)
O Cloudflare Workers mantém histórico imutável de todas as versões publicadas. Caso uma nova versão apresente anomalias em produção, a reversão pode ser executada instantaneamente via Wrangler:
```bash
# Lista as versões recentes
npx wrangler deployments list

# Reverte instantaneamente para uma versão estável anterior
npx wrangler rollback [DEPLOYMENT_ID]
```
O tempo de propagação global da reversão no Workers é de **menos de 5 segundos**.

---

### 2. Regra de Ouro para Migrações de Banco (Compatibilidade Retroativa)
Para permitir rollbacks seguros sem quebrar o banco de dados, todas as migrações SQL no D1 seguem o princípio de **duas fases (Expand / Contract)**:
1. **Fase de Expansão:** Novas colunas ou tabelas devem ser opcionais (`NULL` ou com `DEFAULT`), nunca `NOT NULL` sem default. Novas versões de código escrevem tanto no formato antigo quanto no novo.
2. **Fase de Contração:** A remoção de colunas antigas só ocorre após a nova versão estar estabilizada há pelo menos 7 dias em produção.

---

### 3. Procedimento Operacional Padrão de Rollback
1. Identificar alerta crítico nos dashboards de observabilidade.
2. Executar `wrangler rollback` para a versão imediatamente anterior.
3. Testar a rota de saúde `/api/health` e o fluxo de login.
4. Notificar a equipe de engenharia e iniciar investigação em ambiente de desenvolvimento local.
