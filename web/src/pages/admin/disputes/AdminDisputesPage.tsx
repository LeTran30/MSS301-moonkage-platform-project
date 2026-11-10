import { useState } from 'react';
import { Tabs, toast, AsyncState, EmptyState } from '@/shared/ui';
import { formatCurrency, shortCode } from '@/shared/utils';
import { useAction } from '@/shared/lib';
import {
  DisputeCaseCard,
  DisputeResolutionCard,
  useDisputeQueue,
  type Dispute,
  type DisputeDecision,
} from '@/entities/dispute';
import { useManualRefunds } from '@/entities/payment';
import { DisputeResolutionModal, useResolveDispute } from '@/features/resolve-disputes';
import { ManualRefundList } from './ManualRefundList';
import styles from './AdminDisputesPage.module.css';

type DisputeTab = 'PENDING' | 'REFUNDS' | 'RESOLVED';

/**
 * Q5.0, Q5.1 — hàng đợi khiếu nại của quản trị viên.
 *
 * `GET /api/orders/disputes?status=OPEN|RESOLVED` (FR-49) cho hai tab hồ sơ;
 * quyết định là `PATCH /api/orders/{orderId}/dispute`. Lệnh hoàn VNPay từ chối
 * nằm ở tab xử lý tay (`GET /api/refunds`, AC-49.3).
 */
export function AdminDisputesPage() {
  const [activeTab, setActiveTab] = useState<DisputeTab>('PENDING');
  const { busy, run, error } = useAction();
  const resolveDispute = useResolveDispute();

  const asyncOpen = useDisputeQueue('OPEN');
  const openCount = asyncOpen.kind === 'loaded' ? asyncOpen.data.length : 0;
  const asyncResolved = useDisputeQueue('RESOLVED');
  // Phán quyết hoàn tiền mà VNPay từ chối thành khoản chờ chuyển khoản tay (AC-49.3).
  const asyncRefunds = useManualRefunds();
  const refundCount = asyncRefunds.kind === 'loaded' ? asyncRefunds.data.length : 0;

  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [activeDispute, setActiveDispute] = useState<Dispute | null>(null);
  const [decision, setDecision] = useState<DisputeDecision>('PARTIAL_REFUND');
  const [refundAmount, setRefundAmount] = useState('');
  const [adminNote, setAdminNote] = useState('');

  const maxRefundAllowed = activeDispute?.maxRefundableAmount ?? 0;
  // FULL_REFUND hoàn đúng tổng tiền đơn (DisputeServiceImpl.resolve), không phải số đang giữ.
  const orderTotal = activeDispute?.orderTotalAmount ?? 0;

  const handleOpenResolve = (dispute: Dispute) => {
    setActiveDispute(dispute);
    // Hoàn một phần phải nhỏ hơn tổng đơn, nên không điền sẵn con số nào:
    // quản trị viên tự nhập khoản bồi thường.
    setDecision('PARTIAL_REFUND');
    setRefundAmount('');
    setAdminNote('');
    setResolveModalOpen(true);
  };

  const handleExecuteResolution = () => {
    if (!activeDispute) return;

    const numRefund = Number(refundAmount) || 0;
    if (decision === 'PARTIAL_REFUND') {
      // Máy chủ nhận hoàn một phần khi 0 < số tiền < tổng đơn (REFUND_AMOUNT_INVALID).
      const ceiling = Math.min(maxRefundAllowed, orderTotal - 1);
      if (numRefund <= 0 || numRefund > ceiling) {
        toast.error(
          `Số tiền hoàn một phần phải lớn hơn 0 và không quá ${formatCurrency(ceiling)}. Muốn hoàn hết, chọn "Hoàn toàn bộ".`,
        );
        return;
      }
    }
    if (!adminNote.trim()) {
      toast.error('Vui lòng nêu căn cứ phán quyết.');
      return;
    }

    const finalRefund =
      decision === 'FULL_REFUND' ? orderTotal : decision === 'PARTIAL_REFUND' ? numRefund : 0;

    void run(async () => {
      await resolveDispute(activeDispute.orderId, {
        decision,
        refundAmount: finalRefund,
        decisionReason: adminNote.trim(),
      });

      toast.success(
        `Đã phân xử khiếu nại #${shortCode(activeDispute.id)}: ${
          decision === 'REJECTED'
            ? 'bác khiếu nại, tiền về Shop'
            : `hoàn ${formatCurrency(finalRefund)} cho người mua`
        }.`,
      );
      // Hồ sơ chuyển từ tab mở sang tab đã phân xử; lệnh hoàn có thể vừa rơi
      // vào hàng xử lý tay.
      asyncOpen.reload();
      asyncResolved.reload();
      asyncRefunds.reload();
      setResolveModalOpen(false);
      setActiveDispute(null);
    });
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Phân xử khiếu nại &amp; Tranh chấp</h1>
          <p className={styles.desc}>
            Xem bằng chứng hai bên rồi quyết định hoàn tiền cho người mua hay chuyển tiền cho Shop.
          </p>
        </div>
        <div className={styles.escrowRuleBadge}>Hoàn tối đa bằng số tiền đang giữ</div>
      </div>

      <Tabs<DisputeTab>
        items={[
          { id: 'PENDING', label: `Cần phân xử (${openCount})` },
          { id: 'REFUNDS', label: `Hoàn tiền xử lý tay (${refundCount})` },
          { id: 'RESOLVED', label: 'Đã có phán quyết' },
        ]}
        activeId={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === 'PENDING' && (
        <AsyncState
          state={asyncOpen}
          onRetry={asyncOpen.reload}
          loadingMessage="Đang tải hồ sơ khiếu nại..."
          isEmpty={(disputes) => disputes.length === 0}
          empty={
            <EmptyState
              icon="shield"
              title="Không có khiếu nại nào cần phân xử"
              description="Khi người mua mở khiếu nại, hồ sơ sẽ hiện ở đây."
            />
          }
        >
          {(disputes) => (
            <div className={styles.caseList}>
              {disputes.map((dispute) => (
                <DisputeCaseCard
                  key={dispute.id}
                  dispute={dispute}
                  onResolve={() => handleOpenResolve(dispute)}
                />
              ))}
            </div>
          )}
        </AsyncState>
      )}

      {activeTab === 'REFUNDS' && (
        <AsyncState
          state={asyncRefunds}
          onRetry={asyncRefunds.reload}
          loadingMessage="Đang tải các khoản hoàn tiền..."
        >
          {(refunds) => <ManualRefundList refunds={refunds} onSettled={asyncRefunds.reload} />}
        </AsyncState>
      )}

      {activeTab === 'RESOLVED' && (
        <AsyncState
          state={asyncResolved}
          onRetry={asyncResolved.reload}
          loadingMessage="Đang tải các phán quyết..."
          isEmpty={(disputes) => disputes.length === 0}
          empty={
            <EmptyState
              icon="shield"
              title="Chưa có phán quyết nào"
              description="Khiếu nại đã phân xử sẽ hiện ở đây, mới nhất trước."
            />
          }
        >
          {(disputes) => (
            <div className={styles.caseList}>
              {disputes.map((dispute) => (
                <DisputeResolutionCard key={dispute.id} dispute={dispute} />
              ))}
            </div>
          )}
        </AsyncState>
      )}

      <DisputeResolutionModal
        open={resolveModalOpen}
        maxRefundAllowed={maxRefundAllowed}
        orderTotal={orderTotal}
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
