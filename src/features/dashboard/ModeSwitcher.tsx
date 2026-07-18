import clsx from 'clsx';
import { DASHBOARD_MODES, MODE_ORDER, type DashboardMode } from './modes';

interface ModeSwitcherProps {
  active: DashboardMode;
  onChange: (mode: DashboardMode) => void;
}

export function ModeSwitcher({ active, onChange }: ModeSwitcherProps) {
  return (
    <div role="tablist" aria-label="وضع اللوحة" className="flex gap-2 overflow-x-auto px-4 pb-1 pt-3">
      {MODE_ORDER.map((mode) => {
        const meta = DASHBOARD_MODES[mode];
        const isActive = mode === active;
        return (
          <button
            key={mode}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(mode)}
            className={clsx(
              'shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors',
              isActive
                ? clsx(meta.accent.bg, 'border-transparent text-sand-50')
                : 'border-sand-300 bg-white text-ink-500 hover:border-sand-400 dark:border-night-line dark:bg-night-surface dark:text-mist-300 dark:hover:border-night-line/60'
            )}
          >
            {meta.label}
          </button>
        );
      })}
    </div>
  );
}
