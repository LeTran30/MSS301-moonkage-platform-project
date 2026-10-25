import { formatRating } from '../utils/money';

/** `4,8 ★ (32)`, or `4,8 ★` without a count; the star is decorative, the number is read out. */
export function Stars({ value, count, emptyLabel }: { value: number | null; count?: number; emptyLabel: string }) {
  if (value === null || count === 0) return emptyLabel ? <span className="stars stars--empty">{emptyLabel}</span> : null;
  return (
    <span className="stars">
      <span aria-hidden="true" className="stars__icon">
        ★
      </span>
      <span className="mk-num">{formatRating(value)}</span>
      {count !== undefined && <span className="stars__count mk-num">({count})</span>}
    </span>
  );
}
