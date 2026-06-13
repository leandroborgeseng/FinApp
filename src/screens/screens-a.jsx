import React from 'react';
import { fmt, fmtDate } from '../data.js';
import { useFinance } from '../hooks/useFinance.jsx';
import { SparkLine, BarChart, AreaChart, DonutChart, ChartBox } from '../components/charts.jsx';
import { FluxoView } from './screens-c.jsx';
import { SyncBadge } from '../components/navigation.jsx';
import { InstallPrompt } from '../components/InstallPrompt.jsx';
import { currentMonthKey, findBudgetIndex, formatMonthLong, getTodayDay, budgetLabelToKey, repasseMonthIndex, repasseTotalDone, MONTH_LABELS } from '../lib/dates.js';
import { openingBalanceForMonth, buildMonthEntries, todayContextForMonth, balanceAtDay } from '../lib/balances.js';
import { buildDashboardSparks } from '../lib/sparklines.js';
// screens-a.jsx — Dashboard + Movimentos

/* ── shared tiny helpers ───────────────────────────── */
function Card({ children, style = {} }) {
  return (
    <div style={{
      background: 'var(--bg-card)', borderRadius: 18,
      padding: '16px 18px',
      boxShadow: 'var(--shadow-card)',
      ...style,
    }}>
      {children}
    </div>
  );
}

function Tag({ label, color = '#2563EB', bg = '#EFF6FF' }) {
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: 20,
      fontSize: 10, fontWeight: 700, color, background: bg,
      fontFamily: 'DM Sans, system-ui', letterSpacing: '0.03em',
    }}>{label}</span>
  );
}

/* ── Count-up hook ─────────────────────────────────── */
function useCountUp(target, duration = 1600) {
  const [value, setValue] = React.useState(0);
  React.useEffect(() => {
    let start = null;
    let rafId;
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 4); // ease-out quart
      setValue(Math.round(target * eased));
      if (p < 1) rafId = requestAnimationFrame(step);
    };
    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [target]);
  return value;
}

/* ── Dashboard ─────────────────────────────────────── */
function DashboardScreen({ onNewEntry, repasse, onShowRepasse, transactions, txActions, onNavToMovimentos, syncStatus }) {
  const d = useFinance();
  const animNetWorth = useCountUp(d.netWorth);
  const todayDay = getTodayDay();
  const monthKey = currentMonthKey();
  const currentMonthIdx = findBudgetIndex(d.monthlyBudget);
  const monthTitle = formatMonthLong();

  const confirmedKeys = React.useMemo(() => {
    const set = new Set();
    for (const tx of transactions || []) {
      if (tx.date?.startsWith(monthKey)) set.add(`${tx.desc}|${tx.date}`);
    }
    return set;
  }, [transactions, monthKey]);

  const confirmEvent = (e) => {
    const dateStr = `${monthKey}-${String(e.day).padStart(2, '0')}`;
    const key = `${e.desc}|${dateStr}`;
    if (confirmedKeys.has(key)) return;
    if (txActions) {
      txActions.create({
        type: e.type, desc: e.desc, value: e.value, entity: e.entity,
        date: dateStr, done: true, cat: e.cat,
      });
    }
  };

  const notifEvents = d.monthlyEvents
    .filter(e => e.day > todayDay && e.day <= todayDay + 3 && !confirmedKeys.has(`${e.desc}|${monthKey}-${String(e.day).padStart(2, '0')}`))
    .sort((a, b) => a.day - b.day);

  const upcoming = d.monthlyEvents
    .filter(e => e.day >= todayDay)
    .sort((a, b) => a.day - b.day)
    .slice(0, 4);

  const cdbNow   = d.cdbProjection[0];
  const cdbFinal = d.cdbProjection[d.cdbProjection.length - 1];

  // Repasse stats (new structure)
  const rMonths  = repasse?.months || [];
  const rMonthIdx = repasseMonthIndex(repasse);
  const rDone    = repasseTotalDone(rMonths);
  const rProj    = rMonths.reduce((s, m) => s + m.amount, 0);
  const rLimit   = repasse?.annualLimit || 600000;
  const rProjPct = Math.round(rProj / rLimit * 100);
  const rCurr    = rMonths[rMonthIdx];
  const rCurrAmt = rCurr?.amount ?? repasse?.amount ?? 34000;

  const todayBalance = balanceAtDay(d, {
    monthKey,
    monthIdx: currentMonthIdx,
    entityFilter: 'Todos',
    transactions,
  }, todayDay);
  const monthShort = MONTH_LABELS[new Date().getMonth()].toLowerCase();

  const sparks = React.useMemo(() => buildDashboardSparks(d), [d]);

  const statCards = [
    { label: 'PF Disponível',  value: d.pfAvailable,   color: '#16A34A', spark: sparks.pf,     nav: 'PF'   },
    { label: 'PJ Disponível',  value: d.pjAvailable,   color: '#2563EB', spark: sparks.pj,     nav: 'PJ'   },
    { label: 'Invest. PF',     value: d.pfInvestments, color: '#7C3AED', spark: sparks.investPf, nav: 'PF'   },
    { label: 'Invest. PJ',     value: d.pjInvestments, color: '#8B5CF6', spark: sparks.investPj, nav: 'PJ'   },
    { label: 'Dívidas',        value: -d.debts,        color: '#EF4444', spark: sparks.debts,  nav: 'Todos'},
    { label: 'Resultado/Mês',  value: d.monthResult,   color: '#16A34A', spark: sparks.monthResult, nav: 'Todos'},
  ];

  return (
    <div style={{ overflowY: 'auto', height: '100%', background: 'var(--bg-app)', fontFamily: 'DM Sans, system-ui' }}>
      <div style={{ padding: 'var(--pad-top) var(--pad-x) var(--pad-bottom)', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 2 }}>
          <div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 400 }}>{monthTitle}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>Visão geral</div>
          </div>
          <SyncBadge status={syncStatus || 'synced'}/>
        </div>

        <InstallPrompt compact />

        {/* Saldo de hoje */}
        <Card style={{ padding: '14px 16px', background: todayBalance < 0 ? '#FEF2F2' : 'var(--bg-card)', border: todayBalance < 0 ? '1.5px solid #FECACA' : undefined }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>
                Saldo disponível · hoje (dia {todayDay})
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: todayBalance < 0 ? '#DC2626' : 'var(--text-primary)', letterSpacing: '-0.5px' }}>
                {fmt(todayBalance)}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>PF + PJ</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#2563EB', cursor: 'pointer' }}
                onClick={() => onNavToMovimentos && onNavToMovimentos('Todos')}>
                Ver fluxo diário →
              </div>
            </div>
          </div>
        </Card>

        {/* Notification banners — events in next 3 days */}
        {notifEvents.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {notifEvents.map((e, i) => {
              const dLeft = e.day - todayDay;
              const isInc = e.type === 'income';
              const col   = isInc ? '#16A34A' : '#DC2626';
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  background: 'var(--bg-card)', borderRadius: 12, padding: '10px 14px',
                  border: `1px solid ${isInc ? '#DCFCE7' : '#FEE2E2'}`,
                  boxShadow: '0 1px 4px rgba(26,31,54,0.06)',
                }}>
                  <div style={{
                    fontSize: 9, fontWeight: 700, color: 'var(--text-inverse)', letterSpacing: '0.04em',
                    background: dLeft === 1 ? '#F59E0B' : col,
                    padding: '3px 7px', borderRadius: 6, flexShrink: 0,
                  }}>{dLeft === 1 ? 'AMANHÃ' : `+${dLeft}d`}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.desc}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{e.entity} · {e.cat}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: col }}>
                      {isInc ? '+' : '−'}{fmt(e.value)}
                    </div>
                    <button onClick={(ev) => { ev.stopPropagation(); confirmEvent(e); }} style={{
                      padding: '5px 9px', borderRadius: 7, border: 'none',
                      background: col, color: 'var(--text-inverse)', fontSize: 11, fontWeight: 700,
                      cursor: 'pointer', fontFamily: 'DM Sans, system-ui', lineHeight: 1,
                    }}>OK</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Hero card — net worth */}
        <div style={{
          background: 'linear-gradient(145deg, #1A1F36 0%, #253056 100%)',
          borderRadius: 22, padding: '20px 20px 18px', position: 'relative', overflow: 'hidden',
          boxShadow: '0 6px 24px rgba(26,31,54,0.22)',
        }}>
          <div style={{ position: 'absolute', right: -10, bottom: -8, opacity: 0.18, width: '55%', maxWidth: 200 }}>
            <ChartBox height={72}>
              {(w, h) => <SparkLine data={d.netWorthHistory} width={w} height={h} color="#60A5FA"/>}
            </ChartBox>
          </div>
          <div style={{ position: 'relative' }}>
            <div style={{ fontSize: 11, color: '#94A3CC', fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 6 }}>
              Patrimônio Líquido
            </div>
            <div style={{ fontSize: 34, fontWeight: 800, color: 'var(--text-inverse)', letterSpacing: '-0.5px', lineHeight: 1.1, marginBottom: 16 }}>
              {fmt(animNetWorth)}
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 9, color: '#94A3CC', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Próx. mês</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#86EFAC', marginTop: 2 }}>+{fmt(d.nextMonthForecast)}</div>
              </div>
              <div style={{ width: 1, height: 30, background: 'rgba(255,255,255,0.12)', margin: '0 12px' }}/>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 9, color: '#94A3CC', textTransform: 'uppercase', letterSpacing: '0.04em' }}>CDB este mês</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#86EFAC', marginTop: 2 }}>+{fmt(cdbNow.ret)}</div>
              </div>
              <div style={{ width: 1, height: 30, background: 'rgba(255,255,255,0.12)', margin: '0 12px' }}/>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 9, color: '#94A3CC', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Repasse</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#93C5FD', marginTop: 2 }}>{fmt(rCurrAmt)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Repasse PJ→PF summary card */}
        {onShowRepasse && rMonths.length > 0 && (
          <div onClick={onShowRepasse} style={{ cursor: 'pointer' }}>
            <Card style={{ padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Repasse PJ → PF</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{
                    fontSize: 11, fontWeight: 700,
                    color: rProjPct > 85 ? '#F59E0B' : '#2563EB',
                    background: rProjPct > 85 ? '#FFFBEB' : '#EFF6FF',
                    padding: '2px 8px', borderRadius: 8,
                  }}>{rProjPct}% do limite</span>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M4.5 2L8.5 6L4.5 10" stroke="#C4C7D4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
              <div style={{ position: 'relative', height: 6, background: 'var(--bg-subtle)', borderRadius: 3, overflow: 'hidden', marginBottom: 6 }}>
                <div style={{ position: 'absolute', inset: 0, width: `${Math.min(100, rProjPct)}%`, background: '#DBEAFE', borderRadius: 3 }}/>
                <div style={{ position: 'absolute', inset: 0, width: `${Math.min(100, rDone / rLimit * 100)}%`, background: '#2563EB', borderRadius: 3, transition: 'width 0.5s ease' }}/>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginBottom: 10 }}>
                <span>Realizado: <strong style={{ color: 'var(--text-primary)' }}>{fmt(rDone, { short: true })}</strong></span>
                <span>Projetado: <strong style={{ color: 'var(--text-primary)' }}>{fmt(rProj, { short: true })}</strong> / R$600k</span>
              </div>
              <div style={{ paddingTop: 10, borderTop: '1px solid #F4F5F8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {rCurr?.m || monthTitle.split(' ')[0]} · dia {repasse?.day || 5}
                  {rCurr?.done
                    ? <span style={{ color: '#16A34A', fontWeight: 600, marginLeft: 6 }}>✓ Realizado</span>
                    : <span style={{ color: '#F59E0B', fontWeight: 500, marginLeft: 6 }}>Pendente</span>}
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#2563EB' }}>{fmt(rCurrAmt)}</div>
              </div>
            </Card>
          </div>
        )}

        {/* CDB Acumulado card */}
        <Card style={{ padding: '16px 14px 12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>CDB Acumulado</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>Projeção 1%/mês · Jun/26 → Dez/28</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#7C3AED' }}>{fmt(cdbFinal.value, { short: true })}</div>
              <div style={{ fontSize: 10, color: '#16A34A', fontWeight: 600, marginTop: 1 }}>em Dez/28</div>
            </div>
          </div>
          <ChartBox height={100}>
            {(w, h) => (
              <AreaChart
                data={d.cdbProjection.map(c => ({ label: c.label.slice(0, 3), value: c.value }))}
                width={w} height={h} color="#7C3AED"
              />
            )}
          </ChartBox>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTop: '1px solid #F0F1F5' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Aplicação este mês</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>+{fmt(cdbNow.aplic)}</div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Rendimento este mês</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#16A34A' }}>+{fmt(cdbNow.ret)}</div>
          </div>
        </Card>

        {/* Taxa de poupança + composição do mês */}
        {(() => {
          const totalRec = d.monthlyEvents.filter(e => e.type === 'income').reduce((s,e) => s+e.value, 0);
          const totalDesp = d.monthlyEvents.filter(e => e.type === 'expense').reduce((s,e) => s+e.value, 0);
          const sobra = totalRec - totalDesp;
          const savePct = totalRec > 0 ? Math.round(sobra / totalRec * 100) : 0;
          const goalPct = 30;
          const onTrack = savePct >= goalPct;
          const segments = [
            { value: totalDesp, color: '#EF4444' },
            { value: Math.max(0, sobra), color: '#22C55E' },
          ];
          return (
            <Card style={{ padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ flexShrink: 0 }}>
                  <DonutChart size={72} thickness={12} segments={segments}/>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Taxa de Poupança</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: onTrack ? '#16A34A' : '#F59E0B' }}>{savePct}%</div>
                  </div>
                  <div style={{ height: 5, background: 'var(--bg-subtle)', borderRadius: 3, overflow: 'hidden', marginBottom: 6 }}>
                    <div style={{ width: `${Math.min(100, savePct)}%`, height: '100%', borderRadius: 3, background: onTrack ? '#22C55E' : '#F59E0B', transition: 'width 0.6s ease' }}/>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)' }}>
                    <span>Meta: <strong style={{ color: 'var(--text-primary)' }}>{goalPct}%</strong></span>
                    <span style={{ color: onTrack ? '#16A34A' : '#F59E0B', fontWeight: 600 }}>
                      {onTrack ? `+${savePct - goalPct}% acima` : `${goalPct - savePct}% abaixo`}
                    </span>
                    <span>Sobra: <strong style={{ color: 'var(--text-primary)' }}>{fmt(sobra, {short:true})}</strong></span>
                  </div>
                </div>
              </div>
            </Card>
          );
        })()}

        {/* 2×3 stat cards — cl icáveis → Movimentos */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {statCards.map((s, i) => (
            <Card key={i} style={{ padding: '13px 15px', cursor: 'pointer' }}
              onClick={() => onNavToMovimentos && onNavToMovimentos(s.nav)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500, marginBottom: 3, whiteSpace: 'nowrap' }}>{s.label}</div>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 2h6v6M2 8L8 2" stroke="#C4C7D4" strokeWidth="1.3" strokeLinecap="round"/></svg>
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: s.value < 0 ? '#DC2626' : 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                {s.value < 0 ? '−' : (i === 5 ? '+' : '')}{fmt(s.value)}
              </div>
              <div style={{ marginTop: 5, width: '100%' }}>
                <ChartBox height={22} minWidth={80}>
                  {(w, h) => <SparkLine data={s.spark} width={w} height={h} color={s.color}/>}
                </ChartBox>
              </div>
            </Card>
          ))}
        </div>

        {/* Cash flow chart */}
        <Card style={{ padding: '16px 14px 10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Fluxo de Caixa</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10, color: 'var(--text-muted)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: '#22C55E', display: 'inline-block' }}/>Rec.</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: '#EF4444', display: 'inline-block' }}/>Desp.</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><span style={{ width: 14, height: 2, borderTop: '2px dashed #2563EB', display: 'inline-block' }}/>Sobra</span>
            </div>
          </div>
          <ChartBox height={120}>
            {(w, h) => <BarChart data={d.cashFlow} width={w} height={h}/>}
          </ChartBox>
        </Card>

        {/* Próximos lançamentos */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 8, paddingLeft: 2 }}>
            Próximos lançamentos
          </div>
          <Card style={{ padding: '4px 4px' }}>
            {upcoming.map((e, i) => {
              const isInc = e.type === 'income';
              const col = isInc ? '#16A34A' : '#DC2626';
              const bg  = isInc ? '#F0FDF4' : '#FEF2F2';
              const dLeft = e.day - todayDay;
              return (
                <div key={i}>
                  {i > 0 && <div style={{ height: 1, background: 'var(--divider)', margin: '0 12px' }}/>}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px' }}>
                    <div style={{ width: 38, height: 38, borderRadius: 11, background: bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: col, lineHeight: 1 }}>{e.day}</span>
                      <span style={{ fontSize: 8, color: col, opacity: 0.7 }}>{monthShort}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.desc}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>
                        {dLeft === 0 ? 'Hoje' : `em ${dLeft} dia${dLeft !== 1 ? 's' : ''}`} · {e.entity}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: col }}>{isInc ? '+' : '−'}{fmt(e.value)}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>{e.cat}</div>
                      </div>
                      <button onClick={(ev) => { ev.stopPropagation(); confirmEvent(e); }} style={{
                        width: 32, height: 32, borderRadius: 9, border: 'none',
                        background: col, color: 'var(--text-inverse)', fontSize: 14, fontWeight: 700,
                        cursor: 'pointer', fontFamily: 'DM Sans, system-ui', lineHeight: 1, flexShrink: 0,
                      }}>✓</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </Card>
        </div>

      </div>
    </div>
  );
}

/* ── Fluxo Diário (sub-view) ───────────────────────── */
function FluxoDiarioView({ entityFilter, monthKey, monthIdx, transactions }) {
  const d = useFinance();
  const MB = d.monthlyBudget[monthIdx] || d.monthlyBudget[0];
  const { isCurrent, daysInMonth, todayDay } = todayContextForMonth(monthKey);
  const opening = openingBalanceForMonth(d, monthIdx, entityFilter);

  const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const [y, m] = monthKey.split('-').map(Number);
  const monthIndex0 = m - 1;

  const allEntries = buildMonthEntries(d, { monthKey, entityFilter, transactions });

  let running = opening;
  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const date = `${monthKey}-${String(day).padStart(2, '0')}`;
    const dayEntries = allEntries.filter((e) => e.date === date);
    const dayInc = dayEntries.filter((e) => e.type === 'income').reduce((s, e) => s + e.value, 0);
    const dayExp = dayEntries.filter((e) => e.type === 'expense').reduce((s, e) => s + e.value, 0);
    running += dayInc - dayExp;
    const weekday = WEEKDAYS[new Date(y, monthIndex0, day).getDay()];
    const isPast = isCurrent ? day < todayDay : monthKey < currentMonthKey();
    const isToday = isCurrent && day === todayDay;
    const isFuture = !isPast && !isToday;
    return { day, date, dayEntries, dayInc, dayExp, balAfter: running, weekday, isPast, isToday, isFuture };
  });

  const futureDays = days.filter((d) => d.isFuture || d.isToday);
  const worstDay = futureDays.reduce((w, d) => (!w || d.balAfter < w.balAfter) ? d : w, null);
  const dangerDays = futureDays.filter((d) => d.balAfter < 0);
  const warnDays = futureDays.filter((d) => d.balAfter >= 0 && d.balAfter < opening * 0.15);

  const [expandedDay, setExpandedDay] = React.useState(null);

  const balColor = (bal) => bal < 0 ? '#DC2626' : bal < opening * 0.15 ? '#F59E0B' : '#16A34A';
  const balBg = (bal) => bal < 0 ? '#FEF2F2' : bal < opening * 0.15 ? '#FFFBEB' : '#F0FDF4';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

      <div style={{ background: 'linear-gradient(135deg,#1A1F36,#253056)', borderRadius: 16, padding: '14px 16px', boxShadow: '0 4px 14px rgba(26,31,54,0.18)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 9, color: '#94A3CC', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Saldo de abertura · {entityFilter} · {MB.m}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-inverse)' }}>{fmt(opening)}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 9, color: '#94A3CC', textTransform: 'uppercase', marginBottom: 2 }}>Saldo final projetado</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: balColor(days[days.length - 1]?.balAfter || 0) }}>{fmt(days[days.length - 1]?.balAfter || 0)}</div>
          </div>
        </div>
        {isCurrent && (
          <div style={{ display: 'flex', gap: 10 }}>
            {dangerDays.length > 0 && (
              <div style={{ flex: 1, background: '#DC262620', borderRadius: 8, padding: '6px 10px' }}>
                <div style={{ fontSize: 9, color: '#FCA5A5' }}>Dias negativos</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#FCA5A5' }}>{dangerDays.length} dias</div>
              </div>
            )}
            {worstDay && (
              <div style={{ flex: 1, background: '#F59E0B20', borderRadius: 8, padding: '6px 10px' }}>
                <div style={{ fontSize: 9, color: '#FDE68A' }}>Pior dia</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#FDE68A' }}>dia {worstDay.day} · {fmt(worstDay.balAfter, { short: true })}</div>
              </div>
            )}
            {dangerDays.length === 0 && warnDays.length === 0 && (
              <div style={{ flex: 1, background: '#16A34A20', borderRadius: 8, padding: '6px 10px' }}>
                <div style={{ fontSize: 9, color: '#86EFAC' }}>Situação</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#86EFAC' }}>Sem risco ✓</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Day list */}
      <Card style={{ padding: '4px 0', overflow: 'hidden' }}>
        {days.filter(d => d.dayEntries.length > 0 || d.isToday).map((d, di) => {
          const isExp  = expandedDay === d.day;
          const dimmed = d.isPast;
          const col    = balColor(d.balAfter);
          const bg     = balBg(d.balAfter);
          return (
            <div key={d.day}>
              {di > 0 && <div style={{ height: 1, background: 'var(--divider)', margin: '0 16px' }}/>}
              <div onClick={() => setExpandedDay(isExp ? null : d.day)}
                style={{ padding: '11px 16px', cursor: 'pointer', opacity: dimmed ? 0.55 : 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {/* Day badge */}
                  <div style={{ width: 40, textAlign: 'center', flexShrink: 0 }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: d.isToday ? '#2563EB' : 'var(--text-primary)', lineHeight: 1 }}>{d.day}</div>
                    <div style={{ fontSize: 9, color: d.isToday ? '#2563EB' : 'var(--text-muted)', textTransform: 'uppercase', marginTop: 1 }}>{d.weekday}</div>
                    {d.isToday && <div style={{ fontSize: 8, color: 'var(--text-inverse)', background: '#2563EB', borderRadius: 4, padding: '1px 4px', marginTop: 2, fontWeight: 700 }}>HOJE</div>}
                  </div>

                  {/* Transaction summary */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {d.dayEntries.length === 0 ? (
                      <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>Sem lançamentos</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {d.dayEntries.slice(0, isExp ? 999 : 2).map((e, ei) => (
                          <div key={ei} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 10, color: e.type === 'income' ? '#16A34A' : '#DC2626', fontWeight: 700, flexShrink: 0 }}>{e.type === 'income' ? '▲' : '▼'}</span>
                            <span style={{ fontSize: 12, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{e.desc}</span>
                            <span style={{ fontSize: 12, fontWeight: 700, color: e.type === 'income' ? '#16A34A' : '#DC2626', flexShrink: 0 }}>
                              {e.type === 'income' ? '+' : '−'}{fmt(e.value, {short:true})}
                            </span>
                            {e.isProjected && <span style={{ fontSize: 8, color: 'var(--text-faint)', flexShrink: 0 }}>prev.</span>}
                            {e.done && <span style={{ fontSize: 8, color: '#16A34A', flexShrink: 0 }}>✓</span>}
                          </div>
                        ))}
                        {!isExp && d.dayEntries.length > 2 && (
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>+{d.dayEntries.length - 2} mais…</div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Running balance */}
                  <div style={{ background: bg, borderRadius: 10, padding: '6px 10px', minWidth: 70, textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 1 }}>saldo</div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: col }}>{fmt(d.balAfter, {short:true})}</div>
                  </div>
                </div>

                {/* Net for day */}
                {d.dayEntries.length > 0 && (
                  <div style={{ marginTop: 6, marginLeft: 52, display: 'flex', gap: 10, fontSize: 10, color: 'var(--text-muted)' }}>
                    {d.dayInc > 0 && <span style={{ color: '#16A34A' }}>+{fmt(d.dayInc, {short:true})} entradas</span>}
                    {d.dayExp > 0 && <span style={{ color: '#DC2626' }}>−{fmt(d.dayExp, {short:true})} saídas</span>}
                    <span>líq: <strong style={{ color: d.dayInc - d.dayExp >= 0 ? '#16A34A' : '#DC2626' }}>{d.dayInc - d.dayExp >= 0 ? '+' : ''}{fmt(d.dayInc - d.dayExp, {short:true})}</strong></span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </Card>

      {/* Mini legend */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', fontSize: 10, color: 'var(--text-muted)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: '#16A34A', display: 'inline-block' }}/>Saldo ok</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: '#F59E0B', display: 'inline-block' }}/>Saldo baixo</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: '#DC2626', display: 'inline-block' }}/>Negativo</span>
      </div>
    </div>
  );
}

/* ── Movimentos ─────────────────────────────────────── */
function MovimentosScreen({ transactions, txActions, defaultFilter }) {
  const d = useFinance();
  const [filter,   setFilter]   = React.useState(defaultFilter || 'Todos');
  const [expanded, setExpanded] = React.useState(null);
  const [editing,  setEditing]  = React.useState({}); // {id: {value, desc, cat}}
  const [view,     setView]     = React.useState('lista');
  const [monthIdx, setMonthIdx] = React.useState(() => findBudgetIndex(d.monthlyBudget));

  React.useEffect(() => { if (defaultFilter) setFilter(defaultFilter); }, [defaultFilter]);

  const MB_ALL = d.monthlyBudget;
  const monthRaw = MB_ALL[monthIdx]?.m || 'Jun/26';
  const monthLabel = monthRaw;
  const monthKey = budgetLabelToKey(monthRaw) || currentMonthKey();

  const allTx  = (transactions || []).filter(tx => tx.date.startsWith(monthKey));
  const filtered = filter === 'Todos' ? allTx : allTx.filter(t => t.entity === filter);

  const totalIncome  = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.value, 0);
  const totalExpense = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.value, 0);
  const balance = totalIncome - totalExpense;

  const confirmTx = (id) => {
    if (!txActions) return;
    const tx = filtered.find(t => t.id === id);
    if (tx) txActions.toggleDone(id, !tx.done);
  };
  const deleteTx = (id) => {
    if (!txActions) return;
    const tx = filtered.find((t) => t.id === id);
    if (!tx) return;
    if (!window.confirm(`Excluir "${tx.desc}"?`)) return;
    txActions.remove(id);
    setExpanded(null);
  };
  const saveEdit = (id) => {
    if (!txActions || !editing[id]) return;
    txActions.update(id, editing[id]);
    setEditing(prev => { const n = {...prev}; delete n[id]; return n; });
    setExpanded(null);
  };

  const typeIcon = (type) => ({
    income:   { bg: '#F0FDF4', color: '#16A34A', glyph: '↑' },
    expense:  { bg: '#FEF2F2', color: '#DC2626', glyph: '↓' },
    transfer: { bg: '#EFF6FF', color: '#2563EB', glyph: '⇄' },
    invest:   { bg: '#F5F3FF', color: '#7C3AED', glyph: '◆' },
  }[type] || { bg: 'var(--bg-app)', color: 'var(--text-muted)', glyph: '•' });

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: 'var(--bg-app)', fontFamily: 'DM Sans, system-ui' }}>
      <div style={{ padding: 'var(--pad-top) var(--pad-x) var(--pad-bottom)', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>Movimentos</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button onClick={() => setMonthIdx(i => Math.max(0, i - 1))} disabled={monthIdx === 0}
              style={{ width: 28, height: 28, borderRadius: 8, border: 'none', background: monthIdx === 0 ? '#F4F5F8' : 'var(--border)', cursor: monthIdx === 0 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, color: monthIdx === 0 ? '#C4C7D4' : 'var(--text-primary)' }}>
              &#8249;
            </button>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', minWidth: 60, textAlign: 'center' }}>
              {monthLabel}
            </div>
            <button onClick={() => setMonthIdx(i => Math.min(MB_ALL.length - 1, i + 1))} disabled={monthIdx === MB_ALL.length - 1}
              style={{ width: 28, height: 28, borderRadius: 8, border: 'none', background: monthIdx === MB_ALL.length - 1 ? '#F4F5F8' : 'var(--border)', cursor: monthIdx === MB_ALL.length - 1 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, color: monthIdx === MB_ALL.length - 1 ? '#C4C7D4' : 'var(--text-primary)' }}>
              &#8250;
            </button>
          </div>
        </div>

        {/* View toggle: Lista | Fluxo | Diário */}
        <div style={{ display: 'flex', background: 'var(--bg-toggle)', borderRadius: 12, padding: 3, gap: 2 }}>
          {[['lista','Lista'],['fluxo','Fluxo'],['diario','Diário']].map(([k, l]) => (
            <button key={k} onClick={() => setView(k)} style={{
              flex: 1, padding: '8px 4px', borderRadius: 9, border: 'none', cursor: 'pointer',
              background: view === k ? 'var(--bg-card)' : 'transparent',
              color: view === k ? '#1A1F36' : 'var(--text-muted)',
              fontWeight: view === k ? 700 : 500,
              fontSize: 13, fontFamily: 'DM Sans, system-ui',
              boxShadow: view === k ? '0 1px 4px rgba(26,31,54,0.1)' : 'none',
              transition: 'all 0.2s ease',
            }}>{l}</button>
          ))}
        </div>

        {/* PF / PJ / Todos filter */}
        <div style={{ display: 'flex', gap: 8 }}>
          {['Todos', 'PF', 'PJ'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '7px 18px', borderRadius: 20, border: 'none', cursor: 'pointer',
              background: filter === f ? '#1A1F36' : 'var(--bg-card)',
              color: filter === f ? 'var(--bg-card)' : 'var(--text-muted)',
              fontSize: 13, fontWeight: 600, fontFamily: 'DM Sans, system-ui',
              boxShadow: filter === f ? '0 2px 8px rgba(26,31,54,0.2)' : 'none',
              transition: 'all 0.2s ease',
            }}>{f}</button>
          ))}
        </div>

        {/* ─── FLUXO DO MÊS VIEW ─── */}
        {view === 'fluxo' && (
          <FluxoView
            entityFilter={filter}
            monthKey={monthKey}
            monthIdx={monthIdx}
            monthLabel={monthLabel}
            transactions={transactions}
          />
        )}

        {/* ─── FLUXO DIÁRIO VIEW ─── */}
        {view === 'diario' && <FluxoDiarioView entityFilter={filter} monthKey={monthKey} monthIdx={monthIdx} transactions={transactions}/>}

        {/* ─── LISTA VIEW ─── */}
        {view === 'lista' && <>

        {/* Alertas de categoria */}
        {view === 'lista' && (() => {
          const budgets = {};
          d.monthlyEvents.filter(e => e.type === 'expense').forEach(e => {
            budgets[e.cat] = (budgets[e.cat] || 0) + e.value;
          });
          const spent = {};
          filtered.filter(t => t.type === 'expense' && t.done).forEach(t => {
            spent[t.cat || 'Outros'] = (spent[t.cat || 'Outros'] || 0) + t.value;
          });
          const alerts = Object.entries(budgets)
            .map(([cat, bud]) => ({ cat, bud, sp: spent[cat] || 0, pct: Math.round((spent[cat] || 0) / bud * 100) }))
            .filter(a => a.pct >= 75)
            .sort((a, b) => b.pct - a.pct)
            .slice(0, 3);
          if (alerts.length === 0) return null;
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {alerts.map((a, i) => {
                const over = a.pct >= 100;
                const warn = a.pct >= 90;
                const col = over ? '#DC2626' : warn ? '#F59E0B' : 'var(--text-muted)';
                const bg  = over ? '#FEF2F2' : warn ? '#FFFBEB' : 'var(--bg-app)';
                const border = over ? '#FECACA' : warn ? '#FDE68A' : 'var(--border)';
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, background: bg, borderRadius: 12, padding: '9px 12px', border: `1px solid ${border}` }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: col + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 13, fontWeight: 800, color: col }}>
                      {over ? '!' : '~'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.cat}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>
                        {fmt(a.sp)} de {fmt(a.bud)} orçados
                      </div>
                    </div>
                    <div style={{ flexShrink: 0, textAlign: 'right' }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: col }}>{a.pct}%</div>
                      <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{over ? 'excedido' : 'do limite'}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}

        {/* Summary bar */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          {[
            { label: 'Receitas',  value: totalIncome,   color: '#16A34A', sign: '+' },
            { label: 'Despesas',  value: totalExpense,  color: '#DC2626', sign: '−' },
            { label: 'Saldo',     value: balance,       color: balance >= 0 ? '#16A34A' : '#DC2626', sign: balance >= 0 ? '+' : '−' },
          ].map(s => (
            <Card key={s.label} style={{ padding: '10px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 3 }}>{s.label}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: s.color, letterSpacing: '-0.2px' }}>
                {s.sign}{fmt(s.value, { short: true })}
              </div>
            </Card>
          ))}
        </div>

        {/* Transaction list */}
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          {filtered.length === 0 && (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text-faint)', fontSize: 13 }}>
              Nenhum lançamento neste mês
            </div>
          )}
          {filtered.map((tx, i) => {
            const ic    = typeIcon(tx.type);
            const isExp = expanded === tx.id;
            return (
              <div key={tx.id || i}>
                {i > 0 && <div style={{ height: 1, background: 'var(--divider)', margin: '0 16px' }}/>}
                <div onClick={() => setExpanded(isExp ? null : tx.id)}
                  style={{ padding: isExp ? '13px 16px 2px' : '13px 16px', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 12, background: ic.bg, color: ic.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, flexShrink: 0 }}>{ic.glyph}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tx.desc}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{fmtDate(tx.date)}</span>
                        <Tag label={tx.entity} color={tx.entity === 'PF' ? '#2563EB' : '#7C3AED'} bg={tx.entity === 'PF' ? '#EFF6FF' : '#F5F3FF'}/>
                        {tx._pending && <Tag label="Aguardando sync" color="#F59E0B" bg="#FFFBEB"/>}
                        {tx.done  ? <Tag label="Realizado" color="#16A34A" bg="#F0FDF4"/> : <Tag label="Previsto" color="#F59E0B" bg="#FFFBEB"/>}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: tx.type === 'income' ? '#16A34A' : tx.type === 'expense' ? '#DC2626' : '#2563EB' }}>
                        {tx.type === 'income' ? '+' : '−'}{fmt(tx.value)}
                      </div>
                      <div style={{ fontSize: 9, color: 'var(--text-faint)', marginTop: 1 }}>▾ editar</div>
                    </div>
                  </div>

                  {isExp && (
                    <div style={{ margin: '10px 0 12px', padding: '12px', background: 'var(--bg-app)', borderRadius: 12 }}
                      onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
                        {[['Descrição','desc','text'],['Valor (R$)','value','numeric'],['Categoria','cat','text']].map(([lbl, field, mode]) => (
                          <div key={field}>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 3 }}>{lbl}</div>
                            <input defaultValue={tx[field]}
                              onChange={e => setEditing(prev => ({ ...prev, [tx.id]: { ...(prev[tx.id]||{}), [field]: mode === 'numeric' ? (Number(e.target.value.replace(/\D/g,''))||tx.value) : e.target.value } }))}
                              inputMode={mode === 'numeric' ? 'numeric' : 'text'}
                              style={{ width: '100%', padding: '8px 10px', borderRadius: 9, border: '1.5px solid var(--border)', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', background: 'var(--bg-card)', outline: 'none', fontFamily: 'DM Sans, system-ui', boxSizing: 'border-box' }}/>
                          </div>
                        ))}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginBottom: 10 }}>
                        <span>Conta: <strong style={{ color: 'var(--text-primary)' }}>{tx.entity}</strong></span>
                        <span>Data: <strong style={{ color: 'var(--text-primary)' }}>{fmtDate(tx.date)}</strong></span>
                        <span>Tipo: <strong style={{ color: 'var(--text-primary)' }}>{tx.type === 'income' ? 'Receita' : tx.type === 'expense' ? 'Despesa' : 'Transfer.'}</strong></span>
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => saveEdit(tx.id)} style={{ flex: 2, padding: '9px', borderRadius: 9, border: 'none', background: '#2563EB', color: 'var(--text-inverse)', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans, system-ui' }}>Salvar</button>
                        <button onClick={() => confirmTx(tx.id)} style={{ flex: 2, padding: '9px', borderRadius: 9, border: 'none', background: tx.done ? '#FEF2F2' : '#F0FDF4', color: tx.done ? '#DC2626' : '#16A34A', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans, system-ui' }}>{tx.done ? 'Desmarcar' : '✓ Confirmar'}</button>
                        <button onClick={() => deleteTx(tx.id)} style={{ flex: 1, padding: '9px', borderRadius: 9, border: 'none', background: '#FEF2F2', color: '#DC2626', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans, system-ui' }}>&#10005;</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </Card>

        {/* close lista conditional */}
        </>}

      </div>
    </div>
  );
}

export { DashboardScreen, MovimentosScreen, Card, Tag, FluxoDiarioView };
