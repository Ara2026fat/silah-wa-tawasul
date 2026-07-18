import clsx from 'clsx';
import { REMINDER_PRESENTATION } from './reminderPresentation';
import type { ReminderStatus } from '@/types';

export function ReminderBadge({ status }: { status: ReminderStatus }) {
  const { label, className } = REMINDER_PRESENTATION[status];
  return (
    <span className={clsx('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium', className)}>
      {label}
    </span>
  );
}
