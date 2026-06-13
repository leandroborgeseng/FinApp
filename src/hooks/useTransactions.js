import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as txApi from '../api/transactions.js';

export function useTransactions({ month, entity } = {}) {
  return useQuery({
    queryKey: ['transactions', month, entity],
    queryFn: () => txApi.fetchTransactions({ month, entity }),
    staleTime: 30_000,
  });
}

export function useTransactionMutations() {
  const qc = useQueryClient();

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['transactions'] });
    qc.invalidateQueries({ queryKey: ['bootstrap'] });
  };

  const create = useMutation({
    mutationFn: txApi.createTransaction,
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({ id, patch }) => txApi.updateTransaction(id, patch),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: txApi.deleteTransaction,
    onSuccess: invalidate,
  });

  return { create, update, remove };
}
