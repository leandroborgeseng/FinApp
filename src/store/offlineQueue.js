import { db } from '../lib/db.js';
import { derivePortfolioFromSnapshot } from '../lib/portfolioTotals.js';

const listeners = new Set();
let processing = false;

const BOOTSTRAP_KEY = 'GET:/bootstrap';
const REPASSE_KEY = 'GET:/repasse';
const INVESTMENTS_KEY = 'GET:/investments';

function slugify(name) {
  return String(name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function notify() {
  const status = getSyncStatus();
  listeners.forEach((fn) => fn(status));
}

export function subscribeSyncStatus(fn) {
  listeners.add(fn);
  fn(getSyncStatus());
  return () => listeners.delete(fn);
}

export function getSyncStatus() {
  return {
    online: typeof navigator !== 'undefined' ? navigator.onLine : true,
    syncing: processing,
    pending: 0,
  };
}

async function pendingCount() {
  return db.syncQueue.count();
}

export async function getFullSyncStatus() {
  return {
    online: navigator.onLine,
    syncing: processing,
    pending: await pendingCount(),
  };
}

export async function getCached(key) {
  const row = await db.apiCache.get(key);
  return row?.data ?? null;
}

export async function setCached(key, data) {
  await db.apiCache.put({ key, data, updatedAt: Date.now() });
}

export async function clearApiCache() {
  await db.apiCache.clear();
}

export async function enqueue(item) {
  await db.syncQueue.add({ ...item, createdAt: Date.now() });
  notify();
}

export async function resolveTempId(path) {
  if (!path.includes('temp-')) return path;
  const match = path.match(/temp-[a-f0-9-]+/i);
  if (!match) return path;
  const mapped = await db.idMap.get(match[0]);
  return mapped ? path.replace(match[0], mapped.realId) : path;
}

function cacheKey(method, path) {
  return `${method}:${path}`;
}

async function patchBootstrap(mutator) {
  const data = await getCached(BOOTSTRAP_KEY);
  if (!data) return null;
  const next = mutator({ ...data });
  if (next) await setCached(BOOTSTRAP_KEY, next);
  return next;
}

async function patchRepasse(mutator) {
  const data = await getCached(REPASSE_KEY);
  if (!data) return null;
  const next = mutator({ ...data, months: [...(data.months || [])] });
  if (!next) return null;
  await setCached(REPASSE_KEY, next);
  await patchBootstrap((boot) => (boot?.repasse ? { ...boot, repasse: next } : boot));
  return next;
}

async function patchInvestments(mutator) {
  const cached = await getCached(INVESTMENTS_KEY);
  let next = null;

  if (cached) {
    next = mutator({
      pf: [...(cached.pf || [])],
      pj: [...(cached.pj || [])],
    });
    if (next) await setCached(INVESTMENTS_KEY, next);
  }

  await patchBootstrap((boot) => {
    if (!boot?.investments) return boot;
    const inv = mutator({
      pf: [...(boot.investments.pf || [])],
      pj: [...(boot.investments.pj || [])],
    });
    return inv ? derivePortfolioFromSnapshot({ ...boot, investments: inv }) : boot;
  });

  return next;
}

async function patchTransactionsCache(mutator) {
  const keys = await db.apiCache.where('key').startsWith('GET:/transactions').toArray();
  for (const row of keys) {
    if (!Array.isArray(row.data)) continue;
    const next = mutator([...row.data]);
    if (next) await setCached(row.key, next);
  }
  const allKey = 'GET:/transactions';
  const all = await getCached(allKey);
  if (Array.isArray(all)) {
    const next = mutator([...all]);
    if (next) await setCached(allKey, next);
  }
}

function updateInvestmentInGroups(groups, id, patch) {
  for (const group of ['pf', 'pj']) {
    const idx = (groups[group] || []).findIndex((item) => slugify(item.name) === id);
    if (idx >= 0) {
      groups[group] = [...groups[group]];
      groups[group][idx] = { ...groups[group][idx], ...patch, _pending: true };
      return groups;
    }
  }
  return groups;
}

async function applyRepasseMonthPatch(idx, patch) {
  return patchRepasse((repasse) => {
    const months = [...repasse.months];
    months[idx] = { ...months[idx], ...patch, _pending: true };
    return { ...repasse, months, _pending: true };
  });
}

async function patchAccounts(mutator) {
  return patchBootstrap((boot) => {
    const accounts = [...(boot.accounts || [])];
    const next = mutator(accounts);
    return next ? derivePortfolioFromSnapshot({ ...boot, accounts: next }) : boot;
  });
}

async function applyBudgetMonthPatch(monthLabel, patch) {
  return patchBootstrap((boot) => {
    const monthlyBudget = [...(boot.monthlyBudget || [])];
    const idx = monthlyBudget.findIndex((row) => row.m === monthLabel);
    if (idx < 0) return boot;
    monthlyBudget[idx] = { ...monthlyBudget[idx], ...patch, _pending: true };
    return { ...boot, monthlyBudget, _pending: true };
  });
}

export async function applyOptimistic(method, path, body, response) {
  if (path.startsWith('/transactions')) {
    if (method === 'POST') {
      await patchTransactionsCache((list) => [response, ...list]);
    } else if (method === 'PUT') {
      const id = path.split('/').pop();
      await patchTransactionsCache((list) =>
        list.map((t) => (t.id === id ? { ...t, ...response } : t)),
      );
    } else if (method === 'DELETE') {
      const id = path.split('/').pop();
      await patchTransactionsCache((list) => list.filter((t) => t.id !== id));
    }
  } else if (method === 'GET') {
    await setCached(cacheKey('GET', path), response);
  }
}

function isNetworkFailure(err) {
  if (!err) return false;
  if (err.name === 'TypeError') return true;
  return /fetch|network|failed/i.test(err.message || '');
}

const PUBLIC_AUTH_PATHS = ['/auth/login', '/auth/register', '/auth/refresh'];

function isPublicAuth(path) {
  return PUBLIC_AUTH_PATHS.some((p) => path === p || path.startsWith(`${p}?`));
}

async function applyOfflineMutation(method, path, body, serializedBody) {
  const payload = serializedBody ?? (body != null ? JSON.stringify(body) : null);
  const monthMatch = path.match(/^\/repasse\/month\/(\d+)$/);
  if (method === 'PUT' && monthMatch) {
    await enqueue({ method, path, body: payload });
    const idx = Number(monthMatch[1]);
    const repasse = await applyRepasseMonthPatch(idx, body);
    return { ...(repasse?.months?.[idx] || body), _pending: true };
  }

  if (method === 'PUT' && path === '/repasse') {
    await enqueue({ method, path, body: payload });
    const repasse = await patchRepasse((current) => ({ ...current, ...body, _pending: true }));
    return repasse || { ...body, _pending: true };
  }

  if (method === 'PUT' && path.startsWith('/investments/')) {
    await enqueue({ method, path, body: payload });
    const id = decodeURIComponent(path.split('/').pop());
    await patchInvestments((groups) => updateInvestmentInGroups(groups, id, body));
    return { id, ...body, _pending: true };
  }

  if (method === 'PUT' && path.startsWith('/budget/')) {
    await enqueue({ method, path, body: payload });
    const monthLabel = decodeURIComponent(path.slice('/budget/'.length));
    const boot = await applyBudgetMonthPatch(monthLabel, body);
    const row = boot?.monthlyBudget?.find((r) => r.m === monthLabel);
    return row || { m: monthLabel, ...body, _pending: true };
  }

  if (method === 'PUT' && path.startsWith('/goals/')) {
    await enqueue({ method, path, body: payload });
    const id = decodeURIComponent(path.split('/').pop());
    await patchBootstrap((boot) => {
      const goals = [...(boot.goals || [])];
      const idx = goals.findIndex((g) => slugify(g.name) === id);
      if (idx < 0) return boot;
      goals[idx] = { ...goals[idx], ...body, _pending: true };
      return { ...boot, goals };
    });
    return { id, ...body, _pending: true };
  }

  if (method === 'POST' && path === '/financings') {
    await enqueue({ method, path, body: payload });
    const fin = { ...body, id: body.id || `fin-${Date.now()}`, _pending: true };
    await patchBootstrap((boot) => ({
      ...boot,
      financingList: [...(boot.financingList || []), fin],
    }));
    const cached = await getCached('GET:/financings');
    if (cached) await setCached('GET:/financings', [...cached, fin]);
    return fin;
  }

  if (method === 'PUT' && path.startsWith('/financings/')) {
    await enqueue({ method, path, body: payload });
    const id = decodeURIComponent(path.split('/').pop());
    await patchBootstrap((boot) => {
      const financingList = [...(boot.financingList || [])];
      const idx = financingList.findIndex((f) => f.id === id);
      if (idx < 0) return boot;
      financingList[idx] = { ...financingList[idx], ...body, _pending: true };
      return { ...boot, financingList };
    });
    return { id, ...body, _pending: true };
  }

  if (method === 'PUT' && path.startsWith('/accounts/')) {
    await enqueue({ method, path, body: payload });
    const id = decodeURIComponent(path.split('/').pop());
    await patchAccounts((accounts) => {
      const idx = accounts.findIndex((a) => a.id === id);
      if (idx < 0) return accounts;
      accounts[idx] = { ...accounts[idx], ...body, _pending: true };
      return accounts;
    });
    return { id, ...body, _pending: true };
  }

  if (method === 'POST' && path === '/transactions/bulk') {
    const items = body?.transactions || [];
    const tempIds = items.map(() => `temp-${crypto.randomUUID()}`);
    const created = items.map((tx, i) => ({ id: tempIds[i], done: false, _pending: true, ...tx }));
    await enqueue({ method, path, body: payload, tempIds });
    await patchTransactionsCache((list) => [...created, ...list]);
    return created;
  }

  if (method === 'POST' && path === '/transactions') {
    const tempId = `temp-${crypto.randomUUID()}`;
    const optimistic = { id: tempId, done: false, _pending: true, ...body };
    await enqueue({ method, path, body: payload, tempId });
    await applyOptimistic(method, path, body, optimistic);
    return optimistic;
  }

  if (method === 'PUT' && path.startsWith('/transactions/')) {
    const id = path.split('/').pop();
    const optimistic = { id, ...body, _pending: true };
    await enqueue({ method, path, body: payload });
    await applyOptimistic(method, path, body, optimistic);
    return optimistic;
  }

  if (method === 'DELETE' && path.startsWith('/transactions/')) {
    await enqueue({ method, path, body: null });
    await applyOptimistic(method, path, body, { ok: true });
    return { ok: true };
  }

  await enqueue({ method, path, body: payload });
  return body ?? { ok: true, _pending: true };
}

async function applySyncedItem(path, res) {
  const monthMatch = path.match(/^\/repasse\/month\/(\d+)$/);
  if (monthMatch) {
    const idx = Number(monthMatch[1]);
    await patchRepasse((repasse) => {
      const months = [...repasse.months];
      months[idx] = { ...res, _pending: false };
      return { ...repasse, months };
    });
    return;
  }

  if (path === '/repasse' && res) {
    await setCached(REPASSE_KEY, res);
    await patchBootstrap((boot) => ({ ...boot, repasse: res }));
    return;
  }

  if (path.startsWith('/investments/') && res) {
    const id = decodeURIComponent(path.split('/').pop());
    await patchInvestments((groups) => {
      for (const group of ['pf', 'pj']) {
        const idx = (groups[group] || []).findIndex((item) => slugify(item.name) === id);
        if (idx >= 0) {
          groups[group] = [...groups[group]];
          groups[group][idx] = { ...res, _pending: false };
        }
      }
      return groups;
    });
    return;
  }

  if (path.startsWith('/budget/') && res) {
    const monthLabel = decodeURIComponent(path.slice('/budget/'.length));
    await patchBootstrap((boot) => {
      const monthlyBudget = [...(boot.monthlyBudget || [])];
      const idx = monthlyBudget.findIndex((row) => row.m === monthLabel);
      if (idx < 0) return boot;
      monthlyBudget[idx] = { ...res, _pending: false };
      return { ...boot, monthlyBudget };
    });
    return;
  }

  if (path.startsWith('/goals/') && res) {
    const id = decodeURIComponent(path.split('/').pop());
    await patchBootstrap((boot) => {
      const goals = [...(boot.goals || [])];
      const idx = goals.findIndex((g) => slugify(g.name) === id);
      if (idx < 0) return boot;
      goals[idx] = { ...res, _pending: false };
      return { ...boot, goals };
    });
    return;
  }

  if (path === '/financings' && res) {
    await patchBootstrap((boot) => ({
      ...boot,
      financingList: [...(boot.financingList || []), { ...res, _pending: false }],
    }));
    const cached = await getCached('GET:/financings');
    if (cached) await setCached('GET:/financings', [...cached, res]);
    return;
  }

  if (path.startsWith('/financings/') && res) {
    const id = decodeURIComponent(path.split('/').pop());
    await patchBootstrap((boot) => {
      const financingList = [...(boot.financingList || [])];
      const idx = financingList.findIndex((f) => f.id === id);
      if (idx < 0) return boot;
      financingList[idx] = { ...res, _pending: false };
      return { ...boot, financingList };
    });
    return;
  }

  if (path.startsWith('/accounts/') && res) {
    const id = decodeURIComponent(path.split('/').pop());
    await patchAccounts((accounts) => {
      const idx = accounts.findIndex((a) => a.id === id);
      if (idx < 0) return accounts;
      accounts[idx] = { ...res, _pending: false };
      return accounts;
    });
  }
}

export function createOfflineAwareFetch(rawApiFetch) {
  async function apiFetch(path, options = {}) {
    const method = (options.method || 'GET').toUpperCase();
    const key = cacheKey(method, path);

    if (isPublicAuth(path)) {
      return rawApiFetch(path, options);
    }

    if (method === 'GET') {
      try {
        const data = await rawApiFetch(path, options);
        await setCached(key, data);
        return data;
      } catch (err) {
        const cached = await getCached(key);
        if (cached !== null && (isNetworkFailure(err) || !navigator.onLine)) return cached;
        throw err;
      }
    }

    if (!navigator.onLine) {
      const body = options.body ? JSON.parse(options.body) : null;
      const optimistic = await applyOfflineMutation(method, path, body, options.body ?? null);
      notify();
      return optimistic;
    }

    try {
      const data = await rawApiFetch(path, options);
      if (method === 'GET') await setCached(key, data);
      return data;
    } catch (err) {
      if (isNetworkFailure(err)) {
        const body = options.body ? JSON.parse(options.body) : null;
        const optimistic = await applyOfflineMutation(method, path, body, options.body ?? null);
        notify();
        return optimistic;
      }
      throw err;
    }
  }

  return apiFetch;
}

export async function processQueue(rawApiFetch, { onSynced } = {}) {
  if (processing || !navigator.onLine) return;
  processing = true;
  notify();

  try {
    const items = await db.syncQueue.orderBy('createdAt').toArray();
    for (const item of items) {
      const resolvedPath = await resolveTempId(item.path);
      const res = await rawApiFetch(resolvedPath, {
        method: item.method,
        body: item.body ?? undefined,
      });

      if (item.tempIds && Array.isArray(res)) {
        for (let i = 0; i < item.tempIds.length; i += 1) {
          if (res[i]?.id) await db.idMap.put({ tempId: item.tempIds[i], realId: res[i].id });
        }
        await patchTransactionsCache((list) =>
          list.map((t) => {
            const idx = item.tempIds.indexOf(t.id);
            return idx >= 0 && res[idx] ? { ...res[idx], _pending: false } : t;
          }),
        );
      } else if (item.tempId && res?.id) {
        await db.idMap.put({ tempId: item.tempId, realId: res.id });
        await patchTransactionsCache((list) =>
          list.map((t) => (t.id === item.tempId ? { ...res, _pending: false } : t)),
        );
      } else {
        await applySyncedItem(resolvedPath, res);
      }

      await db.syncQueue.delete(item.id);
    }

    if (items.length > 0) onSynced?.();
  } catch {
    // mantém fila para próxima tentativa
  } finally {
    processing = false;
    notify();
  }
}
