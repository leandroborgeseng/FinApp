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
  const base = snap && typeof snap === 'object' ? snap : {};
  const MB = base.monthlyBudget || [];
  const derived = deriveFromBudget(MB);
  return {
    netWorth: base.netWorth ?? 0,
    pfAvailable: base.pfAvailable ?? 0,
    pjAvailable: base.pjAvailable ?? 0,
    pfInvestments: base.pfInvestments ?? 0,
    pjInvestments: base.pjInvestments ?? 0,
    debts: base.debts ?? 0,
    monthResult: base.monthResult ?? 0,
    nextMonthForecast: base.nextMonthForecast ?? 0,
    monthlyBudget: MB,
    monthlyEvents: base.monthlyEvents || [],
    investments: base.investments || { pf: [], pj: [] },
    financingList: base.financingList || [],
    financing: base.financing || base.financingList?.[0],
    goals: base.goals || [],
    repasse: base.repasse,
    recurringOverrides: base.recurringOverrides || {},
    wealthForecast: base.wealthForecast || [],
    preferences: base.preferences || { dark: false },
    accounts: base.accounts || [],
    startBalances: base.startBalances || { PF: base.pfAvailable, PJ: base.pjAvailable, Todos: (base.pfAvailable || 0) + (base.pjAvailable || 0) },
    cashFlow: derived.cashFlow || [],
    cdbProjection: derived.cdbProjection || [],
    planningChart36: derived.planningChart36 || [],
    planning: derived.planning || [],
    netWorthHistory: derived.netWorthHistory || [],
    ...derived,
  };
}
