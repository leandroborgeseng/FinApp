const MONTH_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export { MONTH_LABELS };

export function budgetLabelToKey(label) {
  const [m, y] = label.split('/');
  const idx = MONTH_LABELS.indexOf(m);
  if (idx < 0) return null;
  return `20${y}-${String(idx + 1).padStart(2, '0')}`;
}

export function currentMonthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function getTodayDay(date = new Date()) {
  return date.getDate();
}

export function formatMonthLong(date = new Date()) {
  const s = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function findBudgetIndex(budget = [], date = new Date()) {
  const key = currentMonthKey(date);
  const exact = budget.findIndex((b) => budgetLabelToKey(b.m) === key);
  if (exact >= 0) return exact;

  const target = date.getFullYear() * 12 + date.getMonth();
  let best = 0;
  let bestDiff = Infinity;
  budget.forEach((b, i) => {
    const k = budgetLabelToKey(b.m);
    if (!k) return;
    const [y, m] = k.split('-').map(Number);
    const diff = Math.abs(y * 12 + (m - 1) - target);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = i;
    }
  });
  return best;
}

export function repasseMonthIndex(repasse, date = new Date()) {
  const year = date.getFullYear();
  if ((repasse?.year || year) !== year) return Math.min(date.getMonth(), (repasse?.months?.length || 12) - 1);
  return Math.min(date.getMonth(), (repasse?.months?.length || 12) - 1);
}

export function repasseTotalDone(months = []) {
  return months.filter((m) => m.done).reduce((s, m) => s + (m.amount || 0), 0);
}

export function isCurrentMonthKey(monthKey) {
  return monthKey === currentMonthKey();
}

export function parseBudgetMonth(label) {
  const monthKey = budgetLabelToKey(label);
  if (!monthKey) return null;
  const [year, m] = monthKey.split('-').map(Number);
  const monthIndex0 = m - 1;
  return {
    monthKey,
    year,
    monthIndex0,
    daysInMonth: new Date(year, monthIndex0 + 1, 0).getDate(),
    label,
  };
}

export function formatBudgetMonthLong(label) {
  const p = parseBudgetMonth(label);
  if (!p) return label;
  const d = new Date(p.year, p.monthIndex0, 1);
  const s = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function dayLabelFromMonthKey(monthKey, day) {
  const [y, m] = monthKey.split('-').map(Number);
  const date = new Date(y, m - 1, day);
  return date.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric' });
}

export function monthKeyFromBudgetIndex(budget, monthIdx) {
  const label = budget[monthIdx]?.m;
  return label ? budgetLabelToKey(label) : currentMonthKey();
}

/** Chaves YYYY-MM de jan até o mês atual (ou dez) do ano informado. */
export function yearMonthKeys(year = new Date().getFullYear(), date = new Date()) {
  const endMonth = year === date.getFullYear() ? date.getMonth() : 11;
  return Array.from({ length: endMonth + 1 }, (_, i) =>
    `${year}-${String(i + 1).padStart(2, '0')}`,
  );
}

export function monthKeyToLabel(monthKey) {
  const [y, m] = monthKey.split('-').map(Number);
  if (!m || m < 1 || m > 12) return monthKey;
  return `${MONTH_LABELS[m - 1]}/${String(y).slice(2)}`;
}

export function yearPeriodBounds(year = new Date().getFullYear(), date = new Date()) {
  const current = currentMonthKey(date);
  const [cy, cm] = current.split('-').map(Number);
  const yearStart = `${year}-01-01`;
  const yearEndExclusive = year !== cy
    ? `${year + 1}-01-01`
    : cm === 12
      ? `${cy + 1}-01-01`
      : `${cy}-${String(cm + 1).padStart(2, '0')}-01`;
  return { yearStart, yearEndExclusive, currentMonthKey: current };
}
