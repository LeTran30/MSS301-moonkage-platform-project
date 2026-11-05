import { formatCurrency } from '@/shared/utils';
import { Button, Card } from '@/shared/ui';
import type { Order } from '../model/types';
import styles from './OrderPaymentSummary.module.css';

interface OrderPaymentSummaryProps {
  order: Order;
  /** Đơn số lượng lớn thì có tiền cọc và phần còn lại (FR-22). */
  isBulk: boolean;
  busy: boolean;
  /** Mở trang thanh toán phần còn lại; bỏ trống khi không cần. */
  onPayRemainder?: () => void;
}

/** Sổ tiền giao dịch của đơn hàng. */
export function OrderPaymentSummary({
  order,
  isBulk,
  busy,
  onPayRemainder,
}: OrderPaymentSummaryProps) {
  return (
    <Card padding="md" className={styles.card}>
      <h3 className={styles.cardTitle}>Sổ tiền giao dịch</h3>
      <div className={styles.moneyList}>
        <div className={styles.moneyRow}>
          <span>Tổng giá trị đơn hàng:</span>
          <strong>{formatCurrency(order.total)}</strong>
        </div>
        {isBulk ? (
          <>
            <div className={styles.moneyRow}>
              <span>Tiền cọc đã chuyển qua VNPay:</span>
              <strong className={styles.greenText}>
                {formatCurrency(order.depositAmount || 0)} (Đã ký quỹ)
              </strong>
            </div>
            <div className={styles.moneyRow}>
              <span>Phần còn lại thanh toán khi nhận bánh:</span>
              <strong>{formatCurrency(order.remainingAmount || 0)}</strong>
            </div>
            {!order.remainingPaid && onPayRemainder && (
              <div className={styles.payRemainderRow}>
                <Button
                  variant="primary"
                  loading={busy}
                  iconRight="arrowRight"
                  onClick={onPayRemainder}
                >
                  Thanh toán phần còn lại
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className={styles.moneyRow}>
            <span>Thanh toán toàn bộ qua VNPay:</span>
            <strong className={styles.greenText}>{formatCurrency(order.total)}</strong>
          </div>
        )}
      </div>
    </Card>
  );
}
