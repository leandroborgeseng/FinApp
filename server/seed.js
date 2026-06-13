import { AppData } from '../src/data.js';
import { buildRepasseMonths, buildSpreadsheetTransactions } from './utils/spreadsheetSeed.js';

export function createSeedData() {
  return {
    user: { id: '1', name: 'Usuário Demo', email: 'demo@finapp.com', plan: 'pro' },
    transactions: buildSpreadsheetTransactions(0),
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
      months: buildRepasseMonths(),
    },
    recurringOverrides: {},
    startBalances: AppData.startBalances,
    netWorth: AppData.netWorth,
    pfAvailable: AppData.pfAvailable,
    pjAvailable: AppData.pjAvailable,
    pfInvestments: AppData.pfInvestments,
    pjInvestments: AppData.pjInvestments,
    debts: AppData.debts,
    monthResult: AppData.monthResult,
    nextMonthForecast: AppData.nextMonthForecast,
    wealthForecast: AppData.wealthForecast,
    preferences: { dark: false, spreadsheetLoaded: true },
  };
}
