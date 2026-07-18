import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/db';

/** Excludes soft-deleted (synced-tombstone) groups. */
export function useGroups() {
  return useLiveQuery(() => db.groups.orderBy('name').filter((g) => !g.deletedAt).toArray(), []);
}

/** Group id → number of contacts in it, for badges in the groups list. */
export function useGroupCounts(): Record<string, number> | undefined {
  const contacts = useLiveQuery(() => db.contacts.filter((c) => !c.deletedAt).toArray(), []);

  return useMemo(() => {
    if (!contacts) return undefined;
    const counts: Record<string, number> = {};
    for (const c of contacts) {
      for (const gId of c.groupIds) {
        counts[gId] = (counts[gId] ?? 0) + 1;
      }
    }
    return counts;
  }, [contacts]);
}
