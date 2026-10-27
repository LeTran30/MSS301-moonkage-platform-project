import { strings } from '../../config/strings';
import { Button } from '../Button/Button';
import styles from './AsyncState.module.css';

/** The two states every loaded list or page has before its content: loading, and failed with a retry. */
export function LoadingState({ label = strings.loading }: { label?: string }) {
  return (
    <p role="status" className={`${styles.state} ${styles.loadingText}`}>
      {label}
    </p>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className={`${styles.state} ${styles.errorBox}`}>
      <p role="alert" className={styles.errorText}>
        {message}
      </p>
      <Button variant="quiet" size="sm" onClick={onRetry}>
        {strings.errors.retry}
      </Button>
    </div>
  );
}
