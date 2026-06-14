import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as txApi from '../api/transactions.js';
import { toast } from '../lib/toast.js';

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
    onSuccess: () => {
      invalidate();
      toast.success('Lançamento salvo');
    },
    onError: (err) => toast.error(err?.message),
  });

  const update = useMutation({
    mutationFn: ({ id, patch }) => txApi.updateTransaction(id, patch),
    onSuccess: () => {
      invalidate();
      toast.success('Lançamento atualizado');
    },
    onError: (err) => toast.error(err?.message),
  });

  const remove = useMutation({
    mutationFn: txApi.deleteTransaction,
    onSuccess: () => {
      invalidate();
      toast.success('Lançamento removido');
    },
    onError: (err) => toast.error(err?.message),
  });

  const bulkCreate = useMutation({
    mutationFn: txApi.createTransactionsBulk,
    onSuccess: (list) => {
      invalidate();
      toast.success(`${list?.length || 0} parcelas geradas`);
    },
    onError: (err) => toast.error(err?.message),
  });

  const bulkRemove = useMutation({
    mutationFn: txApi.deleteTransactionsBulk,
    onSuccess: (result) => {
      invalidate();
      toast.success(`${result?.deleted || 0} lançamento(s) removido(s)`);
    },
    onError: (err) => toast.error(err?.message),
  });

  return { create, update, remove, bulkCreate, bulkRemove };
}
