import React from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { loadSavedLogin, saveSavedLogin } from '../lib/authPrefs.js';

function OnboardingApp() {
  const { login } = useAuth();
  const saved = React.useMemo(() => loadSavedLogin(), []);
  const [email, setEmail] = React.useState(saved.email);
  const [senha, setSenha] = React.useState(saved.password);
  const [remember, setRemember] = React.useState(saved.remember);
  const [erro, setErro] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const handleLogin = async () => {
    if (!email.trim()) { setErro('Informe seu e-mail'); return; }
    if (!senha.trim()) { setErro('Informe sua senha'); return; }
    setErro('');
    setLoading(true);
    try {
      await login(email.trim(), senha);
      saveSavedLogin(email.trim().toLowerCase(), senha, remember);
    } catch (e) {
      setErro(e.message || 'Falha no login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      width: '100%', minHeight: '100dvh',
      background: 'var(--bg-app)',
      fontFamily: 'DM Sans, system-ui',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-card)' }}>
        <div style={{ background: 'var(--text-primary)', padding: '32px 28px 44px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: -20, top: -20, width: 140, height: 140, borderRadius: '50%', background: 'rgba(37,99,235,0.18)' }}/>
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2" y="7" width="5" height="9" rx="1.5" fill="white"/><rect x="8" y="4" width="5" height="12" rx="1.5" fill="rgba(255,255,255,0.7)"/><rect x="14" y="1" width="2" height="15" rx="1" fill="rgba(255,255,255,0.4)"/></svg>
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-inverse)', letterSpacing: '-0.3px' }}>FinApp</div>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-inverse)', marginBottom: 4 }}>Seu painel financeiro</div>
            <div style={{ fontSize: 14, color: '#94A3CC' }}>PF e PJ em um só lugar</div>
          </div>
        </div>

        <div style={{ flex: 1, padding: '28px 28px 32px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>E-mail</div>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setErro(''); }}
              autoComplete="username"
              style={{
                width: '100%', padding: '14px 16px', borderRadius: 14,
                border: '1.5px solid var(--border)',
                fontSize: 15, fontWeight: 500, color: 'var(--text-primary)',
                background: 'var(--bg-app)', outline: 'none',
                fontFamily: 'DM Sans, system-ui', boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>Senha</div>
            <input
              type="password"
              value={senha}
              onChange={(e) => { setSenha(e.target.value); setErro(''); }}
              autoComplete="current-password"
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              style={{
                width: '100%', padding: '14px 16px', borderRadius: 14,
                border: '1.5px solid var(--border)',
                fontSize: 15, color: 'var(--text-primary)',
                background: 'var(--bg-app)', outline: 'none',
                fontFamily: 'DM Sans, system-ui', boxSizing: 'border-box',
              }}
            />
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-muted)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              style={{ width: 16, height: 16, accentColor: '#2563EB' }}
            />
            Lembrar neste dispositivo
          </label>

          {erro && (
            <div style={{ fontSize: 12, color: '#DC2626', fontWeight: 600, padding: '8px 12px', background: '#FEF2F2', borderRadius: 8 }}>
              {erro}
            </div>
          )}

          <button type="button" onClick={handleLogin} disabled={loading} style={{
            width: '100%', padding: '16px', borderRadius: 16, border: 'none',
            background: loading ? '#C4C7D4' : 'linear-gradient(135deg,#1A1F36,#2563EB)',
            color: 'var(--text-inverse)', fontSize: 16, fontWeight: 700,
            cursor: loading ? 'default' : 'pointer',
            fontFamily: 'DM Sans, system-ui',
            boxShadow: loading ? 'none' : '0 4px 20px rgba(37,99,235,0.3)',
            marginTop: 4,
          }}>
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

export { OnboardingApp };
