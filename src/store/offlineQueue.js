import { db } from '../lib/db.js';

const listeners = new Set();
let processing = false;

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

export function createOfflineAwareFetch(rawApiFetch) {
  async function apiFetch(path, options = {}) {
    const method = (options.method || 'GET').toUpperCase();
    const key = cacheKey(method, path);

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
      return handleOfflineMutation(method, path, options);
    }

    try {
      const data = await rawApiFetch(path, options);
      if (method === 'GET') await setCached(key, data);
      return data;
    } catch (err) {
      if (isNetworkFailure(err)) return handleOfflineMutation(method, path, options);
      throw err;
    }
  }

  async function handleOfflineMutation(method, path, options) {
    const body = options.body ? JSON.parse(options.body) : null;
    let optimistic;
    let tempId;

    if (method === 'POST' && path === '/transactions') {
      tempId = `temp-${crypto.randomUUID()}`;
      optimistic = { id: tempId, done: false, _pending: true, ...body };
      await enqueue({ method, path, body: options.body, tempId });
    } else if (method === 'PUT' && path.startsWith('/transactions/')) {
      const id = path.split('/').pop();
      optimistic = { id, ...body, _pending: true };
      await enqueue({ method, path, body: options.body });
    } else if (method === 'DELETE' && path.startsWith('/transactions/')) {
      optimistic = { ok: true };
      await enqueue({ method, path, body: null });
    } else {
      await enqueue({ method, path, body: options.body ?? null });
      optimistic = body ?? { ok: true, _pending: true };
    }

    if (optimistic && path.startsWith('/transactions')) {
      await applyOptimistic(method, path, body, optimistic);
    }

    notify();
    return optimistic;
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

      if (item.tempId && res?.id) {
        await db.idMap.put({ tempId: item.tempId, realId: res.id });
        await patchTransactionsCache((list) =>
          list.map((t) => (t.id === item.tempId ? { ...res, _pending: false } : t)),
        );
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
