export type Tone = 'ok' | 'warn' | 'brand' | 'soft' | 'gold' | 'muted' | 'plain';

/** DS Badge with a tone: ok / warn are dot + coloured text; the others are filled pills. Always text. */
export function StatusBadge({ tone = 'plain', children }: { tone?: Tone; children: string }) {
  return <span className={`mk-badge${tone === 'plain' ? '' : ` mk-badge--${tone}`}`}>{children}</span>;
}
