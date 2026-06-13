import React from 'react';
import { fmt } from '../data.js';
import { useFinance, useAccounts } from '../hooks/useFinance.jsx';
import { Card, Tag } from './screens-a.jsx';

function ContasTab() {
  const d = useFinance();
  const { update } = useAccounts();
  const accounts = d.accounts || [];
  const [edit, setEdit] = React.useState({});

  const checking = accounts.filter((a) => a.type === 'checking');
  const cards = accounts.filter((a) => a.type === 'card');

  const save = (acc) => {
    const patch = edit[acc.id];
    if (!patch) return;
    update.mutate({ id: acc.id, patch }, {
      onSuccess: () => setEdit((prev) => { const n = { ...prev }; delete n[acc.id]; return n; }),
    });
  };

  const field = (acc, key, label, color = 'var(--text-primary)') => (
    <label key={key} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{label}</span>
      <input
        type="number"
        value={edit[acc.id]?.[key] ?? acc[key] ?? 0}
        onChange={(e) => {
          const n = Number(e.target.value);
          setEdit((prev) => ({
            ...prev,
            [acc.id]: { ...prev[acc.id], [key]: Number.isFinite(n) ? n : 0 },
          }));
        }}
        style={{
          padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)',
          fontSize: 12, fontFamily: 'DM Sans, system-ui', color,
          background: 'var(--bg-card)', width: '100%', boxSizing: 'border-box',
        }}
      />
    </label>
  );

  const renderAccount = (acc) => {
    const isCard = acc.type === 'card';
    const usagePct = isCard && acc.limit ? Math.round((acc.used / acc.limit) * 100) : 0;
    return (
      <Card key={acc.id} style={{ padding: '14px 16px', marginBottom: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{acc.name}</div>
              {acc._pending && <Tag label="Aguardando sync" color="#F59E0B" bg="#FFFBEB"/>}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
              {acc.entity} · {acc.bank || acc.brand || (isCard ? 'Cartão' : 'Conta')}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: isCard ? '#DC2626' : '#16A34A' }}>
              {fmt(isCard ? acc.used : acc.balance, { short: true })}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{isCard ? 'fatura atual' : 'saldo'}</div>
          </div>
        </div>

        {isCard && (
          <>
            <div style={{ height: 5, background: 'var(--bg-subtle)', borderRadius: 3, overflow: 'hidden', marginBottom: 8 }}>
              <div style={{ width: `${Math.min(100, usagePct)}%`, height: '100%', background: usagePct > 80 ? '#EF4444' : '#2563EB', borderRadius: 3 }}/>
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 10 }}>
              Limite {fmt(acc.limit, { short: true })} · fecha dia {acc.closingDay} · vence dia {acc.dueDay}
            </div>
          </>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: isCard ? '1fr 1fr 1fr' : '1fr', gap: 8 }}>
          {isCard
            ? [field(acc, 'used', 'Fatura (R$)'), field(acc, 'limit', 'Limite (R$)'), field(acc, 'closingDay', 'Fechamento')]
            : field(acc, 'balance', 'Saldo (R$)')}
        </div>

        <button
          type="button"
          onClick={() => save(acc)}
          disabled={!edit[acc.id] || update.isPending}
          style={{
            width: '100%', marginTop: 10, padding: '9px', borderRadius: 10, border: 'none',
            background: '#2563EB', color: 'var(--text-inverse)', fontSize: 12, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'DM Sans, system-ui',
            opacity: (!edit[acc.id] || update.isPending) ? 0.6 : 1,
          }}
        >
          {update.isPending ? 'Salvando…' : 'Salvar'}
        </button>
      </Card>
    );
  };

  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 8 }}>
        Contas correntes
      </div>
      {checking.map(renderAccount)}

      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase', margin: '14px 0 8px' }}>
        Cartões
      </div>
      {cards.map(renderAccount)}
    </div>
  );
}

export { ContasTab };
