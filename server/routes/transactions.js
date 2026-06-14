import { Router } from 'express';
import * as store from '../store/index.js';
import { authRequired } from '../middleware/auth.js';

import { validateTransaction } from '../utils/validateTx.js';

const router = Router();

router.use(authRequired);

router.get('/', async (req, res) => {
  const list = await store.listTransactions(req.user.id, req.query);
  res.json(list);
});

router.post('/', async (req, res) => {
  const { desc, value, type, entity, date, cat, done } = req.body || {};
  const err = validateTransaction({ desc, value, type, entity, date });
  if (err) return res.status(400).json({ error: err });
  const tx = await store.createTransaction(req.user.id, { desc, value, type, entity, date, cat, done });
  res.status(201).json(tx);
});

router.post('/bulk', async (req, res) => {
  const list = req.body?.transactions;
  if (!Array.isArray(list) || !list.length) {
    return res.status(400).json({ error: 'Envie transactions como array' });
  }
  for (const tx of list) {
    const err = validateTransaction(tx);
    if (err) return res.status(400).json({ error: err });
  }
  const created = await store.createTransactionsBulk(req.user.id, list);
  res.status(201).json(created);
});

router.put('/:id', async (req, res) => {
  const updated = await store.updateTransaction(req.user.id, req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Não encontrado' });
  res.json(updated);
});

router.post('/bulk-delete', async (req, res) => {
  const { month, ids, before } = req.body || {};
  if (!month && !(Array.isArray(ids) && ids.length) && !before) {
    return res.status(400).json({ error: 'Informe month, ids ou before' });
  }
  const result = await store.deleteTransactionsBulk(req.user.id, { month, ids, before });
  res.json(result);
});

router.delete('/:id', async (req, res) => {
  const deleted = await store.deleteTransaction(req.user.id, req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Não encontrado' });
  res.json({ ok: true });
});

export default router;
