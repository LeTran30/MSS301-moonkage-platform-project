import { Link } from 'react-router-dom';
import { routes } from '@/shared/config';
import { Badge, ButtonLink, Card, Icon } from '@/shared/ui';
import { useCurrentUser } from '@/entities/user';
import { useOrders } from '@/entities/order';
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
      {/* Khối "Việc cần bạn" */}
      {(pendingMaketOrders.length > 0 || openRequests.length > 0) && (
        <Card padding="md" tone="gold" className={styles.urgentCard}>
          <div className={styles.urgentHeader}>
            <Icon name="sparkle" size={18} />
            <h3>Khối "Việc cần bạn"</h3>
          </div>
          <div className={styles.urgentList}>
            {pendingMaketOrders.map((o) => (
              <div key={o.id} className={styles.urgentItem}>
                <div>
                  <strong>Đơn hàng #{o.id}:</strong> Bản vẽ maket in logo đang chờ bạn phê duyệt.
                </div>
                <ButtonLink to={routes.account.order(o.id)} variant="gold" size="sm">
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
                  Xem &amp; So sánh giá
                </ButtonLink>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Tóm tắt thống kê */}
      <div className={styles.statsGrid}>
        <Card padding="md" className={styles.statCard}>
          <Icon name="package" size={24} className={styles.statIcon} />
          <div>
            <div className={styles.statNumber}>{orders.length}</div>
            <div className={styles.statLabel}>Tổng đơn hàng đã tạo</div>
          </div>
        </Card>
        <Card padding="md" className={styles.statCard}>
          <Icon name="file" size={24} className={styles.statIcon} />
          <div>
            <div className={styles.statNumber}>{requests.length}</div>
            <div className={styles.statLabel}>Yêu cầu báo giá số lượng lớn</div>
          </div>
        </Card>
        <Card padding="md" className={styles.statCard}>
          <Icon name="shield" size={24} className={styles.statIcon} />
          <div>
            <div className={styles.statNumber}>
              {user.nfcStatus === 'VERIFIED' ? 'Đã duyệt' : 'Chưa'}
            </div>
            <div className={styles.statLabel}>Trạng thái CCCD NFC</div>
          </div>
        </Card>
      </div>

      {/* Đơn hàng gần đây */}
      <Card padding="md" className={styles.card}>
        <div className={styles.cardHeader}>
          <h3>Đơn hàng mua gần nhất</h3>
          <Link to={routes.account.orders} className={styles.viewAll}>
            Xem tất cả →
          </Link>
        </div>
        <div className={styles.recentOrders}>
          {orders.slice(0, 2).map((o) => (
            <div key={o.id} className={styles.recentRow}>
              <div>
                <strong>#{o.id}</strong> · {o.vendorName}
                <div className={styles.orderSub}>{o.items[0]?.name}</div>
              </div>
              <div className={styles.recentRight}>
                <Badge tone={o.status === 'DELIVERED' ? 'green' : 'amber'} size="sm">
                  {o.status}
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
