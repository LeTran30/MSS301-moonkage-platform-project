import type { ReactNode } from 'react';

/** Label / value pairs (order facts, profile, request summary). */
export function KeyValue({ rows }: { rows: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="kv">
      {rows.map((r) => (
        <div key={r.label} className="kv__row">
          <dt>{r.label}</dt>
          <dd>{r.value}</dd>
        </div>
      ))}
    </dl>
  );
}
