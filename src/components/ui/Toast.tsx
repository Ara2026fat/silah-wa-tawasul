import { createPortal } from 'react-dom';
import { CheckCircle2, XCircle, X } from 'lucide-react';
import clsx from 'clsx';
import { useToastStore } from '@/store/toastStore';

export function ToastContainer() {
  const { toasts, dismiss } = useToastStore();

  if (toasts.length === 0) return null;

  return createPortal(
    <div
      aria-live="polite"
      aria-atomic="true"
      className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+4.5rem)] z-[60] flex flex-col items-center gap-2 px-4 sm:bottom-6"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className={clsx(
            'pointer-events-auto flex w-full max-w-sm items-center gap-2.5 rounded-xl2 border px-4 py-3 shadow-soft dark:shadow-soft-dark',
            t.kind === 'success'
              ? 'border-olive-500/30 bg-white text-ink-600 dark:border-olive-400/25 dark:bg-night-surface dark:text-mist-100'
              : 'border-clay-500/30 bg-white text-ink-600 dark:border-clay-400/25 dark:bg-night-surface dark:text-mist-100'
          )}
        >
          {t.kind === 'success' ? (
            <CheckCircle2 size={18} className="shrink-0 text-olive-600 dark:text-olive-400" aria-hidden="true" />
          ) : (
            <XCircle size={18} className="shrink-0 text-clay-600 dark:text-clay-400" aria-hidden="true" />
          )}
          <p className="flex-1 text-sm">{t.message}</p>
          <button
            onClick={() => dismiss(t.id)}
            aria-label="إغلاق الإشعار"
            className="shrink-0 text-ink-400 hover:text-ink-600 dark:text-mist-500 dark:hover:text-mist-100"
          >
            <X size={15} />
          </button>
        </div>
      ))}
    </div>,
    document.body
  );
}
