// navigation.jsx — BottomNav + FAB

const NAV_TABS = [
  {
    id: 'dashboard', label: 'Início',
    icon: (active) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M3 12L12 3L21 12V20C21 20.55 20.55 21 20 21H15V15H9V21H4C3.45 21 3 20.55 3 20V12Z"
          fill={active ? '#2563EB' : 'none'} stroke={active ? '#2563EB' : '#8B90A0'}
          strokeWidth="1.7" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    id: 'movimentos', label: 'Movimentos',
    icon: (active) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M7 16L12 21L17 16" stroke={active ? '#2563EB' : '#8B90A0'} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12 21V9" stroke={active ? '#2563EB' : '#8B90A0'} strokeWidth="1.7" strokeLinecap="round"/>
        <path d="M17 8L12 3L7 8" stroke={active ? '#2563EB' : '#8B90A0'} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12 3V15" stroke={active ? '#2563EB' : '#8B90A0'} strokeWidth="1.7" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'planejamento', label: 'Planejar',
    icon: (active) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="4" width="18" height="17" rx="2.5" stroke={active ? '#2563EB' : '#8B90A0'} strokeWidth="1.7"/>
        <path d="M16 2V6M8 2V6" stroke={active ? '#2563EB' : '#8B90A0'} strokeWidth="1.7" strokeLinecap="round"/>
        <path d="M3 9H21" stroke={active ? '#2563EB' : '#8B90A0'} strokeWidth="1.7"/>
        <rect x="7" y="13" width="2" height="2" rx="0.5" fill={active ? '#2563EB' : '#8B90A0'}/>
        <rect x="11" y="13" width="2" height="2" rx="0.5" fill={active ? '#2563EB' : '#8B90A0'}/>
        <rect x="15" y="13" width="2" height="2" rx="0.5" fill={active ? '#2563EB' : '#8B90A0'}/>
      </svg>
    ),
  },
  {
    id: 'patrimonio', label: 'Patrimônio',
    icon: (active) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <polyline points="3,17 8,11 13,14 21,6" stroke={active ? '#2563EB' : '#8B90A0'} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
        <polyline points="17,6 21,6 21,10" stroke={active ? '#2563EB' : '#8B90A0'} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
        <line x1="3" y1="20" x2="21" y2="20" stroke={active ? '#2563EB' : '#8B90A0'} strokeWidth="1.7" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'mais', label: 'Mais',
    icon: (active) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle cx="5"  cy="12" r="1.8" fill={active ? '#2563EB' : '#8B90A0'}/>
        <circle cx="12" cy="12" r="1.8" fill={active ? '#2563EB' : '#8B90A0'}/>
        <circle cx="19" cy="12" r="1.8" fill={active ? '#2563EB' : '#8B90A0'}/>
      </svg>
    ),
  },
];

function BottomNav({ active, onTabChange }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start',
      background: 'rgba(255,255,255,0.96)',
      backdropFilter: 'blur(12px)',
      borderTop: '1px solid #ECEEF4',
      paddingTop: 8,
      paddingBottom: 34,
      flexShrink: 0,
      zIndex: 40,
    }}>
      {NAV_TABS.map(tab => {
        const isActive = active === tab.id;
        return (
          <button key={tab.id}
            onClick={() => onTabChange(tab.id)}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 3,
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '4px 0', WebkitTapHighlightColor: 'transparent',
            }}>
            {tab.icon(isActive)}
            <span style={{
              fontSize: 10, fontWeight: isActive ? 600 : 400,
              color: isActive ? '#2563EB' : '#8B90A0',
              fontFamily: 'DM Sans, system-ui',
              lineHeight: 1,
            }}>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function FAB({ onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        position: 'absolute',
        right: 20,
        bottom: 96,
        width: 52,
        height: 52,
        borderRadius: '50%',
        background: '#2563EB',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 16px rgba(37,99,235,0.45)',
        zIndex: 50,
        WebkitTapHighlightColor: 'transparent',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
      }}
      onMouseDown={e => e.currentTarget.style.transform = 'scale(0.93)'}
      onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
    >
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M11 4V18M4 11H18" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
      </svg>
    </button>
  );
}

function SyncBadge({ status = 'synced' }) {
  const cfg = {
    offline:    { color: '#EF4444', label: 'Offline'        },
    syncing:    { color: '#F59E0B', label: 'Sincronizando…' },
    synced:     { color: '#22C55E', label: 'Sincronizado'   },
  }[status];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <div style={{ width: 7, height: 7, borderRadius: '50%', background: cfg.color, flexShrink: 0 }}/>
      <span style={{ fontSize: 11, color: cfg.color, fontFamily: 'DM Sans, system-ui', fontWeight: 500 }}>
        {cfg.label}
      </span>
    </div>
  );
}

Object.assign(window, { BottomNav, FAB, SyncBadge });
