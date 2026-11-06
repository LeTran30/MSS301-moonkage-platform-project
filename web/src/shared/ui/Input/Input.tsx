import { useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/shared/lib';
import { Icon, type IconName } from '../Icon/Icon';
import styles from './Input.module.css';

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
  iconLeft?: IconName;
  iconRight?: IconName;
  onRightIconClick?: () => void;
  actionRight?: ReactNode;
};

/**
 * Ô nhập của design system.
 *
 * Khi có `error`, component tự gắn `aria-invalid` và `aria-describedby` trỏ tới
 * dòng thông báo lỗi. Nhờ vậy mọi form dùng `Input` đều được nối với trình
 * đọc màn hình mà không phải viết lại thuộc tính ở từng nơi.
 */
export function Input({
  label,
  hint,
  error,
  iconLeft,
  iconRight,
  onRightIconClick,
  actionRight,
  className,
  id,
  disabled,
  required,
  ...rest
}: Props) {
  const generatedId = useId();
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : generatedId);
  const messageId = `${inputId}-message`;
  const hasMessage = Boolean(error || hint);

  return (
    <div className={cn(styles.wrapper, disabled && styles.disabled, className)}>
      {label && (
        <label htmlFor={inputId} className={styles.label}>
          {label} {required && <span className={styles.req}>*</span>}
        </label>
      )}
      <div className={cn(styles.control, error && styles.hasError)}>
        {iconLeft && <Icon name={iconLeft} size={18} className={styles.iconLeft} />}
        <input
          id={inputId}
          disabled={disabled}
          required={required}
          className={styles.input}
          aria-invalid={error ? true : undefined}
          aria-describedby={hasMessage ? messageId : undefined}
          {...rest}
        />
        {iconRight && (
          <button
            type="button"
            className={styles.iconRightBtn}
            onClick={onRightIconClick}
            disabled={!onRightIconClick}
            tabIndex={onRightIconClick ? 0 : -1}
          >
            <Icon name={iconRight} size={18} />
          </button>
        )}
        {actionRight && <div className={styles.actionRight}>{actionRight}</div>}
      </div>
      {error ? (
        <p id={messageId} className={styles.error} role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={messageId} className={styles.hint}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}
