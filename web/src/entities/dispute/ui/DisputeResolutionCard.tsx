import { formatCurrency, formatDateTime, shortCode } from '@/shared/utils';
import { Badge, Card } from '@/shared/ui';
import { DISPUTE_DECISION_LABELS, DISPUTE_REASON_LABELS, type Dispute } from '../model/dispute';
import styles from './DisputeResolutionCard.module.css';

interface DisputeResolutionCardProps {
  dispute: Dispute;
}

/**
 * Một khiếu nại đã phân xử (Q5.0, FR-49).
 *
 * Số hoàn là số máy chủ ghi trong phán quyết; phần còn lại của đơn thuộc về Shop.
 */
export function DisputeResolutionCard({ dispute }: DisputeResolutionCardProps) {
  const refund = dispute.refundAmount ?? 0;
  return (
    <Card className={styles.resolvedCard}>
      <div className={styles.resolvedHeader}>
        <div>
          <span className={styles.disputeId}>Khiếu nại #{shortCode(dispute.id)}</span>
          <h3 className={styles.orderRef}>
            Đơn #{shortCode(dispute.orderId)}
            {dispute.vendorName && <> · {dispute.vendorName}</>}
          </h3>
        </div>
        <Badge tone="green">Đã phân xử</Badge>
      </div>

      <div className={styles.resolutionDetails}>
        <div className={styles.resRow}>
          <span>Người mua khiếu nại</span>
          <strong>
            {dispute.buyerName || 'Người mua'} · {DISPUTE_REASON_LABELS[dispute.reason]}
          </strong>
        </div>
        <div className={styles.resRow}>
          <span>Phán quyết</span>
          <strong>{dispute.decision ? DISPUTE_DECISION_LABELS[dispute.decision] : '—'}</strong>
        </div>
        <div className={styles.resRow}>
          <span>Hoàn cho người mua</span>
          <strong className={styles.refundVal}>{formatCurrency(refund)}</strong>
        </div>
        <div className={styles.resRow}>
          <span>Phần còn lại của đơn về Shop</span>
          <strong className={styles.payoutVal}>
            {formatCurrency(Math.max(0, dispute.orderTotalAmount - refund))}
          </strong>
        </div>
        {dispute.resolvedAt && (
          <div className={styles.resRow}>
            <span>Phân xử lúc</span>
            <strong>{formatDateTime(dispute.resolvedAt)}</strong>
          </div>
        )}
        {dispute.adminNote && <p className={styles.adminNote}>Căn cứ: {dispute.adminNote}</p>}
      </div>
    </Card>
  );
}
