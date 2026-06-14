import { derivePortfolioFromSnapshot } from '../../src/lib/portfolioTotals.js';

function currentMonthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function applyLiveStats(payload, transactions = []) {
  const monthKey = currentMonthKey();
  let data = derivePortfolioFromSnapshot(payload);

  const monthTx = transactions.filter((t) => t.date?.startsWith(monthKey));
  const monthIncome = monthTx.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.value), 0);
  const monthExpense = monthTx.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.value), 0);
  data.monthResult = monthIncome - monthExpense;

  const hasChecking = (data.accounts || []).some((a) => a.type === 'checking');

  // Sem contas cadastradas: saldo disponível = baseline + lançamentos realizados
  if (!hasChecking) {
    const starts = data.startBalances || { PF: data.pfAvailable, PJ: data.pjAvailable };
    let pf = Number(starts.PF ?? data.pfAvailable ?? 0);
    let pj = Number(starts.PJ ?? data.pjAvailable ?? 0);

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

    data.pfAvailable = pf;
    data.pjAvailable = pj;
  }

  const debtsFromFinancing = (data.financingList || []).reduce((s, f) => s + Number(f.balance || 0), 0);
  if (debtsFromFinancing > 0) {
    data.debts = debtsFromFinancing;
  }

  data.netWorth = Number(data.pfAvailable || 0)
    + Number(data.pjAvailable || 0)
    + Number(data.pfInvestments || 0)
    + Number(data.pjInvestments || 0)
    - Number(data.debts || 0);

  data.transactions = transactions;
  return data;
}
