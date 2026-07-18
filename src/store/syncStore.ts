import { create } from 'zustand';
import type { SyncStatus } from '@/features/sync/types';
import { isSupabaseConfigured } from '@/lib/supabaseClient';

interface SyncState {
  status: SyncStatus;
  userId: string | null;
  email: string | null;
  lastSyncedAt: number | null;
  errorMessage: string | null;
  setSession: (userId: string | null, email: string | null) => void;
  setStatus: (status: SyncStatus) => void;
  setSuccess: (at: number) => void;
  setError: (message: string) => void;
}

export const useSyncStore = create<SyncState>((set) => ({
  status: isSupabaseConfigured() ? 'signedOut' : 'unconfigured',
  userId: null,
  email: null,
  lastSyncedAt: null,
  errorMessage: null,
  setSession: (userId, email) =>
    set((s) => ({
      userId,
      email,
      status: userId ? (s.status === 'unconfigured' ? 'unconfigured' : 'idle') : 'signedOut',
    })),
  setStatus: (status) => set({ status }),
  setSuccess: (at) => set({ status: 'idle', lastSyncedAt: at, errorMessage: null }),
  setError: (message) => set({ status: 'error', errorMessage: message }),
}));
