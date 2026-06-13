// app.jsx — root app component

function App() {
  const alreadyLogged = localStorage.getItem('fin_logged_in') === '1';
  const [loggedIn, setLoggedIn] = React.useState(alreadyLogged);

  if (!loggedIn) {
    return (
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'center', minHeight:'100vh', padding:'40px 20px 60px' }}>
        <OnboardingApp onLogin={() => setLoggedIn(true)} />
      </div>
    );
  }

  return <MainApp />;  
}

function MainApp() {
  const [activeTab,         setActiveTab]         = React.useState('dashboard');
  const [showModal,         setShowModal]         = React.useState(false);
  const [showRepasse,       setShowRepasse]       = React.useState(false);
  const [showGestao,        setShowGestao]        = React.useState(false);
  const [showIndependencia, setShowIndependencia] = React.useState(false);
  const [showTributario,    setShowTributario]    = React.useState(false);
  const [showComparativo,   setShowComparativo]   = React.useState(false);
  const [showCalculadora,   setShowCalculadora]   = React.useState(false);
  const [showSimulador,     setShowSimulador]     = React.useState(false);
  const [showRelatorio,     setShowRelatorio]     = React.useState(false);
  const [showPGBL,          setShowPGBL]          = React.useState(false);
  const [showScore,         setShowScore]         = React.useState(false);
  const [showPlanilha,      setShowPlanilha]      = React.useState(false);
  const [transactions,      setTransactions]      = React.useState(AppData.transactions);
  const [dark,              setDark]              = React.useState(false);
  const [investments,       setInvestments]       = React.useState(AppData.investments);
  const [financings,        setFinancings]        = React.useState([]);
  const [repasse,           setRepasse]           = React.useState({
    day: 5, monthlyLimit: 50000, annualLimit: 600000, year: 2026,
    months: [
      { m: 'Jan', amount: 28000, done: true  },
      { m: 'Fev', amount: 28000, done: true  },
      { m: 'Mar', amount: 28000, done: true  },
      { m: 'Abr', amount: 32000, done: true  },
      { m: 'Mai', amount: 32000, done: true  },
      { m: 'Jun', amount: 34000, done: false },
      { m: 'Jul', amount: 40000, done: false },
      { m: 'Ago', amount: 40000, done: false },
      { m: 'Set', amount: 25000, done: false },
      { m: 'Out', amount: 25000, done: false },
      { m: 'Nov', amount: 25000, done: false },
      { m: 'Dez', amount: 25000, done: false },
    ],
  });

  const [movimentosFilter, setMovimentosFilter] = React.useState('Todos');

  const closeAllSub = () => {
    setShowRepasse(false); setShowGestao(false);
    setShowIndependencia(false); setShowTributario(false);
    setShowComparativo(false); setShowCalculadora(false);
    setShowSimulador(false); setShowRelatorio(false);
    setShowPGBL(false); setShowScore(false); setShowPlanilha(false);
  };

  const handleTabChange = (tab) => { setActiveTab(tab); closeAllSub(); };

  const handleSave = (tx) => {
    setTransactions(prev => [
      { ...tx, id: Date.now(), done: tx.status === 'realizado' },
      ...prev,
    ]);
  };

  const handleSaveFinancing = (fin) => {
    setFinancings(prev => [fin, ...prev]);
    const first = fin.schedule[0];
    if (first) {
      setTransactions(prev => [
        { id: Date.now(), type: 'expense', desc: `${fin.desc} — parcela 1/${fin.nParcelas}`, value: first.total, entity: fin.entity, date: first.date, done: false, cat: 'Financiamento' },
        ...prev,
      ]);
    }
  };

  const subScreen = showRepasse       ? 'repasse'
                  : showGestao        ? 'gestao'
                  : showIndependencia ? 'independencia'
                  : showTributario    ? 'tributario'
                  : showComparativo   ? 'comparativo'
                  : showCalculadora   ? 'calculadora'
                  : showSimulador     ? 'simulador'
                  : showRelatorio     ? 'relatorio'
                  : showPGBL         ? 'pgbl'
                  : showScore        ? 'score'
                  : showPlanilha     ? 'planilha'
                  : null;

  const showFAB = !subScreen && (activeTab === 'dashboard' || activeTab === 'movimentos');

  return (
    <IOSDevice>
      <div style={{
        height: '100%', display: 'flex', flexDirection: 'column',
        background: '#F7F8FA', position: 'relative', overflow: 'hidden',
        fontFamily: "'DM Sans', system-ui, sans-serif",
        filter: dark ? 'invert(1) hue-rotate(180deg)' : 'none',
        transition: 'filter 0.35s ease',
      }}>
        <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          {subScreen === 'repasse'       ? <RepasseScreen              repasse={repasse} setRepasse={setRepasse} onBack={closeAllSub} setTransactions={setTransactions} /> :
           subScreen === 'gestao'        ? <GestaoScreen               investments={investments} setInvestments={setInvestments} onBack={closeAllSub} /> :
           subScreen === 'independencia' ? <IndependenciaScreen        onBack={closeAllSub} /> :
           subScreen === 'tributario'    ? <TributarioScreen           onBack={closeAllSub} /> :
           subScreen === 'comparativo'   ? <ComparativoMesesScreen     onBack={closeAllSub} /> :
           subScreen === 'calculadora'   ? <CalculadoraRentabilidadeScreen onBack={closeAllSub} /> :
           subScreen === 'simulador'     ? <SimuladorESeScreen         onBack={closeAllSub} /> :
           subScreen === 'relatorio'     ? <RelatorioMensalScreen      onBack={closeAllSub} transactions={transactions} /> :
           subScreen === 'pgbl'         ? <PGBLScreen                 onBack={closeAllSub} /> :
           subScreen === 'score'        ? <ScoreSaudeScreen           onBack={closeAllSub} /> :
           subScreen === 'planilha'     ? <RecorrenciasSheet          onBack={closeAllSub} /> :
          (
            <>
              {activeTab === 'dashboard'    && <DashboardScreen    onNewEntry={() => setShowModal(true)} repasse={repasse} onShowRepasse={() => setShowRepasse(true)} transactions={transactions} setTransactions={setTransactions} onNavToMovimentos={(f) => { setMovimentosFilter(f); handleTabChange('movimentos'); }} />}
              {activeTab === 'movimentos'   && <MovimentosScreen   transactions={transactions} setTransactions={setTransactions} defaultFilter={movimentosFilter} />}
              {activeTab === 'planejamento' && <PlanejamentoScreen transactions={transactions} />}
              {activeTab === 'patrimonio'   && <PatrimonioScreen   />}
              {activeTab === 'mais' && <MaisScreen dark={dark} onToggleDark={() => setDark(d => !d)} repasse={repasse} setRepasse={setRepasse}
                onShowRepasse={() => setShowRepasse(true)} onShowGestao={() => setShowGestao(true)}
                onShowIndependencia={() => setShowIndependencia(true)} onShowTributario={() => setShowTributario(true)}
                onShowComparativo={() => setShowComparativo(true)} onShowCalculadora={() => setShowCalculadora(true)}
                onShowSimulador={() => setShowSimulador(true)} onShowRelatorio={() => setShowRelatorio(true)}
                onShowPGBL={() => setShowPGBL(true)} onShowScore={() => setShowScore(true)}
                onShowPlanilha={() => setShowPlanilha(true)}
              />}
            </>
          )}
        </div>
        {showFAB && <FAB onClick={() => setShowModal(true)} />}
        <BottomNav active={activeTab} onTabChange={handleTabChange} />
        {showModal && (
          <NovoLancamentoModal
            onClose={() => setShowModal(false)}
            onSave={handleSave}
            onSaveFinancing={handleSaveFinancing}
          />
        )}
      </div>
    </IOSDevice>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
