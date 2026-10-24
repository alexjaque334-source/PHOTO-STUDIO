# AVALIAÇÃO DE FORNECEDORES E TRANSFERÊNCIA INTERNACIONAL DE DADOS
**ALEGON AI Photo Studio — ALEGON Marketing & Tecnologia**

Este documento detalha os operadores terceirizados integrados à plataforma, suas finalidades técnicas, localização geográfica de servidores e os mecanismos de conformidade com o **Artigo 33 da LGPD** e a **Resolução CD/ANPD nº 19/2024** (Regulamento de Transferências Internacionais de Dados).

---

### 1. Inventário de Operadores e Serviços

| Fornecedor / Razão Social | Papel Técnico | Sede / Jurisdição | Dados Tratados | Salvaguardas Jurídicas |
|---|---|---|---|---|
| **Cloudflare, Inc.** | Infraestrutura de borda (Workers, D1, R2, Queues) | Estados Unidos | Metadados de requisição, metadados de banco D1 e binários de fotografias em R2. | DPA formal com **Cláusulas-Padrão Contratuais (SCC)**; certificações SOC 2 Tipo II, ISO 27001 e ISO 27701. |
| **OpenRouter, Inc.** | Roteamento de modelos de IA (Google, Anthropic, Meta, Black Forest Labs) | Estados Unidos | Imagens a serem editadas e prompts de texto. | Negação explícita de retenção (`provider.data_collection: 'deny'`) e política de Zero Data Retention (ZDR); transmissão estritamente sob TLS 1.3. |
| **Asaas Gestão Financeira Inst. de Pagamento S.A.** | Gateway de pagamentos (Pix e Cartão) | Joinville/SC, Brasil | Nome, CPF/CNPJ, e-mail, telefone e valores cobrados. | Empresa brasileira regulada pelo Banco Central do Brasil; conformidade direta com a LGPD e padrão PCI-DSS. |
| **Resend, Inc.** | Disparo de e-mails transacionais | Estados Unidos | E-mail do destinatário e links de confirmação/reset. | DPA assinado com Cláusulas-Padrão; retenção de logs de entrega limitada a 30 dias. |

---

### 2. Tratamento de Imagens pelo OpenRouter e Provedores de IA
Um dos pilares de conformidade da ALEGON AI Photo Studio é a garantia de que as fotografias de usuários **não sejam retidas para fins de treino de IA**.
1. **Controle de Roteamento de Dados:** Cada requisição enviada ao OpenRouter inclui a diretiva obrigatória:
   ```json
   {
     "provider": {
       "data_collection": "deny",
       "zdr": true
     }
   }
   ```
2. **Isolamento de Credenciais:** As chaves de API residem exclusivamente nas variáveis secretas do Cloudflare Worker (`OPENROUTER_API_KEY`). O frontend jamais tem visibilidade sobre credenciais ou endpoints diretos dos provedores.

---

### 3. Transferência Internacional de Dados (Art. 33 LGPD)
O tráfego de dados para a Cloudflare e OpenRouter nos Estados Unidos é legitimado pelo inciso II do Artigo 33 da LGPD, amparado por cláusulas-padrão contratuais compatíveis com a regulamentação expedida pela Autoridade Nacional de Proteção de Dados (ANPD).
