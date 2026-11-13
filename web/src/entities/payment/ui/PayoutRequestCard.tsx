import { formatCurrency } from '@/shared/utils';
import { Badge, Button, Card, Icon } from '@/shared/ui';
import { payoutPurposeLabel, type PayoutRequest } from '../model/payoutRequest';
import styles from './PayoutRequestCard.module.css';

interface PayoutRequestCardProps {
  request: PayoutRequest;
  /** Tên Shop hiển thị (đã tra cứu từ `GET /api/vendors`). */
  vendorName: string;
  /** Mở xác nhận phê duyệt lệnh giải ngân (Q4.1). */
  onApprove: (request: PayoutRequest) => void;
}

/** Thẻ lệnh giải ngân chờ quản trị duyệt (Q4.1). */
export function PayoutRequestCard({ request, vendorName, onApprove }: PayoutRequestCardProps) {
  return (
    <Card className={styles.payoutCard}>
      <div className={styles.payoutHeader}>
        <div>
          <span className={styles.poId}>#{request.requestId}</span>
          <h3 className={styles.poVendor}>{vendorName || request.vendorId || 'Shop chưa xác định'}</h3>
          <span className={styles.poBank}>
            <Icon name="bank" size={14} /> Mã đơn liên kết: #{request.orderId}
          </span>
        </div>
        <div className={styles.amountCol}>
          <strong className={styles.poAmount}>
            {formatCurrency(request.approvedAmount ?? request.amount)}
          </strong>
          <Badge
            tone={
              request.status === 'APPROVED'
                ? 'green'
                : request.status === 'REJECTED'
                  ? 'red'
                  : 'gold'
            }
          >
            {request.status === 'APPROVED'
              ? 'Đã giải ngân'
              : request.status === 'REJECTED'
                ? 'Đã bác'
                : 'Chờ Admin duyệt'}
          </Badge>
        </div>
      </div>

      <div className={styles.poBody}>
        <div className={styles.poItem}>
          <span>Mục đích:</span>
          <strong>{payoutPurposeLabel(request.purpose)}</strong>
        </div>
        <div className={styles.poItem}>
          <span>Số tiền Shop yêu cầu:</span>
          <strong>{formatCurrency(request.amount)}</strong>
        </div>
        <div className={styles.poItem}>
          <span>Tiền cọc còn giữ:</span>
          <strong>{formatCurrency(request.approvalCapacity)}</strong>
        </div>
        <div className={styles.poItem}>
          <span>Đã giải ngân:</span>
          <strong>{formatCurrency(request.disbursed)}</strong>
        </div>
        <div className={styles.poItem}>
          <span>Đang chờ duyệt:</span>
          <strong>{formatCurrency(request.pendingDisbursement)}</strong>
        </div>
        <div className={styles.poItem}>
          <span>Thời gian yêu cầu:</span>
          <span>{request.createdAt ? new Date(request.createdAt).toLocaleString('vi-VN') : '—'}</span>
        </div>
        {request.reason && (
          <p className={styles.poNote}>
            <Icon name="pen" size={14} /> Ghi chú: {request.reason}
          </p>
        )}
      </div>

      <div className={styles.poActions}>
        {request.status === 'PENDING' && (
          <Button variant="primary" size="sm" onClick={() => onApprove(request)} iconLeft="check">
            Xét duyệt
          </Button>
        )}
      </div>
    </Card>
  );
}
