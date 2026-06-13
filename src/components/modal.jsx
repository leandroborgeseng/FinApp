import React from 'react';
// modal.jsx — Novo Lançamento + Calculadora de Financiamento

/* ── Amortization helpers ─────────────────────────── */
function calcPMT(principal, cetAnual, nParcelas, sistema) {
  const r = Math.pow(1 + cetAnual / 100, 1 / 12) - 1;
  if (r === 0 || nParcelas === 0) return principal / (nParcelas || 1);
  return sistema === 'price'
    ? principal * r / (1 - Math.pow(1 + r, -nParcelas))
    : principal / nParcelas + principal * r; // SAC 1ª parcela
}

function generateSchedule({ principal, cetAnual, seguroAnual, sistema, nParcelas, diaVenc, startDate, entity, desc }) {
  const r  = Math.pow(1 + cetAnual / 100, 1 / 12) - 1;
  const rs = (seguroAnual || 0) / 100 / 12;
  const pmtPrice = sistema === 'price' && r > 0
    ? principal * r / (1 - Math.pow(1 + r, -nParcelas))
    : null;
  const amortSAC = principal / nParcelas;
  let outstanding = principal;
  const [yr, mo] = startDate.split('-').map(Number);
  return Array.from({ length: nParcelas }, (_, i) => {
    const interest  = outstanding * r;
    const insurance = outstanding * rs;
    const amort     = sistema === 'price' ? (pmtPrice - interest) : amortSAC;
    const pmtBase   = sistema === 'price' ? pmtPrice : (amort + interest);
    const total     = pmtBase + insurance;
    outstanding     = Math.max(0, outstanding - amort);
    const d = new Date(yr, mo - 1 + i, diaVenc);
    return {
      n: i + 1,
      date: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(diaVenc).padStart(2,'0')}`,
      amort:   Math.round(amort    * 100) / 100,
      interest:Math.round(interest * 100) / 100,
      insurance:Math.round(insurance*100) / 100,
      total:   Math.round(total    * 100) / 100,
      outstanding: Math.round(outstanding * 100) / 100,
      entity, desc,
    };
  });
}

/* ── Modal component ──────────────────────────────── */
function NovoLancamentoModal({ onClose, onSave, onSaveFinancing }) {
  const [type,    setType]    = React.useState('expense');
  // Regular fields
  const [desc,    setDesc]    = React.useState('');
  const [value,   setValue]   = React.useState('');
  const [account, setAccount] = React.useState('PF');
  const [cat,     setCat]     = React.useState('');
  const [date,    setDate]    = React.useState(new Date().toISOString().slice(0,10));
  const [status,  setStatus]  = React.useState('realizado');
  // Financing fields
  const [fDesc,      setFDesc]      = React.useState('');
  const [fPrincipal, setFPrincipal] = React.useState('');
  const [fSistema,   setFSistema]   = React.useState('price');
  const [fCET,       setFCET]       = React.useState('');
  const [fSeguro,    setFSeguro]    = React.useState('');
  const [fParcelas,  setFParcelas]  = React.useState('');
  const [fDiaVenc,   setFDiaVenc]   = React.useState(10);
  const [fStartDate, setFStartDate] = React.useState(
    (() => { const d = new Date(); d.setMonth(d.getMonth()+1); d.setDate(1); return d.toISOString().slice(0,10); })()
  );
  const [fEntity,    setFEntity]    = React.useState('PF');

  const isFinanc = type === 'financ';

  // Live PMT calc
  const principal  = parseFloat(String(fPrincipal).replace(',','.')) || 0;
  const cetAnual   = parseFloat(String(fCET).replace(',','.'))       || 0;
  const seguro     = parseFloat(String(fSeguro).replace(',','.'))    || 0;
  const nParcelas  = parseInt(fParcelas)                              || 0;
  const r          = cetAnual > 0 ? Math.pow(1 + cetAnual / 100, 1/12) - 1 : 0;
  const pmtBase    = principal > 0 && cetAnual > 0 && nParcelas > 0
    ? calcPMT(principal, cetAnual, nParcelas, fSistema) : 0;
  const insurMonthly = principal * (seguro / 100) / 12;
  const pmtTotal   = pmtBase + insurMonthly;
  const amort1     = pmtBase - principal * r; // amortização mês 1 (funciona para Price e SAC)
  const juros1     = principal * r;
  const endDate    = React.useMemo(() => {
    if (!nParcelas || !fStartDate) return '';
    const [y, m] = fStartDate.split('-').map(Number);
    const d = new Date(y, m - 1 + nParcelas - 1, fDiaVenc);
    return d.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
  }, [nParcelas, fStartDate, fDiaVenc]);

  const typeConfig = {
    income:   { label: 'Receita',       color: '#16A34A', bg: '#F0FDF4' },
    expense:  { label: 'Despesa',       color: '#DC2626', bg: '#FEF2F2' },
    transfer: { label: 'Transferência', color: '#2563EB', bg: '#EFF6FF' },
    invest:   { label: 'Investimento',  color: '#7C3AED', bg: '#F5F3FF' },
    financ:   { label: 'Financiamento', color: '#EA580C', bg: '#FFF7ED' },
  };

  const canSave = isFinanc
    ? (fDesc.trim() && principal > 0 && cetAnual > 0 && nParcelas > 0)
    : (desc.trim() && value);

  const handleSave = () => {
    if (!canSave) return;
    if (isFinanc) {
      const schedule = generateSchedule({ principal, cetAnual, seguroAnual: seguro, sistema: fSistema, nParcelas, diaVenc: fDiaVenc, startDate: fStartDate, entity: fEntity, desc: fDesc });
      onSaveFinancing?.({ id: Date.now(), desc: fDesc, principal, cetAnual, seguroAnual: seguro, sistema: fSistema, nParcelas, diaVenc: fDiaVenc, startDate: fStartDate, entity: fEntity, pmtTotal: Math.round(pmtTotal*100)/100, schedule });
    } else {
      onSave?.({ type, desc, value: parseFloat(String(value).replace(',','.')), account, cat, date, status });
    }
    onClose();
  };

  const inp = { width:'100%', padding:'11px 14px', borderRadius:12, border:'1.5px solid #ECEEF4', fontSize:15, fontFamily:'DM Sans, system-ui', color:'#1A1F36', background:'#F7F8FA', outline:'none', boxSizing:'border-box', appearance:'none' };
  const lbl = { fontSize:11, fontWeight:600, color:'#8B90A0', fontFamily:'DM Sans, system-ui', letterSpacing:'0.05em', textTransform:'uppercase', marginBottom:5, display:'block' };

  return (
    <div style={{ position:'absolute', inset:0, zIndex:100, display:'flex', flexDirection:'column', justifyContent:'flex-end', background:'rgba(15,20,40,0.45)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background:'#fff', borderRadius:'24px 24px 0 0', padding:'0 0 40px', boxShadow:'0 -8px 40px rgba(0,0,0,0.12)', maxHeight:'92%', overflowY:'auto' }}>

        <div style={{ display:'flex', justifyContent:'center', paddingTop:12, paddingBottom:4 }}>
          <div style={{ width:36, height:4, borderRadius:2, background:'#DCDEE6' }}/>
        </div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 20px 16px' }}>
          <span style={{ fontSize:18, fontWeight:700, color:'#1A1F36', fontFamily:'DM Sans, system-ui' }}>Novo Lançamento</span>
          <button onClick={onClose} style={{ background:'#F0F1F5', border:'none', borderRadius:'50%', width:32, height:32, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 1L13 13M13 1L1 13" stroke="#8B90A0" strokeWidth="2" strokeLinecap="round"/></svg>
          </button>
        </div>

        <div style={{ padding:'0 20px', display:'flex', flexDirection:'column', gap:16 }}>

          {/* Type selector */}
          <div>
            <span style={lbl}>Tipo</span>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {Object.entries(typeConfig).map(([k, cfg]) => (
                <button key={k} onClick={() => setType(k)} style={{ flex:1, minWidth:'28%', padding:'8px 4px', borderRadius:10, border:'1.5px solid', borderColor: type===k ? cfg.color : '#ECEEF4', background: type===k ? cfg.bg : '#fff', cursor:'pointer', fontFamily:'DM Sans, system-ui', fontSize:11, fontWeight:600, color: type===k ? cfg.color : '#8B90A0', transition:'all 0.15s' }}>
                  {cfg.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── FINANCING FORM ── */}
          {isFinanc && (<>
            <div>
              <label style={lbl}>Descrição</label>
              <input style={inp} value={fDesc} onChange={e=>setFDesc(e.target.value)} placeholder="Ex: Financiamento Santander — Sala"/>
            </div>
            <div>
              <label style={lbl}>Valor financiado (R$)</label>
              <input style={{...inp, fontSize:20, fontWeight:700, color:'#EA580C'}} value={fPrincipal} onChange={e=>setFPrincipal(e.target.value.replace(/[^\d,.]/g,''))} placeholder="0,00" inputMode="decimal"/>
            </div>
            <div>
              <label style={lbl}>Sistema de amortização</label>
              <div style={{ display:'flex', background:'#ECEEF4', borderRadius:12, padding:3, gap:2 }}>
                {[['price','Tabela Price'],['sac','SAC']].map(([k,l]) => (
                  <button key={k} onClick={() => setFSistema(k)} style={{ flex:1, padding:'8px', borderRadius:9, border:'none', cursor:'pointer', background: fSistema===k ? '#fff' : 'transparent', color: fSistema===k ? '#1A1F36' : '#8B90A0', fontWeight: fSistema===k ? 700 : 500, fontSize:13, fontFamily:'DM Sans, system-ui', boxShadow: fSistema===k ? '0 1px 4px rgba(26,31,54,0.1)' : 'none', transition:'all 0.2s' }}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display:'flex', gap:12 }}>
              <div style={{ flex:1 }}>
                <label style={lbl}>CET (% a.a.)</label>
                <input style={inp} value={fCET} onChange={e=>setFCET(e.target.value.replace(/[^\d,.]/g,''))} placeholder="Ex: 12,5" inputMode="decimal"/>
              </div>
              <div style={{ flex:1 }}>
                <label style={lbl}>Seguro (% a.a.)</label>
                <input style={inp} value={fSeguro} onChange={e=>setFSeguro(e.target.value.replace(/[^\d,.]/g,''))} placeholder="Opcional" inputMode="decimal"/>
              </div>
            </div>
            <div style={{ display:'flex', gap:12 }}>
              <div style={{ flex:1 }}>
                <label style={lbl}>Nº parcelas</label>
                <input style={inp} value={fParcelas} onChange={e=>setFParcelas(e.target.value.replace(/\D/g,''))} placeholder="Ex: 120" inputMode="numeric"/>
              </div>
              <div style={{ flex:1 }}>
                <label style={lbl}>Dia de vencimento</label>
                <select style={inp} value={fDiaVenc} onChange={e=>setFDiaVenc(Number(e.target.value))}>
                  {[1,5,8,10,12,15,20,25,28,30].map(d=><option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display:'flex', gap:12 }}>
              <div style={{ flex:1 }}>
                <label style={lbl}>Data da 1ª parcela</label>
                <input style={inp} type="date" value={fStartDate} onChange={e=>setFStartDate(e.target.value)}/>
              </div>
              <div style={{ flex:1 }}>
                <label style={lbl}>Conta</label>
                <select style={inp} value={fEntity} onChange={e=>setFEntity(e.target.value)}>
                  <option value="PF">Pessoa Física</option>
                  <option value="PJ">Pessoa Jurídica</option>
                </select>
              </div>
            </div>

            {/* Live preview */}
            {pmtTotal > 0.01 && (
              <div style={{ background:'#FFF7ED', borderRadius:14, padding:'14px 16px', border:'1.5px solid #FDBA74' }}>
                <div style={{ fontSize:10, fontWeight:700, color:'#EA580C', letterSpacing:'0.06em', marginBottom:10 }}>PARCELA CALCULADA — MÊS 1</div>
                <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                  {[
                    ['Amortização',    amort1,        '#1A1F36'],
                    ['Juros',          juros1,        '#DC2626'],
                    ['Seguro',         insurMonthly,  '#8B90A0'],
                  ].filter(([,v]) => v > 0.01).map(([l,v,c]) => (
                    <div key={l} style={{ display:'flex', justifyContent:'space-between', fontSize:12 }}>
                      <span style={{ color:'#8B90A0' }}>{l}</span>
                      <span style={{ fontWeight:600, color:c }}>{fmt(v)}</span>
                    </div>
                  ))}
                  <div style={{ height:1, background:'#FDBA74', margin:'4px 0' }}/>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
                    <span style={{ fontSize:13, fontWeight:700, color:'#EA580C' }}>Total/mês</span>
                    <span style={{ fontSize:22, fontWeight:800, color:'#EA580C', letterSpacing:'-0.5px' }}>{fmt(pmtTotal)}</span>
                  </div>
                  {fSistema === 'sac' && <div style={{ fontSize:10, color:'#8B90A0', marginTop:2 }}>SAC: parcela diminui a cada mês</div>}
                  {endDate && <div style={{ fontSize:11, color:'#8B90A0', marginTop:2 }}>{nParcelas}× · quitação em {endDate}</div>}
                </div>
              </div>
            )}
          </>)}

          {/* ── REGULAR FORM ── */}
          {!isFinanc && (<>
            <div>
              <label style={lbl}>Descrição</label>
              <input style={inp} value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Ex: Receita UNIMED"/>
            </div>
            <div>
              <label style={lbl}>Valor (R$)</label>
              <input style={{...inp, fontSize:20, fontWeight:700, color:typeConfig[type].color}} value={value} onChange={e=>setValue(e.target.value.replace(/[^\d,.]/g,''))} placeholder="0,00" inputMode="decimal"/>
            </div>
            <div style={{ display:'flex', gap:12 }}>
              <div style={{ flex:1 }}>
                <label style={lbl}>Conta</label>
                <select style={inp} value={account} onChange={e=>setAccount(e.target.value)}>
                  <option value="PF">Pessoa Física</option><option value="PJ">Pessoa Jurídica</option>
                </select>
              </div>
              <div style={{ flex:1 }}>
                <label style={lbl}>Categoria</label>
                <select style={inp} value={cat} onChange={e=>setCat(e.target.value)}>
                  <option value="">Selecionar…</option>
                  <option>Receita PJ</option><option>Salário</option><option>Aluguel</option>
                  <option>Educação</option><option>Saúde</option><option>Financiamento</option>
                  <option>Impostos</option><option>Investimento</option><option>Cartão</option><option>Outros</option>
                </select>
              </div>
            </div>
            <div style={{ display:'flex', gap:12 }}>
              <div style={{ flex:1 }}>
                <label style={lbl}>Data</label>
                <input style={inp} type="date" value={date} onChange={e=>setDate(e.target.value)}/>
              </div>
              <div style={{ flex:1 }}>
                <label style={lbl}>Situação</label>
                <select style={inp} value={status} onChange={e=>setStatus(e.target.value)}>
                  <option value="realizado">Realizado</option><option value="previsto">Previsto</option>
                </select>
              </div>
            </div>
          </>)}

          <button onClick={handleSave} style={{ width:'100%', padding:'15px', borderRadius:14, background: canSave ? (isFinanc ? '#EA580C' : '#2563EB') : '#ECEEF4', color: canSave ? '#fff' : '#8B90A0', border:'none', cursor: canSave ? 'pointer' : 'default', fontSize:16, fontWeight:700, fontFamily:'DM Sans, system-ui', transition:'background 0.2s' }}>
            {isFinanc ? 'Criar financiamento e gerar cronograma' : 'Salvar lançamento'}
          </button>
        </div>
      </div>
    </div>
  );
}

export { NovoLancamentoModal, generateSchedule };
