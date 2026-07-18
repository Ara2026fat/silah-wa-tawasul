import { db } from '@/db/db';
import { newId } from '@/utils/id';
import { computeNextReminder } from '@/utils/date';
import { scheduleSync } from '@/features/sync/syncEngine';
import type { Contact, IntervalDays, Interaction, InteractionChannel } from '@/types';

export interface ContactInput {
  name: string;
  phone: string | null;
  groupIds: string[];
  intervalDays: IntervalDays | null;
  notes: string;
  favorite: boolean;
}

export async function createContact(input: ContactInput): Promise<string> {
  const now = Date.now();
  const contact: Contact = {
    id: newId(),
    name: input.name.trim(),
    phone: input.phone,
    groupIds: input.groupIds,
    intervalDays: input.intervalDays,
    lastContactedAt: null,
    nextReminderAt: computeNextReminder(null, input.intervalDays),
    notes: input.notes.trim(),
    favorite: input.favorite,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };
  await db.contacts.add(contact);
  scheduleSync();
  return contact.id;
}

export async function updateContact(id: string, input: ContactInput): Promise<void> {
  const existing = await db.contacts.get(id);
  if (!existing) throw new Error('Contact not found');

  const nextReminderAt = computeNextReminder(existing.lastContactedAt, input.intervalDays);

  await db.contacts.update(id, {
    name: input.name.trim(),
    phone: input.phone,
    groupIds: input.groupIds,
    intervalDays: input.intervalDays,
    notes: input.notes.trim(),
    favorite: input.favorite,
    nextReminderAt,
    updatedAt: Date.now(),
  });
  scheduleSync();
}

/**
 * Soft delete: sets a tombstone instead of removing the row, so other
 * devices learn about the deletion on their next sync pull (see
 * SYNC_ARCHITECTURE.md). Every read path filters `deletedAt` out, so this
 * still looks and feels like an instant, permanent delete to the user.
 * Interaction history for the contact is still hard-deleted locally —
 * it's not independently meaningful once its contact is gone, and it was
 * never editable/individually deletable to begin with.
 */
export async function deleteContact(id: string): Promise<void> {
  const now = Date.now();
  await db.transaction('rw', db.contacts, db.interactions, async () => {
    await db.contacts.update(id, { deletedAt: now, updatedAt: now });
    await db.interactions.where('contactId').equals(id).delete();
  });
  scheduleSync();
}

export async function toggleFavorite(id: string, favorite: boolean): Promise<void> {
  await db.contacts.update(id, { favorite, updatedAt: Date.now() });
  scheduleSync();
}

/**
 * Marks a contact as reached out to right now, logs the interaction, and
 * rolls the reminder forward from today using the contact's interval.
 */
export async function logInteraction(
  contactId: string,
  channel: InteractionChannel,
  note = ''
): Promise<void> {
  const contact = await db.contacts.get(contactId);
  if (!contact) throw new Error('Contact not found');

  const now = Date.now();
  const interaction: Interaction = {
    id: newId(),
    contactId,
    channel,
    occurredAt: now,
    note,
  };

  await db.transaction('rw', db.contacts, db.interactions, async () => {
    await db.interactions.add(interaction);
    await db.contacts.update(contactId, {
      lastContactedAt: now,
      nextReminderAt: computeNextReminder(now, contact.intervalDays),
      updatedAt: now,
    });
  });
  scheduleSync();
}

export async function contactInteractions(contactId: string): Promise<Interaction[]> {
  return db.interactions.where('contactId').equals(contactId).reverse().sortBy('occurredAt');
}
