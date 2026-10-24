# RELATÓRIO DE IMPACTO À PROTEÇÃO DE DADOS PESSOAIS (RIPD)
**ALEGON AI Photo Studio — ALEGON Marketing & Tecnologia**
*Conforme Art. 38 da Lei nº 13.709/2018 (LGPD) e orientações da ANPD*

---

### 1. Identificação do Controlador e do Projeto
* **Controlador:** ALEGON Marketing & Tecnologia
* **Produto:** ALEGON AI Photo Studio (Plataforma SaaS de edição de fotografias por IA)
* **Finalidade Geral:** Permitir a edição profissional de imagens de usuários através de processamento em nuvem com modelos de IA de terceiros e cobrança via Asaas.
* **Data da Avaliação:** Outubro de 2026

---

### 2. Descrição do Fluxo de Dados e Ciclo de Vida
1. **Coleta e Upload:** O usuário faz upload de fotografia (JPEG/PNG/WebP). O backend valida os cabeçalhos e grava o binário no Cloudflare R2 em pasta isolada por usuário (`u/{userId}/i/{imageId}/...`).
2. **Processamento:** O usuário submete um prompt. O sistema despacha a imagem para o OpenRouter através de canal seguro (TLS 1.3), exigindo parâmetro de não-retenção.
3. **Retorno e Armazenamento:** A imagem resultante é validada, armazenada no R2 como uma nova versão independente, e associada a um carimbo de expiração de 90 dias.
4. **Faturamento:** O processamento consome créditos da carteira. Transações financeiras trafegam diretamente entre o usuário e o Asaas.

---

### 3. Análise dos Riscos Identificados e Medidas Mitigadoras

| Risco Identificado | Gravidade / Probabilidade | Medidas de Salvaguarda Implementadas | Risco Residual |
|---|---|---|---|
| **Acesso não autorizado a imagens de terceiros (IDOR)** | Alta / Baixa | Nenhuma imagem é servida publicamente. URLs exigem token assinado criptograficamente (HMAC-SHA256) com validade máxima de 5 minutos, validando o ID do usuário na sessão. | **Muito Baixo** |
| **Utilização indevida de fotos para treino de modelos de IA** | Muito Alta / Baixa | Cláusula contratual e cabeçalho `provider.data_collection: 'deny'` com Zero Data Retention ativado no OpenRouter. Nenhuma foto é usada para treino próprio. | **Baixo** |
| **Envio de arquivos maliciosos ou executáveis disfarçados** | Alta / Média | Validação em profundidade dos magic bytes do arquivo, cálculo de dimensões máximas (40 MP) e limite de tamanho (15 MB), rejeitando polyglots HTML/SVG. | **Muito Baixo** |
| **Vazamento de credenciais de gateway de pagamento** | Alta / Baixa | Utilização exclusiva de links de fatura hospedados pelo Asaas para cartão de crédito. Nenhum número de cartão passa pelos servidores da ALEGON (fora de escopo PCI). | **Inexistente** |
| **Retenção perpétua desnecessária de fotos** | Média / Baixa | Purga automática executada diariamente por Cron Trigger aos 90 dias e opção de exclusão imediata pelo usuário. | **Inexistente** |
| **Ataques de força bruta contra contas de usuários** | Média / Média | Senhas derivadas com PBKDF2-SHA256 (100k iterações), rate limiting com hash de IP e bloqueio progressivo após 5 falhas consecutivas. | **Muito Baixo** |

---

### 4. Conclusão do Encarregado
O projeto ALEGON AI Photo Studio adota salvaguardas técnicas adequadas e proporcionais ao risco, cumprindo integralmente as exigências da LGPD e as normas correlatas. O tratamento de dados pessoais é lícito, transparente e seguro.
