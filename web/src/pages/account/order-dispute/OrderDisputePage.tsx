import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { routes } from '@/shared/config';
import { formatCurrency } from '@/shared/utils';
import {
  Badge,
  Button,
  ButtonLink,
  Card,
  ErrorState,
  Icon,
  PageLoader,
  Select,
  Textarea,
  toast,
} from '@/shared/ui';
import { useAction } from '@/shared/lib';
import { orderCode, useOrderDetail } from '@/entities/order';
import {
  disputeStore,
  useDisputes,
  useDisputeByOrder,
  DISPUTE_REASON_LABELS,
  DISPUTE_DECISION_LABELS,
  type DisputeReason,
  type Dispute,
} from '@/entities/dispute';
import { useOpenDispute } from '@/features/file-complaint';
import { useFileUpload } from '@/features/file-upload';
import styles from './OrderDisputePage.module.css';

const REASON_OPTIONS: Array<{ value: DisputeReason; label: string }> = (
  Object.keys(DISPUTE_REASON_LABELS) as DisputeReason[]
).map((value) => ({ value, label: DISPUTE_REASON_LABELS[value] }));

export function OrderDisputePage() {
  const { id } = useParams<{ id: string }>();
  const orderId = id || '';
  // FR-12: `GET /api/orders/{orderId}` — chi tiết đơn đọc thẳng từ máy chủ.
  const asyncOrder = useOrderDetail(orderId);
  const order = asyncOrder.kind === 'loaded' ? asyncOrder.data : null;
  // FR-12: hồ sơ khiếu nại đọc thẳng từ máy chủ (`GET /api/orders/{id}/dispute`).
  // Store chỉ là bộ đệm trong phiên: nếu chỉ đọc store thì tải lại trang sẽ
  // không thấy khiếu nại đã gửi trước đó.
  const asyncDispute = useDisputeByOrder(orderId);
  const serverDispute = asyncDispute.kind === 'loaded' ? asyncDispute.data : null;
  const disputes = useDisputes();
  const navigate = useNavigate();
  const { busy, run, error } = useAction();
  const openDispute = useOpenDispute();
  // Bằng chứng tải vào kho đơn hàng — feature `file-upload` giữ trạng thái
  // (đang tải / lỗi / huỷ) thay vì page tự gọi API.
  const evidenceUpload = useFileUpload('ORDER');

  const existingDispute =
    serverDispute ?? disputes.find((d) => d.orderId === orderId) ?? null;

  const [reason, setReason] = useState<DisputeReason>('DAMAGED');
  const [description, setDescription] = useState('');
  // Bằng chứng là tệp thật do người dùng chọn, tải lên kho riêng rồi gửi
  // `tempKey` cho máy chủ (FR-12, AC-49.1).
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);

  function handleSubmitDispute(e: React.FormEvent) {
    e.preventDefault();
    if (!order) return;

    void run(async () => {
      // Bằng chứng (nếu có) phải lên kho trước: `POST /api/orders/uploads` xin
      // liên kết có chữ ký, rồi gửi thẳng tệp lên kho đó.
      const evidences: Array<{ tempKey: string; note?: string }> = [];
      if (evidenceFile) {
        const tempKey = await evidenceUpload.upload(evidenceFile);
        if (tempKey) {
          evidences.push({ tempKey, note: 'Ảnh chụp bằng chứng' });
        }
      }

      // Backend FR-12: POST /api/orders/{orderId}/dispute với
      // OpenDisputeRequest { reason, description, evidences }.
      const created = await openDispute(order.id, {
        reason,
        description,
        evidences,
      });

      // Giữ lại các thông tin sổ tiền mà backend không trả về trong hồ sơ khiếu nại.
      // Hồ sơ vừa tạo cũng phải vào store — nếu không, các màn hình khác (danh sách
      // khiếu nại của tôi) sẽ không thấy nó cho tới lần tải lại trang.
      disputeStore.set((prev) => {
        const enriched = {
          ...created,
          buyerId: order.buyerId,
          buyerName: order.buyerName,
          vendorId: order.vendorId,
          vendorName: order.vendorName,
          orderTotalAmount: order.total,
          escrowHoldingAmount: order.total,
          maxRefundableAmount: order.total,
        };
        const index = prev.findIndex((d) => d.id === created.id);
        if (index === -1) return [...prev, enriched];
        return prev.map((d, i) => (i === index ? { ...d, ...enriched } : d));
      });

      toast.success(
        'Khiếu nại đã được gửi! Hệ thống đã khóa tiền tạm giữ Escrow và thông báo cho người bán + quản trị.',
      );
      navigate(routes.account.order(order.id));
    });
  }

  if (asyncOrder.kind === 'loading') {
    return <PageLoader />;
  }

  if (asyncOrder.kind === 'error') {
    return <ErrorState message={asyncOrder.message} onRetry={asyncOrder.reload} />;
  }

  if (!order) return <div>Không tìm thấy đơn</div>;

  const statusLabel: Record<Dispute['status'], string> = {
    OPEN: 'Đang mở (chờ quản trị xem xét)',
    RESOLVED: 'Đã có phán quyết',
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.eyebrow}>KHIẾU NẠI ĐƠN HÀNG</div>
        <h2 className={styles.title}>Báo Vấn Đề Với Đơn #{orderCode(order.id)}</h2>
        <p className={styles.lead}>
          Hạn khiếu nại còn lại:{' '}
          <strong>{order.disputeDeadline ? '3 ngày nội thành' : 'Hợp lệ'}</strong>. Tiền sẽ được giữ
          an toàn trên sàn trong suốt thời gian xử lý.
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
            <div>
              <strong>Mô tả của bạn:</strong> {existingDispute.description}
            </div>
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
                <strong>Quyết định của Quản trị sàn:</strong>
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
              label="Lý do khiếu nại"
              options={REASON_OPTIONS}
              value={reason}
              onChange={(v) => setReason(v as DisputeReason)}
              required
            />

            <div className={styles.field}>
              <Textarea
                id="dispute-description"
                label="Mô tả chi tiết vấn đề gặp phải"
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
                <p>JPG/PNG dung lượng tối đa 20MB</p>
              </div>
              <label className={styles.evidencePicker}>
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={(e) => setEvidenceFile(e.target.files?.[0] ?? null)}
                />
                {evidenceFile ? (
                  <Badge tone="green" size="sm">
                    {evidenceFile.name}
                  </Badge>
                ) : (
                  <Badge tone="neutral" size="sm">
                    Chọn ảnh
                  </Badge>
                )}
              </label>
            </div>

            <div className={styles.escrowNotice}>
              <Icon name="shield" size={16} />
              <span>
                Khi bạn bấm gửi, số tiền {formatCurrency(order.total)} sẽ lập tức bị khóa chuyển cho
                người bán cho tới khi có quyết định từ Đội Vận Hành Moonkage.
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
              <Button
                type="submit"
                variant="primary"
                size="lg"
                iconLeft="alert"
                loading={busy}
                disabled={busy}
              >
                {busy ? 'Đang gửi khiếu nại...' : 'Gửi khiếu nại tới sàn'}
              </Button>
            </div>
          </Card>
        </form>
      )}
    </div>
  );
}
