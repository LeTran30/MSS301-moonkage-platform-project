import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { routes } from '@/shared/config';
import { formatCurrency } from '@/shared/utils';
import { Badge, Button, ButtonLink, Card, Icon, Select, toast } from '@/shared/ui';
import { useAction } from '@/shared/lib';
import { useOrder } from '@/entities/order';
import {
  disputeStore,
  useDisputes,
  DISPUTE_REASON_LABELS,
  DISPUTE_DECISION_LABELS,
  type DisputeReason,
  type Dispute,
} from '@/entities/dispute';
import { useOpenDispute } from '@/features/file-complaint';
import styles from './OrderDisputePage.module.css';

const REASON_OPTIONS: Array<{ value: DisputeReason; label: string }> = (
  Object.keys(DISPUTE_REASON_LABELS) as DisputeReason[]
).map((value) => ({ value, label: DISPUTE_REASON_LABELS[value] }));

export function OrderDisputePage() {
  const { id } = useParams<{ id: string }>();
  const order = useOrder(id || 'MK-1042');
  const disputes = useDisputes();
  const navigate = useNavigate();
  const { busy, run, error } = useAction();
  const openDispute = useOpenDispute();

  const existingDispute = disputes.find((d) => d.orderId === id);

  const [reason, setReason] = useState<DisputeReason>('DAMAGED');
  const [description, setDescription] = useState(
    'Bánh nhận được bị móp vỡ góc hộp do va chạm trong quá trình vận chuyển, mong sàn hỗ trợ hoàn tiền phần bánh hỏng.'
  );

  function handleSubmitDispute(e: React.FormEvent) {
    e.preventDefault();
    if (!order) return;

    void run(async () => {
      // Backend FR-12: POST /api/orders/{orderId}/dispute với
      // OpenDisputeRequest { reason, description, evidences }.
      const created = await openDispute(order.id, {
        reason,
        description,
        evidences: [{ tempKey: '/images/banh-nuong.jpg', note: 'Ảnh chụp bằng chứng' }],
      });

      // Giữ lại các thông tin sổ tiền mà backend không trả về trong hồ sơ khiếu nại.
      disputeStore.set((prev) =>
        prev.map((d) =>
          d.id === created.id
            ? {
                ...d,
                buyerId: order.buyerId,
                buyerName: order.buyerName,
                vendorId: order.vendorId,
                vendorName: order.vendorName,
                orderTotalAmount: order.total,
                escrowHoldingAmount: order.total,
                maxRefundableAmount: order.total,
              }
            : d
        )
      );

      toast.success(
        'Khiếu nại đã được gửi! Hệ thống đã khóa tiền tạm giữ Escrow và thông báo cho người bán + quản trị.'
      );
      navigate(routes.account.order(order.id));
    });
  }

  if (!order) return <div>Không tìm thấy đơn</div>;

  const statusLabel: Record<Dispute['status'], string> = {
    OPEN: 'Đang mở (chờ quản trị xem xét)',
    RESOLVED: 'Đã có phán quyết',
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.eyebrow}>KHIẾU NẠI ĐƠN HÀNG (M6.1.3, FLOW 5, FR-12)</div>
        <h2 className={styles.title}>Báo Vấn Đề Với Đơn #{order.id}</h2>
        <p className={styles.lead}>
          Hạn khiếu nại còn lại: <strong>{order.disputeDeadline ? '3 ngày nội thành' : 'Hợp lệ'}</strong>. Tiền sẽ được giữ an toàn trên sàn trong suốt thời gian xử lý.
        </p>
      </div>

      {existingDispute ? (
        // Đã có khiếu nại -> Hiện trạng thái và quyết định của Admin (M6.1.3 Note)
        <Card padding="lg" tone="gold" className={styles.statusCard}>
          <div className={styles.disputeStatusHeader}>
            <div>
              <span className={styles.dispId}>Mã khiếu nại: #{existingDispute.id}</span>
              <h3>Trạng thái: {statusLabel[existingDispute.status]}</h3>
            </div>
            <Badge tone={existingDispute.status === 'OPEN' ? 'amber' : 'green'}>
              {existingDispute.status}
            </Badge>
          </div>

          <div className={styles.dispDetailBox}>
            <div>
              <strong>Lý do:</strong> {DISPUTE_REASON_LABELS[existingDispute.reason]}
            </div>
            <div><strong>Mô tả của bạn:</strong> {existingDispute.description}</div>
            <div>
              <strong>Tiền tạm giữ trên sàn:</strong>{' '}
              {formatCurrency(existingDispute.escrowHoldingAmount)}
            </div>
            <div>
              <strong>Tối đa có thể hoàn:</strong>{' '}
              {formatCurrency(existingDispute.maxRefundableAmount)}
            </div>
          </div>

          {existingDispute.evidences.length > 0 && (
            <div className={styles.dispDetailBox}>
              <div>
                <strong>Bằng chứng đính kèm:</strong>
              </div>
              <ul className={styles.evidenceList}>
                {existingDispute.evidences.map((evidence, index) => (
                  <li key={`${evidence.party}-${index}`}>
                    {evidence.party === 'BUYER' ? 'Người mua' : 'Người bán'}
                    {evidence.note ? `: ${evidence.note}` : ''}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {existingDispute.vendorResponse && (
            <div className={styles.vendorResponseBox}>
              <Icon name="store" size={16} />
              <div>
                <strong>Phản hồi từ người bán ({existingDispute.vendorName}):</strong>
                <p>{existingDispute.vendorResponse.comment}</p>
              </div>
            </div>
          )}

          {existingDispute.decision && (
            <div className={styles.decisionBox}>
              <Icon name="shield" size={20} />
              <div>
                <strong>Quyết định của Quản trị sàn (FR-49):</strong>
                <p>
                  {DISPUTE_DECISION_LABELS[existingDispute.decision]} —{' '}
                  {formatCurrency(existingDispute.refundAmount || 0)} qua VNPay.
                </p>
                {existingDispute.adminNote && <em>Ghi chú: {existingDispute.adminNote}</em>}
              </div>
            </div>
          )}
        </Card>
      ) : (
        // Chưa có khiếu nại -> Hiện Form gửi khiếu nại
        <form onSubmit={handleSubmitDispute} className={styles.form}>
          <Card padding="lg" className={styles.card}>
            <Select
              label="Lý do khiếu nại (FR-12 Taxonomy)"
              options={REASON_OPTIONS}
              value={reason}
              onChange={(e) => setReason(e.target.value as DisputeReason)}
              required
            />

            <div className={styles.field}>
              <label className={styles.label} htmlFor="dispute-description">
                Mô tả chi tiết vấn đề gặp phải
              </label>
              <textarea
                id="dispute-description"
                className={styles.textarea}
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={2000}
                required
              />
            </div>

            <div className={styles.uploadArea}>
              <Icon name="image" size={24} />
              <div>
                <strong>Ảnh chụp bằng chứng bánh nhận được</strong>
                <p>JPG/PNG dung lượng tối đa 20MB theo chuẩn NFR-08</p>
              </div>
              <Badge tone="neutral" size="sm">1 ảnh đã đính kèm</Badge>
            </div>

            <div className={styles.escrowNotice}>
              <Icon name="shield" size={16} />
              <span>
                Khi bạn bấm gửi, số tiền {formatCurrency(order.total)} sẽ lập tức bị khóa chuyển cho người bán cho tới khi có quyết định từ Đội Vận Hành Moonkage.
              </span>
            </div>

            {error && (
              <p className={styles.formError} role="alert">
                {error}
              </p>
            )}

            <div className={styles.actionRow}>
              <ButtonLink to={routes.account.order(order.id)} variant="secondary">
                Hủy
              </ButtonLink>
              <Button type="submit" variant="primary" size="lg" iconLeft="alert" loading={busy} disabled={busy}>
                {busy ? 'Đang gửi khiếu nại...' : 'Gửi khiếu nại tới sàn'}
              </Button>
            </div>
          </Card>
        </form>
      )}
    </div>
  );
}

