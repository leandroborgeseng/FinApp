import { AppData } from '../../src/data.js';
import { budgetLabelToKey } from '../../src/lib/dates.js';
import { query } from '../db/pool.js';

/** Repasse mensal 2026 — Jun–Dez vêm do orçamento da planilha. */
export function buildRepasseMonths() {
  const fromBudget = {};
  for (const row of AppData.monthlyBudget) {
    const [short, yr] = row.m.split('/');
    if (yr === '26') fromBudget[short] = row.repasse;
  }

  const template = [
    ['Jan', 28000, true],
    ['Fev', 28000, true],
    ['Mar', 28000, true],
    ['Abr', 32000, true],
    ['Mai', 32000, true],
    ['Jun', 34000, false],
    ['Jul', 40000, false],
    ['Ago', 40000, false],
    ['Set', 25000, false],
    ['Out', 25000, false],
    ['Nov', 25000, false],
    ['Dez', 25000, false],
  ];

  return template.map(([m, fallback, done]) => ({
    m,
    amount: fromBudget[m] ?? fallback,
    done,
  }));
}

/** Gera lançamentos do mês a partir das recorrências da planilha. */
export function buildSpreadsheetTransactions(monthIdx = 0, refDate = new Date()) {
  const monthLabel = AppData.monthlyBudget[monthIdx]?.m;
  if (!monthLabel) return [];

  const monthKey = budgetLabelToKey(monthLabel);
  if (!monthKey) return [];

  const [year, month] = monthKey.split('-').map(Number);
  const refDay = refDate.getFullYear() === year && refDate.getMonth() + 1 === month
    ? refDate.getDate()
    : 31;

  return AppData.monthlyEvents.map((event, i) => {
    const day = Math.min(Math.max(1, event.day || 5), 28);
    const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return {
      id: `sheet-${monthKey}-${i}`,
      type: event.type,
      desc: event.desc,
      value: event.value,
      entity: event.entity,
      date,
      done: day < refDay,
      cat: event.cat || 'Outros',
    };
  });
}

function parseSnapshot(data) {
  if (!data) return {};
  return typeof data === 'string' ? JSON.parse(data) : data;
}

export { parseSnapshot };

export async function isSpreadsheetLoaded(userId) {
  const { rows } = await query('SELECT data FROM user_snapshots WHERE user_id = $1', [userId]);
  if (!rows.length) return false;
  return parseSnapshot(rows[0].data)?.preferences?.spreadsheetLoaded === true;
}

export async function reapplySpreadsheetSeed(userId, monthIdx = 0) {
  const { buildSnapshotData } = await import('../db/seedUser.js');
  const snap = buildSnapshotData({ spreadsheetLoaded: true });
  await query(
    `INSERT INTO user_snapshots (user_id, data) VALUES ($1, $2)
     ON CONFLICT (user_id) DO UPDATE SET data = $2, updated_at = NOW()`,
    [userId, JSON.stringify(snap)],
  );

  const txs = buildSpreadsheetTransactions(monthIdx);
  await query('DELETE FROM transactions WHERE user_id = $1', [userId]);
  for (const tx of txs) {
    await query(
      `INSERT INTO transactions (id, user_id, description, value, type, entity, date, done, cat)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [tx.id, userId, tx.desc, tx.value, tx.type, tx.entity, tx.date, tx.done, tx.cat],
    );
  }
  return txs.length;
}

/** Carrega planilha para usuários que ainda não receberam o seed inicial. */
export async function ensureAllSpreadsheetsLoaded() {
  const { rows: users } = await query('SELECT id FROM users');
  for (const { id } of users) {
    if (await isSpreadsheetLoaded(id)) continue;
    const n = await reapplySpreadsheetSeed(id);
    const month = AppData.monthlyBudget[0]?.m || 'Jun/26';
    console.log(`[db] Planilha carregada (${month}): ${n} lançamentos · user ${id}`);
  }
}
