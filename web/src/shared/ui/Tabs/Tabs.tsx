import type { ReactNode } from 'react';
import { cn } from '@/shared/lib';
import styles from './Tabs.module.css';

export type TabItem<T extends string = string> = {
  id: T;
  label: ReactNode;
  badge?: ReactNode;
  disabled?: boolean;
};

type Props<T extends string = string> = {
  items: TabItem<T>[];
  activeId: T;
  onChange: (id: T) => void;
  variant?: 'underline' | 'pills' | 'enclosed';
  className?: string;
};

export function Tabs<T extends string = string>({ items, activeId, onChange, variant = 'underline', className }: Props<T>) {
  return (
    <div className={cn(styles.tabs, styles[variant], className)} role="tablist">
      {items.map((tab) => {
        const isActive = tab.id === activeId;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            disabled={tab.disabled}
            className={cn(styles.tab, isActive && styles.active)}
            onClick={() => onChange(tab.id)}
          >
            <span>{tab.label}</span>
            {tab.badge !== undefined && <span className={styles.badge}>{tab.badge}</span>}
          </button>
        );
      })}
    </div>
  );
}
