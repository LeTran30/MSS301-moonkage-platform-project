import type { CSSProperties } from 'react';
import { useToasts, removeToast, type ToastItem, type ToastTone } from './toastStore';
import { Icon } from '../Icon/Icon';
import styles from './Toast.module.css';

function getIconForTone(tone: ToastTone) {
  switch (tone) {
    case 'success':
      return <Icon name="check" size={16} />;
    case 'error':
      return <Icon name="alert" size={16} />;
    case 'warning':
      return <Icon name="alert" size={16} />;
    case 'info':
    default:
      return <Icon name="info" size={16} />;
  }
}

function getToneClass(tone: ToastTone) {
  switch (tone) {
    case 'success':
      return styles.toneSuccess;
    case 'error':
      return styles.toneError;
    case 'warning':
      return styles.toneWarning;
    case 'info':
    default:
      return styles.toneInfo;
  }
}

function SingleToast({ item }: { item: ToastItem }) {
  const duration = item.duration ?? 4000;

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`${styles.toastItem} ${getToneClass(item.tone)}`}
    >
      <div className={styles.iconWrapper}>{getIconForTone(item.tone)}</div>
      <div className={styles.contentWrapper}>
        {item.title && <div className={styles.toastTitle}>{item.title}</div>}
        <div className={styles.toastMessage}>{item.message}</div>
      </div>
      <button
        type="button"
        aria-label="Đóng thông báo"
        className={styles.closeButton}
        onClick={() => removeToast(item.id)}
      >
        <Icon name="x" size={14} />
      </button>
      {duration > 0 && (
        <div
          className={styles.progressBar}
          style={{ '--toast-duration': `${duration}ms` } as CSSProperties}
        />
      )}
    </div>
  );
}

export function ToastContainer() {
  const toasts = useToasts();

  if (toasts.length === 0) return null;

  return (
    <aside className={styles.toastContainer} aria-label="Thông báo hệ thống">
      {toasts.map((item) => (
        <SingleToast key={item.id} item={item} />
      ))}
    </aside>
  );
}
