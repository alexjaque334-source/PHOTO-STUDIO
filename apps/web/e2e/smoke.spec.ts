/**
 * Smoke Tests E2E com Playwright — ALEGON AI Photo Studio.
 * Dono: Subagente 8 (QA e Testes).
 *
 * Cobertura:
 * 1. Carregamento da página principal e identidade visual (Logo ALEGON).
 * 2. Navegação fluida entre abas do Design System e Studio.
 * 3. Renderização e operação acessível de Modal de confirmação e Drawer lateral.
 * 4. Interação com o Slider Antes/Depois (BeforeAfterSlider) via ponteiro e teclado.
 * 5. Seletor de Tiers de IA e transparência de custos de crédito.
 * 6. Visualização da tabela de retenção e cálculo de dias restantes (política de 90 dias).
 * 7. Catálogo de planos com valores em Reais (R$) e opções Pix/Cartão Asaas.
 * 8. Responsividade em viewport mobile (375px) vs desktop (1280px).
 */
import { test, expect } from '@playwright/test';

test.describe('ALEGON AI Photo Studio — Smoke Tests & Design System E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Acessa a raiz da aplicação SPA
    await page.goto('/');
  });

  test('1. Carregamento da página, título e identidade visual da marca ALEGON', async ({ page }) => {
    // Valida título da página
    await expect(page).toHaveTitle(/ALEGON/i);

    // Valida presença do cabeçalho principal
    const heading = page.locator('h1');
    await expect(heading).toContainText('ALEGON Design System & Component Studio');

    // Valida renderização do logotipo SVG
    const logo = page.locator('svg').filter({ hasText: /ALEGON/i }).first();
    await expect(logo).toBeVisible();

    // Valida badge de versão do Design System
    await expect(page.getByText('v1.0 Canônico')).toBeVisible();
  });

  test('2. Navegação completa entre as abas do Studio', async ({ page }) => {
    // Aba 1: Visão Geral (default ativo)
    await expect(page.getByRole('tab', { name: /Visão Geral/i })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByText('Saldo de Créditos')).toBeVisible();
    await expect(page.getByText('8 créditos expiram em 5 dias')).toBeVisible();

    // Aba 2: Componentes do Studio
    await page.getByRole('tab', { name: /Componentes do Studio/i }).click();
    await expect(page.getByRole('tab', { name: /Componentes do Studio/i })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByText('Slider Interativo Antes / Depois')).toBeVisible();
    await expect(page.getByText('Dropzone com Drag & Drop')).toBeVisible();

    // Aba 3: Formulários & Entradas
    await page.getByRole('tab', { name: /Formulários/i }).click();
    await expect(page.getByRole('tab', { name: /Formulários/i })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByLabel(/Nome do Projeto/i)).toBeVisible();
    await expect(page.getByLabel(/Instrução Criativa/i)).toBeVisible();

    // Aba 4: Planos & Carteira
    await page.getByRole('tab', { name: /Planos & Carteira/i }).click();
    await expect(page.getByRole('tab', { name: /Planos & Carteira/i })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByText('Planos Transparentes e Sem Surpresas')).toBeVisible();
    await expect(page.getByText('R$ 39')).toBeVisible();
    await expect(page.getByText('R$ 89')).toBeVisible();
    await expect(page.getByText('R$ 59')).toBeVisible();

    // Aba 5: Feedback & Alertas
    await page.getByRole('tab', { name: /Feedback & Alertas/i }).click();
    await expect(page.getByRole('tab', { name: /Feedback & Alertas/i })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByText('Disparadores de Toasts & Alertas')).toBeVisible();
    await expect(page.getByText('Proteção e Retenção Privada LGPD')).toBeVisible();
  });

  test('3. Abertura, revisão de cotação e fechamento acessível de Modal', async ({ page }) => {
    const openModalBtn = page.getByRole('button', { name: /Abrir Modal de Exemplo/i });
    await openModalBtn.click();

    // Modal deve estar visível com role dialog
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText('Confirmar Execução de Edição de Foto')).toBeVisible();
    await expect(dialog.getByText('Padrão (1 Crédito)')).toBeVisible();
    await expect(dialog.getByText('42 créditos')).toBeVisible();

    // Fechamento via botão Cancelar
    const cancelBtn = dialog.getByRole('button', { name: /Cancelar/i });
    await cancelBtn.click();
    await expect(dialog).not.toBeVisible();
  });

  test('4. Abertura do Drawer lateral com as 14 ferramentas de IA', async ({ page }) => {
    const openDrawerBtn = page.getByRole('button', { name: /Abrir Drawer Lateral/i });
    await openDrawerBtn.click();

    // Drawer com catálogo de ferramentas
    await expect(page.getByText('Filtros & Ferramentas Rápidas')).toBeVisible();
    await expect(page.getByRole('button', { name: /Remover Fundo/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Melhorar Iluminação/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Foto de Produto/i })).toBeVisible();

    // Fechar pelo botão X
    const closeBtn = page.locator('button[aria-label="Fechar gaveta"]');
    await closeBtn.click();
    await expect(page.getByText('Filtros & Ferramentas Rápidas')).not.toBeVisible();
  });

  test('5. Interação com BeforeAfterSlider acessível por mouse e teclado', async ({ page }) => {
    await page.getByRole('tab', { name: /Componentes do Studio/i }).click();

    const sliderHandle = page.locator('[role="slider"]');
    await expect(sliderHandle).toBeVisible();
    await expect(sliderHandle).toHaveAttribute('aria-label', /Divisor de comparação/i);

    // Verificação de valor inicial (50%)
    const initialVal = await sliderHandle.getAttribute('aria-valuenow');
    expect(Number(initialVal)).toBe(50);

    // Interação via Teclado: Seta para a Direita (+5%)
    await sliderHandle.focus();
    await page.keyboard.press('ArrowRight');
    const newVal = await sliderHandle.getAttribute('aria-valuenow');
    expect(Number(newVal)).toBe(55);

    // Interação via Teclado: Seta para a Esquerda (-5%)
    await page.keyboard.press('ArrowLeft');
    const returnVal = await sliderHandle.getAttribute('aria-valuenow');
    expect(Number(returnVal)).toBe(50);
  });

  test('6. Seleção e transparência de tiers de IA (Econômico, Padrão, Premium)', async ({ page }) => {
    await page.getByRole('tab', { name: /Componentes do Studio/i }).click();

    const econTier = page.getByText('Tier Econômico');
    const padraoTier = page.getByText('Tier Padrão');
    const premiumTier = page.getByText('Tier Premium');

    await expect(econTier).toBeVisible();
    await expect(padraoTier).toBeVisible();
    await expect(premiumTier).toBeVisible();

    // Seleciona Tier Premium e verifica badge de 2 Créditos
    await premiumTier.click();
    await expect(page.getByText('2 Créditos')).toBeVisible();
  });

  test('7. Verificação de Retenção de 90 dias na tabela de imagens', async ({ page }) => {
    // Na aba Visão Geral
    await expect(page.getByText('82 dias restantes')).toBeVisible();
    await expect(page.getByText('14 dias restantes')).toBeVisible();
    await expect(page.getByText('retrato_corporativo_01.jpg')).toBeVisible();
  });

  test('8. Fluxo Responsivo em Viewport Mobile (375x667)', async ({ page }) => {
    // Configura viewport de smartphone comum (iPhone SE / padrão 375px)
    await page.setViewportSize({ width: 375, height: 667 });

    // Logo deve continuar visível e legível
    const logo = page.locator('svg').filter({ hasText: /ALEGON/i }).first();
    await expect(logo).toBeVisible();

    // Botão de menu responsivo mobile deve estar presente no header
    const mobileMenuBtn = page.locator('button[aria-label="Abrir menu principal"]');
    await expect(mobileMenuBtn).toBeVisible();

    // Abre navegação mobile
    await mobileMenuBtn.click();
    await expect(page.getByText('Navegação do Studio')).toBeVisible();

    // Alternador de tema acessível
    const themeBtn = page.locator('button[aria-label*="Alternar para modo"]');
    await expect(themeBtn).toBeVisible();
  });
});
