import type { ReactNode } from 'react';
import { cn } from '@/shared/lib';
import { Icon, type IconName } from '../Icon/Icon';
import styles from './EmptyState.module.css';

type Props = {
  icon?: IconName;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({ icon = 'package', title, description, action, className }: Props) {
  return (
    <div className={cn(styles.empty, className)}>
      <div className={styles.iconWrap}>
        <Icon name={icon} size={32} />
      </div>
      <h3 className={styles.title}>{title}</h3>
      {description && <p className={styles.desc}>{description}</p>}
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
