import { formatCurrency } from '@/shared/utils';
import { Button, Modal } from '@/shared/ui';
import { payoutPurposeLabel, type PayoutRequest } from '@/entities/payment';
import styles from './payOutUi.module.css';

interface PayoutConfirmModalProps {
  open: boolean;
  request: PayoutRequest | null;
  /** Tên Shop hiển thị. */
  vendorName: string;
  busy: boolean;
  onClose: () => void;
  onSubmit: () => void;
}

/** Xác nhận phê duyệt lệnh giải ngân (Q4.1). */
export function PayoutConfirmModal({
  open,
  request,
  vendorName,
  busy,
  onClose,
  onSubmit,
}: PayoutConfirmModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Xác nhận phê duyệt lệnh giải ngân"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Hủy
          </Button>
          <Button variant="primary" loading={busy} onClick={onSubmit}>
            Xác nhận &amp; Giải ngân
          </Button>
        </>
      }
    >
      <div className={styles.modalBody}>
        <p>
          Hệ thống sẽ ghi nhận lệnh chuyển tiền từ tài khoản Escrow của Moonkage sang tài khoản
          ngân hàng của xưởng:
        </p>
        <div className={styles.confirmBox}>
          <p>
            Đơn vị nhận: <strong>{request ? vendorName || request.vendorId : ''}</strong>
          </p>
          <p>
            Số tiền thực chuyển:{' '}
            <strong className={styles.goldText}>{formatCurrency(request?.amount ?? 0)}</strong>
          </p>
          <p>
            Lý do:{' '}
            <strong>{request?.reason ?? payoutPurposeLabel(request?.purpose ?? '')}</strong>
          </p>
        </div>
      </div>
    </Modal>
  );
}
