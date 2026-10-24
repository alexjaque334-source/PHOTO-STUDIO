# MAPA DE BASES LEGAIS E FINALIDADES (LGPD ART. 7º)
**ALEGON AI Photo Studio — ALEGON Marketing & Tecnologia**

Este documento formaliza a matriz de operações de tratamento de dados pessoais, identificando as finalidades legítimas, as categorias de dados e a respectiva fundamentação jurídica segundo a Lei nº 13.709/2018 (LGPD).

| Atividade de Tratamento | Dados Coletados | Titulares | Finalidade Específica | Base Legal Primária (LGPD) | Prazo de Retenção |
|---|---|---|---|---|---|
| **Criação de Conta e Acesso** | E-mail, Hash de Senha (PBKDF2), Nome Completo | Usuários cadastrados | Permitir acesso à plataforma, autenticação de sessão e comunicação de serviço. | **Execução de Contrato** (Art. 7º, V) | Enquanto a conta estiver ativa ou até exclusão solicitada. |
| **Edição e Processamento de Imagens** | Fotografias enviadas e prompts em linguagem natural | Usuários do editor | Executar as operações de modificação visual solicitadas pelo usuário via modelos de IA. | **Execução de Contrato** (Art. 7º, V) | **90 dias** a partir da criação (ou exclusão imediata pelo usuário). |
| **Faturamento e Cobrança** | Nome, CPF/CNPJ, Telefone, Identificador do cliente Asaas, Histórico financeiro | Clientes pagantes | Emissão de cobranças (Pix e Cartão), concessão de créditos, prevenção à fraude financeira e emissão de notas fiscais. | **Execução de Contrato** (Art. 7º, V) e **Cumprimento de Obrigação Legal/Fiscal** (Art. 7º, II) | **5 anos** após o término do exercício fiscal (Art. 173 CTN). |
| **Segurança e Prevenção a Ataques** | Hash criptográfico de IP (SHA-256 + salt), User-Agent, tentativas de login, logs de auditoria | Todos os visitantes e usuários | Proteção contra ataques de força bruta, rate-limiting, detecção de abuso e integridade dos sistemas. | **Legítimo Interesse** (Art. 7º, IX) e **Proteção ao Crédito/Segurança** | **6 meses** para logs de conexão (Art. 15 Marco Civil da Internet). |
| **Comunicações Transacionais de Retenção** | E-mail e histórico de expiração de imagens | Usuários com arquivos ativos | Alertar com antecedência (7 dias e 1 dia) sobre a exclusão programada de imagens após 90 dias. | **Execução de Contrato** (Art. 7º, V) | Até a conclusão da exclusão ou purga da imagem. |
| **Controle de Sessões e MFA** | Segredo TOTP criptografado (AES-GCM), códigos de recuperação | Administradores e Usuários com MFA | Garantir a segurança estrita do painel de controle e prevenir acessos não autorizados. | **Cumprimento de Obrigação de Segurança** (Art. 46 LGPD c/c Art. 7º, V) | Enquanto o segundo fator estiver habilitado. |
| **Exportação de Dados (Portabilidade)** | Relatório consolidado em JSON dos dados do usuário | Titular requerente | Atendimento aos direitos expressos do titular previstos no Art. 18, V da LGPD. | **Cumprimento de Obrigação Legal** (Art. 7º, II c/c Art. 18 LGPD) | Gerado sob demanda e descartado imediatamente após download. |

---

### Teste de Balanceamento de Legítimo Interesse (LIA)
Para os tratamentos fundamentados no Art. 7º, IX (segurança da informação e taxa limite de requisições):
1. **Legitimidade:** Proteger a infraestrutura compartilhada contra negação de serviço e ataques automatizados de credenciais.
2. **Necessidade:** O armazenamento de hash do IP por janelas de tempo limitadas é a medida estritamente necessária para contabilizar requisições sem identificar permanentemente o usuário.
3. **Balanceamento e Salvaguardas:** O IP real nunca é armazenado em texto claro nas tabelas de rate limit; apenas o hash criptográfico com rotação de sessão é utilizado.
