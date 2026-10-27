import type { ReactNode } from 'react';
import styles from './KeyValue.module.css';

/** Label / value pairs (order facts, profile, request summary). */
export function KeyValue({ rows }: { rows: { label: string; value: ReactNode }[] }) {
  return (
    <dl className={styles.kv}>
      {rows.map((r) => (
        <div key={r.label} className={styles.row}>
          <dt className={styles.term}>{r.label}</dt>
          <dd className={styles.detail}>{r.value}</dd>
        </div>
      ))}
    </dl>
  );
}
