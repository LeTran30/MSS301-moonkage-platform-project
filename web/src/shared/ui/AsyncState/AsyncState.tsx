import type { ReactNode } from 'react';
import { Button } from '../Button/Button';
import { Icon } from '../Icon/Icon';
import styles from './AsyncState.module.css';

export type AsyncStateKind<T> =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'loaded'; data: T };

export interface LoadingStateProps {
  message?: string;
  className?: string;
}

export function LoadingState({ message = 'Đang tải dữ liệu từ Moonkage...', className }: LoadingStateProps) {
  return (
    <div className={`${styles.loadingWrap} ${className || ''}`} role="status" aria-busy="true">
      <div className={styles.spinner} />
      <span className={styles.loadingText}>{message}</span>
    </div>
  );
}

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = 'Không thể tải dữ liệu',
  message = 'Đã có sự cố kết nối với hệ thống máy chủ Moonkage. Vui lòng thử lại.',
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={`${styles.errorCard} ${className || ''}`}
      role="alert"
      aria-live="assertive"
    >
      <div className={styles.errorIconWrap}>
        <Icon name="alert" size={28} />
      </div>
      <h3 className={styles.errorTitle}>{title}</h3>
      <p className={styles.errorMessage}>{message}</p>
      {onRetry && (
        <div className={styles.retryBtn}>
          <Button variant="outline" size="sm" onClick={onRetry}>
            <Icon name="check" size={14} /> Thử lại
          </Button>
        </div>
      )}
    </div>
  );
}

export interface AsyncStateProps<T> {
  state: AsyncStateKind<T>;
  children: (data: T) => ReactNode;
  empty?: ReactNode;
  isEmpty?: (data: T) => boolean;
  onRetry?: () => void;
  loadingMessage?: string;
}

import { checkIsDataEmpty } from './checkIsDataEmpty';


/**
 * Wrapper quản lý 4 trạng thái bất đồng bộ theo Luật L1:
 * Loading / Error / Empty / Loaded.
 */
export function AsyncState<T>({
  state,
  children,
  empty,
  isEmpty,
  onRetry,
  loadingMessage,
}: AsyncStateProps<T>) {
  if (state.kind === 'loading') {
    return <LoadingState message={loadingMessage} />;
  }

  if (state.kind === 'error') {
    return <ErrorState message={state.message} onRetry={onRetry} />;
  }

  const isDataEmpty = checkIsDataEmpty(state.data, isEmpty);

  if (isDataEmpty && empty) {
    return <>{empty}</>;
  }

  return <>{children(state.data)}</>;
}
