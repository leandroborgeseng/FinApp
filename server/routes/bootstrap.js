import { Router } from 'express';
import * as store from '../store/index.js';
import { authRequired } from '../middleware/auth.js';
import { buildFinancePayload } from '../utils/derive.js';
import { applyLiveStats } from '../utils/liveStats.js';

const router = Router();

router.get('/bootstrap', authRequired, async (req, res) => {
  const snap = await store.getSnapshot(req.user.id);
  const transactions = await store.listTransactions(req.user.id, {});
  const payload = applyLiveStats(buildFinancePayload(snap), transactions);
  res.json(payload);
});

router.get('/monthly-events', authRequired, async (req, res) => {
  const snap = await store.getSnapshot(req.user.id);
  res.json(snap.monthlyEvents || []);
});

router.put('/monthly-events', authRequired, async (req, res) => {
  const events = req.body.events;
  if (!Array.isArray(events)) return res.status(400).json({ error: 'events deve ser um array' });
  await store.updateSnapshot(req.user.id, { monthlyEvents: events });
  res.json(events);
});

export default router;
