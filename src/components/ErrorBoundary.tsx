import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Shown in the fallback so it's clear which part of the app failed. */
  label?: string;
  /**
   * 'app' shows a full-screen fallback with a hard reload (last resort —
   * something broke before/around the shell itself).
   * 'route' shows a smaller inline fallback and only resets its own
   * subtree, so the nav/top bar/theme toggle stay usable and the person
   * can navigate away from the broken screen without losing the app.
   */
  level?: 'app' | 'route';
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Class component is required here — there is no hook equivalent for
 * catching render errors in React 18. Kept deliberately small and
 * dependency-free (no new state management) since its entire job is to
 * not itself be a source of failure.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error(`[ErrorBoundary${this.props.label ? `: ${this.props.label}` : ''}]`, error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ error: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    const isAppLevel = this.props.level !== 'route';

    return (
      <div
        className={
          isAppLevel
            ? 'flex h-full flex-col items-center justify-center gap-4 bg-sand-100 px-6 text-center dark:bg-night-canvas'
            : 'flex flex-col items-center gap-3 rounded-xl2 border border-clay-500/30 bg-white px-6 py-10 text-center dark:border-clay-400/25 dark:bg-night-surface'
        }
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-clay-500/10 text-clay-600 dark:bg-clay-400/15 dark:text-clay-400">
          <AlertTriangle size={22} aria-hidden="true" />
        </span>
        <div>
          <h2 className="font-bold text-ink-600 dark:text-mist-100">
            {isAppLevel ? 'حدث خطأ غير متوقع' : 'تعذّر عرض هذا الجزء'}
          </h2>
          <p className="mt-1 max-w-xs text-sm text-ink-400 dark:text-mist-500">
            {isAppLevel
              ? 'بياناتك محلية وسليمة. أعد تحميل التطبيق للمتابعة.'
              : 'يمكنك المتابعة من باقي التطبيق، أو إعادة المحاولة هنا.'}
          </p>
        </div>
        <Button variant={isAppLevel ? 'primary' : 'secondary'} onClick={isAppLevel ? this.handleReload : this.handleReset}>
          <RotateCcw size={16} />
          {isAppLevel ? 'إعادة تحميل التطبيق' : 'إعادة المحاولة'}
        </Button>
      </div>
    );
  }
}
