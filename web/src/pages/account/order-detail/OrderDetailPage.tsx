import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { routes } from '@/shared/config';
import { formatDateTime } from '@/shared/utils';
import { Badge, Button, ButtonLink, Tabs, Breadcrumbs, toast } from '@/shared/ui';
import { openPaymentPage, useAction } from '@/shared/lib';
import {
  approveMaket,
  requestMaketRevision,
  useOrder,
  useOrderMockups,
  useOrderProgress,
  useOrderReviews,
  type ProductReview,
} from '@/entities/order';
import {
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
  const order = useOrder(orderId);
  const [activeTab, setActiveTab] = useState<DetailTab>('progress');
  const { busy, run, error } = useAction();
  const confirmDelivery = useConfirmDelivery();
  const payRemainder = usePayRemainder();
  const reviewMockup = useReviewMockup();
  const getInvoiceLink = useGetInvoiceLink();

  const isBulk = order?.type === 'BULK';
  const currentMaket = order?.maketVersions?.[0];

  // FR-21: `GET /api/orders/{orderId}/progress-updates` — lịch sử tiến độ.
  const asyncProgress = useOrderProgress(orderId);
  const progressUpdates = asyncProgress.kind === 'loaded' ? asyncProgress.data : [];

  // FR-11: `GET /api/orders/{orderId}/reviews` — đánh giá sản phẩm trong đơn.
  const asyncReviews = useOrderReviews(orderId);
  const reviews: ProductReview[] = asyncReviews.kind === 'loaded' ? asyncReviews.data : [];

  // Nạp bản maket mới nhất từ backend (FR-20): `GET /api/orders/{orderId}/mockups`.
  const asyncMockups = useOrderMockups(orderId);

  useEffect(() => {
    if (!orderId || !isBulk) return;
    if (asyncMockups.kind !== 'loaded') return;
    const versions = asyncMockups.data;
    if (versions.length === 0) return;
    // Ưu tiên bản mới nhất (versionNo cao nhất).
    const latest = versions.reduce((a, b) => (b.version > a.version ? b : a));
    if (latest.status === 'APPROVED') approveMaket(orderId, latest.version);
  }, [orderId, isBulk, asyncMockups]);

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
    ...(isBulk && order.maketVersions?.length
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
      approveMaket(order.id, currentMaket.version);
      toast.success('Bạn đã duyệt maket thành công! Xưởng sẽ tiến hành đưa vào sản xuất.');
    });
  }

  function handleRequestRevision() {
    if (!order || !currentMaket) return;
    const feedback = prompt(
      'Nhập nội dung bạn muốn xưởng điều chỉnh (Ví dụ: Đổi màu quai túi, to logo):'
    );
    if (!feedback || !feedback.trim()) return;

    void run(async () => {
      // Backend FR-20: `CHANGES_REQUESTED` bắt buộc có `reviewNote`.
      await reviewMockup(order.id, currentMaket.version, 'CHANGES_REQUESTED', feedback);
      requestMaketRevision(order.id, currentMaket.version, feedback);
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
        toast.warning('Xưởng chưa đính kèm hóa đơn cho đơn hàng này.');
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
              { label: `#${order.id}` },
            ]}
          />
          <h2 className={styles.title}>
            Chi tiết đơn hàng #{order.id} {isBulk && <Badge tone="gold">Đơn Số Lượng Lớn</Badge>}
          </h2>
          <div className={styles.meta}>
            Xưởng/Tiệm: <strong>{order.vendorName}</strong> · Đặt ngày {formatDateTime(order.createdAt)}
          </div>
        </div>

        <div className={styles.headerAction}>
          {order.status === 'DELIVERED' && (
            <>
              <Button variant="primary" size="sm" loading={busy} onClick={handleConfirmReceived}>
                Đã nhận hàng (FR-11)
              </Button>
              <ButtonLink to={routes.account.orderDispute(order.id)} variant="danger" size="sm">
                Báo vấn đề với đơn (M6.1.3)
              </ButtonLink>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabsWrap}>
        <Tabs<DetailTab> items={tabItems} activeId={activeTab} onChange={setActiveTab} />
      </div>

      {/* Tab 1: Tiến độ */}
      {activeTab === 'progress' && (
        <div className={styles.tabSection}>
          <OrderProgressList order={order} progressUpdates={progressUpdates} />
          <OrderItemsList order={order} />
        </div>
      )}

      {/* Tab 2: Maket (M6.1.2) - Duyệt hoặc Yêu cầu sửa */}
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
            onPayRemainder={handlePayRemainder}
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

      {/* Tab 5: Đánh giá (FR-11) */}
      {activeTab === 'reviews' && (
        <div className={styles.tabSection}>
          {!isBulk && (order.status === 'DELIVERED' || order.status === 'COMPLETED') && (
            <ReviewForm
              orderId={order.id}
              products={order.items.flatMap((it) =>
                it.productId && !reviews.some((r) => r.productId === it.productId)
                  ? [{ productId: it.productId, name: it.name }]
                  : []
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
