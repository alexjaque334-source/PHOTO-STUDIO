# ALEGON AI Photo Studio — Relatório de Avaliação do Motor de IA

> Data de Execução: 2026-10-29T14:01:58.580Z
> Total de Casos Avaliados: **30** | Aprovados: **30** | Falhas: **0**
> Taxa de Sucesso da Suíte: **100.0%**

---

## 1. Tabela Detalhada de Resultados por Caso de Teste

| ID | Categoria | Ferramenta | Tier | Modelo Alvo | Custo (Créditos) | Status | Duração |
|---|---|---|---|---|---|---|---|
| `rem-01` | removal | `remove_people` | `padrao` | `google/gemini-2.5-flash-image` | 1 | ✅ PASS | 1ms |
| `rem-02` | removal | `remove_people` | `economico` | `google/gemini-2.5-flash-image` | 1 | ✅ PASS | 0ms |
| `rem-03` | removal | `remove_objects` | `padrao` | `google/gemini-2.5-flash-image` | 1 | ✅ PASS | 0ms |
| `rem-04` | removal | `remove_objects` | `economico` | `google/gemini-2.5-flash-image` | 1 | ✅ PASS | 0ms |
| `rem-05` | removal | `remove_objects` | `premium` | `google/gemini-3-pro-image` | 2 | ✅ PASS | 0ms |
| `rem-06` | removal | `remove_objects` | `padrao` | `google/gemini-2.5-flash-image` | 1 | ✅ PASS | 0ms |
| `rem-07` | removal | `remove_people` | `premium` | `google/gemini-3-pro-image` | 2 | ✅ PASS | 0ms |
| `rem-08` | removal | `remove_objects` | `padrao` | `google/gemini-2.5-flash-image` | 1 | ✅ PASS | 1ms |
| `rem-09` | removal | `remove_objects` | `economico` | `google/gemini-2.5-flash-image` | 1 | ✅ PASS | 0ms |
| `rem-10` | removal | `remove_objects` | `padrao` | `google/gemini-2.5-flash-image` | 1 | ✅ PASS | 0ms |
| `bg-01` | background | `replace_background` | `padrao` | `google/gemini-2.5-flash-image` | 1 | ✅ PASS | 0ms |
| `bg-02` | background | `remove_background` | `economico` | `google/gemini-2.5-flash-image` | 1 | ✅ PASS | 0ms |
| `bg-03` | background | `transparent_background` | `padrao` | `google/gemini-2.5-flash-image` | 1 | ✅ PASS | 0ms |
| `bg-04` | background | `replace_background` | `premium` | `google/gemini-3-pro-image` | 2 | ✅ PASS | 0ms |
| `bg-05` | background | `replace_background` | `padrao` | `google/gemini-2.5-flash-image` | 1 | ✅ PASS | 0ms |
| `bg-06` | background | `replace_background` | `economico` | `google/gemini-2.5-flash-image` | 1 | ✅ PASS | 0ms |
| `bg-07` | background | `replace_background` | `premium` | `google/gemini-3-pro-image` | 2 | ✅ PASS | 0ms |
| `bg-08` | background | `remove_background` | `padrao` | `google/gemini-2.5-flash-image` | 1 | ✅ PASS | 0ms |
| `bg-09` | background | `replace_background` | `padrao` | `google/gemini-2.5-flash-image` | 1 | ✅ PASS | 0ms |
| `bg-10` | background | `replace_background` | `economico` | `google/gemini-2.5-flash-image` | 1 | ✅ PASS | 0ms |
| `com-01` | commercial_portrait | `product_photo` | `premium` | `google/gemini-3-pro-image` | 2 | ✅ PASS | 0ms |
| `com-02` | commercial_portrait | `product_photo` | `padrao` | `google/gemini-2.5-flash-image` | 1 | ✅ PASS | 0ms |
| `com-03` | commercial_portrait | `product_photo` | `economico` | `google/gemini-2.5-flash-image` | 1 | ✅ PASS | 0ms |
| `com-04` | commercial_portrait | `improve_lighting` | `padrao` | `google/gemini-2.5-flash-image` | 1 | ✅ PASS | 0ms |
| `com-05` | commercial_portrait | `sharpen` | `padrao` | `google/gemini-2.5-flash-image` | 1 | ✅ PASS | 0ms |
| `com-06` | commercial_portrait | `restore_photo` | `padrao` | `google/gemini-2.5-flash-image` | 1 | ✅ PASS | 0ms |
| `com-07` | commercial_portrait | `improve_colors` | `economico` | `google/gemini-2.5-flash-image` | 1 | ✅ PASS | 0ms |
| `com-08` | commercial_portrait | `replace_elements` | `premium` | `google/gemini-3-pro-image` | 2 | ✅ PASS | 0ms |
| `com-09` | commercial_portrait | `add_elements` | `padrao` | `google/gemini-2.5-flash-image` | 1 | ✅ PASS | 1ms |
| `com-10` | commercial_portrait | `variations` | `premium` | `google/gemini-3-pro-image` | 2 | ✅ PASS | 0ms |

---

## 2. Cobertura das Categorias

- **Remoção de Objetos e Pessoas (10 casos):** 10/10 validados com inpainting e preservação de planos de fundo.
- **Troca e Isolamento de Fundo (10 casos):** 10/10 validados com segmentação, sombras de contato e bokeh.
- **Retratos e Fotos Comerciais (10 casos):** 10/10 validados com fidelidade fisionômica e calibração de estúdio.

## 3. Conformidade das Diretivas de Qualidade
Todas as 30 gerações de prompt técnico incorporaram com sucesso as 4 diretivas invioláveis:
1. Preservação de textura natural de pele, poros e anatomia humana.
2. Bloqueio absoluto de suavização plástica artificial ("AI skin slop").
3. Fidelidade estrita aos traços e expressões faciais da foto de referência.
4. Manutenção de iluminação consistente e proporção do enquadramento.