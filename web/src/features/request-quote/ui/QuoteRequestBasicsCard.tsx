import { Card, Input } from '@/shared/ui';
import styles from './QuoteRequestCards.module.css';

interface QuoteRequestBasicsCardProps {
  quantity: string;
  onQuantityChange: (value: string) => void;
  deliveryDeadline: string;
  onDeliveryDeadlineChange: (value: string) => void;
  budget: string;
  onBudgetChange: (value: string) => void;
  /** Lỗi theo tên trường, do form cha sở hữu (FR-16). */
  errors?: Partial<Record<'quantity' | 'deliveryDeadline', string>>;
}

/** Step 1 of the quote request form: what the buyer wants to order. */
export function QuoteRequestBasicsCard({
  quantity,
  onQuantityChange,
  deliveryDeadline,
  onDeliveryDeadlineChange,
  budget,
  onBudgetChange,
  errors,
}: QuoteRequestBasicsCardProps) {
  return (
    <Card padding="lg" className={styles.card}>
      <h3 className={styles.cardTitle}>1. Thông tin đơn hàng dự kiến</h3>

      <div className={styles.grid2}>
        <Input
          label="Số lượng hộp cần đặt"
          type="number"
          min="20"
          value={quantity}
          onChange={(e) => onQuantityChange(e.target.value)}
          required
          error={errors?.quantity}
          hint={errors?.quantity ? undefined : 'Tối thiểu từ 20 hộp để các xưởng nhận báo giá sỉ'}
        />
        <Input
          label="Hạn giao hàng mong muốn"
          type="date"
          value={deliveryDeadline}
          onChange={(e) => onDeliveryDeadlineChange(e.target.value)}
          required
          error={errors?.deliveryDeadline}
        />
      </div>

      <Input
        label="Ngân sách dự kiến mỗi hộp (VND)"
        type="number"
        value={budget}
        onChange={(e) => onBudgetChange(e.target.value)}
        hint="Để các xưởng cân đối nguyên liệu và mẫu hộp phù hợp nhất"
      />
    </Card>
  );
}
