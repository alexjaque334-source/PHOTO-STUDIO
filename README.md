# ALEGON AI Photo Studio

> Plataforma SaaS profissional de edição e restauração de fotografias por linguagem natural através de Inteligência Artificial Generativa.
> **Propriedade:** ALEGON Marketing & Tecnologia

---

## 1. Visão Geral do Produto
O **ALEGON AI Photo Studio** permite que pessoas físicas e empresas enviem fotografias comuns e solicitem modificações complexas simplesmente descrevendo o que desejam em português brasileiro.

### Principais Recursos
* **Edição por Texto:** Remoção de pessoas e objetos, substituição de cenários/fundo, criação de fotografias comerciais para e-commerce, restauração de nitidez e iluminação.
* **Preservação de Fisionomia:** Engenharia de prompts com regras de retenção facial e composição de proporções.
* **Comparador Antes/Depois:** Slider interativo para inspeção visual em alta precisão.
* **Histórico de Versões Não-Destrutivo:** A foto original nunca é sobrescrita; cada modificação gera uma nova versão catalogada.
* **Biblioteca Privada com Retenção de 90 Dias:** Ciclo de vida efêmero automático com alertas preventivos de expiração (7 dias e 24h) e download multiformato (PNG, JPG, WebP).
* **Monetização Flexível:** Edições avulsas, pacotes de créditos e assinaturas recorrentes integradas exclusivamente ao **Asaas** via Pix e Cartão de Crédito.
* **Privacidade & LGPD:** Minimização de dados, *Zero Data Retention* (ZDR) nas chamadas de IA e proibição expressa de utilização de fotografias para treinamento de modelos.

---

## 2. Arquitetura e Stack Tecnológica
* **Backend:** Cloudflare Workers (TypeScript) com framework leve [Hono](https://hono.dev/).
* **Banco de Dados:** Cloudflare D1 (SQLite distribuído em borda) com controle atômico de carteira.
* **Armazenamento de Imagens:** Cloudflare R2 (Object Storage privado com acesso temporário via URLs assinadas HMAC-SHA256).
* **Filas & Processamento:** Cloudflare Queues (`alegon-edit-jobs` e `alegon-asaas-webhooks`).
* **Frontend:** React 18, TypeScript, Vite 6 e Tailwind CSS v4 com Design System proprietário acessível (WCAG 2.2 AA).
* **Inteligência Artificial:** Roteador multimodal [OpenRouter](https://openrouter.ai/) operando em tiers (Econômico, Padrão e Premium).
* **Gateway de Pagamento:** [Asaas](https://www.asaas.com/) (Pix dinâmico com QR Code em tela e Cartão).

---

## 3. Como Executar Localmente

### 3.1 Setup Automático
```bash
# Clone e entre no repositório
cd alegon-ai-photo-studio

# Configura segredos e variáveis locais (.dev.vars)
node scripts/setup-local.mjs

# Aplica as 5 migrações no D1 local
cd apps/api
npx.cmd wrangler d1 migrations apply alegon-photo-db --local
```

### 3.2 Executando API e Frontend
* **Terminal 1 (Backend Worker na porta 8787):**
  ```bash
  cd apps/api
  npx.cmd wrangler dev --port 8787
  ```
* **Terminal 2 (Frontend Vite na porta 5173):**
  ```bash
  cd apps/web
  npx.cmd vite
  ```
Acesse: **`http://localhost:5173`**

---

## 4. Estrutura do Monorepo

```
alegon-ai-photo-studio/
├── apps/
│   ├── api/                  # Cloudflare Worker (Hono, D1, R2, Queues)
│   │   ├── migrations/       # Migrações D1 (0001 a 0050)
│   │   ├── src/
│   │   │   ├── ai/           # Integração OpenRouter & fallback de tiers
│   │   │   ├── auth/         # Autenticação PBKDF2 & Sessões opacas
│   │   │   ├── billing/      # Asaas client, checkout & webhooks
│   │   │   ├── routes/       # Rotas REST da API
│   │   │   ├── security/     # Upload validator, headers, CSP, rate limit
│   │   │   ├── storage/      # R2 client & URLs assinadas HMAC
│   │   │   └── wallet/       # Motor atômico de créditos
│   │   └── wrangler.toml     # Configuração de infraestrutura
│   └── web/                  # Frontend SPA (React + Tailwind v4)
│       └── src/
│           ├── design-system/# 26 componentes acessíveis do Design System
│           ├── pages/        # Telas (Editor, Biblioteca, Planos, Admin)
│           └── styles/       # Tokens e variáveis de tema
├── docs/                     # Documentação de Arquitetura, Segurança e Finanças
│   ├── ai/                   # Pesquisa de modelos OpenRouter e privacidade
│   ├── billing/              # Regras Asaas e plano de testes Sandbox
│   ├── design/               # Design System e wireframes de telas
│   ├── finance/              # Análise de custos e simulação de receita (12 meses)
│   ├── legal/                # Política de Privacidade, Termos, RIPD e LGPD
│   ├── ops/                  # Guias de infraestrutura, backup e observabilidade
│   └── security/             # Modelo STRIDE e checklist OWASP
├── qa/                       # Casos de teste de IA e homologação
└── scripts/                  # Scripts utilitários de administração e backup
```

---

## 5. Governança e Segurança
* **Varredura de Segredos:** `node scripts/check-secrets.mjs`
* **Criar Administrador Local:** `node scripts/make-admin.mjs <email>`
* **Backup do Banco Local:** `node scripts/backup-d1.mjs`
