import React from 'react';
import { useFinance } from '../hooks/useFinance.jsx';
import { CashFlowStepChart, ChartBox } from '../components/charts.jsx';
import { fmt } from '../data.js';
import { Card } from './screens-a.jsx';
import { formatBudgetMonthLong, dayLabelFromMonthKey, currentMonthKey } from '../lib/dates.js';
import { openingBalanceForMonth, buildMonthEntries, todayContextForMonth } from '../lib/balances.js';

function FluxoView({ entityFilter = 'Todos', monthKey, monthIdx, monthLabel, transactions = [] }) {
  const d = useFinance();
  const { isCurrent, daysInMonth, todayDay } = todayContextForMonth(monthKey);
  const title = formatBudgetMonthLong(monthLabel || monthKey);

  const startBalance = openingBalanceForMonth(d, monthIdx, entityFilter);
  const entries = buildMonthEntries(d, { monthKey, entityFilter, transactions });

  const sorted = [...entries].sort((a, b) => a.day - b.day);
  let running = startBalance;
  const withBalance = sorted.map((e) => {
    const delta = e.type === 'income' ? e.value : e.type === 'transfer' ? 0 : -e.value;
    if (e.type === 'transfer') {
      running += e.entity === 'PF' ? e.value : -e.value;
    } else {
      running += delta;
    }
    return { ...e, delta: e.type === 'expense' ? -e.value : e.value, balance: running };
  });
  const endBalance = running;

  const byDay = {};
  for (const e of withBalance) {
    if (!byDay[e.day]) byDay[e.day] = [];
    byDay[e.day].push(e);
  }
  const days = Object.keys(byDay).map(Number).sort((a, b) => a - b);

  const chartEvents = entries.map((e) => ({ day: e.day, type: e.type, value: e.value, desc: e.desc }));

  const typeColor = (type) => ({
    income: '#16A34A',
    expense: '#DC2626',
    transfer: '#2563EB',
  }[type] || '#8B90A0');

  const typeBg = (type) => ({
    income: '#F0FDF4',
    expense: '#FEF2F2',
    transfer: '#EFF6FF',
  }[type] || '#F7F8FA');

  const typeGlyph = (type) => ({
    income: '↑',
    expense: '↓',
    transfer: '⇄',
  }[type] || '•');

  const totalIn = withBalance.filter((e) => e.type === 'income').reduce((s, e) => s + e.value, 0);
  const totalOut = withBalance.filter((e) => e.type === 'expense').reduce((s, e) => s + e.value, 0);

  const lastDayLabel = `${daysInMonth} ${monthLabel?.slice(0, 3)?.toLowerCase() || ''}`.trim();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        {[
          { label: 'Saldo inicial', value: startBalance, color: '#2563EB' },
          { label: 'Entradas', value: totalIn, color: '#16A34A', sign: '+' },
          { label: 'Saídas', value: totalOut, color: '#DC2626', sign: '−' },
        ].map((s) => (
          <Card key={s.label} style={{ padding: '10px 12px', textAlign: 'center' }}>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', marginBottom: 3, whiteSpace: 'nowrap' }}>{s.label}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: s.color }}>
              {s.sign}{fmt(s.value, { short: true })}
            </div>
          </Card>
        ))}
      </div>

      <Card style={{ padding: '14px 12px 8px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{title} · Saldo diário</div>
          <div style={{ fontSize: 11, color: endBalance >= startBalance ? '#16A34A' : '#DC2626', fontWeight: 600 }}>
            {endBalance >= startBalance ? '+' : ''}{fmt(endBalance - startBalance, { short: true })}
          </div>
        </div>
        <ChartBox height={130}>
          {(w, h) => (
            <CashFlowStepChart
              events={chartEvents}
              startBalance={startBalance}
              width={w}
              height={h}
              daysInMonth={daysInMonth}
              todayDay={isCurrent ? todayDay : null}
            />
          )}
        </ChartBox>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 8, fontSize: 10, color: 'var(--text-muted)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22C55E', display: 'inline-block' }}/>Entrada
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444', display: 'inline-block' }}/>Saída
          </span>
          {isCurrent && todayDay && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 12, height: 2, background: '#F59E0B', display: 'inline-block' }}/>Hoje (dia {todayDay})
            </span>
          )}
        </div>
      </Card>

      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.04em', textTransform: 'uppercase', paddingLeft: 2 }}>
        Lançamentos por dia
      </div>

      {days.length === 0 ? (
        <Card style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
          Nenhum lançamento neste mês
        </Card>
      ) : days.map((day) => {
        const dayEvents = byDay[day];
        const dayNet = dayEvents.reduce((s, e) => s + (e.type === 'income' ? e.value : -e.value), 0);
        const isToday = isCurrent && day === todayDay;
        const isPast = isCurrent ? day < todayDay : monthKey < currentMonthKey();

        return (
          <div key={day} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, width: 28 }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8,
                background: isToday ? '#2563EB' : isPast ? 'var(--bg-subtle)' : 'var(--bg-card)',
                border: isToday ? 'none' : '1.5px solid #ECEEF4',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700,
                color: isToday ? 'var(--bg-card)' : isPast ? 'var(--text-muted)' : 'var(--text-primary)',
              }}>{day}</div>
              <div style={{ width: 1.5, flex: 1, minHeight: 12, background: 'var(--bg-toggle)', marginTop: 3 }}/>
            </div>

            <div style={{ flex: 1, paddingBottom: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 4 }}>
                <span style={{ fontSize: 11, color: isToday ? '#2563EB' : 'var(--text-muted)', fontWeight: isToday ? 700 : 400 }}>
                  {dayLabelFromMonthKey(monthKey, day)}{isToday ? ' · hoje' : ''}
                </span>
                <span style={{ fontSize: 11, fontWeight: 700, color: dayNet >= 0 ? '#16A34A' : '#DC2626' }}>
                  {dayNet >= 0 ? '+' : ''}{fmt(dayNet, { short: true })}
                </span>
              </div>

              <Card style={{ padding: '4px 4px', overflow: 'hidden' }}>
                {dayEvents.map((e, i) => (
                  <div key={i}>
                    {i > 0 && <div style={{ height: 1, background: 'var(--divider)', margin: '0 10px' }}/>}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px' }}>
                      <div style={{
                        width: 30, height: 30, borderRadius: 9, flexShrink: 0,
                        background: typeBg(e.type),
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 14, color: typeColor(e.type), fontWeight: 700,
                      }}>{typeGlyph(e.type)}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.desc}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>
                          {e.cat} · {e.entity}{e.isProjected ? ' · prev.' : ''}{e.done ? ' · ✓' : ''}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: typeColor(e.type) }}>
                          {e.type === 'expense' ? '−' : '+'}{fmt(Math.abs(e.value))}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>
                          Saldo: {fmt(e.balance, { short: true })}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </Card>
            </div>
          </div>
        );
      })}

      <Card style={{ padding: '14px 18px', background: endBalance >= startBalance ? '#F0FDF4' : '#FEF2F2' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Saldo final — {lastDayLabel}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>{fmt(endBalance)}</div>
          </div>
          {startBalance > 0 && (
            <div style={{
              fontSize: 13, fontWeight: 700,
              color: endBalance >= startBalance ? '#16A34A' : '#DC2626',
            }}>
              {endBalance >= startBalance ? '▲' : '▼'} {Math.abs(Math.round((endBalance - startBalance) / startBalance * 100))}%
            </div>
          )}
        </div>
      </Card>

    </div>
  );
}

export { FluxoView };
