import { Button } from '../Button/Button';
import styles from './AsyncState.module.css';

/** The two states every loaded list or page has before its content: loading, and failed with a retry. */
export function LoadingState({ label = 'Đang tải…' }: { label?: string }) {
  return (
    <p role="status" className={`${styles.state} ${styles.loadingText}`}>
      {label}
    </p>
  );
}

export function ErrorState({ message, onRetry, retryLabel = 'Thử lại' }: { message: string; onRetry: () => void; retryLabel?: string }) {
  return (
    <div className={`${styles.state} ${styles.errorBox}`}>
      <p role="alert" className={styles.errorText}>
        {message}
      </p>
      <Button variant="quiet" size="sm" onClick={onRetry}>
        {retryLabel}
      </Button>
    </div>
  );
}
