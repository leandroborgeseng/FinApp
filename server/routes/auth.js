import { Router } from 'express';
import * as store from '../store/index.js';
import { authRequired } from '../middleware/auth.js';

const router = Router();

router.post('/login', async (req, res) => {
  const email = (req.body?.email || '').trim().toLowerCase();
  const password = (req.body?.password || '').trim();
  if (!email || !password) return res.status(400).json({ error: 'E-mail e senha obrigatórios' });
  const result = await store.loginUser(email, password);
  if (result.error) return res.status(result.status).json({ error: result.error });
  res.json({
    token: result.accessToken,
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
    user: result.user,
  });
});

router.post('/register', async (req, res) => {
  const { email, password, name } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'E-mail e senha obrigatórios' });
  if (password.length < 6) return res.status(400).json({ error: 'Senha deve ter ao menos 6 caracteres' });
  const result = await store.registerUser(email, password, name);
  if (result.error) return res.status(result.status).json({ error: result.error });
  res.status(201).json({
    token: result.accessToken,
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
    user: result.user,
  });
});

router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body || {};
  if (!refreshToken) return res.status(400).json({ error: 'Refresh token obrigatório' });
  const row = await store.verifyRefreshToken(refreshToken);
  if (!row) return res.status(401).json({ error: 'Refresh token inválido' });
  const user = await store.getUserById(row.user_id || row.id);
  if (!user) return res.status(401).json({ error: 'Usuário não encontrado' });
  const accessToken = store.signAccessToken(user);
  res.json({ token: accessToken, accessToken, user });
});

router.post('/logout', authRequired, async (req, res) => {
  const { refreshToken } = req.body || {};
  if (refreshToken) await store.revokeRefreshToken(refreshToken);
  res.json({ ok: true });
});

router.get('/me', authRequired, async (req, res) => {
  const user = await store.getUserById(req.user.id);
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
  res.json({ id: user.id, name: user.name, email: user.email, plan: user.plan });
});

export default router;
