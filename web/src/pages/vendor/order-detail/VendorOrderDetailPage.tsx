import styles from './VendorOrderDetailPage.module.css';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { routes } from '@/shared/config';
import { formatCurrency, formatDate } from '@/shared/utils';
import { Badge, Button, ButtonLink, Card, Breadcrumbs, Icon, Input, toast } from '@/shared/ui';
import { useAction } from '@/shared/lib';
import {
  canSendMaket,
  nextOrderStatus,
  orderCode,
  orderStatusLabel,
  orderStatusSteps,
  toBackendOrderStatus,
  useOrderDetail,
  useOrderMockups,
  type MaketVersion,
} from '@/entities/order';
import { RequestSpecList, useVendorRequestList } from '@/entities/request';
import { useAdvanceOrder } from '@/features/advance-order-status';
import { UploadMaketModal, useUploadMockup } from '@/features/fulfill-order';
import { useFileUpload } from '@/features/file-upload';

const MAKET_STATE: Record<MaketVersion['status'], { tone: 'green' | 'gold' | 'red'; label: string }> = {
  PENDING: { tone: 'gold', label: 'Đang chờ khách duyệt' },
  APPROVED: { tone: 'green', label: 'Khách đã duyệt' },
  REJECTED: { tone: 'red', label: 'Khách yêu cầu sửa' },
};

/**
 * B2.1, B2.2 — the shop moves one order forward (FR-32, FR-40).
 *
 * The backend allows exactly one step at a time (409 on a jump), so the page
 * offers only the next status. An interprovince order going to SHIPPING needs
 * its tracking code (AC-32.3). DELIVERED to COMPLETED is the buyer's step: they
 * confirm a buy-now order and pay the rest of a custom order (FR-22).
 *
 * A custom order with custom work reaches "Chờ duyệt maket" by the Shop sending
 * a maket (FR-39), not by a bare status change, and goes into production only
 * once the buyer approved the latest version (BR-15).
 */
export function VendorOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const asyncOrder = useOrderDetail(id || '');
  const order = asyncOrder.kind === 'loaded' ? asyncOrder.data : null;
  const { busy, run, error } = useAction();
  const advanceOrder = useAdvanceOrder();
  const [trackingCode, setTrackingCode] = useState('');
  const [note, setNote] = useState('');

  const withMaket = Boolean(order?.type === 'BULK' && order.hasCustom);
  const asyncMockups = useOrderMockups(id || '', { enabled: withMaket });
  const maketVersions = asyncMockups.kind === 'loaded' ? asyncMockups.data : [];
  const latestMaket =
    maketVersions.length > 0
      ? maketVersions.reduce((a, b) => (b.version > a.version ? b : a))
      : undefined;
  // The order keeps only the quote; the Shop's request list carries its quotes, so it finds the buyer's request.
  const asyncRequests = useVendorRequestList(order?.quoteId ? order.vendorId : null);
  const sourceRequest =
    asyncRequests.kind === 'loaded' && order?.quoteId
      ? asyncRequests.data.find((r) => r.quotes.some((q) => q.id === order.quoteId))
      : undefined;
  const uploadMockup = useUploadMockup();
  const maketUpload = useFileUpload('ORDER');
  const [maketModalOpen, setMaketModalOpen] = useState(false);
  const [maketFile, setMaketFile] = useState<File | null>(null);

  const nextStatus = order ? nextOrderStatus(order) : null;
  // Gửi maket là bước đưa đơn sang chờ duyệt; không có nút chuyển trạng thái trống.
  const advanceStatus = nextStatus === 'WAITING_MAKET' ? null : nextStatus;
  const waitsForApproval = order?.status === 'WAITING_MAKET' && latestMaket?.status !== 'APPROVED';
  const needsTracking = Boolean(order?.interprovince && nextStatus === 'SHIPPING');

  function handleSendMaket() {
    if (!order) return;
    void run(async () => {
      if (!maketFile) {
        toast.error('Vui lòng chọn tệp thiết kế maket.');
        return;
      }
      const tempKey = await maketUpload.upload(maketFile);
      if (!tempKey) {
        toast.error('Không tải được tệp thiết kế lên kho lưu trữ.');
        return;
      }
      const version = await uploadMockup(order.id, tempKey);
      toast.success(`Đã gửi maket bản ${version.version} cho khách duyệt.`);
      setMaketModalOpen(false);
      setMaketFile(null);
      asyncMockups.reload();
      asyncOrder.reload();
    });
  }

  function handleAdvance() {
    if (!order || !advanceStatus) return;
    if (needsTracking && !trackingCode.trim()) {
      toast.warning('Đơn liên tỉnh cần mã vận đơn trước khi chuyển sang "Đang giao".');
      return;
    }
    void run(async () => {
      await advanceOrder(order.id, {
        status: toBackendOrderStatus(advanceStatus),
        ...(needsTracking ? { trackingCode: trackingCode.trim() } : {}),
        ...(note.trim() ? { note: note.trim() } : {}),
      });
      toast.success(`Đơn đã chuyển sang "${orderStatusLabel(advanceStatus)}". Người mua đã được báo.`);
      setNote('');
      asyncOrder.reload();
    });
  }

  if (asyncOrder.kind === 'loading') {
    return <p>Đang tải đơn hàng…</p>;
  }

  if (asyncOrder.kind === 'error') {
    return (
      <div>
        <p>{asyncOrder.message}</p>
        <Button variant="outline" onClick={asyncOrder.reload}>
          Thử lại
        </Button>
      </div>
    );
  }

  if (!order) {
    return (
      <div>
        <p>Không tìm thấy đơn hàng.</p>
        <ButtonLink to={routes.vendor.orders}>Về danh sách đơn</ButtonLink>
      </div>
    );
  }

  const isBulk = order.type === 'BULK';
  const steps = orderStatusSteps(order.type).filter(
    (step) => step !== 'WAITING_MAKET' || order.hasCustom,
  );

  /** What the Shop waits for when it has no step to take. */
  function waitingText(): string {
    if (!order) return '';
    if (nextStatus === 'WAITING_MAKET') return 'Gửi maket để đơn chuyển sang chờ khách duyệt.';
    if (waitsForApproval) return 'Chờ khách duyệt maket rồi mới vào sản xuất.';
    if (order.status === 'DELIVERED') {
      return isBulk
        ? `Đã giao. Chờ khách thanh toán phần còn lại ${formatCurrency(order.remainingAmount || 0)}; đơn tự hoàn tất khi tiền về.`
        : 'Đã giao. Chờ người mua xác nhận đã nhận hàng.';
    }
    return 'Đơn không còn bước nào cho Shop.';
  }
  const currentIndex = steps.indexOf(order.status);

  return (
    <div className={styles.page}>
      <Breadcrumbs
        items={[
          { label: 'Kênh Xưởng', to: routes.vendor.overview },
          { label: 'Quản lý đơn hàng', to: routes.vendor.orders },
          { label: `Đơn hàng #${orderCode(order.id)}` },
        ]}
      />

      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Xử Lý Đơn Hàng #{orderCode(order.id)}</h1>
          <p className={styles.subtitle}>
            Ngày đặt: {formatDate(order.createdAt)} · Người nhận: {order.shippingAddress.receiver} (
            {order.shippingAddress.phone})
          </p>
        </div>
        <Badge tone={order.status === 'COMPLETED' ? 'green' : 'gold'} size="md">
          {orderStatusLabel(order.status)}
        </Badge>
      </div>

      {error && (
        <p role="alert" className={styles.subtitle}>
          {error}
        </p>
      )}

      <div className={styles.gridTwo}>
        <Card padding="lg" className={styles.cardBody}>
          <h2 className={styles.sectionTitle}>Sản phẩm trong đơn</h2>
          <div className={styles.stack}>
            {order.items.map((it, idx) => (
              <div key={idx} className={styles.productRow}>
                <div className={styles.productInfo}>
                  <div className={styles.productName}>{it.name}</div>
                  <div className={styles.productMeta}>
                    Số lượng: <strong>{it.quantity}</strong> × {formatCurrency(it.price)}
                  </div>
                </div>
                <div className={styles.priceStrong}>{formatCurrency(it.quantity * it.price)}</div>
              </div>
            ))}
          </div>

          <div className={styles.summaryBox}>
            <div className={styles.summaryRow}>
              <span>Địa chỉ giao hàng:</span>
              <strong className={styles.summaryRight}>
                {order.shippingAddress.address}, {order.shippingAddress.province}
              </strong>
            </div>
            {order.invoiceCompanyInfo && (
              <div className={styles.summaryRow}>
                <span>Xuất hóa đơn GTGT:</span>
                <strong className={styles.summaryRight}>
                  {order.invoiceCompanyInfo.name} · MST {order.invoiceCompanyInfo.taxCode} ·{' '}
                  {order.invoiceCompanyInfo.email}
                </strong>
              </div>
            )}
            {order.trackingCode && (
              <div className={styles.summaryRow}>
                <span>Mã vận đơn:</span>
                <strong className={styles.summaryRight}>{order.trackingCode}</strong>
              </div>
            )}
            <div className={styles.summaryRow}>
              <span>Phí giao hàng:</span>
              <strong className={styles.summaryRight}>
                {order.shippingFee > 0 ? formatCurrency(order.shippingFee) : 'Miễn phí'}
              </strong>
            </div>
            <div className={styles.totalRow}>
              <span>Tổng giá trị đơn:</span>
              <span className={styles.totalStrong}>{formatCurrency(order.total)}</span>
            </div>
            {isBulk && (
              <>
                <div className={styles.summaryRow}>
                  <span>Khách đã cọc:</span>
                  <strong className={styles.summaryRight}>
                    {formatCurrency(order.depositAmount || 0)}
                  </strong>
                </div>
                <div className={styles.summaryRow}>
                  <span>Phần còn lại:</span>
                  <strong className={styles.summaryRight}>
                    {formatCurrency(order.remainingAmount || 0)}{' '}
                    {order.remainingPaid ? '(đã thanh toán)' : '(khách trả sau khi nhận hàng)'}
                  </strong>
                </div>
              </>
            )}
          </div>

          {sourceRequest && (
            <div className={styles.cardBody}>
              <h3 className={styles.sectionTitle}>Khách yêu cầu</h3>
              <RequestSpecList request={sourceRequest} />
            </div>
          )}
        </Card>

        <Card padding="lg" className={styles.stackWide}>
          <h2 className={styles.sectionTitle}>Tiến độ đơn hàng</h2>

          <div className={styles.cardBody}>
            {steps.map((step, i) => {
              const done = i <= currentIndex;
              return (
                <div key={step} className={styles.progressRow}>
                  <div
                    className={`${styles.stepBadge} ${done ? styles.stepBadgeDone : styles.stepBadgePending}`}
                  >
                    {done ? <Icon name="check" size={13} /> : i + 1}
                  </div>
                  <div className={styles.productInfo}>
                    <div className={`${styles.stepTitle} ${done ? '' : styles.stepTitlePending}`}>
                      {orderStatusLabel(step)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {withMaket && (
            <div className={styles.stack}>
              <h3 className={styles.sectionTitle}>Maket thiết kế</h3>
              {latestMaket ? (
                <div className={styles.maketRow}>
                  <a
                    href={latestMaket.imageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Mở maket bản ${latestMaket.version} cỡ lớn`}
                  >
                    <img src={latestMaket.imageUrl} alt="" className={styles.maketThumb} loading="lazy" />
                  </a>
                  <div className={styles.maketMeta}>
                    <span>Bản {latestMaket.version}</span>
                    <Badge tone={MAKET_STATE[latestMaket.status].tone}>
                      {MAKET_STATE[latestMaket.status].label}
                    </Badge>
                  </div>
                </div>
              ) : (
                <p className={styles.productMeta}>
                  Chưa gửi maket. Gửi bản thiết kế để khách duyệt trước khi sản xuất.
                </p>
              )}
              {latestMaket?.status === 'REJECTED' && latestMaket.comment && (
                <p className={styles.productMeta}>Khách nhắn: {latestMaket.comment}</p>
              )}
              {canSendMaket(order) && latestMaket?.status !== 'APPROVED' && (
                <Button
                  variant={latestMaket?.status === 'PENDING' ? 'outline' : 'primary'}
                  onClick={() => setMaketModalOpen(true)}
                  loading={busy}
                >
                  {latestMaket ? 'Gửi bản maket mới' : 'Gửi maket cho khách duyệt'}
                </Button>
              )}
            </div>
          )}

          {advanceStatus && !waitsForApproval && (
            <div className={styles.stack}>
              {needsTracking && (
                <Input
                  label="Mã vận đơn (đơn liên tỉnh) *"
                  value={trackingCode}
                  onChange={(e) => setTrackingCode(e.target.value)}
                  placeholder="Ví dụ: GHN123456789"
                />
              )}
              <Input
                label="Ghi chú cho người mua"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ví dụ: Đã đóng gói, chiều nay giao"
              />
            </div>
          )}

          <div className={styles.timelineRow}>
            {advanceStatus && !waitsForApproval ? (
              <Button variant="primary" onClick={handleAdvance} loading={busy}>
                Chuyển sang: {orderStatusLabel(advanceStatus)}
              </Button>
            ) : (
              <p className={styles.productMeta}>{waitingText()}</p>
            )}
            <ButtonLink to={routes.vendor.orders} variant="outline">
              Về Danh Sách
            </ButtonLink>
          </div>
        </Card>
      </div>

      <UploadMaketModal
        open={maketModalOpen}
        maketFile={maketFile}
        busy={busy}
        onMaketFileChange={setMaketFile}
        onClose={() => setMaketModalOpen(false)}
        onSubmit={handleSendMaket}
      />
    </div>
  );
}
