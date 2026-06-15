/** Saldos fictícios do seed inicial — ignorados quando ainda não foram editados pelo usuário. */
const LEGACY_DEMO_CHECKING = { 'pf-cc': 85000, 'pj-cc': 320000 };

export function clearLegacyDemoAccountBalances(accounts) {
  if (!accounts?.length) return accounts;

  let changed = false;
  const next = accounts.map((a) => {
    if (a.type === 'checking' && LEGACY_DEMO_CHECKING[a.id] === Number(a.balance)) {
      changed = true;
      return { ...a, balance: 0 };
    }
    return a;
  });

  return changed ? next : accounts;
}

export function sumCheckingByEntity(accounts, entity) {
  return (accounts || [])
    .filter((a) => a.type === 'checking' && a.entity === entity)
    .reduce((s, a) => s + Number(a.balance || 0), 0);
}

export function sumInvestmentsByEntity(investments, entity) {
  const key = entity === 'PJ' ? 'pj' : 'pf';
  return (investments?.[key] || []).reduce((s, inv) => s + Number(inv.value || 0), 0);
}

/** Linhas que compõem o patrimônio líquido (dashboard + aba Patrimônio). */
export function buildNetWorthBreakdown(finance) {
  if (!finance) return [];

  const imovelGoal = (finance.goals || []).find((g) => g.name?.includes('Imóvel'));
  const otherGoals = (finance.goals || [])
    .filter((g) => !g.name?.includes('Imóvel'))
    .reduce((s, g) => s + Number(g.current || 0), 0);
  const totalFinDebt = (finance.financingList || []).reduce((s, f) => s + Number(f.balance || 0), 0);
  const debts = totalFinDebt > 0 ? totalFinDebt : Number(finance.debts || 0);

  return [
    {
      label: 'PF Disponível',
      value: Number(finance.pfAvailable || 0),
      color: '#16A34A',
      details: (finance.accounts || [])
        .filter((a) => a.type === 'checking' && a.entity === 'PF')
        .map((a) => ({ label: a.name || a.bank || 'Conta PF', value: Number(a.balance || 0) })),
    },
    {
      label: 'PJ Disponível',
      value: Number(finance.pjAvailable || 0),
      color: '#2563EB',
      details: (finance.accounts || [])
        .filter((a) => a.type === 'checking' && a.entity === 'PJ')
        .map((a) => ({ label: a.name || a.bank || 'Conta PJ', value: Number(a.balance || 0) })),
    },
    {
      label: 'Invest. PF',
      value: Number(finance.pfInvestments || 0),
      color: '#7C3AED',
      details: (finance.investments?.pf || []).map((inv) => ({
        label: inv.name,
        value: Number(inv.value || 0),
      })),
    },
    {
      label: 'Invest. PJ',
      value: Number(finance.pjInvestments || 0),
      color: '#8B5CF6',
      details: (finance.investments?.pj || []).map((inv) => ({
        label: inv.name,
        value: Number(inv.value || 0),
      })),
    },
    {
      label: 'Imóveis (est.)',
      value: Number(imovelGoal?.current || 0),
      color: '#F59E0B',
      details: imovelGoal ? [{ label: imovelGoal.name, value: Number(imovelGoal.current || 0) }] : [],
    },
    {
      label: 'Metas (outras)',
      value: otherGoals,
      color: '#06B6D4',
      details: (finance.goals || [])
        .filter((g) => !g.name?.includes('Imóvel'))
        .map((g) => ({ label: g.name, value: Number(g.current || 0) })),
    },
    {
      label: 'Financiamentos',
      value: -debts,
      color: '#F87171',
      details: (finance.financingList || []).map((f) => ({
        label: f.bank || f.cat || 'Financiamento',
        value: -Number(f.balance || 0),
      })),
    },
  ];
}

/** Sincroniza totais do painel com contas correntes e investimentos editáveis. */
export function derivePortfolioFromSnapshot(payload) {
  if (!payload || typeof payload !== 'object') return payload;

  const accounts = clearLegacyDemoAccountBalances(payload.accounts || []);
  const investments = payload.investments || { pf: [], pj: [] };
  const hasChecking = accounts.some((a) => a.type === 'checking');
  const hasInvestments = (investments.pf?.length || 0) + (investments.pj?.length || 0) > 0;

  const next = { ...payload, accounts };

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
