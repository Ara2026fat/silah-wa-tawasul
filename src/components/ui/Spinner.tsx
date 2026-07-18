import clsx from 'clsx';

interface SpinnerProps {
  size?: number;
  label?: string;
}

/** A spinning ring, not spinning text — used everywhere the app is waiting on IndexedDB. */
export function Spinner({ size = 28, label = 'جارٍ التحميل' }: SpinnerProps) {
  return (
    <div role="status" className="flex flex-col items-center gap-2 text-ink-400 dark:text-mist-500">
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={clsx('animate-spin text-olive-500 dark:text-olive-400')}
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.2" strokeWidth="3" />
        <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
      <span className="text-xs">{label}</span>
      <span className="sr-only">{label}...</span>
    </div>
  );
}
