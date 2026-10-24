# ALEGON AI Photo Studio — Documentação e Integração Asaas API v3

> **Documento Canônico de Integração com Asaas**  
> **Dono:** Especialista em Asaas e Billing (Subagente 5)  
> **Data:** 24/10/2026  
> **Versão:** 1.0.0  
> **Ambientes:** Asaas Sandbox (Desenvolvimento/Homologação) e Asaas Produção  
> **Política de Gateway:** 100% Asaas. Proibido Stripe.  

---

## 1. Visão Geral da API Asaas v3

O **Asaas** é uma instituição de pagamentos brasileira autorizada pelo Banco Central do Brasil, especializada em gestão financeira, cobranças pontuais e recorrentes (Pix, Cartão de Crédito e Boleto) para plataformas SaaS e prestadores de serviços.

### 1.1 Ambientes e URLs Base
- **Sandbox (Homologação):** `https://api-sandbox.asaas.com/v3`
- **Produção:** `https://api.asaas.com/v3`
- **Variável de Ambiente:** `env.ASAAS_BASE_URL` (configurada via `wrangler.toml` / `.dev.vars`).

### 1.2 Autenticação
A autenticação nas APIs REST do Asaas é realizada via HTTP Header:
```http
access_token: $aact_YTU5Y...
```
- Em nossas chamadas HTTP, o cabeçalho `access_token` é injetado a partir de `env.ASAAS_API_KEY`.
- Nenhum segredo ou chave de API do Asaas trafega no frontend.

---

## 2. Modelagem de Clientes (`/customers`)

Antes de gerar qualquer cobrança no Asaas, é necessário criar ou vincular o cliente pagador.

### 2.1 Minimização de Dados (LGPD)
Em conformidade com a LGPD e as regras de arquitetura da ALEGON:
- No cadastro do usuário (`POST /auth/register`), coletamos apenas e-mail e nome completo.
- O CPF/CNPJ só é solicitado **no momento do checkout** (`POST /billing/checkout` ou `POST /billing/subscriptions`), pois é exigência regulatória do Banco Central e do Asaas para emissão de Pix e cobranças registradas.
- O mapeamento do usuário com o Asaas é persistido na tabela `asaas_customers (user_id, asaas_customer_id, environment, created_at)`.

### 2.2 Endpoints Utilizados
1. **Criar Cliente:** `POST /customers`
   - **Payload:**
     ```json
     {
       "name": "Nome Completo do Cliente",
       "cpfCnpj": "12345678909",
       "email": "cliente@exemplo.com.br",
       "mobilePhone": "11999999999",
       "externalReference": "usr_01927361-..."
     }
     ```
   - **Retorno:** Objeto com `id: "cus_000005928172"`.
2. **Consultar Cliente:** `GET /customers/{id}` ou `GET /customers?cpfCnpj={cpfCnpj}&email={email}`.

---

## 3. Cobranças Pontuais (`/payments`) — Pix e Cartão de Crédito

Cobranças avulsas atendem à compra de **Edição Avulsa (R$ 7,90)** e **Pacotes de Créditos (R$ 19,90 a R$ 59,90)**.

### 3.1 Criação da Cobrança (`POST /payments`)
- **Payload Base:**
  ```json
  {
    "customer": "cus_000005928172",
    "billingType": "PIX",
    "value": 19.90,
    "dueDate": "2026-10-27",
    "description": "ALEGON AI Photo Studio - Pacote Inicial (5 Créditos)",
    "externalReference": "pay_01927361-...",
    "postalService": false
  }
  ```
- **Campos Importantes:**
  - `externalReference`: UUID interno do nosso registro `asaas_payments.id`. Garante rastreabilidade bidirecional e conciliação perfeita.
  - `dueDate`: Data de vencimento da cobrança (3 dias corridos para Pix/cartão).

### 3.2 Modalidade Pix
1. Ao criar a cobrança com `billingType: "PIX"`, o Asaas gera a cobrança com status `PENDING`.
2. Consultamos o QR Code dinâmico via `GET /payments/{id}/pixQrCode`:
   - `encodedImage`: String Base64 da imagem PNG do QR Code (renderizável diretamente no `<img src="data:image/png;base64,...">`).
   - `payload`: Código textual Pix Copia-e-Cola (EMV).
   - `expirationDate`: Data e hora de expiração do QR Code.
3. Liquidação Pix: Instantânea (D+0). Notificada via webhook `PAYMENT_RECEIVED`.

### 3.3 Modalidade Cartão de Crédito e Compliance PCI-DSS
- **Decisão Arquitetural Canônica:** **Sem captura de dados de cartão na ALEGON**.
- Não coletamos nem trafegamos PAN (número do cartão), CVV ou validade nos servidores da ALEGON. Isso isenta a infraestrutura da ALEGON dos pesados requisitos do PCI-DSS Nível 1/2.
- O checkout com cartão direciona o usuário para a página segura hospedada pelo Asaas (`invoiceUrl`), onde o pagamento é processado com 3D Secure / antifraude nativo do Asaas.
- Quando o pagamento é aprovado, o Asaas emite o webhook `PAYMENT_CONFIRMED`.

### 3.4 Ciclo de Vida dos Status de Cobrança
| Status Asaas | Significado | Ação no Sistema ALEGON |
|---|---|---|
| `PENDING` | Cobrança gerada, aguardando pagamento | Registra em `asaas_payments` com status PENDING |
| `CONFIRMED` | Pagamento com cartão aprovado | Concede créditos no lote `purchased` |
| `RECEIVED` | Pagamento Pix/Boleto recebido em conta | Concede créditos no lote `purchased` |
| `RECEIVED_IN_CASH` | Recebido em dinheiro/manual | Concede créditos caso validado |
| `OVERDUE` | Vencido sem pagamento | Atualiza status; não concede créditos |
| `REFUNDED` | Reembolsado ao pagador | Estorna créditos não consumidos (`refund_reversal`) |
| `REFUND_REQUESTED` | Solicitação de reembolso em análise | Atualiza status de auditoria |
| `CHARGEBACK_REQUESTED` | Notificação de contestação/chargeback | Suspende créditos do lote preventivamente |

---

## 4. Assinaturas Recorrentes (`/subscriptions`)

Os planos de assinatura mensal (**Pessoal R$ 29,90**, **Pro R$ 69,90**, **Business R$ 149,90**) utilizam a engine nativa de assinaturas do Asaas.

### 4.1 Criação de Assinatura (`POST /subscriptions`)
- **Payload:**
  ```json
  {
    "customer": "cus_000005928172",
    "billingType": "CREDIT_CARD",
    "value": 29.90,
    "nextDueDate": "2026-10-24",
    "cycle": "MONTHLY",
    "description": "ALEGON AI Photo Studio - Plano Pessoal (15 créditos/mês)",
    "externalReference": "sub_01927361-..."
  }
  ```
- O Asaas cria a assinatura e gera automaticamente a cobrança do 1º ciclo.
- A cobrança gerada é vinculada à assinatura e carrega o identificador `subscription: "sub_asaas_..."`.
- **Importante:** A confirmação de cada ciclo gera o evento `PAYMENT_CONFIRMED` ou `PAYMENT_RECEIVED` com o campo `subscription` preenchido. Isso alimenta os créditos mensais do bucket `subscription`.

### 4.2 Cancelamento de Assinatura (`DELETE /subscriptions/{id}`)
- **Cancelamento ao final do período pago (`cancel_at_period_end = 1`):** A assinatura permanece ativa no Asaas até a data `current_period_end`. Ao atingir a data, ela não é renovada. O usuário mantém o uso dos créditos até o último dia do ciclo já pago.
- **Cancelamento imediato:** A assinatura é desativada no Asaas e marcada como `cancelled` na ALEGON.

---

## 5. Webhooks do Asaas

Os webhooks são o coração da sincronização assíncrona entre o Asaas e o ALEGON AI Photo Studio.

### 5.1 Endpoint Receptor
- **URL:** `POST /api/webhooks/asaas`
- **Segurança:** O Asaas envia o cabeçalho HTTP configurado no painel:
  ```http
  asaas-access-token: <ASAAS_WEBHOOK_TOKEN>
  ```
- O middleware de CSRF isenta rotas `/api/webhooks/*` porque a autenticação é criptograficamente baseada nesse token secreto.
- **Tempo de Resposta:** Responde **HTTP 200 OK imediatamente**, gravando o payload em `asaas_webhook_events` e enfileirando uma mensagem na Cloudflare Queue `WEBHOOK_QUEUE` (`alegon-asaas-webhooks`).

### 5.2 Formato do Payload de Evento Asaas
```json
{
  "id": "evt_00192837461928",
  "event": "PAYMENT_RECEIVED",
  "dateCreated": "2026-10-24 01:30:00",
  "payment": {
    "id": "pay_928172648192",
    "customer": "cus_000005928172",
    "subscription": null,
    "installment": null,
    "paymentLink": null,
    "value": 19.90,
    "netValue": 18.91,
    "originalValue": null,
    "interestValue": null,
    "description": "ALEGON AI Photo Studio - Pacote Inicial (5 Créditos)",
    "billingType": "PIX",
    "confirmedDate": "2026-10-24",
    "pixTransaction": "e2e92817264...",
    "status": "RECEIVED",
    "dueDate": "2026-10-27",
    "originalDueDate": "2026-10-27",
    "paymentDate": "2026-10-24",
    "clientPaymentDate": "2026-10-24",
    "invoiceUrl": "https://sandbox.asaas.com/i/928172648192",
    "invoiceNumber": "00928172",
    "externalReference": "pay_01927361-...",
    "deleted": false
  }
}
```

### 5.3 Catálogo de Eventos Relevantes
1. `PAYMENT_CREATED`: Cobrança gerada. Atualiza status interno se necessário.
2. `PAYMENT_UPDATED`: Atualização de dados cadastrais ou vencimento.
3. `PAYMENT_CONFIRMED`: Pagamento aprovado no cartão. Concede créditos.
4. `PAYMENT_RECEIVED`: Pagamento Pix ou liquidação em conta bancária. Concede créditos.
5. `PAYMENT_OVERDUE`: Pagamento vencido. Atualiza status para overdue.
6. `PAYMENT_DELETED`: Cobrança removida no Asaas.
7. `PAYMENT_REFUNDED`: Reembolso concluído. Dispara estorno de créditos.
8. `SUBSCRIPTION_CREATED`: Nova assinatura registrada no Asaas.
9. `SUBSCRIPTION_UPDATED`: Alteração de dados da assinatura.
10. `SUBSCRIPTION_DELETED`: Assinatura cancelada no Asaas.

---

## 6. Recursos do Asaas Sandbox para Testes

O ambiente de Sandbox (`https://api-sandbox.asaas.com/v3`) conta com ferramentas e endpoints de simulação:
1. **Simulação de Pagamento Pix / Dinheiro:**
   `POST /payments/{id}/receiveInCash`
   - Payload: `{"paymentDate": "2026-10-24", "value": 19.90}`
   - Imediatamente transaciona o pagamento para `RECEIVED` e dispara o webhook `PAYMENT_RECEIVED`.
2. **Simulação de Confirmação de Cartão:**
   - Através do `invoiceUrl` gerado em sandbox, é possível simular a transação de cartão usando cartões de teste padrão ou acionar a confirmação via painel de testes do Asaas.
3. **Simulação de Reembolso:**
   `POST /payments/{id}/refund`
   - Realiza a devolução total ou parcial do valor e emite o webhook `PAYMENT_REFUNDED`.
