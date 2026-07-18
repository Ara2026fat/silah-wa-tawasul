import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/db';
import { computeDashboardMetrics } from './dashboardMetrics';
import { DASHBOARD_MODES, type DashboardMode } from './modes';

export function useDashboardData(mode: DashboardMode) {
  const contacts = useLiveQuery(() => db.contacts.filter((c) => !c.deletedAt).toArray(), []);
  const interactions = useLiveQuery(() => db.interactions.toArray(), []);
  const groups = useLiveQuery(() => db.groups.filter((g) => !g.deletedAt).toArray(), []);

  return useMemo(() => {
    if (!contacts || !interactions || !groups) return undefined;

    const modeKeys = DASHBOARD_MODES[mode].groupKeys;
    const groupsInScope = modeKeys.length === 0 ? [] : groups.filter((g) => g.key && modeKeys.includes(g.key));

    return computeDashboardMetrics(contacts, interactions, groupsInScope, groups);
  }, [contacts, interactions, groups, mode]);
}
