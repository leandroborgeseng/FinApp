import React from 'react';
import { fmt } from '../data.js';
import { Card } from './screens-a.jsx';
// screens-repasse.jsx — Controle de Repasse PJ → PF

function RepasseScreen({ repasse, onUpdateRepasse, onUpdateMonth, onBack }) {
  const { months, day, monthlyLimit, annualLimit, year } = repasse;
  const [editIdx, setEditIdx] = React.useState(null);

  const currentIdx = 5;

  const totalDone  = months.filter((_, i) => i < currentIdx).reduce((s, m) => s + m.amount, 0);
  const totalProj  = months.reduce((s, m) => s + m.amount, 0);
  const usedPct    = (totalDone / annualLimit) * 100;
  const projPct    = (totalProj / annualLimit) * 100;
  const remaining  = annualLimit - totalProj;
  const isOver     = totalProj > annualLimit;
  const isWarning  = !isOver && projPct > 85;

  const heroGrad = isOver
    ? 'linear-gradient(145deg, #7C1D1D, #991B1B)'
    : 'linear-gradient(145deg, #1A1F36, #253056)';
  const barColor = isOver ? '#EF4444' : isWarning ? '#F59E0B' : '#22C55E';

  const step = (idx, delta) => {
    const next = Math.max(0, Math.min(monthlyLimit, months[idx].amount + delta));
    onUpdateMonth?.(idx, { amount: next });
  };

  const updateField = (idx, field, value) => {
    onUpdateMonth?.(idx, { [field]: value });
  };

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: '#F7F8FA', fontFamily: 'DM Sans, system-ui' }}>
      <div style={{ padding: '68px 18px 100px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={onBack} style={{
            width: 36, height: 36, borderRadius: '50%', background: '#fff',
            border: '1.5px solid #ECEEF4', cursor: 'pointer', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 1px 4px rgba(26,31,54,0.08)',
          }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 3L5 8L10 13" stroke="#1A1F36" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div>
            <div style={{ fontSize: 19, fontWeight: 700, color: '#1A1F36', lineHeight: 1.2 }}>Repasse PJ → PF</div>
            <div style={{ fontSize: 11, color: '#8B90A0', marginTop: 1 }}>Controle de retiradas {year}</div>
          </div>
        </div>

        {/* Hero — limite anual */}
        <div style={{ background: heroGrad, borderRadius: 22, padding: '20px 20px 18px', boxShadow: '0 6px 24px rgba(26,31,54,0.22)' }}>
          <div style={{ fontSize: 11, color: '#94A3CC', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 6 }}>
            Limite Anual {year}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 16 }}>
            <div style={{ fontSize: 30, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>{fmt(totalDone)}</div>
            <div style={{ fontSize: 13, color: '#94A3CC' }}>realizado até agora</div>
          </div>

          {/* Double bar: projected (light) + done (solid) */}
          <div style={{ position: 'relative', height: 10, background: 'rgba(255,255,255,0.1)', borderRadius: 5, marginBottom: 6, overflow: 'hidden' }}>
            <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${Math.min(100, projPct)}%`, background: 'rgba(255,255,255,0.18)', borderRadius: 5 }}/>
            <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${Math.min(100, usedPct)}%`, background: barColor, borderRadius: 5, transition: 'width 0.6s ease' }}/>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, fontSize: 10 }}>
            <span style={{ color: '#94A3CC' }}>R$ 0</span>
            <span style={{ fontWeight: 700, color: isOver ? '#FECACA' : isWarning ? '#FDE68A' : '#86EFAC' }}>
              {Math.round(projPct)}% do limite anual
            </span>
            <span style={{ color: '#94A3CC' }}>R$ 600k</span>
          </div>

          {/* Stats row */}
          <div style={{ display: 'flex' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 9, color: '#94A3CC', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Realizado</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#86EFAC', marginTop: 2 }}>{fmt(totalDone, { short: true })}</div>
            </div>
            <div style={{ width: 1, height: 34, background: 'rgba(255,255,255,0.12)', margin: '0 12px' }}/>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 9, color: '#94A3CC', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Projetado</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: isOver ? '#FECACA' : '#FDE68A', marginTop: 2 }}>{fmt(totalProj, { short: true })}</div>
            </div>
            <div style={{ width: 1, height: 34, background: 'rgba(255,255,255,0.12)', margin: '0 12px' }}/>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 9, color: '#94A3CC', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Disponível</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: remaining < 0 ? '#FECACA' : '#93C5FD', marginTop: 2 }}>
                {remaining < 0 ? '−' : ''}{fmt(Math.abs(remaining), { short: true })}
              </div>
            </div>
          </div>
        </div>

        {/* Warning banner */}
        {(isOver || isWarning) && (
          <div style={{
            borderRadius: 14, padding: '12px 14px',
            background: isOver ? '#FEF2F2' : '#FFFBEB',
            border: `1.5px solid ${isOver ? '#FECACA' : '#FDE68A'}`,
            display: 'flex', alignItems: 'flex-start', gap: 10,
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: 9, flexShrink: 0,
              background: isOver ? '#FEE2E2' : '#FEF3C7',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 800, color: isOver ? '#DC2626' : '#F59E0B',
            }}>!</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: isOver ? '#DC2626' : '#D97706' }}>
                {isOver ? 'Limite anual excedido' : 'Próximo do limite anual'}
              </div>
              <div style={{ fontSize: 11, color: '#8B90A0', marginTop: 2 }}>
                {isOver
                  ? `Reduza os repasses. Excesso: ${fmt(totalProj - annualLimit, { short: true })}`
                  : `Projeção em ${Math.round(projPct)}% — ainda ${fmt(remaining, { short: true })} disponível`}
              </div>
            </div>
          </div>
        )}

        {/* Config card */}
        <Card style={{ padding: '14px 18px' }}>
          <div style={{ display: 'flex', gap: 24 }}>
            <div>
              <div style={{ fontSize: 11, color: '#8B90A0', marginBottom: 3 }}>Limite mensal</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#1A1F36' }}>{fmt(monthlyLimit)}</div>
            </div>
            <div style={{ width: 1, background: '#F0F1F5' }}/>
            <div>
              <div style={{ fontSize: 11, color: '#8B90A0', marginBottom: 3 }}>Dia do repasse</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#1A1F36' }}>Dia {day}</div>
            </div>
            <div style={{ width: 1, background: '#F0F1F5' }}/>
            <div>
              <div style={{ fontSize: 11, color: '#8B90A0', marginBottom: 3 }}>Máx. anual</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#1A1F36' }}>R$ 600k</div>
            </div>
          </div>
        </Card>

        {/* Month label */}
        <div style={{ fontSize: 12, fontWeight: 600, color: '#8B90A0', letterSpacing: '0.05em', textTransform: 'uppercase', paddingLeft: 2 }}>
          Meses de {year}
        </div>

        {/* Month list */}
        <Card style={{ padding: '4px 4px' }}>
          {months.map((m, i) => {
            const isPast    = i < currentIdx;
            const isCurrent = i === currentIdx;
            const isEditing = editIdx === i;
            const overMon   = m.amount > monthlyLimit;
            const otherSum  = months.reduce((s, mm, ii) => ii !== i ? s + mm.amount : s, 0);
            const wouldOver = (otherSum + m.amount) > annualLimit;

            return (
              <div key={i}>
                {i > 0 && <div style={{ height: 1, background: '#F4F5F8', margin: '0 12px' }}/>}
                <div
                  onClick={() => !isPast && setEditIdx(isEditing ? null : i)}
                  style={{
                    padding: isEditing ? '12px 14px 0' : '12px 14px',
                    cursor: isPast ? 'default' : 'pointer',
                    background: isCurrent ? '#EFF6FF' : 'transparent',
                    borderRadius: isCurrent ? 10 : 0,
                    transition: 'background 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {/* Status dot */}
                    <div style={{
                      width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                      background: m.done ? '#F0FDF4' : isCurrent ? '#DBEAFE' : '#F4F5F8',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 14, fontWeight: 700,
                      color: m.done ? '#16A34A' : isCurrent ? '#2563EB' : '#C4C7D4',
                    }}>
                      {m.done ? '✓' : isCurrent ? '◉' : '○'}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 14, fontWeight: isCurrent ? 700 : 600, color: isPast ? '#8B90A0' : '#1A1F36' }}>
                          {m.m}
                        </span>
                        {isCurrent && (
                          <span style={{ fontSize: 9, fontWeight: 700, color: '#2563EB', background: '#DBEAFE', padding: '2px 6px', borderRadius: 6, letterSpacing: '0.03em' }}>
                            ESTE MÊS
                          </span>
                        )}
                      </div>
                      {overMon && (
                        <div style={{ fontSize: 10, color: '#DC2626', marginTop: 1 }}>Acima do limite mensal</div>
                      )}
                      {wouldOver && !overMon && !isPast && (
                        <div style={{ fontSize: 10, color: '#F59E0B', marginTop: 1 }}>Ultrapassa limite anual</div>
                      )}
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: m.done ? '#16A34A' : isCurrent ? '#2563EB' : '#1A1F36' }}>
                        {fmt(m.amount)}
                      </div>
                      {!isPast && !isEditing && (
                        <div style={{ fontSize: 9, color: '#C4C7D4', marginTop: 1 }}>editar</div>
                      )}
                    </div>
                  </div>

                  {/* Edit panel */}
                  {isEditing && (
                    <div
                      style={{ margin: '10px 0 12px', padding: '12px', background: '#F7F8FA', borderRadius: 10 }}
                      onClick={e => e.stopPropagation()}
                    >
                      {/* Stepper */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                        {[-5000, -1000].map(d => (
                          <button key={d} onClick={() => step(i, d)} style={{
                            padding: '7px 10px', borderRadius: 9, background: '#fff',
                            border: '1.5px solid #ECEEF4', fontSize: 11, fontWeight: 700,
                            color: '#DC2626', cursor: 'pointer', fontFamily: 'DM Sans, system-ui',
                          }}>{d === -5000 ? '−5k' : '−1k'}</button>
                        ))}
                        <div style={{
                          flex: 1, textAlign: 'center', padding: '9px 4px',
                          background: '#fff', borderRadius: 10, border: '1.5px solid #2563EB',
                          fontSize: 15, fontWeight: 700, color: '#2563EB',
                          fontFamily: 'DM Sans, system-ui',
                        }}>
                          {fmt(m.amount)}
                        </div>
                        {[1000, 5000].map(d => (
                          <button key={d} onClick={() => step(i, d)} style={{
                            padding: '7px 10px', borderRadius: 9, background: '#fff',
                            border: '1.5px solid #ECEEF4', fontSize: 11, fontWeight: 700,
                            color: '#16A34A', cursor: 'pointer', fontFamily: 'DM Sans, system-ui',
                          }}>{d === 1000 ? '+1k' : '+5k'}</button>
                        ))}
                      </div>

                      {m.amount >= monthlyLimit && (
                        <div style={{ fontSize: 11, color: '#F59E0B', fontWeight: 600, textAlign: 'center', marginBottom: 8 }}>
                          Limite mensal máximo atingido (R$ 50.000)
                        </div>
                      )}

                      {/* Action buttons */}
                      <div style={{ display: 'flex', gap: 8 }}>
                        {isCurrent && (
                          <button onClick={() => { updateField(i, 'done', !m.done); setEditIdx(null); }} style={{
                            flex: 1, padding: '9px', borderRadius: 9, border: 'none',
                            background: m.done ? '#FEF2F2' : '#F0FDF4',
                            color: m.done ? '#DC2626' : '#16A34A',
                            fontSize: 12, fontWeight: 700, cursor: 'pointer',
                            fontFamily: 'DM Sans, system-ui',
                          }}>
                            {m.done ? 'Desmarcar realizado' : '✓  Marcar como realizado'}
                          </button>
                        )}
                        <button onClick={() => setEditIdx(null)} style={{
                          width: 40, padding: '9px', borderRadius: 9, border: 'none',
                          background: '#ECEEF4', color: '#8B90A0', fontSize: 16,
                          cursor: 'pointer', lineHeight: 1,
                        }}>✕</button>
                      </div>

                      {/* Annual impact preview */}
                      <div style={{ marginTop: 8, fontSize: 11, color: '#8B90A0', textAlign: 'center' }}>
                        Total anual projetado: {' '}
                        <strong style={{ color: wouldOver ? '#DC2626' : '#1A1F36' }}>
                          {fmt(otherSum + m.amount, { short: true })}
                        </strong>
                        {' '}({Math.round((otherSum + m.amount) / annualLimit * 100)}% do limite)
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </Card>

        {/* Total projection summary */}
        <Card style={{
          padding: '16px 18px',
          background: isOver ? '#FEF2F2' : isWarning ? '#FFFBEB' : '#F0FDF4',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 11, color: '#8B90A0', marginBottom: 3 }}>Total projetado {year}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#1A1F36' }}>{fmt(totalProj)}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: '#8B90A0', marginBottom: 3 }}>do limite anual</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: isOver ? '#DC2626' : isWarning ? '#F59E0B' : '#16A34A' }}>
                {Math.round(projPct)}%
              </div>
            </div>
          </div>
          <div style={{ height: 7, background: 'rgba(0,0,0,0.07)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${Math.min(100, projPct)}%`,
              background: isOver ? '#DC2626' : isWarning ? '#F59E0B' : '#16A34A',
              borderRadius: 4, transition: 'width 0.5s ease',
            }}/>
          </div>
          <div style={{ marginTop: 8, fontSize: 11, color: '#8B90A0' }}>
            Disponível: <strong style={{ color: remaining < 0 ? '#DC2626' : '#1A1F36' }}>
              {remaining < 0 ? '−' : ''}{fmt(Math.abs(remaining))}
            </strong>
            {' '}para distribuir nos meses restantes
          </div>
        </Card>

      </div>
    </div>
  );
}

export { RepasseScreen };
