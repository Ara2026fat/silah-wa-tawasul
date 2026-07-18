import { addDays, differenceInCalendarDays, formatDistanceToNow } from 'date-fns';
import { arSA } from 'date-fns/locale';
import type { Contact, ReminderStatus } from '@/types';

/** Days remaining before a contact is "due soon" (inclusive). */
const DUE_SOON_THRESHOLD_DAYS = 2;

export function computeNextReminder(
  lastContactedAt: number | null,
  intervalDays: number | null
): number | null {
  if (!intervalDays) return null;
  const base = lastContactedAt ?? Date.now();
  return addDays(base, intervalDays).getTime();
}

export function reminderStatus(contact: Pick<Contact, 'nextReminderAt'>): {
  status: ReminderStatus;
  daysUntilDue: number | null;
} {
  if (!contact.nextReminderAt) {
    return { status: 'noSchedule', daysUntilDue: null };
  }
  const days = differenceInCalendarDays(contact.nextReminderAt, Date.now());
  if (days < 0) return { status: 'overdue', daysUntilDue: days };
  if (days <= DUE_SOON_THRESHOLD_DAYS) return { status: 'dueSoon', daysUntilDue: days };
  return { status: 'onTrack', daysUntilDue: days };
}

export function formatRelativeArabic(timestamp: number | null): string {
  if (!timestamp) return 'لم يتم التواصل بعد';
  return formatDistanceToNow(timestamp, { addSuffix: true, locale: arSA });
}

export function formatDateArabic(timestamp: number): string {
  return new Intl.DateTimeFormat('ar-SA-u-ca-gregory', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(timestamp);
}
