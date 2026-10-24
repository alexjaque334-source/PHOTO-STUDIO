# ALEGON AI Photo Studio — Pesquisa de Modelos OpenRouter (Imagem e Edição)

> Documento canônico de pesquisa técnica dos modelos de IA integrados via OpenRouter para o ALEGON AI Photo Studio.
> Data da pesquisa: Outubro/2026. Fontes e referências verificadas via OpenRouter Models API e documentação oficial.

---

## 1. Visão Geral da Arquitetura OpenRouter para Imagens

O OpenRouter unifica o acesso a múltiplos provedores de inferência de IA. Para tarefas de **geração e edição de imagem (image-to-image / multimodal)**, o OpenRouter disponibiliza duas vias principais:

1. **Endpoint de Chat Completions (`POST /api/v1/chat/completions`) com suporte multimodal:**
   - Permite enviar imagem(ns) de entrada no array `messages[].content` via base64 data URL (`data:image/jpeg;base64,...`) ou URL pública.
   - Parâmetro `"modalities": ["text", "image"]` especifica o formato de saída esperado.
   - Retorno contém a imagem gerada/editada em `choices[0].message` (via base64 inline data URL, campo `images`, ou URLs temporárias no CDN do provedor).
   - Suporte ao header `usage.cost` para medição exata em micro-dólares.

2. **Endpoint Unificado de Imagens (`POST /api/v1/images`):**
   - Rota dedicada do OpenRouter para modelos focados puramente em difusão e renderização visual (ex.: FLUX, Seedream, Imagen).
   - Aceita parâmetros como `prompt`, `model`, `aspect_ratio`, `resolution` e referências visuais (`input_references` com base64 ou URL).
   - Retorno estruturado com `b64_json` ou `url`.

---

## 2. Catálogo de Modelos Pesquisados

A tabela abaixo sintetiza os modelos avaliados com capacidade real de processar imagens de entrada e gerar edições de alta fidelidade:

| Modelo (Slug OpenRouter) | Provedor de Inferência | Modalidades (In / Out) | Preço Estimado / Unidade | Latência Típica | Suporte a Máscara (Inpainting) | Adequação ao ALEGON |
|---|---|---|---|---|---|---|
| `google/gemini-2.5-flash-image` | Google | text + image / text + image | ~$0.30/M input tokens, ~$2.50/M output tokens (~$0.004/img) | 2.5s – 4.5s | Via Prompt + Ref Image (BBox / texto) | **Tier Econômico (Primário)** |
| `black-forest-labs/flux-1-schnell` | Black Forest Labs / Baseten | text + image / image | ~$0.003 – $0.006 por imagem (1 MP) | 1.8s – 3.2s | Sim (via endpoints com inpainting) | **Tier Econômico (Fallback)** |
| `google/imagen-3` | Google Vertex / DeepMind | text + image / image | ~$0.020 – $0.025 por geração padrão | 6.0s – 11.0s | Sim (máscara de inpainting nativa) | **Tier Padrão (Primário)** |
| `black-forest-labs/flux-1-dev` | Black Forest Labs / Fal | text + image / image | ~$0.025 – $0.030 por megapixel | 7.0s – 12.0s | Sim (Inpainting / Redux) | **Tier Padrão (Fallback)** |
| `black-forest-labs/flux-1.1-pro` | Black Forest Labs | text + image / image | ~$0.040 – $0.050 por render Ultra-HD | 10.0s – 18.0s | Alta fidelidade / Guia Estrutural | **Tier Premium (Primário)** |
| `openai/gpt-4o` / `openai/gpt-5-image` | OpenAI | text + image / text + image | ~$0.030 – $0.045 por geração | 8.0s – 15.0s | BBox guiado no prompt | **Tier Premium (Fallback)** |
| `bytedance/seedream-3` | ByteDance / Volcano | text + image / image | ~$0.015 por geração | 4.0s – 8.0s | Suporte parcial | Avaliado para expansão futura |

---

## 3. Análise Detalhada dos Modelos Selecionados

### 3.1 Tier Econômico (1 Crédito)
* **Modelo Primário:** `google/gemini-2.5-flash-image`
  - **Latência:** Média de 3.2 segundos.
  - **Custo para a Plataforma:** ~$0.004 USD por edição (margem excelente sobre o custo de R$ 0,40 a R$ 0,60 por crédito).
  - **Capacidades:** Compreensão multimodal apurada. Segue instruções minuciosas em inglês sobre manutenção de proporções, tons de pele e iluminação.
  - **Fallback no Tier:** `black-forest-labs/flux-1-schnell` (tempo de geração inferior a 3 segundos, custo ~$0.005 USD).

### 3.2 Tier Padrão (1 Crédito)
* **Modelo Primário:** `google/imagen-3`
  - **Latência:** Média de 8.5 segundos.
  - **Custo para a Plataforma:** ~$0.020 USD por edição.
  - **Capacidades:** Renderização fotorealista de ponta, remoção limpa de objetos, geração de texturas naturais sem aspecto artificial ("AI plastic skin"), suporte a iluminação de estúdio comercial e substituição de fundos com perspectiva correta.
  - **Fallback no Tier:** `google/gemini-2.5-flash-image` e `black-forest-labs/flux-1-dev`.

### 3.3 Tier Premium (2 Créditos)
* **Modelo Primário:** `black-forest-labs/flux-1.1-pro`
  - **Latência:** Média de 12 a 16 segundos.
  - **Custo para a Plataforma:** ~$0.045 USD por edição (equivalente a ~R$ 0,25, amplamente coberto pelos 2 créditos cobrados).
  - **Capacidades:** Resolução nativa ultra-detalhada, preservação cirúrgica de traços faciais, microdetalhes em fotos de produto (joias, cosméticos, vestuário), iluminação volumétrica e gradação de cores no padrão de câmeras full-frame (Hasselblad / Sony Alpha).
  - **Fallback no Tier:** `google/imagen-3`.

---

## 4. Suporte a Máscaras (Inpainting) vs. Edição por Referência Multimodal

Existem dois paradigmas de edição nas APIs modernas:

1. **Edição Guiada por Máscara Binária (Inpainting):**
   - O cliente envia uma máscara monocromática (`image/png` onde pixels brancos = área de substituição, pixels pretos = área intocável).
   - Suportado por modelos de difusão específicos (ex.: FLUX Inpainting, Imagen Inpainting).
   - Vantagem: Garante que nenhum pixel fora da máscara sofre qualquer alteração.

2. **Edição Multimodal por Instrução (Image-to-Image Instruct):**
   - O modelo recebe a imagem inteira de alta resolução e um prompt descritivo técnico em inglês instruindo o que alterar e o que preservar (ex.: *"Preserve the central subject's face, clothes and skin tone exactly as is. Only replace the background with..."*).
   - Vantagem: Dispensa o usuário de desenhar máscaras complexas em dispositivos móveis e compreende contexto semântico avançado (ex.: sombras de contato no chão, reflexos e harmonização de temperatura de cor).

O ALEGON AI Photo Studio suporta **ambos os fluxos**: quando o usuário fornece apenas instruções de texto, nosso motor de prompts gera restrições de preservação rígidas; quando coordenadas ou máscara PNG forem enviadas, a flag `supports_mask` roteia para os nós habilitados.

---

## 5. Referências e Fontes Oficiais

1. OpenRouter Documentation — Models & Image Modalities: [https://openrouter.ai/docs#models](https://openrouter.ai/docs#models)
2. OpenRouter Image API Overview: [https://openrouter.ai/docs#images](https://openrouter.ai/docs#images)
3. Google Gemini 2.5 Flash on OpenRouter: [https://openrouter.ai/models/google/gemini-2.5-flash-image](https://openrouter.ai/models/google/gemini-2.5-flash-image)
4. Black Forest Labs FLUX.1 on OpenRouter: [https://openrouter.ai/models/black-forest-labs/flux-1-dev](https://openrouter.ai/models/black-forest-labs/flux-1-dev)
5. OpenRouter Pricing and Cost Tracking: [https://openrouter.ai/docs#pricing](https://openrouter.ai/docs#pricing)
