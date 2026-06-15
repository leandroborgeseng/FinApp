import { query } from '../db/pool.js';
import { derivePortfolioFromSnapshot } from '../../src/lib/portfolioTotals.js';
import { parseSnapshot } from './spreadsheetSeed.js';

/**
 * Reinicia o histórico a partir de uma data: apaga lançamentos e define saldo inicial em conta.
 * @param {string} userId
 * @param {{ cutoffDate: string, balance?: number, accountId?: string, wipeAll?: boolean }} opts
 */
export async function resetFromDate(userId, opts = {}) {
  const {
    cutoffDate,
    balance,
    accountId = 'pf-cc',
    wipeAll = true,
  } = opts;

  if (!cutoffDate || !/^\d{4}-\d{2}-\d{2}$/.test(cutoffDate)) {
    throw new Error('cutoffDate inválida — use AAAA-MM-DD');
  }
  if (balance != null && !Number.isFinite(Number(balance))) {
    throw new Error('balance inválido');
  }

  const { rows } = await query('SELECT data FROM user_snapshots WHERE user_id = $1', [userId]);
  const snap = parseSnapshot(rows[0]?.data) || {};

  let deleted;
  if (wipeAll) {
    const r = await query('DELETE FROM transactions WHERE user_id = $1', [userId]);
    deleted = r.rowCount ?? 0;
  } else {
    const r = await query(
      'DELETE FROM transactions WHERE user_id = $1 AND date < $2',
      [userId, cutoffDate],
    );
    deleted = r.rowCount ?? 0;
  }

  const accounts = [...(snap.accounts || [])];
  if (balance != null) {
    const idx = accounts.findIndex((a) => a.id === accountId);
    if (idx < 0) throw new Error(`Conta não encontrada: ${accountId}`);
    accounts[idx] = { ...accounts[idx], balance: Math.round(Number(balance) * 100) / 100 };
    // PJ corrente permanece zerada — saldo inicial só na PF
    for (let i = 0; i < accounts.length; i++) {
      if (accounts[i].type === 'checking' && accounts[i].entity === 'PJ') {
        accounts[i] = { ...accounts[i], balance: 0 };
      }
    }
  }

  const preferences = {
    ...(snap.preferences || {}),
    spreadsheetLoaded: snap.preferences?.spreadsheetLoaded ?? true,
    dataStartsAt: cutoffDate,
    historyCutoff: cutoffDate,
    baselineLocked: true,
  };

  const derived = derivePortfolioFromSnapshot({ ...snap, accounts });

  const next = {
    ...snap,
    ...derived,
    accounts,
    preferences,
  };

  await query(
    `INSERT INTO user_snapshots (user_id, data) VALUES ($1, $2)
     ON CONFLICT (user_id) DO UPDATE SET data = $2, updated_at = NOW()`,
    [userId, JSON.stringify(next)],
  );

  return {
    deleted,
    cutoffDate,
    balance: balance != null ? Number(balance) : undefined,
    accountId,
    pfAvailable: derived.pfAvailable,
    pjAvailable: derived.pjAvailable,
    netWorth: derived.netWorth,
  };
}

export async function findUserIdByEmail(email) {
  const { rows } = await query(
    'SELECT id FROM users WHERE email = $1',
    [email.toLowerCase().trim()],
  );
  return rows[0]?.id || null;
}
