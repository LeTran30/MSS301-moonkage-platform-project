import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/shared/lib';
import styles from './Card.module.css';

type Props = HTMLAttributes<HTMLElement> & {
  as?: 'div' | 'section' | 'article' | 'aside';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  interactive?: boolean;
  tone?: 'default' | 'muted' | 'gold' | 'night' | 'danger';
};

export function Card({ as: Tag = 'div', padding = 'md', interactive, tone = 'default', className, ...rest }: Props) {
  return (
    <Tag
      className={cn(styles.card, styles[`pad_${padding}`], styles[tone], interactive && styles.interactive, className)}
      {...rest}
    />
  );
}

type HeaderProps = {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  icon?: ReactNode;
  className?: string;
};

export function CardHeader({ title, description, actions, icon, className }: HeaderProps) {
  return (
    <div className={cn(styles.header, className)}>
      {icon && <span className={styles.icon}>{icon}</span>}
      <div className={styles.headText}>
        <h3 className={styles.title}>{title}</h3>
        {description && <p className={styles.description}>{description}</p>}
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </div>
  );
}
