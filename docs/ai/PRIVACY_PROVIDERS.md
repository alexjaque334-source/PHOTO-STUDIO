# ALEGON AI Photo Studio — Privacidade e Retenção de Dados nos Provedores (ZDR / LGPD)

> Documento canônico sobre conformidade LGPD, políticas de retenção e governança de dados no tráfego com OpenRouter e provedores de inferência de IA.
> Dono: Especialista OpenRouter / ALEGON Marketing & Tecnologia.

---

## 1. Princípios Fundamentais de Privacidade

No ALEGON AI Photo Studio, a privacidade dos titulares e a proteção de suas fotos pessoais ou comerciais são prioritárias. O processamento com IA segue regras invioláveis de minimização e segurança:

1. **Imagens nunca são públicas:** Nenhum link público ou bucket público é utilizado.
2. **Nenhuma imagem trafega pelo cliente para a IA:** O navegador conversa exclusivamente com nosso backend seguro (Cloudflare Worker). As chaves de API (`OPENROUTER_API_KEY`) residem restritas nas variáveis criptografadas do ambiente do Worker.
3. **Imagens e prompts nunca são gravados em logs:** As tabelas de auditoria (`audit_logs`) e uso (`openrouter_usage`) gravam apenas metadados técnicos (tokens, latência em ms, custo em micro-dólares, modelo e IDs de job). Binários de imagem, dados base64 e dados pessoais sensíveis são estritamente excluídos dos logs.
4. **Zero Data Retention (ZDR):** Aplicamos configurações explícitas para garantir que nem o OpenRouter nem os provedores de computação (Google, Fal, Baseten, Together, etc.) retenham imagens ou utilizem as submissões dos usuários para treinamento de novos modelos fundamentais.

---

## 2. Camadas de Retenção no OpenRouter

### 2.1 Camada da Plataforma OpenRouter
* **Comportamento Padrão:** Por padrão, o OpenRouter atua como um proxy seguro e **não armazena** prompts nem os conteúdos gerados em disco. O fluxo é transmitido em trânsito de volta à aplicação.
* **Logging de Observabilidade:** As opções de *Private Input & Output Logging* e *Training Opt-in* são mantidas desativadas nas configurações globais da organização ALEGON no OpenRouter.
* **Parâmetros de Requisição Enviados pelo Backend ALEGON:**
  Toda requisição feita pelo nosso cliente backend injeta explicitamente no corpo JSON:
  ```json
  {
    "provider": {
      "data_collection": "deny",
      "zdr": true
    }
  }
  ```
  Isso instrui o roteador do OpenRouter a descartar qualquer endpoint secundário que não ofereça garantia formal de Zero Data Retention.

### 2.2 Camada dos Provedores de Inferência (Model Labs)
A tabela abaixo lista os provedores integrados no ALEGON e suas políticas de retenção:

| Provedor / Endpoint | Suporte a ZDR | Treinamento com Dados do Usuário | Política de Retenção de Imagens |
|---|---|---|---|
| **Google Cloud (Vertex AI / Imagen)** | Sim (Enterprise ZDR) | Não permitido em contas corporativas/API | Dados retidos apenas na memória transitória durante a inferência (stateless) |
| **Black Forest Labs (Fal.ai / Baseten)** | Sim | Não treina em payloads de API | Descarte imediato pós-renderização |
| **OpenAI (via OpenRouter Enterprise)** | Sim | Isento de treino (API Terms §3) | Retenção temporária transitória para filtragem de abuso antes de expurgo automático |

---

## 3. Conformidade com a LGPD (Lei 13.709/2018)

1. **Finalidade Específica (Art. 6º, I):** O processamento de imagem pela IA ocorre única e exclusivamente para atender à ordem do usuário (execução de contrato, Art. 7º, V).
2. **Necessidade e Minimização (Art. 6º, III):** Apenas os dados visuais e as instruções de texto estritamente necessárias para a edição solicitada são transmitidos ao OpenRouter.
3. **Segurança Técnica (Art. 46):** Toda a comunicação entre o Cloudflare Worker e os servidores do OpenRouter é realizada sobre canal criptografado HTTPS/TLS 1.3 com autenticação via Bearer token de alta entropia.
4. **Exclusão Antecipada e Direito ao Esquecimento:** Caso o usuário solicite a exclusão de uma imagem ou encerramento da conta, os arquivos no R2 são expurgados imediatamente. O provedor de IA já não retém dados persistentes por força do ZDR.

---

## 4. Referências e Diretrizes

1. OpenRouter Privacy Policy & ZDR Settings: [https://openrouter.ai/docs#privacy](https://openrouter.ai/docs#privacy)
2. OpenRouter Provider Routing & Data Collection Flags: [https://openrouter.ai/docs#provider-routing](https://openrouter.ai/docs#provider-routing)
3. Google Cloud Vertex AI Data Governance & Privacy: [https://cloud.google.com/vertex-ai/docs/generative-ai/data-governance](https://cloud.google.com/vertex-ai/docs/generative-ai/data-governance)
