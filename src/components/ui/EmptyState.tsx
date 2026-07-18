import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl2 border border-dashed border-sand-300 px-6 py-14 text-center dark:border-night-line">
      <h3 className="text-base font-bold text-ink-600 dark:text-mist-100">{title}</h3>
      <p className="max-w-xs text-sm text-ink-400 dark:text-mist-500">{description}</p>
      {action}
    </div>
  );
}
