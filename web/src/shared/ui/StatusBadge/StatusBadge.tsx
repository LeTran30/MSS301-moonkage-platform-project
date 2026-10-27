import styles from './StatusBadge.module.css';

export type Tone = 'ok' | 'warn' | 'brand' | 'soft' | 'gold' | 'muted' | 'plain';

/** DS Badge with a tone: ok / warn are dot + coloured text; the others are filled pills. Always text. */
export function StatusBadge({ tone = 'plain', children }: { tone?: Tone; children: string }) {
  const toneClass = tone === 'plain' ? '' : styles[tone];
  return <span className={`${styles.badge} ${toneClass}`.trim()}>{children}</span>;
}
