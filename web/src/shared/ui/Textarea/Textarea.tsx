import { useId, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/shared/lib';
import styles from './Textarea.module.css';

type Props = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  hint?: string;
  error?: string;
};

/**
 * Vùng nhập nhiều dòng — bám theo đúng `Input` để form trông như một khối.
 *
 * Khác `Input`, `Textarea` giữ chiều cao cố định tối thiểu và cho phép resize
 * theo chiều dọc (người dùng có thể mở rộng khi viết ghi chú dài).
 */
export function Textarea({
  label,
  hint,
  error,
  className,
  id,
  disabled,
  required,
  rows = 4,
  ...rest
}: Props) {
  const generatedId = useId();
  const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : generatedId);
  const messageId = `${textareaId}-message`;
  const hasMessage = Boolean(error || hint);

  return (
    <div className={cn(styles.wrapper, disabled && styles.disabled, className)}>
      {label && (
        <label htmlFor={textareaId} className={styles.label}>
          {label} {required && <span className={styles.req}>*</span>}
        </label>
      )}
      <textarea
        id={textareaId}
        rows={rows}
        disabled={disabled}
        required={required}
        className={cn(styles.textarea, error && styles.hasError)}
        aria-invalid={error ? true : undefined}
        aria-describedby={hasMessage ? messageId : undefined}
        {...rest}
      />
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
