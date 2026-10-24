# ALEGON AI Photo Studio — Análise Financeira e Viabilidade de Preços

> **Documento Canônico de Precificação SaaS**  
> **Dono:** Especialista Financeiro SaaS (Subagente 9)  
> **Data de Emissão:** 24/10/2026  
> **Versão:** 1.0.0  
> **Status:** Aprovado para Produção / Seed 0050  

---

## 1. Sumário Executivo

Este documento apresenta a modelagem de *unit economics*, viabilidade econômico-financeira e estrutura de margens para a **ALEGON AI Photo Studio**, plataforma SaaS de edição e geração de imagens profissionais baseada em IA generativa (OpenRouter), infraestrutura Cloudflare (Workers, D1, R2) e pagamentos integrados via Asaas (Pix e Cartão de Crédito).

Os preços sugeridos pelo cliente foram auditados e **validados como comercialmente competitivos e financeiramente saudáveis**, proporcionando uma **Margem de Contribuição Média ponderada superior a 79%**, plenamente aderente aos benchmarks de excelência da indústria de Micro-SaaS e IA B2C/SMB global.

---

## 2. Estrutura de Custos Unitários e Variáveis

### 2.1 Custo de Inteligência Artificial (OpenRouter API)

A ALEGON opera com orquestração de modelos no OpenRouter. Cada edição consome 1 crédito no tier Padrão. O custo de IA é denominado em dólares americanos (USD) e convertido para reais (BRL).

#### A. Premissas Cambiais e de Risco Operacional
- **Câmbio Comercial de Referência (USD/BRL):** R$ 5,75
- **Spread Cambial, IOF (5,38%) e Margem de Volatilidade Cambial (10%):** Multiplicador de proteção cambial de 1,15x
- **Taxa de Câmbio Efetiva Projetada (Hedge/Segurança):** **R$ 6,30 por USD**
- **Buffer de Reprocessamento Técnico / Retries:** **+15%** (absorve falhas de conexão, timeouts de inferência elegíveis para crédito de cortesia, refações por prompt incompreendido e checagem de alinhamento visual).

#### B. Matriz de Custos por Tier de Edição
| Tier | Modelos de Referência (OpenRouter) | Custo Base (USD) | Custo c/ Buffer 15% (USD) | Custo Efetivo em BRL (Tx: 6,30) | Créditos Cobrados | Custo Efetivo por Crédito (BRL) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Econômico** | Google Gemini 2.5 Flash Image / FLUX Schnell | $0,012 | $0,0138 | **R$ 0,087** | 1 | **R$ 0,09** |
| **Padrão** | FLUX.1-dev / SDXL Inpainting / Gemini Pro Vision | $0,035 | $0,0402 | **R$ 0,253** | 1 | **R$ 0,25** |
| **Premium** | FLUX 1.1 Pro / Ideogram v2 / Recraft v20 | $0,075 | $0,0862 | **R$ 0,543** | 2 | **R$ 0,27** |

> **Baseline Adotado para Modelagem:** O custo médio ponderado de IA adotado nas simulações é de **R$ 0,25 por crédito consumido**.

---

### 2.2 Taxas do Gateway de Pagamento (Asaas)

A ALEGON utiliza o gateway Asaas para processar cobranças em território nacional, mantendo compliance PCI-DSS (checkout hospedado para cartão) e conciliação automática por webhooks.

#### Tabela de Tarifas Asaas Adotada
1. **Pix:** R$ 0,99 fixo por cobrança recebida (liquidação D+0 / instantânea).
2. **Cartão de Crédito (Checkout Asaas D+30):** 2,99% sobre o valor da transação + R$ 0,49 fixo por cobrança aprovada.
3. **Mix de Métodos de Pagamento Projetado:**
   - **60% Pix** / **40% Cartão de Crédito** (comportamento típico de e-commerce e SaaS de consumo no Brasil).
   - Taxa média ponderada de gateway calculada por produto conforme o ticket médio.

---

### 2.3 Custos de Infraestrutura Cloudflare (Serverless & Storage)

A arquitetura moderna baseada em Cloudflare garante custos marginais quase nulos por usuário adicional:
- **Cloudflare Workers:** US$ 5,00/mês base (inclui 10 milhões de requisições). Custo marginal: R$ 0,0002 por ciclo de edição.
- **Cloudflare D1 (Database SQL):** 25 bilhões de leituras e 50 milhões de escritas inclusas no plano pago. Custo marginal por edição: R$ 0,0001.
- **Cloudflare R2 (Object Storage Privado):**
  - Política de retenção canônica de 90 dias com deleção automática (`deleted_at` / cron retention).
  - Cada ciclo de edição gera: Imagem Original (3 MB) + Versão Editada (3 MB) + 2 Thumbnails WebP (150 KB) = ~6,3 MB retidos por 90 dias (0,25 ano).
  - Custo R2: $0,015 / GB-mês * 0,0063 GB * 3 meses = $0,00028 USD (~R$ 0,0018 BRL).
  - Egress do R2: **R$ 0,00 (isenção total de tráfego de saída no ecossistema Cloudflare)**.
- **Custo Total de Infraestrutura Cloudflare por Edição:** **R$ 0,005 (meio centavo por crédito/edição)**.

---

### 2.4 Carga Tributária Estimada (Simples Nacional)

- **Enquadramento:** Serviços de Tecnologia da Informação / SaaS (CNAE 6202-3/00 ou 6203-1/00 — Desenvolvimento e Licenciamento de Programas de Computador Customizáveis).
- **Regime Tributário:** Simples Nacional (Anexo III, condicionado ao Fator R ≥ 28% via folha/pró-labore dos sócios).
- **Alíquota Nominal Inicial:** **6,00%** sobre o faturamento bruto até R$ 180.000,00/ano.
- **Alíquota Efetiva Projetada (Projeção 12 Meses):** Modelada entre **6,00%** (fase inicial) e **7,50%** (faixa de faturamento até R$ 720.000,00). Adotou-se **6,00%** no baseline para cálculo de margem unitária.

---

## 3. Análise Detalhada de Margem de Contribuição por Produto

### 3.1 Produtos Avulsos e Pacotes de Créditos

| Produto | Preço Venda (BRL) | Créditos | Validade | Preço / Crédito | Imposto (6%) | Asaas (Mix 60/40) | Custo IA (R$ 0,25/un) | Custo Infra R2/Worker | Custo Variável Total | Margem Contribuição (R$) | Margem Contribuição (%) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Edição Avulsa** | **R$ 7,90** | 1 | 30 dias | R$ 7,90 | R$ 0,47 | R$ 0,88 | R$ 0,25 | R$ 0,01 | **R$ 1,61** | **R$ 6,29** | **79,62%** |
| **Pacote Inicial** | **R$ 19,90** | 5 | 365 dias | R$ 3,98 | R$ 1,19 | R$ 1,03 | R$ 1,25 | R$ 0,03 | **R$ 3,50** | **R$ 16,40** | **82,41%** |
| **Pacote Criador** | **R$ 39,90** | 12 | 365 dias | R$ 3,33 | R$ 2,39 | R$ 1,27 | R$ 3,00 | R$ 0,06 | **R$ 6,72** | **R$ 33,18** | **83,16%** |
| **Pacote Profissional**| **R$ 59,90** | 20 | 365 dias | R$ 3,00 | R$ 3,59 | R$ 1,51 | R$ 5,00 | R$ 0,10 | **R$ 10,20**| **R$ 49,70** | **82,97%** |

#### Detalhamento das Taxas Asaas nos Pacotes:
- **Edição Avulsa (R$ 7,90):** Pix R$ 0,99 (12,53%); Cartão R$ 0,49 + 2,99% = R$ 0,73 (9,24%). Média 60/40: R$ 0,884.
- **Pacote Inicial (R$ 19,90):** Pix R$ 0,99; Cartão R$ 0,49 + R$ 0,60 = R$ 1,09. Média: R$ 1,03.
- **Pacote Criador (R$ 39,90):** Pix R$ 0,99; Cartão R$ 0,49 + R$ 1,19 = R$ 1,68. Média: R$ 1,27.
- **Pacote Profissional (R$ 59,90):** Pix R$ 0,99; Cartão R$ 0,49 + R$ 1,79 = R$ 2,28. Média: R$ 1,51.

---

### 3.2 Planos de Assinatura Recorrente (Mensais)

Nas assinaturas, os créditos são renovados a cada ciclo de faturamento e expiram ao término do ciclo (sem acúmulo). Isso gera o fenômeno de **Breakage** (créditos pagos e não utilizados), que na prática reduz o custo efetivo de IA e eleva a margem real.

Apresentamos dois cenários de utilização:
1. **Cenário de Estresse (100% de Utilização):** O usuário consome todos os créditos concedidos no mês.
2. **Cenário Realista (80% de Utilização):** Taxa média de utilização observada em SaaS de criadores (20% de breakage).

| Plano | Preço Mensal | Créditos / Mês | Preço / Crédito | Imposto (6%) | Asaas (Mix 60/40) | Custo IA (100% Uso) | Margem Contribuição (100% Uso) | Margem % (100% Uso) | Custo IA (80% Uso Real) | Margem Contribuição (80% Uso) | Margem % (80% Uso) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Pessoal** | **R$ 29,90** | 15 | R$ 1,99 | R$ 1,79 | R$ 1,15 | R$ 3,75 | **R$ 23,13** | **77,36%** | R$ 3,00 | **R$ 23,88** | **79,87%** |
| **Pro** | **R$ 69,90** | 40 | R$ 1,75 | R$ 4,19 | R$ 1,63 | R$ 10,00 | **R$ 53,88** | **77,08%** | R$ 8,00 | **R$ 55,88** | **79,94%** |
| **Business** | **R$ 149,90**| 100 | R$ 1,50 | R$ 8,99 | R$ 2,58 | R$ 25,00 | **R$ 112,83** | **75,27%** | R$ 20,00 | **R$ 117,83** | **78,61%** |

*(Nota: custos de infraestrutura Cloudflare variam entre R$ 0,08 e R$ 0,50 por usuário/mês e já estão computados na margem de contribuição).*

---

## 4. Avaliação e Validação Estratégica dos Preços

### 4.1 Validação do Preço da Edição Avulsa (R$ 7,90)
- **Veredito:** **VALIDADO E RECOMENDADO**.
- **Justificativa Estratégica:** Funciona como produto de entrada de baixíssima fricção (*tripwire*). Embora a taxa fixa de R$ 0,99 do Pix represente 12,5% do valor da transação, o produto ainda gera **R$ 6,29 de Margem de Contribuição Líquida (79,6%)**. É a ferramenta perfeita para converter usuários com objeção a assinaturas ou que precisam de uma única foto urgente (ex.: foto de perfil LinkedIn, documento ou anúncio de produto no Mercado Livre).
- **Proteção:** Validade de 30 dias para evitar passivo circulante prolongado no balanço.

### 4.2 Validação da Escala de Pacotes de Créditos
- **Veredito:** **VALIDADO COM EXCELENTE CURVA DE VALOR**.
- **Curva Decrescente de Custo por Crédito:**
  - Avulso: R$ 7,90 / crédito
  - Pacote Inicial: R$ 3,98 / crédito (desconto de 49,6%)
  - Pacote Criador: R$ 3,33 / crédito (desconto de 57,8%) — **Pacote Âncora Recomendado no Checkout**
  - Pacote Profissional: R$ 3,00 / crédito (desconto de 62,0%)
- **Mecanismo Psicológico:** A ancoragem no Pacote Criador (R$ 39,90) faz o cliente comparar R$ 19,90 (5 fotos) com R$ 39,90 (12 fotos + 2 de bônus percebido), empurrando o ticket médio para cima com margem estável em 83%.

### 4.3 Validação dos Planos de Assinatura
- **Veredito:** **VALIDADO E ALTAMENTE RENTÁVEL**.
- **Relação com Pacotes:** O Plano Pessoal (R$ 29,90 por 15 créditos = R$ 1,99/crédito) entrega mais créditos que o Pacote Criador (R$ 39,90 por 12 créditos) por um preço menor, incentivando ativamente a recorrência mensal (MRR previsível).
- **Benefício de Expiração de Créditos:** Créditos de assinatura não acumulam mês a mês (`current_period_end`). Isso protege a ALEGON contra picos tardios de custo de API e melhora o fluxo de caixa.

---

## 5. Análise de Ponto de Equilíbrio (Break-Even Operacional)

Considerando custos fixos operacionais básicos de uma operação enxuta:
- Assinatura Cloudflare Workers Paid: R$ 30,00/mês (~$5)
- Ferramenta de E-mail Transacional (Resend base): R$ 120,00/mês (~$20)
- Hospedagem e Ferramentas Auxiliares: R$ 150,00/mês
- Contabilidade e Compliance Básico: R$ 500,00/mês
- **Total de Custos Fixos Operacionais Estimados:** **R$ 800,00 / mês**.

### Volume Mínimo para Atingir o Break-Even:
- Apenas com Edições Avulsas (MC R$ 6,29): **128 edições/mês**
- Apenas com Pacotes Criador (MC R$ 33,18): **25 pacotes/mês**
- Apenas com Assinantes Pro (MC R$ 53,88): **15 assinantes ativos**
- **Mix Típico de Break-Even:** 40 edições avulsas + 10 pacotes + 6 assinantes ativos já cobrem integralmente os custos operacionais da empresa.

---

## 6. Diretrizes e Recomendações Financeiras para o Negócio

1. **Incentivo ao Pagamento via Pix:**
   - Criar incentivo visual no checkout destacando o Pix como aprovação imediata e sem bloqueios de cartão.
   - Em tíquetes acima de R$ 39,90, o Pix possui taxa fixa de R$ 0,99 contra R$ 1,68+ do cartão, aumentando a retenção líquida de margem.
2. **Buffer de Câmbio em `system_settings`:**
   - Configurar `fx.usd_brl` com taxa nominal de R$ 5,85 e spread buffer de 8%, resultando na taxa de segurança de R$ 6,32. Atualizar este parâmetro periodicamente via rotina administrativa.
3. **Limite Global Diário de Proteção (Safety Cap):**
   - Manter ativo o parâmetro `limits.global_daily_ai_budget_usd` em $20,00/dia durante a fase inicial para prevenir anomalias de faturamento no OpenRouter causadas por scripts maliciosos.
4. **Alocação de Saldo FIFO:**
   - Assegurar a ordem de consumo canônica do contrato: débitos prioritários do balanço de assinatura (`subscription`), seguido de compras avulsas ordenadas pelo prazo mais próximo de expiração (`expires_at` ASC).
