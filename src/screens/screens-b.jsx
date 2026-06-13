import React from 'react';
import { fmt } from '../data.js';
import { useFinance, useInvestments, useGoals, useBudget } from '../hooks/useFinance.jsx';
import { AreaChart, DonutChart, ChartBox } from '../components/charts.jsx';
import { Card, Tag } from './screens-a.jsx';
import { OrcadoVsRealizado } from './screens-analise.jsx';
import { SyncBadge } from '../components/navigation.jsx';
import { InstallPrompt } from '../components/InstallPrompt.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { repasseMonthIndex, budgetLabelToKey, currentMonthKey } from '../lib/dates.js';
import { downloadExport, downloadBackup, pickAndImportFile } from '../api/backup.js';
import { useQueryClient } from '@tanstack/react-query';
import { processQueue } from '../api/client.js';
import { useSyncStatus } from '../hooks/useSyncStatus.jsx';
import { toast } from '../lib/toast.js';
import { netWorthDelta12m, formatNetWorthDelta } from '../lib/sparklines.js';
// screens-b.jsx — Planejamento + Patrimônio + Mais

/* ── Planejamento ───────────────────────────────────── */
function PlanejamentoScreen({ transactions }) {
  const d = useFinance();
  const { update: updateBudget } = useBudget();
  const [mode,         setMode]         = React.useState('realista');
  const [expandedIdx,  setExpandedIdx]  = React.useState(null);
  const [viewMode,     setViewMode]     = React.useState('plan');
  const [budgetEdit,   setBudgetEdit]   = React.useState({});

  const multiplier = { realista: 1, conservador: 0.82, otimista: 1.18 }[mode];

  const planMonths = d.planning.map(m => ({
    ...m,
    income:  Math.round(m.income  * multiplier),
    expense: Math.round(m.expense * multiplier),
  }));
  const currentMonthKeyVal = currentMonthKey();
  const firstPlan = planMonths[0]?.month;
  const lastPlan = planMonths[planMonths.length - 1]?.month;
  const chartFirst = d.planningChart36[0]?.label;
  const chartLast = d.planningChart36[d.planningChart36.length - 1]?.label;

  // Events breakdown for detail view
  const pjIncomes  = d.monthlyEvents.filter(e => e.entity === 'PJ' && e.type === 'income');
  const pjExpenses = d.monthlyEvents.filter(e => e.entity === 'PJ' && e.type === 'expense');
  const pfIncomes  = d.monthlyEvents.filter(e => e.entity === 'PF' && e.type === 'income');
  const pfExpenses = d.monthlyEvents.filter(e => e.entity === 'PF' && e.type === 'expense');

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: 'var(--bg-app)', fontFamily: 'DM Sans, system-ui' }}>
      <div style={{ padding: 'var(--pad-top) var(--pad-x) var(--pad-bottom)', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Header */}
        <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>Planejamento</div>

        {/* View toggle */}
        <div style={{ display: 'flex', background: 'var(--bg-toggle)', borderRadius: 12, padding: 3, gap: 2 }}>
          {[['plan','Meses'], ['orcado','Orçado vs. Real']].map(([k, l]) => (
            <button key={k} onClick={() => setViewMode(k)} style={{ flex:1, padding:'8px 4px', borderRadius:9, border:'none', cursor:'pointer', background: viewMode===k ? 'var(--bg-card)' : 'transparent', color: viewMode===k ? '#1A1F36' : 'var(--text-muted)', fontWeight: viewMode===k ? 700 : 500, fontSize:13, fontFamily:'DM Sans, system-ui', boxShadow: viewMode===k ? '0 1px 4px rgba(26,31,54,0.1)' : 'none', transition:'all 0.2s ease' }}>{l}</button>
          ))}
        </div>

        {viewMode === 'orcado' && <OrcadoVsRealizado transactions={transactions}/>}
        {viewMode === 'plan' && <>

        {/* Mode selector */}
        <div style={{ display: 'flex', background: 'var(--bg-toggle)', borderRadius: 14, padding: 3, gap: 2 }}>
          {[['realista','Realista'],['conservador','Conservador'],['otimista','Otimista']].map(([k, label]) => (
            <button key={k} onClick={() => setMode(k)} style={{
              flex: 1, padding: '8px 4px', borderRadius: 11, border: 'none', cursor: 'pointer',
              background: mode === k ? 'var(--bg-card)' : 'transparent',
              color: mode === k ? '#1A1F36' : 'var(--text-muted)',
              fontWeight: mode === k ? 700 : 500,
              fontSize: 13, fontFamily: 'DM Sans, system-ui',
              boxShadow: mode === k ? '0 1px 4px rgba(26,31,54,0.1)' : 'none',
              transition: 'all 0.2s ease',
            }}>{label}</button>
          ))}
        </div>

        {/* 36-month projection chart */}
        <Card style={{ padding: '16px 12px 10px' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>
            Projeção 36 meses — Sobras mensais
          </div>
          <ChartBox height={110}>
            {(w, h) => (
              <AreaChart
                data={d.planningChart36.map(d2 => ({ ...d2, value: d2.value * multiplier }))}
                width={w} height={h} color="#16A34A"
              />
            )}
          </ChartBox>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{chartFirst || firstPlan || 'Início'}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{chartLast || lastPlan || 'Fim'}</div>
          </div>
        </Card>

        {/* Month cards */}
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          {planMonths.length} meses {firstPlan && lastPlan ? `(${firstPlan} → ${lastPlan})` : ''}
        </div>

        {planMonths.map((m, i) => {
          const sobra = m.income - m.expense;
          const pct = Math.round((sobra / m.income) * 100);
          const isCurrent = budgetLabelToKey(m.month) === currentMonthKeyVal;
          const isExpanded = expandedIdx === i;
          return (
            <Card key={i} style={{
              padding: '16px 18px',
              border: isCurrent ? '1.5px solid #2563EB' : '1.5px solid transparent',
              position: 'relative',
              cursor: 'pointer',
            }} onClick={() => setExpandedIdx(isExpanded ? null : i)}>
              {isCurrent && (
                <div style={{ position: 'absolute', top: 0, right: 0, background: '#2563EB', color: 'var(--text-inverse)', fontSize: 9, fontWeight: 700, padding: '3px 10px', borderBottomLeftRadius: 8 }}>ATUAL</div>
              )}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{m.month}</div>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                    <path d="M3 5L7 9L11 5" stroke="#8B90A0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: sobra >= 0 ? '#16A34A' : '#DC2626' }}>
                  {sobra >= 0 ? '+' : '-'}{fmt(sobra)} <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)' }}>({pct}%)</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1, background: '#F0FDF4', borderRadius: 10, padding: '8px 12px' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>Receitas</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#16A34A' }}>{fmt(m.income)}</div>
                </div>
                <div style={{ flex: 1, background: '#FEF2F2', borderRadius: 10, padding: '8px 12px' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>Despesas</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#DC2626' }}>{fmt(m.expense)}</div>
                </div>
              </div>
              <div style={{ marginTop: 10 }}>
                <div style={{ height: 4, background: 'var(--bg-subtle)', borderRadius: 2, overflow: 'hidden' }}>
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
                          <span style={{ fontSize: 12, color: 'var(--text-primary)' }}>{e.desc}</span>
                          <span style={{ fontSize: 12, fontWeight: 600, color: '#16A34A' }}>+{fmt(e.value)}</span>
                        </div>
                      ))}
                      {expItems.map((e, ei) => (
                        <div key={`exp${ei}`} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                          <span style={{ fontSize: 12, color: 'var(--text-primary)' }}>{e.desc}</span>
                          <span style={{ fontSize: 12, fontWeight: 600, color: '#DC2626' }}>-{fmt(e.value)}</span>
                        </div>
                      ))}
                    </div>
                  ))}

                  <div style={{ background: 'var(--bg-app)', borderRadius: 10, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 7 }}>
                    {[
                      ['Repasse PJ->PF',    fmt(m.repasse),  '#2563EB'],
                      ['Aplicacao CDB PJ',  fmt(m.aplicPJ),  '#7C3AED'],
                      ['Aplicacao CDB PF',  fmt(m.aplicPF),  '#7C3AED'],
                      ['Saldo projetado',   fmt(m.saldo),    '#16A34A'],
                    ].map(([lbl, val, col]) => (
                      <div key={lbl} style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{lbl}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: col }}>{val}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 8 }}>
                      Editar orçamento
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {[
                        ['Receita PJ', 'pjInc'],
                        ['Receita PF', 'pfInc'],
                        ['Repasse', 'repasse'],
                        ['Saldo PJ', 'pjSaldo'],
                        ['Saldo PF', 'pfSaldo'],
                        ['Aplic. PJ', 'aplicPJ'],
                        ['Aplic. PF', 'aplicPF'],
                      ].map(([lbl, key]) => {
                        const raw = d.monthlyBudget[i];
                        const val = budgetEdit[i]?.[key] ?? raw?.[key] ?? '';
                        return (
                          <label key={key} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{lbl}</span>
                            <input
                              type="number"
                              value={val}
                              onChange={(e) => {
                                const n = Number(e.target.value);
                                setBudgetEdit((prev) => ({
                                  ...prev,
                                  [i]: { ...prev[i], [key]: Number.isFinite(n) ? n : 0 },
                                }));
                              }}
                              style={{
                                padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)',
                                fontSize: 12, fontFamily: 'DM Sans, system-ui', color: 'var(--text-primary)',
                                background: 'var(--bg-card)', width: '100%', boxSizing: 'border-box',
                              }}
                            />
                          </label>
                        );
                      })}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const patch = budgetEdit[i];
                        if (!patch) return;
                        updateBudget.mutate({ month: m.month, patch }, {
                          onSuccess: () => setBudgetEdit((prev) => { const n = { ...prev }; delete n[i]; return n; }),
                        });
                      }}
                      disabled={!budgetEdit[i] || updateBudget.isPending}
                      style={{
                        width: '100%', marginTop: 10, padding: '10px', borderRadius: 10, border: 'none',
                        background: '#2563EB', color: 'var(--text-inverse)', fontSize: 12, fontWeight: 700,
                        cursor: 'pointer', fontFamily: 'DM Sans, system-ui',
                        opacity: (!budgetEdit[i] || updateBudget.isPending) ? 0.6 : 1,
                      }}
                    >
                      {updateBudget.isPending ? 'Salvando…' : 'Salvar mês'}
                    </button>
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
  const { update: updateGoal } = useGoals();
  const { update: updateInvestment } = useInvestments();
  const [subTab,  setSubTab]  = React.useState('overview');
  const [expInv,  setExpInv]  = React.useState(null);
  const [expGoal, setExpGoal] = React.useState(null);
  const [goalEdit, setGoalEdit] = React.useState({});
  const [invEdit, setInvEdit] = React.useState({});
  const rmf = (ret) => Math.pow(1 + ret/100, 1/12) - 1;
  const proj = (inv, n) => { const rm = rmf(inv.ret); return Math.round(inv.value * Math.pow(1+rm,n) + inv.monthly*(Math.pow(1+rm,n)-1)/rm); };
  const rg  = Math.pow(1 + 12.68/100, 1/12) - 1;

  const imovelGoal = d.goals?.find((g) => g.name?.includes('Imóvel'));
  const totalFinDebt = (d.financingList || []).reduce((s, f) => s + (f.balance || 0), 0);

  const nwDelta = netWorthDelta12m(d.netWorthHistory);
  const nwDeltaLabel = formatNetWorthDelta(nwDelta);

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
    <div style={{ height: '100%', overflowY: 'auto', background: 'var(--bg-app)', fontFamily: 'DM Sans, system-ui' }}>
      <div style={{ padding: 'var(--pad-top) var(--pad-x) var(--pad-bottom)', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Header */}
        <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>Patrimônio</div>

        {/* Sub-tabs */}
        <div style={{ display: 'flex', gap: 8 }}>
          {[['overview','Visão Geral'],['invest','Investimentos'],['goals','Metas'],['financ','Financiamentos']].map(([k,l]) => (
            <button key={k} onClick={() => setSubTab(k)} style={{
              padding: '7px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
              background: subTab === k ? '#1A1F36' : 'var(--bg-card)',
              color: subTab === k ? 'var(--text-inverse)' : 'var(--text-muted)',
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
              <div style={{ fontSize: 30, fontWeight: 800, color: 'var(--text-inverse)', letterSpacing: '-0.5px', marginBottom: 4 }}>
                {fmt(d.netWorth)}
              </div>
              {nwDeltaLabel && (
                <div style={{ fontSize: 12, color: nwDelta >= 0 ? '#86EFAC' : '#FCA5A5', fontWeight: 500 }}>
                  {nwDeltaLabel}
                </div>
              )}
            </div>

            {/* Long-term chart */}
            <Card style={{ padding: '16px 12px 10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Projeção até 2040</div>
                <Tag label="Meta R$3M" color="#F59E0B" bg="#FFFBEB"/>
              </div>
              <ChartBox height={130}>
                {(w, h) => <AreaChart data={d.wealthForecast} width={w} height={h} goalValue={3000000} goalLabel="R$3M"/>}
              </ChartBox>
            </Card>

            {/* Breakdown — Donut + lista */}
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Composição</div>
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
                        <div style={{ flex: 1, fontSize: 11, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.label}</div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>{pct}%</div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: b.value < 0 ? '#DC2626' : 'var(--text-primary)', minWidth: 52, textAlign: 'right' }}>
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
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 8 }}>Pessoa {label === 'PF' ? 'F\u00edsica' : 'Jur\u00eddica'}</div>
                  <Card style={{ padding: '4px 6px' }}>
                    {items.map((inv, i) => {
                      const invKey = label + i;
                      const isExp = expInv === invKey;
                      return (
                        <div key={i}>
                          {i > 0 && <div style={{ height: 1, background: 'var(--divider)', margin: '0 12px' }}/>}
                          <div onClick={() => setExpInv(isExp ? null : invKey)} style={{ padding: isExp ? '11px 12px 4px' : '11px 12px', cursor: 'pointer' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{ width: 36, height: 36, borderRadius: 10, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <span style={{ fontSize: 11, fontWeight: 800, color }}>{inv.name.slice(0,2).toUpperCase()}</span>
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{inv.name}</div>
                                  {inv._pending && <Tag label="Aguardando sync" color="#F59E0B" bg="#FFFBEB"/>}
                                </div>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>+R$ {inv.monthly.toLocaleString('pt-BR')}/m\u00eas</div>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{fmt(inv.value, { short: true })}</div>
                                <div style={{ fontSize: 11, color: '#16A34A', fontWeight: 500 }}>{inv.ret}% a.a.</div>
                              </div>
                            </div>
                            {isExp && (
                              <div style={{ margin: '10px 0 8px', padding: '12px', background: 'var(--bg-app)', borderRadius: 10 }} onClick={e => e.stopPropagation()}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Proje\u00e7\u00e3o de crescimento</div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 10 }}>
                                  {[[12,'1 ano'],[24,'2 anos'],[60,'5 anos']].map(([m, lbl]) => (
                                    <div key={m} style={{ background: 'var(--bg-card)', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
                                      <div style={{ fontSize: 9, color: 'var(--text-muted)', marginBottom: 2 }}>{lbl}</div>
                                      <div style={{ fontSize: 13, fontWeight: 800, color }}>{fmt(proj(inv, m), { short: true })}</div>
                                    </div>
                                  ))}
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>
                                  <span>Aporte: <strong style={{ color: 'var(--text-primary)' }}>{fmt(inv.monthly)}/m\u00eas</strong></span>
                                  <span>Rendimento: <strong style={{ color: '#16A34A' }}>{inv.ret}% a.a.</strong></span>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 10 }}>
                                  {[
                                    ['Saldo atual', 'value'],
                                    ['Aporte/mês', 'monthly'],
                                    ['Retorno %', 'ret'],
                                  ].map(([lbl, fieldKey]) => (
                                    <label key={fieldKey} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                      <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>{lbl}</span>
                                      <input
                                        type="number"
                                        value={invEdit[invKey]?.[fieldKey] ?? inv[fieldKey]}
                                        onChange={(e) => {
                                          const n = Number(e.target.value);
                                          setInvEdit((prev) => ({
                                            ...prev,
                                            [invKey]: { ...prev[invKey], [fieldKey]: Number.isFinite(n) ? n : 0 },
                                          }));
                                        }}
                                        style={{
                                          padding: '7px 8px', borderRadius: 8, border: '1px solid var(--border)',
                                          fontSize: 11, fontFamily: 'DM Sans, system-ui', color: 'var(--text-primary)',
                                          background: 'var(--bg-card)', width: '100%', boxSizing: 'border-box',
                                        }}
                                      />
                                    </label>
                                  ))}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const patch = invEdit[invKey];
                                    if (!patch) return;
                                    updateInvestment.mutate({ id: slugify(inv.name), patch }, {
                                      onSuccess: () => setInvEdit((prev) => { const n = { ...prev }; delete n[invKey]; return n; }),
                                    });
                                  }}
                                  disabled={!invEdit[invKey] || updateInvestment.isPending}
                                  style={{
                                    width: '100%', marginBottom: 10, padding: '9px', borderRadius: 10, border: 'none',
                                    background: color, color: 'var(--text-inverse)', fontSize: 12, fontWeight: 700,
                                    cursor: 'pointer', fontFamily: 'DM Sans, system-ui',
                                    opacity: (!invEdit[invKey] || updateInvestment.isPending) ? 0.6 : 1,
                                  }}
                                >
                                  {updateInvestment.isPending ? 'Salvando…' : 'Salvar investimento'}
                                </button>
                                <ChartBox height={65}>
                                  {(w, h) => (
                                    <AreaChart data={[0,6,12,18,24].map(m => ({ label: m+'m', value: proj(inv, m) }))} width={w} height={h} color={color}/>
                                  )}
                                </ChartBox>
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
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Proje\u00e7\u00e3o de Independ\u00eancia</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10 }}>Meta de R$ 3 milh\u00f5es em 2029</div>
                <ChartBox height={120}>
                  {(w, h) => <AreaChart data={d.wealthForecast} width={w} height={h} goalValue={3000000} goalLabel="Independ\u00eancia"/>}
                </ChartBox>
              </Card>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Objetivos</div>
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
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>{g.name}</div>
                        {g._pending && <Tag label="Aguardando sync" color="#F59E0B" bg="#FFFBEB"/>}
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Previs\u00e3o: {g.year}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 15, fontWeight: 800, color: '#2563EB' }}>{Math.round(pct)}%</div>
                        <div style={{ fontSize: 9, color: 'var(--text-faint)', marginTop: 1 }}>\u25be detalhes</div>
                      </div>
                    </div>
                    <div style={{ height: 7, background: 'var(--bg-subtle)', borderRadius: 4, overflow: 'hidden', marginBottom: 8 }}>
                      <div style={{ width: pct+'%', height: '100%', background: 'linear-gradient(90deg,#2563EB,#60A5FA)', borderRadius: 4, transition: 'width 0.6s ease' }}/>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)', marginBottom: isExp ? 12 : 0 }}>
                      <span>Atual: <strong style={{ color: 'var(--text-primary)' }}>{fmt(g.current, { short: true })}</strong></span>
                      <span>Faltam: <strong style={{ color: '#DC2626' }}>{fmt(missing, { short: true })}</strong></span>
                      <span>Meta: <strong style={{ color: 'var(--text-primary)' }}>{fmt(g.target, { short: true })}</strong></span>
                    </div>
                    {isExp && (
                      <div style={{ borderTop: '1.5px solid var(--divider)', paddingTop: 12 }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                          {[['Aporte p/ atingir', fmt(mneed)+'/m\u00eas'], ['Anos restantes', (g.year-2026)+' anos'], ['Rendimento', '12,68% a.a.'], ['Falta acumular', fmt(missing,{short:true})]].map(([l,v]) => (
                            <div key={l} style={{ background: 'var(--bg-app)', borderRadius: 10, padding: '8px 10px' }}>
                              <div style={{ fontSize: 9, color: 'var(--text-muted)', marginBottom: 2 }}>{l}</div>
                              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{v}</div>
                            </div>
                          ))}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                          {[['Valor atual (R$)', 'current'], ['Meta (R$)', 'target']].map(([lbl, field]) => (
                            <div key={field}>
                              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>{lbl}</div>
                              <input
                                type="number"
                                defaultValue={g[field]}
                                onChange={(e) => setGoalEdit((prev) => ({
                                  ...prev,
                                  [i]: { ...(prev[i] || {}), [field]: Number(e.target.value) || 0 },
                                }))}
                                style={{ width: '100%', padding: '8px 10px', borderRadius: 9, border: '1.5px solid var(--border)', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', background: 'var(--bg-card)', outline: 'none', fontFamily: 'DM Sans, system-ui', boxSizing: 'border-box' }}
                              />
                            </div>
                          ))}
                        </div>
                        <button
                          onClick={() => {
                            const patch = goalEdit[i];
                            if (!patch) return;
                            updateGoal.mutate({ id: slugify(g.name), patch });
                            setGoalEdit((prev) => { const n = { ...prev }; delete n[i]; return n; });
                          }}
                          disabled={!goalEdit[i] || updateGoal.isPending}
                          style={{ width: '100%', padding: '10px', borderRadius: 10, border: 'none', background: '#2563EB', color: 'var(--text-inverse)', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans, system-ui', marginBottom: 12, opacity: (!goalEdit[i] || updateGoal.isPending) ? 0.6 : 1 }}
                        >
                          {updateGoal.isPending ? 'Salvando…' : 'Salvar meta'}
                        </button>
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>Trajet\u00f3ria projetada</div>
                        <ChartBox height={80}>
                          {(w, h) => <AreaChart data={projData} width={w} height={h} color="#2563EB" goalValue={g.target} goalLabel="Meta"/>}
                        </ChartBox>
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
  const { pending, online } = useSyncStatus();
  const [manualSync, setManualSync] = React.useState(false);
  const currentIdx = repasseMonthIndex(repasse);
  const repasseMonth = repasse?.months?.[currentIdx];
  const repasseDesc  = repasseMonth
    ? `${fmt(repasseMonth.amount)}/mês · ${repasseMonth.done ? 'Realizado' : 'Pendente'}`
    : 'Controle de retiradas PJ→PF';

  const lastBackup = localStorage.getItem('fin_last_backup');
  const backupDesc = lastBackup
    ? `Último: ${new Date(lastBackup).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}`
    : 'Nenhum backup neste dispositivo';

  const syncDesc = !online
    ? 'Sem conexão · dados em cache'
    : manualSync
      ? 'Sincronizando…'
      : pending > 0
        ? `${pending} alteração${pending > 1 ? 'ões' : ''} pendente${pending > 1 ? 's' : ''}`
        : 'Toque para atualizar dados';

  const refreshAll = () => {
    qc.invalidateQueries();
  };

  const handleSync = async () => {
    setManualSync(true);
    try {
      await processQueue();
      refreshAll();
      toast.success(pending > 0 ? 'Sincronização concluída' : 'Dados atualizados');
    } catch (e) {
      toast.error(e?.message || 'Falha na sincronização');
    } finally {
      setManualSync(false);
    }
  };

  const handleImport = () => {
    pickAndImportFile(() => {
      refreshAll();
      toast.success('Dados importados com sucesso');
    });
  };

  const handleExport = async () => {
    try {
      await downloadExport();
      toast.success('Exportação concluída');
    } catch (e) {
      toast.error(e.message || 'Falha ao exportar');
    }
  };

  const handleBackup = async () => {
    try {
      await downloadBackup();
      refreshAll();
      toast.success('Backup criado');
    } catch (e) {
      toast.error(e.message || 'Falha ao criar backup');
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
        { icon: '⇄', label: 'Sincronização', desc: syncDesc, action: handleSync },
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
    <div style={{ height: '100%', overflowY: 'auto', background: 'var(--bg-app)', fontFamily: 'DM Sans, system-ui' }}>
      <div style={{ padding: 'var(--pad-top) var(--pad-x) var(--pad-bottom)', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Header */}
        <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>Mais</div>

        <InstallPrompt />

        {/* Profile card */}
        <Card style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            background: 'linear-gradient(135deg, #2563EB, #7C3AED)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, fontWeight: 700, color: 'var(--text-inverse)',
          }}>{initial}</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{displayName}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{displayEmail} · {user?.plan === 'pro' ? 'Plano Completo' : 'Plano Básico'}</div>
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
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>Encerrar sessão neste dispositivo</div>
            </div>
          </div>
        </Card>

        {/* Sections */}
        {sections.map((sec, si) => (
          <div key={si}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 8, paddingLeft: 4 }}>
              {sec.title}
            </div>
            <Card style={{ padding: '4px 6px' }}>
              {sec.items.map((item, ii) => (
                <div key={ii}>
                  {ii > 0 && <div style={{ height: 1, background: 'var(--divider)', margin: '0 12px' }}/>}
                  <div onClick={item.action || (item.comingSoon ? undefined : item.action)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 12px', cursor: item.action ? 'pointer' : 'default', opacity: item.comingSoon ? 0.55 : 1 }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: 9, background: 'var(--bg-subtle)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 15, color: 'var(--text-primary)', flexShrink: 0,
                    }}>{item.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{item.label}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{item.desc}</div>
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
        <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-faint)', paddingTop: 8 }}>
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
        <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-inverse)', letterSpacing: '-0.5px', marginBottom: 12 }}>{fmt(totalDebt)}</div>
        <div style={{ display: 'flex', gap: 0 }}>
          {[['Parcelas/mês', fmt(totalPmt)],['Contratos', String(list.length)],['Venc. mais próx.', '2027']].map(([l,v],i) => (
            <React.Fragment key={l}>
              {i > 0 && <div style={{ width: 1, background: 'rgba(255,255,255,0.18)', margin: '0 12px' }}/>}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 9, color: '#FECACA', textTransform: 'uppercase' }}>{l}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-inverse)', marginTop: 2 }}>{v}</div>
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
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{f.bank}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{f.cat} · {f.entity} · CET {f.cet}% a.a.</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#DC2626' }}>{fmt(f.balance, {short:true})}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{fmt(f.installment)}/mês</div>
                </div>
              </div>
              {/* Progress */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1, height: 5, background: 'var(--bg-subtle)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: pctPaid+'%', height: '100%', background: '#86EFAC', borderRadius: 3 }}/>
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#16A34A', flexShrink: 0 }}>{pctPaid}% pago</span>
                <span style={{ fontSize: 10, color: 'var(--text-muted)', flexShrink: 0 }}>até {f.endYear}</span>
              </div>
            </div>

            {/* Expanded drill-down */}
            {isExp && (
              <div style={{ borderTop: '1.5px solid #F4F5F8', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>

                {/* Simulator */}
                <div style={{ background: 'var(--bg-app)', borderRadius: 12, padding: '12px 14px' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Simulador de amortização extra</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>+R$</div>
                    <input
                      value={extra === 0 ? '' : extra}
                      onChange={e => setExtraPmt(prev => ({...prev, [f.id]: Number(e.target.value.replace(/D/g,''))||0}))}
                      placeholder="0"
                      inputMode="numeric"
                      style={{ flex: 1, padding: '8px 10px', borderRadius: 9, border: '1.5px solid var(--border)', fontSize: 14, fontWeight: 700, color: '#2563EB', background: 'var(--bg-card)', outline: 'none', fontFamily: 'DM Sans, system-ui' }}
                    />
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>extra/mês</div>
                  </div>

                  {extra > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                      {[
                        ['Meses economiz.', monthsSaved + ' meses', '#2563EB'],
                        ['Juros economiz.', fmt(interestSaved,{short:true}), '#16A34A'],
                        ['Novo prazo',      sched.length + ' meses', '#7C3AED'],
                      ].map(([l,v,c]) => (
                        <div key={l} style={{ background: 'var(--bg-card)', borderRadius: 8, padding: '8px 6px', textAlign: 'center' }}>
                          <div style={{ fontSize: 8, color: 'var(--text-muted)', marginBottom: 2, lineHeight: 1.3 }}>{l}</div>
                          <div style={{ fontSize: 12, fontWeight: 800, color: c }}>{v}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Balance chart */}
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>Evolução do saldo devedor</div>
                  <AreaChart
                    data={sched.filter((_,i) => i % Math.max(1,Math.floor(sched.length/10)) === 0 || i === sched.length-1).map(r => ({label: r.month+'m', value: r.balance}))}
                    width={320} height={90} color="#EF4444"
                  />
                </div>

                {/* Amortization table — first 6 months */}
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>Tabela de amortização</div>
                  <div style={{ background: 'var(--bg-app)', borderRadius: 10, overflow: 'hidden' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 1fr 1fr', padding: '7px 10px', background: 'var(--bg-toggle)' }}>
                      {['Mês','Juros','Amort.','Saldo'].map(h => (
                        <div key={h} style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{h}</div>
                      ))}
                    </div>
                    {sched.slice(0, 8).map((row, i) => (
                      <div key={i} style={{ display: 'grid', gridTemplateColumns: '40px 1fr 1fr 1fr', padding: '7px 10px', background: i%2===0?'var(--bg-card)':'var(--bg-subtle)', borderTop: '1px solid var(--divider)' }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>{row.month}</div>
                        <div style={{ fontSize: 11, color: '#DC2626', fontWeight: 600 }}>{fmt(row.juros,{short:true})}</div>
                        <div style={{ fontSize: 11, color: '#16A34A', fontWeight: 600 }}>{fmt(row.amort,{short:true})}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-primary)', fontWeight: 700 }}>{fmt(row.balance,{short:true})}</div>
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
                    <div key={l} style={{ background: 'var(--bg-app)', borderRadius: 10, padding: '9px 10px' }}>
                      <div style={{ fontSize: 9, color: 'var(--text-muted)', marginBottom: 2 }}>{l}</div>
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
