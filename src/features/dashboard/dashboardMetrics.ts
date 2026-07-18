import { isWithinInterval, subDays } from 'date-fns';
import { reminderStatus } from '@/utils/date';
import type { Contact, ContactWithStatus, Group, Interaction } from '@/types';

export interface HealthScore {
  /** 0–100, or null when no contact in scope has a reminder schedule to measure. */
  value: number | null;
  scheduledCount: number;
}

export interface PeriodComparison {
  current: number;
  previous: number;
  /** current - previous, for a simple up/down/flat indicator. */
  delta: number;
}

export interface GroupStat {
  group: Group;
  total: number;
  overdue: number;
}

export interface DashboardMetrics {
  scopeContacts: ContactWithStatus[];
  today: ContactWithStatus[];
  overdue: ContactWithStatus[];
  recentlyContacted: ContactWithStatus[];
  upcoming: ContactWithStatus[];
  healthScore: HealthScore;
  weekly: PeriodComparison;
  monthly: PeriodComparison;
  groupStats: GroupStat[];
  /** Overdue + due-today, favorites first — feeds the quick-actions list. */
  priorityContacts: ContactWithStatus[];
}

const UPCOMING_WINDOW_DAYS = 7;
const RECENT_WINDOW_DAYS = 7;

function withStatus(contacts: Contact[]): ContactWithStatus[] {
  return contacts.map((c) => {
    const { status, daysUntilDue } = reminderStatus(c);
    return { ...c, status, daysUntilDue };
  });
}

function scoreForStatus(status: ContactWithStatus['status']): number | null {
  switch (status) {
    case 'overdue':
      return 0;
    case 'dueSoon':
      return 60;
    case 'onTrack':
      return 100;
    case 'noSchedule':
      return null; // excluded from the average — no expectation was set
  }
}

function computeHealthScore(contacts: ContactWithStatus[]): HealthScore {
  const scored = contacts.map((c) => scoreForStatus(c.status)).filter((s): s is number => s !== null);
  if (scored.length === 0) return { value: null, scheduledCount: 0 };
  const avg = scored.reduce((sum, s) => sum + s, 0) / scored.length;
  return { value: Math.round(avg), scheduledCount: scored.length };
}

function countInteractionsInWindow(
  interactions: Interaction[],
  contactIds: Set<string>,
  start: Date,
  end: Date
): number {
  return interactions.filter(
    (i) => contactIds.has(i.contactId) && isWithinInterval(i.occurredAt, { start, end })
  ).length;
}

function periodComparison(
  interactions: Interaction[],
  contactIds: Set<string>,
  windowDays: number
): PeriodComparison {
  const now = new Date();
  const current = countInteractionsInWindow(interactions, contactIds, subDays(now, windowDays), now);
  const previous = countInteractionsInWindow(
    interactions,
    contactIds,
    subDays(now, windowDays * 2),
    subDays(now, windowDays)
  );
  return { current, previous, delta: current - previous };
}

export function computeDashboardMetrics(
  allContacts: Contact[],
  allInteractions: Interaction[],
  groupsInScope: Group[],
  allGroups: Group[]
): DashboardMetrics {
  const scopeGroupIds = new Set(groupsInScope.map((g) => g.id));
  const isOverview = groupsInScope.length === 0;

  const inScope = isOverview
    ? allContacts
    : allContacts.filter((c) => c.groupIds.some((gId) => scopeGroupIds.has(gId)));

  const scopeContacts = withStatus(inScope);
  const scopeIds = new Set(scopeContacts.map((c) => c.id));

  const today = scopeContacts.filter((c) => c.status !== 'noSchedule' && c.daysUntilDue === 0);
  const overdue = scopeContacts
    .filter((c) => c.status === 'overdue')
    .sort((a, b) => (a.daysUntilDue ?? 0) - (b.daysUntilDue ?? 0));

  const recentBoundaryStart = subDays(new Date(), RECENT_WINDOW_DAYS);
  const recentlyContacted = scopeContacts
    .filter((c) => c.lastContactedAt && c.lastContactedAt >= recentBoundaryStart.getTime())
    .sort((a, b) => (b.lastContactedAt ?? 0) - (a.lastContactedAt ?? 0));

  const upcoming = scopeContacts
    .filter((c) => c.daysUntilDue !== null && c.daysUntilDue > 0 && c.daysUntilDue <= UPCOMING_WINDOW_DAYS)
    .sort((a, b) => (a.daysUntilDue ?? 0) - (b.daysUntilDue ?? 0));

  const priorityContacts = [...overdue, ...today]
    .filter((c, i, arr) => arr.findIndex((x) => x.id === c.id) === i)
    .sort((a, b) => Number(b.favorite) - Number(a.favorite))
    .slice(0, 6);

  const healthScore = computeHealthScore(scopeContacts);
  const weekly = periodComparison(allInteractions, scopeIds, 7);
  const monthly = periodComparison(allInteractions, scopeIds, 30);

  const statsGroups = isOverview ? allGroups : groupsInScope;
  const groupStats: GroupStat[] = statsGroups.map((g) => {
    const members = scopeContacts.filter((c) => c.groupIds.includes(g.id));
    return {
      group: g,
      total: members.length,
      overdue: members.filter((c) => c.status === 'overdue').length,
    };
  });

  return {
    scopeContacts,
    today,
    overdue,
    recentlyContacted,
    upcoming,
    healthScore,
    weekly,
    monthly,
    groupStats,
    priorityContacts,
  };
}

/** Small helper so components don't import date-fns just for this. */
export function daysLabel(days: number | null): string {
  if (days === null) return '';
  if (days === 0) return 'اليوم';
  if (days < 0) return `منذ ${Math.abs(days)} يوم`;
  return `خلال ${days} يوم`;
}
