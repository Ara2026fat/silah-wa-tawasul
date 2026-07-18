import { lazy } from 'react';
import { createHashRouter } from 'react-router-dom';
import { App } from '@/App';

// Route-level code splitting: only the app shell (nav, theme, toasts,
// onboarding) is in the initial bundle. Each screen loads on first visit.
const DashboardPage = lazy(() => import('@/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const HomePage = lazy(() => import('@/pages/HomePage').then((m) => ({ default: m.HomePage })));
const ContactDetailPage = lazy(() =>
  import('@/pages/ContactDetailPage').then((m) => ({ default: m.ContactDetailPage }))
);
const AddEditContactPage = lazy(() =>
  import('@/pages/AddEditContactPage').then((m) => ({ default: m.AddEditContactPage }))
);
const GroupsPage = lazy(() => import('@/pages/GroupsPage').then((m) => ({ default: m.GroupsPage })));
const SettingsPage = lazy(() => import('@/pages/SettingsPage').then((m) => ({ default: m.SettingsPage })));

/**
 * Hash routing avoids needing server-side rewrite rules for a static PWA
 * deployed to any host (Netlify, GitHub Pages, a plain S3 bucket, etc).
 */
export const router = createHashRouter([
  {
    element: <App />,
    children: [
      { path: '/', element: <DashboardPage /> },
      { path: '/contacts', element: <HomePage /> },
      { path: '/contacts/new', element: <AddEditContactPage /> },
      { path: '/contacts/:id', element: <ContactDetailPage /> },
      { path: '/contacts/:id/edit', element: <AddEditContactPage /> },
      { path: '/groups', element: <GroupsPage /> },
      { path: '/settings', element: <SettingsPage /> },
    ],
  },
]);
