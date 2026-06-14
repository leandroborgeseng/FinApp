export function sumCheckingByEntity(accounts, entity) {
  return (accounts || [])
    .filter((a) => a.type === 'checking' && a.entity === entity)
    .reduce((s, a) => s + Number(a.balance || 0), 0);
}

export function sumInvestmentsByEntity(investments, entity) {
  const key = entity === 'PJ' ? 'pj' : 'pf';
  return (investments?.[key] || []).reduce((s, inv) => s + Number(inv.value || 0), 0);
}

/** Sincroniza totais do painel com contas correntes e investimentos editáveis. */
export function derivePortfolioFromSnapshot(payload) {
  if (!payload || typeof payload !== 'object') return payload;

  const accounts = payload.accounts || [];
  const investments = payload.investments || { pf: [], pj: [] };
  const hasChecking = accounts.some((a) => a.type === 'checking');
  const hasInvestments = (investments.pf?.length || 0) + (investments.pj?.length || 0) > 0;

  const next = { ...payload };

  if (hasChecking) {
    next.pfAvailable = sumCheckingByEntity(accounts, 'PF');
    next.pjAvailable = sumCheckingByEntity(accounts, 'PJ');
    next.startBalances = {
      PF: next.pfAvailable,
      PJ: next.pjAvailable,
      Todos: next.pfAvailable + next.pjAvailable,
    };
  }

  if (hasInvestments) {
    next.pfInvestments = sumInvestmentsByEntity(investments, 'PF');
    next.pjInvestments = sumInvestmentsByEntity(investments, 'PJ');
  }

  const debtsFromFinancing = (next.financingList || []).reduce((s, f) => s + Number(f.balance || 0), 0);
  const debts = debtsFromFinancing > 0 ? debtsFromFinancing : Number(next.debts || 0);
  if (debtsFromFinancing > 0) next.debts = debtsFromFinancing;

  next.netWorth = Number(next.pfAvailable || 0)
    + Number(next.pjAvailable || 0)
    + Number(next.pfInvestments || 0)
    + Number(next.pjInvestments || 0)
    - debts;

  return next;
}
