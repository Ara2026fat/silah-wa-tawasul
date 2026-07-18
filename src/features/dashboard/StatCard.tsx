import { memo } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import type { LucideIcon } from 'lucide-react';
import type { ContactWithStatus } from '@/types';

type Tone = 'danger' | 'warn' | 'success' | 'neutral';

const TONE_CLASSES: Record<Tone, { border: string; count: string; iconBg: string }> = {
  danger: {
    border: 'border-clay-500/30 dark:border-clay-400/25',
    count: 'text-clay-600 dark:text-clay-400',
    iconBg: 'bg-clay-500/10 text-clay-600 dark:bg-clay-400/15 dark:text-clay-400',
  },
  warn: {
    border: 'border-bloom-500/30 dark:border-bloom-400/25',
    count: 'text-bloom-600 dark:text-bloom-400',
    iconBg: 'bg-bloom-500/10 text-bloom-600 dark:bg-bloom-400/15 dark:text-bloom-400',
  },
  success: {
    border: 'border-olive-500/30 dark:border-olive-400/25',
    count: 'text-olive-600 dark:text-olive-400',
    iconBg: 'bg-olive-500/10 text-olive-600 dark:bg-olive-400/15 dark:text-olive-400',
  },
  neutral: {
    border: 'border-steel-500/30 dark:border-steel-400/25',
    count: 'text-steel-600 dark:text-steel-400',
    iconBg: 'bg-steel-500/10 text-steel-600 dark:bg-steel-400/15 dark:text-steel-400',
  },
};

interface StatCardProps {
  icon: LucideIcon;
  title: string;
  tone: Tone;
  contacts: ContactWithStatus[];
}

function StatCardImpl({ icon: Icon, title, tone, contacts }: StatCardProps) {
  const tones = TONE_CLASSES[tone];

  return (
    <div
      className={clsx(
        'rounded-xl2 border bg-white p-4 shadow-soft dark:bg-night-surface dark:shadow-soft-dark',
        tones.border
      )}
    >
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-medium text-ink-500 dark:text-mist-300">
          <span className={clsx('flex h-7 w-7 items-center justify-center rounded-full', tones.iconBg)}>
            <Icon size={15} aria-hidden="true" />
          </span>
          {title}
        </span>
        <span className={clsx('font-display text-2xl font-bold', tones.count)}>{contacts.length}</span>
      </div>

      {contacts.length > 0 ? (
        <ul className="mt-3 flex flex-col gap-1">
          {contacts.slice(0, 3).map((c) => (
            <li key={c.id}>
              <Link
                to={`/contacts/${c.id}`}
                className="truncate text-sm text-ink-600 hover:underline dark:text-mist-100"
              >
                {c.name}
              </Link>
            </li>
          ))}
          {contacts.length > 3 && (
            <li className="text-xs text-ink-400 dark:text-mist-500">و{contacts.length - 3} آخرين</li>
          )}
        </ul>
      ) : (
        <p className="mt-3 text-xs text-ink-400 dark:text-mist-500">لا يوجد أحد هنا حاليًا</p>
      )}
    </div>
  );
}

export const StatCard = memo(StatCardImpl);
