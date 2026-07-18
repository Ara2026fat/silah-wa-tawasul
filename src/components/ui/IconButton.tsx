import { type ButtonHTMLAttributes, forwardRef } from 'react';
import clsx from 'clsx';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ label, className, children, ...props }, ref) => (
    <button
      ref={ref}
      aria-label={label}
      title={label}
      className={clsx(
        'inline-flex h-10 w-10 items-center justify-center rounded-full text-ink-500 transition-colors',
        'hover:bg-sand-200 active:scale-95',
        'dark:text-mist-300 dark:hover:bg-night-raised',
        'disabled:opacity-40 disabled:pointer-events-none disabled:active:scale-100',
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
);
IconButton.displayName = 'IconButton';
