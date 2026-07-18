import { db } from '@/db/db';
import { ensureDefaultGroups } from '@/db/seed';
import { resetWatermarks, scheduleSync, wipeCloudData } from '@/features/sync/syncEngine';
import type { Contact, Group, Interaction } from '@/types';

const BACKUP_VERSION = 1;

export interface BackupFile {
  app: 'sila-wa-tawasul';
  version: number;
  exportedAt: number;
  contacts: Contact[];
  groups: Group[];
  interactions: Interaction[];
}

export async function buildBackup(): Promise<BackupFile> {
  const [contacts, groups, interactions] = await Promise.all([
    db.contacts.toArray(),
    db.groups.toArray(),
    db.interactions.toArray(),
  ]);

  return {
    app: 'sila-wa-tawasul',
    version: BACKUP_VERSION,
    exportedAt: Date.now(),
    contacts,
    groups,
    interactions,
  };
}

/** Triggers a browser download of the current data as a JSON file. */
export async function downloadBackup(): Promise<void> {
  const backup = await buildBackup();
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateStamp = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `sila-backup-${dateStamp}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Structural validation only — enough to reject a random/corrupt file without being brittle about future fields. */
function isValidBackup(data: unknown): data is BackupFile {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  return (
    d.app === 'sila-wa-tawasul' &&
    typeof d.version === 'number' &&
    Array.isArray(d.contacts) &&
    Array.isArray(d.groups) &&
    Array.isArray(d.interactions)
  );
}

export class InvalidBackupError extends Error {
  constructor() {
    super('ملف النسخة الاحتياطية غير صالح');
    this.name = 'InvalidBackupError';
  }
}

export async function readBackupFile(file: File): Promise<BackupFile> {
  const text = await file.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new InvalidBackupError();
  }
  if (!isValidBackup(parsed)) throw new InvalidBackupError();
  return parsed;
}

/**
 * Restores from a backup by replacing all local data. This mirrors how
 * WhatsApp/Telegram-style "restore" works — merging would require deciding
 * how to reconcile conflicting intervals/notes/interaction history per
 * contact, which is ambiguous. A full replace is predictable and the
 * caller is expected to confirm with the user before calling this.
 *
 * Sync watermarks are reset afterward: the restored rows carry their
 * original `updatedAt` values (possibly older than the current push
 * watermark), so without a reset they might never get pushed to the
 * cloud. If signed in, this also means the very next sync reconciles the
 * restored set against whatever's on the server using the normal
 * last-write-wins rule — restoring is a local action, not an implicit
 * "trust this over the cloud" command.
 */
export async function restoreBackup(backup: BackupFile): Promise<void> {
  await db.transaction('rw', db.contacts, db.groups, db.interactions, async () => {
    await Promise.all([db.contacts.clear(), db.groups.clear(), db.interactions.clear()]);
    await Promise.all([
      db.contacts.bulkAdd(backup.contacts),
      db.groups.bulkAdd(backup.groups),
      db.interactions.bulkAdd(backup.interactions),
    ]);
  });
  await resetWatermarks();
  scheduleSync();
}

/**
 * Wipes all local data and re-seeds default groups. If signed in to cloud
 * sync, also wipes the user's cloud rows directly (bypassing the normal
 * tombstone flow) — otherwise a hard local `.clear()` would be silently
 * undone by the very next sync pull, since the cloud would have no idea
 * anything was deleted. The cloud wipe is best-effort and never blocks
 * the local clear from completing, so this still works fully offline.
 */
export async function clearAllData(): Promise<void> {
  await wipeCloudData();
  await db.transaction('rw', db.contacts, db.groups, db.interactions, async () => {
    await Promise.all([db.contacts.clear(), db.groups.clear(), db.interactions.clear()]);
  });
  await ensureDefaultGroups();
}
