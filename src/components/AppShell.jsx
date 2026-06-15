import React from 'react';
import { applyThemeClass } from '../lib/theme.js';
import { UpdatePrompt } from './UpdatePrompt.jsx';

export function AppShell({ children, dark }) {
  React.useEffect(() => {
    applyThemeClass(dark);
  }, [dark]);

  return (
    <div className="app-shell" style={{
      width: '100%',
      maxWidth: 'min(100%, 960px)',
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: "'DM Sans', system-ui, sans-serif",
    }}>
      {children}
      <UpdatePrompt />
    </div>
  );
}
