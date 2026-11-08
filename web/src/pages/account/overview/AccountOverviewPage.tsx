import { Link } from 'react-router-dom';
import { routes } from '@/shared/config';
import { Badge, ButtonLink, Card } from '@/shared/ui';
import { useCurrentUser } from '@/entities/user';
import { orderCode, orderStatusLabel, useOrders } from '@/entities/order';
import { useRequests } from '@/entities/request';
import styles from './AccountOverviewPage.module.css';

export function AccountOverviewPage() {
  const user = useCurrentUser();
  const orders = useOrders();
  const requests = useRequests();

  const pendingMaketOrders = orders.filter((o) => o.status === 'WAITING_MAKET');
  const openRequests = requests.filter((r) => r.status === 'OPEN');
  return (
    <div className={styles.container}>
      {(pendingMaketOrders.length > 0 || openRequests.length > 0) && (
        <Card padding="md" tone="gold" className={styles.urgentCard}>
          <div className={styles.urgentHeader}>
            <h3>Việc cần bạn xử lý</h3>
          </div>
          <div className={styles.urgentList}>
            {pendingMaketOrders.map((o) => (
              <div key={o.id} className={styles.urgentItem}>
                <div>
                  <strong>Đơn hàng #{orderCode(o.id)}:</strong> Bản vẽ maket in logo đang chờ bạn phê duyệt.
                </div>
                <ButtonLink to={routes.account.order(o.id)} variant="primary" size="sm">
                  Duyệt maket ngay
                </ButtonLink>
              </div>
            ))}
            {openRequests.map((r) => (
              <div key={r.id} className={styles.urgentItem}>
                <div>
                  <strong>Yêu cầu #{r.id}:</strong> Có {r.quotes.length} xưởng đã gửi bảng so sánh
                  báo giá.
                </div>
                <ButtonLink to={routes.account.request(r.id)} variant="primary" size="sm">
                  Xem và so sánh giá
                </ButtonLink>
              </div>
            ))}
          </div>
        </Card>
      )}

      <p className={styles.summary}>
        <Link to={routes.account.orders}>{orders.length} đơn hàng</Link>
        <span aria-hidden="true">·</span>
        <Link to={routes.account.requests}>{requests.length} yêu cầu báo giá</Link>
        <span aria-hidden="true">·</span>
        <Link to={routes.account.verify}>
          {user.nfcStatus === 'VERIFIED' ? 'Đã xác minh CCCD' : 'Chưa xác minh CCCD'}
        </Link>
      </p>

      {/* Đơn hàng gần đây */}
      <Card padding="md" className={styles.card}>
        <div className={styles.cardHeader}>
          <h3>Đơn hàng mua gần nhất</h3>
          <Link to={routes.account.orders} className={styles.viewAll}>
            Xem tất cả
          </Link>
        </div>
        <div className={styles.recentOrders}>
          {orders.slice(0, 2).map((o) => (
            <div key={o.id} className={styles.recentRow}>
              <div>
                <strong>#{orderCode(o.id)}</strong> · {o.vendorName}
                <div className={styles.orderSub}>{o.items[0]?.name}</div>
              </div>
              <div className={styles.recentRight}>
                <Badge tone={o.status === 'DELIVERED' ? 'green' : 'amber'} size="sm">
                  {orderStatusLabel(o.status)}
                </Badge>
                <ButtonLink to={routes.account.order(o.id)} variant="secondary" size="sm">
                  Chi tiết
                </ButtonLink>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
