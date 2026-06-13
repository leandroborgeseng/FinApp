import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppData } from '../data.js';
import * as financeApi from '../api/finance.js';

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
    },
  });

  const updateAll = useMutation({
    mutationFn: financeApi.updateRepasse,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['repasse'] });
      qc.invalidateQueries({ queryKey: ['bootstrap'] });
    },
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recurring-overrides'] }),
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
    },
  });

  return { ...query, update };
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
    },
  });
  return { save };
}

export function useFinancings() {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ['financings'],
    queryFn: financeApi.fetchFinancings,
    staleTime: 30_000,
  });

  const update = useMutation({
    mutationFn: ({ id, patch }) => financeApi.updateFinancing(id, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['financings'] });
      qc.invalidateQueries({ queryKey: ['bootstrap'] });
    },
  });

  return { ...query, update };
}

export function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export const FinanceContext = React.createContext(AppData);

export function FinanceProvider({ children, data }) {
  const value = data || AppData;
  return (
    <FinanceContext.Provider value={value}>
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  return React.useContext(FinanceContext);
}
