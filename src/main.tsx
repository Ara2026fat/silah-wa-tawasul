import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from '@/router';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { initThemeWatcher } from '@/store/themeStore';
import '@/index.css';

initThemeWatcher();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary level="app">
      <RouterProvider router={router} />
    </ErrorBoundary>
  </StrictMode>
);
