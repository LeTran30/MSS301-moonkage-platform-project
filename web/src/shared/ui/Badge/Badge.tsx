import type { ReactNode } from 'react';
import { cn } from '@/shared/lib';
import styles from './Badge.module.css';

export type BadgeTone = 'neutral' | 'gold' | 'red' | 'green' | 'amber' | 'blue' | 'outline' | 'solid';

type Props = {
  tone?: BadgeTone;
  dot?: boolean;
  size?: 'sm' | 'md';
  children: ReactNode;
  className?: string;
  title?: string;
};

export function Badge({ tone = 'neutral', dot, size = 'md', children, className, title }: Props) {
  return (
    <span className={cn(styles.badge, styles[tone], styles[size], className)} title={title}>
      {dot && <span className={styles.dot} aria-hidden />}
      {children}
    </span>
  );
}
