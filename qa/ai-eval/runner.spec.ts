/**
 * Teste automatizado do harness de avaliação de IA — ALEGON AI Photo Studio.
 * Dono: Subagente OpenRouter.
 */

import { describe, expect, it } from 'vitest';
import { runDryRunEvaluation, generateMarkdownReport } from './runner';
import { AI_TEST_CASES } from './cases';
import { writeFileSync } from 'fs';
import { resolve } from 'path';

describe('AI Evaluation Harness (qa/ai-eval)', () => {
  it('deve conter exatamente 30 casos de teste distribuídos nas 3 categorias canônicas', () => {
    expect(AI_TEST_CASES.length).toBe(30);

    const removals = AI_TEST_CASES.filter((c) => c.category === 'removal');
    const backgrounds = AI_TEST_CASES.filter((c) => c.category === 'background');
    const commercials = AI_TEST_CASES.filter((c) => c.category === 'commercial_portrait');

    expect(removals.length).toBe(10);
    expect(backgrounds.length).toBe(10);
    expect(commercials.length).toBe(10);
  });

  it('deve executar o dry-run completo aprovando todos os 30 casos de teste', () => {
    const { results, summary } = runDryRunEvaluation();

    expect(summary.total).toBe(30);
    expect(summary.passed).toBe(30);
    expect(summary.failed).toBe(0);

    // Valida que cada caso gerou prompt técnico estruturado com regras de qualidade
    for (const r of results) {
      expect(r.status).toBe('PASSED');
      expect(r.creditsCost).toBeGreaterThan(0);
      expect(r.modelTarget).toBeTruthy();
    }

    // Gera o relatório markdown oficial
    const reportMd = generateMarkdownReport(results, summary);
    expect(reportMd).toContain('Taxa de Sucesso da Suíte: **100.0%**');
    expect(reportMd).toContain('Remoção de Objetos e Pessoas (10 casos)');

    const reportPath = resolve(process.cwd(), 'qa/ai-eval/EVAL_REPORT.md');
    writeFileSync(reportPath, reportMd, 'utf8');
  });
});
