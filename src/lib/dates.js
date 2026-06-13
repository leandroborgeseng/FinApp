const MONTH_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

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
