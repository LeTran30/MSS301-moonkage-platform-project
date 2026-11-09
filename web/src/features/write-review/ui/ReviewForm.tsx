import { useState } from 'react';
import { Button, Card, Select, Textarea, toast } from '@/shared/ui';
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
  const selected = products.some((p) => p.productId === productId)
    ? productId
    : products[0].productId;

  function handleSubmit() {
    void run(async () => {
      await createReview(orderId, {
        productId: selected,
        rating,
        ...(content.trim() ? { content: content.trim() } : {}),
      });
      toast.success('Cảm ơn bạn đã đánh giá sản phẩm!');
      setContent('');
      await queryClient.invalidateQueries({
        queryKey: queryKeys.order.reviews(orderId),
      });
    });
  }

  return (
    <Card padding="md" className={styles.card}>
      <h3 className={styles.title}>Viết đánh giá</h3>
      {products.length > 1 && (
        <Select
          label="Sản phẩm"
          options={products.map((p) => ({ value: p.productId, label: p.name }))}
          value={selected}
          onChange={(v) => setProductId(v)}
        />
      )}
      <Select
        label="Số sao"
        options={RATINGS.map((r) => ({ value: String(r), label: `${r} sao` }))}
        value={String(rating)}
        onChange={(v) => setRating(Number(v))}
      />
      <Textarea
        label="Nhận xét"
        rows={3}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Ví dụ: Bánh có vị đậu xanh ngọt, đóng gói kín, giao đúng hẹn 15/9."
      />
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
