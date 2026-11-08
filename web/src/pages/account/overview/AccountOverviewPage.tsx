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

  return (
    <div className={styles.container}>

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
                <strong>{orderCode(o.id)}</strong> · {o.vendorName}
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
