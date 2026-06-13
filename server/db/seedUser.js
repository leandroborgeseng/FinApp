import bcrypt from 'bcryptjs';
import { AppData } from '../../src/data.js';
import { query } from './pool.js';
import { buildRepasseMonths } from '../utils/spreadsheetSeed.js';

export const DEMO_EMAIL = 'demo@finapp.com';
export const DEMO_PASSWORD = 'finapp2026';

export function buildSnapshotData({ spreadsheetLoaded = false } = {}) {
  return {
    monthlyBudget: AppData.monthlyBudget,
    monthlyEvents: AppData.monthlyEvents,
    investments: AppData.investments,
    financingList: AppData.financingList,
    goals: AppData.goals,
    repasse: {
      day: 5,
      monthlyLimit: 50000,
      annualLimit: 600000,
      year: 2026,
      months: buildRepasseMonths(),
    },
    recurringOverrides: {},
    startBalances: AppData.startBalances,
    financing: AppData.financing,
    netWorth: AppData.netWorth,
    pfAvailable: AppData.pfAvailable,
    pjAvailable: AppData.pjAvailable,
    pfInvestments: AppData.pfInvestments,
    pjInvestments: AppData.pjInvestments,
    debts: AppData.debts,
    monthResult: AppData.monthResult,
    nextMonthForecast: AppData.nextMonthForecast,
    wealthForecast: AppData.wealthForecast,
    preferences: { dark: false, spreadsheetLoaded },
    accounts: AppData.accounts,
  };
}

export async function ensureDemoUser() {
  if (process.env.SEED_DEMO_USER === 'false') return null;

  const hash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const { rows } = await query('SELECT id FROM users WHERE email = $1', [DEMO_EMAIL]);

  if (rows.length > 0) {
    console.log(`[db] Usuário demo já existe (${DEMO_EMAIL}) — senha mantida`);
    return rows[0].id;
  }

  const { rows: created } = await query(
    `INSERT INTO users (email, password_hash, name, plan)
     VALUES ($1, $2, $3, $4) RETURNING id`,
    [DEMO_EMAIL, hash, 'Leandro Borges', 'pro'],
  );

  console.log(`[db] Usuário demo criado: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
  return created[0].id;
}

export async function seedUserData(userId) {
  const snap = buildSnapshotData();
  await query(
    `INSERT INTO user_snapshots (user_id, data) VALUES ($1, $2)
     ON CONFLICT (user_id) DO UPDATE SET data = $2, updated_at = NOW()`,
    [userId, JSON.stringify(snap)],
  );
}
