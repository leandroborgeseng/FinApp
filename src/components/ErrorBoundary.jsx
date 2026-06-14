import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[FinApp]', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: '100dvh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 12,
          padding: 24, fontFamily: 'DM Sans, system-ui', background: 'var(--bg-app)',
        }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#DC2626' }}>Algo deu errado</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', maxWidth: 320 }}>
            {this.state.error?.message || 'Erro inesperado na interface'}
          </div>
          <button
            type="button"
            onClick={async () => {
              try {
                const { db } = await import('../lib/db.js');
                await db.apiCache.clear();
                await db.syncQueue.clear();
              } catch { /* ignore */ }
              window.location.reload();
            }}
            style={{
              padding: '10px 16px', borderRadius: 12, border: '1.5px solid var(--border)',
              background: 'var(--bg-card)', color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer',
            }}
          >
            Limpar cache e recarregar
          </button>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 20px', borderRadius: 12, border: 'none',
              background: '#2563EB', color: '#fff', fontWeight: 700, cursor: 'pointer',
            }}
          >
            Recarregar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
