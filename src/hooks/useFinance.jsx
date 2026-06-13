import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as financeApi from '../api/finance.js';
import { toast } from '../lib/toast.js';

export function useBootstrap() {
  return useQuery({
    queryKey: ['bootstrap'],
    queryFn: financeApi.fetchBootstrap,
    staleTime: 30_000,
  });
}

export function useRepasse() {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ['repasse'],
    queryFn: financeApi.fetchRepasse,
    staleTime: 30_000,
  });

  const updateMonth = useMutation({
    mutationFn: ({ idx, patch }) => financeApi.updateRepasseMonth(idx, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['repasse'] });
      qc.invalidateQueries({ queryKey: ['bootstrap'] });
      qc.invalidateQueries({ queryKey: ['transactions'] });
      toast.success('Repasse atualizado');
    },
    onError: (err) => toast.error(err?.message),
  });

  const updateAll = useMutation({
    mutationFn: financeApi.updateRepasse,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['repasse'] });
      qc.invalidateQueries({ queryKey: ['bootstrap'] });
      toast.success('Repasse atualizado');
    },
    onError: (err) => toast.error(err?.message),
  });

  return { ...query, updateMonth, updateAll };
}

export function useRecurringOverrides() {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ['recurring-overrides'],
    queryFn: financeApi.fetchRecurringOverrides,
    staleTime: 30_000,
    initialData: {},
  });

  const save = useMutation({
    mutationFn: financeApi.saveRecurringOverrides,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recurring-overrides'] });
      toast.success('Planilha salva');
    },
    onError: (err) => toast.error(err?.message),
  });

  return { ...query, save };
}

export function useInvestments() {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ['investments'],
    queryFn: financeApi.fetchInvestments,
    staleTime: 30_000,
  });

  const update = useMutation({
    mutationFn: ({ id, patch }) => financeApi.updateInvestment(id, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['investments'] });
      qc.invalidateQueries({ queryKey: ['bootstrap'] });
      toast.success('Investimento atualizado');
    },
    onError: (err) => toast.error(err?.message),
  });

  return { ...query, update };
}

export function useGoals() {
  const qc = useQueryClient();
  const update = useMutation({
    mutationFn: ({ id, patch }) => financeApi.updateGoal(id, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bootstrap'] });
      toast.success('Meta atualizada');
    },
    onError: (err) => toast.error(err?.message),
  });
  return { update };
}

export function usePreferences() {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ['preferences'],
    queryFn: financeApi.fetchPreferences,
    staleTime: 60_000,
    initialData: { dark: localStorage.getItem('fin_dark') === '1' },
  });

  const save = useMutation({
    mutationFn: financeApi.savePreferences,
    onSuccess: (data) => {
      qc.setQueryData(['preferences'], data);
      qc.invalidateQueries({ queryKey: ['bootstrap'] });
    },
    onError: (err) => toast.error(err?.message || 'Falha ao salvar preferências'),
  });

  return { ...query, save };
}

export function useMonthlyEvents() {
  const qc = useQueryClient();
  const save = useMutation({
    mutationFn: financeApi.saveMonthlyEvents,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bootstrap'] });
      qc.invalidateQueries({ queryKey: ['monthly-events'] });
      toast.success('Recorrências salvas');
    },
    onError: (err) => toast.error(err?.message),
  });
  return { save };
}

export function useBudget() {
  const qc = useQueryClient();
  const update = useMutation({
    mutationFn: ({ month, patch }) => financeApi.updateBudgetMonth(month, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bootstrap'] });
      toast.success('Orçamento atualizado');
    },
    onError: (err) => toast.error(err?.message || 'Falha ao salvar orçamento'),
  });
  return { update };
}

export function useFinancings() {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ['financings'],
    queryFn: financeApi.fetchFinancings,
    staleTime: 30_000,
  });

  const create = useMutation({
    mutationFn: financeApi.createFinancing,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['financings'] });
      qc.invalidateQueries({ queryKey: ['bootstrap'] });
      toast.success('Financiamento criado');
    },
    onError: (err) => toast.error(err?.message || 'Falha ao criar financiamento'),
  });

  const update = useMutation({
    mutationFn: ({ id, patch }) => financeApi.updateFinancing(id, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['financings'] });
      qc.invalidateQueries({ queryKey: ['bootstrap'] });
      toast.success('Financiamento atualizado');
    },
    onError: (err) => toast.error(err?.message),
  });

  return { ...query, create, update };
}

export function useAccounts() {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ['accounts'],
    queryFn: financeApi.fetchAccounts,
    staleTime: 30_000,
  });

  const update = useMutation({
    mutationFn: ({ id, patch }) => financeApi.updateAccount(id, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounts'] });
      qc.invalidateQueries({ queryKey: ['bootstrap'] });
      toast.success('Conta atualizada');
    },
    onError: (err) => toast.error(err?.message || 'Falha ao salvar conta'),
  });

  return { ...query, update };
}

export function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export const FinanceContext = React.createContext(null);

export function FinanceProvider({ children, data }) {
  if (!data) {
    throw new Error('FinanceProvider requer dados do bootstrap');
  }
  return (
    <FinanceContext.Provider value={data}>
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const ctx = React.useContext(FinanceContext);
  if (!ctx) {
    throw new Error('useFinance deve ser usado dentro de FinanceProvider com dados carregados');
  }
  return ctx;
}
