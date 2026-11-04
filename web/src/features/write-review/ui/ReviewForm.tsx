import { useState } from 'react';
import { Button, Card, toast } from '@/shared/ui';
import { useAction } from '@/shared/lib';
import { queryClient, queryKeys } from '@/shared/api';
import { useCreateReview } from '../model/useCreateReview';
import styles from './ReviewForm.module.css';

const RATINGS = [5, 4, 3, 2, 1] as const;

interface ReviewFormProps {
  orderId: string;
  /** The products of the order the buyer has not reviewed yet. */
  products: Array<{ productId: string; name: string }>;
}

/**
 * FR-11, BR-32: the buyer rates each product of a delivered buy-now order,
 * once per product.
 */
export function ReviewForm({ orderId, products }: ReviewFormProps) {
  const createReview = useCreateReview();
  const { busy, run, error } = useAction();
  const [productId, setProductId] = useState(products[0]?.productId ?? '');
  const [rating, setRating] = useState<number>(5);
  const [content, setContent] = useState('');

  if (products.length === 0) return null;
  const selected = products.some((p) => p.productId === productId) ? productId : products[0].productId;

  function handleSubmit() {
    void run(async () => {
      await createReview(orderId, {
        productId: selected,
        rating,
        ...(content.trim() ? { content: content.trim() } : {}),
      });
      toast.success('Cảm ơn bạn đã đánh giá sản phẩm!');
      setContent('');
      await queryClient.invalidateQueries({ queryKey: queryKeys.order.reviews(orderId) });
    });
  }

  return (
    <Card padding="md" className={styles.card}>
      <h3 className={styles.title}>Viết đánh giá</h3>
      {products.length > 1 && (
        <label className={styles.field}>
          <span className={styles.label}>Sản phẩm</span>
          <select className={styles.control} value={selected} onChange={(e) => setProductId(e.target.value)}>
            {products.map((p) => (
              <option key={p.productId} value={p.productId}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
      )}
      <label className={styles.field}>
        <span className={styles.label}>Số sao</span>
        <select className={styles.control} value={rating} onChange={(e) => setRating(Number(e.target.value))}>
          {RATINGS.map((r) => (
            <option key={r} value={r}>
              {'★'.repeat(r)} ({r} sao)
            </option>
          ))}
        </select>
      </label>
      <label className={styles.field}>
        <span className={styles.label}>Nhận xét</span>
        <textarea
          className={styles.control}
          rows={3}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Bánh có ngon không, đóng gói thế nào…"
        />
      </label>
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
      <div>
        <Button variant="primary" loading={busy} onClick={handleSubmit}>
          Gửi đánh giá
        </Button>
      </div>
    </Card>
  );
}
