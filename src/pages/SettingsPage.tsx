import { useEffect, useRef, useState, type ReactNode } from 'react';
import clsx from 'clsx';
import {
  BellRing,
  UserPlus,
  Info,
  Sun,
  Moon,
  Monitor,
  Check,
  Download,
  Upload,
  SlidersHorizontal,
  Trash2,
  HelpCircle,
  Cloud,
  type LucideIcon,
} from 'lucide-react';
import { TopBar } from '@/components/layout/TopBar';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import {
  notificationsSupported,
  requestNotificationPermission,
} from '@/features/notifications/notificationService';
import { contactImportSupported, pickDeviceContacts } from '@/features/contacts/useContactImport';
import { createContact } from '@/features/contacts/contactsRepo';
import { downloadBackup, readBackupFile, restoreBackup, clearAllData, InvalidBackupError } from '@/features/backup/backupService';
import { INTERVAL_OPTIONS } from '@/features/reminders/reminderPresentation';
import { AccountSection } from '@/features/sync/AccountSection';
import { useThemeStore, type ThemePreference } from '@/store/themeStore';
import { usePreferencesStore } from '@/store/preferencesStore';
import { useSyncStore } from '@/store/syncStore';
import { toast } from '@/store/toastStore';
import type { IntervalDays } from '@/types';

const THEME_OPTIONS: Array<{ value: ThemePreference; label: string; Icon: LucideIcon }> = [
  { value: 'light', label: 'فاتح', Icon: Sun },
  { value: 'dark', label: 'داكن', Icon: Moon },
  { value: 'system', label: 'تلقائي', Icon: Monitor },
];

const FAQ: Array<{ q: string; a: string }> = [
  {
    q: 'كيف تُحسب حالة التذكير؟',
    a: 'كل جهة اتصال لها فترة تواصل اختيارية. إذا مرّ موعد التذكير: "تأخّر التواصل". إذا اقترب خلال يومين: "اقترب الموعد". غير ذلك: "على الموعد". بلا فترة محددة: "بلا تذكير".',
  },
  {
    q: 'هل تصل الإشعارات وأنا خارج التطبيق؟',
    a: 'لا يمكن للمتصفح إرسال إشعارات دقيقة في الخلفية دون خادم. يتحقق التطبيق من المستحقين عند فتحه أو العودة إليه.',
  },
  {
    q: 'أين تُخزَّن بياناتي؟',
    a: 'محليًا على جهازك أولًا وقبل كل شيء. المزامنة السحابية اختيارية بالكامل، ولا تُرسَل أي بيانات إلا بعد تسجيل الدخول صراحةً.',
  },
  {
    q: 'ماذا لو حرّرت نفس جهة الاتصال من جهازين مختلفين؟',
    a: 'يُعتمد آخر تعديل زمنيًا (بحسب وقت التحديث على كل جهاز). إذا عدّلت حقولًا مختلفة من جهازين بينما كانا غير متصلين، يُحتفظ فقط بالنسخة الأحدث بالكامل.',
  },
];

function SettingsSection({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl2 border border-sand-200 bg-white p-4 shadow-soft dark:border-night-line dark:bg-night-surface dark:shadow-soft-dark">
      <h2 className="mb-1 flex items-center gap-2 font-bold text-ink-600 dark:text-mist-100">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-olive-50 text-olive-600 dark:bg-olive-400/15 dark:text-olive-400">
          <Icon size={15} aria-hidden="true" />
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

export function SettingsPage() {
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState<'export' | 'import' | 'clear' | null>(null);
  const { preference, setPreference } = useThemeStore();
  const { defaultIntervalDays, setDefaultIntervalDays } = usePreferencesStore();
  const isSignedIn = useSyncStore((s) => Boolean(s.userId));
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPermission(notificationsSupported() ? Notification.permission : 'unsupported');
  }, []);

  const handleEnableNotifications = async () => {
    const result = await requestNotificationPermission();
    setPermission(result);
    if (result === 'granted') toast.success('تم تفعيل الإشعارات');
    if (result === 'denied') toast.error('تم رفض إذن الإشعارات من إعدادات المتصفح');
  };

  const handleImportContacts = async () => {
    setImportStatus('جارٍ الاستيراد...');
    try {
      const picked = await pickDeviceContacts();
      for (const p of picked) {
        await createContact({ name: p.name, phone: p.phone, groupIds: [], intervalDays: null, notes: '', favorite: false });
      }
      setImportStatus(`تم استيراد ${picked.length} جهة اتصال.`);
      toast.success(`تم استيراد ${picked.length} جهة اتصال`);
    } catch {
      setImportStatus('تعذّر الاستيراد أو تم الإلغاء.');
    }
  };

  const handleExportBackup = async () => {
    setBusy('export');
    try {
      await downloadBackup();
      toast.success('تم تنزيل النسخة الاحتياطية');
    } catch {
      toast.error('تعذّر إنشاء النسخة الاحتياطية');
    } finally {
      setBusy(null);
    }
  };

  const handleRestoreFile = async (file: File) => {
    const confirmed = confirm(
      'استعادة نسخة احتياطية ستستبدل جميع بياناتك الحالية (جهات الاتصال والمجموعات وسجل التواصل). هل تريد المتابعة؟'
    );
    if (!confirmed) return;

    setBusy('import');
    try {
      const backup = await readBackupFile(file);
      await restoreBackup(backup);
      toast.success('تمت استعادة البيانات بنجاح');
    } catch (err) {
      toast.error(err instanceof InvalidBackupError ? err.message : 'تعذّرت استعادة النسخة الاحتياطية');
    } finally {
      setBusy(null);
    }
  };

  const handleClearAllData = async () => {
    const cloudNote = isSignedIn ? ' كما سيتم حذفها من حسابك السحابي.' : '';
    const confirmed = confirm(
      `سيتم حذف جميع جهات الاتصال والمجموعات المخصصة وسجل التواصل نهائيًا.${cloudNote} هل أنت متأكد؟`
    );
    if (!confirmed) return;
    setBusy('clear');
    try {
      await clearAllData();
      toast.success('تم حذف جميع البيانات');
    } catch {
      toast.error('تعذّر حذف البيانات');
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <TopBar title="الإعدادات" />

      <PageContainer className="mx-auto flex w-full max-w-2xl flex-col gap-4">
        <SettingsSection icon={Cloud} title="الحساب والمزامنة السحابية">
          <AccountSection />
        </SettingsSection>

        <SettingsSection icon={Sun} title="المظهر">
          <p className="mb-3 text-sm text-ink-400 dark:text-mist-500">اختر مظهر التطبيق، أو اتركه يتبع إعداد جهازك.</p>
          <div className="grid grid-cols-3 gap-2">
            {THEME_OPTIONS.map(({ value, label, Icon }) => {
              const active = preference === value;
              return (
                <button
                  key={value}
                  onClick={() => setPreference(value)}
                  aria-pressed={active}
                  className={clsx(
                    'flex flex-col items-center gap-1.5 rounded-xl2 border px-3 py-3 text-xs font-medium transition-colors',
                    active
                      ? 'border-olive-500 bg-olive-50 text-olive-600 dark:border-olive-400 dark:bg-olive-400/15 dark:text-olive-400'
                      : 'border-sand-300 text-ink-500 hover:border-sand-400 dark:border-night-line dark:text-mist-300 dark:hover:border-night-line/60'
                  )}
                >
                  <Icon size={18} />
                  {label}
                </button>
              );
            })}
          </div>
        </SettingsSection>

        <SettingsSection icon={SlidersHorizontal} title="تفضيلات">
          <Select
            label="فترة التذكير الافتراضية لجهات الاتصال الجديدة"
            value={defaultIntervalDays ?? ''}
            onChange={(e) => setDefaultIntervalDays(e.target.value ? (Number(e.target.value) as IntervalDays) : null)}
          >
            <option value="">بلا تذكير افتراضي</option>
            {INTERVAL_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </SettingsSection>

        <SettingsSection icon={BellRing} title="التذكيرات">
          <p className="mb-3 text-sm text-ink-400 dark:text-mist-500">
            فعّل الإشعارات لتنبيهك عند فتح التطبيق بجهات الاتصال المستحقة. لا يمكن للمتصفح إرسال إشعارات في الخلفية
            بدقة وقت محدد؛ يتم التحقق عند فتح التطبيق أو العودة إليه.
          </p>
          {permission === 'unsupported' && <p className="text-sm text-ink-400 dark:text-mist-500">غير مدعوم على هذا الجهاز.</p>}
          {permission === 'granted' && (
            <p className="flex items-center gap-1.5 text-sm text-olive-600 dark:text-olive-400">
              <Check size={15} /> الإشعارات مفعّلة
            </p>
          )}
          {(permission === 'default' || permission === 'denied') && (
            <Button variant="secondary" onClick={handleEnableNotifications}>
              تفعيل الإشعارات
            </Button>
          )}
        </SettingsSection>

        <SettingsSection icon={UserPlus} title="استيراد جهات الاتصال">
          <p className="mb-3 text-sm text-ink-400 dark:text-mist-500">
            {contactImportSupported()
              ? 'اختر جهات اتصال من هاتفك لإضافتها مباشرةً.'
              : 'الاستيراد المباشر متاح حاليًا فقط على متصفح Chrome لأندرويد. أضف جهات الاتصال يدويًا، أو استخدم استعادة نسخة احتياطية أدناه.'}
          </p>
          {contactImportSupported() && (
            <Button variant="secondary" onClick={handleImportContacts}>
              استيراد من جهات الاتصال
            </Button>
          )}
          {importStatus && <p className="mt-2 text-sm text-ink-500 dark:text-mist-300">{importStatus}</p>}
        </SettingsSection>

        <SettingsSection icon={Download} title="النسخ الاحتياطي والاستعادة">
          <p className="mb-3 text-sm text-ink-400 dark:text-mist-500">
            نزّل نسخة كاملة من بياناتك كملف JSON، أو استعد نسخة سابقة على هذا الجهاز أو جهاز آخر.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={handleExportBackup} disabled={busy === 'export'}>
              <Download size={16} /> {busy === 'export' ? 'جارٍ التنزيل...' : 'تنزيل نسخة احتياطية'}
            </Button>
            <Button variant="secondary" onClick={() => fileInputRef.current?.click()} disabled={busy === 'import'}>
              <Upload size={16} /> {busy === 'import' ? 'جارٍ الاستعادة...' : 'استعادة من ملف'}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleRestoreFile(file);
                e.target.value = '';
              }}
            />
          </div>
        </SettingsSection>

        <SettingsSection icon={HelpCircle} title="مساعدة">
          <ul className="flex flex-col gap-3">
            {FAQ.map((item) => (
              <li key={item.q}>
                <p className="text-sm font-medium text-ink-600 dark:text-mist-100">{item.q}</p>
                <p className="mt-0.5 text-sm text-ink-400 dark:text-mist-500">{item.a}</p>
              </li>
            ))}
          </ul>
        </SettingsSection>

        <SettingsSection icon={Info} title="حول التطبيق">
          <p className="text-sm text-ink-400 dark:text-mist-500">
            صلة وتواصل — الإصدار 1.0.0-rc.2. بياناتك مخزّنة محليًا على جهازك دائمًا، وتُستخدم بكامل وظائفها دون
            اتصال بالإنترنت. المزامنة السحابية اختيارية بالكامل ولا تُرسَل أي بيانات إلا بعد تسجيل الدخول صراحةً.
          </p>
        </SettingsSection>

        <section className="rounded-xl2 border border-clay-500/30 bg-white p-4 shadow-soft dark:border-clay-400/25 dark:bg-night-surface dark:shadow-soft-dark">
          <h2 className="mb-1 flex items-center gap-2 font-bold text-clay-600 dark:text-clay-400">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-clay-500/10 dark:bg-clay-400/15">
              <Trash2 size={15} aria-hidden="true" />
            </span>
            حذف جميع البيانات
          </h2>
          <p className="mb-3 text-sm text-ink-400 dark:text-mist-500">
            إجراء نهائي لا يمكن التراجع عنه. يُنصح بتنزيل نسخة احتياطية أولًا.
          </p>
          <Button variant="danger" onClick={handleClearAllData} disabled={busy === 'clear'}>
            <Trash2 size={16} /> {busy === 'clear' ? 'جارٍ الحذف...' : 'حذف كل شيء'}
          </Button>
        </section>
      </PageContainer>
    </>
  );
}
