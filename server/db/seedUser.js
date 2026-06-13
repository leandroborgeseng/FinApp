import bcrypt from 'bcryptjs';
import { AppData } from '../../src/data.js';
import { query } from './pool.js';

export const DEMO_EMAIL = 'demo@finapp.com';
export const DEMO_PASSWORD = 'finapp2026';

export function buildSnapshotData() {
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
    preferences: { dark: false },
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
  const userId = created[0].id;

  await query(
    `INSERT INTO user_snapshots (user_id, data) VALUES ($1, $2)`,
    [userId, JSON.stringify(buildSnapshotData())],
  );

  for (const tx of AppData.transactions) {
    await query(
      `INSERT INTO transactions (id, user_id, description, value, type, entity, date, done, cat)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [String(tx.id), userId, tx.desc, tx.value, tx.type, tx.entity, tx.date, tx.done, tx.cat],
    );
  }

  console.log(`[db] Usuário demo criado: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
  return userId;
}

export async function seedUserData(userId) {
  const snap = buildSnapshotData();
  await query(
    `INSERT INTO user_snapshots (user_id, data) VALUES ($1, $2)
     ON CONFLICT (user_id) DO UPDATE SET data = $2, updated_at = NOW()`,
    [userId, JSON.stringify(snap)],
  );
}
