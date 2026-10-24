# POLÍTICA DE BACKUP, RECUPERAÇÃO DE DESASTRES E RPO/RTO
**ALEGON AI Photo Studio — ALEGON Marketing & Tecnologia**

Este documento formaliza os procedimentos de salvaguarda de dados, cópias de segurança e recuperação operacional em cenários de falha.

---

### 1. Métricas de Resiliência
* **RPO (Recovery Point Objective):** Menor que **5 minutos** para transações financeiras e metadados estruturados.
* **RTO (Recovery Time Objective):** Menor que **30 minutos** para restauração completa da operação do SaaS.

---

### 2. Estratégia de Backup

#### 2.1 Banco de Metadados e Ledger (Cloudflare D1)
1. **Time Travel Nativo do D1:** O Cloudflare D1 mantém histórico contínuo de transações com capacidade de restauração pontual (*Point-in-Time Recovery*) para qualquer instante dos últimos 30 dias.
   ```bash
   # Restauração para timestamp específico em caso de desastre
   npx wrangler d1 time-travel restore alegon-photo-db-prod --timestamp="2026-10-24T10:00:00Z"
   ```
2. **Exportação Periódica de Segurança:** Script automatizado de despejo SQL (`scripts/backup-d1.mjs`) exportando o esquema e transações para armazenamento secundário criptografado.

#### 2.2 Imagens e Mídia (Cloudflare R2)
- O Cloudflare R2 conta com tripla replicação geográfica em múltiplos data centers para proteger contra falhas de hardware ou indisponibilidade regional.
- Como as imagens possuem ciclo de vida efêmero de 90 dias, o foco principal é a integridade durante o período ativo.

---

### 3. Procedimento de Restauração em Caso de Desastre
1. **Validação da Falha:** Identificar se o problema é corrupção de dados ou falha de aplicação.
2. **Congelamento Temporário:** Ativar página de manutenção no Cloudflare WAF se houver risco de corrupção contínua.
3. **Execução do Time Travel:** Restaurar o banco D1 para o carimbo de data/hora imediatamente anterior à ocorrência.
4. **Verificação de Consistência:** Executar query de integridade na tabela `wallets` e `credit_transactions`.
5. **Reabertura do Tráfego:** Liberar o acesso e monitorar a taxa de erros.
