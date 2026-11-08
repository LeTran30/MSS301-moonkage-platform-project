import { formatCurrency, formatDateTime } from '@/shared/utils';
import { Badge, Button, Card } from '@/shared/ui';
import { DISPUTE_REASON_LABELS, type Dispute } from '../model/disputeStore';
import styles from './DisputeCaseCard.module.css';

interface DisputeCaseCardProps {
  dispute: Dispute;
  /** Mở màn hình ra phán quyết (Q5.1). */
  onResolve: () => void;
}

/**
 * Hồ sơ khiếu nại đang chờ phân xử (Q5.0, FR-49).
 *
 * Hiển thị hai bên (người mua và xưởng), tiền đang giữ trong Escrow và bằng
 * chứng đính kèm.
 */
export function DisputeCaseCard({ dispute, onResolve }: DisputeCaseCardProps) {
  return (
    <Card className={styles.disputeCard}>
      <div className={styles.cardHeader}>
        <div className={styles.titleMeta}>
          <span className={styles.disputeId}>#{dispute.id}</span>
          <h3 className={styles.orderRef}>Đơn hàng liên kết: #{dispute.orderId}</h3>
          <Badge tone="red">Đang chờ Admin phân xử</Badge>
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
          <div className={styles.evidenceImages}>
            {dispute.images.map((url, i) => (
              <img
                key={i}
                src={url}
                alt="Bằng chứng khiếu nại"
                className={styles.evidenceThumb}
                loading="lazy"
                decoding="async"
              />
            ))}
          </div>
          <span className={styles.timeTag}>Gửi lúc: {formatDateTime(dispute.createdAt)}</span>
        </div>

        {/* Vendor response */}
        <div className={styles.partyBox}>
          <div className={styles.partyHeader}>
            <span className={styles.partyBadgeVendor}>Người bán / Xưởng</span>
            <strong>{dispute.vendorName}</strong>
          </div>
          {dispute.vendorResponse ? (
            <>
              <p className={styles.reasonTag}>Phản hồi giải trình:</p>
              <p className={styles.statementText}>"{dispute.vendorResponse.comment}"</p>
              <span className={styles.timeTag}>
                Gửi lúc: {formatDateTime(dispute.vendorResponse.submittedAt)}
              </span>
            </>
          ) : (
            <p className={styles.noResponse}>Xưởng chưa phản hồi trong thời hạn 24h.</p>
          )}
        </div>
      </div>

      <div className={styles.cardFooter}>
        <div className={styles.deadlineInfo}>
          ⏳ Thời hạn phân xử: Admin cần ra quyết định cuối cùng để giải ngân ký quỹ.
        </div>
        <Button variant="primary" size="md" onClick={onResolve}>
          Ra phán quyết giải quyết tranh chấp
        </Button>
      </div>
    </Card>
  );
}
