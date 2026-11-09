import { formatCurrency, formatDateTime, shortCode } from '@/shared/utils';
import { Button, Card, EmptyState, toast } from '@/shared/ui';
import { useAction } from '@/shared/lib';
import type { ManualRefundDto } from '@/entities/payment';
import { confirmManualRefund } from '@/features/resolve-disputes';
import styles from './ManualRefundList.module.css';

const REASON_LABELS: Record<NonNullable<ManualRefundDto['reason']>, string> = {
  DISPUTE: 'Phán quyết khiếu nại',
  LATE_PAYMENT: 'Thanh toán đến muộn',
  DUPLICATE_PAYMENT: 'Thanh toán trùng',
  QUOTE_EXPIRED: 'Báo giá đã hết hạn',
};

interface ManualRefundListProps {
  refunds: ManualRefundDto[];
  onSettled: () => void;
}

/**
 * Q5.2 — khoản hoàn tiền VNPay từ chối (AC-49.3).
 *
 * Quản trị viên chuyển khoản tay cho người mua rồi bấm xác nhận:
 * `PATCH /api/refunds/{refundId}` đổi MANUAL_REQUIRED thành SUCCEEDED và sổ
 * tiền của đơn trừ khoản đang giữ.
 */
export function ManualRefundList({ refunds, onSettled }: ManualRefundListProps) {
  const { busy, run, error } = useAction();

  function handleSettle(refund: ManualRefundDto) {
    void run(async () => {
      await confirmManualRefund(refund.refundId);
      toast.success(`Đã ghi nhận hoàn ${formatCurrency(refund.amount)} bằng chuyển khoản tay.`);
      onSettled();
    });
  }

  if (refunds.length === 0) {
    return (
      <EmptyState
        icon="check"
        title="Không có khoản hoàn nào cần xử lý tay"
        description="Khi VNPay từ chối một lệnh hoàn tiền, khoản đó hiện ở đây để chuyển khoản tay."
      />
    );
  }

  return (
    <div className={styles.list}>
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
      {refunds.map((refund) => (
        <Card key={refund.refundId} padding="md" className={styles.row}>
          <div className={styles.info}>
            <strong className={styles.amount}>{formatCurrency(refund.amount)}</strong>
            <span>
              {refund.reason ? REASON_LABELS[refund.reason] : 'Hoàn tiền'}
              {refund.orderId && <> · Đơn #{shortCode(refund.orderId)}</>}
              {refund.createdAt && <> · {formatDateTime(refund.createdAt)}</>}
            </span>
            {refund.error && <span className={styles.gatewayError}>VNPay: {refund.error}</span>}
          </div>
          <Button variant="primary" loading={busy} onClick={() => handleSettle(refund)}>
            Đã chuyển khoản tay
          </Button>
        </Card>
      ))}
    </div>
  );
}
