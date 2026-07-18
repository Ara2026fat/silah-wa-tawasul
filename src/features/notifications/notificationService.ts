import { db } from '@/db/db';

/**
 * Local-only notifications (no push server in Phase 1).
 *
 * Important limitation, documented rather than hidden: browsers do not let a
 * PWA wake itself up at an exact future time in the background. What we can
 * reliably do is check "is anything due?" whenever the app is opened or
 * brought to the foreground, and fire a Notification then. This covers the
 * common case (user opens the app regularly) without overselling a
 * background-alarm guarantee that the platform doesn't provide.
 */

export function notificationsSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!notificationsSupported()) return 'denied';
  if (Notification.permission !== 'default') return Notification.permission;
  return Notification.requestPermission();
}

/** Checks for overdue/due-today contacts and shows a single grouped notification. */
export async function checkAndNotifyDueContacts(): Promise<void> {
  if (!notificationsSupported() || Notification.permission !== 'granted') return;

  const now = Date.now();
  const due = await db.contacts
    .where('nextReminderAt')
    .belowOrEqual(now)
    .filter((c) => c.nextReminderAt !== null)
    .toArray();

  if (due.length === 0) return;

  const title = due.length === 1 ? `حان وقت التواصل مع ${due[0].name}` : `لديك ${due.length} تذكيرات تواصل`;
  const body =
    due.length === 1
      ? 'اضغط لفتح صلة وتواصل والتواصل الآن.'
      : due
          .slice(0, 3)
          .map((c) => c.name)
          .join('، ') + (due.length > 3 ? ' وآخرون' : '');

  new Notification(title, { body, tag: 'sila-due-reminders' });
}
