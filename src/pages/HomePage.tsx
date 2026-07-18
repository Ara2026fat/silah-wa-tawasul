import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, Search, Star, X } from 'lucide-react';
import { TopBar } from '@/components/layout/TopBar';
import { PageContainer } from '@/components/layout/PageContainer';
import { IconButton } from '@/components/ui/IconButton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { ContactCard } from '@/features/contacts/ContactCard';
import { GroupBadge } from '@/features/groups/GroupBadge';
import { REMINDER_PRESENTATION } from '@/features/reminders/reminderPresentation';
import { useAllContacts, useFilteredContacts } from '@/hooks/useContacts';
import { useGroups } from '@/hooks/useGroups';
import { useUiStore } from '@/store/uiStore';
import type { ReminderStatus } from '@/types';

const STATUS_FILTERS: ReminderStatus[] = ['overdue', 'dueSoon', 'onTrack', 'noSchedule'];

export function HomePage() {
  const contacts = useFilteredContacts();
  const allContacts = useAllContacts();
  const groups = useGroups();
  const [searchParams] = useSearchParams();
  const {
    searchQuery,
    setSearchQuery,
    activeGroupId,
    setActiveGroupId,
    statusFilter,
    setStatusFilter,
    showFavoritesOnly,
    toggleFavoritesOnly,
  } = useUiStore();

  useEffect(() => {
    const groupFromLink = searchParams.get('group');
    if (groupFromLink) setActiveGroupId(groupFromLink);
  }, [searchParams, setActiveGroupId]);

  const hasActiveFilters = Boolean(searchQuery || activeGroupId || statusFilter || showFavoritesOnly);

  const clearFilters = () => {
    setSearchQuery('');
    setActiveGroupId(null);
    setStatusFilter(null);
    if (showFavoritesOnly) toggleFavoritesOnly();
  };

  return (
    <>
      <TopBar
        title="جهات الاتصال"
        action={
          <Link to="/contacts/new">
            <IconButton label="إضافة جهة اتصال">
              <Plus size={19} />
            </IconButton>
          </Link>
        }
      />

      <PageContainer className="flex flex-col gap-3 pb-0">
        <div className="relative">
          <Search
            size={17}
            className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-400 dark:text-mist-500"
            aria-hidden="true"
          />
          <input
            type="search"
            aria-label="ابحث عن جهة اتصال بالاسم أو الهاتف أو الملاحظات"
            placeholder="ابحث بالاسم أو الهاتف..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl2 border border-sand-300 bg-white py-2.5 pl-3.5 pr-10 text-ink-600 placeholder:text-ink-400 focus:border-olive-500 focus:outline-none dark:border-night-line dark:bg-night-surface dark:text-mist-100 dark:placeholder:text-mist-500 dark:focus:border-olive-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveGroupId(null)}
            className={
              activeGroupId === null ? 'rounded-full ring-2 ring-olive-500 dark:ring-olive-400' : 'rounded-full opacity-60'
            }
          >
            <span className="inline-flex rounded-full bg-sand-200 px-2.5 py-0.5 text-xs font-medium text-ink-600 dark:bg-night-raised dark:text-mist-100">
              الكل
            </span>
          </button>
          {groups?.map((g) => (
            <button
              key={g.id}
              onClick={() => setActiveGroupId(g.id)}
              className={activeGroupId === g.id ? 'rounded-full ring-2 ring-olive-500 dark:ring-olive-400' : 'rounded-full opacity-60'}
            >
              <GroupBadge group={g} />
            </button>
          ))}
          <button
            onClick={toggleFavoritesOnly}
            aria-pressed={showFavoritesOnly}
            className={
              (showFavoritesOnly ? 'ring-2 ring-clay-500 dark:ring-clay-400 ' : 'opacity-60 ') +
              'inline-flex items-center gap-1 rounded-full bg-clay-400/10 px-2.5 py-0.5 text-xs font-medium text-clay-600 dark:bg-clay-400/15 dark:text-clay-400'
            }
          >
            <Star size={11} className="fill-current" aria-hidden="true" />
            المفضلة
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {STATUS_FILTERS.map((status) => {
            const active = statusFilter === status;
            return (
              <button
                key={status}
                onClick={() => setStatusFilter(active ? null : status)}
                aria-pressed={active}
                className={active ? 'rounded-full ring-2 ring-ink-500 dark:ring-mist-300' : 'rounded-full opacity-60'}
              >
                <span
                  className={
                    'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ' +
                    REMINDER_PRESENTATION[status].className
                  }
                >
                  {REMINDER_PRESENTATION[status].label}
                </span>
              </button>
            );
          })}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium text-ink-400 hover:text-ink-600 dark:text-mist-500 dark:hover:text-mist-100"
            >
              <X size={12} aria-hidden="true" />
              مسح الفلاتر
            </button>
          )}
        </div>
      </PageContainer>

      <PageContainer className="flex flex-col gap-2">
        {contacts === undefined && (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        )}

        {contacts?.length === 0 && (allContacts?.length ?? 0) === 0 && (
          <EmptyState
            title="لا توجد جهات اتصال بعد"
            description="أضف أول شخص يهمّك التواصل معه، وحدّد كم مرة تريد تذكّره."
            action={
              <Link to="/contacts/new">
                <Button>إضافة جهة اتصال</Button>
              </Link>
            }
          />
        )}

        {contacts?.length === 0 && (allContacts?.length ?? 0) > 0 && (
          <EmptyState
            title="لا توجد نتائج مطابقة"
            description="جرّب تعديل البحث أو الفلاتر المُطبّقة."
            action={
              <Button variant="secondary" onClick={clearFilters}>
                مسح الفلاتر
              </Button>
            }
          />
        )}

        {contacts?.map((c) => (
          <ContactCard key={c.id} contact={c} />
        ))}
      </PageContainer>
    </>
  );
}
