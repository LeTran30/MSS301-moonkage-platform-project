import { formatCurrency } from '@/shared/utils';
import { Button, Card, Icon } from '@/shared/ui';
import type { ShopCartGroup } from '../model/cartStore';
import styles from './CartSummary.module.css';

interface CartSummaryProps {
  groups: ShopCartGroup[];
  subtotal: number;
  totalShipping: number;
  total: number;
  busy: boolean;
  error?: string | null;
  /** Chuyển sang cổng VNPay (M4.2, Flow 1). */
  onProceed: () => void;
}

/** Tóm tắt đơn hàng và tổng tiền của giỏ hàng (FR-08). */
export function CartSummary({
  groups,
  subtotal,
  totalShipping,
  total,
  busy,
  error,
  onProceed,
}: CartSummaryProps) {
  return (
    <Card padding="md" className={styles.summaryCard}>
      <h3 className={styles.summaryTitle}>Đơn hàng thanh toán</h3>
      <div className={styles.shopOverview}>
        {groups.map((g) => (
          <div key={g.vendorId} className={styles.shopOverviewRow}>
            <div className={styles.shopOverviewTitle}>
              <Icon name="store" size={14} /> {g.vendorName}
            </div>
            <span className={styles.shopOverviewCount}>
              {g.items.reduce((s, it) => s + it.quantity, 0)} hộp · Phí giao{' '}
              {formatCurrency(g.shippingFee)}
            </span>
          </div>
        ))}
      </div>

      <div className={styles.divider} />

      <div className={styles.amountList}>
        <div className={styles.amountRow}>
          <span>Tổng tiền hàng:</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        <div className={styles.amountRow}>
          <span>Tổng phí vận chuyển:</span>
          <span>{formatCurrency(totalShipping)}</span>
        </div>
        <div className={styles.divider} />
        <div className={styles.finalRow}>
          <span>Tổng cộng:</span>
          <span className={styles.finalPrice}>{formatCurrency(total)}</span>
        </div>
      </div>

      {error && (
        <p className={styles.checkoutError} role="alert">
          {error}
        </p>
      )}

      <Button
        variant="primary"
        size="lg"
        block
        iconRight={busy ? undefined : 'arrowRight'}
        loading={busy}
        disabled={busy}
        onClick={onProceed}
      >
        {busy ? 'Đang khởi tạo đơn hàng...' : 'Thanh toán qua VNPay'}
      </Button>
    </Card>
  );
}
