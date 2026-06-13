import { AppData } from '../src/data.js';

export function createSeedData() {
  return {
    user: { id: '1', name: 'Usuário Demo', email: 'demo@finapp.com', plan: 'pro' },
    transactions: AppData.transactions.map((t) => ({ ...t, id: String(t.id) })),
    monthlyBudget: AppData.monthlyBudget.map((b) => ({ ...b })),
    investments: JSON.parse(JSON.stringify(AppData.investments)),
    financingList: AppData.financingList.map((f) => ({ ...f })),
    goals: AppData.goals.map((g) => ({ ...g })),
    accounts: AppData.accounts.map((a) => ({ ...a })),
    repasse: {
      day: 5,
      monthlyLimit: 50000,
      annualLimit: 600000,
      year: 2026,
      months: [
        { m: 'Jan', amount: 28000, done: true },
        { m: 'Fev', amount: 28000, done: true },
        { m: 'Mar', amount: 28000, done: true },
        { m: 'Abr', amount: 32000, done: true },
        { m: 'Mai', amount: 32000, done: true },
        { m: 'Jun', amount: 34000, done: false },
        { m: 'Jul', amount: 40000, done: false },
        { m: 'Ago', amount: 40000, done: false },
        { m: 'Set', amount: 25000, done: false },
        { m: 'Out', amount: 25000, done: false },
        { m: 'Nov', amount: 25000, done: false },
        { m: 'Dez', amount: 25000, done: false },
      ],
    },
    recurringOverrides: {},
    netWorth: AppData.netWorth,
    pfAvailable: AppData.pfAvailable,
    pjAvailable: AppData.pjAvailable,
    pfInvestments: AppData.pfInvestments,
    pjInvestments: AppData.pjInvestments,
    debts: AppData.debts,
    monthResult: AppData.monthResult,
    nextMonthForecast: AppData.nextMonthForecast,
    wealthForecast: AppData.wealthForecast,
  };
}
