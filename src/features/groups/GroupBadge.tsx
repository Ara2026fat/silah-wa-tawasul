import clsx from 'clsx';
import type { Group } from '@/types';

const COLOR_CLASSES: Record<string, string> = {
  olive: 'bg-olive-50 text-olive-600 dark:bg-olive-400/15 dark:text-olive-400',
  clay: 'bg-clay-400/10 text-clay-600 dark:bg-clay-400/15 dark:text-clay-400',
  ink: 'bg-ink-400/10 text-ink-500 dark:bg-mist-500/15 dark:text-mist-300',
  bloom: 'bg-bloom-50 text-bloom-600 dark:bg-bloom-400/15 dark:text-bloom-400',
  steel: 'bg-steel-50 text-steel-600 dark:bg-steel-400/15 dark:text-steel-400',
};

export function GroupBadge({ group }: { group: Pick<Group, 'name' | 'color'> }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        COLOR_CLASSES[group.color] ?? COLOR_CLASSES.ink
      )}
    >
      {group.name}
    </span>
  );
}
