import { AppData } from '../../src/data.js';
import { currentMonthKey, findBudgetIndex } from '../../src/lib/dates.js';
import { query } from '../db/pool.js';
import { buildSpreadsheetTransactions, parseSnapshot } from './spreadsheetSeed.js';

function nextMonthStart(monthKey) {
  const [y, m] = monthKey.split('-').map(Number);
  const d = new Date(y, m, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

/** Remove histórico fora do mês atual e recria lançamentos só deste mês. */
export async function resetAccountToCurrentMonth(userId, monthKey = currentMonthKey()) {
  const { buildSnapshotData } = await import('../db/seedUser.js');
  const monthIdx = findBudgetIndex(AppData.monthlyBudget);
  const monthLabel = AppData.monthlyBudget[monthIdx]?.m || monthKey;

  const { rows } = await query('SELECT data FROM user_snapshots WHERE user_id = $1', [userId]);
  const existing = parseSnapshot(rows[0]?.data);

  const snap = buildSnapshotData({ spreadsheetLoaded: true });
  snap.recurringOverrides = {};
  snap.preferences = {
    ...(existing?.preferences || {}),
    dark: existing?.preferences?.dark ?? false,
    spreadsheetLoaded: true,
    dataStartsAt: monthKey,
  };

  await query(
    `INSERT INTO user_snapshots (user_id, data) VALUES ($1, $2)
     ON CONFLICT (user_id) DO UPDATE SET data = $2, updated_at = NOW()`,
    [userId, JSON.stringify(snap)],
  );

  const monthEnd = nextMonthStart(monthKey);

  // Apaga tudo até o fim do mês atual (histórico + mês corrente para recriar limpo)
  await query(
    'DELETE FROM transactions WHERE user_id = $1 AND date < $2',
    [userId, monthEnd],
  );

  const txs = buildSpreadsheetTransactions(monthIdx);
  for (const tx of txs) {
    await query(
      `INSERT INTO transactions (id, user_id, description, value, type, entity, date, done, cat)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [tx.id, userId, tx.desc, tx.value, tx.type, tx.entity, tx.date, tx.done, tx.cat],
    );
  }

  return { monthKey, monthLabel, txs: txs.length };
}

/** Aplica baseline do mês atual para contas que ainda não foram reiniciadas. */
export async function ensureAccountMonthBaseline() {
  const monthKey = currentMonthKey();
  const force = process.env.FORCE_RESET_MONTH === 'true';
  const { rows: users } = await query('SELECT id FROM users');

  for (const { id } of users) {
    const { rows } = await query('SELECT data FROM user_snapshots WHERE user_id = $1', [id]);
    const prefs = parseSnapshot(rows[0]?.data)?.preferences;
    if (!force && prefs?.dataStartsAt === monthKey) continue;

    const result = await resetAccountToCurrentMonth(id, monthKey);
    console.log(
      `[db] Conta reiniciada em ${result.monthLabel}: ${result.txs} lançamentos · user ${id}`,
    );
  }
}
