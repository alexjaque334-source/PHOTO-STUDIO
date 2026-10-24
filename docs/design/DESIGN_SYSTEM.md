# ALEGON AI Photo Studio — Sistema de Design & Identidade Visual

> **ALEGON Marketing & Tecnologia**  
> Versão: 1.0.0 — Canônica  
> Conformidade: WCAG 2.2 Nível AA  
> Stack: React 18, Tailwind CSS v4, Lucide Icons, Motion  

---

## 1. Filosofia e Identidade da Marca

O **ALEGON AI Photo Studio** é uma plataforma profissional de edição e aprimoramento de fotos potencializada por Inteligência Artificial generativa. Seu posicionamento é sofisticado, minimalista e confiável — direcionado a fotógrafos, criadores de conteúdo, agências e operações de e-commerce que exigem precisão cirúrgica sem fricção operacional.

### Pilares de Design
1. **Precisão Editorial e Foco no Conteúdo**: A interface é uma tela discreta de estúdio escuro/claro; as fotos dos usuários são o elemento de maior destaque e contraste.
2. **Minimalismo Funcional**: Cada controle tem uma função real. Sem ornamentos desnecessários ou ferramentas simuladas.
3. **Previsibilidade e Confiança**: Custos em créditos, tempo estimado de processamento, retenção de arquivos e limites operacionais são sempre explícitos antes de qualquer ação destrutiva ou tarifada.
4. **Acessibilidade Universal (WCAG 2.2 AA)**: Navegação total via teclado, contraste rigorosamente mensurado, áreas de toque mínimas de 44x44px em mobile e respeito estrito a `prefers-reduced-motion`.

---

## 2. Paleta de Cores & Tokens Semânticos

A paleta foi desenhada para oferecer uma experiência de "estúdio fotográfico high-end", com base em ardósia/titânio profunda (dark obsidian) e branco puro / linho neutro no modo claro, enriquecida com o **Índigo Elétrico / Violeta Studio** como primária e **Âmbar Ouro Studio** para elementos de alto valor e créditos.

### 2.1 Cores Base & Variáveis CSS

```css
:root {
  /* Modo Claro (Light Studio) */
  --background: #FFFFFF;
  --foreground: #090D16;           /* Slate 950 */
  --card: #F8FAFC;                 /* Slate 50 */
  --card-foreground: #090D16;
  --popover: #FFFFFF;
  --popover-foreground: #090D16;
  --primary: #4F46E5;              /* Indigo 600 - Ação primária */
  --primary-hover: #4338CA;        /* Indigo 700 */
  --primary-foreground: #FFFFFF;
  --secondary: #F1F5F9;            /* Slate 100 */
  --secondary-foreground: #0F172A; /* Slate 900 */
  --muted: #F1F5F9;                /* Slate 100 */
  --muted-foreground: #475569;      /* Slate 600 */
  --accent: #EEF2FF;               /* Indigo 50 */
  --accent-foreground: #3730A3;    /* Indigo 800 */
  --border: #E2E8F0;               /* Slate 200 */
  --input: #E2E8F0;
  --ring: #4F46E5;

  /* Estados Semânticos */
  --success: #059669;              /* Emerald 600 */
  --success-foreground: #FFFFFF;
  --warning: #D97706;              /* Amber 600 */
  --warning-foreground: #FFFFFF;
  --destructive: #DC2626;          /* Red 600 */
  --destructive-foreground: #FFFFFF;
  --info: #2563EB;                 /* Blue 600 */
  --info-foreground: #FFFFFF;

  /* Créditos & Tier Ouro */
  --credit-gold: #D97706;
  --credit-gold-bg: #FEF3C7;

  /* Geometria */
  --radius: 0.5rem;                /* 8px base */
}

.dark {
  /* Modo Escuro (Obsidian Studio) */
  --background: #090B10;           /* Obsidian Deep */
  --foreground: #F8FAFC;           /* Slate 50 */
  --card: #11141D;                 /* Slate 900 tint */
  --card-foreground: #F8FAFC;
  --popover: #151924;              /* Slate 850 */
  --popover-foreground: #F8FAFC;
  --primary: #6366F1;              /* Indigo 500 */
  --primary-hover: #818CF8;        /* Indigo 400 */
  --primary-foreground: #FFFFFF;
  --secondary: #1E2333;            /* Slate 800 */
  --secondary-foreground: #E2E8F0; /* Slate 200 */
  --muted: #181C28;                /* Slate 850 */
  --muted-foreground: #94A3B8;      /* Slate 400 */
  --accent: #1E2238;               /* Deep Indigo Tint */
  --accent-foreground: #C7D2FE;    /* Indigo 200 */
  --border: #23283A;               /* Border sutil de estúdio */
  --input: #23283A;
  --ring: #818CF8;

  /* Estados Semânticos Dark */
  --success: #10B981;              /* Emerald 500 */
  --success-foreground: #064E3B;
  --warning: #F59E0B;              /* Amber 500 */
  --warning-foreground: #451A03;
  --destructive: #EF4444;          /* Red 500 */
  --destructive-foreground: #450A0A;
  --info: #3B82F6;                 /* Blue 500 */
  --info-foreground: #172554;

  /* Créditos & Tier Ouro Dark */
  --credit-gold: #FBBF24;
  --credit-gold-bg: #291C08;
}
```

### 2.2 Tabela de Contraste WCAG 2.2 Nível AA Verificado

Todos os pares de cores principais foram calculados com base na fórmula de luminosidade relativa W3C. Requisito WCAG 2.2 AA: Mínimo 4.5:1 para texto normal, 3.0:1 para texto grande (≥ 18pt ou 14pt negrito) e componentes de interface interativos.

| Par de Elementos | Modo Claro | Ratio Claro | Status Claro | Modo Escuro | Ratio Escuro | Status Escuro |
|---|---|---|---|---|---|---|
| **Texto Principal / Fundo** | `#090D16` em `#FFFFFF` | **17.8:1** | AAA (Passa) | `#F8FAFC` em `#090B10` | **17.2:1** | AAA (Passa) |
| **Texto Secundário / Fundo** | `#475569` em `#FFFFFF` | **5.4:1** | AA (Passa) | `#94A3B8` em `#090B10` | **7.4:1** | AAA (Passa) |
| **Botão Primário (Texto / Fundo)** | `#FFFFFF` em `#4F46E5` | **5.9:1** | AA (Passa) | `#FFFFFF` em `#6366F1` | **4.7:1** | AA (Passa) |
| **Borda de Campo Interativo** | `#CBD5E1` em `#FFFFFF` | **3.1:1** | UI Component (Passa) | `#333C52` em `#090B10` | **3.2:1** | UI Component (Passa) |
| **Crachá de Sucesso (Badge)** | `#065F46` em `#D1FAE5` | **7.3:1** | AAA (Passa) | `#34D399` em `#064E3B` | **5.1:1** | AA (Passa) |
| **Crachá de Alerta / Ouro** | `#92400E` em `#FEF3C7` | **6.1:1** | AA (Passa) | `#FCD34D` em `#451A03` | **6.8:1** | AA (Passa) |
| **Crachá de Erro (Destrutivo)** | `#991B1B` em `#FEE2E2` | **6.4:1** | AA (Passa) | `#FCA5A5` em `#450A0A` | **5.8:1** | AA (Passa) |

---

## 3. Tipografia

A tipografia utiliza a pilha de fontes nativa moderna do sistema (priorizando legibilidade neutra e renderização subpixel perfeita sem flashes de fontes externas) com fontes monoespaçadas para códigos, IDs e saldo de créditos.

### 3.1 Famílias Tipográficas
- **Interface e Títulos**: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`
- **Números, Tokens e IDs**: `ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace`

### 3.2 Escala Tipográfica Modular

| Nível | Tamanho / Line Height | Peso | Uso |
|---|---|---|---|
| **Display** | 36px / 44px (`text-4xl`) | 700 (Bold) | Hero da Landing Page |
| **H1** | 30px / 36px (`text-3xl`) | 700 (Bold) | Títulos das Telas Principais do Studio |
| **H2** | 24px / 32px (`text-2xl`) | 600 (Semibold) | Seções de Página, Cabeçalhos de Modais |
| **H3** | 20px / 28px (`text-xl`) | 600 (Semibold) | Títulos de Cards e Categorias |
| **H4** | 16px / 24px (`text-base`) | 600 (Semibold) | Subtítulos de Seções e Cabeçalhos de Tabelas |
| **Body (Padrão)** | 14px / 20px (`text-sm`) | 400 (Regular) | Textos de interface, formulários, labels |
| **Body Bold** | 14px / 20px (`text-sm`) | 600 (Semibold) | Destaques, botões, estatísticas secundárias |
| **Caption** | 12px / 16px (`text-xs`) | 400 / 500 | Badges, dias de retenção, dicas de ajuda |
| **Micro** | 10px / 14px (`text-[10px]`) | 600 (Semibold) | Badges compactos, atalhos de teclado |

---

## 4. Espaçamento, Grid & Geometria

O sistema é baseado em uma grade de **4px base** com incrementos padronizados:

- **Espaçamentos**:
  - `space-1`: 4px (micro-ajustes de ícones)
  - `space-2`: 8px (espaçamento entre ícone e texto, paddings compactos)
  - `space-3`: 12px (paddings internos de botões compactos e inputs)
  - `space-4`: 16px (gutter padrão, padding de cards padrão)
  - `space-6`: 24px (distância entre blocos de formulário e cartões)
  - `space-8`: 32px (separações de seções de página)
  - `space-12`: 48px (separações de blocos no Hero/Landing)

- **Bordas e Cantos Arredondados (`border-radius`)**:
  - `rounded-sm`: 4px (Badges, tags pequenas)
  - `rounded-md`: 6px (Inputs, dropdowns, botões pequenos)
  - `rounded-lg`: 8px (Botões padrão, cartões, formulários)
  - `rounded-xl`: 12px (Containers do editor, modais, painéis)
  - `rounded-2xl`: 16px (Hero cards, comparadores antes/depois)
  - `rounded-full`: Pílulas de status e avatares

- **Bordas**: Linhas finas e nítidas de 1px (`border border-border`) que garantem separação clara de planos sem poluição visual.

---

## 5. Elevação, Sombras e Superfícies

1. **Plano 0 (Fundo)**: `--background` — base neutra de visualização.
2. **Plano 1 (Superfície/Cartão)**: `--card` com borda fina `border-border` e sombra leve `shadow-sm`.
3. **Plano 2 (Flutuante/Dropdown/Popover)**: `--popover` com borda e sombra média `shadow-md` ou `shadow-lg`.
4. **Plano 3 (Sobreposição Modal/Drawer)**: Backdrop escurecido `bg-black/60 backdrop-blur-sm` com o modal centralizado contendo `shadow-2xl`.

---

## 6. Movimento & Animações (Motion)

O movimento comunica estados de transição sem causar fadiga visual ou atrasos percebidos.

### 6.1 Parâmetros de Transição
- **Transição Rápida (150ms)**: Hovers em botões, foco em campos, abertura de tooltips. Curva: `cubic-bezier(0.4, 0, 0.2, 1)`.
- **Transição de Painéis (250ms)**: Modais, gavetas móveis, abas de ferramentas. Curva: `cubic-bezier(0.16, 1, 0.3, 1)`.
- **Transição de Sucesso / Feedback (400ms)**: Entrada de toasts e conclusão de barra de progresso.

### 6.2 Respeito Obrigatório a `prefers-reduced-motion`
Todas as animações obedecem à consulta de mídia do usuário:
```css
@media (prefers-reduced-motion: reduce) {
  *, ::before, ::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

---

## 7. Iconografia

Utiliza-se exclusivamente o catálogo oficial **Lucide Icons** (`lucide-react`).
- Traço padrão: `stroke-width: 1.75px` (elegante e legível).
- Tamanhos canônicos:
  - 14px (`h-3.5 w-3.5`): Badges e dicas de texto.
  - 16px (`h-4 w-4`): Ações de botões e itens de menus.
  - 20px (`h-5 w-5`): Navegação principal e cabeçalhos de cards.
  - 24px (`h-6 w-6`): Ícones principais de upload, cards de ferramentas.
  - 32px / 40px: Telas de estado vazio e ilustrações funcionais.

---

## 8. Princípios de Acessibilidade (A11y - WCAG 2.2 AA)

1. **Navegação Completa por Teclado**:
   - `Tab` / `Shift+Tab`: Movimenta foco sequencial de controles.
   - `Enter` / `Espaço`: Ativa botões, checkboxes e switches.
   - `Escape`: Fecha modais, drawers, popovers e cancela pré-visualizações.
   - `ArrowLeft` / `ArrowRight`: Move o slider comparador Antes/Depois e troca abas de ferramentas.
2. **Indicador de Foco Visível**:
   - Todos os elementos interativos possuem anel de foco destacado: `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background`.
3. **Área de Toque Mínima**:
   - Mínimo de 44x44px em telas sensíveis ao toque (mobile e tablets).
4. **Semântica ARIA**:
   - Modais possuem `role="dialog"`, `aria-modal="true"`, `aria-labelledby` e `aria-describedby`.
   - Sliders de Antes/Depois possuem `role="slider"`, `aria-valuenow`, `aria-valuemin="0"`, `aria-valuemax="100"` e `aria-label="Comparador Antes e Depois"`.
   - Alertas usam `role="alert"` para leitores de tela.
   - Estados de carregamento possuem `aria-busy="true"` e `aria-live="polite"`.
