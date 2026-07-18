import clsx from 'clsx';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';
import type { PeriodComparison } from './dashboardMetrics';
import type { DashboardMode } from './modes';
import { DASHBOARD_MODES } from './modes';

interface ProgressComparisonBarProps {
  mode: DashboardMode;
  label: string;
  data: PeriodComparison;
}

export function ProgressComparisonBar({ mode, label, data }: ProgressComparisonBarProps) {
  const meta = DASHBOARD_MODES[mode];
  const max = Math.max(data.current, data.previous, 1);
  const widthPct = Math.round((data.current / max) * 100);

  const TrendIcon = data.delta > 0 ? TrendingUp : data.delta < 0 ? TrendingDown : Minus;
  const trendText =
    data.delta === 0 ? 'بلا تغيير' : `${Math.abs(data.delta)} عن الفترة السابقة`;
  const trendColor =
    data.delta > 0
      ? 'text-olive-600 dark:text-olive-400'
      : data.delta < 0
        ? 'text-clay-600 dark:text-clay-400'
        : 'text-ink-400 dark:text-mist-500';

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="font-medium text-ink-600 dark:text-mist-100">{label}</span>
        <span className="text-ink-400 dark:text-mist-500">{data.current} تواصل</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-sand-200 dark:bg-night-raised">
        <div className={clsx('h-full rounded-full', meta.accent.bg)} style={{ width: `${widthPct}%` }} />
      </div>
      <p className={clsx('mt-1.5 flex items-center gap-1 text-xs', trendColor)}>
        <TrendIcon size={13} aria-hidden="true" />
        {trendText}
      </p>
    </div>
  );
}
