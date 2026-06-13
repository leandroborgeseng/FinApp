// screens-sheet.jsx — Planilha de Recorrências (Excel-like)

function RecorrenciasSheet({ onBack }) {
  const MONTHS = AppData.monthlyBudget.map(r => r.m);   // 31 meses
  const BASE   = AppData.monthlyEvents;                  // 25 linhas

  // overrides[rowIdx][monthIdx] = valor customizado
  const STORAGE_KEY = 'recorr_overrides_v1';
  const loadOverrides = () => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; } };

  const [overrides,  setOverrides]  = React.useState(loadOverrides);
  const [editing,    setEditing]    = React.useState(null); // { r, m }
  const [editVal,    setEditVal]    = React.useState('');
  const [filterEnt,  setFilterEnt]  = React.useState('Todos'); // Todos | PF | PJ
  const [filterType, setFilterType] = React.useState('Todos'); // Todos | income | expense
  const [newRow,     setNewRow]     = React.useState(null);    // {desc,type,entity,cat,value}
  const [rows,       setRows]       = React.useState(BASE);

  const colRef = React.useRef(null);

  // Scroll to current month on mount
  React.useEffect(() => {
    if (colRef.current) { colRef.current.scrollLeft = 0; }
  }, []);

  const val = (r, m) => {
    const ov = overrides[r]?.[m];
    return ov !== undefined ? ov : rows[r].value;
  };

  const saveOverride = (r, m, v) => {
    const next = { ...overrides, [r]: { ...(overrides[r] || {}), [m]: v } };
    setOverrides(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const commitEdit = () => {
    if (!editing) return;
    const v = parseFloat(editVal.replace(/\D/g, '')) || 0;
    saveOverride(editing.r, editing.m, v);
    setEditing(null);
  };

  // Column totals
  const colTotals = MONTHS.map((_, m) => {
    const visRows = rows.filter((row, r) => {
      if (filterEnt  !== 'Todos' && row.entity !== filterEnt)  return false;
      if (filterType !== 'Todos' && row.type   !== filterType) return false;
      return true;
    });
    const inc = visRows.filter(row => row.type === 'income') .reduce((s, row) => s + val(rows.indexOf(row), m), 0);
    const exp = visRows.filter(row => row.type === 'expense').reduce((s, row) => s + val(rows.indexOf(row), m), 0);
    return { inc, exp, net: inc - exp };
  });

  const visRows = rows.map((row, r) => ({ ...row, r })).filter(row => {
    if (filterEnt  !== 'Todos' && row.entity !== filterEnt)  return false;
    if (filterType !== 'Todos' && row.type   !== filterType) return false;
    return true;
  });

  const COL_W  = 74;  // px per month column
  const FIRST_W = 130; // px for item name column

  const addRow = () => {
    if (!newRow?.desc) return;
    setRows(prev => [...prev, { desc: newRow.desc, type: newRow.type || 'expense', value: Number(newRow.value)||0, entity: newRow.entity||'PF', cat: newRow.cat||'Outros', day: 5 }]);
    setNewRow(null);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#F7F8FA', fontFamily: 'DM Sans, system-ui' }}>

      {/* Fixed top bar */}
      <div style={{ flexShrink: 0, padding: '56px 16px 12px', background: '#fff', borderBottom: '1.5px solid #ECEEF4', boxShadow: '0 2px 8px rgba(26,31,54,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <button onClick={onBack} style={{ width: 34, height: 34, borderRadius: '50%', background: '#F7F8FA', border: '1.5px solid #ECEEF4', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="#1A1F36" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#1A1F36' }}>Planilha de Recorrências</div>
            <div style={{ fontSize: 10, color: '#8B90A0', marginTop: 1 }}>{visRows.length} lançamentos · {MONTHS.length} meses · role para o lado</div>
          </div>
          <button onClick={() => setNewRow({ desc: '', type: 'expense', entity: 'PF', cat: 'Outros', value: '' })}
            style={{ width: 34, height: 34, borderRadius: '50%', background: '#1A1F36', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#fff', fontSize: 20, fontWeight: 300 }}>+</button>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 6 }}>
          {['Todos','PF','PJ'].map(f => (
            <button key={f} onClick={() => setFilterEnt(f)} style={{ padding: '5px 12px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600, fontFamily: 'DM Sans, system-ui', background: filterEnt === f ? '#1A1F36' : '#F0F1F5', color: filterEnt === f ? '#fff' : '#8B90A0' }}>{f}</button>
          ))}
          <div style={{ width: 1, background: '#ECEEF4', margin: '0 2px' }}/>
          {[['Todos','Todos'],['income','Receitas'],['expense','Despesas']].map(([k, l]) => (
            <button key={k} onClick={() => setFilterType(k)} style={{ padding: '5px 12px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600, fontFamily: 'DM Sans, system-ui', background: filterType === k ? (k === 'income' ? '#16A34A' : k === 'expense' ? '#DC2626' : '#1A1F36') : '#F0F1F5', color: filterType === k ? '#fff' : '#8B90A0' }}>{l}</button>
          ))}
        </div>
      </div>

      {/* Add new row form */}
      {newRow && (
        <div style={{ flexShrink: 0, padding: '10px 16px', background: '#F0FDF4', borderBottom: '1.5px solid #86EFAC', display: 'flex', gap: 8, alignItems: 'center' }}>
          <input placeholder="Descrição" value={newRow.desc} onChange={e => setNewRow(p => ({ ...p, desc: e.target.value }))}
            style={{ flex: 2, padding: '7px 10px', borderRadius: 8, border: '1.5px solid #86EFAC', fontSize: 12, fontFamily: 'DM Sans, system-ui', outline: 'none', background: '#fff' }}/>
          <input placeholder="Valor" value={newRow.value} onChange={e => setNewRow(p => ({ ...p, value: e.target.value }))} inputMode="numeric"
            style={{ flex: 1, padding: '7px 10px', borderRadius: 8, border: '1.5px solid #86EFAC', fontSize: 12, fontFamily: 'DM Sans, system-ui', outline: 'none', background: '#fff' }}/>
          <select value={newRow.type} onChange={e => setNewRow(p => ({ ...p, type: e.target.value }))}
            style={{ padding: '7px 8px', borderRadius: 8, border: '1.5px solid #86EFAC', fontSize: 11, fontFamily: 'DM Sans, system-ui', outline: 'none', background: '#fff', cursor: 'pointer' }}>
            <option value="income">Receita</option>
            <option value="expense">Despesa</option>
          </select>
          <select value={newRow.entity} onChange={e => setNewRow(p => ({ ...p, entity: e.target.value }))}
            style={{ padding: '7px 8px', borderRadius: 8, border: '1.5px solid #86EFAC', fontSize: 11, fontFamily: 'DM Sans, system-ui', outline: 'none', background: '#fff', cursor: 'pointer' }}>
            <option value="PF">PF</option>
            <option value="PJ">PJ</option>
          </select>
          <button onClick={addRow} style={{ padding: '7px 14px', borderRadius: 8, border: 'none', background: '#16A34A', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans, system-ui' }}>OK</button>
          <button onClick={() => setNewRow(null)} style={{ padding: '7px 10px', borderRadius: 8, border: 'none', background: '#FEF2F2', color: '#DC2626', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans, system-ui' }}>✕</button>
        </div>
      )}

      {/* Scrollable table */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* Sticky column headers */}
        <div ref={colRef} style={{ display: 'flex', overflowX: 'auto', overflowY: 'hidden', flexShrink: 0, background: '#fff', borderBottom: '2px solid #ECEEF4' }}
          id="sheet-scroll-header">
          {/* Corner */}
          <div style={{ width: FIRST_W, minWidth: FIRST_W, flexShrink: 0, padding: '8px 12px', background: '#fff', position: 'sticky', left: 0, zIndex: 3, borderRight: '2px solid #ECEEF4' }}>
            <div style={{ fontSize: 10, color: '#8B90A0', fontWeight: 600, textTransform: 'uppercase' }}>Lançamento</div>
          </div>
          {MONTHS.map((m, mi) => (
            <div key={mi} style={{ width: COL_W, minWidth: COL_W, flexShrink: 0, padding: '8px 4px', textAlign: 'center', background: mi === 0 ? '#EFF6FF' : '#fff', borderRight: '1px solid #F4F5F8' }}>
              <div style={{ fontSize: 11, fontWeight: mi === 0 ? 800 : 600, color: mi === 0 ? '#2563EB' : '#8B90A0' }}>{m}</div>
            </div>
          ))}
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto' }}
          onScroll={e => { const h = document.getElementById('sheet-scroll-header'); if (h) h.scrollLeft = e.target.scrollLeft; }}>
          <div style={{ minWidth: FIRST_W + COL_W * MONTHS.length }}>

            {/* Data rows */}
            {visRows.map((row, vi) => {
              const r     = row.r;
              const isInc = row.type === 'income';
              const rowBg = vi % 2 === 0 ? '#fff' : '#FAFBFC';
              return (
                <div key={r} style={{ display: 'flex', background: rowBg, borderBottom: '1px solid #F4F5F8' }}>
                  {/* Item name — sticky */}
                  <div style={{ width: FIRST_W, minWidth: FIRST_W, flexShrink: 0, padding: '8px 12px', position: 'sticky', left: 0, background: rowBg, zIndex: 2, borderRight: '2px solid #ECEEF4', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#1A1F36', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.desc}</div>
                    <div style={{ display: 'flex', gap: 4, marginTop: 2 }}>
                      <span style={{ fontSize: 8, padding: '1px 5px', borderRadius: 4, background: row.entity === 'PF' ? '#EFF6FF' : '#F5F3FF', color: row.entity === 'PF' ? '#2563EB' : '#7C3AED', fontWeight: 700 }}>{row.entity}</span>
                      <span style={{ fontSize: 8, padding: '1px 5px', borderRadius: 4, background: isInc ? '#F0FDF4' : '#FEF2F2', color: isInc ? '#16A34A' : '#DC2626', fontWeight: 700 }}>{isInc ? 'REC' : 'DES'}</span>
                    </div>
                  </div>

                  {/* Month cells */}
                  {MONTHS.map((_, mi) => {
                    const v     = val(r, mi);
                    const isEd  = editing?.r === r && editing?.m === mi;
                    const isOv  = overrides[r]?.[mi] !== undefined;
                    return (
                      <div key={mi} onClick={() => { setEditing({ r, m: mi }); setEditVal(String(v)); }}
                        style={{ width: COL_W, minWidth: COL_W, flexShrink: 0, padding: '5px 4px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid #F4F5F8', background: isEd ? (isInc ? '#F0FDF4' : '#FEF2F2') : mi === 0 ? '#EFF6FF20' : 'transparent', cursor: 'pointer', position: 'relative' }}>
                        {isEd ? (
                          <input autoFocus value={editVal}
                            onChange={e => setEditVal(e.target.value.replace(/\D/g,''))}
                            onBlur={commitEdit}
                            onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditing(null); }}
                            inputMode="numeric"
                            style={{ width: '100%', padding: '4px 4px', borderRadius: 6, border: `1.5px solid ${isInc ? '#86EFAC' : '#FECACA'}`, fontSize: 11, fontWeight: 700, color: isInc ? '#16A34A' : '#DC2626', background: '#fff', outline: 'none', textAlign: 'center', fontFamily: 'DM Sans, system-ui' }}/>
                        ) : (
                          <div style={{ fontSize: 11, fontWeight: isOv ? 800 : 500, color: isInc ? '#16A34A' : '#DC2626', textAlign: 'center', textDecoration: isOv ? 'underline dotted' : 'none' }}>
                            {v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}
                            {isOv && <span style={{ position: 'absolute', top: 3, right: 4, width: 5, height: 5, borderRadius: '50%', background: '#F59E0B' }}/>}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}

            {/* Totals rows */}
            {['inc','exp','net'].map(kind => {
              const labels = { inc: 'Total Receitas', exp: 'Total Despesas', net: 'Saldo Líquido' };
              const colors = { inc: '#16A34A', exp: '#DC2626', net: '#2563EB' };
              const bgs    = { inc: '#F0FDF4', exp: '#FEF2F2', net: '#EFF6FF' };
              return (
                <div key={kind} style={{ display: 'flex', background: bgs[kind], borderTop: kind === 'inc' ? '2px solid #ECEEF4' : 'none' }}>
                  <div style={{ width: FIRST_W, minWidth: FIRST_W, flexShrink: 0, padding: '9px 12px', position: 'sticky', left: 0, background: bgs[kind], zIndex: 2, borderRight: '2px solid #ECEEF4' }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: colors[kind] }}>{labels[kind]}</div>
                  </div>
                  {MONTHS.map((_, mi) => {
                    const v = kind === 'inc' ? colTotals[mi].inc : kind === 'exp' ? colTotals[mi].exp : colTotals[mi].net;
                    return (
                      <div key={mi} style={{ width: COL_W, minWidth: COL_W, flexShrink: 0, padding: '9px 4px', textAlign: 'center', borderRight: '1px solid #F4F5F8' }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: (kind === 'net' && v < 0) ? '#DC2626' : colors[kind] }}>
                          {v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}

          </div>
        </div>
      </div>

      {/* Bottom hint */}
      <div style={{ flexShrink: 0, padding: '8px 16px', background: '#fff', borderTop: '1px solid #ECEEF4', fontSize: 10, color: '#C4C7D4', textAlign: 'center' }}>
        Toque em qualquer célula para editar · pontos laranja = valor customizado · role ➝ para ver todos os meses
      </div>
    </div>
  );
}

Object.assign(window, { RecorrenciasSheet });
