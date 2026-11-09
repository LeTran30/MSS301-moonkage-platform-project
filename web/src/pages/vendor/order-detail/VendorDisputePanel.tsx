import { formatCurrency, formatDateTime } from '@/shared/utils';
import { Badge, Card } from '@/shared/ui';
import {
  DISPUTE_DECISION_LABELS,
  DISPUTE_REASON_LABELS,
  DisputeEvidenceList,
  type Dispute,
} from '@/entities/dispute';
import { DisputeEvidenceForm } from '@/widgets/dispute-evidence-form';
import styles from './VendorDisputePanel.module.css';

interface VendorDisputePanelProps {
  dispute: Dispute;
  onChanged: () => void;
}

/**
 * B2.1 — khiếu nại của người mua trên đơn của Shop (FR-12, AC-49.1).
 *
 * Shop đọc lý do, xem ảnh người mua gửi và gửi bằng chứng của mình. Shop không
 * tự quyết được: quản trị viên phân xử và tiền của đơn được giữ tới lúc đó.
 */
export function VendorDisputePanel({ dispute, onChanged }: VendorDisputePanelProps) {
  const open = dispute.status === 'OPEN';
  return (
    <Card padding="lg" className={styles.panel}>
      <div className={styles.header}>
        <h2 className={styles.title}>Khiếu nại của người mua</h2>
        <Badge tone={open ? 'amber' : 'green'}>
          {open ? 'Chờ quản trị viên phân xử' : 'Đã có phán quyết'}
        </Badge>
      </div>

      <dl className={styles.facts}>
        <dt>Lý do</dt>
        <dd>{DISPUTE_REASON_LABELS[dispute.reason]}</dd>
        <dt>Người mua mô tả</dt>
        <dd>{dispute.description}</dd>
        <dt>Gửi lúc</dt>
        <dd>{formatDateTime(dispute.createdAt)}</dd>
      </dl>

      <section className={styles.section}>
        <h3 className={styles.subtitle}>Bằng chứng của người mua</h3>
        <DisputeEvidenceList
          evidences={dispute.evidences}
          party="BUYER"
          emptyText="Người mua chưa gửi ảnh."
        />
      </section>

      <section className={styles.section}>
        <h3 className={styles.subtitle}>Bằng chứng của Shop</h3>
        <DisputeEvidenceList
          evidences={dispute.evidences}
          party="VENDOR"
          emptyText="Shop chưa gửi bằng chứng nào."
        />
      </section>

      {open ? (
        <>
          <p className={styles.notice}>
            Tiền của đơn được giữ trên sàn tới khi quản trị viên phân xử. Shop không tự đóng được
            khiếu nại.
          </p>
          <DisputeEvidenceForm
            orderId={dispute.orderId}
            title="Gửi bằng chứng của Shop"
            hint="Ảnh đóng gói, phiếu giao hàng hoặc tin nhắn với người mua giúp quản trị viên phân xử đúng."
            onAdded={onChanged}
          />
        </>
      ) : (
        dispute.decision && (
          <div className={styles.verdict}>
            <strong>Phán quyết: {DISPUTE_DECISION_LABELS[dispute.decision]}</strong>
            {dispute.decision !== 'REJECTED' && dispute.refundAmount != null && (
              <span>Hoàn cho người mua: {formatCurrency(dispute.refundAmount)}</span>
            )}
            {dispute.adminNote && <span>Căn cứ: {dispute.adminNote}</span>}
          </div>
        )
      )}
    </Card>
  );
}
