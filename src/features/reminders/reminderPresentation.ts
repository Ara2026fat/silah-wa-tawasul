import type { ReminderStatus } from '@/types';

interface StatusPresentation {
  label: string;
  className: string;
}

export const REMINDER_PRESENTATION: Record<ReminderStatus, StatusPresentation> = {
  overdue: {
    label: 'تأخّر التواصل',
    className:
      'bg-clay-500/10 text-clay-600 border-clay-500/30 dark:bg-clay-400/15 dark:text-clay-400 dark:border-clay-400/30',
  },
  dueSoon: {
    label: 'اقترب الموعد',
    className:
      'bg-olive-500/10 text-olive-600 border-olive-500/30 dark:bg-olive-400/15 dark:text-olive-400 dark:border-olive-400/30',
  },
  onTrack: {
    label: 'على الموعد',
    className:
      'bg-olive-50 text-olive-500 border-olive-100 dark:bg-night-raised dark:text-olive-400 dark:border-night-line',
  },
  noSchedule: {
    label: 'بلا تذكير',
    className:
      'bg-ink-400/10 text-ink-400 border-ink-400/20 dark:bg-mist-500/10 dark:text-mist-500 dark:border-mist-500/20',
  },
};

export const INTERVAL_OPTIONS: Array<{ value: number; label: string }> = [
  { value: 3, label: 'كل 3 أيام' },
  { value: 7, label: 'أسبوعيًا' },
  { value: 14, label: 'كل أسبوعين' },
  { value: 30, label: 'شهريًا' },
  { value: 60, label: 'كل شهرين' },
  { value: 90, label: 'كل 3 أشهر' },
  { value: 180, label: 'كل 6 أشهر' },
  { value: 365, label: 'سنويًا' },
];
