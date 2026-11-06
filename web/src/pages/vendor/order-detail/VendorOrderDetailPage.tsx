import styles from './VendorOrderDetailPage.module.css';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { routes } from '@/shared/config';
import { formatCurrency, formatDate } from '@/shared/utils';
import { Badge, Button, ButtonLink, Card, Breadcrumbs, Icon, Input, toast } from '@/shared/ui';
import { useAction } from '@/shared/lib';
import {
  nextOrderStatus,
  orderStatusLabel,
  orderStatusSteps,
  toBackendOrderStatus,
  useOrderDetail,
} from '@/entities/order';
import { useAdvanceOrder } from '@/features/advance-order-status';
import { OrderChatPanel } from '@/features/order-chat';

/**
 * B2.1, B2.2 — the shop moves one order forward (FR-32, FR-40).
 *
 * The backend allows exactly one step at a time (409 on a jump), so the page
 * offers only the next status. An interprovince order going to SHIPPING needs
 * its tracking code (AC-32.3). DELIVERED to COMPLETED is the buyer's step.
 */
export function VendorOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const asyncOrder = useOrderDetail(id || '');
  const order = asyncOrder.kind === 'loaded' ? asyncOrder.data : null;
  const { busy, run, error } = useAction();
  const advanceOrder = useAdvanceOrder();
  const [trackingCode, setTrackingCode] = useState('');
  const [note, setNote] = useState('');

  const nextStatus = order ? nextOrderStatus(order.status) : null;
  const needsTracking = Boolean(order?.interprovince && nextStatus === 'SHIPPING');

  function handleAdvance() {
    if (!order || !nextStatus) return;
    if (needsTracking && !trackingCode.trim()) {
      toast.warning('Đơn liên tỉnh cần mã vận đơn trước khi chuyển sang "Đang giao".');
      return;
    }
    void run(async () => {
      await advanceOrder(order.id, {
        status: toBackendOrderStatus(nextStatus),
        ...(needsTracking ? { trackingCode: trackingCode.trim() } : {}),
        ...(note.trim() ? { note: note.trim() } : {}),
      });
      toast.success(`Đơn đã chuyển sang "${orderStatusLabel(nextStatus)}". Người mua đã được báo.`);
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

  const steps = orderStatusSteps(order.type);
  const currentIndex = steps.indexOf(order.status);

  return (
    <div className={styles.page}>
      <Breadcrumbs
        items={[
          { label: 'Kênh Xưởng', to: routes.vendor.overview },
          { label: 'Quản lý đơn hàng', to: routes.vendor.orders },
          { label: `Đơn hàng #${order.id}` },
        ]}
      />

      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Xử Lý Đơn Hàng #{order.id}</h1>
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
            {order.trackingCode && (
              <div className={styles.summaryRow}>
                <span>Mã vận đơn:</span>
                <strong className={styles.summaryRight}>{order.trackingCode}</strong>
              </div>
            )}
            <div className={styles.totalRow}>
              <span>Tổng giá trị đơn:</span>
              <span className={styles.totalStrong}>{formatCurrency(order.total)}</span>
            </div>
          </div>
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

          {nextStatus && (
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
            {nextStatus ? (
              <Button variant="primary" onClick={handleAdvance} loading={busy}>
                Chuyển sang: {orderStatusLabel(nextStatus)}
              </Button>
            ) : (
              <p className={styles.productMeta}>
                {order.status === 'DELIVERED'
                  ? 'Đã giao. Chờ người mua xác nhận đã nhận hàng.'
                  : 'Đơn không còn bước nào cho Shop.'}
              </p>
            )}
            <ButtonLink to={routes.vendor.orders} variant="outline">
              Về Danh Sách
            </ButtonLink>
          </div>
        </Card>
      </div>

      <OrderChatPanel orderId={order.id} counterpartName="người mua" />
    </div>
  );
}
