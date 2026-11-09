import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { cn } from '@/shared/lib';
import { Icon } from '../Icon/Icon';
import styles from './Select.module.css';

export type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

export type SelectOptgroup = {
  label: string;
  options: SelectOption[];
};

type Props = {
  label?: string;
  hint?: string;
  error?: string;
  /** Danh sách phẳng. Dùng `groups` khi cần nhóm (optgroup). */
  options?: SelectOption[];
  /** Nhóm tuỳ chọn — thay thế `options` khi có nhãn nhóm. */
  groups?: SelectOptgroup[];
  /** Ẩn nhãn nhưng vẫn cần cho người đọc màn hình. */
  hideLabel?: boolean;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  id?: string;
  name?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  /** Nội dung tuỳ chọn thay cho chữ, khi `value` đã chọn. */
  renderValue?: (option: SelectOption) => ReactNode;
};

/**
 * Ô chọn của design system — listbox tự dựng, không dùng `<select>` native.
 *
 * Vì sao không dùng `<select>`:
 * 1. Popup của `<select>` do hệ điều hành vẽ ⇒ không style được theo token,
 *    không đồng nhất giữa Windows/macOS/mobile.
 * 2. Không kiểm soát được chiều cao danh sách ⇒ cuộn ngang trên mobile.
 * 3. `<select>` không có trạng thái "chưa chọn" ⇒ không có placeholder.
 *
 * Thay vào đó component này dựng listbox theo WAI-ARIA:
 * - `role="combobox"` + `aria-expanded` + `aria-controls` trên nút trigger;
 * - `role="listbox"` + `role="option"` + `aria-selected` trên danh sạch;
 * - `aria-activedescendant` trỏ tới option đang được đánh dấu;
 * - điều hướng bằng bàn phím: ↑ ↓ Home End Enter Escape Tab.
 */
export function Select({
  label,
  hint,
  error,
  options,
  groups,
  hideLabel = false,
  placeholder = 'Chọn một mục',
  required,
  disabled,
  className,
  id,
  name,
  value: controlledValue,
  defaultValue,
  onChange,
  renderValue,
}: Props) {
  const generatedId = useId();
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : generatedId);
  const listboxId = `${selectId}-listbox`;
  const messageId = `${selectId}-message`;

  // Gom phẳng để điều hướng bằng bàn phím và tìm option theo giá trị.
  const flatOptions = useMemo<SelectOption[]>(
    () => (groups ? groups.flatMap((g) => g.options) : (options ?? [])),
    [groups, options],
  );

  const [uncontrolledValue, setUncontrolledValue] = useState<string>(
    defaultValue ?? flatOptions[0]?.value ?? '',
  );
  const isControlled = controlledValue !== undefined;
  const currentValue = isControlled ? controlledValue : uncontrolledValue;

  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selectedOption = flatOptions.find((o) => o.value === currentValue);
  const hasMessage = Boolean(error || hint);

  const setValue = useCallback(
    (next: string) => {
      if (!isControlled) setUncontrolledValue(next);
      onChange?.(next);
    },
    [isControlled, onChange],
  );

  /**
   * Mở danh sách và đặt con trỏ về option đang chọn (hoặc option hợp lệ đầu
   * tiên). Tính ngay lúc mở thay vì trong `useEffect` để không sinh vòng render
   * thừa.
   */
  const openList = useCallback(() => {
    const selectedIndex = flatOptions.findIndex((o) => o.value === currentValue);
    const firstEnabled = flatOptions.findIndex((o) => !o.disabled);
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : firstEnabled);
    setOpen(true);
  }, [flatOptions, currentValue]);

  // Đóng dropdown khi click ra ngoài.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  // Cuộn option đang được đánh dấu vào khung nhìn.
  useEffect(() => {
    if (!open || activeIndex < 0) return;
    const node = listRef.current?.querySelector<HTMLElement>(`#${CSS.escape(`${listboxId}-opt-${activeIndex}`)}`);
    // jsdom không có `scrollIntoView` ⇒ chốt lại trước khi gọi.
    node?.scrollIntoView?.({ block: 'nearest' });
  }, [open, activeIndex, listboxId]);

  function moveActive(delta: number) {
    if (flatOptions.length === 0) return;
    let next = activeIndex;
    for (let step = 0; step < flatOptions.length; step += 1) {
      next = (next + delta + flatOptions.length) % flatOptions.length;
      if (!flatOptions[next].disabled) {
        setActiveIndex(next);
        return;
      }
    }
  }

  function commit(index: number) {
    const option = flatOptions[index];
    if (!option || option.disabled) return;
    setValue(option.value);
    setOpen(false);
    triggerRef.current?.focus();
  }

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowUp': {
        e.preventDefault();
        if (!open) {
          openList();
        } else {
          moveActive(e.key === 'ArrowDown' ? 1 : -1);
        }
        break;
      }
      case 'Home':
        if (open) {
          e.preventDefault();
          setActiveIndex(flatOptions.findIndex((o) => !o.disabled));
        }
        break;
      case 'End':
        if (open) {
          e.preventDefault();
          for (let i = flatOptions.length - 1; i >= 0; i -= 1) {
            if (!flatOptions[i].disabled) {
              setActiveIndex(i);
              break;
            }
          }
        }
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (!open) {
          openList();
        } else if (activeIndex >= 0) {
          commit(activeIndex);
        }
        break;
      case 'Escape':
        if (open) {
          e.preventDefault();
          setOpen(false);
          triggerRef.current?.focus();
        }
        break;
      case 'Tab':
        if (open) setOpen(false);
        break;
      default:
        break;
    }
  }

  function renderOption(option: SelectOption, index: number) {
    const isSelected = option.value === currentValue;
    const isActive = index === activeIndex;
    return (
      <li
        key={option.value}
        id={`${listboxId}-opt-${index}`}
        role="option"
        aria-selected={isSelected}
        aria-disabled={option.disabled || undefined}
        className={cn(
          styles.option,
          isSelected && styles.optionSelected,
          isActive && styles.optionActive,
          option.disabled && styles.optionDisabled,
        )}
        onMouseEnter={() => !option.disabled && setActiveIndex(index)}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => commit(index)}
      >
        <span className={styles.optionLabel}>{option.label}</span>
        {isSelected && <Icon name="check" size={16} className={styles.optionCheck} />}
      </li>
    );
  }

  let optionCursor = 0;

  return (
    <div className={cn(styles.wrapper, disabled && styles.disabled, className)} ref={rootRef}>
      {label && (
        <label htmlFor={selectId} className={cn(styles.label, hideLabel && styles.srOnly)}>
          {label} {required && <span className={styles.req}>*</span>}
        </label>
      )}
      <div className={cn(styles.control, error && styles.hasError, open && styles.isOpen)}>
        <button
          type="button"
          id={selectId}
          ref={triggerRef}
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-required={required || undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={hasMessage ? messageId : undefined}
          aria-activedescendant={open && activeIndex >= 0 ? `${listboxId}-opt-${activeIndex}` : undefined}
          disabled={disabled}
          className={styles.select}
          onClick={() => {
            if (disabled) return;
            if (open) setOpen(false);
            else openList();
          }}
          onKeyDown={onKeyDown}
        >
          <span className={cn(styles.value, !selectedOption && styles.valuePlaceholder)}>
            {selectedOption
              ? renderValue
                ? renderValue(selectedOption)
                : selectedOption.label
              : placeholder}
          </span>
        </button>
        <Icon name="chevronDown" size={16} className={cn(styles.arrow, open && styles.arrowOpen)} />
      </div>

      {open && (
        <ul
          id={listboxId}
          ref={listRef}
          role="listbox"
          aria-labelledby={label ? selectId : undefined}
          className={styles.listbox}
        >
          {groups
            ? groups.map((group) => (
                <li key={group.label} role="group" aria-label={group.label} className={styles.group}>
                  <div className={styles.groupLabel}>{group.label}</div>
                  <ul className={styles.groupOptions}>
                    {group.options.map((option) => {
                      const index = optionCursor;
                      optionCursor += 1;
                      return renderOption(option, index);
                    })}
                  </ul>
                </li>
              ))
            : (options ?? []).map((option, index) => renderOption(option, index))}
        </ul>
      )}

      {/* Trường ẩn để form native (submit) nhận đúng giá trị đã chọn. */}
      {name && <input type="hidden" name={name} value={currentValue} />}

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
