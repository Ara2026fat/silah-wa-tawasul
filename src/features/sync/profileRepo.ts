import { supabase } from '@/lib/supabaseClient';
import { db } from '@/db/db';
import type { Profile } from '@/types';

interface ProfileRow {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  updated_at: string;
}

function fromRow(row: ProfileRow): Profile {
  return {
    id: 'current',
    userId: row.id,
    email: row.email,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    updatedAt: new Date(row.updated_at).getTime(),
  };
}

/** Reads the local cache immediately (works offline); returns null if never synced. */
export async function getCachedProfile(): Promise<Profile | undefined> {
  return db.profile.get('current');
}

/** Pulls the profile from Supabase and refreshes the local cache. No-op if not configured/signed in. */
export async function refreshProfile(userId: string): Promise<Profile | undefined> {
  if (!supabase) return undefined;

  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
  if (error || !data) return getCachedProfile();

  const profile = fromRow(data as ProfileRow);
  await db.profile.put(profile);
  return profile;
}

export async function updateDisplayName(userId: string, displayName: string): Promise<void> {
  if (!supabase) throw new Error('لم يتم إعداد المزامنة السحابية');

  const { error } = await supabase
    .from('profiles')
    .update({ display_name: displayName, updated_at: new Date().toISOString() })
    .eq('id', userId);
  if (error) throw error;

  const cached = await getCachedProfile();
  if (cached) await db.profile.put({ ...cached, displayName, updatedAt: Date.now() });
}

export async function clearCachedProfile(): Promise<void> {
  await db.profile.delete('current');
}
