import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext.jsx';
import { startOfflineSync } from './api/client.js';
import App from './App';
import './styles/global.css';
import { applyThemeClass } from './lib/theme.js';

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
        <App />
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);
