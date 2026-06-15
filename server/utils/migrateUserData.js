import { getPool, query } from '../db/pool.js';
import { derivePortfolioFromSnapshot } from '../../src/lib/portfolioTotals.js';
import { parseSnapshot } from './spreadsheetSeed.js';
import { resetFromDate } from './resetFromDate.js';

const LEGACY_PF = 85000;
const LEGACY_PJ = 320000;
export const DEFAULT_BASELINE_DATE = '2026-06-14';
export const DEFAULT_PF_BALANCE = 10668.46;

export function snapshotHasLegacyDemo(snap) {
  if (!snap || typeof snap !== 'object') return false;
  if (snap.preferences?.baselineLocked || snap.preferences?.historyCutoff) return false;

  const accounts = snap.accounts || [];
  const pf = accounts.find((a) => a.id === 'pf-cc' && a.type === 'checking');
  const pj = accounts.find((a) => a.id === 'pj-cc' && a.type === 'checking');

  return (
    Number(snap.pfAvailable) === LEGACY_PF
    || Number(snap.pjAvailable) === LEGACY_PJ
    || Number(pf?.balance) === LEGACY_PF
    || Number(pj?.balance) === LEGACY_PJ
  );
}

function snapshotNeedsNormalize(snap, derived) {
  return (
    JSON.stringify(derived.accounts) !== JSON.stringify(snap.accounts)
    || derived.pfAvailable !== snap.pfAvailable
    || derived.pjAvailable !== snap.pjAvailable
    || derived.netWorth !== snap.netWorth
  );
}

/** Normaliza snapshot no banco (saldos demo → reais, totais recalculados). */
export async function normalizeUserSnapshot(userId, snap) {
  const derived = derivePortfolioFromSnapshot(snap);
  if (!snapshotNeedsNormalize(snap, derived)) return derived;

  const next = { ...snap, ...derived, accounts: derived.accounts };
  await query(
    `INSERT INTO user_snapshots (user_id, data) VALUES ($1, $2)
     ON CONFLICT (user_id) DO UPDATE SET data = $2, updated_at = NOW()`,
    [userId, JSON.stringify(next)],
  );
  return derived;
}

/** Migração única: remove demo antigo e aplica baseline PF do usuário. */
export async function migrateAllUserData() {
  if (!getPool()) return;

  const { rows: users } = await query('SELECT id FROM users');

  for (const { id } of users) {
    try {
      const { rows } = await query('SELECT data FROM user_snapshots WHERE user_id = $1', [id]);
      const snap = parseSnapshot(rows[0]?.data);
      if (!snap) continue;

      if (snapshotHasLegacyDemo(snap)) {
        await resetFromDate(id, {
          cutoffDate: DEFAULT_BASELINE_DATE,
          balance: DEFAULT_PF_BALANCE,
          wipeAll: true,
        });
        console.log(`[migrate] Baseline PF R$ ${DEFAULT_PF_BALANCE} · user ${id}`);
        continue;
      }

      await normalizeUserSnapshot(id, snap);
    } catch (err) {
      console.error(`[migrate] Falha user ${id}:`, err.message);
    }
  }
}
