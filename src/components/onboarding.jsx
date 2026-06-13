import React from 'react';
// onboarding.jsx — Login + Onboarding flow

function OnboardingApp({ onLogin }) {
  const [step, setStep]   = React.useState('slides'); // 'slides' | 'login'
  const [slide, setSlide] = React.useState(0);
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

  const handleLogin = () => {
    if (!email) { setErro('Informe seu e-mail'); return; }
    if (!senha)  { setErro('Informe sua senha'); return; }
    setErro('');
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      localStorage.setItem('fin_logged_in', '1');
      localStorage.setItem('fin_user_email', email);
      onLogin();
    }, 1200);
  };

  const accentColor = slides[slide]?.color || '#2563EB';

  return (
    <div style={{
      width: 390, minHeight: 844,
      background: '#F7F8FA',
      borderRadius: 54,
      overflow: 'hidden',
      position: 'relative',
      fontFamily: 'DM Sans, system-ui',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 32px 80px rgba(0,0,0,0.22)',
    }}>

      {/* Status bar */}
      <div style={{ height: 50, background: '#1A1F36', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '0 28px 10px', flexShrink: 0 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>9:41</span>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <svg width="16" height="12" viewBox="0 0 16 12" fill="white" opacity="0.9"><rect x="0" y="4" width="3" height="8" rx="1"/><rect x="4.5" y="2" width="3" height="10" rx="1"/><rect x="9" y="0" width="3" height="12" rx="1"/></svg>
          <svg width="16" height="12" viewBox="0 0 16 12" fill="white" opacity="0.9"><path d="M8 2C5.6 2 3.4 3 1.8 4.6L0 2.8C2 1 4.8 0 8 0s6 1 8 2.8L14.2 4.6C12.6 3 10.4 2 8 2z" fill="white"/><path d="M8 6C6.4 6 5 6.6 4 7.6L2.2 5.8C3.6 4.6 5.7 4 8 4s4.4.6 5.8 1.8L12 7.6C11 6.6 9.6 6 8 6z" fill="white"/><circle cx="8" cy="10" r="2" fill="white"/></svg>
          <div style={{ width: 24, height: 12, borderRadius: 4, border: '1.5px solid rgba(255,255,255,0.6)', padding: '1px 2px', display: 'flex', alignItems: 'center' }}>
            <div style={{ width: '75%', height: '100%', background: 'white', borderRadius: 2 }}/>
          </div>
        </div>
      </div>

      {step === 'slides' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#fff' }}>

          {/* Skip button */}
          <div style={{ padding: '16px 24px 0', display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={() => setStep('login')}
              style={{ background: 'none', border: 'none', color: '#8B90A0', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, system-ui' }}>
              Pular
            </button>
          </div>

          {/* Slide content */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 32px' }}>
            <div style={{ marginBottom: 32 }}>{slides[slide].icon}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#1A1F36', textAlign: 'center', lineHeight: 1.2, marginBottom: 16, letterSpacing: '-0.5px' }}>
              {slides[slide].title}
            </div>
            <div style={{ fontSize: 15, color: '#8B90A0', textAlign: 'center', lineHeight: 1.6 }}>
              {slides[slide].sub}
            </div>
          </div>

          {/* Dots */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 28 }}>
            {slides.map((_, i) => (
              <div key={i} onClick={() => setSlide(i)} style={{
                width: i === slide ? 24 : 8, height: 8, borderRadius: 4,
                background: i === slide ? accentColor : '#ECEEF4',
                transition: 'all 0.3s ease', cursor: 'pointer',
              }}/>
            ))}
          </div>

          {/* CTA */}
          <div style={{ padding: '0 24px 40px' }}>
            {slide < slides.length - 1 ? (
              <button onClick={() => setSlide(s => s + 1)} style={{
                width: '100%', padding: '16px', borderRadius: 16, border: 'none',
                background: accentColor, color: '#fff', fontSize: 16, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'DM Sans, system-ui',
                boxShadow: '0 4px 16px ' + accentColor + '44',
                transition: 'all 0.2s',
              }}>Próximo</button>
            ) : (
              <button onClick={() => setStep('login')} style={{
                width: '100%', padding: '16px', borderRadius: 16, border: 'none',
                background: 'linear-gradient(135deg,#1A1F36,#2563EB)', color: '#fff', fontSize: 16, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'DM Sans, system-ui',
                boxShadow: '0 4px 20px rgba(37,99,235,0.35)',
              }}>Começar agora</button>
            )}
          </div>
        </div>
      )}

      {step === 'login' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#fff' }}>

          {/* Top brand area */}
          <div style={{ background: '#1A1F36', padding: '28px 28px 40px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', right: -20, top: -20, width: 140, height: 140, borderRadius: '50%', background: 'rgba(37,99,235,0.18)' }}/>
            <div style={{ position: 'absolute', right: 30, bottom: -30, width: 80, height: 80, borderRadius: '50%', background: 'rgba(124,58,237,0.14)' }}/>
            <div style={{ position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2" y="7" width="5" height="9" rx="1.5" fill="white"/><rect x="8" y="4" width="5" height="12" rx="1.5" fill="rgba(255,255,255,0.7)"/><rect x="14" y="1" width="2" height="15" rx="1" fill="rgba(255,255,255,0.4)"/></svg>
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', letterSpacing: '-0.3px' }}>FinApp</div>
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 4 }}>Bem-vindo de volta</div>
              <div style={{ fontSize: 14, color: '#94A3CC' }}>Entre com sua conta para continuar</div>
            </div>
          </div>

          {/* Form */}
          <div style={{ flex: 1, padding: '32px 28px 40px', display: 'flex', flexDirection: 'column', gap: 16 }}>

            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#8B90A0', marginBottom: 8 }}>E-mail</div>
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setErro(''); }}
                placeholder="seu@email.com"
                style={{
                  width: '100%', padding: '14px 16px', borderRadius: 14,
                  border: '1.5px solid ' + (erro && !email ? '#EF4444' : '#ECEEF4'),
                  fontSize: 15, fontWeight: 500, color: '#1A1F36',
                  background: '#F7F8FA', outline: 'none',
                  fontFamily: 'DM Sans, system-ui', boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = '#2563EB'}
                onBlur={e => e.target.style.borderColor = '#ECEEF4'}
              />
            </div>

            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#8B90A0', marginBottom: 8 }}>Senha</div>
              <input
                type="password"
                value={senha}
                onChange={e => { setSenha(e.target.value); setErro(''); }}
                placeholder="••••••••"
                style={{
                  width: '100%', padding: '14px 16px', borderRadius: 14,
                  border: '1.5px solid ' + (erro && !senha ? '#EF4444' : '#ECEEF4'),
                  fontSize: 15, color: '#1A1F36',
                  background: '#F7F8FA', outline: 'none',
                  fontFamily: 'DM Sans, system-ui', boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = '#2563EB'}
                onBlur={e => e.target.style.borderColor = '#ECEEF4'}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
              />
            </div>

            {erro && (
              <div style={{ fontSize: 12, color: '#DC2626', fontWeight: 600, padding: '8px 12px', background: '#FEF2F2', borderRadius: 8 }}>
                {erro}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button style={{ background: 'none', border: 'none', fontSize: 13, color: '#2563EB', fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, system-ui' }}>
                Esqueci a senha
              </button>
            </div>

            <button onClick={handleLogin} disabled={loading} style={{
              width: '100%', padding: '16px', borderRadius: 16, border: 'none',
              background: loading ? '#C4C7D4' : 'linear-gradient(135deg,#1A1F36,#2563EB)',
              color: '#fff', fontSize: 16, fontWeight: 700,
              cursor: loading ? 'default' : 'pointer',
              fontFamily: 'DM Sans, system-ui',
              boxShadow: loading ? 'none' : '0 4px 20px rgba(37,99,235,0.3)',
              transition: 'all 0.2s', marginTop: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              {loading ? (
                <>
                  <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }}/>
                  Entrando…
                </>
              ) : 'Entrar'}
            </button>

            <button onClick={() => setStep('slides')}
              style={{ background: 'none', border: 'none', color: '#8B90A0', fontSize: 13, cursor: 'pointer', fontFamily: 'DM Sans, system-ui', marginTop: 4 }}>
              ← Voltar para apresentação
            </button>
          </div>

          {/* Demo hint */}
          <div style={{ padding: '0 28px 36px' }}>
            <div style={{ background: '#EFF6FF', borderRadius: 12, padding: '12px 14px', border: '1px solid #DBEAFE' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#2563EB', marginBottom: 2 }}>Modo demonstração</div>
              <div style={{ fontSize: 11, color: '#3B82F6' }}>Use qualquer e-mail + senha para entrar e explorar o protótipo completo.</div>
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
