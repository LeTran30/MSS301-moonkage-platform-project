import type { ReactNode } from 'react';

/** Page title, optional eyebrow and lead, actions on the right. */
export function PageHeader({ eyebrow, title, lead, actions }: { eyebrow?: ReactNode; title: ReactNode; lead?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="page-head">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1 className="title-text">{title}</h1>
        {lead && <p className="lead-text">{lead}</p>}
      </div>
      {actions && <div className="page-head__actions">{actions}</div>}
    </header>
  );
}

export function EmptyState({ title, body, children }: { title: string; body?: string; children?: ReactNode }) {
  return (
    <div className="empty-state">
      <p className="empty-state__title">{title}</p>
      {body && <p className="muted">{body}</p>}
      {children && <div className="row">{children}</div>}
    </div>
  );
}
