import { useState, type FormEvent } from 'react';
import { Cloud, LogOut, RefreshCw, Mail, Globe, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogle,
  signInWithApple,
  signOut,
} from '@/features/sync/authRepo';
import { updateDisplayName } from '@/features/sync/profileRepo';
import { syncNow } from '@/features/sync/syncEngine';
import { useSyncStore } from '@/store/syncStore';
import { toast } from '@/store/toastStore';
import { formatRelativeArabic } from '@/utils/date';

const STATUS_LABEL: Record<string, string> = {
  idle: 'متزامن',
  syncing: 'جارٍ المزامنة...',
  offline: 'غير متصل — ستتم المزامنة عند توفر الإنترنت',
  error: 'تعذّرت آخر مزامنة',
  signedOut: 'لم تسجّل الدخول بعد',
};

function EmailAuthForm() {
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (mode === 'signUp') {
        await signUpWithEmail(email, password);
        toast.success('تم إنشاء الحساب — تحقق من بريدك الإلكتروني للتأكيد');
      } else {
        await signInWithEmail(email, password);
        toast.success('تم تسجيل الدخول');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'تعذّر تسجيل الدخول');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <Input
        type="email"
        label="البريد الإلكتروني"
        dir="ltr"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <Input
        type="password"
        label="كلمة المرور"
        dir="ltr"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        minLength={6}
        required
      />
      <Button type="submit" disabled={submitting}>
        <Mail size={16} /> {mode === 'signUp' ? 'إنشاء حساب' : 'تسجيل الدخول بالبريد'}
      </Button>
      <button
        type="button"
        onClick={() => setMode(mode === 'signUp' ? 'signIn' : 'signUp')}
        className="text-xs text-ink-400 hover:text-ink-600 dark:text-mist-500 dark:hover:text-mist-100"
      >
        {mode === 'signUp' ? 'لديك حساب؟ سجّل الدخول' : 'ليس لديك حساب؟ أنشئ واحدًا'}
      </button>
    </form>
  );
}

function SignedOutView() {
  const handleOAuth = async (fn: () => Promise<void>, name: string) => {
    try {
      await fn();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `تعذّر تسجيل الدخول عبر ${name}`);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-ink-400 dark:text-mist-500">
        سجّل الدخول لمزامنة بياناتك عبر أجهزتك ونسخها احتياطيًا سحابيًا. هذا اختياري تمامًا — التطبيق يعمل بكامل
        وظائفه محليًا بدون تسجيل الدخول.
      </p>
      <EmailAuthForm />
      <div className="flex items-center gap-2 text-xs text-ink-400 dark:text-mist-500">
        <span className="h-px flex-1 bg-sand-300 dark:bg-night-line" />
        أو
        <span className="h-px flex-1 bg-sand-300 dark:bg-night-line" />
      </div>
      <Button variant="secondary" onClick={() => handleOAuth(signInWithGoogle, 'Google')}>
        <Globe size={16} /> المتابعة عبر Google
      </Button>
      <Button variant="secondary" onClick={() => handleOAuth(signInWithApple, 'Apple')}>
        <KeyRound size={16} /> المتابعة عبر Apple
      </Button>
    </div>
  );
}

function SignedInView() {
  const { email, status, lastSyncedAt, errorMessage, userId } = useSyncStore();
  const [displayName, setDisplayName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const handleManualSync = () => {
    syncNow();
  };

  const handleSaveName = async (e: FormEvent) => {
    e.preventDefault();
    if (!userId || !displayName.trim()) return;
    setSavingName(true);
    try {
      await updateDisplayName(userId, displayName.trim());
      toast.success('تم حفظ الاسم');
    } catch {
      toast.error('تعذّر حفظ الاسم');
    } finally {
      setSavingName(false);
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
      toast.success('تم تسجيل الخروج');
    } catch {
      toast.error('تعذّر تسجيل الخروج');
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3 rounded-xl2 bg-sand-200/60 p-3 dark:bg-night-raised">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-olive-50 text-olive-600 dark:bg-olive-400/15 dark:text-olive-400">
          <Cloud size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-ink-600 dark:text-mist-100">{email}</p>
          <p className="text-xs text-ink-400 dark:text-mist-500">
            {status === 'error' && errorMessage ? errorMessage : STATUS_LABEL[status] ?? STATUS_LABEL.idle}
            {status === 'idle' && lastSyncedAt ? ` · ${formatRelativeArabic(lastSyncedAt)}` : ''}
          </p>
        </div>
      </div>

      <Button variant="secondary" onClick={handleManualSync} disabled={status === 'syncing'}>
        <RefreshCw size={16} className={status === 'syncing' ? 'animate-spin' : undefined} />
        مزامنة الآن
      </Button>

      <form onSubmit={handleSaveName} className="flex gap-2">
        <div className="flex-1">
          <Input
            placeholder="اسمك المعروض"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </div>
        <Button type="submit" variant="secondary" disabled={savingName || !displayName.trim()}>
          حفظ
        </Button>
      </form>

      <Button variant="ghost" onClick={handleSignOut} disabled={signingOut}>
        <LogOut size={16} /> تسجيل الخروج
      </Button>
    </div>
  );
}

export function AccountSection() {
  const { status, userId } = useSyncStore();

  if (status === 'unconfigured') {
    return (
      <p className="text-sm text-ink-400 dark:text-mist-500">
        لم يتم إعداد المزامنة السحابية لهذا التطبيق. جميع بياناتك تعمل محليًا كما هي دون أي تغيير.
      </p>
    );
  }

  return userId ? <SignedInView /> : <SignedOutView />;
}
