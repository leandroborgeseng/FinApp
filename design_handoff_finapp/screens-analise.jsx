// screens-analise.jsx — Orçado vs. Realizado · Independência · Tributário

/* ─────────────────────────────────────────────────────
   ORÇADO VS. REALIZADO
   ───────────────────────────────────────────────────── */
function OrcadoVsRealizado({ transactions }) {
  const todayMonth = '2026-06';

  // Planned from monthlyEvents grouped by category
  const planned = { income: {}, expense: {} };
  AppData.monthlyEvents.forEach(e => {
    const side = e.type === 'income' ? 'income' : 'expense';
    planned[side][e.cat] = (planned[side][e.cat] || 0) + e.value;
  });

  // Actual from confirmed (done:true) transactions this month
  const actual = { income: {}, expense: {} };
  (transactions || [])
    .filter(tx => tx.date.startsWith(todayMonth) && tx.done)
    .forEach(tx => {
      const side = tx.type === 'income' ? 'income' : 'expense';
      actual[side][tx.cat || 'Outros'] = (actual[side][tx.cat || 'Outros'] || 0) + tx.value;
    });

  const planTotalInc  = Object.values(planned.income).reduce((s, v) => s + v, 0);
  const planTotalExp  = Object.values(planned.expense).reduce((s, v) => s + v, 0);
  const actTotalInc   = Object.values(actual.income).reduce((s, v) => s + v, 0);
  const actTotalExp   = Object.values(actual.expense).reduce((s, v) => s + v, 0);

  const renderGroup = (side, title, accentColor) => {
    const cats = [...new Set([...Object.keys(planned[side]), ...Object.keys(actual[side])])].sort();
    const isIncome = side === 'income';
    return (
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: accentColor, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 10, paddingLeft: 2 }}>
          {title}
        </div>
        <Card style={{ padding: '8px 6px' }}>
          {cats.map((cat, i) => {
            const p = planned[side][cat] || 0;
            const a = actual[side][cat] || 0;
            const pct = p > 0 ? Math.min(100, Math.round(a / p * 100)) : (a > 0 ? 100 : 0);
            const over = a > p && p > 0;
            return (
              <div key={cat}>
                {i > 0 && <div style={{ height: 1, background: '#F4F5F8', margin: '0 12px' }}/>}
                <div style={{ padding: '10px 14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#1A1F36' }}>{cat}</span>
                    <div style={{ display: 'flex', gap: 10, fontSize: 11, alignItems: 'baseline' }}>
                      <span style={{ color: '#8B90A0' }}>{fmt(p)}</span>
                      <span style={{ fontWeight: 700, color: accentColor }}>{fmt(a)}</span>
                      {p > 0 && (
                        <span style={{
                          fontSize: 10, fontWeight: 700,
                          color: isIncome
                            ? (pct >= 100 ? '#16A34A' : '#F59E0B')
                            : (over ? '#DC2626' : pct >= 80 ? '#F59E0B' : '#8B90A0'),
                          background: isIncome
                            ? (pct >= 100 ? '#F0FDF4' : '#FFFBEB')
                            : (over ? '#FEF2F2' : pct >= 80 ? '#FFFBEB' : '#F4F5F8'),
                          padding: '1px 5px', borderRadius: 5,
                        }}>{pct}%</span>
                      )}
                    </div>
                  </div>
                  <div style={{ height: 4, background: '#F0F1F5', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{
                      width: `${pct}%`, height: '100%', borderRadius: 2,
                      background: isIncome
                        ? (pct >= 100 ? '#16A34A' : '#60A5FA')
                        : (over ? '#EF4444' : pct >= 80 ? '#F59E0B' : '#60A5FA'),
                      transition: 'width 0.5s ease',
                    }}/>
                  </div>
                </div>
              </div>
            );
          })}
        </Card>
      </div>
    );
  };

  const incPct = planTotalInc > 0 ? Math.round(actTotalInc / planTotalInc * 100) : 0;
  const expPct = planTotalExp > 0 ? Math.round(actTotalExp / planTotalExp * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Summary strip */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        {[
          { label: 'Receita realizada', plan: planTotalInc, actual: actTotalInc, pct: incPct, col: '#16A34A' },
          { label: 'Despesa realizada', plan: planTotalExp, actual: actTotalExp, pct: expPct, col: '#DC2626' },
          { label: 'Dia do mês',        val: '11/31',       col: '#2563EB', isDay: true },
        ].map((s, i) => (
          <Card key={i} style={{ padding: '10px 11px', textAlign: 'center' }}>
            <div style={{ fontSize: 9, color: '#8B90A0', marginBottom: 3, lineHeight: 1.3 }}>{s.label}</div>
            <div style={{ fontSize: 13, fontWeight: 800, color: s.col }}>
              {s.isDay ? s.val : `${s.pct}%`}
            </div>
            {!s.isDay && (
              <div style={{ fontSize: 9, color: '#8B90A0', marginTop: 2 }}>
                {fmt(s.actual, {short:true})} / {fmt(s.plan, {short:true})}
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 10, color: '#8B90A0', paddingLeft: 2 }}>
        <span>Orçado: valor planejado</span>
        <span style={{ fontWeight: 700, color: '#1A1F36' }}>Realizado: valor confirmado</span>
        <span style={{ fontWeight: 700, color: '#2563EB' }}>% = progresso</span>
      </div>

      {renderGroup('income',  'Receitas',  '#16A34A')}
      {renderGroup('expense', 'Despesas',  '#DC2626')}
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   INDEPENDÊNCIA FINANCEIRA
   ───────────────────────────────────────────────────── */
function IndependenciaScreen({ onBack }) {
  const d = AppData;
  const goal    = d.goals.find(g => g.name.includes('Independência')) || { current: 1250000, target: 3000000, year: 2029 };
  const current = goal.current;
  const target  = goal.target;
  const pct     = (current / target) * 100;

  // Projected hit year (from wealthForecast)
  const forecast  = d.wealthForecast;
  const hitEntry  = forecast.find(f => f.value >= target);
  const projYear  = hitEntry?.year || goal.year;
  const onTrack   = projYear <= goal.year;
  const monthsLeft = (projYear - 2026) * 12 - 5; // rough months from Jun/26
  const needed    = Math.round((target - current) / Math.max(1, monthsLeft));
  const monthly   = d.monthResult;
  const surplus   = monthly - needed;

  // Progress arc (SVG circle)
  const r = 54, cx = 64, cy = 64;
  const circumference = 2 * Math.PI * r;
  const progress = Math.min(1, pct / 100);
  const dashOffset = circumference * (1 - progress);

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: '#F7F8FA', fontFamily: 'DM Sans, system-ui' }}>
      <div style={{ padding: '68px 18px 100px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={onBack} style={{ width: 36, height: 36, borderRadius: '50%', background: '#fff', border: '1.5px solid #ECEEF4', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 4px rgba(26,31,54,0.08)', flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="#1A1F36" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <div>
            <div style={{ fontSize: 19, fontWeight: 700, color: '#1A1F36' }}>Independência Financeira</div>
            <div style={{ fontSize: 11, color: '#8B90A0', marginTop: 1 }}>Meta: {fmt(target, {short:true})} até {goal.year}</div>
          </div>
        </div>

        {/* Hero: progress ring + status */}
        <div style={{ background: 'linear-gradient(145deg, #1A1F36, #253056)', borderRadius: 22, padding: '22px 20px', boxShadow: '0 6px 24px rgba(26,31,54,0.22)', display: 'flex', alignItems: 'center', gap: 18 }}>
          {/* SVG ring */}
          <svg width="128" height="128" viewBox="0 0 128 128" style={{ flexShrink: 0 }}>
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="10"/>
            <circle cx={cx} cy={cy} r={r} fill="none"
              stroke={onTrack ? '#22C55E' : '#F59E0B'} strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={`${circumference}`}
              strokeDashoffset={`${dashOffset}`}
              transform={`rotate(-90 ${cx} ${cy})`}
              style={{ transition: 'stroke-dashoffset 1s ease' }}
            />
            <text x={cx} y={cy - 8} textAnchor="middle" fontSize="18" fontWeight="800" fill="#fff" fontFamily="DM Sans, system-ui">{Math.round(pct)}%</text>
            <text x={cx} y={cy + 10} textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.55)" fontFamily="DM Sans, system-ui">atingido</text>
          </svg>

          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: '#94A3CC', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 6 }}>Patrimônio atual</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px', marginBottom: 14 }}>{fmt(current)}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div>
                <div style={{ fontSize: 9, color: '#94A3CC', textTransform: 'uppercase' }}>Faltam</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#86EFAC' }}>{fmt(target - current, {short:true})}</div>
              </div>
              <div>
                <div style={{ fontSize: 9, color: '#94A3CC', textTransform: 'uppercase' }}>Previsão</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: onTrack ? '#86EFAC' : '#FDE68A' }}>{projYear} {onTrack ? '(no prazo)' : '(atrasado)'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Status card */}
        <Card style={{ padding: '14px 18px', background: surplus >= 0 ? '#F0FDF4' : '#FEF2F2', border: `1.5px solid ${surplus >= 0 ? '#86EFAC' : '#FECACA'}` }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: surplus >= 0 ? '#16A34A' : '#DC2626', marginBottom: 6 }}>
            {surplus >= 0 ? 'Você está adiantado!' : 'Atenção: abaixo do ritmo'}
          </div>
          <div style={{ display: 'flex', gap: 20 }}>
            {[
              ['Sobra atual/mês', fmt(monthly), '#16A34A'],
              ['Necessário/mês', fmt(needed), '#2563EB'],
              ['Superávit', `${surplus >= 0 ? '+' : ''}${fmt(surplus, {short:true})}`, surplus >= 0 ? '#16A34A' : '#DC2626'],
            ].map(([l, v, c]) => (
              <div key={l}>
                <div style={{ fontSize: 9, color: '#8B90A0', marginBottom: 2 }}>{l}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: c }}>{v}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Wealth trajectory chart */}
        <Card style={{ padding: '16px 14px 10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1A1F36' }}>Trajetória patrimonial</div>
            <Tag label={`Meta ${fmt(target, {short:true})}`} color="#F59E0B" bg="#FFFBEB"/>
          </div>
          <AreaChart data={d.wealthForecast} width={326} height={130} goalValue={target} goalLabel={`R$${(target/1000000).toFixed(0)}M`} color="#2563EB"/>
        </Card>

        {/* Other goals */}
        <div style={{ fontSize: 12, fontWeight: 600, color: '#8B90A0', letterSpacing: '0.05em', textTransform: 'uppercase', paddingLeft: 2 }}>
          Outros objetivos
        </div>
        {d.goals.filter(g => !g.name.includes('Independência')).map((g, i) => {
          const gPct = Math.min(100, (g.current / g.target) * 100);
          return (
            <Card key={i} style={{ padding: '14px 18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1A1F36', marginBottom: 1 }}>{g.name}</div>
                  <div style={{ fontSize: 11, color: '#8B90A0' }}>Previsão: {g.year}</div>
                </div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#2563EB' }}>{Math.round(gPct)}%</div>
              </div>
              <div style={{ height: 6, background: '#F0F1F5', borderRadius: 3, overflow: 'hidden', marginBottom: 6 }}>
                <div style={{ width: `${gPct}%`, height: '100%', background: 'linear-gradient(90deg,#2563EB,#60A5FA)', borderRadius: 3 }}/>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#8B90A0' }}>
                <span>Atual: <strong style={{ color: '#1A1F36' }}>{fmt(g.current, {short:true})}</strong></span>
                <span>Meta: <strong style={{ color: '#1A1F36' }}>{fmt(g.target, {short:true})}</strong></span>
              </div>
            </Card>
          );
        })}

      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   ANÁLISE TRIBUTÁRIA PJ — SIMPLES NACIONAL
   ───────────────────────────────────────────────────── */
function TributarioScreen({ onBack }) {
  const MB = AppData.monthlyBudget;

  // Annual projected PJ revenue (next 12 months)
  const next12     = MB.slice(0, 12);
  const annualRev  = next12.reduce((s, r) => s + r.pjInc, 0);
  const monthlyAvg = Math.round(annualRev / 12);

  // Simples Nacional Anexo III table
  const faixas = [
    { label: '1ª', max: 180000,   aliq: 0.060, ded: 0      },
    { label: '2ª', max: 360000,   aliq: 0.112, ded: 9360   },
    { label: '3ª', max: 720000,   aliq: 0.135, ded: 17640  },
    { label: '4ª', max: 1440000,  aliq: 0.160, ded: 35640  },
    { label: '5ª', max: 4800000,  aliq: 0.210, ded: 125640 },
  ];
  const faixa         = faixas.find(f => annualRev < f.max) || faixas[4];
  const efectiveRate  = (annualRev * faixa.aliq - faixa.ded) / annualRev;
  const monthlyDAS    = Math.round(monthlyAvg * efectiveRate);
  const annualDAS     = Math.round(annualRev * efectiveRate);

  // DAS breakdown (approximate Anexo III proportions for services)
  const breakdown = [
    { label: 'IRPJ',   pct: 0.25  },
    { label: 'CSLL',   pct: 0.15  },
    { label: 'COFINS', pct: 0.1282},
    { label: 'PIS',    pct: 0.0278},
    { label: 'CPP',    pct: 0.434 },
    { label: 'ISS',    pct: 0.01  },
  ];

  // Pro-labore scenarios
  // INSS table 2026 (approximate)
  const calcINSS = (sal) => {
    if (sal <= 1412)  return sal * 0.075;
    if (sal <= 2666)  return sal * 0.09;
    if (sal <= 4000)  return sal * 0.12;
    if (sal <= 7786)  return sal * 0.14;
    return 908; // teto
  };
  const calcIR = (base) => {
    if (base <= 2259) return 0;
    if (base <= 2826) return (base - 2259) * 0.075;
    if (base <= 3751) return (base - 2259) * 0.075 + (base - 2826) * 0.075;
    const r3 = (2826-2259)*0.075 + (3751-2826)*0.15 + (base-3751)*0.225;
    if (base <= 4664) return r3;
    return (2826-2259)*0.075 + (3751-2826)*0.15 + (4664-3751)*0.225 + (base-4664)*0.275;
  };

  const proLaboreScenarios = [1412, 5000, 15000].map(pl => {
    const inss = Math.round(calcINSS(pl));
    const base = pl - inss;
    const ir   = Math.round(calcIR(base));
    const net  = pl - inss - ir;
    const div  = 34000 - pl;
    const netTotal = net + div;
    const taxes    = inss + ir;
    return { pl, inss, ir, net, div, netTotal, taxes };
  });

  const savings = proLaboreScenarios[0].netTotal - proLaboreScenarios[proLaboreScenarios.length - 1].netTotal;
  const [showFaixas, setShowFaixas] = React.useState(false);

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: '#F7F8FA', fontFamily: 'DM Sans, system-ui' }}>
      <div style={{ padding: '68px 18px 100px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={onBack} style={{ width: 36, height: 36, borderRadius: '50%', background: '#fff', border: '1.5px solid #ECEEF4', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 4px rgba(26,31,54,0.08)', flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="#1A1F36" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <div>
            <div style={{ fontSize: 19, fontWeight: 700, color: '#1A1F36' }}>Análise Tributária PJ</div>
            <div style={{ fontSize: 11, color: '#8B90A0', marginTop: 1 }}>Simples Nacional · Anexo III · Tecnologia</div>
          </div>
        </div>

        {/* Faturamento hero */}
        <div style={{ background: 'linear-gradient(145deg, #1A1F36, #253056)', borderRadius: 22, padding: '18px 20px', boxShadow: '0 6px 24px rgba(26,31,54,0.22)' }}>
          <div style={{ fontSize: 11, color: '#94A3CC', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 6 }}>Faturamento projetado 12 meses</div>
          <div style={{ fontSize: 30, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px', marginBottom: 14 }}>{fmt(annualRev)}</div>
          <div style={{ display: 'flex' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 9, color: '#94A3CC', textTransform: 'uppercase' }}>Média mensal</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#86EFAC', marginTop: 2 }}>{fmt(monthlyAvg)}/mês</div>
            </div>
            <div style={{ width: 1, background: 'rgba(255,255,255,0.12)', margin: '0 14px' }}/>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 9, color: '#94A3CC', textTransform: 'uppercase' }}>Faixa Simples</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#FDE68A', marginTop: 2 }}>{faixa.label} ({(faixa.aliq*100).toFixed(0)}% nominal)</div>
            </div>
            <div style={{ width: 1, background: 'rgba(255,255,255,0.12)', margin: '0 14px' }}/>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 9, color: '#94A3CC', textTransform: 'uppercase' }}>Alíquota efetiva</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#FECACA', marginTop: 2 }}>{(efectiveRate*100).toFixed(1)}%</div>
            </div>
          </div>
        </div>

        {/* DAS mensal */}
        <Card style={{ padding: '16px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1A1F36' }}>DAS mensal estimado</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#DC2626' }}>{fmt(monthlyDAS)}</div>
          </div>
          {breakdown.map(b => {
            const val = Math.round(monthlyDAS * b.pct / breakdown.reduce((s,x) => s+x.pct, 0));
            const barW = Math.round(b.pct / breakdown.reduce((s,x)=>s+x.pct,0) * 100);
            return (
              <div key={b.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ width: 44, fontSize: 11, fontWeight: 700, color: '#1A1F36' }}>{b.label}</span>
                <div style={{ flex: 1, height: 5, background: '#F0F1F5', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${barW}%`, height: '100%', background: '#EF4444', borderRadius: 3 }}/>
                </div>
                <span style={{ width: 60, fontSize: 11, color: '#8B90A0', textAlign: 'right' }}>{fmt(val)}</span>
              </div>
            );
          })}
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #F0F1F5', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, color: '#8B90A0' }}>Anual (estimado)</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#1A1F36' }}>{fmt(annualDAS)}</span>
          </div>
          <button onClick={() => setShowFaixas(f => !f)} style={{ marginTop: 8, fontSize: 11, color: '#2563EB', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'DM Sans, system-ui' }}>
            {showFaixas ? 'Ocultar' : 'Ver'} tabela de faixas Simples Nacional
          </button>
          {showFaixas && (
            <div style={{ marginTop: 8, background: '#F7F8FA', borderRadius: 10, padding: '10px 12px' }}>
              {faixas.map((f, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 11 }}>
                  <span style={{ color: f.label === faixa.label ? '#2563EB' : '#8B90A0', fontWeight: f.label === faixa.label ? 700 : 400 }}>
                    {f.label} – até {fmt(f.max, {short:true})}
                  </span>
                  <span style={{ color: f.label === faixa.label ? '#2563EB' : '#8B90A0', fontWeight: f.label === faixa.label ? 700 : 400 }}>
                    {(f.aliq*100).toFixed(1)}%
                  </span>
                </div>
              ))}
              <div style={{ marginTop: 4, fontSize: 10, color: '#8B90A0' }}>* Alíquota nominal. Alíquota efetiva é menor após dedução.</div>
            </div>
          )}
        </Card>

        {/* Recomendação */}
        <Card style={{ padding: '14px 18px', background: '#F0FDF4', border: '1.5px solid #86EFAC' }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#16A34A', marginBottom: 6 }}>Recomendação: Pro-labore mínimo</div>
          <div style={{ fontSize: 12, color: '#1A1F36', lineHeight: 1.6 }}>
            No Simples Nacional Anexo III, <strong>dividendos são isentos de IR</strong>. O pro-labore gera INSS + IRPF.
            Configure o pro-labore no mínimo legal (1 salário mínimo) e distribua o restante como dividendo.
          </div>
          <div style={{ marginTop: 10, background: '#DCFCE7', borderRadius: 8, padding: '8px 12px', fontSize: 12, fontWeight: 700, color: '#16A34A' }}>
            Economia potencial: {fmt(savings)}/mês ({fmt(savings * 12)}/ano)
          </div>
        </Card>

        {/* Pro-labore comparison table */}
        <div style={{ fontSize: 12, fontWeight: 600, color: '#8B90A0', letterSpacing: '0.05em', textTransform: 'uppercase', paddingLeft: 2 }}>
          Comparativo de pro-labore
        </div>
        <Card style={{ padding: '8px 6px' }}>
          {/* Header row */}
          <div style={{ display: 'flex', padding: '6px 14px', borderBottom: '1px solid #F0F1F5' }}>
            <span style={{ flex: 1, fontSize: 10, color: '#8B90A0', fontWeight: 600 }}>Cenário</span>
            <span style={{ width: 68, fontSize: 10, color: '#8B90A0', textAlign: 'right', fontWeight: 600 }}>INSS+IR</span>
            <span style={{ width: 72, fontSize: 10, color: '#8B90A0', textAlign: 'right', fontWeight: 600 }}>Líquido</span>
          </div>
          {proLaboreScenarios.map((s, i) => {
            const labels = ['1 SM (R$1.412)', 'Moderado (R$5.000)', 'Alto (R$15.000)'];
            const isRecommended = i === 0;
            return (
              <div key={i}>
                {i > 0 && <div style={{ height: 1, background: '#F4F5F8', margin: '0 12px' }}/>}
                <div style={{ padding: '12px 14px', background: isRecommended ? '#F0FDF4' : 'transparent', borderRadius: isRecommended ? 10 : 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#1A1F36' }}>
                        {labels[i]}
                        {isRecommended && <span style={{ fontSize: 9, fontWeight: 700, color: '#16A34A', background: '#DCFCE7', padding: '1px 6px', borderRadius: 4, marginLeft: 6 }}>IDEAL</span>}
                      </div>
                      <div style={{ fontSize: 10, color: '#8B90A0', marginTop: 1 }}>
                        Pro-labore {fmt(s.pl)} + Dividendo {fmt(s.div)}
                      </div>
                    </div>
                    <div style={{ width: 68, textAlign: 'right', fontSize: 12, fontWeight: 700, color: '#DC2626' }}>-{fmt(s.taxes)}</div>
                    <div style={{ width: 72, textAlign: 'right', fontSize: 14, fontWeight: 800, color: isRecommended ? '#16A34A' : '#1A1F36' }}>{fmt(s.netTotal)}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    {[['INSS',fmt(s.inss)],['IR',fmt(s.ir)],['Net pro-lab.',fmt(s.net)],['Dividendo',fmt(s.div)]].map(([l,v]) => (
                      <div key={l}>
                        <div style={{ fontSize: 8, color: '#8B90A0' }}>{l}</div>
                        <div style={{ fontSize: 10, fontWeight: 600, color: '#1A1F36' }}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </Card>

        <div style={{ background: '#FFFBEB', borderRadius: 12, padding: '10px 14px', border: '1px solid #FDE68A' }}>
          <div style={{ fontSize: 11, color: '#D97706', fontWeight: 600, marginBottom: 3 }}>Atenção</div>
          <div style={{ fontSize: 11, color: '#8B90A0', lineHeight: 1.5 }}>
            Esta análise é uma estimativa baseada em Simples Nacional Anexo III.
            Consulte seu contador para validar os valores exatos e verificar se há alterações legislativas.
            A isenção de IR sobre dividendos pode mudar com reformas tributárias.
          </div>
        </div>

      </div>
    </div>
  );
}

Object.assign(window, { OrcadoVsRealizado, IndependenciaScreen, TributarioScreen });
