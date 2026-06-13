import React from 'react';
import { AppData, fmt } from '../data.js';
import { AreaChart, DonutChart } from '../components/charts.jsx';
import { Card } from './screens-a.jsx';
// screens-tools.jsx — Simulador E-Se · Relatório · PGBL · Score

/* ─────────────────────────────────────────────────────
   SIMULADOR "E SE?"
   ───────────────────────────────────────────────────── */
function SimuladorESeScreen({ onBack }) {
  const d            = AppData;
  const patrimonio   = d.netWorth;        // R$ 1.250.000
  const sobraAtual   = d.monthResult;     // R$ 46.448/mês
  const meta         = 3000000;
  const taxaAnual    = 12.68;             // CDB 1%/mês
  const r            = Math.pow(1 + taxaAnual / 100, 1 / 12) - 1;
  const [extra, setExtra] = React.useState(0);
  const [horizonte, setHorizonte] = React.useState(120);

  const calcMeses = (sobra) => {
    let bal = patrimonio, n = 0;
    while (bal < meta && n < 600) { bal = bal * (1 + r) + sobra; n++; }
    return n;
  };

  const mesesBase   = calcMeses(sobraAtual);
  const mesesNovo   = calcMeses(sobraAtual + extra);
  const mesesSaved  = mesesBase - mesesNovo;
  const dataBase    = (() => { const d = new Date(2026, 5); d.setMonth(d.getMonth() + mesesBase); return d; })();
  const dataNova    = (() => { const d = new Date(2026, 5); d.setMonth(d.getMonth() + mesesNovo); return d; })();
  const fmtData     = (d) => d.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });

  // Wealth trajectory for two scenarios
  const buildCurve = (sobra) => {
    const step = Math.max(1, Math.floor(horizonte / 12));
    let bal = patrimonio;
    return Array.from({ length: Math.floor(horizonte / step) + 1 }, (_, i) => {
      const m = Math.min(i * step, horizonte);
      if (i > 0) { for (let j = 0; j < step; j++) bal = bal * (1 + r) + sobra; }
      return { label: m + 'm', value: Math.round(Math.min(bal, meta * 1.1)) };
    });
  };

  const curveBase  = buildCurve(sobraAtual);
  const curveExtra = extra > 0 ? buildCurve(sobraAtual + extra) : null;

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: '#F7F8FA', fontFamily: 'DM Sans, system-ui' }}>
      <div style={{ padding: '68px 18px 100px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={onBack} style={{ width: 36, height: 36, borderRadius: '50%', background: '#fff', border: '1.5px solid #ECEEF4', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 4px rgba(26,31,54,0.08)', flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="#1A1F36" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <div>
            <div style={{ fontSize: 19, fontWeight: 700, color: '#1A1F36' }}>Simulador "E se?"</div>
            <div style={{ fontSize: 11, color: '#8B90A0', marginTop: 1 }}>Impacto de aportes extras na independência</div>
          </div>
        </div>

        {/* Base scenario card */}
        <div style={{ background: 'linear-gradient(145deg,#1A1F36,#253056)', borderRadius: 22, padding: '18px 20px', boxShadow: '0 6px 24px rgba(26,31,54,0.22)' }}>
          <div style={{ fontSize: 10, color: '#94A3CC', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Cenário atual</div>
          <div style={{ display: 'flex', gap: 0 }}>
            {[
              ['Patrimônio',    fmt(patrimonio, {short:true}), '#fff'    ],
              ['Sobra/mês',     fmt(sobraAtual, {short:true}), '#86EFAC'],
              ['Previsão',      fmtData(dataBase),             '#86EFAC'],
              ['Meses p/ meta', String(mesesBase),             '#93C5FD'],
            ].map(([l, v, c], i) => (
              <React.Fragment key={l}>
                {i > 0 && <div style={{ width: 1, background: 'rgba(255,255,255,0.12)', margin: '0 10px' }}/>}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 8, color: '#94A3CC', textTransform: 'uppercase', marginBottom: 2 }}>{l}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: c }}>{v}</div>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Extra aporte slider */}
        <Card style={{ padding: '16px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1A1F36' }}>Aporte extra mensal</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#2563EB' }}>{fmt(extra, {short:true})}</div>
          </div>
          <input type="range" min="0" max="30000" step="500" value={extra}
            onChange={e => setExtra(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#2563EB', marginBottom: 8 }}/>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#C4C7D4', marginBottom: 12 }}>
            <span>R$ 0</span><span>R$ 5k</span><span>R$ 10k</span><span>R$ 20k</span><span>R$ 30k</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 12, color: '#8B90A0' }}>Novo total mensal</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#1A1F36' }}>{fmt(sobraAtual + extra, {short:true})}/mês</span>
          </div>
        </Card>

        {/* Impact card */}
        {extra > 0 && (
          <div style={{ background: '#F0FDF4', borderRadius: 18, padding: '16px 18px', border: '1.5px solid #86EFAC' }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#16A34A', marginBottom: 12 }}>
              Impacto do aporte extra
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
              {[
                { label: 'Nova previsão',     value: fmtData(dataNova),                   big: true,  color: '#16A34A' },
                { label: 'Antecipação',       value: `${mesesSaved} meses`,               big: true,  color: '#2563EB' },
                { label: 'Custo extra/ano',   value: fmt(extra * 12, {short:true}),        big: false, color: '#1A1F36' },
                { label: 'vs. meta original', value: fmtData(dataBase),                   big: false, color: '#8B90A0' },
              ].map(s => (
                <div key={s.label} style={{ background: '#fff', borderRadius: 12, padding: '10px 12px' }}>
                  <div style={{ fontSize: 10, color: '#8B90A0', marginBottom: 3 }}>{s.label}</div>
                  <div style={{ fontSize: s.big ? 16 : 13, fontWeight: 800, color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 11, color: '#16A34A', textAlign: 'center', fontWeight: 600 }}>
              Cada R$ {(extra/1000).toFixed(0)}k extra adianta sua independência em {mesesSaved} meses
            </div>
          </div>
        )}

        {/* Chart — trajectory */}
        <Card style={{ padding: '16px 14px 10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1A1F36' }}>Trajetória patrimonial</div>
            <div style={{ display: 'flex', gap: 8, fontSize: 10 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: '#2563EB' }}><span style={{ width: 10, height: 2, background: '#2563EB', display: 'inline-block', borderRadius: 1 }}/>Atual</span>
              {extra > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: '#16A34A' }}><span style={{ width: 10, height: 2, background: '#16A34A', display: 'inline-block', borderRadius: 1 }}/>+{fmt(extra,{short:true})}</span>}
            </div>
          </div>
          <div style={{ fontSize: 10, color: '#8B90A0', marginBottom: 8 }}>
            Horizonte:
            <select value={horizonte} onChange={e => setHorizonte(Number(e.target.value))}
              style={{ marginLeft: 6, padding: '2px 6px', borderRadius: 6, border: '1px solid #ECEEF4', fontSize: 10, fontFamily: 'DM Sans, system-ui', color: '#1A1F36', background: '#fff', cursor: 'pointer', outline: 'none' }}>
              {[24,36,48,60,84,120].map(m => <option key={m} value={m}>{m >= 12 ? m/12 + ' anos' : m + 'm'}</option>)}
            </select>
          </div>
          <AreaChart data={curveBase} width={326} height={120} color="#2563EB" goalValue={meta} goalLabel="R$3M"/>
          {curveExtra && <AreaChart data={curveExtra} width={326} height={120} color="#16A34A" goalValue={meta} goalLabel=""/>}
        </Card>

      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   RELATÓRIO MENSAL
   ───────────────────────────────────────────────────── */
function RelatorioMensalScreen({ onBack, transactions }) {
  const MB = AppData.monthlyBudget;
  const [monthIdx, setMonthIdx] = React.useState(0);

  const M_LABELS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  const monthRaw  = MB[monthIdx]?.m || 'Jun/26';
  const monthName = monthRaw.slice(0,3);
  const yearShort = monthRaw.slice(4,6);
  const monthNum  = M_LABELS.indexOf(monthName) + 1;
  const monthKey  = `20${yearShort}-${String(monthNum).padStart(2,'0')}`;
  const r         = MB[monthIdx];

  const monthTx   = (transactions || AppData.transactions).filter(tx => tx.date.startsWith(monthKey));
  const confirmed = monthTx.filter(tx => tx.done);
  const actInc    = confirmed.filter(t => t.type === 'income').reduce((s,t) => s+t.value, 0);
  const actExp    = confirmed.filter(t => t.type === 'expense').reduce((s,t) => s+t.value, 0);

  const planInc   = r.pjInc + r.pfInc;
  const planExp   = planInc - (r.pjSaldo + r.pfSaldo);
  const planSaldo = r.pjSaldo + r.pfSaldo;

  const cats = {};
  AppData.monthlyEvents.filter(e => e.type === 'expense').forEach(e => { cats[e.cat] = (cats[e.cat]||0) + e.value; });
  const catList = Object.entries(cats).sort((a,b) => b[1]-a[1]);

  const kpis = [
    { label: 'Receita Planejada',   value: planInc,          color: '#16A34A', bg: '#F0FDF4' },
    { label: 'Despesa Planejada',   value: planExp,          color: '#DC2626', bg: '#FEF2F2' },
    { label: 'Saldo Projetado',     value: planSaldo,        color: '#2563EB', bg: '#EFF6FF' },
    { label: 'Repasse PJ→PF',       value: r.repasse,        color: '#7C3AED', bg: '#F5F3FF' },
    { label: 'Aplic. CDB PJ',       value: r.aplicPJ,        color: '#7C3AED', bg: '#F5F3FF' },
    { label: 'Aplic. CDB PF',       value: r.aplicPF,        color: '#7C3AED', bg: '#F5F3FF' },
    { label: 'CDB Acumulado',       value: r.cdb,            color: '#7C3AED', bg: '#F5F3FF' },
    { label: 'Rendimento CDB',      value: r.cdbRet,         color: '#16A34A', bg: '#F0FDF4' },
  ];

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: '#F7F8FA', fontFamily: 'DM Sans, system-ui' }}>
      <div style={{ padding: '68px 18px 100px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={onBack} style={{ width: 36, height: 36, borderRadius: '50%', background: '#fff', border: '1.5px solid #ECEEF4', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 4px rgba(26,31,54,0.08)', flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="#1A1F36" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 19, fontWeight: 700, color: '#1A1F36' }}>Relatório Mensal</div>
            <div style={{ fontSize: 11, color: '#8B90A0', marginTop: 1 }}>Resumo completo do mês</div>
          </div>
          <select value={monthIdx} onChange={e => setMonthIdx(Number(e.target.value))}
            style={{ padding: '8px 10px', borderRadius: 10, border: '1.5px solid #ECEEF4', fontSize: 12, fontWeight: 700, color: '#1A1F36', background: '#fff', fontFamily: 'DM Sans, system-ui', cursor: 'pointer', outline: 'none' }}>
            {MB.map((m, i) => <option key={i} value={i}>{m.m}</option>)}
          </select>
        </div>

        {/* Hero */}
        <div style={{ background: 'linear-gradient(145deg,#1A1F36,#253056)', borderRadius: 22, padding: '18px 20px', boxShadow: '0 6px 24px rgba(26,31,54,0.22)' }}>
          <div style={{ fontSize: 10, color: '#94A3CC', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>{monthRaw} — Projeção</div>
          <div style={{ display: 'flex' }}>
            {[['Receita', planInc, '#86EFAC'], ['Despesa', planExp, '#FCA5A5'], ['Saldo', planSaldo, '#93C5FD']].map(([l,v,c], i) => (
              <React.Fragment key={l}>
                {i > 0 && <div style={{ width: 1, background: 'rgba(255,255,255,0.12)', margin: '0 12px' }}/>}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 9, color: '#94A3CC', textTransform: 'uppercase', marginBottom: 2 }}>{l}</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: c }}>{fmt(v, {short:true})}</div>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* KPIs grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {kpis.map((k, i) => (
            <div key={i} style={{ background: k.bg, borderRadius: 12, padding: '10px 12px' }}>
              <div style={{ fontSize: 9, color: '#8B90A0', marginBottom: 2, lineHeight: 1.3 }}>{k.label}</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: k.color }}>{fmt(k.value, {short:true})}</div>
            </div>
          ))}
        </div>

        {/* Category breakdown */}
        <div style={{ fontSize: 12, fontWeight: 600, color: '#8B90A0', letterSpacing: '0.05em', textTransform: 'uppercase', paddingLeft: 2 }}>Despesas por categoria</div>
        <Card style={{ padding: '4px 6px' }}>
          {catList.map(([cat, val], i) => {
            const pct = Math.round(val / planExp * 100);
            return (
              <div key={cat}>
                {i > 0 && <div style={{ height: 1, background: '#F4F5F8', margin: '0 14px' }}/>}
                <div style={{ padding: '9px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ flex: 1, fontSize: 12, fontWeight: 600, color: '#1A1F36' }}>{cat}</div>
                  <div style={{ width: 60, height: 4, background: '#F0F1F5', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(100,pct)}%`, height: '100%', background: '#EF4444', borderRadius: 2 }}/>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#DC2626', minWidth: 64, textAlign: 'right' }}>{fmt(val, {short:true})}</div>
                  <div style={{ fontSize: 10, color: '#8B90A0', minWidth: 28, textAlign: 'right' }}>{pct}%</div>
                </div>
              </div>
            );
          })}
        </Card>

        {/* Confirmed this month */}
        {confirmed.length > 0 && (
          <>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#8B90A0', letterSpacing: '0.05em', textTransform: 'uppercase', paddingLeft: 2 }}>Confirmados no mês</div>
            <Card style={{ padding: '4px 6px' }}>
              {confirmed.slice(0,8).map((tx, i) => {
                const isInc = tx.type === 'income';
                return (
                  <div key={tx.id || i}>
                    {i > 0 && <div style={{ height: 1, background: '#F4F5F8', margin: '0 14px' }}/>}
                    <div style={{ padding: '9px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: isInc ? '#F0FDF4' : '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: isInc ? '#16A34A' : '#DC2626', fontWeight: 700, flexShrink: 0 }}>{isInc ? '↑' : '↓'}</div>
                      <div style={{ flex: 1, fontSize: 12, color: '#1A1F36', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.desc}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: isInc ? '#16A34A' : '#DC2626', flexShrink: 0 }}>{isInc ? '+' : '-'}{fmt(tx.value, {short:true})}</div>
                    </div>
                  </div>
                );
              })}
            </Card>
          </>
        )}

        <div style={{ background: '#EFF6FF', borderRadius: 12, padding: '10px 14px', border: '1px solid #DBEAFE', fontSize: 11, color: '#2563EB', textAlign: 'center', fontWeight: 600 }}>
          Tire um screenshot para exportar este relatório
        </div>

      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   CALCULADORA PGBL vs CDB
   ───────────────────────────────────────────────────── */
function PGBLScreen({ onBack }) {
  const [rendaMensal, setRendaMensal] = React.useState(15000);
  const [aporte,      setAporte]      = React.useState(1500);
  const [anos,        setAnos]        = React.useState(20);
  const [aliqIR,      setAliqIR]      = React.useState(27.5);
  const [tabela,      setTabela]      = React.useState('progressiva');

  const rendaAnual    = rendaMensal * 12;
  const aporteAnual   = aporte * 12;
  const maxDeducao    = rendaAnual * 0.12;
  const aporteEfetivo = Math.min(aporteAnual, maxDeducao);
  const economiaIR    = Math.round(aporteEfetivo * aliqIR / 100);
  const taxaPGBL      = 12.68;
  const taxaCDB       = 12.68;
  const meses         = anos * 12;
  const rPGBL         = Math.pow(1 + taxaPGBL / 100, 1 / 12) - 1;
  const rCDB          = Math.pow(1 + taxaCDB  / 100, 1 / 12) - 1;

  // PGBL: aporte + economia IR reinvestida, IR na saída (tabela regressiva: 10% após 10a)
  const aporteComEconomia = Math.round((aporteAnual + economiaIR) / 12);
  const pgblBruto  = Math.round(aporteComEconomia * (Math.pow(1 + rPGBL, meses) - 1) / rPGBL);
  const irPGBL     = tabela === 'regressiva' ? Math.round(pgblBruto * 0.10) : Math.round(pgblBruto * aliqIR / 100);
  const pgblLiq    = pgblBruto - irPGBL;

  // CDB: mesmo aporte, IR 15% (acima 24m)
  const cdbBruto   = Math.round(aporte * (Math.pow(1 + rCDB, meses) - 1) / rCDB);
  const gainCDB    = cdbBruto - aporte * meses;
  const irCDB      = Math.round(gainCDB * 0.15);
  const cdbLiq     = cdbBruto - irCDB;

  const diff       = pgblLiq - cdbLiq;
  const vantagem   = diff > 0 ? 'PGBL' : 'CDB';

  const aliquotas  = [7.5, 15, 22.5, 27.5];

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: '#F7F8FA', fontFamily: 'DM Sans, system-ui' }}>
      <div style={{ padding: '68px 18px 100px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={onBack} style={{ width: 36, height: 36, borderRadius: '50%', background: '#fff', border: '1.5px solid #ECEEF4', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 4px rgba(26,31,54,0.08)', flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="#1A1F36" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <div>
            <div style={{ fontSize: 19, fontWeight: 700, color: '#1A1F36' }}>PGBL vs CDB</div>
            <div style={{ fontSize: 11, color: '#8B90A0', marginTop: 1 }}>Previdência privada vs renda fixa</div>
          </div>
        </div>

        {/* Inputs */}
        <Card style={{ padding: '14px 16px' }}>
          {[
            ['Renda mensal (R$)', rendaMensal, setRendaMensal],
            ['Aporte mensal (R$)', aporte, setAporte],
          ].map(([lbl, val, setVal]) => (
            <div key={lbl} style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: '#8B90A0', marginBottom: 5, fontWeight: 600 }}>{lbl}</div>
              <input value={val === 0 ? '' : val.toLocaleString('pt-BR')}
                onChange={e => setVal(Number(e.target.value.replace(/\D/g,'')) || 0)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1.5px solid #ECEEF4', fontSize: 15, fontWeight: 700, color: '#1A1F36', background: '#F7F8FA', outline: 'none', fontFamily: 'DM Sans, system-ui', boxSizing: 'border-box' }} inputMode="numeric"/>
            </div>
          ))}

          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 11, color: '#8B90A0', fontWeight: 600 }}>Prazo de acumulação</span>
              <span style={{ fontSize: 14, fontWeight: 800, color: '#2563EB' }}>{anos} anos</span>
            </div>
            <input type="range" min="5" max="35" step="1" value={anos} onChange={e => setAnos(Number(e.target.value))} style={{ width: '100%', accentColor: '#2563EB' }}/>
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: '#8B90A0', fontWeight: 600, marginBottom: 6 }}>Alíquota de IR (faixa)</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {aliquotas.map(a => (
                <button key={a} onClick={() => setAliqIR(a)} style={{ flex: 1, padding: '7px 4px', borderRadius: 10, border: `1.5px solid ${aliqIR === a ? '#2563EB' : '#ECEEF4'}`, background: aliqIR === a ? '#EFF6FF' : '#fff', color: aliqIR === a ? '#2563EB' : '#8B90A0', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans, system-ui' }}>
                  {a}%
                </button>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 11, color: '#8B90A0', fontWeight: 600, marginBottom: 6 }}>Tabela IR na retirada</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {[['progressiva','Progressiva'],['regressiva','Regressiva 10%']].map(([k, l]) => (
                <button key={k} onClick={() => setTabela(k)} style={{ flex: 1, padding: '7px 8px', borderRadius: 10, border: `1.5px solid ${tabela === k ? '#7C3AED' : '#ECEEF4'}`, background: tabela === k ? '#F5F3FF' : '#fff', color: tabela === k ? '#7C3AED' : '#8B90A0', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans, system-ui' }}>
                  {l}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Dedução fiscal */}
        <Card style={{ padding: '12px 16px', background: '#F0FDF4', border: '1.5px solid #86EFAC' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#16A34A', marginBottom: 8 }}>Benefício fiscal anual (PGBL)</div>
          {[
            ['Aporte anual',          fmt(aporteAnual)                    ],
            ['Máx. dedutível (12%)',   fmt(maxDeducao)                    ],
            ['Economia de IR/ano',     fmt(economiaIR), true              ],
            ['Aporte + economia/mês',  fmt(aporteComEconomia)             ],
          ].map(([l, v, bold]) => (
            <div key={l} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 12, color: '#8B90A0' }}>{l}</span>
              <span style={{ fontSize: bold ? 14 : 12, fontWeight: bold ? 800 : 700, color: bold ? '#16A34A' : '#1A1F36' }}>{v}</span>
            </div>
          ))}
        </Card>

        {/* Comparison result */}
        <div style={{ background: `linear-gradient(145deg, ${vantagem === 'PGBL' ? '#1a3a5c,#1e40af' : '#1a3a1a,#166534'})`, borderRadius: 22, padding: '18px 20px', boxShadow: '0 6px 24px rgba(26,31,54,0.22)' }}>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
            Vantagem: {vantagem} em {anos} anos
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px', marginBottom: 14 }}>
            +{fmt(Math.abs(diff), {short:true})} a mais
          </div>
          <div style={{ display: 'flex' }}>
            {[['PGBL líq.', fmt(pgblLiq,{short:true}), pgblLiq >= cdbLiq ? '#86EFAC' : '#FCA5A5'],
              ['CDB líq.', fmt(cdbLiq,{short:true}), cdbLiq >= pgblLiq ? '#86EFAC' : '#FCA5A5']].map(([l,v,c],i) => (
              <React.Fragment key={l}>
                {i > 0 && <div style={{ width: 1, background: 'rgba(255,255,255,0.15)', margin: '0 14px' }}/>}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase' }}>{l}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: c, marginTop: 2 }}>{v}</div>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>

        <div style={{ background: '#FFFBEB', borderRadius: 12, padding: '10px 14px', border: '1px solid #FDE68A', fontSize: 11, color: '#D97706', lineHeight: 1.5 }}>
          PGBL é vantajoso para quem faz declaração completa do IR. Verifique com seu contador se sua renda permite a dedução máxima de 12%.
        </div>

      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   SCORE DE SAÚDE FINANCEIRA
   ───────────────────────────────────────────────────── */
function ScoreSaudeScreen({ onBack }) {
  const d = AppData;

  // 1. Taxa de poupança (peso 25)
  const totalRec   = AppData.monthlyEvents.filter(e => e.type === 'income').reduce((s,e) => s+e.value, 0);
  const totalDesp  = AppData.monthlyEvents.filter(e => e.type === 'expense').reduce((s,e) => s+e.value, 0);
  const savePct    = totalRec > 0 ? (totalRec - totalDesp) / totalRec * 100 : 0;
  const saveScore  = Math.min(25, Math.round(savePct / 40 * 25)); // 40% = full score

  // 2. Cobertura de emergência (peso 20) — meses de reserva
  const reserva    = d.pfAvailable;
  const despMensal = totalDesp / 2; // PF share approx
  const mesesRes   = reserva / Math.max(1, despMensal);
  const emgScore   = Math.min(20, Math.round(Math.min(mesesRes, 6) / 6 * 20));

  // 3. Diversificação (peso 20) — número de classes
  const allInv     = [...(d.investments.pf||[]), ...(d.investments.pj||[])];
  const classes    = new Set(allInv.map(i => i.name.split(' ')[0])).size;
  const divScore   = Math.min(20, Math.round(Math.min(classes, 5) / 5 * 20));

  // 4. Dívida/renda (peso 20)
  const parcelas   = d.financingList.reduce((s,f) => s+f.installment, 0);
  const debtRatio  = parcelas / Math.max(1, totalRec) * 100;
  const debtScore  = Math.min(20, Math.round(Math.max(0, 1 - debtRatio / 30) * 20));

  // 5. Progresso de metas (peso 15)
  const goalAvg    = d.goals.reduce((s,g) => s + Math.min(1, g.current/g.target), 0) / d.goals.length;
  const goalScore  = Math.min(15, Math.round(goalAvg * 15));

  const total      = saveScore + emgScore + divScore + debtScore + goalScore;
  const grade      = total >= 85 ? 'A' : total >= 70 ? 'B' : total >= 55 ? 'C' : total >= 40 ? 'D' : 'E';
  const gradeColor = total >= 85 ? '#16A34A' : total >= 70 ? '#22C55E' : total >= 55 ? '#F59E0B' : total >= 40 ? '#F97316' : '#DC2626';
  const gradeMsg   = total >= 85 ? 'Excelente saúde financeira!' : total >= 70 ? 'Saúde financeira boa' : total >= 55 ? 'Saúde razoável — há melhorias' : total >= 40 ? 'Atenção necessária' : 'Situação crítica';

  const pillars = [
    { label: 'Taxa de Poupança',    score: saveScore,  max: 25, value: `${savePct.toFixed(0)}%`,          tip: savePct >= 30 ? 'Ótimo! Acima de 30%' : 'Meta: poupar 30%+ da renda' },
    { label: 'Reserva Emergência',  score: emgScore,   max: 20, value: `${mesesRes.toFixed(1)} meses`,    tip: mesesRes >= 6 ? 'Cobertura adequada (6+ meses)' : `Ideal: 6 meses de despesas (R$ ${fmt(despMensal*6,{short:true})})` },
    { label: 'Diversificação',      score: divScore,   max: 20, value: `${classes} classes`,              tip: classes >= 4 ? 'Bem diversificado' : 'Diversifique em mais classes de ativos' },
    { label: 'Dívida / Renda',      score: debtScore,  max: 20, value: `${debtRatio.toFixed(0)}%`,        tip: debtRatio <= 15 ? 'Nível saudável de dívida' : 'Dívida acima de 30% da renda é crítico' },
    { label: 'Progresso de Metas',  score: goalScore,  max: 15, value: `${Math.round(goalAvg*100)}%`,     tip: goalAvg >= 0.5 ? 'Na metade do caminho!' : 'Aumente os aportes nas metas' },
  ];

  // Donut segments
  const segments = pillars.map((p, i) => ({
    value: p.score,
    color: ['#2563EB','#16A34A','#7C3AED','#F59E0B','#EF4444'][i],
  }));

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: '#F7F8FA', fontFamily: 'DM Sans, system-ui' }}>
      <div style={{ padding: '68px 18px 100px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={onBack} style={{ width: 36, height: 36, borderRadius: '50%', background: '#fff', border: '1.5px solid #ECEEF4', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 4px rgba(26,31,54,0.08)', flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="#1A1F36" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <div>
            <div style={{ fontSize: 19, fontWeight: 700, color: '#1A1F36' }}>Score de Saúde Financeira</div>
            <div style={{ fontSize: 11, color: '#8B90A0', marginTop: 1 }}>Diagnóstico completo em 5 pilares</div>
          </div>
        </div>

        {/* Score hero */}
        <div style={{ background: 'linear-gradient(145deg,#1A1F36,#253056)', borderRadius: 22, padding: '20px', boxShadow: '0 6px 24px rgba(26,31,54,0.22)', display: 'flex', alignItems: 'center', gap: 18 }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <DonutChart size={110} thickness={18} segments={segments}/>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontSize: 26, fontWeight: 900, color: gradeColor, lineHeight: 1 }}>{grade}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{total}/100</div>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: '#94A3CC', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>Pontuação geral</div>
            <div style={{ fontSize: 36, fontWeight: 900, color: gradeColor, letterSpacing: '-1px', lineHeight: 1, marginBottom: 6 }}>{total}</div>
            <div style={{ fontSize: 13, color: '#fff', fontWeight: 600 }}>{gradeMsg}</div>
          </div>
        </div>

        {/* Pillar cards */}
        <div style={{ fontSize: 12, fontWeight: 600, color: '#8B90A0', letterSpacing: '0.05em', textTransform: 'uppercase', paddingLeft: 2 }}>5 Pilares</div>
        {pillars.map((p, i) => {
          const pct = Math.round(p.score / p.max * 100);
          const col = segments[i].color;
          return (
            <Card key={i} style={{ padding: '14px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1A1F36', marginBottom: 1 }}>{p.label}</div>
                  <div style={{ fontSize: 11, color: '#8B90A0' }}>{p.value}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: col }}>{p.score}</div>
                  <div style={{ fontSize: 10, color: '#8B90A0' }}>/{p.max} pts</div>
                </div>
              </div>
              <div style={{ height: 6, background: '#F0F1F5', borderRadius: 3, overflow: 'hidden', marginBottom: 6 }}>
                <div style={{ width: `${pct}%`, height: '100%', background: col, borderRadius: 3, transition: 'width 0.6s ease' }}/>
              </div>
              <div style={{ fontSize: 11, color: pct >= 80 ? '#16A34A' : pct >= 50 ? '#F59E0B' : '#DC2626', fontWeight: 600 }}>
                {p.tip}
              </div>
            </Card>
          );
        })}

      </div>
    </div>
  );
}

export { SimuladorESeScreen, RelatorioMensalScreen, PGBLScreen, ScoreSaudeScreen };
