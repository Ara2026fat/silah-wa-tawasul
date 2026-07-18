import { supabase } from '@/lib/supabaseClient';
import { db } from '@/db/db';
import { useSyncStore } from '@/store/syncStore';
import type { Contact, Group, Interaction } from '@/types';

/** ms -> ISO string, preserving null/undefined. */
function toIso(ms: number | null | undefined): string | null {
  return ms == null ? null : new Date(ms).toISOString();
}
/** ISO string -> ms, preserving null/undefined. */
function fromIso(iso: string | null | undefined): number | null {
  return iso == null ? null : new Date(iso).getTime();
}

// ---------------------------------------------------------------------------
// Row mappers: local (camelCase, epoch ms) <-> remote (snake_case, ISO)
// ---------------------------------------------------------------------------

function contactToRemote(c: Contact, userId: string) {
  return {
    id: c.id,
    user_id: userId,
    name: c.name,
    phone: c.phone,
    group_ids: c.groupIds,
    interval_days: c.intervalDays,
    last_contacted_at: toIso(c.lastContactedAt),
    next_reminder_at: toIso(c.nextReminderAt),
    notes: c.notes,
    favorite: c.favorite,
    created_at: toIso(c.createdAt),
    updated_at: toIso(c.updatedAt),
    deleted_at: toIso(c.deletedAt),
  };
}
function contactFromRemote(r: any): Contact {
  return {
    id: r.id,
    name: r.name,
    phone: r.phone,
    groupIds: r.group_ids ?? [],
    intervalDays: r.interval_days,
    lastContactedAt: fromIso(r.last_contacted_at),
    nextReminderAt: fromIso(r.next_reminder_at),
    notes: r.notes ?? '',
    favorite: Boolean(r.favorite),
    createdAt: fromIso(r.created_at) ?? Date.now(),
    updatedAt: fromIso(r.updated_at) ?? Date.now(),
    deletedAt: fromIso(r.deleted_at),
  };
}

function groupToRemote(g: Group, userId: string) {
  return {
    id: g.id,
    user_id: userId,
    name: g.name,
    is_default: g.isDefault,
    key: g.key ?? null,
    color: g.color,
    created_at: toIso(g.createdAt),
    updated_at: toIso(g.updatedAt),
    deleted_at: toIso(g.deletedAt),
  };
}
function groupFromRemote(r: any): Group {
  return {
    id: r.id,
    name: r.name,
    isDefault: Boolean(r.is_default),
    key: r.key ?? undefined,
    color: r.color,
    createdAt: fromIso(r.created_at) ?? Date.now(),
    updatedAt: fromIso(r.updated_at) ?? Date.now(),
    deletedAt: fromIso(r.deleted_at),
  };
}

function interactionToRemote(i: Interaction, userId: string) {
  return {
    id: i.id,
    user_id: userId,
    contact_id: i.contactId,
    channel: i.channel,
    occurred_at: toIso(i.occurredAt),
    note: i.note,
  };
}
function interactionFromRemote(r: any): Interaction {
  return {
    id: r.id,
    contactId: r.contact_id,
    channel: r.channel,
    occurredAt: fromIso(r.occurred_at) ?? Date.now(),
    note: r.note ?? '',
  };
}

// ---------------------------------------------------------------------------
// Watermarks — "what changed since we last synced this table"
// ---------------------------------------------------------------------------

async function getWatermark(key: string): Promise<number> {
  const row = await db.syncMeta.get(key);
  return row?.value ?? 0;
}
async function setWatermark(key: string, value: number): Promise<void> {
  await db.syncMeta.put({ key, value });
}

// ---------------------------------------------------------------------------
// Push: local rows changed since lastPushedAt -> Supabase upsert
// ---------------------------------------------------------------------------

async function pushContacts(userId: string): Promise<void> {
  const watermarkKey = 'lastPushedAt:contacts';
  const since = await getWatermark(watermarkKey);
  const startedAt = Date.now();

  const rows = await db.contacts.where('updatedAt').above(since).toArray();
  if (rows.length > 0) {
    const { error } = await supabase!.from('contacts').upsert(rows.map((r) => contactToRemote(r, userId)));
    if (error) throw error;
  }
  await setWatermark(watermarkKey, startedAt);
}

async function pushGroups(userId: string): Promise<void> {
  const watermarkKey = 'lastPushedAt:groups';
  const since = await getWatermark(watermarkKey);
  const startedAt = Date.now();

  const rows = await db.groups.where('updatedAt').above(since).toArray();
  if (rows.length > 0) {
    const { error } = await supabase!.from('groups').upsert(rows.map((r) => groupToRemote(r, userId)));
    if (error) throw error;
  }
  await setWatermark(watermarkKey, startedAt);
}

async function pushInteractions(userId: string): Promise<void> {
  // Interactions are append-only, so `occurredAt` doubles as its change
  // watermark — there's no separate `updatedAt` on this table (see
  // SYNC_ARCHITECTURE.md).
  const watermarkKey = 'lastPushedAt:interactions';
  const since = await getWatermark(watermarkKey);
  const startedAt = Date.now();

  const rows = await db.interactions.where('occurredAt').above(since).toArray();
  if (rows.length > 0) {
    const { error } = await supabase!.from('interactions').upsert(rows.map((r) => interactionToRemote(r, userId)));
    if (error) throw error;
  }
  await setWatermark(watermarkKey, startedAt);
}

// ---------------------------------------------------------------------------
// Pull: remote rows changed since lastPulledAt -> local, last-write-wins
// ---------------------------------------------------------------------------

async function pullContacts(userId: string): Promise<void> {
  const watermarkKey = 'lastPulledAt:contacts';
  const since = await getWatermark(watermarkKey);
  const startedAt = Date.now();

  const { data, error } = await supabase!
    .from('contacts')
    .select('*')
    .eq('user_id', userId)
    .gt('updated_at', new Date(since).toISOString());
  if (error) throw error;

  for (const row of data ?? []) {
    const remote = contactFromRemote(row);
    const local = await db.contacts.get(remote.id);
    if (!local || remote.updatedAt > local.updatedAt) {
      await db.contacts.put(remote);
    }
  }
  await setWatermark(watermarkKey, startedAt);
}

async function pullGroups(userId: string): Promise<void> {
  const watermarkKey = 'lastPulledAt:groups';
  const since = await getWatermark(watermarkKey);
  const startedAt = Date.now();

  const { data, error } = await supabase!
    .from('groups')
    .select('*')
    .eq('user_id', userId)
    .gt('updated_at', new Date(since).toISOString());
  if (error) throw error;

  for (const row of data ?? []) {
    const remote = groupFromRemote(row);
    const local = await db.groups.get(remote.id);
    if (!local || remote.updatedAt > local.updatedAt) {
      await db.groups.put(remote);
    }
  }
  await setWatermark(watermarkKey, startedAt);
}

async function pullInteractions(userId: string): Promise<void> {
  const watermarkKey = 'lastPulledAt:interactions';
  const since = await getWatermark(watermarkKey);
  const startedAt = Date.now();

  const { data, error } = await supabase!
    .from('interactions')
    .select('*')
    .eq('user_id', userId)
    .gt('occurred_at', new Date(since).toISOString());
  if (error) throw error;

  for (const row of data ?? []) {
    const remote = interactionFromRemote(row);
    const local = await db.interactions.get(remote.id);
    if (!local) await db.interactions.put(remote); // append-only: never overwrite an existing local row
  }
  await setWatermark(watermarkKey, startedAt);
}

// ---------------------------------------------------------------------------
// Orchestration
// ---------------------------------------------------------------------------

let syncing = false;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

/** A sync pass that hasn't finished by this point is treated as failed, not hung. */
const SYNC_TIMEOUT_MS = 20000;

class SyncTimeoutError extends Error {
  constructor() {
    super('انتهت مهلة المزامنة — الاتصال ضعيف جدًا');
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new SyncTimeoutError()), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

/**
 * Runs a full push-then-pull pass. Safe to call anytime — it no-ops
 * cleanly if sync isn't configured, no one's signed in, or there's no
 * network. Never throws to the caller; failures are reported via the
 * store so the UI can show them without every call site needing a
 * try/catch. Bounded by SYNC_TIMEOUT_MS so a very poor connection (slow
 * but not `navigator.onLine === false`) fails fast and retries on the
 * next scheduled attempt instead of leaving `syncing` stuck true forever.
 */
export async function syncNow(): Promise<void> {
  const { status, userId } = useSyncStore.getState();

  if (!supabase) {
    useSyncStore.getState().setStatus('unconfigured');
    return;
  }
  if (!userId) {
    useSyncStore.getState().setStatus('signedOut');
    return;
  }
  if (!navigator.onLine) {
    useSyncStore.getState().setStatus('offline');
    return;
  }
  if (syncing || status === 'syncing') return; // already running

  syncing = true;
  useSyncStore.getState().setStatus('syncing');

  try {
    await withTimeout(
      (async () => {
        await pushGroups(userId);
        await pushContacts(userId);
        await pushInteractions(userId);
        await pullGroups(userId);
        await pullContacts(userId);
        await pullInteractions(userId);
      })(),
      SYNC_TIMEOUT_MS
    );

    useSyncStore.getState().setSuccess(Date.now());
  } catch (err) {
    useSyncStore.getState().setError(err instanceof Error ? err.message : 'تعذّرت المزامنة');
  } finally {
    syncing = false;
  }
}

/**
 * Debounced trigger called by contactsRepo/groupsRepo after a local write.
 * Local writes themselves are never blocked or delayed by this — it only
 * schedules a background sync a couple seconds later, coalescing bursts
 * of edits (e.g. filling out a form) into one sync pass.
 */
export function scheduleSync(delayMs = 2500): void {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    syncNow();
  }, delayMs);
}

/**
 * Resets push/pull watermarks to zero, so the next `syncNow()` treats
 * every local row as unpushed and re-pulls everything from scratch.
 * Needed after a backup restore: the restored rows carry their original
 * `updatedAt` values, which may be older than the current watermark and
 * would otherwise never get pushed.
 */
export async function resetWatermarks(): Promise<void> {
  await db.syncMeta.clear();
}

/**
 * Deletes this user's rows on the server directly, bypassing the normal
 * tombstone/watermark flow. Used only by "Clear all data" — without this,
 * a local wipe would be silently undone by the very next sync pull, since
 * a hard local `.clear()` (as opposed to a tombstone) leaves the cloud
 * copy completely unaware anything was deleted. Never throws — a failed
 * cloud wipe must not block the local clear from completing; the caller
 * clears local data regardless of network state.
 */
export async function wipeCloudData(): Promise<void> {
  const { userId } = useSyncStore.getState();
  if (!supabase || !userId) return;

  try {
    await Promise.all([
      supabase.from('contacts').delete().eq('user_id', userId),
      supabase.from('groups').delete().eq('user_id', userId),
      supabase.from('interactions').delete().eq('user_id', userId),
    ]);
  } catch {
    // Best-effort — local clear proceeds either way.
  }
  await resetWatermarks();
}
