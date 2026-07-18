import type { ReactNode } from 'react';
import { ThemeToggle } from './ThemeToggle';
import { SyncStatusIndicator } from './SyncStatusIndicator';

interface TopBarProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function TopBar({ title, subtitle, action }: TopBarProps) {
  return (
    <header className="safe-top sticky top-0 z-10 flex items-center justify-between border-b border-sand-200 bg-sand-50/90 px-4 py-3.5 backdrop-blur dark:border-night-line dark:bg-night-canvas/90">
      <div className="min-w-0">
        <h1 className="truncate text-xl font-bold text-ink-600 dark:text-mist-100">{title}</h1>
        {subtitle && <p className="truncate text-xs text-ink-400 dark:text-mist-500">{subtitle}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {action}
        <SyncStatusIndicator />
        <ThemeToggle />
      </div>
    </header>
  );
}
