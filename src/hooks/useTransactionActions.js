import { useTransactions, useTransactionMutations } from './useTransactions.js';

export function useTransactionActions() {
  const { create, update, remove } = useTransactionMutations();

  return {
    create: (tx) => create.mutate(tx),
    createAsync: (tx) => create.mutateAsync(tx),
    update: (id, patch) => update.mutate({ id: String(id), patch }),
    remove: (id) => remove.mutate(String(id)),
    toggleDone: (id, done) => update.mutate({ id: String(id), patch: { done } }),
    isPending: create.isPending || update.isPending || remove.isPending,
  };
}

export { useTransactions, useTransactionMutations };
