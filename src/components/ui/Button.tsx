import { type ButtonHTMLAttributes, forwardRef } from 'react';
import clsx from 'clsx';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  fullWidth?: boolean;
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    'bg-olive-500 text-sand-50 hover:bg-olive-600 active:bg-olive-700 dark:bg-olive-400 dark:text-night-canvas dark:hover:bg-olive-500',
  secondary:
    'bg-sand-200 text-ink-600 hover:bg-sand-300 dark:bg-night-raised dark:text-mist-100 dark:hover:bg-night-line',
  ghost: 'bg-transparent text-ink-500 hover:bg-sand-200 dark:text-mist-300 dark:hover:bg-night-raised',
  danger: 'bg-transparent text-clay-600 hover:bg-clay-500/10 dark:text-clay-400 dark:hover:bg-clay-400/10',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', fullWidth, className, children, ...props }, ref) => (
    <button
      ref={ref}
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-xl2 px-4 py-2.5 text-sm font-medium transition-colors',
        'active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100',
        VARIANT_CLASSES[variant],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
);
Button.displayName = 'Button';
