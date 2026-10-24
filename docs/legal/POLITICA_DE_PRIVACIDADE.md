# POLÍTICA DE PRIVACIDADE E PROTEÇÃO DE DADOS PESSOAIS
**ALEGON AI Photo Studio — ALEGON Marketing & Tecnologia**
*Versão 2026-10 — Vigência a partir de Outubro de 2026*

---

### 1. Compromisso com a Privacidade e a LGPD
A **ALEGON Marketing & Tecnologia** ("ALEGON", "nós", "nosso"), na qualidade de Controladora de Dados Pessoais nos termos da Lei Geral de Proteção de Dados Pessoais (Lei Federal nº 13.709/2018 — "LGPD"), assume o compromisso irrevogável com a segurança, confidencialidade e respeito aos direitos fundamentais de privacidade e autodeterminação informativa dos usuários ("você", "Titular") da plataforma SaaS **ALEGON AI Photo Studio**.

Esta Política de Privacidade descreve de forma transparente quais dados coletamos, como os utilizamos, com quem compartilhamos, como os protegemos e como você pode exercer seus direitos legais.

---

### 2. Princípios Fundamentais (Privacy by Design e by Default)
Nossa arquitetura técnica foi concebida sob os princípios de *Privacy by Design* e *Privacy by Default*:
1. **Minimização Estrita (Art. 6º, III):** Coletamos apenas os dados estritamente necessários para autenticação, processamento das edições fotográficas e faturamento. Não exigimos CPF no cadastro inicial; o CPF/CNPJ é solicitado unicamente no momento do checkout para emissão de cobrança e notas fiscais pelo gateway de pagamentos parceiro.
2. **Não Utilização para Treinamento de Modelos:** **Suas fotografias, originais ou editadas, NUNCA são utilizadas para treinar, aprimorar ou alimentar modelos próprios ou de terceiros de inteligência artificial.** As requisições de edição utilizam provedores configurados com retenção zero de dados (*Zero Data Retention* - ZDR) e negação explícita de coleta (`provider.data_collection: 'deny'`).
3. **Isolamento de Acesso e Sigilo:** Fotografias são armazenadas em *buckets* privados (Cloudflare R2) sem acesso público. Todo acesso exige token temporário assinado criptograficamente (HMAC-SHA256) vinculado à sessão do usuário autenticado. Colaboradores ou administradores da ALEGON **não visualizam suas imagens privadas**.
4. **Ciclo de Retenção de 90 Dias:** Toda imagem e suas versões derivadas são excluídas de forma automatizada e irrecuperável após 90 (noventa) dias de sua criação, garantindo que dados visuais não permaneçam indefinidamente em nossos servidores.

---

### 3. Dados Pessoais Coletados e Finalidades

| Categoria de Dado | Dados Específicos | Finalidade | Base Legal (Art. 7º LGPD) |
|---|---|---|---|
| **Identificação e Cadastro** | E-mail, Senha (criptografada via PBKDF2), Nome completo | Criação e gestão da conta, autenticação, recuperação de acesso e comunicação de serviço. | Execução de Contrato (Art. 7º, V) |
| **Fotografias e Comandos** | Imagens enviadas (JPG, PNG, WebP) e prompts de texto | Processamento da edição fotográfica solicitada pelo usuário via modelos de IA. | Execução de Contrato (Art. 7º, V) |
| **Faturamento e Pagamentos** | Nome, CPF/CNPJ, Telefone, Histórico de compras, Identificador Asaas | Emissão de cobranças (Pix/Cartão), liberação de créditos, prevenção a fraudes e cumprimento fiscal. | Execução de Contrato (Art. 7º, V) e Obrigação Legal/Fiscal (Art. 7º, II) |
| **Dados de Navegação e Conexão** | Hash de IP (SHA-256), User-Agent, carimbos de data/hora de login | Segurança da aplicação, prevenção a abusos (*rate-limiting*) e cumprimento do Art. 15 do Marco Civil da Internet. | Obrigação Legal (Art. 7º, II) e Legítimo Interesse (Art. 7º, IX) |

---

### 4. Compartilhamento de Dados com Operadores Homologados

Para prestar os serviços com alta disponibilidade e confiabilidade, compartilhamos dados apenas com os seguintes operadores essenciais, todos submetidos a rigorosos acordos de processamento de dados (DPA):

1. **Cloudflare Inc. (EUA/Global):** Hospedagem de computação de borda (Workers), banco de metadados (Cloudflare D1) e armazenamento seguro de objetos privados (Cloudflare R2). As transferências internacionais são fundamentadas em Cláusulas-Padrão Contratuais conforme a Resolução CD/ANPD nº 19/2024 e o Art. 33 da LGPD.
2. **OpenRouter Inc. e Provedores Homologados (EUA):** Roteador de modelos multimodais de inteligência artificial. Apenas a imagem a ser editada e as instruções em linguagem natural são transmitidas via canal cifrado (TLS 1.3), com parâmetro obrigatório de negação de coleta de dados de treinamento.
3. **Asaas Gestão Financeira Instituição de Pagamento S.A. (Brasil):** Gateway oficial de pagamentos responsável pelo processamento de Pix e pagamentos com cartão, gestão de cobranças e assinaturas.
4. **Provedor de E-mail Transacional (Resend / SMTP):** Envio de e-mails estritamente transacionais (confirmação de e-mail, redefinição de senha e alertas de retenção de 90 dias).

---

### 5. Retenção e Descarte Seguro de Dados

* **Fotografias e Versões:** Mantidas por até **90 (noventa) dias** a partir da data de upload ou geração. O usuário pode realizar o download a qualquer momento ou solicitar a **exclusão antecipada imediata**, que remove permanentemente os binários do R2.
* **Dados de Cadastro:** Mantidos enquanto durar a relação contratual ou até solicitação de exclusão de conta.
* **Registros de Transações Financeiras:** Retidos pelo prazo prescricional de **5 (cinco) anos**, em cumprimento ao Código Tributário Nacional e à legislação fiscal vigente.
* **Logs de Acesso:** Mantidos pelo prazo obrigatório de **6 (seis) meses**, em estrito cumprimento ao Art. 15 da Lei Federal nº 12.965/2014 (Marco Civil da Internet).

---

### 6. Direitos do Titular (Art. 18 da LGPD)
Você possui os seguintes direitos garantidos pela LGPD, que podem ser exercidos diretamente no painel da sua conta ou via contato com o Encarregado de Proteção de Dados (DPO):
* **Confirmação e Acesso:** Saber se tratamos seus dados e acessar uma cópia estruturada.
* **Portabilidade e Exportação:** Exportação completa de seus dados pessoais em formato legível por máquina (JSON) disponível em `/conta`.
* **Correção:** Retificação de dados incompletos, inexatos ou desatualizados.
* **Eliminação:** Solicitação de exclusão definitiva de fotografias e da própria conta de usuário.
* **Revogação do Consentimento:** Para comunicações promocionais e informativas a qualquer tempo.

---

### 7. Segurança da Informação
Adotamos medidas técnicas e administrativas robustas para proteger seus dados contra acessos não autorizados, vazamentos, destruição ou perda acidental:
- Criptografia em trânsito (HTTPS / TLS 1.3 obrigatório com HSTS) e em repouso.
- Senhas protegidas com derivação de chave lenta PBKDF2-SHA256 (100.000 iterações com salt criptográfico único).
- Autenticação Multifator (MFA TOTP) baseada em RFC 6238 para funções administrativas.
- Bloqueio progressivo de IP e conta contra ataques de força bruta e injeções.
- Prevenção ativa contra ataques OWASP Top 10 (CSRF, XSS com Content Security Policy estrita, isolamento de recursos).

---

### 8. Canal de Contato do Encarregado de Proteção de Dados (DPO)
Para exercer seus direitos de titular, tirar dúvidas ou registrar solicitações sobre o tratamento de seus dados pessoais, entre em contato com nosso Encarregado pelo canal oficial:
* **Encarregado (DPO):** Comitê de Privacidade e Segurança da ALEGON
* **E-mail de Contato:** `privacidade@alegon.com.br`
* **Controlador:** ALEGON Marketing & Tecnologia
* **Endereço:** São Paulo/SP, Brasil
