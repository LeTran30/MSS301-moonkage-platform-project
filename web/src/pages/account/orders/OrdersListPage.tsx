import { useState } from 'react';
import { routes } from '@/shared/config';
import { formatCurrency, formatDate } from '@/shared/utils';
import { Badge, ButtonLink, Card, Icon, Tabs } from '@/shared/ui';
import { useOrders } from '@/entities/order';
import styles from './OrdersListPage.module.css';

export function OrdersListPage() {
  const orders = useOrders();
  // Tab theo IA Note M6.1: Hai tab: Mua lẻ (nhóm theo lần thanh toán) · Đặt số lượng lớn
  const [activeTab, setActiveTab] = useState<'retail' | 'bulk'>('retail');

  const retailOrders = orders.filter((o) => o.type === 'RETAIL');
  const bulkOrders = orders.filter((o) => o.type === 'BULK');

  const tabItems = [
    { id: 'retail', label: `Đơn mua lẻ (${retailOrders.length})` },
    { id: 'bulk', label: `Đơn đặt hàng số lượng lớn (${bulkOrders.length})` },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.eyebrow}>ĐƠN HÀNG CỦA TÔI (M6.1, FLOW 1, FLOW 2)</div>
        <h2 className={styles.title}>Danh sách đơn hàng</h2>
        <p className={styles.lead}>
          Theo dõi tiến độ giao bánh, duyệt bản thiết kế in logo và yêu cầu hỗ trợ khiếu nại.
        </p>
      </div>

      <div className={styles.tabsWrap}>
        <Tabs<'retail' | 'bulk'> items={tabItems as { id: 'retail' | 'bulk'; label: string }[]} activeId={activeTab} onChange={setActiveTab} />
      </div>

      {activeTab === 'retail' && (
        <div className={styles.orderList}>
          {retailOrders.map((order) => (
            <Card key={order.id} padding="md" className={styles.orderCard}>
              <div className={styles.orderHeader}>
                <div className={styles.idGroup}>
                  <Icon name="package" size={18} />
                  <strong>#{order.id}</strong>
                  <span className={styles.orderDate}>· Ngày đặt: {formatDate(order.createdAt)}</span>
                </div>
                <div className={styles.statusWrap}>
                  <Badge
                    tone={
                      order.status === 'COMPLETED'
                        ? 'green'
                        : order.status === 'DELIVERED'
                        ? 'gold'
                        : 'neutral'
                    }
                  >
                    {order.status === 'DELIVERED'
                      ? 'Đã giao hàng'
                      : order.status === 'SHIPPING'
                      ? 'Đang giao'
                      : order.status === 'PAID'
                      ? 'Đã thanh toán'
                      : order.status}
                  </Badge>
                </div>
              </div>

              <div className={styles.shopRow}>
                <Icon name="store" size={14} /> Tiệm bánh: <strong>{order.vendorName}</strong>
              </div>

              <div className={styles.itemsList}>
                {order.items.map((it, idx) => (
                  <div key={idx} className={styles.itemRow}>
                    <img src={it.image} alt={it.name} className={styles.itemImg}  loading="lazy" decoding="async" />
                    <div className={styles.itemInfo}>
                      <span className={styles.itemName}>{it.name}</span>
                      <span className={styles.itemQty}>
                        {formatCurrency(it.price)} x {it.quantity} hộp
                      </span>
                    </div>
                    <div className={styles.itemTotal}>{formatCurrency(it.price * it.quantity)}</div>
                  </div>
                ))}
              </div>

              <div className={styles.orderFooter}>
                <div className={styles.totalBlock}>
                  <span>Tổng thanh toán: <strong>{formatCurrency(order.total)}</strong></span>
                  {order.trackingCode && (
                    <span className={styles.tracking}>Mã vận đơn: {order.trackingCode}</span>
                  )}
                </div>

                <div className={styles.actionBtns}>
                  {order.status === 'DELIVERED' && (
                    <ButtonLink to={routes.account.orderDispute(order.id)} variant="danger" size="sm">
                      <Icon name="alert" size={14} /> Báo vấn đề với đơn (M6.1.3)
                    </ButtonLink>
                  )}
                  <ButtonLink to={routes.account.order(order.id)} variant="primary" size="sm">
                    Xem chi tiết đơn
                  </ButtonLink>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'bulk' && (
        <div className={styles.orderList}>
          {bulkOrders.map((order) => (
            <Card key={order.id} padding="md" tone="gold" className={styles.orderCard}>
              <div className={styles.orderHeader}>
                <div className={styles.idGroup}>
                  <Icon name="factory" size={18} />
                  <strong>#{order.id}</strong>
                  <Badge tone="gold" size="sm">HỢP ĐỒNG IN LOGO</Badge>
                  <span className={styles.orderDate}>· Ngày đặt: {formatDate(order.createdAt)}</span>
                </div>
                <div className={styles.statusWrap}>
                  <Badge
                    tone={
                      order.status === 'WAITING_MAKET'
                        ? 'red'
                        : order.status === 'IN_PRODUCTION'
                        ? 'amber'
                        : 'green'
                    }
                  >
                    {order.status === 'WAITING_MAKET'
                      ? 'CẦN DUYỆT MAKET'
                      : order.status === 'IN_PRODUCTION'
                      ? 'Đang sản xuất'
                      : order.status}
                  </Badge>
                </div>
              </div>

              <div className={styles.shopRow}>
                <Icon name="store" size={14} /> Xưởng thực hiện: <strong>{order.vendorName}</strong>
              </div>

              <div className={styles.itemsList}>
                {order.items.map((it, idx) => (
                  <div key={idx} className={styles.itemRow}>
                    <img src={it.image} alt={it.name} className={styles.itemImg}  loading="lazy" decoding="async" />
                    <div className={styles.itemInfo}>
                      <span className={styles.itemName}>{it.name}</span>
                      <span className={styles.itemQty}>
                        Đơn giá: {formatCurrency(it.price)} · Số lượng: <strong>{it.quantity} hộp</strong>
                      </span>
                    </div>
                    <div className={styles.itemTotal}>{formatCurrency(it.price * it.quantity)}</div>
                  </div>
                ))}
              </div>

              <div className={styles.bulkPaymentBrief}>
                <div className={styles.briefCol}>
                  <span>Tổng hợp đồng: <strong>{formatCurrency(order.total)}</strong></span>
                  <span className={styles.greenText}>
                    Đã cọc: <strong>{formatCurrency(order.depositAmount || 0)}</strong>
                  </span>
                </div>
                <div className={styles.briefCol}>
                  <span>
                    Phần còn lại:{' '}
                    <strong>{formatCurrency(order.remainingAmount || 0)}</strong>
                  </span>
                  <span>
                    Trạng thái:{' '}
                    <em>{order.remainingPaid ? 'Đã thanh toán' : 'Thanh toán khi nhận bánh'}</em>
                  </span>
                </div>
              </div>

              <div className={styles.orderFooter}>
                <div className={styles.bulkNotice}>
                  <Icon name="sparkle" size={16} />
                  <span>Xưởng đã tải lên maket hộp. Vui lòng xem và duyệt để bắt đầu đúc bánh.</span>
                </div>

                <div className={styles.actionBtns}>
                  <ButtonLink to={routes.account.order(order.id)} variant="primary" size="sm">
                    Vào duyệt maket &amp; theo dõi tiến độ
                  </ButtonLink>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

