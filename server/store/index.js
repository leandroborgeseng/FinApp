import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { query, getPool } from '../db/pool.js';
import { createSeedData } from '../seed.js';
import { DEMO_EMAIL, DEMO_PASSWORD, buildSnapshotData, seedUserData } from '../db/seedUser.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const ACCESS_TTL = '15m';
const REFRESH_TTL_DAYS = 30;

// ── Memory fallback (sem DATABASE_URL) ─────────────────
const memory = createSeedData();
memory.users = new Map();
memory.refreshTokens = new Map();

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function signAccessToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: ACCESS_TTL });
}

export async function createRefreshToken(userId) {
  const token = crypto.randomBytes(40).toString('hex');
  const tokenHash = hashToken(token);
  const expires = new Date(Date.now() + REFRESH_TTL_DAYS * 86400000);

  if (getPool()) {
    await query(
      'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
      [userId, tokenHash, expires.toISOString()],
    );
  } else {
    memory.refreshTokens.set(tokenHash, { userId, expires });
  }
  return token;
}

export async function verifyRefreshToken(token) {
  const tokenHash = hashToken(token);
  if (getPool()) {
    const { rows } = await query(
      `SELECT rt.user_id, u.id, u.email, u.name, u.plan
       FROM refresh_tokens rt JOIN users u ON u.id = rt.user_id
       WHERE rt.token_hash = $1 AND rt.expires_at > NOW()`,
      [tokenHash],
    );
    return rows[0] || null;
  }
  const entry = memory.refreshTokens.get(tokenHash);
  if (!entry || entry.expires < Date.now()) return null;
  return { id: entry.userId, user_id: entry.userId, ...memory.user };
}

export async function revokeRefreshToken(token) {
  const tokenHash = hashToken(token);
  if (getPool()) {
    await query('DELETE FROM refresh_tokens WHERE token_hash = $1', [tokenHash]);
  } else {
    memory.refreshTokens.delete(tokenHash);
  }
}

export async function findUserByEmail(email) {
  if (getPool()) {
    const { rows } = await query(
      'SELECT id, email, password_hash, name, plan FROM users WHERE email = $1',
      [email.toLowerCase().trim()],
    );
    return rows[0] || null;
  }
  if (!getPool()) {
    return {
      id: memory.user.id,
      email: email.toLowerCase().trim(),
      password_hash: null,
      name: memory.user.name,
      plan: memory.user.plan,
    };
  }
}

export async function verifyPassword(user, password) {
  if (getPool()) return bcrypt.compare(password, user.password_hash);
  return password === DEMO_PASSWORD;
}

export async function loginUser(email, password) {
  const user = await findUserByEmail(email);
  if (!user) return { error: 'E-mail ou senha inválidos', status: 401 };
  const ok = await verifyPassword(user, password);
  if (!ok) return { error: 'E-mail ou senha inválidos', status: 401 };

  const publicUser = { id: user.id, email: user.email, name: user.name, plan: user.plan };
  const accessToken = signAccessToken(publicUser);
  const refreshToken = await createRefreshToken(user.id);
  return { accessToken, refreshToken, user: publicUser };
}

export async function getUserById(id) {
  if (getPool()) {
    const { rows } = await query(
      'SELECT id, email, name, plan FROM users WHERE id = $1',
      [id],
    );
    return rows[0] || null;
  }
  if (memory.user.id === id) return memory.user;
  return null;
}

// ── Transactions ───────────────────────────────────────
const TX_COLS = 'id, description AS desc, value, type, entity, date, done, cat';

function txDbColumn(key) {
  return key === 'desc' ? 'description' : key;
}

export async function listTransactions(userId, { month, entity } = {}) {
  if (getPool()) {
    let sql = `SELECT ${TX_COLS} FROM transactions WHERE user_id = $1`;
    const params = [userId];
    if (month) { params.push(`${month}%`); sql += ` AND date LIKE $${params.length}`; }
    if (entity && entity !== 'all') { params.push(entity); sql += ` AND entity = $${params.length}`; }
    sql += ' ORDER BY date DESC, created_at DESC';
    const { rows } = await query(sql, params);
    return rows;
  }
  let list = [...memory.transactions];
  if (month) list = list.filter((t) => t.date.startsWith(month));
  if (entity && entity !== 'all') list = list.filter((t) => t.entity === entity);
  return list;
}

export async function createTransaction(userId, data) {
  const tx = { id: String(Date.now() + Math.random()).replace('.', ''), done: false, ...data };
  if (getPool()) {
    await query(
      `INSERT INTO transactions (id, user_id, description, value, type, entity, date, done, cat)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [tx.id, userId, tx.desc, tx.value, tx.type, tx.entity, tx.date, tx.done, tx.cat],
    );
  } else {
    memory.transactions.unshift(tx);
  }
  return tx;
}

export async function createTransactionsBulk(userId, list = []) {
  const created = [];
  for (const data of list) {
    created.push(await createTransaction(userId, data));
  }
  return created;
}

export async function updateTransaction(userId, id, patch) {
  if (getPool()) {
    const fields = [];
    const params = [userId, id];
    for (const key of ['desc', 'value', 'type', 'entity', 'date', 'done', 'cat']) {
      if (patch[key] !== undefined) {
        params.push(patch[key]);
        fields.push(`${txDbColumn(key)} = $${params.length}`);
      }
    }
    if (fields.length === 0) return null;
    fields.push('updated_at = NOW()');
    const { rows } = await query(
      `UPDATE transactions SET ${fields.join(', ')} WHERE user_id = $1 AND id = $2 RETURNING ${TX_COLS}`,
      params,
    );
    return rows[0] || null;
  }
  const idx = memory.transactions.findIndex((t) => t.id === id);
  if (idx < 0) return null;
  memory.transactions[idx] = { ...memory.transactions[idx], ...patch };
  return memory.transactions[idx];
}

export async function deleteTransaction(userId, id) {
  if (getPool()) {
    await query('DELETE FROM transactions WHERE user_id = $1 AND id = $2', [userId, id]);
  } else {
    memory.transactions = memory.transactions.filter((t) => t.id !== id);
  }
  return true;
}

export async function replaceTransactions(userId, list) {
  if (getPool()) {
    await query('DELETE FROM transactions WHERE user_id = $1', [userId]);
    for (const tx of list) {
      await query(
        `INSERT INTO transactions (id, user_id, description, value, type, entity, date, done, cat)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         ON CONFLICT (user_id, id) DO UPDATE SET
           description = EXCLUDED.description, value = EXCLUDED.value, type = EXCLUDED.type,
           entity = EXCLUDED.entity, date = EXCLUDED.date, done = EXCLUDED.done, cat = EXCLUDED.cat`,
        [tx.id, userId, tx.desc, tx.value, tx.type, tx.entity, tx.date, tx.done ?? false, tx.cat],
      );
    }
  } else {
    memory.transactions = [...list];
  }
  return list;
}

export async function exportUserData(userId) {
  const snapshot = await getSnapshot(userId);
  const transactions = await listTransactions(userId, {});
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    snapshot,
    transactions,
  };
}

export async function importUserData(userId, { snapshot, transactions }) {
  if (snapshot) await updateSnapshot(userId, snapshot);
  if (Array.isArray(transactions)) await replaceTransactions(userId, transactions);
  return exportUserData(userId);
}

// ── Snapshot (budget, investments, etc.) ───────────────
export async function getSnapshot(userId) {
  if (getPool()) {
    const { rows } = await query('SELECT data FROM user_snapshots WHERE user_id = $1', [userId]);
    return rows[0]?.data || buildSnapshotData();
  }
  const base = buildSnapshotData();
  return {
    ...base,
    repasse: memory.repasse ?? base.repasse,
    recurringOverrides: memory.recurringOverrides ?? base.recurringOverrides,
    investments: memory.investments ?? base.investments,
    goals: memory.goals ?? base.goals,
    financingList: memory.financingList ?? base.financingList,
    accounts: memory.accounts ?? base.accounts,
  };
}

export async function updateSnapshot(userId, patch) {
  const current = await getSnapshot(userId);
  const next = { ...current, ...patch };
  if (getPool()) {
    await query(
      `INSERT INTO user_snapshots (user_id, data) VALUES ($1, $2)
       ON CONFLICT (user_id) DO UPDATE SET data = $2, updated_at = NOW()`,
      [userId, JSON.stringify(next)],
    );
  } else {
    Object.assign(memory, patch);
  }
  return next;
}

export async function registerUser(email, password, name) {
  if (!getPool()) {
    return { error: 'Registro disponível apenas com banco de dados', status: 503 };
  }
  const hash = await bcrypt.hash(password, 10);
  try {
    const { rows } = await query(
      `INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name, plan`,
      [email.toLowerCase().trim(), hash, name || email.split('@')[0]],
    );
    const user = rows[0];
    await seedUserData(user.id);
    const accessToken = signAccessToken(user);
    const refreshToken = await createRefreshToken(user.id);
    return { accessToken, refreshToken, user };
  } catch (e) {
    if (e.code === '23505') return { error: 'E-mail já cadastrado', status: 409 };
    throw e;
  }
}

// Init memory demo user id
memory.user.id = 'demo-user-1';

export { memory };
