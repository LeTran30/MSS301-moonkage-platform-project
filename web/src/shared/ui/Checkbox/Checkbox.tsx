import { useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/shared/lib';
import styles from './Checkbox.module.css';

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'children'> & {
  /** Nhãn hiển thị cạnh ô chọn. Không có nhãn thì dùng `aria-label`. */
  label?: ReactNode;
  /** Gợi ý/thông báo bổ sung dưới nhãn. */
  hint?: string;
  /** Thông báo lỗi — component tự gắn `aria-invalid` + `aria-describedby`. */
  error?: string;
  /** Ẩn nhãn nhưng vẫn giữ cho trình đọc màn hình. */
  hideLabel?: boolean;
  /** Nhãn phụ hiển thị bên phải (ví dụ "Bắt buộc"). */
  endLabel?: string;
  /** Class áp trực tiếp cho thẻ `<input>` — dùng khi control nằm trong layout riêng. */
  inputClassName?: string;
};

/**
 * Ô chọn (checkbox) của design system.
 *
 * Quyết định thiết kế: **giữ `<input type="checkbox">` native** và chỉ tô màu
 * bằng `accent-color`. Lý do:
 *
 * 1. Người dùng đã quen với checkbox vuông của hệ đối tượng; thay bằng
 *    `div` + `role="checkbox"` sẽ phải tự viết lại toàn bộ hành vi bàn phím
 *    (Space để bật/tắt) và trạng thái indeterminate.
 * 2. Form submit, `FormData`, autofill của trình duyệt và các thư viện đọc
 *    form đều dựa trên element native ⇒ migrate không làm hỏng luồng dữ liệu.
 * 3. `accent-color` đã cho phép tô màu theo token của hệ thống, đủ để đồng
 *    bộ với bảng màu kem–đỏ–vàng mà không phải vẽ lại control.
 *
 * Vì vậy component chỉ lo phần còn lại: nhãn gắn đúng qua `htmlFor`, thông báo
 * lỗi gắn qua `aria-describedby`, và khoảng cách/bố cục theo token.
 *
 * Khi không truyền `label`/`hint`/`error`, wrapper dùng `display: contents`
 * nên ô chọn nằm thẳng trong layout của cha (dùng cho card chọn mô hình).
 */
export function Checkbox({
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
          type="checkbox"
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
