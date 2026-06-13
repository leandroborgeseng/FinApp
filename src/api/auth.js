import { apiFetch, setTokens, clearTokens } from './client.js';

export async function login(email, password) {
  clearTokens();
  const data = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: email.trim().toLowerCase(),
      password: password.trim(),
    }),
  });
  setTokens({
    accessToken: data.accessToken || data.token,
    refreshToken: data.refreshToken,
  });
  localStorage.setItem('fin_logged_in', '1');
  localStorage.setItem('fin_user_email', data.user.email);
  return data.user;
}

export async function register(email, password, name) {
  const data = await apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, name }),
  });
  setTokens({
    accessToken: data.accessToken || data.token,
    refreshToken: data.refreshToken,
  });
  localStorage.setItem('fin_logged_in', '1');
  localStorage.setItem('fin_user_email', data.user.email);
  return data.user;
}

export async function fetchMe() {
  return apiFetch('/auth/me');
}

export async function logout() {
  const refreshToken = localStorage.getItem('fin_refresh_token');
  try {
    await apiFetch('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  } catch { /* ignore */ }
  clearTokens();
}
