import { Router } from 'express';
import * as store from '../store/index.js';
import { authRequired } from '../middleware/auth.js';
import { derivePortfolioFromSnapshot } from '../../src/lib/portfolioTotals.js';

const router = Router();
router.use(authRequired);

function fromToLabel(iso) {
  const [y, m] = iso.split('-');
  const labels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return `${labels[Number(m) - 1]}/${y.slice(2)}`;
}

function slug(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

router.get('/budget', async (req, res) => {
  const snap = await store.getSnapshot(req.user.id);
  let list = [...(snap.monthlyBudget || [])];
  const { from, to } = req.query;
  if (from) list = list.filter((b) => b.m >= fromToLabel(from));
  if (to) list = list.filter((b) => b.m <= fromToLabel(to));
  res.json(list);
});

router.put('/budget/:month', async (req, res) => {
  const snap = await store.getSnapshot(req.user.id);
  const idx = (snap.monthlyBudget || []).findIndex((b) => b.m === req.params.month);
  if (idx < 0) return res.status(404).json({ error: 'Mês não encontrado' });
  snap.monthlyBudget[idx] = { ...snap.monthlyBudget[idx], ...req.body };
  await store.updateSnapshot(req.user.id, { monthlyBudget: snap.monthlyBudget });
  res.json(snap.monthlyBudget[idx]);
});

router.get('/investments', async (req, res) => {
  const snap = await store.getSnapshot(req.user.id);
  res.json(snap.investments || { pf: [], pj: [] });
});

router.put('/investments/:id', async (req, res) => {
  const snap = await store.getSnapshot(req.user.id);
  for (const group of ['pf', 'pj']) {
    const idx = (snap.investments?.[group] || []).findIndex((i) => slug(i.name) === req.params.id);
    if (idx >= 0) {
      snap.investments[group][idx] = { ...snap.investments[group][idx], ...req.body };
      const derived = derivePortfolioFromSnapshot(snap);
      await store.updateSnapshot(req.user.id, {
        investments: snap.investments,
        pfInvestments: derived.pfInvestments,
        pjInvestments: derived.pjInvestments,
        netWorth: derived.netWorth,
      });
      return res.json(snap.investments[group][idx]);
    }
  }
  res.status(404).json({ error: 'Investimento não encontrado' });
});

router.get('/financings', async (req, res) => {
  const snap = await store.getSnapshot(req.user.id);
  res.json(snap.financingList || []);
});

router.post('/financings', async (req, res) => {
  const snap = await store.getSnapshot(req.user.id);
  const fin = req.body;
  if (!fin?.bank || fin.balance == null) return res.status(400).json({ error: 'Dados inválidos' });
  const list = [...(snap.financingList || [])];
  const id = fin.id || `fin-${Date.now()}`;
  if (list.some((f) => f.id === id)) return res.status(409).json({ error: 'Financiamento já existe' });
  const entry = { ...fin, id };
  list.push(entry);
  await store.updateSnapshot(req.user.id, { financingList: list });
  res.status(201).json(entry);
});

router.put('/financings/:id', async (req, res) => {
  const snap = await store.getSnapshot(req.user.id);
  const idx = (snap.financingList || []).findIndex((f) => f.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: 'Não encontrado' });
  snap.financingList[idx] = { ...snap.financingList[idx], ...req.body };
  await store.updateSnapshot(req.user.id, { financingList: snap.financingList });
  res.json(snap.financingList[idx]);
});

router.get('/repasse', async (req, res) => {
  const snap = await store.getSnapshot(req.user.id);
  res.json(snap.repasse);
});

router.put('/repasse', async (req, res) => {
  const snap = await store.getSnapshot(req.user.id);
  const repasse = { ...snap.repasse, ...req.body };
  await store.updateSnapshot(req.user.id, { repasse });
  res.json(repasse);
});

router.put('/repasse/month/:idx', async (req, res) => {
  const snap = await store.getSnapshot(req.user.id);
  const idx = Number(req.params.idx);
  if (idx < 0 || idx >= snap.repasse.months.length) return res.status(404).json({ error: 'Mês inválido' });

  const prev = snap.repasse.months[idx];
  const wasDone = prev.done;
  snap.repasse.months[idx] = { ...prev, ...req.body };
  await store.updateSnapshot(req.user.id, { repasse: snap.repasse });

  if (req.body.done === true && !wasDone) {
    const m = snap.repasse.months[idx];
    const year = snap.repasse.year || 2026;
    const day = snap.repasse.day || 5;
    const dateStr = `${year}-${String(idx + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    await store.createTransaction(req.user.id, {
      type: 'transfer',
      desc: `Repasse PJ → PF — ${m.m}/${year}`,
      value: m.amount,
      entity: 'PJ',
      date: dateStr,
      done: true,
      cat: 'Repasse',
    });
    await store.createTransaction(req.user.id, {
      type: 'income',
      desc: `Repasse PJ → PF — ${m.m}/${year}`,
      value: m.amount,
      entity: 'PF',
      date: dateStr,
      done: true,
      cat: 'Repasse',
    });
  }

  res.json(snap.repasse.months[idx]);
});

router.get('/accounts', async (req, res) => {
  const snap = await store.getSnapshot(req.user.id);
  res.json(snap.accounts || []);
});

router.put('/accounts/:id', async (req, res) => {
  const snap = await store.getSnapshot(req.user.id);
  const list = [...(snap.accounts || [])];
  const idx = list.findIndex((a) => a.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: 'Conta não encontrada' });
  list[idx] = { ...list[idx], ...req.body };
  const derived = derivePortfolioFromSnapshot({ ...snap, accounts: list });
  await store.updateSnapshot(req.user.id, {
    accounts: list,
    pfAvailable: derived.pfAvailable,
    pjAvailable: derived.pjAvailable,
    startBalances: derived.startBalances,
    netWorth: derived.netWorth,
  });
  res.json(list[idx]);
});

router.get('/goals', async (req, res) => {
  const snap = await store.getSnapshot(req.user.id);
  res.json(snap.goals || []);
});

router.put('/goals/:id', async (req, res) => {
  const snap = await store.getSnapshot(req.user.id);
  const idx = (snap.goals || []).findIndex((g) => slug(g.name) === req.params.id);
  if (idx < 0) return res.status(404).json({ error: 'Meta não encontrada' });
  snap.goals[idx] = { ...snap.goals[idx], ...req.body };
  await store.updateSnapshot(req.user.id, { goals: snap.goals });
  res.json(snap.goals[idx]);
});

router.get('/net-worth', async (req, res) => {
  const snap = await store.getSnapshot(req.user.id);
  res.json({
    netWorth: snap.netWorth,
    pfAvailable: snap.pfAvailable,
    pjAvailable: snap.pjAvailable,
    pfInvestments: snap.pfInvestments,
    pjInvestments: snap.pjInvestments,
    debts: snap.debts,
    monthResult: snap.monthResult,
    nextMonthForecast: snap.nextMonthForecast,
  });
});

router.get('/wealth-forecast', async (req, res) => {
  const snap = await store.getSnapshot(req.user.id);
  res.json(snap.wealthForecast || []);
});

router.get('/recurring-overrides', async (req, res) => {
  const snap = await store.getSnapshot(req.user.id);
  res.json(snap.recurringOverrides || {});
});

router.put('/recurring-overrides', async (req, res) => {
  const overrides = req.body.overrides || {};
  await store.updateSnapshot(req.user.id, { recurringOverrides: overrides });
  res.json(overrides);
});

router.get('/export', async (req, res) => {
  const data = await store.exportUserData(req.user.id);
  res.json(data);
});

router.post('/import', async (req, res) => {
  const { snapshot, transactions } = req.body || {};
  if (!snapshot && !transactions) {
    return res.status(400).json({ error: 'Envie snapshot e/ou transactions' });
  }
  const data = await store.importUserData(req.user.id, { snapshot, transactions });
  res.json(data);
});

router.post('/backup', async (req, res) => {
  const data = await store.exportUserData(req.user.id);
  res.json({ ok: true, backup: data });
});

router.get('/preferences', async (req, res) => {
  const snap = await store.getSnapshot(req.user.id);
  res.json(snap.preferences || { dark: false });
});

router.put('/preferences', async (req, res) => {
  const snap = await store.getSnapshot(req.user.id);
  const preferences = { ...(snap.preferences || {}), ...req.body };
  await store.updateSnapshot(req.user.id, { preferences });
  res.json(preferences);
});

export default router;
