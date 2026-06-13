// screens-extra.jsx — Comparativo de Meses · Calculadora de Rentabilidade

/* ── Comparativo de Meses ───────────────────────────── */
function ComparativoMesesScreen({ onBack }) {
  const MB = AppData.monthlyBudget;
  const [idxA, setIdxA] = React.useState(0);
  const [idxB, setIdxB] = React.useState(1);

  const metrics = (r) => ({
    label:    r.m,
    income:   r.pjInc + (r.pfInc - r.repasse),
    expense:  (r.pjInc - r.pjSaldo) + (r.pfInc - r.repasse - r.pfSaldo),
    saldo:    r.pjSaldo + r.pfSaldo,
    aplicacao:r.aplicPJ + r.aplicPF,
    repasse:  r.repasse,
    cdb:      r.cdb,
  });

  const ma = metrics(MB[idxA]);
  const mb = metrics(MB[idxB]);

  const rows = [
    { key: 'income',    label: 'Receita',       good: true  },
    { key: 'expense',   label: 'Despesa',       good: false },
    { key: 'saldo',     label: 'Saldo',         good: true  },
    { key: 'aplicacao', label: 'Aplic. CDB',    good: true  },
    { key: 'repasse',   label: 'Repasse PJ→PF', good: true  },
    { key: 'cdb',       label: 'CDB acumulado', good: true  },
  ];

  const BackBtn = () => (
    <button onClick={onBack} style={{ width: 36, height: 36, borderRadius: '50%', background: '#fff', border: '1.5px solid #ECEEF4', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 4px rgba(26,31,54,0.08)', flexShrink: 0 }}>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="#1A1F36" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
    </button>
  );

  const MonthSel = ({ idx, setIdx }) => (
    <select value={idx} onChange={e => setIdx(Number(e.target.value))} style={{ flex: 1, padding: '9px 10px', borderRadius: 12, border: '1.5px solid #ECEEF4', fontSize: 13, fontWeight: 700, color: '#1A1F36', background: '#fff', fontFamily: 'DM Sans, system-ui', cursor: 'pointer', outline: 'none' }}>
      {MB.map((r, i) => <option key={i} value={i}>{r.m}</option>)}
    </select>
  );

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: '#F7F8FA', fontFamily: 'DM Sans, system-ui' }}>
      <div style={{ padding: '68px 18px 100px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <BackBtn/>
          <div>
            <div style={{ fontSize: 19, fontWeight: 700, color: '#1A1F36' }}>Comparativo de Meses</div>
            <div style={{ fontSize: 11, color: '#8B90A0', marginTop: 1 }}>Selecione dois meses para comparar</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <MonthSel idx={idxA} setIdx={setIdxA}/>
          <span style={{ fontSize: 14, color: '#8B90A0', fontWeight: 700, flexShrink: 0 }}>vs.</span>
          <MonthSel idx={idxB} setIdx={setIdxB}/>
        </div>

        {/* Hero summary */}
        <div style={{ display: 'flex', gap: 10 }}>
          {[ma, mb].map((m, i) => (
            <div key={i} style={{ flex: 1, background: 'linear-gradient(135deg,#1A1F36,#253056)', borderRadius: 16, padding: '14px 16px', boxShadow: '0 4px 16px rgba(26,31,54,0.18)' }}>
              <div style={{ fontSize: 9, color: '#94A3CC', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 3 }}>{m.label}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px', marginBottom: 10 }}>{fmt(m.saldo, {short:true})}</div>
              <div style={{ fontSize: 8, color: '#94A3CC', textTransform: 'uppercase' }}>Receita</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#86EFAC' }}>{fmt(m.income, {short:true})}</div>
              <div style={{ fontSize: 8, color: '#94A3CC', textTransform: 'uppercase', marginTop: 4 }}>Despesa</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#FCA5A5' }}>{fmt(m.expense, {short:true})}</div>
            </div>
          ))}
        </div>

        {/* Comparison rows */}
        <Card style={{ padding: '4px 6px' }}>
          {rows.map((row, ri) => {
            const va = ma[row.key] || 0;
            const vb = mb[row.key] || 0;
            const delta = vb - va;
            const pct = va > 0 ? Math.round(Math.abs(delta) / va * 100) : 0;
            const positive = row.good ? delta >= 0 : delta <= 0;
            return (
              <div key={row.key}>
                {ri > 0 && <div style={{ height: 1, background: '#F4F5F8', margin: '0 14px' }}/>}
                <div style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#1A1F36' }}>{row.label}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 6, color: positive ? '#16A34A' : '#DC2626', background: positive ? '#F0FDF4' : '#FEF2F2' }}>
                      {delta >= 0 ? '+' : ''}{pct}% {delta >= 0 ? '▲' : '▼'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {[{lbl: ma.label, val: va, isDelta: false}, {lbl: mb.label, val: vb, isDelta: false}, {lbl: 'Delta', val: delta, isDelta: true}].map(({lbl, val, isDelta}) => (
                      <div key={lbl} style={{ flex: 1, background: isDelta ? (positive ? '#F0FDF4' : '#FEF2F2') : '#F7F8FA', borderRadius: 8, padding: '6px 8px' }}>
                        <div style={{ fontSize: 8, color: '#8B90A0', marginBottom: 2 }}>{lbl}</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: isDelta ? (positive ? '#16A34A' : '#DC2626') : '#1A1F36' }}>
                          {isDelta && delta >= 0 ? '+' : ''}{fmt(val, {short:true})}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </Card>

      </div>
    </div>
  );
}

/* ── Calculadora de Rentabilidade ───────────────────── */
function CalculadoraRentabilidadeScreen({ onBack }) {
  const [principal, setPrincipal] = React.useState(100000);
  const [aporte,    setAporte]    = React.useState(5000);
  const [meses,     setMeses]     = React.useState(24);
  const [benchKey,  setBenchKey]  = React.useState('cdi');
  const [customRate,setCustomRate]= React.useState('12.0');

  const benchmarks = {
    cdi:      { label: 'CDI 100%',    rate: 12.65 },
    selic:    { label: 'SELIC',        rate: 10.75 },
    ipca5:    { label: 'IPCA+5%',     rate: 11.5  },
    lci:      { label: 'LCI 90%CDI',  rate: 11.39 },
    poupanca: { label: 'Poupança',     rate: 6.17  },
    custom:   { label: 'Custom',       rate: parseFloat(customRate) || 12 },
  };

  const bench    = benchmarks[benchKey];
  const rAnual   = bench.rate;
  const r        = Math.pow(1 + rAnual / 100, 1 / 12) - 1;
  const fv       = Math.round(principal * Math.pow(1+r, meses) + (r > 0 ? aporte * (Math.pow(1+r, meses) - 1) / r : aporte * meses));
  const invested  = principal + aporte * meses;
  const gross    = fv - invested;
  const irRate   = meses <= 6 ? 0.225 : meses <= 12 ? 0.20 : meses <= 24 ? 0.175 : 0.15;
  const ir       = Math.round(gross * irRate);
  const netFV    = fv - ir;
  const netGain  = netFV - invested;
  const netPct   = invested > 0 ? ((netFV / invested - 1) * 100).toFixed(1) : '0.0';

  const step = Math.max(1, Math.floor(meses / 6));
  const chartData = Array.from({ length: Math.floor(meses / step) + 1 }, (_, i) => {
    const m = Math.min(i * step, meses);
    const b = principal * Math.pow(1+r, m) + (r > 0 ? aporte * (Math.pow(1+r, m) - 1) / r : aporte * m);
    return { label: m + 'm', value: Math.round(b) };
  });

  const numField = (label, val, setVal) => (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 11, color: '#8B90A0', marginBottom: 5, fontWeight: 600 }}>{label}</div>
      <input
        value={val === 0 ? '' : val.toLocaleString('pt-BR')}
        onChange={e => setVal(Number(e.target.value.replace(/\D/g,'')) || 0)}
        style={{ width: '100%', padding: '11px 14px', borderRadius: 12, border: '1.5px solid #ECEEF4', fontSize: 16, fontWeight: 700, color: '#1A1F36', background: '#F7F8FA', outline: 'none', fontFamily: 'DM Sans, system-ui', boxSizing: 'border-box' }}
        inputMode="numeric"
      />
    </div>
  );

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: '#F7F8FA', fontFamily: 'DM Sans, system-ui' }}>
      <div style={{ padding: '68px 18px 100px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={onBack} style={{ width: 36, height: 36, borderRadius: '50%', background: '#fff', border: '1.5px solid #ECEEF4', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 4px rgba(26,31,54,0.08)', flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="#1A1F36" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <div>
            <div style={{ fontSize: 19, fontWeight: 700, color: '#1A1F36' }}>Calculadora de Rentabilidade</div>
            <div style={{ fontSize: 11, color: '#8B90A0', marginTop: 1 }}>Simule qualquer investimento com IR</div>
          </div>
        </div>

        {/* Benchmark selector */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {Object.entries(benchmarks).map(([k, b]) => (
            <button key={k} onClick={() => setBenchKey(k)} style={{ padding: '5px 10px', borderRadius: 20, border: 'none', cursor: 'pointer', background: benchKey === k ? '#1A1F36' : '#fff', color: benchKey === k ? '#fff' : '#8B90A0', fontSize: 11, fontWeight: 600, fontFamily: 'DM Sans, system-ui', boxShadow: benchKey === k ? '0 2px 8px rgba(26,31,54,0.2)' : 'none' }}>
              {b.label}{k !== 'custom' ? ' ' + b.rate + '%' : ''}
            </button>
          ))}
        </div>
        {benchKey === 'custom' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input value={customRate} onChange={e => setCustomRate(e.target.value.replace(/[^\d.]/g,''))} placeholder="Ex: 14.5" inputMode="decimal"
              style={{ flex: 1, padding: '10px 14px', borderRadius: 12, border: '1.5px solid #2563EB', fontSize: 16, fontWeight: 700, color: '#2563EB', background: '#EFF6FF', outline: 'none', fontFamily: 'DM Sans, system-ui', boxSizing: 'border-box' }}/>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#8B90A0' }}>% a.a.</span>
          </div>
        )}

        {/* Inputs */}
        <Card style={{ padding: '14px 16px' }}>
          {numField('Valor inicial (R$)', principal, setPrincipal)}
          {numField('Aporte mensal (R$)', aporte, setAporte)}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 11, color: '#8B90A0', fontWeight: 600 }}>Prazo</span>
              <span style={{ fontSize: 14, fontWeight: 800, color: '#2563EB' }}>
                {meses >= 12 ? (meses / 12).toFixed(1).replace('.0','') + ' anos' : meses + ' meses'}
              </span>
            </div>
            <input type="range" min="3" max="120" step="3" value={meses} onChange={e => setMeses(Number(e.target.value))} style={{ width: '100%', accentColor: '#2563EB' }}/>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#C4C7D4', marginTop: 3 }}>
              <span>3m</span><span>1a</span><span>2a</span><span>5a</span><span>10a</span>
            </div>
          </div>
        </Card>

        {/* Result hero */}
        <div style={{ background: 'linear-gradient(145deg,#1A1F36,#253056)', borderRadius: 22, padding: '20px 20px 18px', boxShadow: '0 6px 24px rgba(26,31,54,0.22)' }}>
          <div style={{ fontSize: 11, color: '#94A3CC', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
            Montante líquido · {bench.label} · {rAnual}% a.a.
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px', marginBottom: 14 }}>{fmt(netFV)}</div>
          <div style={{ display: 'flex' }}>
            {[['Investido', fmt(invested,{short:true}), '#94A3CC'], ['Rendimento líq.', '+'+fmt(netGain,{short:true}), '#86EFAC'], ['Retorno', '+'+netPct+'%', '#86EFAC']].map(([l, v, c], i) => (
              <React.Fragment key={l}>
                {i > 0 && <div style={{ width: 1, background: 'rgba(255,255,255,0.12)', margin: '0 10px' }}/>}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 9, color: '#94A3CC', textTransform: 'uppercase' }}>{l}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: c, marginTop: 2 }}>{v}</div>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Chart */}
        <Card style={{ padding: '16px 14px 10px' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#1A1F36', marginBottom: 10 }}>Evolução do montante</div>
          <AreaChart data={chartData} width={326} height={110} color="#2563EB"/>
        </Card>

        {/* Tax detail */}
        <Card style={{ padding: '14px 16px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1A1F36', marginBottom: 10 }}>Detalhamento</div>
          {[
            ['Montante bruto',   fmt(fv),                    '#1A1F36'],
            ['IR sobre ganhos',  '-' + fmt(ir),               '#DC2626'],
            ['Alíquota IR',      (irRate*100).toFixed(1)+'%', '#8B90A0'],
            ['Rendimento bruto', '+' + fmt(gross,{short:true}),'#F59E0B'],
            ['Rendimento líq.',  '+' + fmt(netGain,{short:true}),'#16A34A'],
          ].map(([l, v, c]) => (
            <div key={l} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: '#8B90A0' }}>{l}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: c }}>{v}</span>
            </div>
          ))}
          <div style={{ fontSize: 10, color: '#C4C7D4', marginTop: 6 }}>
            IR regressivo: 22,5% (até 6m) → 20% (até 12m) → 17,5% (até 24m) → 15% (acima 24m)
          </div>
        </Card>

      </div>
    </div>
  );
}

Object.assign(window, { ComparativoMesesScreen, CalculadoraRentabilidadeScreen });
