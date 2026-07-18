import { Link } from 'react-router-dom';
import { GroupBadge } from '@/features/groups/GroupBadge';
import type { GroupStat } from './dashboardMetrics';

export function GroupStatsList({ stats }: { stats: GroupStat[] }) {
  const maxTotal = Math.max(...stats.map((s) => s.total), 1);

  if (stats.length === 0) {
    return <p className="text-sm text-ink-400 dark:text-mist-500">لا توجد مجموعات في هذا الوضع.</p>;
  }

  return (
    <ul className="flex flex-col gap-3.5">
      {stats.map((s) => (
        <li key={s.group.id}>
          <Link to={`/contacts?group=${s.group.id}`} className="block">
            <div className="mb-1.5 flex items-center justify-between">
              <GroupBadge group={s.group} />
              <span className="text-xs text-ink-400 dark:text-mist-500">
                {s.total} جهة اتصال{s.overdue > 0 ? ` · ${s.overdue} متأخر` : ''}
              </span>
            </div>
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-sand-200 dark:bg-night-raised">
              <div
                className="h-full rounded-full bg-ink-400/40 dark:bg-mist-500/40"
                style={{ width: `${(s.total / maxTotal) * 100}%` }}
              />
              {s.overdue > 0 && (
                <div
                  className="absolute inset-y-0 right-0 rounded-full bg-clay-500 dark:bg-clay-400"
                  style={{ width: `${(s.overdue / maxTotal) * 100}%` }}
                />
              )}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
