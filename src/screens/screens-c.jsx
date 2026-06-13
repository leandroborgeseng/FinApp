import React from 'react';
import { AppData } from '../data.js';
import { CashFlowStepChart } from '../components/charts.jsx';
import { fmt } from '../data.js';
// screens-c.jsx — Fluxo do Mês view

function FluxoView({ entityFilter = 'Todos' }) {
  const allEvents   = AppData.monthlyEvents;
  const events      = entityFilter === 'Todos'
    ? allEvents
    : allEvents.filter(e => e.entity === entityFilter);

  const startBalance = AppData.startBalances[entityFilter] || AppData.startBalances['Todos'];

  // Build running balance per event (sorted by day)
  const sorted = [...events].sort((a, b) => a.day - b.day);
  let running = startBalance;
  const withBalance = sorted.map(e => {
    const delta = e.type === 'income' ? e.value : -e.value;
    running += delta;
    return { ...e, delta, balance: running };
  });
  const endBalance = running;

  // Group events by day
  const byDay = {};
  for (const e of withBalance) {
    if (!byDay[e.day]) byDay[e.day] = [];
    byDay[e.day].push(e);
  }
  const days = Object.keys(byDay).map(Number).sort((a, b) => a - b);

  const typeColor = (type) => ({
    income:   '#16A34A',
    expense:  '#DC2626',
    transfer: '#2563EB',
  }[type] || '#8B90A0');

  const typeBg = (type) => ({
    income:   '#F0FDF4',
    expense:  '#FEF2F2',
    transfer: '#EFF6FF',
  }[type] || '#F7F8FA');

  const typeGlyph = (type) => ({
    income:   '↑',
    expense:  '↓',
    transfer: '⇄',
  }[type] || '•');

  const dayLabel = (d) => {
    const date = new Date(2026, 5, d); // June 2026
    return date.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric' });
  };

  // Balance summary row
  const totalIn  = withBalance.filter(e => e.type === 'income').reduce((s, e) => s + e.value, 0);
  const totalOut = withBalance.filter(e => e.type !== 'income').reduce((s, e) => s + e.value, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* Balance summary strip */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        {[
          { label: 'Saldo inicial', value: startBalance, color: '#2563EB' },
          { label: 'Entradas',      value: totalIn,      color: '#16A34A', sign: '+' },
          { label: 'Saídas',        value: totalOut,     color: '#DC2626', sign: '−' },
        ].map(s => (
          <Card key={s.label} style={{ padding: '10px 12px', textAlign: 'center' }}>
            <div style={{ fontSize: 9, color: '#8B90A0', marginBottom: 3, whiteSpace: 'nowrap' }}>{s.label}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: s.color }}>
              {s.sign}{fmt(s.value, { short: true })}
            </div>
          </Card>
        ))}
      </div>

      {/* Step chart */}
      <Card style={{ padding: '14px 12px 8px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1A1F36' }}>Junho 2026 · Saldo diário</div>
          <div style={{ fontSize: 11, color: endBalance >= startBalance ? '#16A34A' : '#DC2626', fontWeight: 600 }}>
            {endBalance >= startBalance ? '+' : ''}{fmt(endBalance - startBalance, { short: true })}
          </div>
        </div>
        <CashFlowStepChart events={events} startBalance={startBalance} width={326} height={130}/>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 8, fontSize: 10, color: '#8B90A0' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22C55E', display: 'inline-block' }}/>Entrada
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444', display: 'inline-block' }}/>Saída
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 12, height: 2, background: '#F59E0B', display: 'inline-block' }}/>Hoje (dia 10)
          </span>
        </div>
      </Card>

      {/* Day-by-day timeline */}
      <div style={{ fontSize: 12, fontWeight: 600, color: '#8B90A0', letterSpacing: '0.04em', textTransform: 'uppercase', paddingLeft: 2 }}>
        Lançamentos por dia
      </div>

      {days.map(day => {
        const dayEvents = byDay[day];
        const dayNet    = dayEvents.reduce((s, e) => s + e.delta, 0);
        const lastBal   = dayEvents[dayEvents.length - 1].balance;
        const isToday   = day === 10;
        const isPast    = day < 10;

        return (
          <div key={day} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            {/* Day column */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, width: 28 }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8,
                background: isToday ? '#2563EB' : isPast ? '#F0F1F5' : '#fff',
                border: isToday ? 'none' : '1.5px solid #ECEEF4',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700,
                color: isToday ? '#fff' : isPast ? '#8B90A0' : '#1A1F36',
              }}>{day}</div>
              <div style={{ width: 1.5, flex: 1, minHeight: 12, background: '#ECEEF4', marginTop: 3 }}/>
            </div>

            {/* Events for this day */}
            <div style={{ flex: 1, paddingBottom: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {/* Day header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 4 }}>
                <span style={{ fontSize: 11, color: isToday ? '#2563EB' : '#8B90A0', fontWeight: isToday ? 700 : 400 }}>
                  {dayLabel(day)}{isToday ? ' · hoje' : ''}
                </span>
                <span style={{
                  fontSize: 11, fontWeight: 700,
                  color: dayNet >= 0 ? '#16A34A' : '#DC2626',
                }}>
                  {dayNet >= 0 ? '+' : ''}{fmt(dayNet, { short: true })}
                </span>
              </div>

              {/* Events card */}
              <Card style={{ padding: '4px 4px', overflow: 'hidden' }}>
                {dayEvents.map((e, i) => (
                  <div key={i}>
                    {i > 0 && <div style={{ height: 1, background: '#F4F5F8', margin: '0 10px' }}/>}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px' }}>
                      <div style={{
                        width: 30, height: 30, borderRadius: 9, flexShrink: 0,
                        background: typeBg(e.type),
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 14, color: typeColor(e.type), fontWeight: 700,
                      }}>{typeGlyph(e.type)}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#1A1F36', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.desc}</div>
                        <div style={{ fontSize: 10, color: '#8B90A0', marginTop: 1 }}>{e.cat} · {e.entity}</div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: typeColor(e.type) }}>
                          {e.delta >= 0 ? '+' : '−'}{fmt(Math.abs(e.delta))}
                        </div>
                        <div style={{ fontSize: 10, color: '#8B90A0', marginTop: 1 }}>
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

      {/* Final balance */}
      <Card style={{ padding: '14px 18px', background: endBalance >= startBalance ? '#F0FDF4' : '#FEF2F2' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 11, color: '#8B90A0', marginBottom: 2 }}>Saldo final — 30 jun</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#1A1F36' }}>{fmt(endBalance)}</div>
          </div>
          <div style={{
            fontSize: 13, fontWeight: 700,
            color: endBalance >= startBalance ? '#16A34A' : '#DC2626',
          }}>
            {endBalance >= startBalance ? '▲' : '▼'} {Math.abs(Math.round((endBalance - startBalance) / startBalance * 100))}%
          </div>
        </div>
      </Card>

    </div>
  );
}

export { FluxoView };
