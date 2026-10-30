import type { ReactNode } from 'react';
import { userStrings } from '../strings';
import styles from './AccountCard.module.css';

/** Card of the account forms around login (M5.2–M5.5). */
export function AccountCard({ title, lead, children, footer }: { title: string; lead?: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className={styles.card}>
      <p className="brand-text">{userStrings.appName}</p>
      <h1 className={styles.title}>{title}</h1>
      {lead && <p className="muted">{lead}</p>}
      {children}
      {footer && <div className={styles.footer}>{footer}</div>}
    </div>
  );
}

/** One labelled input of the account forms, with its error or hint. */
export function AccountField({
  id,
  label,
  type = 'text',
  value,
  onChange,
  error,
  hint,
  autoComplete,
}: {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  hint?: string;
  autoComplete?: string;
}) {
  return (
    <div className={`mk-field${error ? ' mk-field--error' : ''}`}>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type={type}
        value={value}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? `${id}-hint` : undefined}
      />
      {(error || hint) && (
        <span className="mk-hint" id={`${id}-hint`}>
          {error ?? hint}
        </span>
      )}
    </div>
  );
}
