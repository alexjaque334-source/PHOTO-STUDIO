import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider, ToastProvider } from '@/design-system';
import { App } from '@/app/App';
import '@/styles/globals.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="dark">
      <ToastProvider>
        <App />
      </ToastProvider>
    </ThemeProvider>
  </React.StrictMode>
);
