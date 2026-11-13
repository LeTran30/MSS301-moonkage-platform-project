import { Link, Outlet, useLocation } from 'react-router-dom';
import { routes } from '@/shared/config';
import { Card, Icon, type IconName } from '@/shared/ui';
import { useCurrentUser } from '@/entities/user';
import { useOrders, usePendingMaketOrderIds } from '@/entities/order';
import { useRequests } from '@/entities/request';
import { LayoutErrorBoundary } from '../LayoutErrorBoundary';
import styles from './AccountLayout.module.css';

export function AccountLayout() {
  const user = useCurrentUser();
  const location = useLocation();
  const orders = useOrders();
  const requests = useRequests();

  // Đếm việc cần bạn (M6.0): maket chưa duyệt, yêu cầu đang mở đã có báo giá.
  const pendingMaketOrderIds = usePendingMaketOrderIds(orders);
  const pendingMaketCount = pendingMaketOrderIds.length;
  // FR-22: đơn đặt riêng đã giao, còn chờ người mua trả phần còn lại.
  const remainderDue = orders.filter(
    (o) => o.type === 'BULK' && o.status === 'DELIVERED' && !o.remainingPaid,
  );
  const openRequestsCount = requests.filter(
    (r) => r.status === 'OPEN' && (r.quoteCount ?? 0) > 0,
  ).length;

  const navItems: Array<{
    path: string;
    label: string;
    icon: IconName;
    badge?: number;
  }> = [
    {
      path: routes.account.overview,
      label: 'Tổng quan tài khoản',
      icon: 'dashboard',
    },
    { path: routes.account.orders, label: 'Đơn hàng của tôi', icon: 'package' },
    { path: routes.account.wallet, label: 'Ví của tôi', icon: 'wallet' },
    {
      path: routes.account.messages,
      label: 'Tin nhắn với shop',
      icon: 'message',
    },
    {
      path: routes.account.requests,
      label: 'Yêu cầu và báo giá',
      icon: 'file',
      badge: openRequestsCount,
    },
    {
      path: routes.account.addresses,
      label: 'Địa chỉ giao hàng',
      icon: 'mapPin',
    },
    {
      path: routes.account.verify,
      label: 'Xác minh danh tính NFC',
      icon: 'shield',
    },
    { path: routes.account.profile, label: 'Thông tin cá nhân', icon: 'user' },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Tài khoản của tôi</h1>
        <p className={styles.subtitle}>
          Quản lý đơn hàng, theo dõi báo giá xưởng và thông tin cá nhân.
        </p>
      </div>

      <div className={styles.grid}>
        {/* Sidebar tài khoản */}
        <aside className={styles.sidebar}>
          <Card padding="sm" className={styles.userCard}>
            <div className={styles.avatar}>
              <Icon name="user" size={24} />
            </div>
            <div>
              <div className={styles.name}>{user.name}</div>
              <div className={styles.email}>{user.email}</div>
            </div>
          </Card>

          {/* việc đang chờ người mua, hiện trên mọi trang tài khoản */}
          {(pendingMaketCount > 0 || openRequestsCount > 0 || remainderDue.length > 0) && (
            <Card tone="gold" padding="sm" className={styles.actionNeededCard}>
              <div className={styles.actionNeededTitle}>
                Việc cần bạn xử lý
              </div>
              <div className={styles.actionList}>
                {pendingMaketCount > 0 && (
                  <Link
                    to={
                      pendingMaketCount === 1
                        ? routes.account.orderMaket(pendingMaketOrderIds[0])
                        : routes.account.orders
                    }
                    className={styles.actionItem}
                  >
                    • {pendingMaketCount} maket thiết kế đang chờ bạn duyệt
                  </Link>
                )}
                {remainderDue.length > 0 && (
                  <Link
                    to={
                      remainderDue.length === 1
                        ? routes.account.order(remainderDue[0].id)
                        : routes.account.orders
                    }
                    className={styles.actionItem}
                  >
                    • {remainderDue.length} đơn đặt riêng đã giao, chờ bạn thanh toán phần còn lại
                  </Link>
                )}
                {openRequestsCount > 0 && (
                  <Link to={routes.account.requests} className={styles.actionItem}>
                    • {openRequestsCount} yêu cầu có báo giá mới từ xưởng
                  </Link>
                )}
              </div>
            </Card>
          )}

          <nav className={styles.nav}>
            {navItems.map((it) => {
              const isActive = location.pathname === it.path;
              return (
                <Link
                  key={it.path}
                  to={it.path}
                  className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                >
                  <Icon name={it.icon} size={18} />
                  <span>{it.label}</span>
                  {it.badge !== undefined && it.badge > 0 && (
                    <span className={styles.badge}>{it.badge}</span>
                  )}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Nội dung trang */}
        <section className={styles.content}>
          <LayoutErrorBoundary areaName="Tài Khoản Cá Nhân">
            <Outlet />
          </LayoutErrorBoundary>
        </section>
      </div>
    </div>
  );
}
