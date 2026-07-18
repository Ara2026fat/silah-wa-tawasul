import { db } from '@/db/db';
import { newId } from '@/utils/id';
import type { Group } from '@/types';

/**
 * Default groups required by the project spec. Seeded once; the user can
 * still rename them, but they are not deletable (isDefault: true).
 */
const DEFAULT_GROUPS: Array<Pick<Group, 'name' | 'color' | 'key'>> = [
  { key: 'parents', name: 'الوالدان', color: 'olive' },
  { key: 'siblings', name: 'الإخوة', color: 'clay' },
  { key: 'relatives', name: 'الأقارب', color: 'ink' },
  { key: 'friends', name: 'الأصدقاء', color: 'bloom' },
  { key: 'work', name: 'العمل', color: 'steel' },
];

export async function ensureDefaultGroups(): Promise<void> {
  const existing = await db.groups.count();
  if (existing > 0) return;

  const now = Date.now();
  const groups: Group[] = DEFAULT_GROUPS.map((g) => ({
    id: newId(),
    name: g.name,
    isDefault: true,
    key: g.key,
    color: g.color,
    createdAt: now,
    updatedAt: now,
  }));

  await db.groups.bulkAdd(groups);
}
