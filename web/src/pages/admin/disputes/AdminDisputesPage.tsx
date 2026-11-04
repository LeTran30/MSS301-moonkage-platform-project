import { useState } from 'react';
import { Tabs, toast, AsyncState, EmptyState } from '@/shared/ui';
import { formatCurrency } from '@/shared/utils';
import { useAction } from '@/shared/lib';
import type { Dispute, DisputeDecision } from '@/entities/dispute';
import { useOpenDisputes } from '@/entities/dispute';
import { DisputeCaseCard, DisputeResolutionCard } from '@/entities/dispute';
import { DisputeResolutionModal, useResolveDispute } from '@/features/resolve-disputes';
import styles from './AdminDisputesPage.module.css';

type DisputeTab = 'PENDING' | 'RESOLVED';

/**
 * Q5.0, Q5.1 — the disputes waiting for a decision.
 *
 * `GET /api/orders?disputeStatus=OPEN` (FR-49) then
 * `GET /api/orders/{orderId}/dispute` for the dispute of each order; the
 * decision is `PATCH /api/orders/{orderId}/dispute` (FR-49).
 */
export function AdminDisputesPage() {
  const [activeTab, setActiveTab] = useState<DisputeTab>('PENDING');
  const { busy, run, error } = useAction();
  const resolveDispute = useResolveDispute();

  const asyncDisputes = useOpenDisputes();
  const disputes: Dispute[] = asyncDisputes.kind === 'loaded' ? asyncDisputes.data : [];
  const dispute = disputes[0];

  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [decision, setDecision] = useState<DisputeDecision>('PARTIAL_REFUND');
  const [refundAmount, setRefundAmount] = useState('135000');
  const [adminNote, setAdminNote] = useState(
    'Xác nhận 1 bánh nứt do chèn ép kiện ship. Bồi hoàn 135.000đ cho người mua, số tiền còn lại giải ngân cho xưởng.'
  );
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [resolvedDispute, setResolvedDispute] = useState<Dispute | null>(null);

  const maxRefundAllowed = dispute?.maxRefundableAmount || dispute?.escrowHoldingAmount || 0; // AC-49.3 rule

  const handleOpenResolve = () => {
    setResolveModalOpen(true);
  };

  const handleExecuteResolution = () => {
    if (!dispute) return;

    const numRefund = Number(refundAmount);
    if (decision === 'PARTIAL_REFUND' && numRefund > maxRefundAllowed) {
      toast.error(
        `Quy tắc AC-49.3: Số tiền hoàn (${formatCurrency(numRefund)}) không được vượt quá số tiền Escrow đang giữ (${formatCurrency(maxRefundAllowed)}).`
      );
      return;
    }
    if (!adminNote.trim()) {
      toast.error('Vui lòng nêu căn cứ phán quyết trọng tài.');
      return;
    }

    const finalRefund =
      decision === 'FULL_REFUND' ? maxRefundAllowed : decision === 'PARTIAL_REFUND' ? numRefund : 0;

    void run(async () => {
      // Backend FR-49: PATCH /api/orders/{orderId}/dispute với ResolveDisputeRequest.
      const resolved = await resolveDispute(dispute.orderId, {
        decision,
        refundAmount: finalRefund,
        decisionReason: adminNote,
      });

      // Kết quả phán quyết để hiển thị ở tab "Đã có phán quyết".
      setResolvedDispute({
        ...dispute,
        status: 'RESOLVED',
        decision: resolved.decision ?? decision,
        refundAmount: resolved.refundAmount ?? finalRefund,
        adminNote,
        decidedAt: new Date().toISOString(),
        resolvedAt: resolved.resolvedAt ?? new Date().toISOString(),
      });

      // Danh sách khiếu nại đang mở đã thay đổi ở phía máy chủ.
      asyncDisputes.reload();

      setSuccessMsg(
        `Đã phân xử khiếu nại #${dispute.id} thành công! Phương án: ${
          decision === 'FULL_REFUND'
            ? 'Hoàn toàn bộ tiền giữ'
            : decision === 'PARTIAL_REFUND'
              ? `Hoàn ${formatCurrency(finalRefund)} cho khách`
              : 'Bác khiếu nại (Giải ngân cho xưởng)'
        }`
      );
      setResolveModalOpen(false);
    });
    setTimeout(() => setSuccessMsg(null), 5000);
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Phân xử khiếu nại &amp; Tranh chấp (Q5.0, Q5.1)</h1>
          <p className={styles.desc}>
            Thực hiện trọng tài giải quyết tranh chấp theo Flow 5 &amp; FR-49. Bảo vệ quyền lợi người
            mua và xưởng sản xuất qua quỹ ký quỹ Escrow.
          </p>
        </div>
        <div className={styles.escrowRuleBadge}>
          ⚖️ AC-49.3: Hoàn tối đa = Số tiền đang giữ trong Escrow
        </div>
      </div>

      {successMsg && (
        <div className={styles.alertSuccess} role="status">
          ✓ {successMsg}
        </div>
      )}

      <Tabs<DisputeTab>
        items={[
          { id: 'PENDING', label: 'Cần phân xử' },
          { id: 'RESOLVED', label: 'Đã có phán quyết' },
        ]}
        activeId={activeTab}
        onChange={setActiveTab}
      />

      <AsyncState
        state={asyncDisputes}
        onRetry={asyncDisputes.reload}
        loadingMessage="Đang tải hồ sơ khiếu nại..."
        isEmpty={() => disputes.length === 0}
        empty={
          <EmptyState
            icon="shield"
            title="Không có khiếu nại nào cần phân xử"
            description="Mọi khiếu nại của sàn đã được xử lý. Khi có khiếu nại mở, hồ sơ sẽ hiện ở đây."
          />
        }
      >
        {() =>
          activeTab === 'PENDING' && dispute && dispute.status !== 'RESOLVED' ? (
            <DisputeCaseCard dispute={dispute} onResolve={handleOpenResolve} />
          ) : null
        }
      </AsyncState>

      {/* When Resolved or tab is RESOLVED */}
      {activeTab === 'RESOLVED' && resolvedDispute && (
        <DisputeResolutionCard dispute={resolvedDispute} />
      )}

      {/* Modal Ra phán quyết (Q5.1, Flow 5, FR-49) */}
      <DisputeResolutionModal
        open={resolveModalOpen}
        maxRefundAllowed={maxRefundAllowed}
        decision={decision}
        refundAmount={refundAmount}
        adminNote={adminNote}
        busy={busy}
        error={error}
        onDecisionChange={setDecision}
        onRefundAmountChange={setRefundAmount}
        onAdminNoteChange={setAdminNote}
        onClose={() => setResolveModalOpen(false)}
        onSubmit={handleExecuteResolution}
      />
    </div>
  );
}
