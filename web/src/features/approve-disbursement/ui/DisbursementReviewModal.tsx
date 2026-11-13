import { useState } from 'react';
import { payoutPurposeLabel, type PayoutRequest } from '@/entities/payment';
import { formatCurrency } from '@/shared/utils';
import { Button, Input, Modal, Radio, Textarea } from '@/shared/ui';
import type { ReviewDisbursementPayload } from '../api/approveDisbursementApi';
import styles from './DisbursementReviewModal.module.css';

type Decision = 'APPROVED' | 'REJECTED';
type ApprovalMode = 'FULL' | 'PARTIAL';

interface DisbursementReviewModalProps {
  open: boolean;
  request: PayoutRequest | null;
  vendorName: string;
  busy?: boolean;
  onClose: () => void;
  onSubmit: (payload: ReviewDisbursementPayload) => void;
}

/** FR-47: admin approves all/part of a deposit request, or rejects it with a reason. */
export function DisbursementReviewModal({
  open,
  request,
  vendorName,
  busy = false,
  onClose,
  onSubmit,
}: DisbursementReviewModalProps) {
  const [decision, setDecision] = useState<Decision>('APPROVED');
  const [approvalMode, setApprovalMode] = useState<ApprovalMode>('FULL');
  const [approvedAmount, setApprovedAmount] = useState(() =>
    String(Math.min(request?.amount ?? 0, request?.approvalCapacity ?? 0)),
  );
  const [reason, setReason] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  function handleSubmit() {
    if (!request) return;
    if (decision === 'REJECTED') {
      const normalizedReason = reason.trim();
      if (!normalizedReason) {
        setValidationError('Vui lòng nhập lý do từ chối.');
        return;
      }
      setValidationError(null);
      onSubmit({ status: 'REJECTED', reason: normalizedReason });
      return;
    }

    const amount = approvalMode === 'FULL' ? request.amount : Number(approvedAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setValidationError('Số tiền duyệt phải lớn hơn 0.');
      return;
    }
    if (amount > request.amount) {
      setValidationError('Số tiền duyệt không được vượt số tiền Shop yêu cầu.');
      return;
    }
    if (amount > request.approvalCapacity) {
      setValidationError('Số tiền duyệt vượt phần tiền cọc còn giữ của đơn.');
      return;
    }
    setValidationError(null);
    onSubmit({
      status: 'APPROVED',
      approvedAmount: approvalMode === 'FULL' ? null : amount,
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Xét duyệt yêu cầu giải ngân cọc"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Hủy
          </Button>
          <Button
            variant={decision === 'REJECTED' ? 'danger' : 'primary'}
            loading={busy}
            onClick={handleSubmit}
          >
            {decision === 'REJECTED' ? 'Xác nhận từ chối' : 'Xác nhận duyệt'}
          </Button>
        </>
      }
    >
      {request && (
        <div className={styles.body}>
          <div className={styles.summary}>
            <div>
              <span>Shop</span>
              <strong>{vendorName || request.vendorId}</strong>
            </div>
            <div>
              <span>Đơn hàng</span>
              <strong>#{request.orderId}</strong>
            </div>
            <div>
              <span>Số tiền xin giải ngân</span>
              <strong>{formatCurrency(request.amount)}</strong>
            </div>
            <div>
              <span>Mục đích</span>
              <strong>{payoutPurposeLabel(request.purpose)}</strong>
            </div>
            <div>
              <span>Tổng tiền cọc đã thu</span>
              <strong>{formatCurrency(request.depositCollected)}</strong>
            </div>
            <div>
              <span>Tiền cọc còn giữ</span>
              <strong>{formatCurrency(request.approvalCapacity)}</strong>
            </div>
            <div>
              <span>Đã giải ngân</span>
              <strong>{formatCurrency(request.disbursed)}</strong>
            </div>
            <div>
              <span>Đang chờ duyệt</span>
              <strong>{formatCurrency(request.pendingDisbursement)}</strong>
            </div>
          </div>

          <fieldset className={styles.fieldset}>
            <legend>Quyết định</legend>
            <Radio
              name="disbursement-decision"
              label="Duyệt yêu cầu"
              checked={decision === 'APPROVED'}
              onChange={() => {
                setDecision('APPROVED');
                setValidationError(null);
              }}
            />
            <Radio
              name="disbursement-decision"
              label="Từ chối yêu cầu"
              checked={decision === 'REJECTED'}
              onChange={() => {
                setDecision('REJECTED');
                setValidationError(null);
              }}
            />
          </fieldset>

          {decision === 'APPROVED' ? (
            <fieldset className={styles.fieldset}>
              <legend>Số tiền được duyệt</legend>
              <Radio
                name="approval-mode"
                label={`Duyệt toàn bộ (${formatCurrency(request.amount)})`}
                checked={approvalMode === 'FULL'}
                onChange={() => {
                  setApprovalMode('FULL');
                  setValidationError(null);
                }}
              />
              <Radio
                name="approval-mode"
                label="Duyệt một phần"
                checked={approvalMode === 'PARTIAL'}
                onChange={() => {
                  setApprovalMode('PARTIAL');
                  setValidationError(null);
                }}
              />
              {approvalMode === 'PARTIAL' && (
                <Input
                  label="Số tiền duyệt (VNĐ)"
                  type="number"
                  min={1}
                  max={Math.min(request.amount, request.approvalCapacity)}
                  value={approvedAmount}
                  onChange={(event) => setApprovedAmount(event.target.value)}
                />
              )}
            </fieldset>
          ) : (
            <Textarea
              label="Lý do từ chối"
              required
              maxLength={2000}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Nêu rõ lý do để Shop có thể bổ sung hoặc điều chỉnh yêu cầu"
            />
          )}

          {validationError && (
            <p className={styles.error} role="alert">
              {validationError}
            </p>
          )}
        </div>
      )}
    </Modal>
  );
}
