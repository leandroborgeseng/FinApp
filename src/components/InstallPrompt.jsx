import React from 'react';

function isIos() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

export function InstallPrompt({ compact = false }) {
  const [deferred, setDeferred] = React.useState(null);
  const [dismissed, setDismissed] = React.useState(
    () => localStorage.getItem('fin_pwa_dismissed') === '1',
  );
  const [isStandalone, setIsStandalone] = React.useState(false);

  React.useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches
      || window.navigator.standalone === true;
    setIsStandalone(standalone);

    const handler = (e) => {
      e.preventDefault();
      setDeferred(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const dismiss = () => {
    localStorage.setItem('fin_pwa_dismissed', '1');
    setDismissed(true);
  };

  if (isStandalone || dismissed) return null;

  const install = async () => {
    if (!deferred) return;
    deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
  };

  const ios = isIos();
  const showChrome = Boolean(deferred);
  const showIos = !showChrome && ios;

  if (!showChrome && !showIos) return null;

  const wrapStyle = compact
    ? { marginBottom: 0 }
    : {};

  const cardStyle = {
    background: 'linear-gradient(135deg, #EFF6FF, #F5F3FF)',
    border: '1.5px solid #BFDBFE',
    borderRadius: compact ? 14 : 16,
    padding: compact ? '12px 14px' : '14px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    ...wrapStyle,
  };

  return (
    <div style={cardStyle}>
      <div style={{
        width: compact ? 36 : 40, height: compact ? 36 : 40, borderRadius: 10,
        background: 'linear-gradient(145deg, #1A1F36, #2563EB)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M12 3v12M7 10l5 5 5-5M5 21h14" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: compact ? 13 : 14, fontWeight: 700, color: 'var(--text-primary)' }}>
          {showIos ? 'Adicionar à Tela de Início' : 'Instalar FinApp'}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.35 }}>
          {showIos
            ? 'No Safari: toque em Compartilhar (↑) e escolha “Adicionar à Tela de Início”.'
            : 'Acesso rápido na tela inicial, como app nativo'}
        </div>
      </div>
      {showChrome && (
        <button onClick={install} type="button" style={{
          padding: '8px 14px', borderRadius: 10, border: 'none',
          background: '#2563EB', color: '#fff', fontSize: 12, fontWeight: 700,
          cursor: 'pointer', flexShrink: 0, fontFamily: 'inherit',
        }}>Instalar</button>
      )}
      <button onClick={dismiss} type="button" style={{
        background: 'none', border: 'none', color: 'var(--text-faint)',
        fontSize: 18, cursor: 'pointer', padding: 4, lineHeight: 1,
      }} aria-label="Fechar">×</button>
    </div>
  );
}
