import { CalendarClock, AlarmClock, CheckCircle2, BellRing, Sparkles } from 'lucide-react';
import { TopBar } from '@/components/layout/TopBar';
import { PageContainer } from '@/components/layout/PageContainer';
import { EmptyState } from '@/components/ui/EmptyState';
import { ModeSwitcher } from '@/features/dashboard/ModeSwitcher';
import { HealthScoreGauge } from '@/features/dashboard/HealthScoreGauge';
import { ProgressComparisonBar } from '@/features/dashboard/ProgressComparisonBar';
import { StatCard } from '@/features/dashboard/StatCard';
import { QuickActionRow } from '@/features/dashboard/QuickActionRow';
import { GroupStatsList } from '@/features/dashboard/GroupStatsList';
import { useDashboardData } from '@/features/dashboard/useDashboardData';
import { DASHBOARD_MODES } from '@/features/dashboard/modes';
import { useUiStore } from '@/store/uiStore';

export function DashboardPage() {
  const { dashboardMode, setDashboardMode } = useUiStore();
  const metrics = useDashboardData(dashboardMode);

  return (
    <>
      <TopBar title="صلة وتواصل" subtitle={DASHBOARD_MODES[dashboardMode].label} />
      <ModeSwitcher active={dashboardMode} onChange={setDashboardMode} />

      {!metrics && (
        <p className="px-4 py-8 text-center text-sm text-ink-400 dark:text-mist-500">جارِ التحميل...</p>
      )}

      {metrics && metrics.scopeContacts.length === 0 && (
        <PageContainer>
          <EmptyState
            title="لا توجد بيانات في هذا الوضع بعد"
            description="أضف جهات اتصال وحدّد مجموعاتها ليبدأ ظهور إحصاءاتها هنا."
          />
        </PageContainer>
      )}

      {metrics && metrics.scopeContacts.length > 0 && (
        <PageContainer className="flex flex-col gap-6 lg:grid lg:grid-cols-[300px_1fr] lg:items-start lg:gap-6">
          {/* Signature: health score + weekly/monthly real-data comparison */}
          <div className="flex flex-col gap-5 rounded-xl2 border border-sand-200 bg-white p-5 shadow-soft dark:border-night-line dark:bg-night-surface dark:shadow-soft-dark">
            <HealthScoreGauge mode={dashboardMode} score={metrics.healthScore} />
            <div className="flex flex-col gap-4">
              <ProgressComparisonBar mode={dashboardMode} label="هذا الأسبوع" data={metrics.weekly} />
              <ProgressComparisonBar mode={dashboardMode} label="هذا الشهر" data={metrics.monthly} />
            </div>
          </div>

          <div className="flex flex-col gap-7">
            {/* Core status cards */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard icon={CalendarClock} title="اليوم" tone="warn" contacts={metrics.today} />
              <StatCard icon={AlarmClock} title="متأخر" tone="danger" contacts={metrics.overdue} />
              <StatCard icon={CheckCircle2} title="تم التواصل مؤخرًا" tone="success" contacts={metrics.recentlyContacted} />
              <StatCard icon={BellRing} title="تذكيرات قادمة" tone="neutral" contacts={metrics.upcoming} />
            </div>

            {/* Quick actions on the people who need attention right now */}
            {metrics.priorityContacts.length > 0 && (
              <section>
                <h2 className="mb-2.5 flex items-center gap-1.5 text-sm font-bold text-ink-500 dark:text-mist-300">
                  <Sparkles size={15} className="text-clay-500 dark:text-clay-400" aria-hidden="true" />
                  يحتاجون تواصلك الآن
                </h2>
                <div className="flex flex-col gap-2">
                  {metrics.priorityContacts.map((c) => (
                    <QuickActionRow key={c.id} contact={c} />
                  ))}
                </div>
              </section>
            )}

            {/* Group statistics */}
            <section>
              <h2 className="mb-2.5 text-sm font-bold text-ink-500 dark:text-mist-300">إحصاءات المجموعات</h2>
              <div className="rounded-xl2 border border-sand-200 bg-white p-4 shadow-soft dark:border-night-line dark:bg-night-surface dark:shadow-soft-dark">
                <GroupStatsList stats={metrics.groupStats} />
              </div>
            </section>
          </div>
        </PageContainer>
      )}
    </>
  );
}
