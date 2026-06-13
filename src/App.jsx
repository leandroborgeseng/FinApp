import React from 'react';
import { useAuth } from './context/AuthContext.jsx';
import { FinanceProvider, useBootstrap, useRepasse, usePreferences, useFinancings, slugify } from './hooks/useFinance.jsx';
import { useTransactions, useTransactionActions } from './hooks/useTransactionActions.js';
import { useSyncStatus } from './hooks/useSyncStatus.jsx';
import { AppShell } from './components/AppShell.jsx';
import { OnboardingApp } from './components/onboarding.jsx';
import { BottomNav, FAB } from './components/navigation.jsx';
import { NovoLancamentoModal } from './components/modal.jsx';
import { DashboardScreen, MovimentosScreen } from './screens/screens-a.jsx';
import { PlanejamentoScreen, PatrimonioScreen, MaisScreen } from './screens/screens-b.jsx';
import { RepasseScreen } from './screens/screens-repasse.jsx';
import { GestaoScreen } from './screens/screens-gestao.jsx';
import { IndependenciaScreen, TributarioScreen } from './screens/screens-analise.jsx';
import { ComparativoMesesScreen, CalculadoraRentabilidadeScreen } from './screens/screens-extra.jsx';
import { SimuladorESeScreen, RelatorioMensalScreen, PGBLScreen, ScoreSaudeScreen } from './screens/screens-tools.jsx';
import { RecorrenciasSheet } from './screens/screens-sheet.jsx';
import { ToastHost } from './components/Toast.jsx';
import { applyThemeClass } from './lib/theme.js';

export default function App() {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="app-loading">
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)', fontFamily: 'DM Sans, system-ui' }}>
          Carregando…
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <ToastHost />
        <OnboardingApp />
      </>
    );
  }

  return (
    <>
      <ToastHost />
      <MainApp user={user} />
    </>
  );
}

function MainApp({ user }) {
  const { data: finance, isLoading: financeLoading, isError: financeError, refetch: refetchFinance } = useBootstrap();
  const { data: repasse, updateMonth, updateAll } = useRepasse();
  const { data: transactions = [], isLoading: txLoading } = useTransactions();
  const { data: preferences, save: savePreferences } = usePreferences();
  const txActions = useTransactionActions();
  const { create: createFinancing } = useFinancings();

  const [activeTab, setActiveTab] = React.useState('dashboard');
  const [showModal, setShowModal] = React.useState(false);
  const [showRepasse, setShowRepasse] = React.useState(false);
  const [showGestao, setShowGestao] = React.useState(false);
  const [showIndependencia, setShowIndependencia] = React.useState(false);
  const [showTributario, setShowTributario] = React.useState(false);
  const [showComparativo, setShowComparativo] = React.useState(false);
  const [showCalculadora, setShowCalculadora] = React.useState(false);
  const [showSimulador, setShowSimulador] = React.useState(false);
  const [showRelatorio, setShowRelatorio] = React.useState(false);
  const [showPGBL, setShowPGBL] = React.useState(false);
  const [showScore, setShowScore] = React.useState(false);
  const [showPlanilha, setShowPlanilha] = React.useState(false);
  const [dark, setDark] = React.useState(() => {
    if (localStorage.getItem('fin_dark') === '1') return true;
    return false;
  });
  const [movimentosFilter, setMovimentosFilter] = React.useState('Todos');

  React.useEffect(() => {
    if (preferences?.dark !== undefined) setDark(!!preferences.dark);
  }, [preferences?.dark]);

  React.useEffect(() => {
    applyThemeClass(dark);
  }, [dark]);

  React.useEffect(() => {
    localStorage.setItem('fin_dark', dark ? '1' : '0');
  }, [dark]);

  const handleToggleDark = () => {
    const next = !dark;
    setDark(next);
    savePreferences.mutate({ dark: next });
  };

  const repasseState = repasse || finance.repasse;

  const closeAllSub = () => {
    setShowRepasse(false);
    setShowGestao(false);
    setShowIndependencia(false);
    setShowTributario(false);
    setShowComparativo(false);
    setShowCalculadora(false);
    setShowSimulador(false);
    setShowRelatorio(false);
    setShowPGBL(false);
    setShowScore(false);
    setShowPlanilha(false);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    closeAllSub();
  };

  const handleSave = (tx) => {
    txActions.create({
      desc: tx.desc,
      value: Number(tx.value),
      type: tx.type || 'expense',
      entity: tx.account || tx.entity || 'PF',
      date: tx.date || new Date().toISOString().slice(0, 10),
      done: tx.status === 'realizado',
      cat: tx.cat || 'Outros',
    });
  };

  const handleSaveFinancing = (fin) => {
    const last = fin.schedule?.[fin.schedule.length - 1];
    const endYear = last?.date ? Number(last.date.slice(0, 4)) : new Date().getFullYear() + 5;
    const id = `${slugify(fin.desc)}-${Date.now()}`;
    const entry = {
      id,
      bank: fin.desc,
      balance: fin.principal,
      installment: fin.pmtTotal,
      endYear,
      entity: fin.entity,
      cet: fin.cetAnual,
      originalBalance: fin.principal,
      cat: 'Financiamento',
      sistema: fin.sistema,
      nParcelas: fin.nParcelas,
      startDate: fin.startDate,
      diaVenc: fin.diaVenc,
      schedule: fin.schedule,
    };

    createFinancing.mutate(entry, {
      onSuccess: () => {
        const txs = (fin.schedule || []).map((row) => ({
          type: 'expense',
          desc: `${fin.desc} — parcela ${row.n}/${fin.nParcelas}`,
          value: row.total,
          entity: fin.entity,
          date: row.date,
          done: false,
          cat: 'Financiamento',
        }));
        if (txs.length) txActions.bulkCreate(txs);
      },
    });
  };

  const handleRepasseUpdate = (nextRepasse) => {
    updateAll.mutate(nextRepasse);
  };

  const handleRepasseMonth = (idx, patch) => {
    updateMonth.mutate({ idx, patch });
  };

  const subScreen = showRepasse ? 'repasse'
    : showGestao ? 'gestao'
    : showIndependencia ? 'independencia'
    : showTributario ? 'tributario'
    : showComparativo ? 'comparativo'
    : showCalculadora ? 'calculadora'
    : showSimulador ? 'simulador'
    : showRelatorio ? 'relatorio'
    : showPGBL ? 'pgbl'
    : showScore ? 'score'
    : showPlanilha ? 'planilha'
    : null;

  const showFAB = !subScreen && (activeTab === 'dashboard' || activeTab === 'movimentos');
  const { status: connectivityStatus, pending: syncPending } = useSyncStatus();
  const txList = transactions;
  const syncStatus = !connectivityStatus || connectivityStatus === 'synced'
    ? (financeLoading || txLoading || txActions.isPending || syncPending > 0 ? 'syncing' : 'synced')
    : connectivityStatus;

  if (financeLoading && !finance) {
    return (
      <AppShell dark={dark}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontFamily: 'DM Sans, system-ui' }}>
          Carregando seus dados…
        </div>
      </AppShell>
    );
  }

  if (financeError || !finance) {
    return (
      <AppShell dark={dark}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24, fontFamily: 'DM Sans, system-ui' }}>
          <div style={{ color: '#DC2626', fontWeight: 700 }}>Não foi possível carregar os dados</div>
          <button onClick={() => refetchFinance()} style={{ padding: '12px 20px', borderRadius: 12, border: 'none', background: '#2563EB', color: 'var(--text-inverse)', fontWeight: 700, cursor: 'pointer' }}>
            Tentar novamente
          </button>
        </div>
      </AppShell>
    );
  }

  return (
    <FinanceProvider data={finance}>
      <AppShell dark={dark}>
        <div style={{ flex: 1, overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column' }}>
          {subScreen === 'repasse' ? (
            <RepasseScreen
              repasse={repasseState}
              onUpdateRepasse={handleRepasseUpdate}
              onUpdateMonth={handleRepasseMonth}
              onBack={closeAllSub}
            />
          ) : subScreen === 'gestao' ? (
            <GestaoScreen onBack={closeAllSub} />
          ) : subScreen === 'independencia' ? (
            <IndependenciaScreen onBack={closeAllSub} />
          ) : subScreen === 'tributario' ? (
            <TributarioScreen onBack={closeAllSub} />
          ) : subScreen === 'comparativo' ? (
            <ComparativoMesesScreen onBack={closeAllSub} />
          ) : subScreen === 'calculadora' ? (
            <CalculadoraRentabilidadeScreen onBack={closeAllSub} />
          ) : subScreen === 'simulador' ? (
            <SimuladorESeScreen onBack={closeAllSub} />
          ) : subScreen === 'relatorio' ? (
            <RelatorioMensalScreen onBack={closeAllSub} transactions={txList} />
          ) : subScreen === 'pgbl' ? (
            <PGBLScreen onBack={closeAllSub} />
          ) : subScreen === 'score' ? (
            <ScoreSaudeScreen onBack={closeAllSub} />
          ) : subScreen === 'planilha' ? (
            <RecorrenciasSheet onBack={closeAllSub} />
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <DashboardScreen
                  onNewEntry={() => setShowModal(true)}
                  repasse={repasseState}
                  onShowRepasse={() => setShowRepasse(true)}
                  transactions={txList}
                  txActions={txActions}
                  syncStatus={syncStatus}
                  onNavToMovimentos={(f) => { setMovimentosFilter(f); handleTabChange('movimentos'); }}
                />
              )}
              {activeTab === 'movimentos' && (
                <MovimentosScreen
                  transactions={txList}
                  txActions={txActions}
                  defaultFilter={movimentosFilter}
                />
              )}
              {activeTab === 'planejamento' && <PlanejamentoScreen transactions={txList} />}
              {activeTab === 'patrimonio' && <PatrimonioScreen />}
              {activeTab === 'mais' && (
                <MaisScreen
                  user={user}
                  syncStatus={syncStatus}
                  dark={dark}
                  onToggleDark={handleToggleDark}
                  repasse={repasseState}
                  onShowRepasse={() => setShowRepasse(true)}
                  onShowGestao={() => setShowGestao(true)}
                  onShowIndependencia={() => setShowIndependencia(true)}
                  onShowTributario={() => setShowTributario(true)}
                  onShowComparativo={() => setShowComparativo(true)}
                  onShowCalculadora={() => setShowCalculadora(true)}
                  onShowSimulador={() => setShowSimulador(true)}
                  onShowRelatorio={() => setShowRelatorio(true)}
                  onShowPGBL={() => setShowPGBL(true)}
                  onShowScore={() => setShowScore(true)}
                  onShowPlanilha={() => setShowPlanilha(true)}
                />
              )}
            </>
          )}
        </div>
        {showFAB && <FAB onClick={() => setShowModal(true)} />}
        {!subScreen && <BottomNav active={activeTab} onTabChange={handleTabChange} />}
        {showModal && (
          <NovoLancamentoModal
            onClose={() => setShowModal(false)}
            onSave={handleSave}
            onSaveFinancing={handleSaveFinancing}
          />
        )}
      </AppShell>
    </FinanceProvider>
  );
}
