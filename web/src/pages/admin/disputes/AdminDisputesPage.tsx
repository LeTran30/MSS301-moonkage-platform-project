import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Tabs, toast, AsyncState, EmptyState, Card, Icon } from '@/shared/ui';
import { formatCurrency } from '@/shared/utils';
import { routes } from '@/shared/config';
import { useAction } from '@/shared/lib';
import type { Dispute, DisputeDecision } from '@/entities/dispute';
import { useOpenDisputes } from '@/entities/dispute';
import { DisputeCaseCard, DisputeResolutionCard } from '@/entities/dispute';
import { DisputeResolutionModal, useResolveDispute } from '@/features/resolve-disputes';
import styles from './AdminDisputesPage.module.css';

type DisputeTab = 'PENDING' | 'RESOLVED';

/**
 * Q5.0, Q5.1 — các khiếu nại đang chờ quyết định.
 *
 * `GET /api/orders?disputeStatus=OPEN` (FR-49) rồi
 * `GET /api/orders/{orderId}/dispute` cho hồ sơ khiếu nại của từng đơn; quyết
 * định là `PATCH /api/orders/{orderId}/dispute` (FR-49).
 *
 * Trước đây trang chỉ hiện hồ sơ **đầu tiên** trong danh sách và dùng sẵn
 * số tiền hoàn 135.000đ — nên hồ sơ thứ hai trở đi không bao giờ được xử lý.
 */
export function AdminDisputesPage() {
  const [activeTab, setActiveTab] = useState<DisputeTab>('PENDING');
  const { busy, run, error } = useAction();
  const resolveDispute = useResolveDispute();

  const asyncDisputes = useOpenDisputes();
  const disputes: Dispute[] = asyncDisputes.kind === 'loaded' ? asyncDisputes.data : [];

  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [activeDispute, setActiveDispute] = useState<Dispute | null>(null);
  const [decision, setDecision] = useState<DisputeDecision>('PARTIAL_REFUND');
  const [refundAmount, setRefundAmount] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [resolvedDispute, setResolvedDispute] = useState<Dispute | null>(null);

  const maxRefundAllowed =
    activeDispute?.maxRefundableAmount ?? activeDispute?.escrowHoldingAmount ?? 0;

  const pendingDisputes = disputes.filter((d) => d.status !== 'RESOLVED');

  const handleOpenResolve = (dispute: Dispute) => {
    setActiveDispute(dispute);
    // Số tiền hoàn mặc định bằng toàn bộ số đang giữ trong Escrow; quản trị
    // viên giảm xuống nếu chọn phân bổ một phần.
    setRefundAmount(String(dispute.escrowHoldingAmount ?? 0));
    setAdminNote('');
    setResolveModalOpen(true);
  };

  const handleExecuteResolution = () => {
    if (!activeDispute) return;

    const numRefund = Number(refundAmount) || 0;
    if (decision === 'PARTIAL_REFUND' && numRefund > maxRefundAllowed) {
      toast.error(
        `Số tiền hoàn (${formatCurrency(numRefund)}) không được vượt quá số tiền đang giữ (${formatCurrency(maxRefundAllowed)}).`,
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
      const resolved = await resolveDispute(activeDispute.orderId, {
        decision,
        refundAmount: finalRefund,
        decisionReason: adminNote.trim(),
      });

      // Kết quả phán quyết để hiển thị ở tab "Đã có phán quyết".
      setResolvedDispute({
        ...activeDispute,
        status: 'RESOLVED',
        decision: resolved.decision ?? decision,
        refundAmount: resolved.refundAmount ?? finalRefund,
        adminNote: adminNote.trim(),
        decidedAt: new Date().toISOString(),
        resolvedAt: resolved.resolvedAt ?? new Date().toISOString(),
      });

      // Danh sách khiếu nại đang mở đã thay đổi ở phía máy chủ.
      asyncDisputes.reload();

      setSuccessMsg(
        `Đã phân xử khiếu nại #${activeDispute.id} thành công! Phương án: ${
          decision === 'FULL_REFUND'
            ? 'Hoàn toàn bộ tiền giữ'
            : decision === 'PARTIAL_REFUND'
              ? `Hoàn ${formatCurrency(finalRefund)} cho khách`
              : 'Bác khiếu nại (Giải ngân cho xưởng)'
        }`,
      );
      setResolveModalOpen(false);
      setActiveDispute(null);
    });
    setTimeout(() => setSuccessMsg(null), 5000);
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Phân xử khiếu nại &amp; Tranh chấp</h1>
          <p className={styles.desc}>
            Thực hiện trọng tài giải quyết tranh chấp. Bảo vệ quyền lợi người mua và xưởng sản xuất
            qua quỹ ký quỹ.
          </p>
        </div>
        <div className={styles.escrowRuleBadge}>Hoàn tối đa bằng số tiền đang giữ</div>
      </div>

      {successMsg && (
        <div className={styles.alertSuccess} role="status">
          <Icon name="check" size={16} /> {successMsg}
        </div>
      )}

      <Tabs<DisputeTab>
        items={[
          { id: 'PENDING', label: `Cần phân xử (${pendingDisputes.length})` },
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
          activeTab === 'PENDING' ? (
            pendingDisputes.length === 0 ? (
              <EmptyState
                icon="shield"
                title="Không có khiếu nại nào cần phân xử"
                description="Mọi khiếu nại của sàn đã được xử lý. Khi có khiếu nại mở, hồ sơ sẽ hiện ở đây."
              />
            ) : (
              <div className={styles.caseList}>
                {pendingDisputes.map((dispute) => (
                  <DisputeCaseCard
                    key={dispute.id}
                    dispute={dispute}
                    onResolve={() => handleOpenResolve(dispute)}
                  />
                ))}
              </div>
            )
          ) : null
        }
      </AsyncState>

      {/* When Resolved or tab is RESOLVED */}
      {activeTab === 'RESOLVED' && resolvedDispute && (
        <DisputeResolutionCard dispute={resolvedDispute} />
      )}

      {activeTab === 'RESOLVED' && !resolvedDispute && (
        <Card padding="lg">
          <p>Chưa có phán quyết nào trong phiên làm việc này.</p>
          <p>
            Các hồ sơ đã phán quyết được lưu ở máy chủ. Xem lại danh sách đầy đủ tại{' '}
            <Link to={routes.admin.disputes}>khiếu nại đang mở</Link>.
          </p>
        </Card>
      )}

      {/* Modal Ra phán quyết */}
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
