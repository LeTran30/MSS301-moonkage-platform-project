import { formatCurrency } from '@/shared/utils';
import { Button, Input, Modal, Radio, Textarea } from '@/shared/ui';
import type { DisputeDecision } from '@/entities/dispute';
import styles from './DisputeResolutionModal.module.css';

interface DisputeResolutionModalProps {
  open: boolean;
  /** Số tiền Escrow đang giữ = trần hoàn tối đa (AC-49.3). */
  maxRefundAllowed: number;
  /** Tổng tiền đơn: "Hoàn toàn bộ" hoàn đúng số này (FULL_REFUND). */
  orderTotal: number;
  decision: DisputeDecision;
  refundAmount: string;
  adminNote: string;
  busy: boolean;
  error?: string | null;
  onDecisionChange: (decision: DisputeDecision) => void;
  onRefundAmountChange: (value: string) => void;
  onAdminNoteChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}

/**
 * Ra phán quyết tranh chấp (Q5.1, Flow 5, FR-49).
 *
 * Quy tắc AC-49.3: số tiền hoàn không được vượt quá số tiền đang giữ.
 */
export function DisputeResolutionModal({
  open,
  maxRefundAllowed,
  orderTotal,
  decision,
  refundAmount,
  adminNote,
  busy,
  error,
  onDecisionChange,
  onRefundAmountChange,
  onAdminNoteChange,
  onClose,
  onSubmit,
}: DisputeResolutionModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Ra phán quyết phân xử khiếu nại"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Hủy
          </Button>
          <Button variant="primary" onClick={onSubmit} loading={busy} disabled={busy}>
            Thi hành phán quyết
          </Button>
        </>
      }
    >
      <div className={styles.modalBody}>
        <div className={styles.escrowSummary}>
          <span>Số tiền Moonkage đang giữ:</span>
          <strong>{formatCurrency(maxRefundAllowed)}</strong>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label} id="decision-label">
            Lựa chọn phương án phân xử *
          </label>
          <div className={styles.radioOptions} role="radiogroup" aria-labelledby="decision-label">
            <label className={styles.radioItem}>
              <Radio
                name="decision"
                checked={decision === 'PARTIAL_REFUND'}
                onChange={() => onDecisionChange('PARTIAL_REFUND')}
                inputClassName={styles.radioInput}
                aria-label="Hoàn tiền một phần"
              />
              <div>
                <strong>Hoàn tiền một phần</strong>
                <p>Người mua nhận lại một khoản bồi thường; Shop nhận phần còn lại.</p>
              </div>
            </label>

            <label className={styles.radioItem}>
              <Radio
                name="decision"
                checked={decision === 'FULL_REFUND'}
                onChange={() => onDecisionChange('FULL_REFUND')}
                inputClassName={styles.radioInput}
                aria-label="Hoàn toàn bộ tiền đơn"
              />
              <div>
                <strong>Hoàn toàn bộ tiền đơn ({formatCurrency(orderTotal)})</strong>
                <p>Lỗi thuộc về Shop và hàng không dùng được.</p>
              </div>
            </label>

            <label className={styles.radioItem}>
              <Radio
                name="decision"
                checked={decision === 'REJECTED'}
                onChange={() => onDecisionChange('REJECTED')}
                inputClassName={styles.radioInput}
                aria-label="Bác khiếu nại, giải ngân toàn bộ cho người bán"
              />
              <div>
                <strong>Bác khiếu nại (tiền về Shop)</strong>
                <p>Bằng chứng không cho thấy lỗi của Shop.</p>
              </div>
            </label>
          </div>
        </div>

        {decision === 'PARTIAL_REFUND' && (
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="refund-amount">
              Số tiền hoàn trả cho người mua (VNĐ) *
            </label>
            <Input
              id="refund-amount"
              type="number"
              value={refundAmount}
              min={1}
              max={Math.min(maxRefundAllowed, orderTotal - 1)}
              onChange={(e) => onRefundAmountChange(e.target.value)}
              placeholder={`Nhỏ hơn ${formatCurrency(orderTotal)}`}
            />
            <span className={styles.hint}>
              Shop nhận phần còn lại:{' '}
              <strong>
                {formatCurrency(Math.max(0, maxRefundAllowed - Number(refundAmount)))}
              </strong>
            </span>
          </div>
        )}

        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="decision-reason">
            Căn cứ &amp; Lý giải phán quyết (Gửi cả 2 bên) *
          </label>
          <Textarea
            id="decision-reason"
            rows={3}
            value={adminNote}
            maxLength={2000}
            onChange={(e) => onAdminNoteChange(e.target.value)}
            placeholder="Nêu rõ điều khoản, căn cứ hình ảnh và trách nhiệm các bên..."
          />
        </div>

        {error && (
          <p className={styles.formError} role="alert">
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
}
