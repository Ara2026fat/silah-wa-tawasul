import { create } from 'zustand';

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

const STORAGE_KEY = 'sila-theme';

function systemPrefersDark(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function resolve(pref: ThemePreference): ResolvedTheme {
  return pref === 'system' ? (systemPrefersDark() ? 'dark' : 'light') : pref;
}

function applyToDocument(resolved: ResolvedTheme) {
  document.documentElement.classList.toggle('dark', resolved === 'dark');
}

function readStoredPreference(): ThemePreference {
  if (typeof window === 'undefined') return 'system';
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
}

interface ThemeState {
  preference: ThemePreference;
  resolved: ResolvedTheme;
  setPreference: (pref: ThemePreference) => void;
  toggle: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  preference: readStoredPreference(),
  resolved: resolve(readStoredPreference()),
  setPreference: (pref) => {
    window.localStorage.setItem(STORAGE_KEY, pref);
    const resolved = resolve(pref);
    applyToDocument(resolved);
    set({ preference: pref, resolved });
  },
  toggle: () => {
    // Quick toggle jumps between light/dark directly (skips "system") since
    // that's what a single tap in the top bar should do.
    const next: ThemePreference = get().resolved === 'dark' ? 'light' : 'dark';
    get().setPreference(next);
  },
}));

/** Call once on app boot to apply the initial theme and react to OS changes while on "system". */
export function initThemeWatcher(): () => void {
  applyToDocument(useThemeStore.getState().resolved);

  const mql = window.matchMedia('(prefers-color-scheme: dark)');
  const onChange = () => {
    if (useThemeStore.getState().preference !== 'system') return;
    const resolved = systemPrefersDark() ? 'dark' : 'light';
    applyToDocument(resolved);
    useThemeStore.setState({ resolved });
  };
  mql.addEventListener('change', onChange);
  return () => mql.removeEventListener('change', onChange);
}
