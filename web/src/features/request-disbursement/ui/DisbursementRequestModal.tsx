import { Button, Input, Modal, Select } from '@/shared/ui';
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
  /** Các dòng sổ có tiền cọc còn đủ điều kiện giải ngân. */
  eligibleLedgers: LedgerDto[];
  /** Tiền cọc còn có thể yêu cầu trên đúng đơn đang chọn. */
  selectedAvailable: number;
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
 * FR-41: yêu cầu giải ngân sớm một phần tiền cọc của đơn đặt hàng.
 *
 * Modal nằm ở tầng `features/request-disbursement/ui` vì nó là hành động
 * tương tác có mutation (POST `/api/ledgers/{orderId}/disbursements`).
 * Component được điều khiển hoàn toàn từ tầng trên (controlled) để không
 * lưu trùng state giữa page và modal.
 */
export function DisbursementRequestModal({
  open,
  eligibleLedgers,
  selectedAvailable,
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
      title="Yêu cầu giải ngân tiền cọc"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Hủy
          </Button>
          <Button variant="primary" loading={busy} onClick={onSubmit}>
            Gửi yêu cầu giải ngân
          </Button>
        </>
      }
    >
      <div className={styles.modalBody}>
        <p className={styles.modalSub}>
          Moonkage sẽ xét duyệt và ghi sổ phần tiền cọc được giải ngân. Thao tác này không phải
          payout phần tiền còn lại của đơn.
        </p>

        <div className={styles.formGroup}>
          <Select
            label="Đơn hàng cần giải ngân"
            required
            placeholder="— Chọn đơn hàng —"
            options={eligibleLedgers.map((l) => ({
              value: l.orderId,
              label: `#${l.orderId} · còn ${formatCurrency(l.remainingDisbursable ?? 0)}`,
            }))}
            value={orderId}
            onChange={(v) => {
              const next = eligibleLedgers.find((l) => l.orderId === v);
              onOrderIdChange(v, String(next?.remainingDisbursable ?? 0));
            }}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="disbursement-amount">
            Số tiền muốn giải ngân (VNĐ) *
          </label>
          <Input
            id="disbursement-amount"
            type="number"
            value={amount}
            onChange={(e) => onAmountChange(e.target.value)}
            placeholder="Ví dụ: 500000"
            min={1}
            max={selectedAvailable}
          />
          <span className={styles.inputHint}>
            Tối đa của đơn đang chọn: <strong>{formatCurrency(selectedAvailable)}</strong>
          </span>
        </div>

        <div className={styles.formGroup}>
          <Select
            label="Mục đích sử dụng tiền"
            required
            options={DISBURSEMENT_PURPOSES.map((p) => ({ value: p, label: payoutPurposeLabel(p) }))}
            value={purpose}
            onChange={(v) => onPurposeChange(v as DisbursementPurpose)}
          />
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
