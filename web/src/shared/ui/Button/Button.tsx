import type { ButtonHTMLAttributes, ReactNode } from 'react';
import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'outline' | 'quiet' | 'text';
export type ButtonSize = 'md' | 'sm';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  busy?: boolean;
  children: ReactNode;
}

/** DS Button: every button is a pill; supports primary, outline, quiet, and text variants. */
export function Button({
  variant = 'primary',
  size = 'md',
  block = false,
  busy = false,
  className = '',
  type = 'button',
  disabled,
  children,
  ...rest
}: ButtonProps) {
  const classes = [
    styles.button,
    styles[variant],
    size === 'sm' ? styles.sm : '',
    block ? styles.block : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled}
      aria-busy={busy || undefined}
      {...rest}
    >
      {children}
    </button>
  );
}
