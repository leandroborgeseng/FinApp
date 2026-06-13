import React from 'react';

export function InstallPrompt() {
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

  if (isStandalone || dismissed || !deferred) return null;

  const install = async () => {
    deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
  };

  const dismiss = () => {
    localStorage.setItem('fin_pwa_dismissed', '1');
    setDismissed(true);
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, #EFF6FF, #F5F3FF)',
      border: '1.5px solid #BFDBFE',
      borderRadius: 16,
      padding: '14px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 10,
        background: 'linear-gradient(145deg, #1A1F36, #2563EB)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M12 3v12M7 10l5 5 5-5M5 21h14" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Instalar FinApp</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Acesso rápido na tela inicial, como app nativo</div>
      </div>
      <button onClick={install} style={{
        padding: '8px 14px', borderRadius: 10, border: 'none',
        background: '#2563EB', color: '#fff', fontSize: 12, fontWeight: 700,
        cursor: 'pointer', flexShrink: 0, fontFamily: 'inherit',
      }}>Instalar</button>
      <button onClick={dismiss} style={{
        background: 'none', border: 'none', color: 'var(--text-faint)',
        fontSize: 18, cursor: 'pointer', padding: 4, lineHeight: 1,
      }} aria-label="Fechar">×</button>
    </div>
  );
}
