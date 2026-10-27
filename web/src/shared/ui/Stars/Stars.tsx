import { formatRating } from '../../utils/money';
import styles from './Stars.module.css';

/** `4,8 ★ (32)`, or `4,8 ★` without a count; the star is decorative, the number is read out. */
export function Stars({ value, count, emptyLabel }: { value: number | null; count?: number; emptyLabel: string }) {
  if (value === null || count === 0) {
    return emptyLabel ? <span className={`${styles.stars} ${styles.muted}`}>{emptyLabel}</span> : null;
  }
  return (
    <span className={styles.stars}>
      <span aria-hidden="true" className={styles.icon}>
        ★
      </span>
      <span className="mk-num">{formatRating(value)}</span>
      {count !== undefined && <span className={`${styles.muted} mk-num`}>({count})</span>}
    </span>
  );
}
