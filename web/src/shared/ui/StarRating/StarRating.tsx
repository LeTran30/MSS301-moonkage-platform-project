import { Icon } from '../Icon/Icon';
import styles from './StarRating.module.css';

type Props = {
  /** Điểm đánh giá (0–5). */
  value: number;
  /** Số sao tối đa hiển thị. */
  max?: number;
  size?: number;
  /** Hiển thị số điểm bằng văn bản bên cạnh. */
  showValue?: boolean;
  className?: string;
};

/**
 * Dải sao dùng chung, thay cho ký tự `★`/`☆` gốc.
 *
 * Lý do: emoji/symbol Unicode render khác nhau theo font hệ đối tượng và
 * không dùng `currentColor` nên không tôn trọng theme tối. Icon SVG giữ
 * được màu token và đồng nhất giữa Windows/macOS/Linux.
 */
export function StarRating({ value, max = 5, size = 14, showValue = false, className }: Props) {
  const rounded = Math.max(0, Math.min(max, Math.round(value)));
  return (
    <span className={`${styles.wrap} ${className ?? ''}`} role="img" aria-label={`${value} trên ${max} sao`}>
      <span className={styles.stars} aria-hidden="true">
        {Array.from({ length: max }, (_, i) => (
          <Icon
            key={i}
            name="star"
            size={size}
            className={i < rounded ? styles.filled : styles.empty}
          />
        ))}
      </span>
      {showValue && <span className={styles.value}>{value}</span>}
    </span>
  );
}
