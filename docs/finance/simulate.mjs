/**
 * ALEGON AI Photo Studio — Projeção Financeira e Simulação de Receita (12 Meses)
 * 
 * Execução: node docs/finance/simulate.mjs
 * Saída: docs/finance/simulation.csv
 * 
 * Modela 3 cenários (Conservador, Moderado, Otimista) considerando:
 * - Produtos: Edição Avulsa (R$ 7,90), Pack Inicial (R$ 19,90), Pack Criador (R$ 39,90), Pack Profissional (R$ 59,90)
 * - Assinaturas: Pessoal (R$ 29,90), Pro (R$ 69,90), Business (R$ 149,90)
 * - Impostos: Simples Nacional inicial 6% com progressão gradual
 * - Taxas Asaas: Mix 60% Pix (R$ 0,99 fixo) e 40% Cartão (R$ 0,49 + 2,99%)
 * - Custo IA OpenRouter: R$ 0,25 por crédito médio (com buffer 15% e câmbio efetivo R$ 6,30/USD)
 * - Breakage em assinaturas: 80% dos créditos efetivamente consumidos
 * - Infraestrutura Cloudflare R2/Workers: R$ 0,005 por imagem processada
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Definição dos Preços e Custos Unitários
const PRODUCTS = {
  single_edit: { name: 'Edição Avulsa', price: 7.90, credits: 1 },
  pack_inicial: { name: 'Pacote Inicial', price: 19.90, credits: 5 },
  pack_criador: { name: 'Pacote Criador', price: 39.90, credits: 12 },
  pack_profissional: { name: 'Pacote Profissional', price: 59.90, credits: 20 },
};

const PLANS = {
  pessoal: { name: 'Plano Pessoal', price: 29.90, credits: 15 },
  pro: { name: 'Plano Pro', price: 69.90, credits: 40 },
  business: { name: 'Plano Business', price: 149.90, credits: 100 },
};

const COST_PER_CREDIT_AI = 0.25; // R$ 0,25 por crédito
const COST_PER_CREDIT_INFRA = 0.005; // R$ 0,005 infra R2/Workers
const BASE_FIXED_COSTS_MONTHLY = 800.00; // Cloudflare, Resend, D1, contabilidade básica

// Função para calcular a taxa média do Asaas (60% Pix / 40% Cartão)
function calcAsaasFee(value) {
  const pixFee = 0.99;
  const cardFee = 0.49 + (value * 0.0299);
  return (0.60 * pixFee) + (0.40 * cardFee);
}

// Configuração dos Cenários
const SCENARIOS = {
  Conservador: {
    name: 'Conservador',
    initialUsers: 350,
    userGrowthRateStart: 0.15,
    userGrowthDecay: 0.95, // desaceleração suave
    subChurnRate: 0.08, // 8% churn mensal
    initialSubs: { pessoal: 12, pro: 5, business: 1 },
    subConversionRate: 0.04, // 4% dos novos usuários assinam
    subTierDist: { pessoal: 0.70, pro: 0.24, business: 0.06 },
    packBuyersRate: 0.07, // 7% dos novos usuários compram pacotes avulsos
    packDist: { single_edit: 0.40, pack_inicial: 0.35, pack_criador: 0.18, pack_profissional: 0.07 },
    cacPerPayingCustomer: 22.00,
  },
  Moderado: {
    name: 'Moderado',
    initialUsers: 800,
    userGrowthRateStart: 0.25,
    userGrowthDecay: 0.96,
    subChurnRate: 0.05, // 5% churn mensal
    initialSubs: { pessoal: 30, pro: 15, business: 5 },
    subConversionRate: 0.06, // 6% dos novos usuários assinam
    subTierDist: { pessoal: 0.60, pro: 0.30, business: 0.10 },
    packBuyersRate: 0.10, // 10% dos novos compram pacotes
    packDist: { single_edit: 0.30, pack_inicial: 0.35, pack_criador: 0.25, pack_profissional: 0.10 },
    cacPerPayingCustomer: 16.00,
  },
  Otimista: {
    name: 'Otimista',
    initialUsers: 1500,
    userGrowthRateStart: 0.35,
    userGrowthDecay: 0.97,
    subChurnRate: 0.035, // 3.5% churn mensal
    initialSubs: { pessoal: 65, pro: 35, business: 15 },
    subConversionRate: 0.08, // 8% dos novos usuários assinam
    subTierDist: { pessoal: 0.50, pro: 0.35, business: 0.15 },
    packBuyersRate: 0.14, // 14% dos novos compram pacotes
    packDist: { single_edit: 0.25, pack_inicial: 0.30, pack_criador: 0.30, pack_profissional: 0.15 },
    cacPerPayingCustomer: 12.00,
  },
};

function runSimulation() {
  const allRows = [];

  for (const [scenarioKey, cfg] of Object.entries(SCENARIOS)) {
    let currentUsers = cfg.initialUsers;
    let growthRate = cfg.userGrowthRateStart;

    // Estado das assinaturas ativas
    let activeSubs = { ...cfg.initialSubs };

    for (let month = 1; month <= 12; month++) {
      // 1. Novos usuários cadastrados no mês
      const newUsers = Math.round(currentUsers);
      currentUsers = currentUsers * (1 + growthRate);
      growthRate = Math.max(0.04, growthRate * cfg.userGrowthDecay);

      // 2. Churn e Novas Assinaturas
      const churnedSubs = {
        pessoal: Math.round(activeSubs.pessoal * cfg.subChurnRate),
        pro: Math.round(activeSubs.pro * cfg.subChurnRate),
        business: Math.round(activeSubs.business * cfg.subChurnRate),
      };

      const totalNewSubscribers = Math.round(newUsers * cfg.subConversionRate);
      const newSubs = {
        pessoal: Math.round(totalNewSubscribers * cfg.subTierDist.pessoal),
        pro: Math.round(totalNewSubscribers * cfg.subTierDist.pro),
        business: Math.round(totalNewSubscribers * cfg.subTierDist.business),
      };

      // Atualiza base de assinantes
      activeSubs.pessoal = Math.max(0, activeSubs.pessoal - churnedSubs.pessoal + newSubs.pessoal);
      activeSubs.pro = Math.max(0, activeSubs.pro - churnedSubs.pro + newSubs.pro);
      activeSubs.business = Math.max(0, activeSubs.business - churnedSubs.business + newSubs.business);

      const totalActiveSubs = activeSubs.pessoal + activeSubs.pro + activeSubs.business;

      // 3. Receita de Assinaturas (MRR)
      const mrrRevenue = 
        (activeSubs.pessoal * PLANS.pessoal.price) +
        (activeSubs.pro * PLANS.pro.price) +
        (activeSubs.business * PLANS.business.price);

      // Taxas Asaas e Custo IA de Assinaturas (80% de utilização dos créditos)
      const subAsaasFees = 
        (activeSubs.pessoal * calcAsaasFee(PLANS.pessoal.price)) +
        (activeSubs.pro * calcAsaasFee(PLANS.pro.price)) +
        (activeSubs.business * calcAsaasFee(PLANS.business.price));

      const subCreditsUsed = 0.80 * (
        (activeSubs.pessoal * PLANS.pessoal.credits) +
        (activeSubs.pro * PLANS.pro.credits) +
        (activeSubs.business * PLANS.business.credits)
      );

      const subAiCost = subCreditsUsed * COST_PER_CREDIT_AI;
      const subInfraCost = subCreditsUsed * COST_PER_CREDIT_INFRA;

      // 4. Vendas de Pacotes Avulsos
      const totalPackBuyers = Math.round(newUsers * cfg.packBuyersRate);
      const packSales = {
        single_edit: Math.round(totalPackBuyers * cfg.packDist.single_edit),
        pack_inicial: Math.round(totalPackBuyers * cfg.packDist.pack_inicial),
        pack_criador: Math.round(totalPackBuyers * cfg.packDist.pack_criador),
        pack_profissional: Math.round(totalPackBuyers * cfg.packDist.pack_profissional),
      };

      const packsRevenue = 
        (packSales.single_edit * PRODUCTS.single_edit.price) +
        (packSales.pack_inicial * PRODUCTS.pack_inicial.price) +
        (packSales.pack_criador * PRODUCTS.pack_criador.price) +
        (packSales.pack_profissional * PRODUCTS.pack_profissional.price);

      const packsAsaasFees = 
        (packSales.single_edit * calcAsaasFee(PRODUCTS.single_edit.price)) +
        (packSales.pack_inicial * calcAsaasFee(PRODUCTS.pack_inicial.price)) +
        (packSales.pack_criador * calcAsaasFee(PRODUCTS.pack_criador.price)) +
        (packSales.pack_profissional * calcAsaasFee(PRODUCTS.pack_profissional.price));

      const packCreditsTotal = 
        (packSales.single_edit * PRODUCTS.single_edit.credits) +
        (packSales.pack_inicial * PRODUCTS.pack_inicial.credits) +
        (packSales.pack_criador * PRODUCTS.pack_criador.credits) +
        (packSales.pack_profissional * PRODUCTS.pack_profissional.credits);

      const packAiCost = packCreditsTotal * COST_PER_CREDIT_AI;
      const packInfraCost = packCreditsTotal * COST_PER_CREDIT_INFRA;

      // 5. Totais Consolidados
      const grossRevenue = mrrRevenue + packsRevenue;

      // Simples Nacional: 6% inicial; se faturamento anualizado > 180k, sobe gradualmente para 7% - 8%
      const annualRunRate = grossRevenue * 12;
      let taxRate = 0.06;
      if (annualRunRate > 720000) taxRate = 0.085;
      else if (annualRunRate > 360000) taxRate = 0.075;
      else if (annualRunRate > 180000) taxRate = 0.065;

      const taxes = grossRevenue * taxRate;
      const totalAsaasFees = subAsaasFees + packsAsaasFees;
      const totalAiCost = subAiCost + packAiCost;
      const totalInfraCost = subInfraCost + packInfraCost;

      const totalVariableCosts = taxes + totalAsaasFees + totalAiCost + totalInfraCost;
      const contributionMargin = grossRevenue - totalVariableCosts;
      const contributionMarginPct = grossRevenue > 0 ? (contributionMargin / grossRevenue) * 100 : 0;

      // Custos Fixos com leve aumento por escala
      const fixedCosts = BASE_FIXED_COSTS_MONTHLY + (totalActiveSubs > 200 ? 500 : 0) + (totalActiveSubs > 500 ? 1000 : 0);

      // Marketing / CAC
      const totalNewPaying = totalNewSubscribers + totalPackBuyers;
      const marketingSpend = totalNewPaying * cfg.cacPerPayingCustomer;

      const ebitda = contributionMargin - fixedCosts - marketingSpend;

      allRows.push({
        cenario: scenarioKey,
        mes: month,
        novos_usuarios: newUsers,
        assinantes_ativos: totalActiveSubs,
        vendas_avulsas_pacotes: totalPackBuyers,
        receita_mrr_brl: Number(mrrRevenue.toFixed(2)),
        receita_pacotes_brl: Number(packsRevenue.toFixed(2)),
        receita_bruta_brl: Number(grossRevenue.toFixed(2)),
        impostos_brl: Number(taxes.toFixed(2)),
        taxas_asaas_brl: Number(totalAsaasFees.toFixed(2)),
        custo_ia_brl: Number(totalAiCost.toFixed(2)),
        custo_infra_brl: Number(totalInfraCost.toFixed(2)),
        margem_contribuicao_brl: Number(contributionMargin.toFixed(2)),
        margem_contribuicao_pct: Number(contributionMarginPct.toFixed(2)),
        custos_fixos_brl: Number(fixedCosts.toFixed(2)),
        marketing_cac_brl: Number(marketingSpend.toFixed(2)),
        ebitda_brl: Number(ebitda.toFixed(2)),
      });
    }
  }

  // Gera o arquivo CSV
  const headers = [
    'cenario',
    'mes',
    'novos_usuarios',
    'assinantes_ativos',
    'vendas_avulsas_pacotes',
    'receita_mrr_brl',
    'receita_pacotes_brl',
    'receita_bruta_brl',
    'impostos_brl',
    'taxas_asaas_brl',
    'custo_ia_brl',
    'custo_infra_brl',
    'margem_contribuicao_brl',
    'margem_contribuicao_pct',
    'custos_fixos_brl',
    'marketing_cac_brl',
    'ebitda_brl',
  ];

  const csvLines = [headers.join(',')];
  for (const row of allRows) {
    csvLines.push(headers.map(h => row[h]).join(','));
  }

  const outputPath = path.join(__dirname, 'simulation.csv');
  fs.writeFileSync(outputPath, csvLines.join('\n'), 'utf-8');
  console.log(`[SIMULAÇÃO FINANCEIRA] Gerado com sucesso: ${outputPath}`);
  console.log(`[SIMULAÇÃO FINANCEIRA] Total de registros gerados: ${allRows.length} (3 cenários x 12 meses)`);

  // Imprime resumo do Mês 12 para validação imediata
  console.log('\n--- RESUMO DO MÊS 12 POR CENÁRIO ---');
  for (const scen of Object.keys(SCENARIOS)) {
    const m12 = allRows.find(r => r.cenario === scen && r.mes === 12);
    console.log(`\nCenário ${scen}:`);
    console.log(`  Assinantes Ativos: ${m12.assinantes_ativos}`);
    console.log(`  Receita Bruta: R$ ${m12.receita_bruta_brl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
    console.log(`  MRR: R$ ${m12.receita_mrr_brl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
    console.log(`  Margem de Contribuição: ${m12.margem_contribuicao_pct}% (R$ ${m12.margem_contribuicao_brl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`);
    console.log(`  EBITDA: R$ ${m12.ebitda_brl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
  }
}

runSimulation();
