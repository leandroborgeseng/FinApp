// Deriva campos calculados a partir do orçamento mensal (mesma lógica de data.js)
import { buildPlanningChart36 } from './planningChart.js';

export function deriveFromBudget(MB) {
  if (!MB?.length) return {};

  return {
    planning: MB.map((r) => ({
      month: r.m,
      income: r.pjInc + (r.pfInc - r.repasse),
      expense: (r.pjInc - r.pjSaldo) + (r.pfInc - r.repasse - r.pfSaldo),
      saldo: r.pjSaldo + r.pfSaldo,
      aplicPJ: r.aplicPJ,
      aplicPF: r.aplicPF,
      repasse: r.repasse,
    })),
    cashFlow: MB.slice(1, 13).map((r) => ({
      label: r.m.slice(0, 3),
      income: r.pjInc + (r.pfInc - r.repasse),
      expense: (r.pjInc - r.pjSaldo) + (r.pfInc - r.pfSaldo),
    })),
    cdbProjection: MB.map((r) => ({
      label: r.m,
      value: r.cdb,
      aplic: r.aplicPJ + r.aplicPF,
      ret: r.cdbRet,
    })),
    planningChart36: buildPlanningChart36(MB),
    netWorthHistory: [
      { year: 2022, value: 280000 },
      { year: 2023, value: 520000 },
      { year: 2024, value: 820000 },
      { year: 2025, value: 1080000 },
      { year: 2026, value: MB[0]?.cdb ? 1250000 : 1250000 },
    ],
  };
}

export function buildFinancePayload(snap) {
  const MB = snap.monthlyBudget || [];
  const derived = deriveFromBudget(MB);
  return {
    netWorth: snap.netWorth,
    pfAvailable: snap.pfAvailable,
    pjAvailable: snap.pjAvailable,
    pfInvestments: snap.pfInvestments,
    pjInvestments: snap.pjInvestments,
    debts: snap.debts,
    monthResult: snap.monthResult,
    nextMonthForecast: snap.nextMonthForecast,
    monthlyBudget: MB,
    monthlyEvents: snap.monthlyEvents || [],
    investments: snap.investments || { pf: [], pj: [] },
    financingList: snap.financingList || [],
    financing: snap.financing || snap.financingList?.[0],
    goals: snap.goals || [],
    repasse: snap.repasse,
    recurringOverrides: snap.recurringOverrides || {},
    wealthForecast: snap.wealthForecast || [],
    preferences: snap.preferences || { dark: false },
    accounts: snap.accounts || [],
    startBalances: snap.startBalances || { PF: snap.pfAvailable, PJ: snap.pjAvailable, Todos: (snap.pfAvailable || 0) + (snap.pjAvailable || 0) },
    ...derived,
  };
}
