import { formatCurrency } from '@/shared/utils';
import { Button, Modal } from '@/shared/ui';
import type { LedgerDto } from '@/entities/payment';
import styles from './payOutUi.module.css';

interface PayoutConfirmModalProps {
  open: boolean;
  ledger: LedgerDto | null;
  /** Tên Shop hiển thị. */
  vendorName: string;
  busy: boolean;
  onClose: () => void;
  onSubmit: () => void;
}

/** Confirm the one-time final payout of the balance still held for an order (FR-48). */
export function PayoutConfirmModal({
  open,
  ledger,
  vendorName,
  busy,
  onClose,
  onSubmit,
}: PayoutConfirmModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Xác nhận payout cuối đơn"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Hủy
          </Button>
          <Button variant="primary" loading={busy} onClick={onSubmit}>
            Xác nhận payout
          </Button>
        </>
      }
    >
      <div className={styles.modalBody}>
        <p>
          Thao tác này chuyển toàn bộ số dư còn giữ sang trạng thái đã payout và chỉ được thực hiện
          một lần khi đơn đã hết thời hạn khiếu nại, không còn hoàn tiền hoặc giải ngân chờ xử lý.
        </p>
        <div className={styles.confirmBox}>
          <p>
            Đơn vị nhận: <strong>{ledger ? vendorName || ledger.vendorId : ''}</strong>
          </p>
          <p>
            Đơn hàng: <strong>{ledger?.orderId ?? ''}</strong>
          </p>
          <p>
            Số tiền payout:{' '}
            <strong className={styles.goldText}>{formatCurrency(ledger?.held ?? 0)}</strong>
          </p>
        </div>
      </div>
    </Modal>
  );
}
