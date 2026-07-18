import { useEffect } from 'react';
import { checkAndNotifyDueContacts } from '@/features/notifications/notificationService';

/** Runs the "anything due?" check on mount, on tab focus, and every 30 minutes while open. */
export function useNotificationScheduler(): void {
  useEffect(() => {
    checkAndNotifyDueContacts();

    const onVisible = () => {
      if (document.visibilityState === 'visible') checkAndNotifyDueContacts();
    };
    document.addEventListener('visibilitychange', onVisible);

    const interval = setInterval(checkAndNotifyDueContacts, 30 * 60 * 1000);

    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      clearInterval(interval);
    };
  }, []);
}
