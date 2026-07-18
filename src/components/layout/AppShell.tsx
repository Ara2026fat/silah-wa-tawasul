import type { ReactNode } from 'react';
import { BottomNav } from './BottomNav';

/**
 * One layout for every screen size: a bottom tab bar on phones, and the
 * same nav rendered as a side rail from `sm` breakpoint up. No separate
 * "desktop" and "mobile" component trees to keep in sync.
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex h-full max-w-5xl flex-col-reverse bg-sand-100 dark:bg-night-canvas sm:flex-row">
      <BottomNav />
      <main className="flex min-h-0 flex-1 flex-col overflow-y-auto">{children}</main>
    </div>
  );
}
