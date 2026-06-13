import {
  createOfflineAwareFetch,
  processQueue,
  subscribeSyncStatus,
  getFullSyncStatus,
} from '../store/offlineQueue.js';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const TOKEN_KEY = 'fin_access_token';
const REFRESH_KEY = 'fin_refresh_token';

export function getAccessToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_KEY);
}

export function setTokens({ accessToken, refreshToken }) {
  if (accessToken) localStorage.setItem(TOKEN_KEY, accessToken);
  if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
}

export function clearTokens() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem('fin_logged_in');
  localStorage.removeItem('fin_user_email');
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;
  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  setTokens({ accessToken: data.accessToken || data.token });
  return data.accessToken || data.token;
}

export async function rawApiFetch(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  const token = getAccessToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  } catch (err) {
    throw err;
  }

  if (res.status === 401 && getRefreshToken()) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers.Authorization = `Bearer ${newToken}`;
      res = await fetch(`${API_BASE}${path}`, { ...options, headers });
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(body.error || res.statusText, res.status);
  }

  if (res.status === 204) return null;
  return res.json();
}

export const apiFetch = createOfflineAwareFetch(rawApiFetch);

export { subscribeSyncStatus, getFullSyncStatus, processQueue };

export function startOfflineSync(onSynced) {
  const run = () => processQueue(rawApiFetch, { onSynced });
  window.addEventListener('online', run);
  run();
  return () => window.removeEventListener('online', run);
}
