import { apiFetch } from './client.js';

export function fetchTransactions({ month, entity } = {}) {
  const params = new URLSearchParams();
  if (month) params.set('month', month);
  if (entity && entity !== 'Todos') params.set('entity', entity);
  const qs = params.toString();
  return apiFetch(`/transactions${qs ? `?${qs}` : ''}`);
}

export function createTransaction(tx) {
  return apiFetch('/transactions', { method: 'POST', body: JSON.stringify(tx) });
}

export function createTransactionsBulk(transactions) {
  return apiFetch('/transactions/bulk', { method: 'POST', body: JSON.stringify({ transactions }) });
}

export function updateTransaction(id, patch) {
  return apiFetch(`/transactions/${id}`, { method: 'PUT', body: JSON.stringify(patch) });
}

export function deleteTransaction(id) {
  return apiFetch(`/transactions/${id}`, { method: 'DELETE' });
}

export function deleteTransactionsBulk(payload) {
  return apiFetch('/transactions/bulk-delete', { method: 'POST', body: JSON.stringify(payload) });
}
