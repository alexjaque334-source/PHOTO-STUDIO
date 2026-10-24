# ALEGON AI Photo Studio — Roteiro de Testes em Asaas Sandbox

> **Roteiro Canônico de Homologação e Testes Operacionais**  
> **Dono:** Especialista em Asaas e Billing (Subagente 5)  
> **Ambiente:** Asaas Sandbox (`https://api-sandbox.asaas.com/v3`)  
> **Data:** 24/10/2026  
> **Versão:** 1.0.0  

---

## 1. Preparação do Ambiente de Testes

### 1.1 Variáveis Necessárias no `.dev.vars`
```ini
ENVIRONMENT=development
APP_URL=http://localhost:5173
ASAAS_BASE_URL=https://api-sandbox.asaas.com/v3
ASAAS_API_KEY=$aact_sandbox_...
ASAAS_WEBHOOK_TOKEN=alegon_sandbox_webhook_secret_2026
```

### 1.2 Criação e Configuração da Conta de Sandbox
1. Acessar o portal de desenvolvedores Asaas Sandbox: [https://sandbox.asaas.com](https://sandbox.asaas.com).
2. Gerar uma API Key na aba **Integrações > Chaves de API**.
3. Configurar a URL de Webhook:
   - URL: `https://<seu-tunnel-ou-worker>/api/webhooks/asaas`
   - Versão da API de Webhook: **v3**
   - Token de Autenticação: O mesmo definido em `ASAAS_WEBHOOK_TOKEN`.
   - Eventos Habilitados:
     - `PAYMENT_CREATED`, `PAYMENT_UPDATED`, `PAYMENT_CONFIRMED`, `PAYMENT_RECEIVED`, `PAYMENT_OVERDUE`, `PAYMENT_REFUNDED`, `SUBSCRIPTION_CREATED`, `SUBSCRIPTION_UPDATED`, `SUBSCRIPTION_DELETED`.

---

## 2. Cenários de Teste Ponta a Ponta

### Cenário 1: Cadastro de Cliente no Asaas Sandbox
- **Objetivo:** Garantir a criação minimizada de cliente e vinculação em `asaas_customers`.
- **Passos:**
  1. Realizar login com usuário de teste no ALEGON AI Photo Studio.
  2. Disparar requisição de checkout informando CPF válido de teste (ex.: gerado por gerador de CPF para homologação) e telefone.
  3. A API deve chamar `POST /customers` no Asaas Sandbox e salvar o `asaas_customer_id` na tabela `asaas_customers`.
  4. Repetir o checkout para o mesmo usuário com outro produto.
- **Critério de Aceite:**
  - O sistema reutiliza o `asaas_customer_id` existente sem duplicar registros no Asaas nem na tabela `asaas_customers`.

---

### Cenário 2: Compra de Edição Avulsa via Pix (R$ 7,90)
- **Objetivo:** Validar checkout Pix, renderização do QR Code e concessão de 1 crédito com validade de 30 dias.
- **Passos:**
  1. Chamar `POST /api/billing/checkout` com:
     ```json
     {
       "productCode": "single_edit",
       "billingType": "PIX",
       "cpfCnpj": "00000000191",
       "name": "Cliente Teste Pix"
     }
     ```
     Header: `Idempotency-Key: c9b2a640-1234-4567-89ab-cdef01234567`.
  2. Verificar a resposta: deve conter `paymentId`, `status: "PENDING"`, `pix: { encodedImage, payload, expirationDate }`.
  3. No Sandbox do Asaas, simular o pagamento via endpoint de teste:
     ```http
     POST https://api-sandbox.asaas.com/v3/payments/{asaasPaymentId}/receiveInCash
     access_token: <sua-api-key>
     Content-Type: application/json

     {
       "paymentDate": "2026-10-24",
       "value": 7.90
     }
     ```
  4. O Asaas emitirá o webhook `PAYMENT_RECEIVED` para `/api/webhooks/asaas`.
  5. A fila `alegon-asaas-webhooks` processará o evento.
  6. Consultar `GET /api/wallet`.
- **Critério de Aceite:**
  - O saldo do usuário aumenta em 1 crédito no bucket `purchased`.
  - O lote criado em `credit_lots` possui `amount_initial = 1`, `amount_remaining = 1` e `expires_at = now + 30 dias`.
  - O pagamento em `asaas_payments` é atualizado para status `RECEIVED` e `credits_granted_at` é registrado.

---

### Cenário 3: Compra de Pacote de Créditos via Cartão (R$ 39,90)
- **Objetivo:** Validar fluxo seguro com cartão de crédito via checkout hospedado do Asaas.
- **Passos:**
  1. Chamar `POST /api/billing/checkout` com `productCode: "pack_criador"` e `billingType: "CREDIT_CARD"`.
  2. Verificar a resposta: deve conter `invoiceUrl` apontando para `https://sandbox.asaas.com/i/...`.
  3. Acessar a `invoiceUrl` no navegador e efetuar o pagamento simulado com cartão de crédito de teste do Asaas.
  4. O Asaas emite o webhook `PAYMENT_CONFIRMED`.
  5. O consumidor da fila processa o evento e concede os créditos.
- **Critério de Aceite:**
  - O saldo do usuário aumenta em 12 créditos no bucket `purchased`.
  - O lote possui `expires_at = now + 365 dias` (12 meses).
  - Nenhuma informação de cartão de crédito passou pelos servidores da ALEGON.

---

### Cenário 4: Assinatura do Plano Pessoal (R$ 29,90/mês)
- **Objetivo:** Validar a contratação recorrente e concessão de 15 créditos no bucket `subscription`.
- **Passos:**
  1. Chamar `POST /api/billing/subscriptions` com:
     ```json
     {
       "planCode": "pessoal",
       "billingType": "CREDIT_CARD",
       "cpfCnpj": "00000000191"
     }
     ```
  2. Obter a resposta com `subscriptionId`, `status: "pending"` e dados da primeira cobrança (`firstPayment`).
  3. Simular o pagamento da primeira fatura no Asaas Sandbox.
  4. Webhook `PAYMENT_CONFIRMED` é recebido com a propriedade `subscription` preenchida.
  5. Consultar `GET /api/billing/subscription` e `GET /api/wallet`.
- **Critério de Aceite:**
  - A assinatura muda para status `active`.
  - `current_period_start` é preenchido com a data do pagamento e `current_period_end` com +30 dias.
  - Concedidos 15 créditos no bucket `subscription` com `expires_at = current_period_end`.

---

### Cenário 5: Renovação Recorrente de Assinatura e Expiração de Ciclo Anterior
- **Objetivo:** Comprovar a política de não acúmulo de créditos de assinatura (*no rollover*).
- **Passos:**
  1. No Asaas Sandbox, simular a cobrança do ciclo seguinte da assinatura criada no Cenário 4.
  2. O Asaas emite novo evento `PAYMENT_CONFIRMED` para a nova cobrança associada à mesma assinatura.
  3. O processador de webhook identifica o novo ciclo, expira eventuais créditos restantes do ciclo anterior e concede os 15 créditos do novo período.
- **Critério de Aceite:**
  - O bucket `subscription` reflete exatamente o saldo renovado.
  - O ciclo em `subscriptions` é estendido por mais 30 dias.

---

### Cenário 6: Cancelamento de Assinatura
- **Objetivo:** Testar o cancelamento ao final do ciclo vs imediato.
- **Passos:**
  1. Chamar `POST /api/billing/subscription/cancel` com `{ "atPeriodEnd": true }`.
  2. Verificar `GET /api/billing/subscription`: `cancel_at_period_end` igual a `true`.
  3. O usuário continua podendo usar os créditos de assinatura até `current_period_end`.
  4. Testar cancelamento com `{ "atPeriodEnd": false }`:
     - O Asaas recebe `DELETE /subscriptions/{id}`.
     - Status da assinatura passa para `cancelled`.
- **Critério de Aceite:**
  - O Asaas cancela a recorrência no sandbox e a ALEGON reflete o status adequadamente.

---

### Cenário 7: Estorno de Pagamento e Devolução de Créditos (Sem Saldo Negativo)
- **Objetivo:** Testar estorno por reembolso solicitado no painel do Asaas ou administrativo.
- **Passos:**
  1. Executar reembolso da cobrança do Cenário 2 no Sandbox:
     `POST https://api-sandbox.asaas.com/v3/payments/{paymentId}/refund`.
  2. O Asaas envia o webhook `PAYMENT_REFUNDED`.
  3. Caso o usuário não tenha consumido o crédito: o crédito é estornado do lote e o saldo volta a 0.
  4. Caso o usuário já tenha consumido o crédito em uma edição: o débito não deixa o saldo negativo (`debited: 0`), e um registro de auditoria é gravado alertando o consumo prévio.
- **Critério de Aceite:**
  - Em nenhuma hipótese o saldo da carteira fica menor que zero (`CHECK >= 0`).

---

### Cenário 8: Resiliência contra Duplicidade de Webhook
- **Objetivo:** Comprovar idempotência na ingestão e processamento de eventos.
- **Passos:**
  1. Enviar a mesma requisição POST de webhook para `/api/webhooks/asaas` duas vezes em sequência rápida.
  2. Na primeira chamada: HTTP 200, gravado em `asaas_webhook_events` e enfileirado.
  3. Na segunda chamada: HTTP 200 retornado de imediato com `alreadyReceived: true`.
  4. Simular o processamento da fila duas vezes com o mesmo `eventRowId`.
- **Critério de Aceite:**
  - Créditos concedidos estritamente uma única vez (`credits_granted_at` impede reprocessamento).

---

### Cenário 9: Manutenção Programada (Job Cron)
- **Objetivo:** Validar o destravamento de reservas zumbis e expiração de créditos vencidos.
- **Passos:**
  1. Inserir manualmente uma reserva com `status = 'active'` e `expires_at` no passado (simulando timeout do consumidor de IA).
  2. Inserir um lote de créditos comprado com `expires_at` no passado.
  3. Executar o job `runBillingMaintenance(env)`.
- **Critério de Aceite:**
  - A reserva é convertida para `released` com motivo `expired_ttl` e o saldo reservado da carteira é destravado.
  - O lote vencido tem seu saldo zerado e uma transação do tipo `expire` é adicionada ao extrato.
