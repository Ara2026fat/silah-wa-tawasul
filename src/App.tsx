import { Suspense, useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ToastContainer } from '@/components/ui/Toast';
import { Spinner } from '@/components/ui/Spinner';
import { OnboardingModal } from '@/features/onboarding/OnboardingModal';
import { ensureDefaultGroups } from '@/db/seed';
import { useNotificationScheduler } from '@/features/notifications/useNotificationScheduler';
import { useAutoSync } from '@/features/sync/useAutoSync';
import { getSession } from '@/features/sync/authRepo';
import { syncNow } from '@/features/sync/syncEngine';

/** Never blocks boot for more than this, even if a sync pull hangs (slow network, etc). */
const FIRST_SYNC_TIMEOUT_MS = 4000;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function App() {
  const [ready, setReady] = useState(false);
  const location = useLocation();
  useNotificationScheduler();
  useAutoSync();

  useEffect(() => {
    (async () => {
      // A device with an already-signed-in session (persisted from a
      // previous visit) might be brand new locally — e.g. signing into an
      // existing account on a second phone. If we seed default groups
      // before the first sync pull runs, we'd create a second, differently
      // -id'd set of "default" groups that then collide with the ones
      // pulled from the cloud instead of being recognized as the same
      // ones. Give one bounded sync attempt a head start first. A device
      // with no session (the common case, and every local-only user)
      // skips this entirely and boots exactly as it always has.
      const session = await getSession();
      if (session) {
        await Promise.race([syncNow(), delay(FIRST_SYNC_TIMEOUT_MS)]);
      }
      await ensureDefaultGroups();
      setReady(true);
    })();
  }, []);

  if (!ready) {
    return (
      <div className="flex h-full items-center justify-center bg-sand-100 dark:bg-night-canvas">
        <Spinner />
      </div>
    );
  }

  return (
    <AppShell>
      <Suspense
        fallback={
          <div className="flex h-full items-center justify-center">
            <Spinner />
          </div>
        }
      >
        <ErrorBoundary level="route" label={location.pathname} key={location.pathname}>
          <Outlet />
        </ErrorBoundary>
      </Suspense>
      <ToastContainer />
      <OnboardingModal />
    </AppShell>
  );
}
