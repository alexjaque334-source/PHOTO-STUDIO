# ALEGON AI Photo Studio — Arquitetura de Telas & Estados

> **ALEGON Marketing & Tecnologia**  
> Especificação de Telas, Fluxos e Estados de Interface (UX/UI)  
> Diretrizes para Frontend e QA  

---

## Índice das Telas

1. [Landing Page Comercial & Tabela de Preços (`/`)](#1-landing-page-comercial--preços)
2. [Fluxo de Autenticação (`/auth/*`)](#2-fluxo-de-autenticação)
   - 2.1 Login (`/auth/login`)
   - 2.2 Cadastro com Aceite LGPD (`/auth/register`)
   - 2.3 Recuperação e Redefinição de Senha (`/auth/forgot-password`, `/auth/reset-password`)
   - 2.4 Confirmação de E-mail (`/auth/verify-email`)
   - 2.5 Verificação de Segundo Fator MFA/TOTP (`/auth/mfa`)
3. [Dashboard Principal do Usuário (`/dashboard`)](#3-dashboard-do-usuário)
4. [Editor de Fotos Inteligente (`/studio` ou `/studio/:imageId`)](#4-editor-de-fotos-ia)
   - 4.1 Carregamento & Upload (Drag & Drop / Câmera)
   - 4.2 Painel de Ferramentas (14 Ferramentas Categorizadas)
   - 4.3 Caixa de Prompt com Preservação Contextual
   - 4.4 Seleção de Tier & Cotação Transparente
   - 4.5 Modal de Confirmação & Fila de Processamento
   - 4.6 Visualizador Antes/Depois Interativo e Acessível
   - 4.7 Linha do Tempo de Versões (Não Destrutivo)
   - 4.8 Download Multi-formato (PNG / JPG / WebP)
5. [Biblioteca de Imagens & Gestão de Retenção (`/library`)](#5-biblioteca-de-imagens)
6. [Carteira de Créditos & Extrato de Consumo (`/wallet`)](#6-carteira-e-extrato-de-créditos)
7. [Planos & Checkout Asaas (`/pricing` & `/checkout`)](#7-planos--checkout-asaas)
8. [Painel Administrativo ALEGON (`/admin/*`)](#8-painel-administrativo-alegon)

---

## 1. Landing Page Comercial & Preços

- **Rota**: `/`
- **Público**: Visitantes, fotógrafos, donos de e-commerce e agências.
- **Estrutura**:
  - **Header**: Logo ALEGON AI Photo Studio, links de âncora ("Recursos", "Ferramentas", "Preços", "Segurança"), ThemeToggle, botões "Entrar" e "Começar Agora".
  - **Hero Section**: Headline impactante ("Edição de fotos profissional em segundos com IA de estúdio"), subtítulo institucional, CTA primário para testar/cadastrar, e componente **BeforeAfterSlider** interativo demonstrando restauração fotográfica e remoção de fundo com imagem de alta resolução.
  - **Showcase das 14 Ferramentas**: Grade em abas ou cards elegantes agrupados em: Remoção & Fundo, Melhoria & Restauração, Foto de Produto & Comercial.
  - **Garantias & Retenção Transparente**: Destaque para privacidade LGPD (fotos nunca usadas para treino), retenção clara de 90 dias com aviso antecipado e infraestrutura Cloudflare R2 com URLs assinadas e seguras.
  - **Tabela de Planos e Créditos Avulsos**: Cards de planos mensais e pacotes avulsos com valores em R$ e conversão explícita de créditos por edição.
  - **FAQ**: Sanfona (Accordion) esclarecendo dúvidas técnicas, suporte a formatos de download e formas de pagamento (Pix instantâneo e Cartão de Crédito via Asaas).
  - **Footer**: Identificação formal "ALEGON Marketing & Tecnologia", links para Termos de Uso, Política de Privacidade e canal de suporte.

### Estados
- **Padrão**: Carregamento imediato com SSR/estático rápido, tipografia nítida, contrastes calculados.
- **Interativo**: O slider Antes/Depois do Hero responde a arrasto de mouse, toque em smartphones e setas do teclado (`ArrowLeft` / `ArrowRight`).

---

## 2. Fluxo de Autenticação

### 2.1 Login (`/auth/login`)
- **Campos**: E-mail e Senha (com botão de alternar visibilidade de senha).
- **Ações**: Botão primário "Entrar no Studio", link "Esqueceu sua senha?", link "Criar conta".
- **Estados**:
  - *Carregando*: Botão exibe Spinner e texto "Autenticando...", campos desabilitados.
  - *Erro*: Alerta em vermelho com mensagem clara (ex: "E-mail ou senha incorretos", "Conta temporariamente bloqueada por excesso de tentativas").
  - *MFA Necessário*: Transição suave para tela de TOTP.

### 2.2 Cadastro (`/auth/register`)
- **Campos**: Nome Completo, E-mail, Senha (mínimo 10 caracteres com barra de força), Confirmação de Senha, Checkboxes obrigatórios para Termos de Serviço e Política de Privacidade LGPD.
- **Estados**:
  - *Validação em tempo real*: Mensagens sob o campo para senhas fracas ou comuns.
  - *Sucesso*: Exibe tela de "Verifique seu e-mail" com endereço cadastrado e botão para reenviar confirmação se necessário.

### 2.3 Recuperação e Redefinição de Senha
- **Forgot Password (`/auth/forgot-password`)**: Campo único de e-mail. Resposta sem enumeração: exibe mensagem positiva ("Se o e-mail estiver cadastrado, você receberá um link de redefinição em instantes").
- **Reset Password (`/auth/reset-password?token=...`)**: Campos de Nova Senha e Confirmação. Validação de token inválido/expirado com CTA para solicitar novo link.

### 2.4 Confirmação de E-mail (`/auth/verify-email?token=...`)
- **Estados**:
  - *Verificando*: Spinner animado central com mensagem "Validando seu cadastro...".
  - *Sucesso*: Ícone de confirmação verde e botão "Acessar meu Studio".
  - *Erro/Expirado*: Mensagem de token expirado com botão "Reenviar e-mail de ativação".

### 2.5 Verificação de Segundo Fator MFA (`/auth/mfa`)
- **Componentes**: 6 campos de dígitos com foco automático progressivo (ou input com formatação numérica de código de 6 dígitos), link para código de recuperação caso o usuário tenha perdido o autenticador.

---

## 3. Dashboard do Usuário

- **Rota**: `/dashboard`
- **Cabeçalho**: Saudação ao usuário, saldo de créditos disponíveis em destaque dourado/âmbar, atalho para "Novo Projeto" e "Comprar Créditos".
- **Painéis**:
  - **StatCards**:
    - Saldo de Créditos (detalhando comprados e assinatura, com alerta de créditos a expirar nos próximos dias).
    - Total de Imagens Ativas no Studio.
    - Edições Realizadas no Mês.
    - Dias Médios de Retenção Restantes.
  - **Acesso Rápido ao Studio**: Cartão para arrastar e soltar foto instantaneamente sem navegar para outra tela.
  - **Projetos Recentes**: Grid de cards com thumbnail, título, data e badge de versões geradas.
  - **Aviso de Retenção de 90 dias**: Barra informativa sutil relembrando que imagens são mantidas de forma segura por 90 dias no estúdio privativo.

### Estados
- **Vazio**: EmptyState amigável convidando o usuário a fazer seu primeiro upload, com botão "Iniciar Primeira Edição".
- **Carregando**: Skeletons elegantes nos cards de métricas e lista de projetos.
- **Erro**: Banner de erro de sincronização com botão "Tentar novamente".

---

## 4. Editor de Fotos IA

A tela central do produto (`/studio` ou `/studio/:imageId`). Desenhada em layout de cockpit de estúdio com 3 áreas principais:
1. **Barra Lateral Esquerda**: Ferramentas e Configuração do Job.
2. **Área Central (Canvas)**: Visualizador de Imagem com Slider Antes/Depois interativo e controles de zoom/enquadramento.
3. **Barra Inferior / Lateral Direita**: Histórico de Versões Não-Destrutivo e Painel de Exportação/Download.

### 4.1 Carregamento & Upload (Dropzone)
- Drag & Drop de arquivos (JPG, PNG, WebP até 15MB e 40 megapixels).
- Botão alternativo "Tirar Foto" (aciona câmera do dispositivo em dispositivos móveis ou webcams).
- Geração automática de miniatura otimizada no navegador via Canvas antes de despachar para a API.
- Indicador de upload com barra de progresso e porcentagem de transferência.

### 4.2 As 14 Ferramentas Categorizadas
As ferramentas são agrupadas com ícones visuais distintos:

#### Categoria A — Fundo & Isolamento
1. **Remover Fundo (`remove_background`)**: Recorta o assunto principal com máscara perfeita de cabelo e bordas.
2. **Fundo Transparente (`transparent_background`)**: Gera saída em canal alfa PNG/WebP puro.
3. **Substituir Fundo (`replace_background`)**: Altera o cenário para estúdio, natureza, ambiente urbano etc. (requer prompt descritivo).
4. **Remover Pessoas (`remove_people`)**: Remove figurantes e transeuntes indesejados da cena.
5. **Remover Objetos (`remove_objects`)**: Inpainting de elementos dispersos, fios ou sombras.

#### Categoria B — Qualidade & Restauração
6. **Melhorar Iluminação (`improve_lighting`)**: Correção profissional de superexposição, sombras e luz de estúdio.
7. **Aprimorar Cores (`improve_colors`)**: Gradação tonal cinematográfica e correção de balanço de branco.
8. **Nitidez & Clareza (`sharpen`)**: Realce de micro-detalhes, olhos, texturas e foco.
9. **Restaurar Foto Antiga (`restore_photo`)**: Remoção de arranhões, desbotamento e restauração de fotos analógicas.

#### Categoria C — Comercial & Criativo
10. **Foto de Produto E-commerce (`product_photo`)**: Posiciona o produto sobre pedestal, iluminação comercial e reflexos realistas.
11. **Adicionar Elementos (`add_elements`)**: Insere adereços, acessórios ou efeitos coerentes com a luz.
12. **Substituir Elementos (`replace_elements`)**: Troca roupas, texturas, cores de objetos existentes.
13. **Variações Criativas (`variations`)**: Gera ângulos, composições e variações mantendo o sujeito original.
14. **Prompt Livre (`free_prompt`)**: Instrução em linguagem natural sem restrição pré-fixada.

### 4.3 Caixa de Prompt com Preservação Contextual
- Campo de texto rico com suporte a até 2.000 caracteres e contador regressivo.
- Sugestões rápidas de refinamento ("Mais iluminação de estúdio", "Fundo cinza minimalista", "Profundidade de campo f/1.8").
- **Preservação de Prompt**: Se o usuário alternar entre ferramentas compatíveis, o rascunho de texto digitado é preservado na sessão para evitar retrabalho.

### 4.4 Seleção de Tier & Cotação Transparente
- Rádio buttons visuais dos 3 Tiers:
  - **Econômico** (1 crédito): Modelos ultra-rápidos para testes e tarefas simples.
  - **Padrão** (1 crédito): Otimização recomendada para equilíbrio perfeito de fidelidade e realismo.
  - **Premium** (2 créditos): Renderização de altíssima fidelidade fotográfica com detalhes finos de textura.
- Badge em tempo real indicando: "Esta ação consumirá **X créditos** (Saldo atual: Y)".
- Chamada para `POST /api/edits/quote` com prévia de orçamento antes de confirmar.

### 4.5 Modal de Confirmação & Fila de Processamento
- Modal com resumo da edição: Ferramenta selecionada, Custo em créditos, Tempo estimado (10s a 30s) e botão "Confirmar e Iniciar Edição".
- Fila com barra de progresso animada e mensagens dinâmicas:
  - "Reservando créditos de forma segura..."
  - "Enviando imagem ao pipeline de IA..."
  - "Processando aprimoramento de pixels..."
  - "Finalizando renderização e salvando nova versão..."
- Em caso de falha técnica elegível: Alerta imediato avisando que **os créditos foram liberados e devolvidos integralmente** ao saldo.

### 4.6 Visualizador Antes/Depois (BeforeAfterSlider)
- Visualização split-screen com divisor vertical interativo.
- **Acessibilidade**:
  - `role="slider"`, `tabindex="0"`, `aria-label="Comparador Antes e Depois"`.
  - Suporta setas `ArrowLeft` e `ArrowRight` (passo de 5%) e `Home`/`End` (0% ou 100%).
  - Suporta toque e arrasto contínuo em mobile.
  - Etiquetas flutuantes "Antes" (versão de origem) e "Depois" (versão IA).

### 4.7 Linha do Tempo de Versões (Não-Destrutivo)
- Histórico horizontal com miniaturas de cada versão (`v1` original, `v2`, `v3`...).
- Ao clicar em uma versão anterior, ela se torna ativa para novas edições derivadas.
- A imagem original nunca é substituída nem perdida.

### 4.8 Download Multi-formato (PNG / JPG / WebP)
- Menu de download com seleção de formato:
  - **PNG**: Sem perdas, recomendado para fundos transparentes e impressões.
  - **JPG**: Otimizado para web e redes sociais (qualidade ajustada).
  - **WebP**: Máxima compressão moderna para e-commerce e sites.
- Processamento client-side via `<canvas>` de alta precisão com preservação de dimensões originais.

---

## 5. Biblioteca de Imagens

- **Rota**: `/library`
- **Controles de Cabeçalho**:
  - Campo de busca rápida por título da imagem.
  - Filtro por Projeto.
  - Ordenação: "Mais recentes primeiro" ou "Próximas a expirar (Retenção)".
- **Grid de Cards de Imagem**:
  - Miniatura com proporção preservada e efeito de hover elegante.
  - **Badge de Retenção**: Pílula colorida indicando dias restantes:
    - `> 30 dias`: Badge neutro (ex: "82 dias restantes").
    - `10 a 30 dias`: Badge âmbar (ex: "18 dias restantes").
    - `< 10 dias`: Badge vermelho/destrutivo piscando sutilmente (ex: "4 dias para exclusão").
  - Contador de versões geradas (ex: "3 versões").
  - Menu de ações rápidas: Abrir no Studio, Download direto, Mover de projeto e **Exclusão Antecipada** (com confirmação para liberar privacidade antecipadamente).

### Estados
- **Vazio**: Ilustração com mensagem "Sua galeria está vazia. Inicie seu primeiro projeto fotográfico agora!".
- **Carregando**: Grid de 8 skeletons com placeholders pulsantes.

---

## 6. Carteira e Extrato de Créditos

- **Rota**: `/wallet`
- **Cartões de Saldo**:
  - Saldo Total Disponível.
  - Créditos de Assinatura (com data de renovação do ciclo).
  - Créditos Comprados / Pacotes (com prazo de 12 meses).
  - Créditos Reservados (em processamento no momento).
- **Extrato Paginado de Transações**:
  - Tabela com Colunas: Data/Hora, Tipo (Compra, Assinatura, Consumo Edição, Estorno/Liberação, Ajuste), Quantidade de Créditos (+ / - com destaque verde/vermelho), Lote de Origem e Identificador de Referência.
  - Filtro por tipo de movimentação.

---

## 7. Planos & Checkout Asaas

- **Rota**: `/pricing` e `/checkout`
- **Seletor**: Alternância entre "Planos Mensais Recorrentes" e "Pacotes Avulsos de Créditos".
- **Cartões de Preços (PriceCard)**:
  - Destaque do plano mais popular com borda primária e selo "Mais Escolhido".
  - Valor em R$ e valor unitário transparente por crédito (ex: "Apenas R$ 0,50 por foto editada").
  - Lista de benefícios (prioridade na fila, retenção de 90 dias, acesso a todos os modelos).
- **Tela de Checkout**:
  - Resumo do pedido à direita.
  - Escolha de método: **Pix Instantâneo** ou **Cartão de Crédito**.
  - **Fluxo Pix**:
    - Exibe QR Code gerado em alta definição (`qrcode`).
    - Campo com código "Pix Copia e Cola" e botão "Copiar Código" com feedback tátil de sucesso.
    - Temporizador regressivo da validade do Pix (ex: "Válido por 30 minutos").
    - Verificador de status com polling automático: ao detectar recebimento, transiciona para tela de celebração com saldo liberado.
  - **Fluxo Cartão de Crédito**:
    - Botão seguro redirecionando para a fatura oficial hospedada do Asaas (`invoiceUrl`), garantindo isenção total de tráfego de dados de cartão em nossos servidores (Conformidade PCI).

---

## 8. Painel Administrativo ALEGON

- **Rota**: `/admin/*`
- **Acesso**: Restrito a usuários com perfil `admin` e verificação obrigatória de segundo fator TOTP ativa.
- **Aviso de Privacidade**: O administrador **não tem acesso aos arquivos visuais privados dos clientes**, apenas a metadados operacionais e métricas anonimizadas.
- **Seções**:
  1. **Visão Geral & Métricas (`/admin`)**: Gráficos de receita no período, volume de jobs de IA concluídos, novos usuários cadastrados, consumo de orçamento OpenRouter diário e status de filas.
  2. **Gestão de Usuários (`/admin/users`)**: Tabela com busca, status de e-mail e MFA, bloqueio/desbloqueio administrativo, concessão manual auditada de créditos.
  3. **Catálogo & Planos (`/admin/catalog`)**: Edição dos pacotes avulsos e planos de assinatura cadastrados no sistema.
  4. **Modelos de IA & Tiers (`/admin/models`)**: Configuração de modelos ativos no OpenRouter, custo em créditos de cada tier, prioridades de fallback e botão de teste de conectividade.
  5. **Webhooks Asaas (`/admin/webhooks`)**: Registro de todos os eventos recebidos com payload JSON, status de processamento e botão de reprocessamento manual com chave de idempotência.
  6. **Reconciliação Financeira (`/admin/reconciliation`)**: Auditoria diária entre faturas pagas no Asaas e créditos concedidos no D1.
  7. **Limites do Sistema (`/admin/settings`)**: Controle dinâmico de orçamento global de IA diário, limites por usuário e taxa de concorrência.
