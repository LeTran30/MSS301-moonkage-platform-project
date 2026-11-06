import { Button, Input, Modal } from '@/shared/ui';
import { formatCurrency } from '@/shared/utils';
import {
  DISBURSEMENT_PURPOSES,
  payoutPurposeLabel,
  type DisbursementPurpose,
  type LedgerDto,
} from '@/entities/payment';
import styles from './requestDisbursementUi.module.css';

interface DisbursementRequestModalProps {
  open: boolean;
  /** Các dòng sổ quỹ đủ điều kiện giải ngân. */
  payableLedgers: LedgerDto[];
  /** Tổng số tiền khả dụng để rút. */
  totalAvailable: number;
  /** Đơn hàng đang được chọn. */
  orderId: string;
  /** Số tiền đang nhập. */
  amount: string;
  /** Mục đích giải ngân (`DisbursementPurpose` của payment-service). */
  purpose: DisbursementPurpose;
  /** Lỗi do request thất bại (đã được chuyển vào tầng trên xử lý). */
  error?: string | null;
  busy?: boolean;
  onOrderIdChange: (orderId: string, amount: string) => void;
  onAmountChange: (amount: string) => void;
  onPurposeChange: (purpose: DisbursementPurpose) => void;
  onClose: () => void;
  onSubmit: () => void;
}

/**
 * FR-41: yêu cầu rút tiền về tài khoản ngân hàng của Shop.
 *
 * Modal nằm ở tầng `features/request-disbursement/ui` vì nó là hành động
 * tương tác có mutation (POST `/api/ledgers/{orderId}/disbursements`).
 * Component được điều khiển hoàn toàn từ tầng trên (controlled) để không
 * lưu trùng state giữa page và modal.
 */
export function DisbursementRequestModal({
  open,
  payableLedgers,
  totalAvailable,
  orderId,
  amount,
  purpose,
  error,
  busy = false,
  onOrderIdChange,
  onAmountChange,
  onPurposeChange,
  onClose,
  onSubmit,
}: DisbursementRequestModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Yêu cầu rút tiền về tài khoản ngân hàng"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Hủy
          </Button>
          <Button variant="primary" loading={busy} onClick={onSubmit}>
            Xác nhận rút tiền
          </Button>
        </>
      }
    >
      <div className={styles.modalBody}>
        <p className={styles.modalSub}>
          Tiền sẽ được kế toán sàn Moonkage đối soát và lệnh chuyển khoản được thực hiện trong 24 giờ làm việc.
        </p>

        <div className={styles.formGroup}>
          <label className={styles.label}>Đơn hàng cần giải ngân *</label>
          <select
            className={styles.select}
            value={orderId}
            onChange={(e) => {
              const next = payableLedgers.find((l) => l.orderId === e.target.value);
              onOrderIdChange(e.target.value, String(next?.toReceive ?? 0));
            }}
          >
            <option value="">— Chọn đơn hàng —</option>
            {payableLedgers.map((l) => (
              <option key={l.orderId} value={l.orderId}>
                #{l.orderId} · {formatCurrency(l.toReceive ?? 0)}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Số tiền muốn rút (VNĐ) *</label>
          <Input
            type="number"
            value={amount}
            onChange={(e) => onAmountChange(e.target.value)}
            placeholder="Nhập số tiền..."
          />
          <span className={styles.inputHint}>
            Tối đa có thể rút: <strong>{formatCurrency(totalAvailable)}</strong>
          </span>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Mục đích sử dụng tiền *</label>
          <select
            className={styles.select}
            value={purpose}
            onChange={(e) => onPurposeChange(e.target.value as DisbursementPurpose)}
          >
            {DISBURSEMENT_PURPOSES.map((p) => (
              <option key={p} value={p}>
                {payoutPurposeLabel(p)}
              </option>
            ))}
          </select>
          <span className={styles.inputHint}>
            Nền tảng xét duyệt và chỉ giải ngân đúng số tiền cần, không vượt quá số tiền cọc đang giữ.
          </span>
        </div>

        {error && (
          <p className={styles.pageError} role="alert">
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
}
