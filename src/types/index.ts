/**
 * Core domain models for صلة وتواصل — Phase 1 (Foundation).
 * Kept intentionally small: only what contacts, groups and reminders need.
 */

export type GroupKey = 'parents' | 'siblings' | 'relatives' | 'friends' | 'work' | string;

export interface Group {
  id: string;
  name: string;
  /** Default groups ship with the app and cannot be deleted, only renamed. */
  isDefault: boolean;
  /**
   * Stable semantic identifier for default groups only (undefined for
   * custom groups). Lets features like the dashboard map "Family mode" to
   * the right groups even after the user renames them.
   */
  key?: GroupKey;
  /** Tailwind-safe color token used for badges, e.g. "olive" | "clay" | "ink". */
  color: string;
  createdAt: number;
  updatedAt: number;
  /**
   * Tombstone for cloud sync (Phase 5). Undefined/null = active. Set
   * instead of a hard delete so other devices learn about the deletion on
   * their next pull. Every read path filters these out; to the user,
   * deleting still looks and feels instant and permanent.
   */
  deletedAt?: number | null;
}

/** How often the user wants to be reminded to reach out, in days. */
export type IntervalDays = 3 | 7 | 14 | 30 | 60 | 90 | 180 | 365;

export interface Contact {
  id: string;
  name: string;
  phone: string | null;
  groupIds: string[];
  intervalDays: IntervalDays | null;
  lastContactedAt: number | null;
  /** Derived + cached on write: lastContactedAt + intervalDays. Null if no interval set. */
  nextReminderAt: number | null;
  notes: string;
  favorite: boolean;
  createdAt: number;
  updatedAt: number;
  /** Tombstone for cloud sync (Phase 5) — see Group.deletedAt. */
  deletedAt?: number | null;
}

export type InteractionChannel = 'whatsapp' | 'call' | 'manual';

export interface Interaction {
  id: string;
  contactId: string;
  channel: InteractionChannel;
  occurredAt: number;
  note: string;
}

export type ReminderStatus = 'overdue' | 'dueSoon' | 'onTrack' | 'noSchedule';

export interface ContactWithStatus extends Contact {
  status: ReminderStatus;
  daysUntilDue: number | null;
}

/** Local cache of the signed-in user's cloud profile (Phase 5). Single row, id fixed to 'current'. */
export interface Profile {
  id: 'current';
  userId: string;
  email: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  updatedAt: number;
}
