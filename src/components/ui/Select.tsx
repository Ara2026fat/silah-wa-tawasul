import { type SelectHTMLAttributes, forwardRef } from 'react';
import clsx from 'clsx';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, className, id, children, ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-ink-500 dark:text-mist-300">
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={id}
        className={clsx(
          'rounded-xl2 border border-sand-300 bg-white px-3.5 py-2.5 text-ink-600',
          'dark:border-night-line dark:bg-night-surface dark:text-mist-100',
          'focus:border-olive-500 focus:outline-none dark:focus:border-olive-400',
          className
        )}
        {...props}
      >
        {children}
      </select>
    </div>
  )
);
Select.displayName = 'Select';
