import React from 'react';

export function AppShell({ children, dark }) {
  return (
    <div
      className="app-shell"
      style={{
        height: '100dvh',
        width: '100%',
        maxWidth: 480,
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        background: '#F7F8FA',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: "'DM Sans', system-ui, sans-serif",
        filter: dark ? 'invert(1) hue-rotate(180deg)' : 'none',
        transition: 'filter 0.35s ease',
        boxShadow: '0 0 0 1px rgba(26,31,54,0.06)',
      }}
    >
      {children}
    </div>
  );
}
