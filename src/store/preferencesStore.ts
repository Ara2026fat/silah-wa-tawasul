import { create } from 'zustand';
import type { IntervalDays } from '@/types';

const STORAGE_KEY = 'sila-preferences';

interface StoredPreferences {
  defaultIntervalDays: IntervalDays | null;
}

function readStored(): StoredPreferences {
  if (typeof window === 'undefined') return { defaultIntervalDays: null };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { defaultIntervalDays: null };
    const parsed = JSON.parse(raw) as Partial<StoredPreferences>;
    return { defaultIntervalDays: parsed.defaultIntervalDays ?? null };
  } catch {
    return { defaultIntervalDays: null };
  }
}

interface PreferencesState extends StoredPreferences {
  setDefaultIntervalDays: (days: IntervalDays | null) => void;
}

export const usePreferencesStore = create<PreferencesState>((set) => ({
  ...readStored(),
  setDefaultIntervalDays: (days) => {
    const next: StoredPreferences = { defaultIntervalDays: days };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    set(next);
  },
}));
