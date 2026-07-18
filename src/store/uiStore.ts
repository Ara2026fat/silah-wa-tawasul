import { create } from 'zustand';
import type { DashboardMode } from '@/features/dashboard/modes';
import type { ReminderStatus } from '@/types';

/**
 * Deliberately thin: contacts/groups themselves live in IndexedDB and are
 * read via useLiveQuery so the UI always reflects the DB directly with no
 * duplicated/stale copies. This store only holds transient view state.
 */
interface UiState {
  searchQuery: string;
  activeGroupId: string | null; // null = all groups
  statusFilter: ReminderStatus | null; // null = all statuses
  showFavoritesOnly: boolean;
  dashboardMode: DashboardMode;
  setSearchQuery: (q: string) => void;
  setActiveGroupId: (id: string | null) => void;
  setStatusFilter: (status: ReminderStatus | null) => void;
  toggleFavoritesOnly: () => void;
  setDashboardMode: (mode: DashboardMode) => void;
}

export const useUiStore = create<UiState>((set) => ({
  searchQuery: '',
  activeGroupId: null,
  statusFilter: null,
  showFavoritesOnly: false,
  dashboardMode: 'overview',
  setSearchQuery: (q) => set({ searchQuery: q }),
  setActiveGroupId: (id) => set({ activeGroupId: id }),
  setStatusFilter: (status) => set({ statusFilter: status }),
  toggleFavoritesOnly: () => set((s) => ({ showFavoritesOnly: !s.showFavoritesOnly })),
  setDashboardMode: (mode) => set({ dashboardMode: mode }),
}));
