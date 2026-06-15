import React from 'react';
import { fmt, fmtDate } from '../data.js';
import { useQueryClient } from '@tanstack/react-query';
import { resetFromDate } from '../api/finance.js';
import { clearApiCache } from '../store/offlineQueue.js';
import { toast } from '../lib/toast.js';
import {
  currentMonthKey,
  monthKeyToLabel,
  yearMonthKeys,
  yearPeriodBounds,
} from '../lib/dates.js';

function BackBtn({ onBack }) {
  return (
    <button
      type="button"
      onClick={onBack}
      style={{
        width: 36, height: 36, borderRadius: '50%', background: 'var(--bg-card)',
        border: '1.5px solid var(--border)', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 1px 4px rgba(26,31,54,0.08)', flexShrink: 0,
      }}
    >
      <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
        <path d="M7 1L1 7L7 13" stroke="#6B7280" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

function Card({ children, style = {} }) {
  return (
    <div style={{
      background: 'var(--bg-card)', borderRadius: 18, padding: '16px 18px',
      boxShadow: 'var(--shadow-card)', ...style,
    }}
    >
      {children}
    </div>
  );
}

function TxRow({ tx, expanded, onToggle, editing, setEditing, txActions, busy }) {
  const color = tx.type === 'income' ? '#16A34A' : tx.type === 'expense' ? '#DC2626' : '#2563EB';
  const isExp = expanded === tx.id;

  const saveEdit = () => {
    if (!txActions || !editing[tx.id]) return;
    const patch = { ...editing[tx.id] };
    if (patch.value !== undefined) patch.value = Number(patch.value) || tx.value;
    txActions.update(tx.id, patch);
    setEditing((prev) => { const n = { ...prev }; delete n[tx.id]; return n; });
    onToggle(null);
  };

  const deleteOne = () => {
    if (!txActions) return;
    if (!window.confirm(`Excluir "${tx.desc}"?`)) return;
    txActions.remove(tx.id);
    onToggle(null);
  };

  const toggleDone = () => {
    if (!txActions) return;
    txActions.toggleDone(tx.id, !tx.done);
  };

  const inputStyle = {
    width: '100%', padding: '8px 10px', borderRadius: 9, border: '1.5px solid var(--border)',
    fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', background: 'var(--bg-card)',
    outline: 'none', fontFamily: 'DM Sans, system-ui', boxSizing: 'border-box',
  };

  return (
    <div style={{ borderBottom: '1px solid var(--divider)' }}>
      <div
        onClick={() => onToggle(isExp ? null : tx.id)}
        style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0',
          cursor: 'pointer',
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 13, fontWeight: 600, color: 'var(--text-primary)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}
          >
            {tx.desc}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
            {fmtDate(tx.date)} · {tx.entity} · {tx.cat || 'Outros'}
            {tx.done ? ' · Realizado' : ' · Previsto'}
          </div>
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color, flexShrink: 0 }}>
          {tx.type === 'income' ? '+' : '−'}{fmt(tx.value, { short: true })}
        </div>
        <span style={{ fontSize: 10, color: 'var(--text-faint)', flexShrink: 0 }}>{isExp ? '▴' : '▾'}</span>
      </div>

      {isExp && (
        <div
          style={{ marginBottom: 12, padding: 12, background: 'var(--bg-app)', borderRadius: 12 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
            {[['Descrição', 'desc', 'text'], ['Valor (R$)', 'value', 'numeric'], ['Categoria', 'cat', 'text']].map(([lbl, field, mode]) => (
              <div key={field}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 3 }}>{lbl}</div>
                <input
                  defaultValue={tx[field]}
                  onChange={(e) => setEditing((prev) => ({
                    ...prev,
                    [tx.id]: {
                      ...(prev[tx.id] || {}),
                      [field]: mode === 'numeric'
                        ? (Number(e.target.value.replace(/\D/g, '')) || tx.value)
                        : e.target.value,
                    },
                  }))}
                  inputMode={mode === 'numeric' ? 'numeric' : 'text'}
                  style={inputStyle}
                />
              </div>
            ))}
            <div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 3 }}>Data</div>
              <input
                type="date"
                defaultValue={tx.date}
                onChange={(e) => setEditing((prev) => ({
                  ...prev,
                  [tx.id]: { ...(prev[tx.id] || {}), date: e.target.value },
                }))}
                style={inputStyle}
              />
            </div>
            <div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 3 }}>Conta</div>
              <select
                defaultValue={tx.entity}
                onChange={(e) => setEditing((prev) => ({
                  ...prev,
                  [tx.id]: { ...(prev[tx.id] || {}), entity: e.target.value },
                }))}
                style={inputStyle}
              >
                <option value="PF">PF</option>
                <option value="PJ">PJ</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              type="button"
              disabled={busy}
              onClick={saveEdit}
              style={{
                flex: 2, padding: '9px', borderRadius: 9, border: 'none', background: '#2563EB',
                color: '#fff', fontSize: 11, fontWeight: 700, cursor: busy ? 'default' : 'pointer',
                opacity: busy ? 0.6 : 1, fontFamily: 'DM Sans, system-ui',
              }}
            >
              Salvar
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={toggleDone}
              style={{
                flex: 2, padding: '9px', borderRadius: 9, border: 'none',
                background: tx.done ? '#FEF2F2' : '#F0FDF4',
                color: tx.done ? '#DC2626' : '#16A34A',
                fontSize: 11, fontWeight: 700, cursor: busy ? 'default' : 'pointer',
                opacity: busy ? 0.6 : 1, fontFamily: 'DM Sans, system-ui',
              }}
            >
              {tx.done ? 'Desmarcar' : '✓ Realizado'}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={deleteOne}
              style={{
                flex: 1, padding: '9px', borderRadius: 9, border: 'none', background: '#FEF2F2',
                color: '#DC2626', fontSize: 14, fontWeight: 700, cursor: busy ? 'default' : 'pointer',
                opacity: busy ? 0.6 : 1, fontFamily: 'DM Sans, system-ui',
              }}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function RevisaoLancamentosScreen({ onBack, transactions = [], txActions, dataStartsAt }) {
  const qc = useQueryClient();
  const [filter, setFilter] = React.useState('Todos');
  const [expandedMonth, setExpandedMonth] = React.useState(null);
  const [showLixo, setShowLixo] = React.useState(false);
  const [expandedTx, setExpandedTx] = React.useState(null);
  const [editing, setEditing] = React.useState({});
  const [resetDate, setResetDate] = React.useState(() => new Date().toISOString().slice(0, 10));
  const [resetBalance, setResetBalance] = React.useState('');
  const [resetBusy, setResetBusy] = React.useState(false);
  const busy = txActions?.isPending || resetBusy;

  const year = new Date().getFullYear();
  const { yearStart, yearEndExclusive } = yearPeriodBounds(year);
  const currentKey = currentMonthKey();
  const months = [...yearMonthKeys(year)].reverse();

  const all = (transactions || []).filter((t) => filter === 'Todos' || t.entity === filter);

  const isGarbage = (date) => !date || date < yearStart || date >= yearEndExclusive;

  const garbage = all.filter((t) => isGarbage(t.date));
  const yearTx = all.filter((t) => !isGarbage(t.date));

  const byMonth = months.map((monthKey) => {
    const txs = all.filter((t) => t.date?.startsWith(monthKey));
    const income = txs.filter((t) => t.type === 'income').reduce((s, t) => s + t.value, 0);
    const expense = txs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.value, 0);
    const beforeStart = dataStartsAt && monthKey < dataStartsAt;
    return {
      monthKey,
      label: monthKeyToLabel(monthKey),
      txs: [...txs].sort((a, b) => (a.date < b.date ? -1 : 1)),
      income,
      expense,
      balance: income - expense,
      isCurrent: monthKey === currentKey,
      beforeStart,
    };
  });

  const staleCount = byMonth.filter((m) => m.beforeStart).reduce((s, m) => s + m.txs.length, 0);

  const deleteMonth = async (monthKey, count, label) => {
    if (!txActions || !count) return;
    if (!window.confirm(`Excluir todos os ${count} lançamentos de ${label}?`)) return;
    await txActions.bulkRemoveAsync({ month: monthKey });
    if (expandedMonth === monthKey) setExpandedMonth(null);
  };

  const deleteGarbage = async () => {
    if (!txActions || !garbage.length) return;
    if (!window.confirm(`Excluir ${garbage.length} lançamento(s) fora de ${year}?`)) return;
    await txActions.bulkRemoveAsync({ ids: garbage.map((t) => t.id) });
    setShowLixo(false);
  };

  const deleteStaleMonths = async () => {
    if (!txActions || !staleCount || !dataStartsAt) return;
    const label = monthKeyToLabel(dataStartsAt);
    if (!window.confirm(`Excluir ${staleCount} lançamento(s) de meses anteriores a ${label}?`)) return;
    const cutoff = dataStartsAt.length > 7 ? dataStartsAt : `${dataStartsAt}-01`;
    await txActions.bulkRemoveAsync({ before: cutoff });
    setExpandedMonth(null);
  };

  const handleFreshStart = async () => {
    const balance = Number(String(resetBalance).replace(',', '.'));
    if (!resetDate) {
      toast.error('Informe a data de início');
      return;
    }
    if (!Number.isFinite(balance) || balance < 0) {
      toast.error('Informe o saldo atual da conta PF');
      return;
    }
    const [y, m, d] = resetDate.split('-');
    const label = `${d}/${m}/${y.slice(2)}`;
    if (!window.confirm(
      `Apagar todos os lançamentos e definir saldo PF em ${fmt(balance)} a partir de ${label}? Esta ação não pode ser desfeita.`,
    )) return;

    setResetBusy(true);
    try {
      await resetFromDate({
        cutoffDate: resetDate,
        balance,
        accountId: 'pf-cc',
        wipeAll: true,
      });
      await clearApiCache();
      qc.invalidateQueries();
      toast.success('Conta reiniciada — comece a lançar a partir de hoje');
      setExpandedMonth(null);
    } catch (e) {
      toast.error(e?.message || 'Falha ao reiniciar');
    } finally {
      setResetBusy(false);
    }
  };

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: 'var(--bg-app)', fontFamily: 'DM Sans, system-ui' }}>
      <div style={{ padding: 'var(--pad-top) var(--pad-x) var(--pad-bottom)', display: 'flex', flexDirection: 'column', gap: 14 }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <BackBtn onBack={onBack} />
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>Auditoria</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              {year} · jan a {monthKeyToLabel(currentKey).toLowerCase()}
            </div>
          </div>
        </div>

        <Card>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, textAlign: 'center' }}>
            {[
              { label: 'No ano', value: yearTx.length, color: 'var(--text-primary)' },
              { label: 'Fora do ano', value: garbage.length, color: garbage.length ? '#DC2626' : 'var(--text-muted)' },
              { label: 'Antes do início', value: staleCount, color: staleCount ? '#F59E0B' : 'var(--text-muted)' },
            ].map((s) => (
              <div key={s.label}>
                <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
          {dataStartsAt && (
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 12, lineHeight: 1.4 }}>
              Toque em um lançamento para editar data, valor ou desmarcar como realizado.
              Meses anteriores a <strong>{monthKeyToLabel(dataStartsAt)}</strong> podem conter lixo do histórico.
            </div>
          )}
        </Card>

        <Card style={{ padding: '14px 16px', border: '1.5px solid #BFDBFE', background: '#EFF6FF' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1D4ED8', marginBottom: 6 }}>Reiniciar com saldo atual</div>
          <div style={{ fontSize: 11, color: '#1E40AF', marginBottom: 12, lineHeight: 1.45 }}>
            Apaga todos os lançamentos, define o saldo da conta PF e zera a PJ. Use quando quiser começar do zero a partir de uma data.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>A partir de</span>
              <input
                type="date"
                value={resetDate}
                onChange={(e) => setResetDate(e.target.value)}
                style={{
                  padding: '9px 10px', borderRadius: 9, border: '1.5px solid var(--border)',
                  fontSize: 13, fontFamily: 'DM Sans, system-ui', background: 'var(--bg-card)',
                }}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Saldo PF (R$)</span>
              <input
                type="text"
                inputMode="decimal"
                value={resetBalance}
                onChange={(e) => setResetBalance(e.target.value.replace(/[^\d,.]/g, ''))}
                placeholder="10668,46"
                style={{
                  padding: '9px 10px', borderRadius: 9, border: '1.5px solid var(--border)',
                  fontSize: 13, fontWeight: 700, fontFamily: 'DM Sans, system-ui', background: 'var(--bg-card)',
                }}
              />
            </label>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={handleFreshStart}
            style={{
              width: '100%', padding: '12px', borderRadius: 10, border: 'none',
              background: '#2563EB', color: '#fff', fontWeight: 700, fontSize: 13,
              cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.6 : 1,
              fontFamily: 'DM Sans, system-ui',
            }}
          >
            {resetBusy ? 'Reiniciando…' : 'Apagar histórico e definir saldo'}
          </button>
        </Card>

        {(garbage.length > 0 || staleCount > 0) && (
          <Card style={{ padding: '14px 16px', border: '1.5px solid #FDE68A', background: '#FFFBEB' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#92400E', marginBottom: 8 }}>Limpeza rápida</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {garbage.length > 0 && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={deleteGarbage}
                  style={{
                    width: '100%', padding: '11px', borderRadius: 10, border: 'none',
                    background: '#DC2626', color: '#fff', fontWeight: 700, fontSize: 13,
                    cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.6 : 1,
                    fontFamily: 'DM Sans, system-ui',
                  }}
                >
                  Excluir {garbage.length} fora de {year}
                </button>
              )}
              {staleCount > 0 && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={deleteStaleMonths}
                  style={{
                    width: '100%', padding: '11px', borderRadius: 10, border: '1.5px solid #F59E0B',
                    background: '#fff', color: '#B45309', fontWeight: 700, fontSize: 13,
                    cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.6 : 1,
                    fontFamily: 'DM Sans, system-ui',
                  }}
                >
                  Limpar {staleCount} antes de {monthKeyToLabel(dataStartsAt)}
                </button>
              )}
            </div>
          </Card>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          {['Todos', 'PF', 'PJ'].map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              style={{
                padding: '7px 18px', borderRadius: 20, border: 'none', cursor: 'pointer',
                background: filter === f ? '#1A1F36' : 'var(--bg-card)',
                color: filter === f ? 'var(--bg-card)' : 'var(--text-muted)',
                fontSize: 13, fontWeight: 600, fontFamily: 'DM Sans, system-ui',
              }}
            >
              {f}
            </button>
          ))}
        </div>

        {garbage.length > 0 && (
          <Card style={{ padding: 0, overflow: 'hidden', border: '1.5px solid #FECACA' }}>
            <div
              onClick={() => setShowLixo((v) => !v)}
              style={{ padding: '14px 16px', cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#DC2626' }}>Fora do período</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                    {garbage.length} lançamento(s) · datas inválidas ou de outros anos
                  </div>
                </div>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{showLixo ? '▴' : '▾'}</span>
              </div>
            </div>
            {showLixo && (
              <div style={{ padding: '0 16px 12px', borderTop: '1px solid var(--divider)' }}>
                {garbage.map((tx) => (
                  <TxRow
                    key={tx.id}
                    tx={tx}
                    expanded={expandedTx}
                    onToggle={setExpandedTx}
                    editing={editing}
                    setEditing={setEditing}
                    txActions={txActions}
                    busy={busy}
                  />
                ))}
              </div>
            )}
          </Card>
        )}

        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase', paddingLeft: 4 }}>
          Mês a mês
        </div>

        {byMonth.map((m) => {
          const isOpen = expandedMonth === m.monthKey;
          const warn = m.beforeStart && m.txs.length > 0;
          return (
            <Card key={m.monthKey} style={{ padding: 0, overflow: 'hidden', border: m.isCurrent ? '1.5px solid #2563EB' : warn ? '1.5px solid #FCD34D' : '1.5px solid transparent' }}>
              <div
                onClick={() => setExpandedMonth(isOpen ? null : m.monthKey)}
                style={{ padding: '14px 16px', cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{m.label}</span>
                      {m.isCurrent && (
                        <span style={{ fontSize: 9, fontWeight: 700, color: '#2563EB', background: '#EFF6FF', padding: '2px 8px', borderRadius: 20 }}>ATUAL</span>
                      )}
                      {warn && (
                        <span style={{ fontSize: 9, fontWeight: 700, color: '#B45309', background: '#FFFBEB', padding: '2px 8px', borderRadius: 20 }}>LIXO</span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                      {m.txs.length} lançamento{m.txs.length !== 1 ? 's' : ''}
                      {m.txs.length > 0 && (
                        <>
                          {' · '}
                          <span style={{ color: '#16A34A' }}>+{fmt(m.income, { short: true })}</span>
                          {' '}
                          <span style={{ color: '#DC2626' }}>−{fmt(m.expense, { short: true })}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    {m.txs.length > 0 && (
                      <div style={{ fontSize: 14, fontWeight: 800, color: m.balance >= 0 ? '#16A34A' : '#DC2626' }}>
                        {m.balance >= 0 ? '+' : '−'}{fmt(Math.abs(m.balance), { short: true })}
                      </div>
                    )}
                    <div style={{ fontSize: 10, color: 'var(--text-faint)', marginTop: 2 }}>{isOpen ? '▴' : '▾'}</div>
                  </div>
                </div>
              </div>

              {isOpen && (
                <div style={{ borderTop: '1px solid var(--divider)', padding: '0 16px 14px' }}>
                  {m.txs.length === 0 ? (
                    <div style={{ padding: '16px 0', textAlign: 'center', color: 'var(--text-faint)', fontSize: 13 }}>
                      Nenhum lançamento
                    </div>
                  ) : (
                    <>
                      {m.txs.map((tx) => (
                        <TxRow
                          key={tx.id}
                          tx={tx}
                          expanded={expandedTx}
                          onToggle={setExpandedTx}
                          editing={editing}
                          setEditing={setEditing}
                          txActions={txActions}
                          busy={busy}
                        />
                      ))}
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => deleteMonth(m.monthKey, m.txs.length, m.label)}
                        style={{
                          width: '100%', marginTop: 10, padding: '10px', borderRadius: 10,
                          border: '1.5px solid #FECACA', background: '#FEF2F2', color: '#DC2626',
                          fontSize: 12, fontWeight: 700, cursor: busy ? 'default' : 'pointer',
                          opacity: busy ? 0.6 : 1, fontFamily: 'DM Sans, system-ui',
                        }}
                      >
                        Excluir todos de {m.label}
                      </button>
                    </>
                  )}
                </div>
              )}
            </Card>
          );
        })}

      </div>
    </div>
  );
}

export { RevisaoLancamentosScreen };
