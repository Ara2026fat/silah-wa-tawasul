import { supabase } from '@/lib/supabaseClient';
import type { Session, User } from '@supabase/supabase-js';

function requireClient() {
  if (!supabase) throw new Error('لم يتم إعداد المزامنة السحابية');
  return supabase;
}

export async function signUpWithEmail(email: string, password: string): Promise<void> {
  const { error } = await requireClient().auth.signUp({ email, password });
  if (error) throw error;
}

export async function signInWithEmail(email: string, password: string): Promise<void> {
  const { error } = await requireClient().auth.signInWithPassword({ email, password });
  if (error) throw error;
}

/**
 * Google sign-in. Works as soon as the Google provider is turned on in
 * Supabase (Authentication -> Providers) — no app-side config needed.
 */
export async function signInWithGoogle(): Promise<void> {
  const { error } = await requireClient().auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin },
  });
  if (error) throw error;
}

/**
 * Apple sign-in — code-ready, matching the brief's "Apple (ready)". Unlike
 * Google, Apple requires you to own an Apple Developer account and create
 * a Services ID + Sign in with Apple key, which you then paste into
 * Supabase's Apple provider settings. Nothing on the app side changes
 * once that's done; this call already works with it.
 */
export async function signInWithApple(): Promise<void> {
  const { error } = await requireClient().auth.signInWithOAuth({
    provider: 'apple',
    options: { redirectTo: window.location.origin },
  });
  if (error) throw error;
}

export async function signOut(): Promise<void> {
  const { error } = await requireClient().auth.signOut();
  if (error) throw error;
}

export async function getSession(): Promise<Session | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export function onAuthStateChange(callback: (session: Session | null) => void): () => void {
  if (!supabase) return () => {};
  const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(session));
  return () => data.subscription.unsubscribe();
}

export function currentUser(session: Session | null): User | null {
  return session?.user ?? null;
}
