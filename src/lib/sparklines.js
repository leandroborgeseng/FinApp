import { findBudgetIndex } from './dates.js';
import { fmt } from '../data.js';

export function budgetSparkSeries(budget, pickValue, count = 4, liveTail = null) {
  if (!budget?.length) return [liveTail ?? 0];
  const idx = findBudgetIndex(budget);
  const start = Math.max(0, idx - count + 1);
  const pts = budget.slice(start, idx + 1).map(pickValue);
  if (liveTail != null && pts.length) pts[pts.length - 1] = liveTail;
  if (pts.length < 2) return pts.length ? [pts[0], pts[0]] : [0, 0];
  return pts;
}

export function debtSpark(currentDebt, count = 4) {
  const debt = Math.abs(currentDebt || 0);
  if (!debt) return [0, 0];
  const pts = [];
  for (let i = count - 1; i >= 0; i -= 1) {
    pts.push(Math.round(debt * (1 + i * 0.028)));
  }
  pts[pts.length - 1] = debt;
  return pts;
}

function cdbEntityShare(row, entity) {
  const cdb = row.cdb || 0;
  const pf = row.aplicPF || 0;
  const pj = row.aplicPJ || 0;
  const total = pf + pj;
  if (!total) return cdb * (entity === 'pf' ? 0.5 : 0.5);
  return cdb * (entity === 'pf' ? pf / total : pj / total);
}

export function buildDashboardSparks(finance) {
  const budget = finance.monthlyBudget || [];
  const monthSurplus = (r) => r.pjSaldo + r.pfSaldo;

  return {
    pf: budgetSparkSeries(budget, (r) => r.pfSaldo, 4, finance.pfAvailable),
    pj: budgetSparkSeries(budget, (r) => r.pjSaldo, 4, finance.pjAvailable),
    investPf: budgetSparkSeries(budget, (r) => cdbEntityShare(r, 'pf'), 4, finance.pfInvestments),
    investPj: budgetSparkSeries(budget, (r) => cdbEntityShare(r, 'pj'), 4, finance.pjInvestments),
    debts: debtSpark(finance.debts),
    monthResult: budgetSparkSeries(budget, monthSurplus, 4, finance.monthResult),
  };
}

export function netWorthDelta12m(history = []) {
  if (history.length < 2) return null;
  const sorted = [...history].sort((a, b) => (a.year || 0) - (b.year || 0));
  const latest = sorted[sorted.length - 1];
  const prev = sorted[sorted.length - 2];
  return (latest?.value ?? 0) - (prev?.value ?? 0);
}

export function formatNetWorthDelta(delta) {
  if (delta == null) return null;
  const sign = delta >= 0 ? '↑' : '↓';
  const abs = Math.abs(delta);
  const label = abs >= 1000 ? fmt(abs, { short: true }) : fmt(abs);
  return `${sign} R$ ${label} no último ano`;
}
