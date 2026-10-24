# ALEGON AI Photo Studio — Catálogo de KPIs e Métricas Financeiras

> **Documento Canônico de Métricas e BI Executivo**  
> **Dono:** Especialista Financeiro SaaS (Subagente 9)  
> **Data:** 24/10/2026  
> **Versão:** 1.0.0  
> **Destino:** Painel Administrativo (`/admin/finance/summary`, `/admin/metrics`)  

---

## 1. Visão Geral

Este documento define formalmente os **Indicadores-Chave de Desempenho (KPIs)** da ALEGON AI Photo Studio, incluindo fórmulas matemáticas, objetivos de referência (*benchmarks*), lógica de agregação e **consultas SQL prontas para o Cloudflare D1 (SQLite)**.

As métricas são divididas em quatro categorias essenciais:
1. **Receita e Recorrência (SaaS)**
2. **Eficiência de Aquisição e Valor de Vida (Unit Economics)**
3. **Consumo e Queima de Créditos (AI & Tokenomics)**
4. **Risco, Retenção e Inadimplência (Billing & Churn)**

---

## 2. Métricas de Receita e Recorrência

### 2.1 MRR (Monthly Recurring Revenue) & ARR

#### Definição
O **MRR** mede a receita contratual recorrente normalizada para um período de 30 dias gerada pelas assinaturas ativas na plataforma. Exclui pagamentos avulsos de pacotes de crédito. O **ARR** anualiza essa receita recorrente.

#### Fórmulas Matemáticas
$$MRR = \sum_{i=1}^{N_{active}} \frac{\text{PreçoPlanoCents}_i}{100}$$

$$ARR = MRR \times 12$$

#### Meta / Benchmark ALEGON
- **MRR Inicial (M6):** ≥ R$ 25.000,00  
- **MRR de Escala (M12):** ≥ R$ 90.000,00  
- **Crescimento Mensal:** 10% a 25% m/m

#### Consulta SQL (Cloudflare D1)
```sql
-- MRR atual em Reais (assinaturas ativas no ciclo corrente)
SELECT 
  COUNT(s.id) AS total_active_subscriptions,
  ROUND(SUM(s.price_cents) / 100.0, 2) AS mrr_brl,
  ROUND((SUM(s.price_cents) / 100.0) * 12, 2) AS arr_brl
FROM subscriptions s
WHERE s.status = 'active'
  AND s.current_period_end > datetime('now');
```

---

### 2.2 ARPU (Average Revenue Per User) e ARPPU (Per Paying User)

#### Definição
- **ARPU:** Receita total gerada no período dividida pela base total de usuários ativos cadastrados.
- **ARPPU:** Receita total gerada dividida apenas pelos clientes que realizaram pagamentos no período (avulsos ou assinantes).

#### Fórmulas Matemáticas
$$ARPU = \frac{\text{Receita Total Bruta}}{\text{Total de Usuários Ativos no Período}}$$

$$ARPPU = \frac{\text{Receita Total Bruta}}{\text{Total de Usuários Pagantes Únicos}}$$

#### Meta / Benchmark ALEGON
- **ARPU:** R$ 5,00 a R$ 15,00  
- **ARPPU:** R$ 35,00 a R$ 55,00  

#### Consulta SQL (Cloudflare D1)
```sql
-- ARPU e ARPPU dos últimos 30 dias
WITH period_revenue AS (
  SELECT 
    SUM(value_cents) / 100.0 AS gross_revenue_brl,
    COUNT(DISTINCT user_id) AS paying_users
  FROM asaas_payments
  WHERE status IN ('RECEIVED', 'CONFIRMED')
    AND paid_at >= datetime('now', '-30 days')
),
active_users AS (
  SELECT COUNT(DISTINCT id) AS total_users
  FROM users
  WHERE status = 'active'
    AND last_login_at >= datetime('now', '-30 days')
)
SELECT 
  ROUND(gross_revenue_brl, 2) AS receita_bruta_30d,
  paying_users AS usuarios_pagantes_30d,
  total_users AS usuarios_ativos_30d,
  ROUND(gross_revenue_brl / MAX(total_users, 1), 2) AS arpu_brl,
  ROUND(gross_revenue_brl / MAX(paying_users, 1), 2) AS arppu_brl
FROM period_revenue, active_users;
```

---

## 3. Eficiência de Aquisição e Valor de Vida (Unit Economics)

### 3.1 LTV Estimado (Lifetime Value)

#### Definição
Mede o valor financeiro líquido médio que um cliente gera durante todo o seu ciclo de relacionamento com a ALEGON, descontando a margem de contribuição variável.

#### Fórmulas Matemáticas
Para assinantes recorrentes:
$$LTV_{sub} = \frac{ARPU_{sub} \times \text{MargemContribuição}_{\%}}{ChurnMensal_{\%}}$$

Para compradores de pacotes avulsos (*Pay-as-you-go*):
$$LTV_{pack} = \text{TicketMédioPack} \times \text{FrequênciaMédiaDeRecompra} \times \text{MargemContribuição}_{\%}$$

LTV Consolidado Ponderado:
$$LTV_{blended} = (w_{sub} \times LTV_{sub}) + (w_{pack} \times LTV_{pack})$$

#### Meta / Benchmark ALEGON
- **LTV de Assinatura:** ≥ R$ 450,00 (considerando Churn 5% e ticket médio R$ 55,00)  
- **LTV Consolidado (Blended):** ≥ R$ 120,00  
- **Relação LTV / CAC:** **≥ 4,0x** (saúde financeira excelente)

#### Consulta SQL (Cloudflare D1)
```sql
-- LTV Histórico Realizado por Usuário Pagante (Receita Líquida Acumulada)
SELECT 
  p.user_id,
  u.email,
  COUNT(p.id) AS total_transacoes,
  ROUND(SUM(p.value_cents) / 100.0, 2) AS receita_acumulada_brl,
  ROUND(SUM(p.net_value_cents) / 100.0, 2) AS receita_liquida_gateway_brl,
  MIN(p.paid_at) AS primeiro_pagamento,
  MAX(p.paid_at) AS ultimo_pagamento
FROM asaas_payments p
JOIN users u ON u.id = p.user_id
WHERE p.status IN ('RECEIVED', 'CONFIRMED')
GROUP BY p.user_id
ORDER BY receita_acumulada_brl DESC
LIMIT 50;
```

---

### 3.2 CAC (Customer Acquisition Cost) e Payback Period

#### Definição
- **CAC:** Todo o custo com mídia de performance, ferramentas de tráfego, anúncios pagos e incentivos de marketing dividido pelo número de novos clientes pagantes adquiridos no mesmo período.
- **Payback:** Número de meses necessários para a margem de contribuição gerada pelo cliente pagar o custo de sua aquisição.

#### Fórmulas Matemáticas
$$CAC = \frac{\text{Gastos Totais com Marketing e Vendas}}{\text{Novos Clientes Pagantes Adquiridos}}$$

$$Payback = \frac{CAC}{ARPPU \times \text{MargemContribuição}_{\%}}$$

#### Meta / Benchmark ALEGON
- **CAC Médio:** ≤ R$ 20,00  
- **Payback Period:** **≤ 1,0 mês (< 30 dias)**  
- *Como o ticket médio inicial é de ~R$ 38,00 e a margem é de ~78%, o retorno do investimento de aquisição ocorre na primeira transação (D+0 a D+30).*

---

### 3.3 Margem Líquida por Edição (Unit Economics por Crédito)

#### Definição
Avalia o lucro residual de cada crédito consumido no sistema após deduzir o custo de chamada de API ao OpenRouter, a infraestrutura de armazenamento e a parcela proporcional de taxas financeiras e tributárias.

#### Fórmulas Matemáticas
$$\text{Receita por Crédito} = \frac{\text{Preço de Venda do Pacote/Plano}}{\text{Quantidade de Créditos}}$$

$$\text{Custo Variável Unitário} = \text{Custo IA} + \text{Custo R2/Worker} + \text{Imposto} + \text{Taxa Asaas}$$

$$\text{Margem Líquida por Edição} = \text{Receita por Crédito} - \text{Custo Variável Unitário}$$

#### Tabela de Referência Operacional
| Produto / Plano | Receita / Crédito | Custo IA Médio | Imposto + Gateway | Margem Líquida / Edição | Margem % |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Edição Avulsa** | R$ 7,90 | R$ 0,25 | R$ 1,35 | **R$ 6,29** | **79,6%** |
| **Pacote Inicial** | R$ 3,98 | R$ 0,25 | R$ 0,44 | **R$ 3,28** | **82,4%** |
| **Pacote Criador** | R$ 3,33 | R$ 0,25 | R$ 0,31 | **R$ 2,77** | **83,2%** |
| **Plano Pro (40 cr)** | R$ 1,75 | R$ 0,25 | R$ 0,15 | **R$ 1,35** | **77,1%** |
| **Plano Business** | R$ 1,50 | R$ 0,25 | R$ 0,12 | **R$ 1,13** | **75,3%** |

#### Consulta SQL (Cloudflare D1)
```sql
-- Custo Médio Realizado de IA por Edição nos últimos 30 dias (em micros de USD e BRL)
SELECT 
  COUNT(id) AS total_edicoes_sucesso,
  ROUND(AVG(cost_usd_micros) / 1000000.0, 4) AS custo_medio_usd,
  -- Conversão com taxa efetiva de R$ 6,30 por USD
  ROUND(AVG(cost_usd_micros) * 0.0000063, 4) AS custo_medio_brl,
  ROUND(AVG(latency_ms) / 1000.0, 2) AS latencia_media_segundos
FROM openrouter_usage
WHERE status = 'success'
  AND created_at >= datetime('now', '-30 days');
```

---

## 4. Consumo e Queima de Créditos (AI & Tokenomics)

### 4.1 Taxa de Queima de Créditos (Burn Rate) e Breakage Rate

#### Definição
- **Burn Rate de Créditos:** Velocidade com que os créditos concedidos aos usuários são efetivamente consumidos em edições com IA.
- **Breakage Rate:** Percentual de créditos expirados sem utilização (tanto créditos de assinatura ao fim do mês quanto créditos avulsos que ultrapassaram a data limite). O *breakage* representa receita contábil com margem de 100% sobre o custo de IA economizado.

#### Fórmulas Matemáticas
$$\text{Burn Rate}_{\%} = \frac{\text{Créditos Consumidos no Período}}{\text{Créditos Concedidos no Período}} \times 100$$

$$\text{Breakage Rate}_{\%} = \frac{\text{Créditos Expirados no Período}}{\text{Créditos Concedidos no Período}} \times 100$$

#### Meta / Benchmark ALEGON
- **Burn Rate:** 75% a 85%  
- **Breakage Rate (Saudável):** 15% a 25%  

#### Consulta SQL (Cloudflare D1)
```sql
-- Balanço de Créditos Concedidos, Consumidos e Expirados nos últimos 30 dias
SELECT 
  SUM(CASE WHEN type LIKE 'grant_%' THEN amount ELSE 0 END) AS creditos_concedidos,
  SUM(CASE WHEN type = 'consume' THEN ABS(amount) ELSE 0 END) AS creditos_consumidos,
  SUM(CASE WHEN type = 'expire' THEN ABS(amount) ELSE 0 END) AS creditos_expirados,
  ROUND(
    (CAST(SUM(CASE WHEN type = 'consume' THEN ABS(amount) ELSE 0 END) AS FLOAT) / 
     MAX(SUM(CASE WHEN type LIKE 'grant_%' THEN amount ELSE 0 END), 1)) * 100, 
    2
  ) AS taxa_consumo_pct,
  ROUND(
    (CAST(SUM(CASE WHEN type = 'expire' THEN ABS(amount) ELSE 0 END) AS FLOAT) / 
     MAX(SUM(CASE WHEN type LIKE 'grant_%' THEN amount ELSE 0 END), 1)) * 100, 
    2
  ) AS taxa_breakage_pct
FROM credit_transactions
WHERE created_at >= datetime('now', '-30 days');
```

---

## 5. Risco, Retenção e Inadimplência (Billing & Churn)

### 5.1 Taxa de Churn (Logo Churn e Net MRR Churn)

#### Definição
- **Logo Churn:** Percentual de assinantes que cancelaram suas assinaturas durante o mês.
- **Net MRR Churn:** Variação percentual de receita recorrente perdida por cancelamentos e downgrades em relação à receita ganha por expansão e upgrades.

#### Fórmulas Matemáticas
$$\text{Logo Churn}_{\%} = \frac{\text{Assinaturas Canceladas no Mês}}{\text{Assinaturas Ativas no Início do Mês}} \times 100$$

$$\text{Net MRR Churn}_{\%} = \frac{\text{MRR Perdido (Churn)} - \text{MRR Ganho (Upgrades)}}{\text{MRR Inicial do Mês}} \times 100$$

#### Meta / Benchmark ALEGON
- **Logo Churn Mensal:** ≤ 5,0%  
- **Net MRR Churn Mensal:** ≤ 1,0% (visando Net Negative Churn com planos superiores)

#### Consulta SQL (Cloudflare D1)
```sql
-- Assinaturas ativas vs canceladas nos últimos 30 dias
SELECT 
  COUNT(CASE WHEN status = 'active' THEN 1 END) AS assinaturas_ativas,
  COUNT(CASE WHEN status = 'cancelled' AND cancelled_at >= datetime('now', '-30 days') THEN 1 END) AS cancelamentos_30d,
  ROUND(
    (CAST(COUNT(CASE WHEN status = 'cancelled' AND cancelled_at >= datetime('now', '-30 days') THEN 1 END) AS FLOAT) /
     MAX(COUNT(CASE WHEN status = 'active' THEN 1 END), 1)) * 100,
    2
  ) AS logo_churn_pct
FROM subscriptions;
```

---

### 5.2 Taxa de Inadimplência (Default Rate / Involuntary Churn)

#### Definição
Mede o volume de cobranças geradas pelo Asaas que não foram quitadas até o vencimento ou resultaram em falha de cartão não recuperada (`OVERDUE`).

#### Fórmulas Matemáticas
$$\text{Inadimplência Financeira}_{\%} = \frac{\text{Volume em R\$ de Cobranças Vencidas e Não Pagas}}{\text{Volume Total em R\$ de Cobranças Emitidas}} \times 100$$

#### Mitigações no Core da ALEGON
1. **Regra Inviolável de Créditos:** Créditos de recarga ou renovação **somente são adicionados ao ledger após status `RECEIVED` ou `CONFIRMED` via webhook**.
2. **Inadimplência não gera custo de IA:** Se o Pix expirar ou o cartão for recusado, a carteira permanece intocada.

#### Consulta SQL (Cloudflare D1)
```sql
-- Taxa de Inadimplência das cobranças emitidas nos últimos 30 dias
SELECT 
  COUNT(id) AS total_cobrancas_emitidas,
  COUNT(CASE WHEN status IN ('RECEIVED', 'CONFIRMED') THEN 1 END) AS cobrancas_pagas,
  COUNT(CASE WHEN status = 'OVERDUE' THEN 1 END) AS cobrancas_vencidas,
  ROUND(SUM(CASE WHEN status = 'OVERDUE' THEN value_cents ELSE 0 END) / 100.0, 2) AS valor_inadimplente_brl,
  ROUND(
    (CAST(COUNT(CASE WHEN status = 'OVERDUE' THEN 1 END) AS FLOAT) / MAX(COUNT(id), 1)) * 100, 
    2
  ) AS taxa_inadimplencia_transacional_pct
FROM asaas_payments
WHERE created_at >= datetime('now', '-30 days');
```

---

### 5.3 Taxa de Reembolso (Refund Rate)

#### Definição
Percentual de transações em que o cliente solicitou reembolso ou chargeback. 

#### Regra Operacional de Estorno:
Quando um reembolso é processado (`POST /admin/payments/:id/refund`):
- O status do pagamento no Asaas transita para `REFUNDED`.
- O saldo remanescente de créditos não consumidos concedido por aquele pagamento é estornado via transação `refund_reversal`.

#### Consulta SQL (Cloudflare D1)
```sql
-- Taxa de Reembolso nos últimos 90 dias
SELECT 
  COUNT(p.id) AS total_pagamentos,
  COUNT(r.id) AS total_reembolsos,
  ROUND(SUM(COALESCE(r.value_cents, 0)) / 100.0, 2) AS total_reembolsado_brl,
  ROUND(
    (CAST(COUNT(r.id) AS FLOAT) / MAX(COUNT(p.id), 1)) * 100, 
    2
  ) AS taxa_reembolso_pct
FROM asaas_payments p
LEFT JOIN refunds r ON r.payment_id = p.id AND r.status = 'done'
WHERE p.created_at >= datetime('now', '-90 days');
```

---

## 6. Sumário de Alertas e Limiares Operacionais para o Painel

O backend e o painel administrativo devem acionar alertas visuais e notificações internas quando os seguintes gatilhos forem violados:

| Indicador | Alerta Amarelo (Atenção) | Alerta Vermelho (Crítico) | Ação Recomendada |
| :--- | :--- | :--- | :--- |
| **Margem de Contribuição Geral** | < 75% | < 70% | Rever mix de tiers de modelos de IA ou taxa cambial |
| **Custo de IA / Receita Bruta** | > 18% | > 22% | Ajustar créditos por tier ou desativar temporariamente modelos caros |
| **Gasto Diário de IA (Global)** | > 80% do teto configurado | ≥ 100% do teto ($20/dia) | Interromper novas requisições (`DAILY_LIMIT_REACHED`) e auditar filas |
| **Taxa de Inadimplência** | > 7% | > 12% | Disparar réguas de e-mail de recuperação antes do vencimento |
| **Logo Churn Mensal** | > 6% | > 9% | Ativar pesquisa de saída e ofertas de retenção / desconto pontual |
