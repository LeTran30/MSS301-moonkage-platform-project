import { formatCurrency } from '@/shared/utils';
import { Badge, Card } from '@/shared/ui';
import type { Dispute } from '../model/disputeStore';
import styles from './DisputeResolutionCard.module.css';

interface DisputeResolutionCardProps {
  dispute: Dispute;
}

/** Kết quả phán quyết tranh chấp đã có (Q5.1). */
export function DisputeResolutionCard({ dispute }: DisputeResolutionCardProps) {
  const refund = dispute.refundAmount || 0;
  return (
    <Card className={styles.resolvedCard}>
      <div className={styles.resolvedHeader}>
        <div>
          <span className={styles.disputeId}>#{dispute.id}</span>
          <h3 className={styles.orderRef}>Phán quyết tranh chấp đơn #{dispute.orderId}</h3>
        </div>
        <Badge tone="green">✓ Đã giải quyết xong</Badge>
      </div>

      <div className={styles.resolutionDetails}>
        <div className={styles.resRow}>
          <span>Hình thức phán quyết:</span>
          <strong>
            {dispute.decision === 'FULL_REFUND'
              ? 'Hoàn tiền toàn bộ cho người mua'
              : dispute.decision === 'PARTIAL_REFUND'
                ? 'Bồi hoàn một phần cho người mua'
                : 'Bác bỏ khiếu nại của người mua'}
          </strong>
        </div>

        <div className={styles.resRow}>
          <span>Số tiền hoàn trả người mua:</span>
          <strong className={styles.refundVal}>{formatCurrency(refund)}</strong>
        </div>

        <div className={styles.resRow}>
          <span>Số tiền giải ngân cho người bán:</span>
          <strong className={styles.payoutVal}>
            {formatCurrency(dispute.escrowHoldingAmount - refund)}
          </strong>
        </div>

        <div className={styles.resRow}>
          <span>Căn cứ &amp; Nhận định của Admin:</span>
          <p className={styles.adminNote}>{dispute.adminNote}</p>
        </div>
      </div>
    </Card>
  );
}
