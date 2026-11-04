import { formatDateTime } from '@/shared/utils';
import { Card } from '@/shared/ui';
import type { ProductReview } from '../api/productApi';
import styles from './ProductReviewList.module.css';

interface ProductReviewListProps {
  reviews: ProductReview[];
  /** Trạng thái tải dữ liệu từ backend. */
  state: 'loading' | 'error' | 'loaded';
  errorMessage?: string;
}

/**
 * Đánh giá của sản phẩm (AC-11.3).
 *
 * Nguồn là catalog-service (`GET /api/products/{productId}/reviews`), nên trang
 * sản phẩm thấy mọi đánh giá của món đó, không chỉ của một đơn.
 */
export function ProductReviewList({ reviews, state, errorMessage }: ProductReviewListProps) {
  return (
    <Card padding="md" className={styles.card}>
      <h3 className={styles.cardTitle}>Đánh giá sản phẩm ({reviews.length})</h3>
      {state === 'loading' && <p role="status">Đang tải đánh giá…</p>}
      {state === 'error' && (
        <p role="alert" className={styles.error}>
          {errorMessage}
        </p>
      )}
      {state === 'loaded' && reviews.length === 0 && (
        <p>Chưa có đánh giá nào cho sản phẩm này.</p>
      )}
      {reviews.map((r) => (
        <div key={r.id} className={styles.reviewRow}>
          <span className={styles.reviewRating} aria-label={`${r.rating} sao`}>
            {'★'.repeat(r.rating)}
            {'☆'.repeat(Math.max(0, 5 - r.rating))}
          </span>
          <span className={styles.reviewContent}>{r.content || '(không có nhận xét)'}</span>
          <span className={styles.reviewDate}>{formatDateTime(r.createdAt)}</span>
        </div>
      ))}
    </Card>
  );
}
