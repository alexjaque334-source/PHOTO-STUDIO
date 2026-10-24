# OBSERVABILIDADE, LOGS ESTRUTURADOS E ALERTAS
**ALEGON AI Photo Studio — ALEGON Marketing & Tecnologia**

Este documento detalha o sistema de observabilidade, métricas em tempo real e regras de alerta para garantir estabilidade contínua na ALEGON AI Photo Studio.

---

### 1. Formato de Logs Estruturados (JSON)
Em todas as operações da API e consumidores de fila, o Worker gera logs em JSON estruturado com os seguintes campos padronizados:
```json
{
  "level": "info",
  "msg": "Edição concluída com sucesso",
  "ts": "2026-10-24T14:10:00.000Z",
  "requestId": "cf-ray-1234567890",
  "userId": "usr_0192a8b3-c1d4-7ef0-a1b2-c3d4e5f6a7b8",
  "jobId": "job_0192a8b3-c1d4-7ef0-a1b2-c3d4e5f6a7b9",
  "modelId": "google/gemini-2.5-flash-image",
  "latencyMs": 3420,
  "costUsdMicros": 18500
}
```
**Regra de Redação:** Informações confidenciais como senhas, tokens de sessão, números de cartão e CPFs completos são automaticamente filtradas e jamais aparecem nos logs.

---

### 2. Painel de Métricas e Consultas do Administrador
O painel administrativo (`/admin`) consome métricas diretamente do D1:
* **Taxa de Sucesso de IA:** `%` de jobs com status `succeeded` versus `failed`.
* **Custo Médio por Imagem:** Somatório de `cost_usd_micros` dividido pelo total de edições geradas.
* **Margem de Contribuição Operacional:** Faturamento Asaas deduzido de taxas e custos de API.
* **Volume de Armazenamento:** Total de bytes ativos em `image_versions`.

---

### 3. Alertas Críticos Recomendados

| Cenário de Alerta | Limiar de Disparo | Ação Imediata |
|---|---|---|
| **Taxa de Falhas de IA Alta** | > 10% de erros em janela de 15 minutos | Verificar status do OpenRouter e ativar modelo de fallback no tier. |
| **Mensagens em Dead Letter Queue (DLQ)** | Mensagens na fila DLQ > 0 | Investigar erro irrecuperável de edição ou payload malformado de webhook. |
| **Falha de Autenticação em Webhooks** | > 5 rejeições com HTTP 401 | Investigar possível ataque de spoofing ou dessincronização de token Asaas. |
| **Custo Diário de IA Próximo do Limite** | Custo acumulado do dia > 80% do teto configurado | Notificar equipe de gestão para reajuste temporário de orçamento diário. |
