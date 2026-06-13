import { Router } from 'express';
import * as store from '../store/index.js';
import { authRequired } from '../middleware/auth.js';

const router = Router();

router.use(authRequired);

router.get('/', async (req, res) => {
  const list = await store.listTransactions(req.user.id, req.query);
  res.json(list);
});

router.post('/', async (req, res) => {
  const { desc, value, type, entity, date, cat, done } = req.body || {};
  if (!desc || !value || !type || !entity || !date) {
    return res.status(400).json({ error: 'Campos obrigatórios: desc, value, type, entity, date' });
  }
  const tx = await store.createTransaction(req.user.id, { desc, value, type, entity, date, cat, done });
  res.status(201).json(tx);
});

router.post('/bulk', async (req, res) => {
  const list = req.body?.transactions;
  if (!Array.isArray(list) || !list.length) {
    return res.status(400).json({ error: 'Envie transactions como array' });
  }
  for (const tx of list) {
    if (!tx.desc || !tx.value || !tx.type || !tx.entity || !tx.date) {
      return res.status(400).json({ error: 'Cada item precisa de desc, value, type, entity, date' });
    }
  }
  const created = await store.createTransactionsBulk(req.user.id, list);
  res.status(201).json(created);
});

router.put('/:id', async (req, res) => {
  const updated = await store.updateTransaction(req.user.id, req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Não encontrado' });
  res.json(updated);
});

router.delete('/:id', async (req, res) => {
  await store.deleteTransaction(req.user.id, req.params.id);
  res.json({ ok: true });
});

export default router;
