import type { ReactNode } from 'react';
import styles from './PageHeader.module.css';

/** Page title, optional eyebrow and lead, actions on the right. */
export function PageHeader({ eyebrow, title, lead, actions }: { eyebrow?: ReactNode; title: ReactNode; lead?: ReactNode; actions?: ReactNode }) {
  return (
    <header className={styles.pageHead}>
      <div className={styles.headContent}>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1 className={styles.title}>{title}</h1>
        {lead && <p className="lead-text">{lead}</p>}
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </header>
  );
}

export function EmptyState({ title, body, children }: { title: string; body?: string; children?: ReactNode }) {
  return (
    <div className={styles.emptyState}>
      <p className={styles.emptyTitle}>{title}</p>
      {body && <p className="muted">{body}</p>}
      {children && <div className="row">{children}</div>}
    </div>
  );
}
