import { strings } from '../config/strings';

/** The two states every loaded list or page has before its content: loading, and failed with a retry. */
export function LoadingState({ label = strings.loading }: { label?: string }) {
  return (
    <p role="status" className="muted async-state">
      {label}
    </p>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="panel async-state">
      <p role="alert" className="error-text">
        {message}
      </p>
      <button type="button" className="mk-btn mk-btn--quiet mk-btn--sm" onClick={onRetry}>
        {strings.errors.retry}
      </button>
    </div>
  );
}
