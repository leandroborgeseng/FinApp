import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { APP_BUILD } from '../lib/appVersion.js';
import { clearApiCache } from '../store/offlineQueue.js';

/**
 * Banner fixo quando há nova versão do PWA (service worker em espera).
 * Também detecta mismatch de build após deploy (bundle novo carregado em aba antiga).
 */
export function UpdatePrompt() {
  const [buildStale, setBuildStale] = React.useState(false);
  const [updating, setUpdating] = React.useState(false);

  const swRegistrationRef = React.useRef(null);

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    immediate: true,
    onRegistered(registration) {
      swRegistrationRef.current = registration ?? null;
      registration?.update().catch(() => {});
    },
  });

  React.useEffect(() => {
    if (import.meta.env.DEV) return undefined;
    const id = window.setInterval(() => {
      swRegistrationRef.current?.update().catch(() => {});
    }, 30 * 60 * 1000);
    return () => window.clearInterval(id);
  }, []);

  React.useEffect(() => {
    if (import.meta.env.DEV) return undefined;
    const stored = localStorage.getItem('fin_app_build');
    if (stored && stored !== APP_BUILD) {
      setBuildStale(true);
    }
    return undefined;
  }, []);

  const show = !import.meta.env.DEV && (needRefresh || buildStale);
  if (!show) return null;

  const applyUpdate = async () => {
    setUpdating(true);
    try {
      await clearApiCache();
      if (needRefresh && updateServiceWorker) {
        await updateServiceWorker(true);
      } else {
        localStorage.setItem('fin_app_build', APP_BUILD);
        window.location.reload();
      }
    } catch {
      window.location.reload();
    } finally {
      setNeedRefresh(false);
      setBuildStale(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      left: '50%',
      transform: 'translateX(-50%)',
      bottom: 'calc(72px + env(safe-area-inset-bottom, 0px))',
      zIndex: 200,
      width: 'min(calc(100% - 24px), 420px)',
      background: 'linear-gradient(135deg, #1A1F36, #253056)',
      borderRadius: 14,
      padding: '12px 14px',
      boxShadow: '0 8px 32px rgba(26,31,54,0.35)',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      fontFamily: 'DM Sans, system-ui',
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
        background: 'rgba(255,255,255,0.12)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 18,
      }}>↻</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Nova versão disponível</div>
        <div style={{ fontSize: 11, color: '#94A3CC', marginTop: 2 }}>
          Toque em atualizar para carregar as últimas correções
        </div>
      </div>
      <button
        type="button"
        onClick={applyUpdate}
        disabled={updating}
        style={{
          padding: '9px 14px', borderRadius: 10, border: 'none', flexShrink: 0,
          background: '#2563EB', color: '#fff', fontSize: 12, fontWeight: 700,
          cursor: updating ? 'default' : 'pointer', opacity: updating ? 0.7 : 1,
          fontFamily: 'inherit',
        }}
      >
        {updating ? '…' : 'Atualizar'}
      </button>
    </div>
  );
}

/** Botão manual em Mais → Preferências. */
export function CheckForUpdateButton() {
  const [checking, setChecking] = React.useState(false);
  const [message, setMessage] = React.useState(null);

  const check = async () => {
    if (import.meta.env.DEV) {
      setMessage('Em desenvolvimento não há PWA para atualizar.');
      return;
    }
    setChecking(true);
    setMessage(null);
    try {
      const reg = await navigator.serviceWorker?.getRegistration();
      if (!reg) {
        setMessage('PWA não instalado — use pelo navegador ou instale o app.');
        return;
      }
      await reg.update();
      if (reg.waiting) {
        setMessage('Nova versão encontrada — use o botão flutuante “Atualizar”.');
      } else {
        setMessage('Você já está na versão mais recente.');
      }
    } catch {
      setMessage('Não foi possível verificar agora. Tente recarregar a página.');
    } finally {
      setChecking(false);
    }
  };

  return (
    <div>
      <div
        onClick={checking ? undefined : check}
        style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: '12px 12px',
          cursor: checking ? 'default' : 'pointer', opacity: checking ? 0.6 : 1,
        }}
      >
        <div style={{
          width: 34, height: 34, borderRadius: 9, background: 'var(--bg-subtle)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 15, color: 'var(--text-primary)', flexShrink: 0,
        }}>↻</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
            {checking ? 'Verificando…' : 'Verificar atualização'}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
            Versão {APP_BUILD}
          </div>
        </div>
      </div>
      {message && (
        <div style={{
          fontSize: 11, color: 'var(--text-muted)', padding: '0 12px 12px', lineHeight: 1.4,
        }}>
          {message}
        </div>
      )}
    </div>
  );
}
