import { budgetLabelToKey, isCurrentMonthKey } from './dates.js';

export function openingBalanceForMonth(finance, monthIdx, entityFilter = 'Todos') {
  const budget = finance.monthlyBudget || [];
  const row = budget[monthIdx];
  const key = row?.m ? budgetLabelToKey(row.m) : null;

  if (key && isCurrentMonthKey(key)) {
    if (entityFilter === 'PF') return finance.pfAvailable ?? 0;
    if (entityFilter === 'PJ') return finance.pjAvailable ?? 0;
    return (finance.pfAvailable ?? 0) + (finance.pjAvailable ?? 0);
  }

  if (monthIdx === 0) {
    const s = finance.startBalances || {};
    if (entityFilter === 'PF') return s.PF ?? 0;
    if (entityFilter === 'PJ') return s.PJ ?? 0;
    return s.Todos ?? (s.PF ?? 0) + (s.PJ ?? 0);
  }

  const prev = budget[monthIdx - 1];
  if (!prev) return 0;
  if (entityFilter === 'PF') return prev.pfSaldo ?? 0;
  if (entityFilter === 'PJ') return prev.pjSaldo ?? 0;
  return (prev.pfSaldo ?? 0) + (prev.pjSaldo ?? 0);
}

export function buildMonthEntries(finance, { monthKey, entityFilter, transactions = [] }) {
  const realTx = (transactions || [])
    .filter((t) => t.date?.startsWith(monthKey))
    .filter((t) => entityFilter === 'Todos' || t.entity === entityFilter);

  const projected = (finance.monthlyEvents || [])
    .filter((e) => entityFilter === 'Todos' || e.entity === entityFilter)
    .map((e) => ({
      id: `proj-${e.desc}-${e.day}`,
      type: e.type,
      desc: e.desc,
      value: e.value,
      entity: e.entity,
      date: `${monthKey}-${String(e.day).padStart(2, '0')}`,
      day: e.day,
      done: false,
      cat: e.cat,
      isProjected: true,
    }))
    .filter((e) => !realTx.some((r) => r.desc === e.desc && r.date === e.date));

  const fromTx = realTx.map((t) => ({
    ...t,
    day: parseInt(t.date.split('-')[2], 10),
    isProjected: false,
  }));

  return [...fromTx, ...projected].sort(
    (a, b) => a.day - b.day || (a.type === 'income' ? -1 : 1),
  );
}

export function todayContextForMonth(monthKey) {
  const isCurrent = isCurrentMonthKey(monthKey);
  const [y, m] = monthKey.split('-').map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();
  const todayDay = isCurrent ? new Date().getDate() : null;
  return { isCurrent, daysInMonth, todayDay };
}

export function computeDailyBalances(finance, { monthKey, monthIdx, entityFilter = 'Todos', transactions = [] }) {
  const opening = openingBalanceForMonth(finance, monthIdx, entityFilter);
  const { daysInMonth } = todayContextForMonth(monthKey);
  const entries = buildMonthEntries(finance, { monthKey, entityFilter, transactions });

  let running = opening;
  const days = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const date = `${monthKey}-${String(day).padStart(2, '0')}`;
    const dayEntries = entries.filter((e) => e.date === date);
    const dayInc = dayEntries.filter((e) => e.type === 'income').reduce((s, e) => s + e.value, 0);
    const dayExp = dayEntries.filter((e) => e.type === 'expense').reduce((s, e) => s + e.value, 0);
    running += dayInc - dayExp;
    days.push({ day, date, balance: running, dayInc, dayExp });
  }
  return { opening, days, endBalance: running };
}

export function balanceAtDay(finance, opts, day) {
  const { opening, days } = computeDailyBalances(finance, opts);
  const row = days.find((d) => d.day === day);
  return row?.balance ?? opening;
}
