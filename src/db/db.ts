import Dexie, { type Table } from 'dexie';
import type { Contact, Group, Interaction, Profile } from '@/types';

/** Local-only bookkeeping for the sync engine — never synced itself. */
export interface SyncMetaRow {
  key: string; // e.g. 'lastPulledAt:contacts', 'lastPushedAt:groups'
  value: number;
}

/**
 * All domain data lives in IndexedDB via Dexie — fully local, no backend
 * required. Phase 5 adds cloud sync as an optional layer on top (see
 * features/sync/); this schema and every read path still work with zero
 * network access, which is the whole point.
 */
export class AppDatabase extends Dexie {
  contacts!: Table<Contact, string>;
  groups!: Table<Group, string>;
  interactions!: Table<Interaction, string>;
  profile!: Table<Profile, string>;
  syncMeta!: Table<SyncMetaRow, string>;

  constructor() {
    super('sila-wa-tawasul');

    // v1 — Phases 1–4. Kept as-is so existing installs upgrade cleanly.
    this.version(1).stores({
      contacts: 'id, name, favorite, nextReminderAt, updatedAt, *groupIds',
      groups: 'id, isDefault, name',
      interactions: 'id, contactId, occurredAt',
    });

    // v2 — Phase 5 (cloud sync). `deletedAt` is optional on existing rows;
    // Dexie doesn't require a data migration for a new optional/indexed
    // field, existing rows simply read back as `undefined` (falsy, same
    // as "not deleted"). Two new local-only tables added.
    this.version(2).stores({
      contacts: 'id, name, favorite, nextReminderAt, updatedAt, deletedAt, *groupIds',
      groups: 'id, isDefault, name, deletedAt',
      interactions: 'id, contactId, occurredAt',
      profile: 'id',
      syncMeta: 'key',
    });
  }
}

export const db = new AppDatabase();
