import { Link } from 'react-router-dom';
import { Cloud, CloudOff, RefreshCw, AlertTriangle, LogIn } from 'lucide-react';
import { useSyncStore } from '@/store/syncStore';

const ICON_PROPS = { size: 18, 'aria-hidden': true } as const;

export function SyncStatusIndicator() {
  const { status } = useSyncStore();

  if (status === 'unconfigured') return null; // cloud sync not set up for this deployment — nothing to show

  const { icon, label, spin } = (() => {
    switch (status) {
      case 'syncing':
        return { icon: <RefreshCw {...ICON_PROPS} />, label: 'جارٍ المزامنة', spin: true };
      case 'offline':
        return { icon: <CloudOff {...ICON_PROPS} />, label: 'غير متصل — سيُعاد المحاولة تلقائيًا', spin: false };
      case 'error':
        return { icon: <AlertTriangle {...ICON_PROPS} />, label: 'تعذّرت المزامنة', spin: false };
      case 'signedOut':
        return { icon: <LogIn {...ICON_PROPS} />, label: 'سجّل الدخول لتفعيل المزامنة السحابية', spin: false };
      default:
        return { icon: <Cloud {...ICON_PROPS} />, label: 'متزامن', spin: false };
    }
  })();

  return (
    <Link
      to="/settings"
      aria-label={label}
      title={label}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full text-ink-500 transition-colors hover:bg-sand-200 dark:text-mist-300 dark:hover:bg-night-raised"
    >
      <span className={spin ? 'animate-spin' : undefined}>{icon}</span>
    </Link>
  );
}
