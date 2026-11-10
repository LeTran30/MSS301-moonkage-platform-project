import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { routes } from '@/shared/config';
import { formatDateTime } from '@/shared/utils';
import {
  Badge,
  Button,
  ButtonLink,
  Tabs,
  Breadcrumbs,
  ErrorState,
  PageLoader,
  toast,
} from '@/shared/ui';
import { openPaymentPage, useAction } from '@/shared/lib';
import {
  orderCode,
  useOrderDetail,
  useOrderMockups,
  useOrderProgress,
  useOrderReviews,
  type ProductReview,
} from '@/entities/order';
import {
  OrderDeliveryInfo,
  OrderInvoiceInfo,
  OrderItemsList,
  OrderPaymentSummary,
  OrderProgressList,
  OrderReviewList,
} from '@/entities/order';
import { useConfirmDelivery } from '@/features/confirm-delivery';
import { usePayRemainder } from '@/features/pay-remainder';
import { ReviewForm } from '@/features/write-review';
import { MaketReviewPanel, useGetInvoiceLink, useReviewMockup } from '@/features/fulfill-order';
import styles from './OrderDetailPage.module.css';

type DetailTab = 'progress' | 'maket' | 'payment' | 'invoice' | 'reviews';

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const orderId = id || '';
  // FR-11: `GET /api/orders/{orderId}` — chi tiết đơn đọc thẳng từ máy chủ.
  const asyncOrder = useOrderDetail(orderId);
  const order = asyncOrder.kind === 'loaded' ? asyncOrder.data : null;
  // `?tab=maket` opens the page where the buyer has a maket to approve (link from "Việc cần bạn xử lý").
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<DetailTab>(() =>
    searchParams.get('tab') === 'maket' ? 'maket' : 'progress',
  );
  const { busy, run, error } = useAction();
  const confirmDelivery = useConfirmDelivery();
  const payRemainder = usePayRemainder();
  const reviewMockup = useReviewMockup();
  const getInvoiceLink = useGetInvoiceLink();

  const isBulk = order?.type === 'BULK';
  // FR-22, M6.1.2: phần còn lại chỉ trả được sau khi Shop báo đã giao.
  const canPayRemainder = isBulk && order?.status === 'DELIVERED';

  // FR-21: `GET /api/orders/{orderId}/progress-updates` — lịch sách tiến độ.
  const asyncProgress = useOrderProgress(orderId);
  const progressUpdates = asyncProgress.kind === 'loaded' ? asyncProgress.data : [];
  const rejectReason = progressUpdates.find((u) => u.milestone === 'REJECTED')?.note;

  // FR-11: `GET /api/orders/{orderId}/reviews` — đánh giá sản phẩm trong đơn.
  const asyncReviews = useOrderReviews(orderId);
  const reviews: ProductReview[] = asyncReviews.kind === 'loaded' ? asyncReviews.data : [];

  // Nạp bản maket mới nhất từ backend (FR-20): `GET /api/orders/{orderId}/mockups`.
  const asyncMockups = useOrderMockups(orderId);
  const maketVersions = asyncMockups.kind === 'loaded' ? asyncMockups.data : [];
  const currentMaket =
    maketVersions.length > 0
      ? maketVersions.reduce((a, b) => (b.version > a.version ? b : a))
      : undefined;

  if (asyncOrder.kind === 'loading') {
    return <PageLoader />;
  }

  if (asyncOrder.kind === 'error') {
    return <ErrorState message={asyncOrder.message} onRetry={asyncOrder.reload} />;
  }

  if (!order) {
    return (
      <div>
        <h3>Không tìm thấy đơn hàng #{id}</h3>
        <ButtonLink to={routes.account.orders} variant="primary">
          Về danh sách đơn
        </ButtonLink>
      </div>
    );
  }

  // Tabs cho đơn đặt hàng (M6.1.2): Tiến độ · Maket · Thanh toán · Hóa đơn
  const tabItems: { id: DetailTab; label: string }[] = [
    { id: 'progress', label: 'Tiến độ đơn hàng' },
    ...(isBulk && maketVersions.length > 0
      ? [{ id: 'maket' as const, label: 'Bản thiết kế Maket (in logo)' }]
      : []),
    { id: 'payment', label: 'Chi tiết thanh toán' },
    { id: 'invoice', label: 'Hóa đơn GTGT' },
    { id: 'reviews', label: `Đánh giá (${reviews.length})` },
  ];

  function handleApproveMaket() {
    if (!order || !currentMaket) return;
    void run(async () => {
      // Backend FR-20: PATCH /api/orders/{orderId}/mockups/{versionNo}
      await reviewMockup(order.id, currentMaket.version, 'APPROVED');
      toast.success('Bạn đã duyệt maket thành công! Xưởng sẽ tiến hành đưa vào sản xuất.');
    });
  }

  function handleRequestRevision(feedback: string) {
    if (!order || !currentMaket) return;
    void run(async () => {
      // Backend FR-20: `CHANGES_REQUESTED` bắt buộc có `reviewNote`.
      await reviewMockup(order.id, currentMaket.version, 'CHANGES_REQUESTED', feedback);
      toast.info('Đã gửi yêu cầu chỉnh sửa tới xưởng bánh!');
    });
  }

  // FR-22: thanh toán phần còn lại của đơn custom khi đã giao.
  function handlePayRemainder() {
    if (!order) return;
    void run(async () => {
      const link = await payRemainder(order.id);
      openPaymentPage(link.paymentUrl);
    });
  }

  // FR-11: người mua xác nhận đã nhận hàng.
  function handleConfirmReceived() {
    if (!order) return;
    void run(async () => {
      await confirmDelivery(order.id);
      toast.success('Cảm ơn bạn đã xác nhận nhận hàng!');
    });
  }

  // FR-25: liên kết tải hóa đơn từ backend.
  function handleDownloadInvoice() {
    if (!order) return;
    void run(async () => {
      const link = await getInvoiceLink(order.id);
      if (!link?.downloadUrl) {
        toast.warning('Shop chưa đính kèm hóa đơn cho đơn hàng này.');
        return;
      }
      window.open(link.downloadUrl, '_blank', 'noopener,noreferrer');
    });
  }

  return (
    <div className={styles.container}>
      {/* Top Header */}
      <div className={styles.header}>
        <div>
          <Breadcrumbs
            items={[
              { label: 'Tài khoản', path: routes.account.overview },
              { label: 'Đơn hàng của tôi', path: routes.account.orders },
              { label: `#${orderCode(order.id)}` },
            ]}
          />
          <h2 className={styles.title}>
            Chi tiết đơn hàng #{orderCode(order.id)}{' '}
            {isBulk && <Badge tone="gold">Đơn Số Lượng Lớn</Badge>}
          </h2>
          <div className={styles.meta}>
            Shop: <strong>{order.vendorName}</strong> · Đặt ngày {formatDateTime(order.createdAt)}
          </div>
        </div>

        <div className={styles.headerAction}>
          <ButtonLink
            to={routes.account.messagesWithShop(order.vendorId)}
            variant="outline"
            size="sm"
            iconLeft="message"
          >
            Nhắn shop
          </ButtonLink>
          {order.status === 'DELIVERED' && order.hasDispute && (
            // Khiếu nại đang mở: tiền chờ quản trị viên phân xử, không xác nhận nhận hàng được.
            <ButtonLink to={routes.account.orderDispute(order.id)} variant="primary" size="sm">
              Xem khiếu nại
            </ButtonLink>
          )}
          {order.status === 'DELIVERED' && !order.hasDispute && (
            <>
              {/* Đơn đặt riêng: trả phần còn lại là bước nhận hàng, đơn tự hoàn tất (FR-22). */}
              {canPayRemainder ? (
                <Button variant="primary" size="sm" loading={busy} onClick={handlePayRemainder}>
                  Thanh toán phần còn lại
                </Button>
              ) : (
                <Button variant="primary" size="sm" loading={busy} onClick={handleConfirmReceived}>
                  Đã nhận hàng
                </Button>
              )}
              <ButtonLink to={routes.account.orderDispute(order.id)} variant="danger" size="sm">
                Báo vấn đề với đơn
              </ButtonLink>
            </>
          )}
        </div>
      </div>

      {order.status === 'REJECTED' && (
        // Q-01: tiền của đơn này đã về ví người mua; các đơn khác của cùng lượt thanh toán vẫn đi tiếp.
        <div role="status" className={styles.rejectedNotice}>
          <strong>Shop đã từ chối đơn này.</strong>{' '}
          {rejectReason && `Lý do: ${rejectReason}. `}
          Toàn bộ tiền của đơn đã được hoàn vào{' '}
          <Link to={routes.account.wallet}>ví Moonkage của bạn</Link>.
        </div>
      )}

      {/* Tabs */}
      <div className={styles.tabsWrap}>
        <Tabs<DetailTab> items={tabItems} activeId={activeTab} onChange={setActiveTab} />
      </div>

      {/* Tab 1: Tiến độ */}
      {activeTab === 'progress' && (
        <div className={styles.tabSection}>
          <OrderProgressList order={order} progressUpdates={progressUpdates} />
          <OrderItemsList order={order} />
          <OrderDeliveryInfo order={order} />
        </div>
      )}

      {/* Tab 2: Maket - Duyệt hoặc Yêu cầu sửa */}
      {activeTab === 'maket' && isBulk && (
        <div className={styles.tabSection}>
          <MaketReviewPanel
            customLogo={order.customLogo}
            currentMaket={currentMaket}
            busy={busy}
            error={error}
            onApprove={handleApproveMaket}
            onRequestRevision={handleRequestRevision}
          />
        </div>
      )}

      {/* Tab 3: Thanh toán */}
      {activeTab === 'payment' && (
        <div className={styles.tabSection}>
          <OrderPaymentSummary
            order={order}
            isBulk={isBulk}
            busy={busy}
            onPayRemainder={canPayRemainder ? handlePayRemainder : undefined}
          />
          {error && (
            <p className={styles.pageError} role="alert">
              {error}
            </p>
          )}
        </div>
      )}

      {/* Tab 4: Hóa đơn */}
      {activeTab === 'invoice' && (
        <div className={styles.tabSection}>
          <OrderInvoiceInfo order={order} busy={busy} onDownload={handleDownloadInvoice} />
        </div>
      )}

      {/* Tab 5: Đánh giá */}
      {activeTab === 'reviews' && (
        <div className={styles.tabSection}>
          {!isBulk && (order.status === 'DELIVERED' || order.status === 'COMPLETED') && (
            <ReviewForm
              orderId={order.id}
              products={order.items.flatMap((it) =>
                it.productId && !reviews.some((r) => r.productId === it.productId)
                  ? [{ productId: it.productId, name: it.name }]
                  : [],
              )}
            />
          )}
          <OrderReviewList
            reviews={reviews}
            state={asyncReviews.kind}
            errorMessage={asyncReviews.kind === 'error' ? asyncReviews.message : undefined}
          />
        </div>
      )}
    </div>
  );
}
