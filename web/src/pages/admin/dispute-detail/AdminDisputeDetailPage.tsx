import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { routes } from '@/shared/config';
import { formatCurrency } from '@/shared/utils';
import { Badge, Button, ButtonLink, Card, Breadcrumbs, Textarea, toast } from '@/shared/ui';
import { useAction } from '@/shared/lib';
import { DISPUTE_REASON_LABELS, useDisputeById, type DisputeDecision } from '@/entities/dispute';
import { useResolveDispute } from '@/features/resolve-disputes';
import styles from './AdminDisputeDetailPage.module.css';

/**
 * Q5.1 — hội đồng trọng tài tranh chấp Escrow.
 *
 * Dữ liệu đọc từ máy chủ:
 * - `GET /api/orders?disputeStatus=OPEN` + `GET /api/orders/{orderId}/dispute`
 *   — hồ sơ khiếu nại (FR-49).
 * - `GET /api/ledgers/{orderId}` — số tiền **đang giữ** trong Escrow; đây là
 *   trần hoàn tiền theo AC-49.3, không phải một con số ước lượng.
 * - `PATCH /api/orders/{orderId}/dispute` — ghi phán quyết (FR-49).
 */
export function AdminDisputeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const disputeId = id ?? '';
  const navigate = useNavigate();
  const { busy, run, error } = useAction();
  const resolveDispute = useResolveDispute();

  const asyncDispute = useDisputeById(disputeId);
  const dispute = asyncDispute.kind === 'loaded' ? asyncDispute.data : null;

  // Số tiền hoàn mặc định bằng **toàn bộ** số đang giữ: quyết định
  // PARTIAL_REFUND thì quản trị viên tự giảm, còn FULL_REFUND thì hoàn hết.
  const escrowAmount = dispute?.escrowHoldingAmount ?? 0;
  const [refundToBuyer, setRefundToBuyer] = useState<number>(escrowAmount);
  const [adminNote, setAdminNote] = useState('');

  // Khi hồ sơ tải xong, số tiền hoàn phải mặc định theo số tiền thật đang
  // giữ (trước đó là một con số cứng 975.000đ không có ý nghĩa). Ta điều
  // chỉnh state trong lúc render thay vì trong effect để không phát sinh
  // thêm một vòng render không cần thiết.
  const [seededDisputeId, setSeededDisputeId] = useState<string | null>(null);
  if (dispute && dispute.id !== seededDisputeId) {
    setSeededDisputeId(dispute.id);
    setRefundToBuyer(dispute.escrowHoldingAmount ?? 0);
  }

  if (asyncDispute.kind === 'loading') {
    return <p role="status">Đang tải hồ sơ khiếu nại…</p>;
  }

  if (asyncDispute.kind === 'error') {
    return (
      <div role="alert">
        <p>{asyncDispute.message}</p>
        <Button variant="secondary" onClick={asyncDispute.reload}>
          Thử lại
        </Button>
      </div>
    );
  }

  if (!dispute) {
    return (
      <div>
        <p>Không tìm thấy khiếu nại #{disputeId}.</p>
        <ButtonLink to={routes.admin.disputes}>Về danh sách tranh chấp</ButtonLink>
      </div>
    );
  }

  const payToVendor = Math.max(0, escrowAmount - refundToBuyer);
  const alreadyResolved = dispute.status === 'RESOLVED';
  const orderId = dispute.orderId;

  function handleResolve(decision: DisputeDecision) {
    const refund =
      decision === 'FULL_REFUND' ? escrowAmount : decision === 'REJECTED' ? 0 : refundToBuyer;

    if (!adminNote.trim()) {
      toast.error('Vui lòng nêu căn cứ phán quyết trọng tài.');
      return;
    }

    void run(async () => {
      // Backend FR-49: PATCH /api/orders/{orderId}/dispute với ResolveDisputeRequest.
      const resolved = await resolveDispute(orderId, {
        decision,
        refundAmount: refund,
        decisionReason: adminNote.trim(),
      });

      toast.success(
        `Đã hạch toán quyết định trọng tài: Hoàn buyer ${formatCurrency(refund)}, Trả xưởng ${formatCurrency(Math.max(0, escrowAmount - refund))}!`,
      );

      // Dữ liệu phán quyết trả về từ máy chủ là nguồn sự thật.
      if (resolved.status) {
        asyncDispute.reload();
      }
      navigate(routes.admin.disputes);
    });
  }

  return (
    <div className={styles.container}>
      <Breadcrumbs
        items={[
          { label: 'Quản Trị', to: routes.admin.overview },
          { label: 'Tranh chấp', to: routes.admin.disputes },
          { label: `Hồ sơ #${dispute.id}` },
        ]}
      />

      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.title}>Phân xử tranh chấp #{dispute.id}</h1>
          <p className={styles.subtitle}>
            Đơn hàng: #{dispute.orderId} · Ký quỹ tạm giữ:{' '}
            <strong>{formatCurrency(escrowAmount)}</strong>
          </p>
        </div>
        <Badge tone={alreadyResolved ? 'green' : 'red'} size="md">
          {alreadyResolved ? 'Đã phán quyết' : 'Đang thụ lý trọng tài'}
        </Badge>
      </div>

      <div className={styles.grid}>
        <Card padding="lg" className={styles.card}>
          <h2 className={styles.cardTitle}>Nội dung khiếu nại của bên mua</h2>
          <div className={styles.detailList}>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Lý do:</span>
              <strong className={styles.reasonValue}>
                {DISPUTE_REASON_LABELS[dispute.reason]}
              </strong>
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
          <h2 className={styles.cardTitle}>Phán quyết và hạch toán tiền ký quỹ</h2>

          {alreadyResolved ? (
            <div className={styles.detailList}>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Quyết định:</span>
                <strong>{dispute.decision ?? '—'}</strong>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Hoàn cho người mua:</span>
                <strong>{formatCurrency(dispute.refundAmount ?? 0)}</strong>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Căn cứ phán quyết:</span>
                <strong>{dispute.adminNote ?? '—'}</strong>
              </div>
            </div>
          ) : (
            <>
              <div>
                <label className={styles.fieldLabel} htmlFor="refund-amount">
                  Số tiền hoàn trả Bên Mua (VNĐ) — Tối đa: {formatCurrency(escrowAmount)}
                </label>
                <input
                  id="refund-amount"
                  type="number"
                  className={styles.numberInput}
                  value={refundToBuyer}
                  onChange={(e) =>
                    setRefundToBuyer(
                      Math.min(escrowAmount, Math.max(0, Number(e.target.value) || 0)),
                    )
                  }
                  max={escrowAmount}
                  min={0}
                />
                <div className={styles.hint}>
                  Số tiền còn lại giải ngân cho Bên Xưởng:{' '}
                  <strong>{formatCurrency(payToVendor)}</strong>
                </div>
              </div>

              <div>
                <Textarea
                  id="decision-reason"
                  label="Căn cứ phán quyết trọng tài:"
                  rows={3}
                  value={adminNote}
                  maxLength={2000}
                  placeholder="Nêu rõ căn cứ: bằng chứng đã đối chiếu, quy định áp dụng và lý do phân bổ tiền."
                  onChange={(e) => setAdminNote(e.target.value)}
                />
              </div>

              {error && (
                <p className={styles.formError} role="alert">
                  {error}
                </p>
              )}

              <div className={styles.actionRow}>
                <Button
                  variant="primary"
                  onClick={() => handleResolve('PARTIAL_REFUND')}
                  loading={busy}
                  disabled={busy}
                >
                  Chấp Thuận Phân Bổ Ký Quỹ
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleResolve('FULL_REFUND')}
                  disabled={busy}
                >
                  Hoàn 100% Cho Buyer
                </Button>
                <Button variant="outline" onClick={() => handleResolve('REJECTED')} disabled={busy}>
                  Bác Đơn, Trả 100% Xưởng
                </Button>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
