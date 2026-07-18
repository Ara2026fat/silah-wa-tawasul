import { db } from '@/db/db';
import { newId } from '@/utils/id';
import { scheduleSync } from '@/features/sync/syncEngine';
import type { Group } from '@/types';

export async function createGroup(name: string, color: string): Promise<string> {
  const now = Date.now();
  const group: Group = {
    id: newId(),
    name: name.trim(),
    isDefault: false,
    color,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };
  await db.groups.add(group);
  scheduleSync();
  return group.id;
}

export async function renameGroup(id: string, name: string): Promise<void> {
  await db.groups.update(id, { name: name.trim(), updatedAt: Date.now() });
  scheduleSync();
}

/**
 * Default groups can be renamed but never deleted, to keep the taxonomy
 * stable. Deletion is a soft tombstone (see contactsRepo.deleteContact for
 * why) — the group disappears from the UI immediately either way.
 */
export async function deleteGroup(id: string): Promise<void> {
  const group = await db.groups.get(id);
  if (!group) return;
  if (group.isDefault) {
    throw new Error('لا يمكن حذف مجموعة افتراضية');
  }

  const now = Date.now();
  await db.transaction('rw', db.groups, db.contacts, async () => {
    await db.groups.update(id, { deletedAt: now, updatedAt: now });
    const affected = await db.contacts.where('groupIds').equals(id).toArray();
    await Promise.all(
      affected.map((c) =>
        db.contacts.update(c.id, {
          groupIds: c.groupIds.filter((g) => g !== id),
          updatedAt: Date.now(),
        })
      )
    );
  });
  scheduleSync();
}
