import { type InputHTMLAttributes, forwardRef } from 'react';
import clsx from 'clsx';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id, ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-ink-500 dark:text-mist-300">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        className={clsx(
          'rounded-xl2 border border-sand-300 bg-white px-3.5 py-2.5 text-ink-600 placeholder:text-ink-400',
          'dark:border-night-line dark:bg-night-surface dark:text-mist-100 dark:placeholder:text-mist-500',
          'focus:border-olive-500 focus:outline-none dark:focus:border-olive-400',
          error && 'border-clay-500 dark:border-clay-400',
          className
        )}
        {...props}
      />
      {error && <span className="text-xs text-clay-600 dark:text-clay-400">{error}</span>}
    </div>
  )
);
Input.displayName = 'Input';
