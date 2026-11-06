import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/shared/lib';
import { Icon, type IconName } from '../Icon/Icon';
import styles from './Button.module.css';

type Variant = 'primary' | 'gold' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'link';
type Size = 'sm' | 'md' | 'lg';

type CommonProps = {
  variant?: Variant;
  size?: Size;
  block?: boolean;
  iconLeft?: IconName;
  iconRight?: IconName;
  loading?: boolean;
  children?: ReactNode;
  className?: string;
};

function Inner({ iconLeft, iconRight, loading, children, size }: CommonProps) {
  const s = size === 'sm' ? 16 : 18;
  return (
    <>
      {loading ? <span className={styles.spinner} aria-hidden /> : iconLeft && <Icon name={iconLeft} size={s} />}
      {children && <span className={styles.label}>{children}</span>}
      {iconRight && !loading && <Icon name={iconRight} size={s} />}
    </>
  );
}

export function Button({
  variant = 'primary',
  size = 'md',
  block,
  iconLeft,
  iconRight,
  loading,
  className,
  children,
  type = 'button',
  disabled,
  ...rest
}: CommonProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      className={cn(styles.button, styles[variant], styles[size], block && styles.block, !children && styles.iconOnly, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      <Inner iconLeft={iconLeft} iconRight={iconRight} loading={loading} size={size}>
        {children}
      </Inner>
    </button>
  );
}

export function ButtonLink({
  to,
  variant = 'primary',
  size = 'md',
  block,
  iconLeft,
  iconRight,
  className,
  children,
  ...rest
}: CommonProps & { to: string } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>) {
  return (
    <Link
      to={to}
      className={cn(styles.button, styles[variant], styles[size], block && styles.block, !children && styles.iconOnly, className)}
      {...rest}
    >
      <Inner iconLeft={iconLeft} iconRight={iconRight} size={size}>
        {children}
      </Inner>
    </Link>
  );
}
