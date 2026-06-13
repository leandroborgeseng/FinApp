import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createSeedData } from './seed.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;
const isProd = process.env.NODE_ENV === 'production';

app.use(cors());
app.use(express.json());

const db = createSeedData();

// ── Auth ──────────────────────────────────────────────
app.post('/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'E-mail e senha obrigatórios' });
  db.user.email = email;
  res.json({ token: 'demo-token', user: db.user });
});

app.post('/auth/logout', (_req, res) => res.json({ ok: true }));

app.get('/auth/me', (_req, res) => res.json(db.user));

// ── Transações ────────────────────────────────────────
app.get('/transactions', (req, res) => {
  const { month, entity } = req.query;
  let list = [...db.transactions];
  if (month) list = list.filter((t) => t.date.startsWith(month));
  if (entity && entity !== 'all') list = list.filter((t) => t.entity === entity);
  res.json(list);
});

app.post('/transactions', (req, res) => {
  const tx = { id: String(Date.now()), done: false, ...req.body };
  db.transactions.unshift(tx);
  res.status(201).json(tx);
});

app.put('/transactions/:id', (req, res) => {
  const idx = db.transactions.findIndex((t) => t.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: 'Não encontrado' });
  db.transactions[idx] = { ...db.transactions[idx], ...req.body };
  res.json(db.transactions[idx]);
});

app.delete('/transactions/:id', (req, res) => {
  db.transactions = db.transactions.filter((t) => t.id !== req.params.id);
  res.json({ ok: true });
});

// ── Orçamento ─────────────────────────────────────────
app.get('/budget', (req, res) => {
  const { from, to } = req.query;
  let list = [...db.monthlyBudget];
  if (from) list = list.filter((b) => b.m >= fromToLabel(from));
  if (to) list = list.filter((b) => b.m <= fromToLabel(to));
  res.json(list);
});

app.put('/budget/:month', (req, res) => {
  const idx = db.monthlyBudget.findIndex((b) => b.m === req.params.month);
  if (idx < 0) return res.status(404).json({ error: 'Mês não encontrado' });
  db.monthlyBudget[idx] = { ...db.monthlyBudget[idx], ...req.body };
  res.json(db.monthlyBudget[idx]);
});

// ── Investimentos ─────────────────────────────────────
app.get('/investments', (_req, res) => res.json(db.investments));

app.put('/investments/:id', (req, res) => {
  for (const group of ['pf', 'pj']) {
    const idx = db.investments[group].findIndex((i) => slug(i.name) === req.params.id);
    if (idx >= 0) {
      db.investments[group][idx] = { ...db.investments[group][idx], ...req.body };
      return res.json(db.investments[group][idx]);
    }
  }
  res.status(404).json({ error: 'Investimento não encontrado' });
});

// ── Financiamentos ────────────────────────────────────
app.get('/financings', (_req, res) => res.json(db.financingList));

app.put('/financings/:id', (req, res) => {
  const idx = db.financingList.findIndex((f) => f.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: 'Não encontrado' });
  db.financingList[idx] = { ...db.financingList[idx], ...req.body };
  res.json(db.financingList[idx]);
});

// ── Repasse ───────────────────────────────────────────
app.get('/repasse', (_req, res) => res.json(db.repasse));

app.put('/repasse', (req, res) => {
  db.repasse = { ...db.repasse, ...req.body };
  res.json(db.repasse);
});

app.put('/repasse/month/:idx', (req, res) => {
  const idx = Number(req.params.idx);
  if (idx < 0 || idx >= db.repasse.months.length) return res.status(404).json({ error: 'Mês inválido' });
  db.repasse.months[idx] = { ...db.repasse.months[idx], ...req.body };
  res.json(db.repasse.months[idx]);
});

// ── Metas ─────────────────────────────────────────────
app.get('/goals', (_req, res) => res.json(db.goals));

app.put('/goals/:id', (req, res) => {
  const idx = db.goals.findIndex((g) => slug(g.name) === req.params.id);
  if (idx < 0) return res.status(404).json({ error: 'Meta não encontrada' });
  db.goals[idx] = { ...db.goals[idx], ...req.body };
  res.json(db.goals[idx]);
});

// ── Patrimônio ────────────────────────────────────────
app.get('/net-worth', (_req, res) => {
  res.json({
    netWorth: db.netWorth,
    pfAvailable: db.pfAvailable,
    pjAvailable: db.pjAvailable,
    pfInvestments: db.pfInvestments,
    pjInvestments: db.pjInvestments,
    debts: db.debts,
    monthResult: db.monthResult,
    nextMonthForecast: db.nextMonthForecast,
  });
});

app.get('/wealth-forecast', (_req, res) => res.json(db.wealthForecast));

// ── Planilha ──────────────────────────────────────────
app.get('/recurring-overrides', (_req, res) => res.json(db.recurringOverrides));

app.put('/recurring-overrides', (req, res) => {
  db.recurringOverrides = req.body.overrides || {};
  res.json(db.recurringOverrides);
});

function fromToLabel(iso) {
  const [y, m] = iso.split('-');
  const labels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return `${labels[Number(m) - 1]}/${y.slice(2)}`;
}

function slug(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

if (isProd) {
  const distPath = path.join(__dirname, '..', 'dist');
  app.use(express.static(distPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`FinApp rodando em http://localhost:${PORT}${isProd ? ' (produção)' : ' (API dev)'}`);
});
