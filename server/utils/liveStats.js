function currentMonthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function applyLiveStats(payload, transactions = []) {
  const monthKey = currentMonthKey();
  const starts = payload.startBalances || { PF: payload.pfAvailable, PJ: payload.pjAvailable };

  const monthTx = transactions.filter((t) => t.date?.startsWith(monthKey));
  const monthIncome = monthTx.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.value), 0);
  const monthExpense = monthTx.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.value), 0);
  payload.monthResult = monthIncome - monthExpense;

  let pf = Number(starts.PF ?? payload.pfAvailable ?? 0);
  let pj = Number(starts.PJ ?? payload.pjAvailable ?? 0);

  for (const t of transactions.filter((tx) => tx.done)) {
    const v = Number(t.value);
    if (t.type === 'income') {
      if (t.entity === 'PF') pf += v;
      if (t.entity === 'PJ') pj += v;
    } else if (t.type === 'expense') {
      if (t.entity === 'PF') pf -= v;
      if (t.entity === 'PJ') pj -= v;
    } else if (t.type === 'transfer') {
      if (t.entity === 'PJ') pj -= v;
      if (t.entity === 'PF') pf += v;
    }
  }

  payload.pfAvailable = pf;
  payload.pjAvailable = pj;
  payload.netWorth = pf + pj
    + Number(payload.pfInvestments || 0)
    + Number(payload.pjInvestments || 0)
    - Number(payload.debts || 0);

  const debtsFromFinancing = (payload.financingList || []).reduce((s, f) => s + Number(f.balance || 0), 0);
  if (debtsFromFinancing > 0) {
    payload.debts = debtsFromFinancing;
    payload.netWorth = pf + pj
      + Number(payload.pfInvestments || 0)
      + Number(payload.pjInvestments || 0)
      - debtsFromFinancing;
  }

  payload.transactions = transactions;
  return payload;
}
