import React from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { register } from '../api/auth.js';
import { toast } from '../lib/toast.js';

function OnboardingApp() {
  const { login } = useAuth();
  const [step, setStep]   = React.useState('slides');
  const [slide, setSlide] = React.useState(0);
  const [mode, setMode]   = React.useState('login');
  const [nome, setNome]   = React.useState('');
  const [email, setEmail] = React.useState('');
  const [senha, setSenha] = React.useState('');
  const [erro,  setErro]  = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const slides = [
    {
      icon: (
        <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
          <rect width="72" height="72" rx="20" fill="#1A1F36"/>
          <rect x="14" y="28" width="20" height="28" rx="4" fill="#2563EB"/>
          <rect x="26" y="20" width="20" height="36" rx="4" fill="#60A5FA"/>
          <rect x="38" y="32" width="20" height="24" rx="4" fill="#86EFAC"/>
        </svg>
      ),
      title: 'Controle total das suas finanças',
      sub: 'PF e PJ em uma só visão. Acompanhe receitas, despesas e investimentos com clareza.',
      color: '#2563EB',
    },
    {
      icon: (
        <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
          <rect width="72" height="72" rx="20" fill="#1A1F36"/>
          <circle cx="36" cy="36" r="22" stroke="#7C3AED" strokeWidth="4" fill="none"/>
          <path d="M36 14 A22 22 0 0 1 55 47" stroke="#86EFAC" strokeWidth="4" strokeLinecap="round"/>
          <path d="M36 14 A22 22 0 0 0 17 47" stroke="#2563EB" strokeWidth="4" strokeLinecap="round"/>
          <circle cx="36" cy="36" r="8" fill="#F59E0B"/>
        </svg>
      ),
      title: 'Independência financeira em 2029',
      sub: 'Tracker visual em direção à meta R$ 3M. Simuladores, projeções e análise tributária PJ.',
      color: '#7C3AED',
    },
    {
      icon: (
        <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
          <rect width="72" height="72" rx="20" fill="#1A1F36"/>
          <rect x="12" y="36" width="8" height="20" rx="2" fill="#EF4444"/>
          <rect x="24" y="28" width="8" height="28" rx="2" fill="#F59E0B"/>
          <rect x="36" y="20" width="8" height="36" rx="2" fill="#2563EB"/>
          <rect x="48" y="14" width="8" height="42" rx="2" fill="#86EFAC"/>
          <path d="M12 32 L28 24 L40 18 L52 12" stroke="white" strokeWidth="1.5" strokeDasharray="3 2" strokeLinecap="round"/>
        </svg>
      ),
      title: 'Fluxo de caixa dia a dia',
      sub: 'Saiba o saldo de cada dia do mês. Nunca mais seja pego de surpresa com saldo negativo.',
      color: '#16A34A',
    },
  ];

  const handleRegister = async () => {
    if (!nome.trim()) { setErro('Informe seu nome'); return; }
    if (!email.trim()) { setErro('Informe seu e-mail'); return; }
    if (senha.length < 6) { setErro('Senha com pelo menos 6 caracteres'); return; }
    setErro('');
    setLoading(true);
    try {
      await register(email.trim(), senha, nome.trim());
      toast.success('Conta criada com sucesso');
    } catch (e) {
      setErro(e.message || 'Falha ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email.trim()) { setErro('Informe seu e-mail'); return; }
    if (!senha.trim())  { setErro('Informe sua senha'); return; }
    setErro('');
    setLoading(true);
    try {
      await login(email.trim(), senha);
    } catch (e) {
      setErro(e.message || 'Falha no login');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setEmail('demo@finapp.com');
    setSenha('finapp2026');
    setErro('');
    setLoading(true);
    try {
      await login('demo@finapp.com', 'finapp2026');
    } catch (e) {
      setErro(e.message || 'Falha no login');
    } finally {
      setLoading(false);
    }
  };

  const accentColor = slides[slide]?.color || '#2563EB';

  return (
    <div style={{
      width: '100%', minHeight: '100dvh',
      background: 'var(--bg-app)',
      overflow: 'hidden',
      position: 'relative',
      fontFamily: 'DM Sans, system-ui',
      display: 'flex',
      flexDirection: 'column',
    }}>

      {step === 'slides' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-card)' }}>

          {/* Skip button */}
          <div style={{ padding: '16px 24px 0', display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={() => setStep('login')}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, system-ui' }}>
              Pular
            </button>
          </div>

          {/* Slide content */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 32px' }}>
            <div style={{ marginBottom: 32 }}>{slides[slide].icon}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', textAlign: 'center', lineHeight: 1.2, marginBottom: 16, letterSpacing: '-0.5px' }}>
              {slides[slide].title}
            </div>
            <div style={{ fontSize: 15, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.6 }}>
              {slides[slide].sub}
            </div>
          </div>

          {/* Dots */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 28 }}>
            {slides.map((_, i) => (
              <div key={i} onClick={() => setSlide(i)} style={{
                width: i === slide ? 24 : 8, height: 8, borderRadius: 4,
                background: i === slide ? accentColor : 'var(--border)',
                transition: 'all 0.3s ease', cursor: 'pointer',
              }}/>
            ))}
          </div>

          {/* CTA */}
          <div style={{ padding: '0 24px 40px' }}>
            {slide < slides.length - 1 ? (
              <button onClick={() => setSlide(s => s + 1)} style={{
                width: '100%', padding: '16px', borderRadius: 16, border: 'none',
                background: accentColor, color: 'var(--text-inverse)', fontSize: 16, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'DM Sans, system-ui',
                boxShadow: '0 4px 16px ' + accentColor + '44',
                transition: 'all 0.2s',
              }}>Próximo</button>
            ) : (
              <button onClick={() => setStep('login')} style={{
                width: '100%', padding: '16px', borderRadius: 16, border: 'none',
                background: 'linear-gradient(135deg,#1A1F36,#2563EB)', color: 'var(--text-inverse)', fontSize: 16, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'DM Sans, system-ui',
                boxShadow: '0 4px 20px rgba(37,99,235,0.35)',
              }}>Começar agora</button>
            )}
          </div>
        </div>
      )}

      {step === 'login' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-card)' }}>

          {/* Top brand area */}
          <div style={{ background: 'var(--text-primary)', padding: '28px 28px 40px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', right: -20, top: -20, width: 140, height: 140, borderRadius: '50%', background: 'rgba(37,99,235,0.18)' }}/>
            <div style={{ position: 'absolute', right: 30, bottom: -30, width: 80, height: 80, borderRadius: '50%', background: 'rgba(124,58,237,0.14)' }}/>
            <div style={{ position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2" y="7" width="5" height="9" rx="1.5" fill="white"/><rect x="8" y="4" width="5" height="12" rx="1.5" fill="rgba(255,255,255,0.7)"/><rect x="14" y="1" width="2" height="15" rx="1" fill="rgba(255,255,255,0.4)"/></svg>
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-inverse)', letterSpacing: '-0.3px' }}>FinApp</div>
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-inverse)', marginBottom: 4 }}>
                {mode === 'login' ? 'Bem-vindo de volta' : 'Criar conta'}
              </div>
              <div style={{ fontSize: 14, color: '#94A3CC' }}>
                {mode === 'login' ? 'Entre com sua conta para continuar' : 'Comece a organizar PF e PJ'}
              </div>
            </div>
          </div>

          {/* Form */}
          <div style={{ flex: 1, padding: '32px 28px 40px', display: 'flex', flexDirection: 'column', gap: 16 }}>

            {mode === 'register' && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>Nome</div>
                <input
                  type="text"
                  value={nome}
                  onChange={e => { setNome(e.target.value); setErro(''); }}
                  placeholder="Seu nome"
                  style={{
                    width: '100%', padding: '14px 16px', borderRadius: 14,
                    border: '1.5px solid var(--border)',
                    fontSize: 15, fontWeight: 500, color: 'var(--text-primary)',
                    background: 'var(--bg-app)', outline: 'none',
                    fontFamily: 'DM Sans, system-ui', boxSizing: 'border-box',
                  }}
                />
              </div>
            )}

            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>E-mail</div>
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setErro(''); }}
                placeholder="seu@email.com"
                style={{
                  width: '100%', padding: '14px 16px', borderRadius: 14,
                  border: '1.5px solid ' + (erro && !email ? '#EF4444' : 'var(--border)'),
                  fontSize: 15, fontWeight: 500, color: 'var(--text-primary)',
                  background: 'var(--bg-app)', outline: 'none',
                  fontFamily: 'DM Sans, system-ui', boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = '#2563EB'}
                onBlur={e => e.target.style.borderColor = '#ECEEF4'}
              />
            </div>

            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>Senha</div>
              <input
                type="password"
                value={senha}
                onChange={e => { setSenha(e.target.value); setErro(''); }}
                placeholder="••••••••"
                style={{
                  width: '100%', padding: '14px 16px', borderRadius: 14,
                  border: '1.5px solid ' + (erro && !senha ? '#EF4444' : 'var(--border)'),
                  fontSize: 15, color: 'var(--text-primary)',
                  background: 'var(--bg-app)', outline: 'none',
                  fontFamily: 'DM Sans, system-ui', boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = '#2563EB'}
                onBlur={e => e.target.style.borderColor = '#ECEEF4'}
                onKeyDown={e => e.key === 'Enter' && (mode === 'login' ? handleLogin() : handleRegister())}
              />
            </div>

            {erro && (
              <div style={{ fontSize: 12, color: '#DC2626', fontWeight: 600, padding: '8px 12px', background: '#FEF2F2', borderRadius: 8 }}>
                {erro}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setErro(''); }}
                style={{ background: 'none', border: 'none', fontSize: 13, color: '#2563EB', fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, system-ui' }}
              >
                {mode === 'login' ? 'Criar conta' : 'Já tenho conta'}
              </button>
              {mode === 'login' && (
                <button style={{ background: 'none', border: 'none', fontSize: 13, color: '#2563EB', fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, system-ui' }}>
                  Esqueci a senha
                </button>
              )}
            </div>

            <button onClick={mode === 'login' ? handleLogin : handleRegister} disabled={loading} style={{
              width: '100%', padding: '16px', borderRadius: 16, border: 'none',
              background: loading ? '#C4C7D4' : 'linear-gradient(135deg,#1A1F36,#2563EB)',
              color: 'var(--text-inverse)', fontSize: 16, fontWeight: 700,
              cursor: loading ? 'default' : 'pointer',
              fontFamily: 'DM Sans, system-ui',
              boxShadow: loading ? 'none' : '0 4px 20px rgba(37,99,235,0.3)',
              transition: 'all 0.2s', marginTop: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              {loading ? (
                <>
                  <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'var(--bg-card)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }}/>
                  Entrando…
                </>
              ) : (mode === 'login' ? 'Entrar' : 'Criar conta')}
            </button>

            <button onClick={() => setStep('slides')}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer', fontFamily: 'DM Sans, system-ui', marginTop: 4 }}>
              ← Voltar para apresentação
            </button>
          </div>

          {/* Demo hint */}
          <div style={{ padding: '0 28px 36px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button onClick={handleDemoLogin} disabled={loading} style={{
              width: '100%', padding: '12px', borderRadius: 12, border: '1.5px solid #2563EB',
              background: '#EFF6FF', color: '#2563EB', fontSize: 14, fontWeight: 700,
              cursor: loading ? 'default' : 'pointer', fontFamily: 'DM Sans, system-ui',
            }}>
              Entrar com conta demo
            </button>
            <div style={{ background: 'var(--bg-app)', borderRadius: 12, padding: '12px 14px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 2 }}>Credenciais demo</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>demo@finapp.com · finapp2026</div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

export { OnboardingApp };
