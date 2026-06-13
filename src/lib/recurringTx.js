import { budgetLabelToKey } from './dates.js';

function eventValue(event, monthIdx, overrides, rowIdx) {
  const ov = overrides[rowIdx]?.[monthIdx];
  return ov !== undefined ? ov : event.value;
}

export function buildRecurringTransactionsForMonth(events, monthLabel, monthIdx, overrides = {}) {
  const monthKey = budgetLabelToKey(monthLabel);
  if (!monthKey) return [];

  const [year, month] = monthKey.split('-').map(Number);

  return (events || []).map((event, rowIdx) => {
    const value = eventValue(event, monthIdx, overrides, rowIdx);
    if (!value) return null;

    const day = Math.min(Math.max(1, event.day || 5), 28);
    const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    return {
      type: event.type,
      desc: event.desc,
      value,
      entity: event.entity,
      date,
      done: false,
      cat: event.cat || 'Outros',
    };
  }).filter(Boolean);
}

export function filterNewTransactions(existing = [], generated = []) {
  const keys = new Set(
    existing.map((t) => `${t.desc}|${t.date}|${t.entity}|${t.type}`),
  );
  return generated.filter((t) => !keys.has(`${t.desc}|${t.date}|${t.entity}|${t.type}`));
}
