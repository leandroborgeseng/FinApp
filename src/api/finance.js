import { apiFetch } from './client.js';

export function fetchBootstrap() {
  return apiFetch('/bootstrap');
}

export function fetchRepasse() {
  return apiFetch('/repasse');
}

export function updateRepasse(data) {
  return apiFetch('/repasse', { method: 'PUT', body: JSON.stringify(data) });
}

export function updateRepasseMonth(idx, patch) {
  return apiFetch(`/repasse/month/${idx}`, { method: 'PUT', body: JSON.stringify(patch) });
}

export function fetchRecurringOverrides() {
  return apiFetch('/recurring-overrides');
}

export function saveRecurringOverrides(overrides) {
  return apiFetch('/recurring-overrides', { method: 'PUT', body: JSON.stringify({ overrides }) });
}

export function fetchInvestments() {
  return apiFetch('/investments');
}

export function updateInvestment(id, patch) {
  return apiFetch(`/investments/${id}`, { method: 'PUT', body: JSON.stringify(patch) });
}

export function fetchGoals() {
  return apiFetch('/goals');
}

export function updateGoal(id, patch) {
  return apiFetch(`/goals/${id}`, { method: 'PUT', body: JSON.stringify(patch) });
}

export function saveMonthlyEvents(events) {
  return apiFetch('/monthly-events', { method: 'PUT', body: JSON.stringify({ events }) });
}

export function fetchPreferences() {
  return apiFetch('/preferences');
}

export function savePreferences(prefs) {
  return apiFetch('/preferences', { method: 'PUT', body: JSON.stringify(prefs) });
}
