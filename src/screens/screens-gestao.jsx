import React from 'react';
import { fmt } from '../data.js';
import { useFinance, useInvestments, slugify } from '../hooks/useFinance.jsx';
import { AreaChart } from '../components/charts.jsx';
import { Card } from './screens-a.jsx';
// screens-gestao.jsx — Gestão: Financiamentos · Investimentos · Recorrências

/* ── Math helper ────────────────────────────────────── */
function simPrepay(balance, r, pmt, nExtra) {
  let bal = balance;
  for (let i = 0; i < nExtra; i++) {
    const interest = bal * r;
    const amort = Math.max(0, pmt - interest);
    bal = Math.max(0, bal - amort);
  }
  const countMonths = (b0) => {
    let b = b0, n = 0, ti = 0;
    while (b > 1 && n < 500) {
      const int = b * r;
      b = Math.max(0, b - Math.max(0.01, pmt - int));
      ti += int; n++;
    }
    return { months: n, totalInt: Math.round(ti) };
  };
  const orig  = countMonths(balance);
  const after = countMonths(bal);
  return {
    newBalance:     Math.round(bal),
    extraPaid:      Math.round(nExtra * pmt),
    interestSaved:  orig.totalInt - after.totalInt,
    monthsSaved:    orig.months - after.months,
    newTotalMonths: after.months,
  };
}

/* ── FinancingCard (single financing) ───────────────── */
function FinancingCard({ fin }) {
  const [simMode, setSimMode] = React.useState(null);
  const [nPrepay, setNPrepay] = React.useState(6);
  const [bal,     setBal]     = React.useState(fin.balance);
  const [tempBal, setTempBal] = React.useState(String(fin.balance));

  const r       = Math.pow(1 + fin.cet / 100, 1 / 12) - 1;
  const pmt     = fin.installment;
  const paidPct = Math.round((fin.originalBalance - bal) / fin.originalBalance * 100);

  const { months: remN, totalInt } = React.useMemo(() => {
    let b = bal, n = 0, ti = 0;
    while (b > 1 && n < 500) { const int = b * r; b = Math.max(0, b - Math.max(0.01, pmt - int)); ti += int; n++; }
    return { months: n, totalInt: Math.round(ti) };
  }, [bal]);

  const totalRem   = Math.round(pmt * remN);
  const settleVal  = Math.round(bal * 0.88);
  const settleSave = totalRem - settleVal;
  const pre = React.useMemo(() => simPrepay(bal, r, pmt, nPrepay), [bal, nPrepay]);

  const approxEnd = () => { const d = new Date(2026, 5, 1); d.setMonth(d.getMonth() + pre.newTotalMonths); return d.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }); };

  const catGrad = {
    'Imóvel Comercial': ['#7C1D1D', '#991B1B'],
    'Veículo':          ['#1a3a1a', '#166534'],
    'Crédito Pessoal':  ['#1e3a5f', '#1e40af'],
  }[fin.cat] || ['#1A1F36', '#253056'];

  return (
    <div style={{ paddingBottom: 18, marginBottom: 6, borderBottom: '1.5px solid #ECEEF4' }}>
      {/* Mini hero */}
      <div style={{ background: `linear-gradient(135deg,${catGrad[0]},${catGrad[1]})`, borderRadius: 16, padding: '14px 16px', marginBottom: 10, boxShadow: '0 3px 14px rgba(0,0,0,0.18)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 3 }}>{fin.bank}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>{fmt(bal)}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Pago</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#86EFAC' }}>{paidPct}%</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 0, marginBottom: 8 }}>
          {[['Parcela', `${fmt(pmt)}/mês`], ['Término', fin.endYear], ['CET', `${fin.cet}%a.a.`], ['Restam', `${remN}×`]].map(([l, v], idx) => (
            <React.Fragment key={l}>
              {idx > 0 && <div style={{ width: 1, background: 'rgba(255,255,255,0.15)', margin: '0 10px' }}/>}
              <div>
                <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>{l}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#fff', marginTop: 1 }}>{v}</div>
              </div>
            </React.Fragment>
          ))}
        </div>
        <div style={{ height: 4, background: 'rgba(255,255,255,0.12)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ width: `${paidPct}%`, height: '100%', background: '#86EFAC', borderRadius: 2 }}/>
        </div>
      </div>

      {/* Cost summary */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <div style={{ flex: 1, background: '#FEF2F2', borderRadius: 10, padding: '9px 11px' }}>
          <div style={{ fontSize: 9, color: '#8B90A0', marginBottom: 2 }}>Juros restantes</div>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#DC2626' }}>{fmt(totalInt, { short: true })}</div>
        </div>
        <div style={{ flex: 1, background: '#FFFBEB', borderRadius: 10, padding: '9px 11px' }}>
          <div style={{ fontSize: 9, color: '#8B90A0', marginBottom: 2 }}>Total a pagar</div>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#F59E0B' }}>{fmt(totalRem, { short: true })}</div>
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 7, marginBottom: 10 }}>
        {[['prepay','Antecipar','#2563EB'],['settle','Quitar','#16A34A'],['saldo','Saldo','#F59E0B']].map(([mode, label, col]) => (
          <button key={mode} onClick={() => setSimMode(simMode === mode ? null : mode)} style={{
            flex: 1, padding: '8px 4px', borderRadius: 10,
            border: `1.5px solid ${simMode === mode ? col : '#ECEEF4'}`,
            background: simMode === mode ? col + '15' : '#fff',
            color: simMode === mode ? col : '#8B90A0',
            fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans, system-ui', transition: 'all 0.15s',
          }}>{label}</button>
        ))}
      </div>

      {simMode === 'prepay' && (
        <div style={{ background: '#EFF6FF', borderRadius: 12, padding: '12px 14px', marginBottom: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#2563EB' }}>Antecipar {nPrepay}× parcelas</span>
            <span style={{ fontSize: 11, color: '#8B90A0' }}>{fmt(pre.extraPaid)}</span>
          </div>
          <input type="range" min="1" max="24" value={nPrepay} onChange={e => setNPrepay(Number(e.target.value))} style={{ width: '100%', accentColor: '#2563EB', marginBottom: 10 }}/>
          {[['Juros economizados', fmt(pre.interestSaved), '#16A34A'], ['Novo saldo', fmt(pre.newBalance), '#2563EB'], ['Meses a menos', String(pre.monthsSaved), '#16A34A'], ['Nova quitação', approxEnd(), '#8B90A0']].map(([l,v,c]) => (
            <div key={l} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 11, color: '#8B90A0' }}>{l}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: c }}>{v}</span>
            </div>
          ))}
        </div>
      )}

      {simMode === 'settle' && (
        <div style={{ background: '#F0FDF4', borderRadius: 12, padding: '12px 14px', marginBottom: 4 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#16A34A', marginBottom: 8 }}>Quitação com 12% desconto</div>
          {[['Valor para quitar', fmt(settleVal), '#2563EB', true], ['Economia total', fmt(settleSave), '#16A34A', true], ['vs. custo total', fmt(totalRem, {short:true}), '#DC2626', false]].map(([l,v,c,big]) => (
            <div key={l} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <span style={{ fontSize: 11, color: '#8B90A0' }}>{l}</span>
              <span style={{ fontSize: big ? 13 : 11, fontWeight: big ? 800 : 700, color: c }}>{v}</span>
            </div>
          ))}
          <div style={{ marginTop: 6, fontSize: 11, color: '#8B90A0', textAlign: 'center' }}>
            Economize {fmt(settleSave, {short:true})} em {remN} parcelas futuras
          </div>
        </div>
      )}

      {simMode === 'saldo' && (
        <div style={{ background: '#FFFBEB', borderRadius: 12, padding: '12px 14px', border: '1px solid #FDE68A', marginBottom: 4 }}>
          <div style={{ fontSize: 11, color: '#8B90A0', marginBottom: 6 }}>Novo saldo devedor (R$)</div>
          <input value={tempBal} onChange={e => setTempBal(e.target.value.replace(/\D/g, ''))}
            style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #F59E0B', fontSize: 16, fontWeight: 700, color: '#F59E0B', background: '#fff', outline: 'none', fontFamily: 'DM Sans, system-ui', boxSizing: 'border-box' }} inputMode="numeric"/>
          <button onClick={() => { setBal(Number(tempBal) || bal); setSimMode(null); }} style={{ marginTop: 8, width: '100%', padding: '9px', borderRadius: 9, background: '#F59E0B', color: '#fff', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans, system-ui' }}>
            Confirmar saldo
          </button>
        </div>
      )}
    </div>
  );
}

/* ── FinanciamentosTab ──────────────────────────────── */
function FinanciamentosTab() {
  const d = useFinance();
  const list         = d.financingList || [d.financing];
  const totalDebt    = list.reduce((s, f) => s + f.balance,     0);
  const totalMonthly = list.reduce((s, f) => s + f.installment, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Summary totals */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <Card style={{ padding: '12px 14px' }}>
          <div style={{ fontSize: 11, color: '#8B90A0', marginBottom: 3 }}>Total em dívidas</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#DC2626' }}>{fmt(totalDebt, { short: true })}</div>
        </Card>
        <Card style={{ padding: '12px 14px' }}>
          <div style={{ fontSize: 11, color: '#8B90A0', marginBottom: 3 }}>Parcelas/mês</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#F59E0B' }}>{fmt(totalMonthly, { short: true })}</div>
        </Card>
      </div>
      {list.map(fin => <FinancingCard key={fin.id || fin.bank} fin={fin} />)}
    </div>
  );
}

/* ── InvestimentosTab ───────────────────────────────── */
function InvestimentosTab() {
  const d = useFinance();
  const { data: investments = d.investments, update } = useInvestments();
  const [editKey, setEditKey] = React.useState(null);

  const projValue = (value, retAnual, months) => {
    const r = Math.pow(1 + retAnual / 100, 1 / 12) - 1;
    return Math.round(value * Math.pow(1 + r, months));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {['pf', 'pj'].map(entity => {
        const items = investments[entity] || d.investments[entity];
        const total = items.reduce((s, inv) => s + inv.value, 0);
        const accentCol = entity === 'pf' ? '#2563EB' : '#7C3AED';
        const accentBg  = entity === 'pf' ? '#EFF6FF' : '#F5F3FF';
        const label     = entity === 'pf' ? 'Pessoa Física' : 'Pessoa Jurídica';

        return (
          <div key={entity}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#8B90A0', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{label}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1A1F36' }}>{fmt(total, { short: true })} total</div>
            </div>
            <Card style={{ padding: '4px 4px' }}>
              {items.map((inv, i) => {
                const key = `${entity}-${i}`;
                const isEditing = editKey === key;
                const p12 = projValue(inv.value, inv.ret, 12);
                const p24 = projValue(inv.value, inv.ret, 24);

                return (
                  <div key={i}>
                    {i > 0 && <div style={{ height: 1, background: '#F4F5F8', margin: '0 12px' }}/>}
                    <div onClick={() => setEditKey(isEditing ? null : key)}
                      style={{ padding: isEditing ? '12px 12px 0' : '12px 12px', cursor: 'pointer' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: accentBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontSize: 10, fontWeight: 800, color: accentCol }}>{inv.name.slice(0,2).toUpperCase()}</span>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#1A1F36', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inv.name}</div>
                          <div style={{ fontSize: 11, color: '#8B90A0' }}>{inv.ret}% a.a.{inv.monthly > 0 ? ` · +${fmt(inv.monthly, { short: true })}/mês` : ''}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: '#1A1F36' }}>{fmt(inv.value, { short: true })}</div>
                          <div style={{ fontSize: 9, color: '#C4C7D4' }}>editar</div>
                        </div>
                      </div>

                      {isEditing && (
                        <div style={{ margin: '10px 0 12px', padding: '12px', background: '#F7F8FA', borderRadius: 10 }}
                          onClick={e => e.stopPropagation()}>
                          {/* Projections */}
                          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                            {[[12, p12], [24, p24]].map(([mo, val]) => (
                              <div key={mo} style={{ flex: 1, background: accentBg, borderRadius: 8, padding: '8px 10px' }}>
                                <div style={{ fontSize: 9, color: '#8B90A0' }}>em {mo} meses</div>
                                <div style={{ fontSize: 14, fontWeight: 700, color: accentCol }}>{fmt(val, { short: true })}</div>
                              </div>
                            ))}
                          </div>
                          {[
                            { label: 'Saldo atual (R$)', field: 'value' },
                            { label: 'Taxa (% a.a.)',    field: 'ret'   },
                            { label: 'Aporte/mês (R$)', field: 'monthly' },
                          ].map(({ label: lbl, field }) => (
                            <div key={field} style={{ marginBottom: 8 }}>
                              <div style={{ fontSize: 10, color: '#8B90A0', marginBottom: 3 }}>{lbl}</div>
                              <input defaultValue={inv[field]}
                                onBlur={e => {
                                  const v = parseFloat(e.target.value) || 0;
                                  update.mutate({ id: slugify(inv.name), patch: { [field]: v } });
                                }}
                                style={{ width: '100%', padding: '9px 12px', borderRadius: 10, border: '1.5px solid #ECEEF4', fontSize: 14, fontWeight: 600, color: '#1A1F36', background: '#fff', outline: 'none', fontFamily: 'DM Sans, system-ui', boxSizing: 'border-box' }}
                                inputMode="decimal"/>
                            </div>
                          ))}
                          <button onClick={() => setEditKey(null)} style={{ width: '100%', padding: '9px', borderRadius: 9, border: 'none', background: '#ECEEF4', color: '#8B90A0', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, system-ui' }}>
                            Fechar
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </Card>
          </div>
        );
      })}
    </div>
  );
}

/* ── RecorrenciasTab ────────────────────────────────── */
function RecorrenciasTab() {
  const d = useFinance();
  const [events,  setEvents]  = React.useState(d.monthlyEvents);
  const [editIdx, setEditIdx] = React.useState(null);

  const groups = [
    { type: 'income',  label: 'Receitas recorrentes',  icon: '↑', col: '#16A34A', bg: '#F0FDF4' },
    { type: 'expense', label: 'Despesas recorrentes',  icon: '↓', col: '#DC2626', bg: '#FEF2F2' },
  ];
  const entityStyle = { PF: ['#2563EB', '#EFF6FF'], PJ: ['#7C3AED', '#F5F3FF'] };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {groups.map(g => {
        const items = events
          .map((e, i) => ({ ...e, _i: i }))
          .filter(e => e.type === g.type)
          .sort((a, b) => a.day - b.day);
        const total = items.reduce((s, e) => s + e.value, 0);

        return (
          <div key={g.type}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#8B90A0', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{g.label}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: g.col }}>{g.type === 'income' ? '+' : '−'}{fmt(total, { short: true })}/mês</div>
            </div>
            <Card style={{ padding: '4px 4px' }}>
              {items.map((e, ii) => {
                const isEditing = editIdx === e._i;
                const [ecol, ebg] = entityStyle[e.entity] || ['#8B90A0', '#F4F5F8'];
                return (
                  <div key={e._i}>
                    {ii > 0 && <div style={{ height: 1, background: '#F4F5F8', margin: '0 12px' }}/>}
                    <div onClick={() => setEditIdx(isEditing ? null : e._i)}
                      style={{ padding: isEditing ? '12px 12px 0' : '12px 12px', cursor: 'pointer' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 30, height: 30, borderRadius: 9, flexShrink: 0, background: g.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: g.col, fontWeight: 700 }}>{g.icon}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#1A1F36', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.desc}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                            <span style={{ fontSize: 9, fontWeight: 700, color: ecol, background: ebg, padding: '1px 5px', borderRadius: 4 }}>{e.entity}</span>
                            <span style={{ fontSize: 10, color: '#8B90A0' }}>dia {e.day} · {e.cat}</span>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: g.col }}>{fmt(e.value)}</div>
                          <div style={{ fontSize: 9, color: '#C4C7D4' }}>editar</div>
                        </div>
                      </div>

                      {isEditing && (
                        <div style={{ margin: '10px 0 12px', padding: '12px', background: '#F7F8FA', borderRadius: 10 }}
                          onClick={ex => ex.stopPropagation()}>
                          {[
                            { label: 'Valor (R$)',  field: 'value' },
                            { label: 'Dia do mês', field: 'day'   },
                          ].map(({ label: lbl, field }) => (
                            <div key={field} style={{ marginBottom: 8 }}>
                              <div style={{ fontSize: 10, color: '#8B90A0', marginBottom: 3 }}>{lbl}</div>
                              <input defaultValue={e[field]}
                                onBlur={ev => {
                                  const v = parseFloat(ev.target.value) || e[field];
                                  setEvents(prev => prev.map((ev2, ii2) => ii2 === e._i ? { ...ev2, [field]: v } : ev2));
                                }}
                                style={{ width: '100%', padding: '9px 12px', borderRadius: 10, border: '1.5px solid #ECEEF4', fontSize: 14, fontWeight: 600, color: '#1A1F36', background: '#fff', outline: 'none', fontFamily: 'DM Sans, system-ui', boxSizing: 'border-box' }}
                                inputMode="decimal"/>
                            </div>
                          ))}
                          <button onClick={() => setEditIdx(null)} style={{ width: '100%', padding: '9px', borderRadius: 9, border: 'none', background: '#ECEEF4', color: '#8B90A0', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, system-ui' }}>Fechar</button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </Card>
          </div>
        );
      })}
    </div>
  );
}

/* ── GestaoScreen ───────────────────────────────────── */
function GestaoScreen({ onBack }) {
  const [tab, setTab] = React.useState('financ');

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: '#F7F8FA', fontFamily: 'DM Sans, system-ui' }}>
      <div style={{ padding: '68px 18px 100px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={onBack} style={{ width: 36, height: 36, borderRadius: '50%', background: '#fff', border: '1.5px solid #ECEEF4', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 4px rgba(26,31,54,0.08)', flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="#1A1F36" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <div>
            <div style={{ fontSize: 19, fontWeight: 700, color: '#1A1F36', lineHeight: 1.2 }}>Gestão Financeira</div>
            <div style={{ fontSize: 11, color: '#8B90A0', marginTop: 1 }}>Financiamentos · Investimentos · Recorrências</div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', background: '#ECEEF4', borderRadius: 14, padding: 3, gap: 2 }}>
          {[['financ','Financiamentos'],['invest','Investimentos'],['recorr','Recorrências']].map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} style={{
              flex: 1, padding: '7px 4px', borderRadius: 11, border: 'none', cursor: 'pointer',
              background: tab === k ? '#fff' : 'transparent',
              color: tab === k ? '#1A1F36' : '#8B90A0',
              fontWeight: tab === k ? 700 : 500,
              fontSize: 12, fontFamily: 'DM Sans, system-ui',
              boxShadow: tab === k ? '0 1px 4px rgba(26,31,54,0.1)' : 'none',
              transition: 'all 0.2s',
            }}>{l}</button>
          ))}
        </div>

        {tab === 'financ' && <FinanciamentosTab />}
        {tab === 'invest' && <InvestimentosTab />}
        {tab === 'recorr' && <RecorrenciasTab />}

      </div>
    </div>
  );
}

export { GestaoScreen };
