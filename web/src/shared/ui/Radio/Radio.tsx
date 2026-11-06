import { useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/shared/lib';
import styles from './Radio.module.css';

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'children'> & {
  /** Nhãn hiển thị cạnh nút chọn. Không có nhãn thì dùng `aria-label`. */
  label?: ReactNode;
  /** Gợi ý/thông báo bổ sung dưới nhãn. */
  hint?: string;
  /** Thông báo lỗi — component tự gắn `aria-invalid` + `aria-describedby`. */
  error?: string;
  /** Ẩn nhãn nhưng vẫn giữ cho trình đọc màn hình. */
  hideLabel?: boolean;
  /** Nhãn phụ hiển thị bên phải. */
  endLabel?: string;
  /** Class áp trực tiếp cho thẻ `<input>` — dùng khi control nằm trong layout riêng. */
  inputClassName?: string;
};

/**
 * Nút chọn (radio) của design system.
 *
 * Quyết định thiết kế: **giữ `<input type="radio">` native** và tô màu bằng
 * `accent-color` — cùng lý do như `Checkbox`:
 *
 * 1. Radio native đã có sẵn hành vi bàn phím của nhóm (←/→ chuyển giữa các
 *    nút trong cùng `name`, Space để chọn) và hành vi "chỉ chọn được một".
 * 2. Viết lại bằng `div` + `role="radio"` sẽ phải tự quản lý nhóm, roving
 *    tabindex và trạng thái checked — nhiều code, nhiều lỗi a11y.
 * 3. `accent-color` cho phép tô màu theo token, đủ để đồng bộ bảng màu.
 *
 * Component lo phần còn lại: nhãn gắn qua `htmlFor`, thông báo lỗi gắn qua
 * `aria-describedby`, bố cục theo token.
 *
 * Khi không truyền `label`/`hint`/`error`, wrapper dùng `display: contents`
 * nên nút chọn nằm thẳng trong layout của cha (dùng cho card chọn mô hình).
 */
export function Radio({
  label,
  hint,
  error,
  hideLabel = false,
  endLabel,
  inputClassName,
  className,
  id,
  disabled,
  required,
  ...rest
}: Props) {
  const generatedId = useId();
  const inputId =
    id || (typeof label === 'string' ? label.toLowerCase().replace(/\s+/g, '-') : generatedId);
  const messageId = `${inputId}-message`;
  const hasMessage = Boolean(error || hint);
  const bare = label === undefined && !hasMessage && !endLabel;

  return (
    <div
      className={cn(
        styles.wrapper,
        bare && styles.wrapperBare,
        disabled && styles.disabled,
        className,
      )}
    >
      <div className={cn(styles.row, bare && styles.rowBare)}>
        <input
          type="radio"
          id={inputId}
          className={cn(styles.input, inputClassName)}
          disabled={disabled}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={hasMessage ? messageId : undefined}
          {...rest}
        />
        {label !== undefined && (
          <label htmlFor={inputId} className={cn(styles.label, hideLabel && styles.srOnly)}>
            {label} {required && <span className={styles.req}>*</span>}
          </label>
        )}
        {endLabel && <span className={styles.endLabel}>{endLabel}</span>}
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
