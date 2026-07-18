import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/db';
import { reminderStatus } from '@/utils/date';
import { useUiStore } from '@/store/uiStore';
import { useDebouncedValue } from './useDebouncedValue';
import type { ContactWithStatus } from '@/types';

const STATUS_ORDER = { overdue: 0, dueSoon: 1, onTrack: 2, noSchedule: 3 } as const;

/** All contacts, enriched with live reminder status, sorted by urgency. Excludes soft-deleted (synced-tombstone) rows. */
export function useAllContacts(): ContactWithStatus[] | undefined {
  const contacts = useLiveQuery(() => db.contacts.filter((c) => !c.deletedAt).toArray(), []);

  return useMemo(() => {
    if (!contacts) return undefined;
    return contacts
      .map((c) => {
        const { status, daysUntilDue } = reminderStatus(c);
        return { ...c, status, daysUntilDue };
      })
      .sort((a, b) => {
        if (a.favorite !== b.favorite) return a.favorite ? -1 : 1;
        return STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
      });
  }, [contacts]);
}

/** Contacts filtered by the current search/group/status/favorites UI state. */
export function useFilteredContacts(): ContactWithStatus[] | undefined {
  const all = useAllContacts();
  const { searchQuery, activeGroupId, statusFilter, showFavoritesOnly } = useUiStore();
  const debouncedQuery = useDebouncedValue(searchQuery, 200);

  return useMemo(() => {
    if (!all) return undefined;
    const q = debouncedQuery.trim().toLowerCase();

    return all.filter((c) => {
      if (showFavoritesOnly && !c.favorite) return false;
      if (activeGroupId && !c.groupIds.includes(activeGroupId)) return false;
      if (statusFilter && c.status !== statusFilter) return false;
      if (q) {
        const matchesName = c.name.toLowerCase().includes(q);
        const matchesPhone = c.phone?.toLowerCase().includes(q) ?? false;
        const matchesNotes = c.notes.toLowerCase().includes(q);
        if (!matchesName && !matchesPhone && !matchesNotes) return false;
      }
      return true;
    });
  }, [all, debouncedQuery, activeGroupId, statusFilter, showFavoritesOnly]);
}

export function useContact(id: string | undefined) {
  return useLiveQuery(async () => {
    if (!id) return undefined;
    const c = await db.contacts.get(id);
    return c && !c.deletedAt ? c : undefined;
  }, [id]);
}
