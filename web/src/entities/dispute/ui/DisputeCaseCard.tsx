import { formatCurrency, formatDateTime, shortCode } from '@/shared/utils';
import { Badge, Button, Card } from '@/shared/ui';
import { DISPUTE_REASON_LABELS, type Dispute } from '../model/dispute';
import { DisputeEvidenceList } from './DisputeEvidenceList';
import styles from './DisputeCaseCard.module.css';

interface DisputeCaseCardProps {
  dispute: Dispute;
  /** Mở màn hình ra phán quyết (Q5.1). */
  onResolve: () => void;
}

/**
 * Hồ sơ khiếu nại đang chờ phân xử (Q5.0, FR-49).
 *
 * Hiển thị hai bên (người mua và Shop), tiền đang giữ trong Escrow và bằng
 * chứng mỗi bên đã gửi.
 */
export function DisputeCaseCard({ dispute, onResolve }: DisputeCaseCardProps) {
  return (
    <Card className={styles.disputeCard}>
      <div className={styles.cardHeader}>
        <div className={styles.titleMeta}>
          <span className={styles.disputeId}>Khiếu nại #{shortCode(dispute.id)}</span>
          <h3 className={styles.orderRef}>Đơn #{shortCode(dispute.orderId)}</h3>
          <Badge tone="red">Chờ phân xử</Badge>
        </div>
        <div className={styles.escrowBox}>
          <span className={styles.escrowLabel}>Tiền đang giữ:</span>
          <strong className={styles.escrowVal}>
            {formatCurrency(dispute.escrowHoldingAmount)}
          </strong>
          <span className={styles.escrowSub}>
            Giá trị đơn: {formatCurrency(dispute.orderTotalAmount)}
          </span>
        </div>
      </div>

      <div className={styles.disputeGrid}>
        {/* Buyer claim */}
        <div className={styles.partyBox}>
          <div className={styles.partyHeader}>
            <span className={styles.partyBadge}>Người mua</span>
            <strong>{dispute.buyerName}</strong>
          </div>
          <p className={styles.reasonTag}>
            Lý do: <strong>{DISPUTE_REASON_LABELS[dispute.reason]}</strong>
          </p>
          <p className={styles.statementText}>"{dispute.description}"</p>
          <DisputeEvidenceList
            evidences={dispute.evidences}
            party="BUYER"
            emptyText="Người mua không gửi ảnh."
          />
          <span className={styles.timeTag}>Gửi lúc: {formatDateTime(dispute.createdAt)}</span>
        </div>

        {/* Vendor response */}
        <div className={styles.partyBox}>
          <div className={styles.partyHeader}>
            <span className={styles.partyBadgeVendor}>Shop</span>
            <strong>{dispute.vendorName}</strong>
          </div>
          <DisputeEvidenceList
            evidences={dispute.evidences}
            party="VENDOR"
            emptyText="Shop chưa gửi bằng chứng."
          />
        </div>
      </div>

      <div className={styles.cardFooter}>
        <div className={styles.deadlineInfo}>
          Tiền của đơn chỉ được chuyển cho Shop hoặc hoàn cho người mua sau phán quyết.
        </div>
        <Button variant="primary" size="md" onClick={onResolve}>
          Ra phán quyết
        </Button>
      </div>
    </Card>
  );
}
