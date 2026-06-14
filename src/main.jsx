import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext.jsx';
import { startOfflineSync } from './api/client.js';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary.jsx';
import './styles/global.css';
import { applyThemeClass } from './lib/theme.js';
import { APP_BUILD } from './lib/appVersion.js';
import { db } from './lib/db.js';

if (localStorage.getItem('fin_app_build') !== APP_BUILD) {
  db.apiCache.clear().catch(() => {}).finally(() => {
    localStorage.setItem('fin_app_build', APP_BUILD);
  });
}

if (localStorage.getItem('fin_dark') === '1') {
  applyThemeClass(true);
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

startOfflineSync(() => {
  queryClient.invalidateQueries();
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);
