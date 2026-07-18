import { useEffect } from 'react';
import { getSession, onAuthStateChange, currentUser } from './authRepo';
import { refreshProfile, clearCachedProfile } from './profileRepo';
import { syncNow } from './syncEngine';
import { useSyncStore } from '@/store/syncStore';

const PERIODIC_SYNC_MS = 5 * 60 * 1000; // 5 minutes, while the app is open

export function useAutoSync(): void {
  useEffect(() => {
    let unsubscribeAuth = () => {};

    (async () => {
      const session = await getSession();
      const user = currentUser(session);
      useSyncStore.getState().setSession(user?.id ?? null, user?.email ?? null);
      if (user) {
        refreshProfile(user.id);
        syncNow();
      }

      unsubscribeAuth = onAuthStateChange((session) => {
        const user = currentUser(session);
        const previousUserId = useSyncStore.getState().userId;
        useSyncStore.getState().setSession(user?.id ?? null, user?.email ?? null);

        if (user && user.id !== previousUserId) {
          refreshProfile(user.id);
          syncNow();
        }
        if (!user) {
          clearCachedProfile();
        }
      });
    })();

    // "Automatic sync when internet is available."
    const onOnline = () => syncNow();
    window.addEventListener('online', onOnline);

    const interval = setInterval(() => syncNow(), PERIODIC_SYNC_MS);

    return () => {
      unsubscribeAuth();
      window.removeEventListener('online', onOnline);
      clearInterval(interval);
    };
  }, []);
}
