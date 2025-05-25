console.log('main.tsx starting execution');

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { NetworkProvider } from './contexts/NetworkContext';
import theme from './theme';
import App from './App';
import './index.css';

// Add global error handler for development
if (import.meta.env.DEV) {
  window.onerror = (msg, url, line, col, error) => {
    console.error('[Global Error]', { msg, url, line, col, error });
    return false;
  };

  window.addEventListener('unhandledrejection', event => {
    console.error('[Unhandled Promise]', event.reason);
  });
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

try {
  console.log('Looking for root element');
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    console.error('Root element not found');
    throw new Error('Root element not found');
  }
  
  console.log('Creating React root');
  const root = ReactDOM.createRoot(rootElement);
  
  console.log('Starting render');
  root.render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <CssBaseline />
            <BrowserRouter
              future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true
              }}
            >
              <AuthProvider>
                <NetworkProvider>
                  <ToastProvider>
                    <App />
                  </ToastProvider>
                </NetworkProvider>
              </AuthProvider>
            </BrowserRouter>
          </LocalizationProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </React.StrictMode>
  );
  
  console.log('Initial render complete');
} catch (error) {
  console.error('Fatal Error', error);
  document.body.innerHTML = `
    <div style="color: red; padding: 20px;">
      <h1>Error</h1>
      <pre>${error instanceof Error ? error.message : 'Unknown error'}</pre>
    </div>
  `;
} 