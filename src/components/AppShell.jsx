import React from 'react';

export function AppShell({ children, dark }) {
  return (
    <div
      className="app-shell"
      style={{
        minHeight: '100dvh',
        width: '100%',
        maxWidth: 'min(100%, 960px)',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        background: '#F7F8FA',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: "'DM Sans', system-ui, sans-serif",
        filter: dark ? 'invert(1) hue-rotate(180deg)' : 'none',
        transition: 'filter 0.35s ease',
      }}
    >
      {children}
    </div>
  );
}
