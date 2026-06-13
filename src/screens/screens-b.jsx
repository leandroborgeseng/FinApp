import React from 'react';
import { fmt } from '../data.js';
import { useFinance, useInvestments, slugify } from '../hooks/useFinance.jsx';
import { AreaChart, DonutChart } from '../components/charts.jsx';
import { Card } from './screens-a.jsx';
import { OrcadoVsRealizado } from './screens-analise.jsx';
import { SyncBadge } from '../components/navigation.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { repasseMonthIndex } from '../lib/dates.js';
import { downloadExport, downloadBackup, pickAndImportFile } from '../api/backup.js';
import { useQueryClient } from '@tanstack/react-query';
// screens-b.jsx — Planejamento + Patrimônio + Mais

/* ── Planejamento ───────────────────────────────────── */
function PlanejamentoScreen({ transactions }) {
  const d = useFinance();
  const [mode,         setMode]         = React.useState('realista');
  const [expandedIdx,  setExpandedIdx]  = React.useState(null);
  const [viewMode,     setViewMode]     = React.useState('plan');

  const multiplier = { realista: 1, conservador: 0.82, otimista: 1.18 }[mode];

  const planMonths = d.planning.map(m => ({
    ...m,
    income:  Math.round(m.income  * multiplier),
    expense: Math.round(m.expense * multiplier),
  }));

  // Events breakdown for detail view
  const pjIncomes  = d.monthlyEvents.filter(e => e.entity === 'PJ' && e.type === 'income');
  const pjExpenses = d.monthlyEvents.filter(e => e.entity === 'PJ' && e.type === 'expense');
  const pfIncomes  = d.monthlyEvents.filter(e => e.entity === 'PF' && e.type === 'income');
  const pfExpenses = d.monthlyEvents.filter(e => e.entity === 'PF' && e.type === 'expense');

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: '#F7F8FA', fontFamily: 'DM Sans, system-ui' }}>
      <div style={{ padding: '68px 18px 100px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Header */}
        <div style={{ fontSize: 20, fontWeight: 700, color: '#1A1F36' }}>Planejamento</div>

        {/* View toggle */}
        <div style={{ display: 'flex', background: '#ECEEF4', borderRadius: 12, padding: 3, gap: 2 }}>
          {[['plan','Meses'], ['orcado','Orçado vs. Real']].map(([k, l]) => (
            <button key={k} onClick={() => setViewMode(k)} style={{ flex:1, padding:'8px 4px', borderRadius:9, border:'none', cursor:'pointer', background: viewMode===k ? '#fff' : 'transparent', color: viewMode===k ? '#1A1F36' : '#8B90A0', fontWeight: viewMode===k ? 700 : 500, fontSize:13, fontFamily:'DM Sans, system-ui', boxShadow: viewMode===k ? '0 1px 4px rgba(26,31,54,0.1)' : 'none', transition:'all 0.2s ease' }}>{l}</button>
          ))}
        </div>

        {viewMode === 'orcado' && <OrcadoVsRealizado transactions={transactions}/>}
        {viewMode === 'plan' && <>

        {/* Mode selector */}
        <div style={{ display: 'flex', background: '#ECEEF4', borderRadius: 14, padding: 3, gap: 2 }}>
          {[['realista','Realista'],['conservador','Conservador'],['otimista','Otimista']].map(([k, label]) => (
            <button key={k} onClick={() => setMode(k)} style={{
              flex: 1, padding: '8px 4px', borderRadius: 11, border: 'none', cursor: 'pointer',
              background: mode === k ? '#fff' : 'transparent',
              color: mode === k ? '#1A1F36' : '#8B90A0',
              fontWeight: mode === k ? 700 : 500,
              fontSize: 13, fontFamily: 'DM Sans, system-ui',
              boxShadow: mode === k ? '0 1px 4px rgba(26,31,54,0.1)' : 'none',
              transition: 'all 0.2s ease',
            }}>{label}</button>
          ))}
        </div>

        {/* 36-month projection chart */}
        <Card style={{ padding: '16px 12px 10px' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#1A1F36', marginBottom: 10 }}>
            Projeção 36 meses — Sobras mensais
          </div>
          <AreaChart
            data={d.planningChart36.map(d2 => ({ ...d2, value: d2.value * multiplier }))}
            width={326} height={110} color="#16A34A"
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            <div style={{ fontSize: 11, color: '#8B90A0' }}>Jun 2026</div>
            <div style={{ fontSize: 11, color: '#8B90A0' }}>Mai 2029</div>
          </div>
        </Card>

        {/* Month cards */}
        <div style={{ fontSize: 13, fontWeight: 600, color: '#8B90A0', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          Próximos meses
        </div>

        {planMonths.map((m, i) => {
          const sobra = m.income - m.expense;
          const pct = Math.round((sobra / m.income) * 100);
          const isCurrent = i === 0;
          const isExpanded = expandedIdx === i;
          return (
            <Card key={i} style={{
              padding: '16px 18px',
              border: isCurrent ? '1.5px solid #2563EB' : '1.5px solid transparent',
              position: 'relative',
              cursor: 'pointer',
            }} onClick={() => setExpandedIdx(isExpanded ? null : i)}>
              {isCurrent && (
                <div style={{ position: 'absolute', top: 0, right: 0, background: '#2563EB', color: '#fff', fontSize: 9, fontWeight: 700, padding: '3px 10px', borderBottomLeftRadius: 8 }}>ATUAL</div>
              )}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#1A1F36' }}>{m.month}</div>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                    <path d="M3 5L7 9L11 5" stroke="#8B90A0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: sobra >= 0 ? '#16A34A' : '#DC2626' }}>
                  {sobra >= 0 ? '+' : '-'}{fmt(sobra)} <span style={{ fontSize: 11, fontWeight: 500, color: '#8B90A0' }}>({pct}%)</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1, background: '#F0FDF4', borderRadius: 10, padding: '8px 12px' }}>
                  <div style={{ fontSize: 10, color: '#8B90A0', marginBottom: 2 }}>Receitas</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#16A34A' }}>{fmt(m.income)}</div>
                </div>
                <div style={{ flex: 1, background: '#FEF2F2', borderRadius: 10, padding: '8px 12px' }}>
                  <div style={{ fontSize: 10, color: '#8B90A0', marginBottom: 2 }}>Despesas</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#DC2626' }}>{fmt(m.expense)}</div>
                </div>
              </div>
              <div style={{ marginTop: 10 }}>
                <div style={{ height: 4, background: '#F0F1F5', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ width: `${Math.max(0, Math.min(100, pct))}%`, height: '100%', background: '#22C55E', borderRadius: 2, transition: 'width 0.5s ease' }}/>
                </div>
              </div>

              {/* Expanded detail — inside Card */}
              {isExpanded && (
                <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1.5px solid #F0F1F5' }}
                  onClick={e => e.stopPropagation()}>

                  {[['PJ', pjIncomes, pjExpenses, '#7C3AED', '#F5F3FF'], ['PF', pfIncomes, pfExpenses, '#2563EB', '#EFF6FF']].map(([entity, incItems, expItems, acol, abg]) => (
                    <div key={entity} style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 8 }}>
                        <span style={{ color: acol, background: abg, padding: '2px 8px', borderRadius: 6 }}>{entity}</span>
                      </div>
                      {incItems.map((e, ei) => (
                        <div key={`inc${ei}`} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                          <span style={{ fontSize: 12, color: '#1A1F36' }}>{e.desc}</span>
                          <span style={{ fontSize: 12, fontWeight: 600, color: '#16A34A' }}>+{fmt(e.value)}</span>
                        </div>
                      ))}
                      {expItems.map((e, ei) => (
                        <div key={`exp${ei}`} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                          <span style={{ fontSize: 12, color: '#1A1F36' }}>{e.desc}</span>
                          <span style={{ fontSize: 12, fontWeight: 600, color: '#DC2626' }}>-{fmt(e.value)}</span>
                        </div>
                      ))}
                    </div>
                  ))}

                  <div style={{ background: '#F7F8FA', borderRadius: 10, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 7 }}>
                    {[
                      ['Repasse PJ->PF',    fmt(m.repasse),  '#2563EB'],
                      ['Aplicacao CDB PJ',  fmt(m.aplicPJ),  '#7C3AED'],
                      ['Aplicacao CDB PF',  fmt(m.aplicPF),  '#7C3AED'],
                      ['Saldo projetado',   fmt(m.saldo),    '#16A34A'],
                    ].map(([lbl, val, col]) => (
                      <div key={lbl} style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 12, color: '#8B90A0' }}>{lbl}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: col }}>{val}</span>
                      </div>
                    ))}
                  </div>

                </div>
              )}
            </Card>
          );
        })}
        </>}
      </div>
    </div>
  );
}

/* ── Patrimônio ─────────────────────────────────────── */
function PatrimonioScreen() {
  const d = useFinance();
  const [subTab,  setSubTab]  = React.useState('overview');
  const [expInv,  setExpInv]  = React.useState(null);
  const [expGoal, setExpGoal] = React.useState(null);
  const rmf = (ret) => Math.pow(1 + ret/100, 1/12) - 1;
  const proj = (inv, n) => { const rm = rmf(inv.ret); return Math.round(inv.value * Math.pow(1+rm,n) + inv.monthly*(Math.pow(1+rm,n)-1)/rm); };
  const rg  = Math.pow(1 + 12.68/100, 1/12) - 1;

  const imovelGoal = d.goals?.find((g) => g.name?.includes('Imóvel'));
  const totalFinDebt = (d.financingList || []).reduce((s, f) => s + (f.balance || 0), 0);

  const breakdown = [
    { label: 'PF Disponível',   value: d.pfAvailable,    color: '#16A34A' },
    { label: 'PJ Disponível',   value: d.pjAvailable,    color: '#2563EB' },
    { label: 'Invest. PF',      value: d.pfInvestments,  color: '#7C3AED' },
    { label: 'Invest. PJ',      value: d.pjInvestments,  color: '#8B5CF6' },
    { label: 'Imóveis (est.)',   value: imovelGoal?.current || 0, color: '#F59E0B' },
    { label: 'Metas (outras)',   value: (d.goals || []).filter((g) => !g.name?.includes('Imóvel')).reduce((s, g) => s + (g.current || 0), 0), color: '#06B6D4' },
    { label: 'Financiamentos',   value: -totalFinDebt,    color: '#F87171' },
  ];

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: '#F7F8FA', fontFamily: 'DM Sans, system-ui' }}>
      <div style={{ padding: '68px 18px 100px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Header */}
        <div style={{ fontSize: 20, fontWeight: 700, color: '#1A1F36' }}>Patrimônio</div>

        {/* Sub-tabs */}
        <div style={{ display: 'flex', gap: 8 }}>
          {[['overview','Visão Geral'],['invest','Investimentos'],['goals','Metas'],['financ','Financiamentos']].map(([k,l]) => (
            <button key={k} onClick={() => setSubTab(k)} style={{
              padding: '7px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
              background: subTab === k ? '#1A1F36' : '#fff',
              color: subTab === k ? '#fff' : '#8B90A0',
              fontSize: 12, fontWeight: 600, fontFamily: 'DM Sans, system-ui',
              boxShadow: subTab === k ? '0 2px 8px rgba(26,31,54,0.2)' : 'none',
              transition: 'all 0.2s ease',
            }}>{l}</button>
          ))}
        </div>

        {subTab === 'overview' && (
          <>
            {/* Net worth hero */}
            <div style={{
              background: 'linear-gradient(145deg, #1A1F36 0%, #253056 100%)',
              borderRadius: 22, padding: '20px', boxShadow: '0 6px 24px rgba(26,31,54,0.22)',
            }}>
              <div style={{ fontSize: 11, color: '#94A3CC', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 4 }}>
                Patrimônio Líquido Total
              </div>
              <div style={{ fontSize: 30, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px', marginBottom: 4 }}>
                {fmt(d.netWorth)}
              </div>
              <div style={{ fontSize: 12, color: '#86EFAC', fontWeight: 500 }}>{'↑ R$ 70.000 nos últimos 12 meses'}</div>
            </div>

            {/* Long-term chart */}
            <Card style={{ padding: '16px 12px 10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1A1F36' }}>Projeção até 2040</div>
                <Tag label="Meta R$3M" color="#F59E0B" bg="#FFFBEB"/>
              </div>
              <AreaChart data={d.wealthForecast} width={326} height={130} goalValue={3000000} goalLabel="R$3M"/>
            </Card>

            {/* Breakdown — Donut + lista */}
            <div style={{ fontSize: 13, fontWeight: 600, color: '#8B90A0', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Composição</div>
            <Card style={{ padding: '16px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ flexShrink: 0 }}>
                  <DonutChart size={110} thickness={18} segments={breakdown.filter(b => b.value > 0).map(b => ({ value: b.value, color: b.color }))}/>
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {breakdown.map((b, i) => {
                    const total = breakdown.filter(x => x.value > 0).reduce((s, x) => s + x.value, 0);
                    const pct = total > 0 ? Math.round(Math.abs(b.value) / total * 100) : 0;
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <div style={{ width: 8, height: 8, borderRadius: 2, background: b.color, flexShrink: 0 }}/>
                        <div style={{ flex: 1, fontSize: 11, color: '#1A1F36', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.label}</div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#8B90A0' }}>{pct}%</div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: b.value < 0 ? '#DC2626' : '#1A1F36', minWidth: 52, textAlign: 'right' }}>
                          {b.value < 0 ? '−' : ''}{fmt(b.value, { short: true })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>
          </>
        )}

        {subTab === 'invest' && (
            <>
              {[['PF', d.investments.pf, '#2563EB'], ['PJ', d.investments.pj, '#7C3AED']].map(([label, items, color]) => (
                <div key={label}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#8B90A0', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 8 }}>Pessoa {label === 'PF' ? 'F\u00edsica' : 'Jur\u00eddica'}</div>
                  <Card style={{ padding: '4px 6px' }}>
                    {items.map((inv, i) => {
                      const key = label + i;
                      const isExp = expInv === key;
                      return (
                        <div key={i}>
                          {i > 0 && <div style={{ height: 1, background: '#F4F5F8', margin: '0 12px' }}/>}
                          <div onClick={() => setExpInv(isExp ? null : key)} style={{ padding: isExp ? '11px 12px 4px' : '11px 12px', cursor: 'pointer' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{ width: 36, height: 36, borderRadius: 10, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <span style={{ fontSize: 11, fontWeight: 800, color }}>{inv.name.slice(0,2).toUpperCase()}</span>
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 13, fontWeight: 600, color: '#1A1F36' }}>{inv.name}</div>
                                <div style={{ fontSize: 11, color: '#8B90A0' }}>+R$ {inv.monthly.toLocaleString('pt-BR')}/m\u00eas</div>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: 14, fontWeight: 700, color: '#1A1F36' }}>{fmt(inv.value, { short: true })}</div>
                                <div style={{ fontSize: 11, color: '#16A34A', fontWeight: 500 }}>{inv.ret}% a.a.</div>
                              </div>
                            </div>
                            {isExp && (
                              <div style={{ margin: '10px 0 8px', padding: '12px', background: '#F7F8FA', borderRadius: 10 }} onClick={e => e.stopPropagation()}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: '#1A1F36', marginBottom: 8 }}>Proje\u00e7\u00e3o de crescimento</div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 10 }}>
                                  {[[12,'1 ano'],[24,'2 anos'],[60,'5 anos']].map(([m, lbl]) => (
                                    <div key={m} style={{ background: '#fff', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
                                      <div style={{ fontSize: 9, color: '#8B90A0', marginBottom: 2 }}>{lbl}</div>
                                      <div style={{ fontSize: 13, fontWeight: 800, color }}>{fmt(proj(inv, m), { short: true })}</div>
                                    </div>
                                  ))}
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#8B90A0', marginBottom: 8 }}>
                                  <span>Aporte: <strong style={{ color: '#1A1F36' }}>{fmt(inv.monthly)}/m\u00eas</strong></span>
                                  <span>Rendimento: <strong style={{ color: '#16A34A' }}>{inv.ret}% a.a.</strong></span>
                                </div>
                                <AreaChart data={[0,6,12,18,24].map(m => ({ label: m+'m', value: proj(inv, m) }))} width={270} height={65} color={color}/>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </Card>
                </div>
              ))}
            </>
        )}

                {subTab === 'financ' && <FinanciamentosContent />}

        {subTab === 'goals' && (
            <>
              <Card style={{ padding: '16px 12px 10px' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1A1F36', marginBottom: 4 }}>Proje\u00e7\u00e3o de Independ\u00eancia</div>
                <div style={{ fontSize: 11, color: '#8B90A0', marginBottom: 10 }}>Meta de R$ 3 milh\u00f5es em 2029</div>
                <AreaChart data={d.wealthForecast} width={326} height={120} goalValue={3000000} goalLabel="Independ\u00eancia"/>
              </Card>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#8B90A0', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Objetivos</div>
              {d.goals.map((g, i) => {
                const pct = Math.min(100, g.current/g.target*100);
                const isExp = expGoal === i;
                const missing = g.target - g.current;
                const mLeft = Math.max(1, (g.year - 2026)*12);
                const mneed = Math.round(missing * rg / (Math.pow(1+rg, mLeft)-1));
                const gsteps = [0, Math.floor(mLeft/3), Math.floor(mLeft*2/3), mLeft];
                const projData = gsteps.map(m => ({ label: m+'m', value: Math.round(Math.min(g.current*Math.pow(1+rg,m) + mneed*(Math.pow(1+rg,m)-1)/rg, g.target*1.05)) }));
                return (
                  <Card key={i} style={{ padding: '16px 18px', cursor: 'pointer' }} onClick={() => setExpGoal(isExp ? null : i)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#1A1F36', marginBottom: 2 }}>{g.name}</div>
                        <div style={{ fontSize: 11, color: '#8B90A0' }}>Previs\u00e3o: {g.year}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 15, fontWeight: 800, color: '#2563EB' }}>{Math.round(pct)}%</div>
                        <div style={{ fontSize: 9, color: '#C4C7D4', marginTop: 1 }}>\u25be detalhes</div>
                      </div>
                    </div>
                    <div style={{ height: 7, background: '#F0F1F5', borderRadius: 4, overflow: 'hidden', marginBottom: 8 }}>
                      <div style={{ width: pct+'%', height: '100%', background: 'linear-gradient(90deg,#2563EB,#60A5FA)', borderRadius: 4, transition: 'width 0.6s ease' }}/>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#8B90A0', marginBottom: isExp ? 12 : 0 }}>
                      <span>Atual: <strong style={{ color: '#1A1F36' }}>{fmt(g.current, { short: true })}</strong></span>
                      <span>Faltam: <strong style={{ color: '#DC2626' }}>{fmt(missing, { short: true })}</strong></span>
                      <span>Meta: <strong style={{ color: '#1A1F36' }}>{fmt(g.target, { short: true })}</strong></span>
                    </div>
                    {isExp && (
                      <div style={{ borderTop: '1.5px solid #F0F1F5', paddingTop: 12 }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                          {[['Aporte p/ atingir', fmt(mneed)+'/m\u00eas'], ['Anos restantes', (g.year-2026)+' anos'], ['Rendimento', '12,68% a.a.'], ['Falta acumular', fmt(missing,{short:true})]].map(([l,v]) => (
                            <div key={l} style={{ background: '#F7F8FA', borderRadius: 10, padding: '8px 10px' }}>
                              <div style={{ fontSize: 9, color: '#8B90A0', marginBottom: 2 }}>{l}</div>
                              <div style={{ fontSize: 13, fontWeight: 700, color: '#1A1F36' }}>{v}</div>
                            </div>
                          ))}
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#1A1F36', marginBottom: 6 }}>Trajet\u00f3ria projetada</div>
                        <AreaChart data={projData} width={286} height={80} color="#2563EB" goalValue={g.target} goalLabel="Meta"/>
                      </div>
                    )}
                  </Card>
                );
              })}
            </>
        )}

      </div>
    </div>
  );
}

/* ── Mais ───────────────────────────────────────────── */
function MaisScreen({ user, syncStatus, dark, onToggleDark, repasse, onShowRepasse, onShowGestao, onShowIndependencia, onShowTributario, onShowComparativo, onShowCalculadora, onShowSimulador, onShowRelatorio, onShowPGBL, onShowScore, onShowPlanilha }) {
  const { logout } = useAuth();
  const qc = useQueryClient();
  const currentIdx = repasseMonthIndex(repasse);
  const repasseMonth = repasse?.months?.[currentIdx];
  const repasseDesc  = repasseMonth
    ? `${fmt(repasseMonth.amount)}/mês · ${repasseMonth.done ? 'Realizado' : 'Pendente'}`
    : 'Controle de retiradas PJ→PF';

  const lastBackup = localStorage.getItem('fin_last_backup');
  const backupDesc = lastBackup
    ? `Último: ${new Date(lastBackup).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}`
    : 'Nenhum backup neste dispositivo';

  const syncDesc = syncStatus === 'offline'
    ? 'Sem conexão · dados em cache'
    : syncStatus === 'syncing'
      ? 'Sincronizando alterações…'
      : 'Sincronizado agora';

  const refreshAll = () => {
    qc.invalidateQueries();
  };

  const handleImport = () => {
    pickAndImportFile(() => {
      refreshAll();
      alert('Dados importados com sucesso.');
    });
  };

  const handleExport = async () => {
    try {
      await downloadExport();
    } catch (e) {
      alert(e.message || 'Falha ao exportar');
    }
  };

  const handleBackup = async () => {
    try {
      await downloadBackup();
      refreshAll();
    } catch (e) {
      alert(e.message || 'Falha ao criar backup');
    }
  };

  const sections = [
    {
      title: 'Ferramentas',
      items: [
        { icon: '⇄', label: 'Repasse PJ → PF',         desc: repasseDesc,                      action: onShowRepasse      },
        { icon: '◈', label: 'Gestão Financeira',       desc: 'Financ. · Invest. · Recorr.',        action: onShowGestao       },
        { icon: '◍', label: 'Independência Financeira', desc: 'Tracker · Meta R$3M/2029',          action: onShowIndependencia },
        { icon: '▦', label: 'Análise Tributária PJ',    desc: 'Simples Nacional · Pro-labore',      action: onShowTributario    },
        { icon: '▣', label: 'Comparativo de Meses',          desc: 'Dois meses lado a lado',              action: onShowComparativo   },
        { icon: '◎', label: 'Calculadora de Rentabilidade',    desc: 'CDI, SELIC, IPCA, custom',            action: onShowCalculadora   },
        { icon: '◉', label: 'Simulador E Se?',                 desc: 'Impacto de aportes extras',            action: onShowSimulador     },
        { icon: '▤', label: 'Relatório Mensal',                desc: 'KPIs completos do mês',                action: onShowRelatorio     },
        { icon: '▫', label: 'PGBL vs CDB',                     desc: 'Previdência vs renda fixa',            action: onShowPGBL         },
        { icon: '◐', label: 'Score de Saúde Financeira',      desc: 'Diagnóstico 0-100 em 5 pilares',      action: onShowScore        },
      ],
    },
    {
      title: 'Organização',
      items: [
        { icon: '◉', label: 'Contas',          desc: 'Em breve', comingSoon: true },
        { icon: '▣', label: 'Cartões',         desc: 'Em breve', comingSoon: true },
        { icon: '↺', label: 'Recorrências',    desc: '8 lançamentos fixos',   action: onShowPlanilha },
      ],
    },
    {
      title: 'Dados',
      items: [
        { icon: '↑', label: 'Importar dados', desc: 'JSON exportado do FinApp', action: handleImport },
        { icon: '↓', label: 'Exportar JSON', desc: 'Histórico e configurações', action: handleExport },
        { icon: '⊙', label: 'Backup', desc: backupDesc, action: handleBackup },
        { icon: '⇄', label: 'Sincronização', desc: syncDesc },
      ],
    },
    {
      title: 'Preferências',
      items: [
        { icon: '◑', label: 'Tema', desc: dark ? 'Escuro ●' : 'Claro ○', action: onToggleDark },
        { icon: '◎', label: 'Usuários', desc: 'Em breve', comingSoon: true },
      ],
    },
  ];

  const displayName = user?.name || 'Minha Conta';
  const displayEmail = user?.email || localStorage.getItem('fin_user_email') || '';
  const initial = (displayName[0] || 'U').toUpperCase();

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: '#F7F8FA', fontFamily: 'DM Sans, system-ui' }}>
      <div style={{ padding: 'calc(16px + env(safe-area-inset-top, 0px)) 18px calc(100px + env(safe-area-inset-bottom, 0px))', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Header */}
        <div style={{ fontSize: 20, fontWeight: 700, color: '#1A1F36' }}>Mais</div>

        <InstallPrompt />

        {/* Profile card */}
        <Card style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            background: 'linear-gradient(135deg, #2563EB, #7C3AED)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, fontWeight: 700, color: '#fff',
          }}>{initial}</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#1A1F36' }}>{displayName}</div>
            <div style={{ fontSize: 12, color: '#8B90A0', marginTop: 2 }}>{displayEmail} · {user?.plan === 'pro' ? 'Plano Completo' : 'Plano Básico'}</div>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <SyncBadge status={syncStatus || 'synced'}/>
          </div>
        </Card>

        <Card style={{ padding: '4px 6px' }}>
          <div onClick={() => logout()} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 12px', cursor: 'pointer' }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, color: '#DC2626' }}>⎋</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#DC2626' }}>Sair da conta</div>
              <div style={{ fontSize: 11, color: '#8B90A0', marginTop: 1 }}>Encerrar sessão neste dispositivo</div>
            </div>
          </div>
        </Card>

        {/* Sections */}
        {sections.map((sec, si) => (
          <div key={si}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#8B90A0', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 8, paddingLeft: 4 }}>
              {sec.title}
            </div>
            <Card style={{ padding: '4px 6px' }}>
              {sec.items.map((item, ii) => (
                <div key={ii}>
                  {ii > 0 && <div style={{ height: 1, background: '#F4F5F8', margin: '0 12px' }}/>}
                  <div onClick={item.action || (item.comingSoon ? undefined : item.action)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 12px', cursor: item.action ? 'pointer' : 'default', opacity: item.comingSoon ? 0.55 : 1 }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: 9, background: '#F0F1F5',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 15, color: '#1A1F36', flexShrink: 0,
                    }}>{item.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#1A1F36' }}>{item.label}</div>
                      <div style={{ fontSize: 11, color: '#8B90A0', marginTop: 1 }}>{item.desc}</div>
                    </div>
                    <svg width="7" height="12" viewBox="0 0 7 12" fill="none">
                      <path d="M1 1L6 6L1 11" stroke="#C4C7D4" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
              ))}
            </Card>
          </div>
        ))}

        {/* Version */}
        <div style={{ textAlign: 'center', fontSize: 11, color: '#C4C7D4', paddingTop: 8 }}>
          v1.1.0 · PWA
        </div>

      </div>
    </div>
  );
}

/* ── Financiamentos content (inside Patrimônio) ───── */
function FinanciamentosContent() {
  const d = useFinance();
  const list = d.financingList;
  const [expId,  setExpId]  = React.useState(null);
  const [extraPmt, setExtraPmt] = React.useState({});

  const totalDebt = list.reduce((s,f) => s+f.balance, 0);
  const totalPmt  = list.reduce((s,f) => s+f.installment, 0);

  // Build PRICE amortization schedule for a financing
  const buildSchedule = (f, extra = 0) => {
    const monthlyRate = Math.pow(1 + f.cet / 100, 1/12) - 1;
    let bal = f.balance;
    const rows = [];
    let month = 0;
    while (bal > 1 && month < 300) {
      month++;
      const juros   = Math.round(bal * monthlyRate);
      const amort   = Math.round(f.installment - juros + extra);
      const pmt     = Math.min(bal, Math.max(amort, 0));
      bal = Math.max(0, bal - pmt);
      rows.push({ month, juros, amort: pmt, balance: bal });
      if (bal <= 0) break;
    }
    return rows;
  };

  return (
    <>
      {/* Summary hero */}
      <div style={{ background: 'linear-gradient(145deg,#7C1D1D,#991B1B)', borderRadius: 22, padding: '18px 20px', boxShadow: '0 6px 24px rgba(153,27,27,0.28)' }}>
        <div style={{ fontSize: 10, color: '#FECACA', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Total em financiamentos</div>
        <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px', marginBottom: 12 }}>{fmt(totalDebt)}</div>
        <div style={{ display: 'flex', gap: 0 }}>
          {[['Parcelas/mês', fmt(totalPmt)],['Contratos', String(list.length)],['Venc. mais próx.', '2027']].map(([l,v],i) => (
            <React.Fragment key={l}>
              {i > 0 && <div style={{ width: 1, background: 'rgba(255,255,255,0.18)', margin: '0 12px' }}/>}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 9, color: '#FECACA', textTransform: 'uppercase' }}>{l}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginTop: 2 }}>{v}</div>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Financing cards */}
      {list.map((f) => {
        const isExp  = expId === f.id;
        const pctPaid = Math.round((1 - f.balance / f.originalBalance) * 100);
        const extra  = extraPmt[f.id] || 0;
        const sched  = isExp ? buildSchedule(f, extra) : null;
        const schedBase = isExp ? buildSchedule(f, 0) : null;
        const monthsSaved = isExp ? Math.max(0, schedBase.length - sched.length) : 0;
        const interestBase = isExp ? schedBase.reduce((s,r) => s+r.juros, 0) : 0;
        const interestNew  = isExp ? sched.reduce((s,r) => s+r.juros, 0) : 0;
        const interestSaved = interestBase - interestNew;

        return (
          <Card key={f.id} style={{ padding: 0, overflow: 'hidden' }}>
            {/* Header row */}
            <div onClick={() => setExpId(isExp ? null : f.id)} style={{ padding: '14px 16px', cursor: 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1A1F36' }}>{f.bank}</div>
                  <div style={{ fontSize: 10, color: '#8B90A0', marginTop: 2 }}>{f.cat} · {f.entity} · CET {f.cet}% a.a.</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#DC2626' }}>{fmt(f.balance, {short:true})}</div>
                  <div style={{ fontSize: 10, color: '#8B90A0' }}>{fmt(f.installment)}/mês</div>
                </div>
              </div>
              {/* Progress */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1, height: 5, background: '#F0F1F5', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: pctPaid+'%', height: '100%', background: '#86EFAC', borderRadius: 3 }}/>
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#16A34A', flexShrink: 0 }}>{pctPaid}% pago</span>
                <span style={{ fontSize: 10, color: '#8B90A0', flexShrink: 0 }}>até {f.endYear}</span>
              </div>
            </div>

            {/* Expanded drill-down */}
            {isExp && (
              <div style={{ borderTop: '1.5px solid #F4F5F8', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>

                {/* Simulator */}
                <div style={{ background: '#F7F8FA', borderRadius: 12, padding: '12px 14px' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#1A1F36', marginBottom: 8 }}>Simulador de amortização extra</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <div style={{ fontSize: 11, color: '#8B90A0', flexShrink: 0 }}>+R$</div>
                    <input
                      value={extra === 0 ? '' : extra}
                      onChange={e => setExtraPmt(prev => ({...prev, [f.id]: Number(e.target.value.replace(/D/g,''))||0}))}
                      placeholder="0"
                      inputMode="numeric"
                      style={{ flex: 1, padding: '8px 10px', borderRadius: 9, border: '1.5px solid #ECEEF4', fontSize: 14, fontWeight: 700, color: '#2563EB', background: '#fff', outline: 'none', fontFamily: 'DM Sans, system-ui' }}
                    />
                    <div style={{ fontSize: 11, color: '#8B90A0', flexShrink: 0 }}>extra/mês</div>
                  </div>

                  {extra > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                      {[
                        ['Meses economiz.', monthsSaved + ' meses', '#2563EB'],
                        ['Juros economiz.', fmt(interestSaved,{short:true}), '#16A34A'],
                        ['Novo prazo',      sched.length + ' meses', '#7C3AED'],
                      ].map(([l,v,c]) => (
                        <div key={l} style={{ background: '#fff', borderRadius: 8, padding: '8px 6px', textAlign: 'center' }}>
                          <div style={{ fontSize: 8, color: '#8B90A0', marginBottom: 2, lineHeight: 1.3 }}>{l}</div>
                          <div style={{ fontSize: 12, fontWeight: 800, color: c }}>{v}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Balance chart */}
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#1A1F36', marginBottom: 6 }}>Evolução do saldo devedor</div>
                  <AreaChart
                    data={sched.filter((_,i) => i % Math.max(1,Math.floor(sched.length/10)) === 0 || i === sched.length-1).map(r => ({label: r.month+'m', value: r.balance}))}
                    width={320} height={90} color="#EF4444"
                  />
                </div>

                {/* Amortization table — first 6 months */}
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#1A1F36', marginBottom: 6 }}>Tabela de amortização</div>
                  <div style={{ background: '#F7F8FA', borderRadius: 10, overflow: 'hidden' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 1fr 1fr', padding: '7px 10px', background: '#ECEEF4' }}>
                      {['Mês','Juros','Amort.','Saldo'].map(h => (
                        <div key={h} style={{ fontSize: 9, fontWeight: 700, color: '#8B90A0', textTransform: 'uppercase' }}>{h}</div>
                      ))}
                    </div>
                    {sched.slice(0, 8).map((row, i) => (
                      <div key={i} style={{ display: 'grid', gridTemplateColumns: '40px 1fr 1fr 1fr', padding: '7px 10px', background: i%2===0?'#fff':'#FAFBFC', borderTop: '1px solid #F4F5F8' }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#8B90A0' }}>{row.month}</div>
                        <div style={{ fontSize: 11, color: '#DC2626', fontWeight: 600 }}>{fmt(row.juros,{short:true})}</div>
                        <div style={{ fontSize: 11, color: '#16A34A', fontWeight: 600 }}>{fmt(row.amort,{short:true})}</div>
                        <div style={{ fontSize: 11, color: '#1A1F36', fontWeight: 700 }}>{fmt(row.balance,{short:true})}</div>
                      </div>
                    ))}
                    <div style={{ padding: '7px 10px', background: '#EFF6FF', borderTop: '1.5px solid #BFDBFE' }}>
                      <div style={{ fontSize: 10, color: '#2563EB', fontWeight: 600 }}>Mostrando 8 de {sched.length} parcelas</div>
                    </div>
                  </div>
                </div>

                {/* Totals */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[
                    ['Total de juros',    fmt(interestNew,{short:true}),  '#DC2626'],
                    ['Total amortizado',  fmt(f.balance,{short:true}),    '#16A34A'],
                    ['CET',              f.cet+'% a.a.',                  '#8B90A0'],
                    ['Parcelas restantes', sched.length + ' meses',       '#2563EB'],
                  ].map(([l,v,c]) => (
                    <div key={l} style={{ background: '#F7F8FA', borderRadius: 10, padding: '9px 10px' }}>
                      <div style={{ fontSize: 9, color: '#8B90A0', marginBottom: 2 }}>{l}</div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: c }}>{v}</div>
                    </div>
                  ))}
                </div>

              </div>
            )}
          </Card>
        );
      })}
    </>
  );
}

export { PlanejamentoScreen, PatrimonioScreen, MaisScreen, FinanciamentosContent };
