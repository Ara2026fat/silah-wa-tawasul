import type { ReactNode } from 'react';
import clsx from 'clsx';

/**
 * One spacing scale for every page: tighter on phone, more breathing room
 * from `sm`/`lg` up. Using this instead of ad-hoc `px-4` per page is what
 * keeps the app feeling consistent as the viewport grows.
 */
export function PageContainer({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={clsx('px-4 py-4 sm:px-6 sm:py-5 lg:px-8', className)}>{children}</div>;
}
