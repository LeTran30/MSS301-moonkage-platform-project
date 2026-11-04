import type { SelectHTMLAttributes } from 'react';
import { cn } from '@/shared/lib';
import { Icon } from '../Icon/Icon';
import styles from './Select.module.css';

type Option = { value: string; label: string; disabled?: boolean };

type Props = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  hint?: string;
  error?: string;
  options: Option[];
};

export function Select({ label, hint, error, options, className, id, required, ...rest }: Props) {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
  return (
    <div className={cn(styles.wrapper, className)}>
      {label && (
        <label htmlFor={selectId} className={styles.label}>
          {label} {required && <span className={styles.req}>*</span>}
        </label>
      )}
      <div className={cn(styles.control, error && styles.hasError)}>
        <select id={selectId} required={required} className={styles.select} {...rest}>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>
        <Icon name="chevronDown" size={16} className={styles.arrow} />
      </div>
      {error ? <p className={styles.error}>{error}</p> : hint ? <p className={styles.hint}>{hint}</p> : null}
    </div>
  );
}
