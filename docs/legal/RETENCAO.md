# POLÍTICA DE RETENÇÃO E CICLO DE VIDA DE DADOS (90 DIAS)
**ALEGON AI Photo Studio — ALEGON Marketing & Tecnologia**

Este documento detalha o funcionamento técnico e legal da retenção de dados, descarte seguro e rotinas de purga na ALEGON AI Photo Studio.

---

### 1. Política de Retenção de Fotografias (90 Dias)

Toda imagem enviada para a plataforma (versão original) e qualquer versão subsequente gerada por inteligência artificial possui um prazo de vida máximo e improrrogável de **90 (noventa) dias corridos** a partir da data e hora de seu registro (`created_at`).

```
[Upload / Geração]  ───▶  [Dia 83: Alerta 7 dias]  ───▶  [Dia 89: Alerta 24h]  ───▶  [Dia 90: Purga Permanente]
        │                                                                                        ▲
        └──────────────────────── [Exclusão Antecipada pelo Usuário] ────────────────────────────┘
```

#### Regras Operacionais da Retenção de 90 Dias
1. **Contagem por Objeto:** Cada versão possui seu próprio carimbo `expires_at = created_at + 90 dias`. A versão original não é prolongada pela criação de uma nova versão.
2. **Alertas Preventivos:**
   - **7 dias antes do vencimento:** O sistema agenda notificação no painel do usuário e e-mail informativo, recomendando o download.
   - **1 dia (24h) antes do vencimento:** Notificação de urgência alertando sobre a exclusão iminente.
3. **Exclusão Antecipada:** O usuário pode clicar em "Excluir Imagem" a qualquer momento. Isso aciona a rotina que remove imediatamente os binários no Cloudflare R2 (inclusive miniaturas) e marca `deleted_at = now` no banco D1 com motivo `user`.

---

### 2. Rotina Automatizada de Purga (Cloudflare Workers Cron Trigger)

A rotina de retenção (`src/jobs/retention.ts`) é executada diariamente via gatilho programado (`cron = "0 3 * * *"`, às 03:00 UTC):
1. **Identificação de Expiradas:** Consulta registros onde `expires_at <= datetime('now')` e `deleted_at IS NULL`.
2. **Exclusão de Objetos no R2:** Para cada versão identificada, exclui a chave principal (`r2_key`) e a chave de miniatura (`thumb_r2_key`) do bucket privado `MEDIA`.
3. **Marcação no D1:** Atualiza `deleted_at = datetime('now')` e `deletion_reason = 'retention'`.
4. **Idempotência e Segurança:** Processamento em lotes (*batches* de 200 registros) para evitar estouro de CPU e garantir execução atômica.
5. **Rede de Segurança Adicional (Bucket Lifecycle):** Como precaução de infraestrutura, o bucket R2 possui uma regra de ciclo de vida configurada para 95 dias, garantindo que nenhum objeto órfão persista caso ocorra falha extraordinária na execução do Worker.

---

### 3. Tabela Comparativa de Retenção por Natureza de Dado

| Categoria | Repositório | Prazo Máximo | Fundamento | Destino após o Prazo |
|---|---|---|---|---|
| **Arquivos de Imagem (Full e Thumbs)** | Cloudflare R2 | 90 dias | Minimização (Art. 6º, III LGPD) | Exclusão física definitiva |
| **Metadados de Versões e Imagens** | Cloudflare D1 | 90 dias (+ 30 dias anonimizado) | Auditoria de retenção | Purga de metadados |
| **Logs de Sessão e IP Hashes** | Cloudflare D1 | 6 meses | Art. 15 Marco Civil da Internet | Exclusão automatizada |
| **Registros de Faturamento e Cobrança** | Cloudflare D1 | 5 anos | Art. 173 do Código Tributário Nacional | Arquivamento protegido |
| **Transações de Créditos (Ledger)** | Cloudflare D1 | 5 anos | Conciliação contábil e auditoria | Arquivamento protegido |
