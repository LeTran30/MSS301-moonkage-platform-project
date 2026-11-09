import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { routes } from '@/shared/config';
import { formatCurrency, formatDateTime, shortCode } from '@/shared/utils';
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
  useDisputeByOrder,
  DisputeEvidenceList,
  DISPUTE_REASON_LABELS,
  DISPUTE_DECISION_LABELS,
  type DisputeReason,
} from '@/entities/dispute';
import { useOpenDispute } from '@/features/file-complaint';
import { useFileUpload } from '@/features/file-upload';
import { DisputeEvidenceForm } from '@/widgets/dispute-evidence-form';
import styles from './OrderDisputePage.module.css';

const REASON_OPTIONS: Array<{ value: DisputeReason; label: string }> = (
  Object.keys(DISPUTE_REASON_LABELS) as DisputeReason[]
).map((value) => ({ value, label: DISPUTE_REASON_LABELS[value] }));

/**
 * M6.1.3 — người mua báo vấn đề với một đơn đã giao (FR-12) và theo dõi hồ sơ.
 *
 * Hồ sơ đọc từ máy chủ (`GET /api/orders/{id}/dispute`); khi đang mở, người mua
 * gửi thêm bằng chứng được (AC-49.1). Người mua không đọc được sổ tiền của đơn
 * nên trang chỉ nói số tiền đơn, không đoán số đang giữ.
 */
export function OrderDisputePage() {
  const { id } = useParams<{ id: string }>();
  const orderId = id || '';
  // FR-12: `GET /api/orders/{orderId}` — chi tiết đơn đọc thẳng từ máy chủ.
  const asyncOrder = useOrderDetail(orderId);
  const order = asyncOrder.kind === 'loaded' ? asyncOrder.data : null;
  const asyncDispute = useDisputeByOrder(orderId);
  const dispute = asyncDispute.kind === 'loaded' ? asyncDispute.data : null;
  const { busy, run, error } = useAction();
  const openDispute = useOpenDispute();
  // Bằng chứng tải vào kho đơn hàng — feature `file-upload` giữ trạng thái
  // (đang tải / lỗi / huỷ) thay vì page tự gọi API.
  const evidenceUpload = useFileUpload('ORDER');

  const [reason, setReason] = useState<DisputeReason>('DAMAGED');
  const [description, setDescription] = useState('');
  // Bằng chứng là tệp thật do người dùng chọn, tải lên kho riêng rồi gửi
  // `tempKey` cho máy chủ (FR-12, AC-49.1).
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);

  function refresh() {
    asyncDispute.reload();
    // Đơn mang cờ `disputeOpen`: trang chi tiết đơn đổi nút theo nó.
    asyncOrder.reload();
  }

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
          evidences.push({ tempKey, note: 'Ảnh người mua chụp khi nhận hàng' });
        }
      }

      // Backend FR-12: POST /api/orders/{orderId}/dispute với
      // OpenDisputeRequest { reason, description, evidences }.
      await openDispute(order.id, { reason, description, evidences });

      toast.success('Đã gửi khiếu nại. Tiền của đơn được giữ trên sàn tới khi có phán quyết.');
      refresh();
    });
  }

  if (asyncOrder.kind === 'loading' || asyncDispute.kind === 'loading') {
    return <PageLoader />;
  }

  if (asyncOrder.kind === 'error') {
    return <ErrorState message={asyncOrder.message} onRetry={asyncOrder.reload} />;
  }

  if (asyncDispute.kind === 'error') {
    return <ErrorState message={asyncDispute.message} onRetry={asyncDispute.reload} />;
  }

  if (!order) return <ErrorState message="Không tìm thấy đơn hàng." />;

  const disputeOpen = dispute?.status === 'OPEN';
  // Sau một phán quyết, người mua vẫn được khiếu nại lại nếu còn hạn (máy chủ quyết định).
  const canOpen = !disputeOpen && order.status === 'DELIVERED';

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Báo vấn đề với đơn #{orderCode(order.id)}</h2>
        {canOpen && !dispute && (
          <p className={styles.lead}>
            {order.disputeDeadline ? (
              <>
                Hạn khiếu nại: <strong>{formatDateTime(order.disputeDeadline)}</strong>.{' '}
              </>
            ) : null}
            Tiền của đơn được giữ trên sàn trong suốt thời gian xử lý.
          </p>
        )}
      </div>

      {dispute && (
        <Card padding="lg" tone="gold" className={styles.statusCard}>
          <div className={styles.disputeStatusHeader}>
            <div>
              <span className={styles.dispId}>Mã khiếu nại #{shortCode(dispute.id)}</span>
              <h3>{disputeOpen ? 'Đang chờ quản trị viên phân xử' : 'Quản trị viên đã phân xử'}</h3>
            </div>
            <Badge tone={disputeOpen ? 'amber' : 'green'}>
              {disputeOpen ? 'Đang mở' : 'Đã phân xử'}
            </Badge>
          </div>

          <div className={styles.dispDetailBox}>
            <div>
              <strong>Lý do:</strong> {DISPUTE_REASON_LABELS[dispute.reason]}
            </div>
            <div>
              <strong>Mô tả của bạn:</strong> {dispute.description}
            </div>
            <div>
              <strong>Gửi lúc:</strong> {formatDateTime(dispute.createdAt)}
            </div>
            <div>
              <strong>Giá trị đơn:</strong> {formatCurrency(order.total)}
            </div>
          </div>

          <div className={styles.dispDetailBox}>
            <strong>Bằng chứng của bạn</strong>
            <DisputeEvidenceList
              evidences={dispute.evidences}
              party="BUYER"
              emptyText="Bạn chưa gửi ảnh nào."
            />
            <strong>Bằng chứng của Shop</strong>
            <DisputeEvidenceList
              evidences={dispute.evidences}
              party="VENDOR"
              emptyText="Shop chưa gửi bằng chứng."
            />
          </div>

          {dispute.decision && (
            <div className={styles.decisionBox}>
              <Icon name="shield" size={20} />
              <div>
                <strong>Phán quyết: {DISPUTE_DECISION_LABELS[dispute.decision]}</strong>
                {dispute.decision !== 'REJECTED' && dispute.refundAmount != null && (
                  <p>Số tiền hoàn cho bạn: {formatCurrency(dispute.refundAmount)}</p>
                )}
                {dispute.adminNote && <em>Căn cứ: {dispute.adminNote}</em>}
              </div>
            </div>
          )}

          {disputeOpen && (
            <DisputeEvidenceForm
              orderId={order.id}
              title="Gửi thêm bằng chứng"
              hint="Thêm ảnh chụp bánh, hộp hoặc phiếu giao hàng nếu bạn còn ảnh khác."
              onAdded={refresh}
            />
          )}
        </Card>
      )}

      {canOpen && (
        <form onSubmit={handleSubmitDispute} className={styles.form}>
          <Card padding="lg" className={styles.card}>
            {dispute && <h3>Khiếu nại lại đơn này</h3>}
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
                <strong>Ảnh chụp bánh nhận được</strong>
                <p>JPG hoặc PNG</p>
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
                Khi bạn gửi, tiền của đơn ({formatCurrency(order.total)}) chưa được chuyển cho Shop
                cho tới khi quản trị viên Moonkage phân xử.
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

      {!dispute && !canOpen && (
        <Card padding="lg">
          <p>
            Đơn này không còn khiếu nại được: chỉ đơn đã giao và còn hạn khiếu nại mới gửi được.
          </p>
          <ButtonLink to={routes.account.order(order.id)} variant="outline">
            Về chi tiết đơn
          </ButtonLink>
        </Card>
      )}
    </div>
  );
}
