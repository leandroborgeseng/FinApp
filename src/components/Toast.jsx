import React from 'react';
import { subscribeToast } from '../lib/toast.js';

const STYLES = {
  success: { bg: '#F0FDF4', border: '#86EFAC', color: '#166534' },
  error: { bg: '#FEF2F2', border: '#FECACA', color: '#991B1B' },
};

function ToastHost() {
  const [items, setItems] = React.useState([]);

  React.useEffect(() => subscribeToast(setItems), []);

  if (!items.length) return null;

  return (
    <div style={{
      position: 'fixed',
      left: '50%',
      transform: 'translateX(-50%)',
      bottom: 'calc(88px + env(safe-area-inset-bottom, 0px))',
      zIndex: 200,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      width: 'min(92%, 360px)',
      pointerEvents: 'none',
    }}>
      {items.map((t) => {
        const s = STYLES[t.type] || STYLES.success;
        return (
          <div key={t.id} style={{
            padding: '12px 16px',
            borderRadius: 14,
            background: s.bg,
            border: `1px solid ${s.border}`,
            color: s.color,
            fontSize: 13,
            fontWeight: 600,
            fontFamily: 'DM Sans, system-ui',
            boxShadow: '0 8px 24px rgba(26,31,54,0.14)',
            textAlign: 'center',
          }}>
            {t.message}
          </div>
        );
      })}
    </div>
  );
}

export { ToastHost };
