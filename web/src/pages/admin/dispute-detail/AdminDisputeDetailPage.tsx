import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { routes } from '@/shared/config';
import { formatCurrency } from '@/shared/utils';
import { Badge, Button, ButtonLink, Card, Breadcrumbs, toast } from '@/shared/ui';
import { useAction } from '@/shared/lib';
import {
  disputeStore,
  useDisputes,
  DISPUTE_REASON_LABELS,
  type DisputeDecision,
} from '@/entities/dispute';
import { useResolveDispute } from '@/features/resolve-disputes';
import styles from './AdminDisputeDetailPage.module.css';

export function AdminDisputeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const disputes = useDisputes();
  const dispute = disputes.find((d) => d.id === id) || disputes[0];
  const { busy, run, error } = useAction();
  const resolveDispute = useResolveDispute();

  const escrowAmount = dispute ? dispute.escrowHoldingAmount : 975000;
  const [refundToBuyer, setRefundToBuyer] = useState<number>(dispute?.escrowHoldingAmount || 0);
  const [adminNote, setAdminNote] = useState(
    'Hộp bánh bị móp méo do đơn vị vận chuyển, chấp thuận hoàn tiền theo AC-49.3.'
  );

  if (!dispute) {
    return (
      <div>
        <p>Không tìm thấy khiếu nại.</p>
        <ButtonLink to={routes.admin.disputes}>Về danh sách tranh chấp</ButtonLink>
      </div>
    );
  }

  const payToVendor = Math.max(0, escrowAmount - refundToBuyer);

  function handleResolve(decision: DisputeDecision) {
    const refund =
      decision === 'FULL_REFUND' ? escrowAmount : decision === 'REJECTED' ? 0 : refundToBuyer;

    if (!adminNote.trim()) {
      toast.error('Vui lòng nêu căn cứ phán quyết trọng tài.');
      return;
    }

    void run(async () => {
      // Backend FR-49: PATCH /api/orders/{orderId}/dispute với ResolveDisputeRequest.
      const resolved = await resolveDispute(dispute.orderId, {
        decision,
        refundAmount: refund,
        decisionReason: adminNote,
      });

      disputeStore.set((prev) =>
        prev.map((d) =>
          d.id === dispute.id
            ? {
                ...d,
                status: 'RESOLVED',
                decision: resolved.decision ?? decision,
                refundAmount: resolved.refundAmount ?? refund,
                adminNote,
                decidedAt: new Date().toISOString(),
                resolvedAt: resolved.resolvedAt ?? new Date().toISOString(),
              }
            : d
        )
      );

      toast.success(
        `Đã hạch toán quyết định trọng tài: Hoàn buyer ${formatCurrency(refund)}, Trả xưởng ${formatCurrency(payToVendor)}!`
      );
      navigate(routes.admin.disputes);
    });
  }

  return (
    <div className={styles.container}>
      <Breadcrumbs
        items={[
          { label: 'Quản Trị', to: routes.admin.overview },
          { label: 'Tranh chấp Escrow', to: routes.admin.disputes },
          { label: `Hồ sơ #${dispute.id}` },
        ]}
      />

      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.title}>
            Hội Đồng Trọng Tài Tranh Chấp #{dispute.id} (Q5.1, AC-49.3)
          </h1>
          <p className={styles.subtitle}>
            Đơn hàng: #{dispute.orderId} · Ký quỹ tạm giữ: <strong>{formatCurrency(escrowAmount)}</strong>
          </p>
        </div>
        <Badge tone={dispute.status === 'RESOLVED' ? 'green' : 'red'} size="md">
          {dispute.status === 'RESOLVED' ? 'Đã phán quyết' : 'Đang thụ lý trọng tài'}
        </Badge>
      </div>

      <div className={styles.grid}>
        <Card padding="lg" className={styles.card}>
          <h2 className={styles.cardTitle}>Nội Dung Khiếu Nại Của Bên Mua</h2>
          <div className={styles.detailList}>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Lý do:</span>
              <strong className={styles.reasonValue}>{DISPUTE_REASON_LABELS[dispute.reason]}</strong>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Số tiền ký quỹ phong tỏa:</span>
              <strong>{formatCurrency(dispute.escrowHoldingAmount)}</strong>
            </div>
            <div>
              <span className={styles.descriptionLabel}>Mô tả thực tế:</span>
              <div className={styles.descriptionBox}>{dispute.description}</div>
            </div>
            {dispute.evidences.length > 0 && (
              <div>
                <span className={styles.descriptionLabel}>Bằng chứng:</span>
                <ul className={styles.evidenceList}>
                  {dispute.evidences.map((evidence, index) => (
                    <li key={`${evidence.party}-${index}`}>
                      {evidence.party === 'BUYER' ? 'Người mua' : 'Người bán'}
                      {evidence.note ? `: ${evidence.note}` : ''}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Card>

        <Card padding="lg" className={styles.card}>
          <h2 className={styles.cardTitle}>Phán Quyết & Hạch Toán Ký Quỹ Escrow</h2>

          <div>
            <label className={styles.fieldLabel} htmlFor="refund-amount">
              Số tiền hoàn trả Bên Mua (VNĐ) — Tối đa: {formatCurrency(escrowAmount)}
            </label>
            <input
              id="refund-amount"
              type="number"
              className={styles.numberInput}
              value={refundToBuyer}
              onChange={(e) => setRefundToBuyer(Math.min(escrowAmount, Number(e.target.value)))}
              max={escrowAmount}
              min={0}
            />
            <div className={styles.hint}>
              Số tiền còn lại giải ngân cho Bên Xưởng: <strong>{formatCurrency(payToVendor)}</strong>
            </div>
          </div>

          <div>
            <label className={styles.fieldLabel} htmlFor="decision-reason">
              Căn cứ phán quyết trọng tài:
            </label>
            <textarea
              id="decision-reason"
              className={styles.textarea}
              rows={3}
              value={adminNote}
              maxLength={2000}
              onChange={(e) => setAdminNote(e.target.value)}
            />
          </div>

          {error && (
            <p className={styles.formError} role="alert">
              {error}
            </p>
          )}

          <div className={styles.actionRow}>
            <Button variant="primary" onClick={() => handleResolve('PARTIAL_REFUND')} loading={busy} disabled={busy}>
              Chấp Thuận Phân Bổ Ký Quỹ
            </Button>
            <Button variant="outline" onClick={() => handleResolve('FULL_REFUND')} disabled={busy}>
              Hoàn 100% Cho Buyer
            </Button>
            <Button variant="outline" onClick={() => handleResolve('REJECTED')} disabled={busy}>
              Bác Đơn, Trả 100% Xưởng
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

