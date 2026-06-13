import { apiFetch } from './client.js';

export function exportData() {
  return apiFetch('/export');
}

export function importData(payload) {
  return apiFetch('/import', { method: 'POST', body: JSON.stringify(payload) });
}

export function createBackup() {
  return apiFetch('/backup', { method: 'POST', body: '{}' });
}

function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function downloadExport() {
  const data = await exportData();
  const stamp = new Date().toISOString().slice(0, 10);
  downloadJson(`finapp-export-${stamp}.json`, data);
  return data;
}

export async function downloadBackup() {
  const { backup } = await createBackup();
  const stamp = new Date().toISOString().slice(0, 10);
  downloadJson(`finapp-backup-${stamp}.json`, backup);
  localStorage.setItem('fin_last_backup', new Date().toISOString());
  return backup;
}

export function pickAndImportFile(onSuccess, onError) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json,application/json';
  input.onchange = async () => {
    const file = input.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const payload = JSON.parse(text);
      const data = payload.snapshot || payload.transactions
        ? payload
        : { snapshot: payload };
      await importData(data);
      onSuccess?.();
    } catch (e) {
      onError?.(e);
    }
  };
  input.click();
}
