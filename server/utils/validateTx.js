const ENTITY_OK = new Set(['PF', 'PJ']);
const TYPE_OK = new Set(['income', 'expense', 'transfer', 'invest']);

export function validateTransaction(tx) {
  if (!tx?.desc?.trim()) return 'Descrição obrigatória';

  const value = Number(tx.value);
  if (!Number.isFinite(value) || value <= 0) return 'Valor deve ser maior que zero';

  if (!TYPE_OK.has(tx.type)) return 'Tipo inválido';

  if (!ENTITY_OK.has(tx.entity)) return 'Entidade deve ser PF ou PJ';

  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(tx.date || ''))) {
    return 'Data inválida (use AAAA-MM-DD)';
  }

  return null;
}
