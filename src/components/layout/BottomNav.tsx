import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, FolderKanban, Settings } from 'lucide-react';
import clsx from 'clsx';

const NAV_ITEMS = [
  { to: '/', label: 'لوحتي', Icon: LayoutDashboard },
  { to: '/contacts', label: 'جهات الاتصال', Icon: Users },
  { to: '/groups', label: 'المجموعات', Icon: FolderKanban },
  { to: '/settings', label: 'الإعدادات', Icon: Settings },
];

/** Bottom tab bar on mobile widths; becomes a side rail on larger screens via AppShell. */
export function BottomNav() {
  return (
    <nav
      aria-label="التنقل الرئيسي"
      className="safe-bottom flex shrink-0 justify-around border-t border-sand-200 bg-sand-50 py-1.5 dark:border-night-line dark:bg-night-canvas sm:flex-col sm:justify-start sm:gap-1 sm:border-t-0 sm:border-l sm:py-4"
    >
      {NAV_ITEMS.map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            clsx(
              'flex flex-col items-center gap-0.5 rounded-xl2 px-3 py-1.5 text-xs font-medium transition-colors sm:flex-row sm:gap-2.5 sm:px-4 sm:py-2.5 sm:text-sm',
              isActive
                ? 'text-olive-600 dark:text-olive-400'
                : 'text-ink-400 hover:text-ink-600 dark:text-mist-500 dark:hover:text-mist-100'
            )
          }
        >
          <Icon size={20} strokeWidth={2} aria-hidden="true" />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
