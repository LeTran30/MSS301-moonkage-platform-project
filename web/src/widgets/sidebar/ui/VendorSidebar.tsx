import { Link, useLocation } from 'react-router-dom';
import { routes } from '@/shared/config';
import { Icon, type IconName } from '@/shared/ui';
import styles from './VendorSidebar.module.css';

type NavItem = {
  title: string;
  path: string;
  icon: IconName;
  badge?: string | number;
  condition?: boolean;
};

type Props = {
  hasShop?: boolean;
  acceptsCustomOrders?: boolean;
};

export function VendorSidebar({ hasShop = true, acceptsCustomOrders = true }: Props) {
  const location = useLocation();

  // Sitemap IA: Kênh người bán: Tổng quan · Đơn hàng · Yêu cầu báo giá · Sản phẩm · Tiền · Cài đặt bán hàng
  const items: NavItem[] = [
    { title: 'Tổng quan bán hàng', path: routes.vendor.overview, icon: 'dashboard' },
    { title: 'Đơn hàng của Shop', path: routes.vendor.orders, icon: 'package' },
    {
      title: 'Yêu cầu báo giá',
      path: routes.vendor.requests,
      icon: 'file',
      condition: acceptsCustomOrders, // Ẩn khi không nhận đặt hàng (IA)
    },
    {
      title: 'Quản lý sản phẩm',
      path: routes.vendor.products,
      icon: 'cake',
      condition: hasShop, // Ẩn khi không có Shop (IA)
    },
    { title: 'Dòng tiền & Giải ngân', path: routes.vendor.disbursements, icon: 'wallet' },
    { title: 'Đối soát tài khoản', path: routes.vendor.reconciliation, icon: 'receipt' },
    { title: 'Cài đặt bán hàng', path: routes.vendor.settings, icon: 'settings' },
    // M6.6 dùng chung cho người mua và chủ người bán (IA: "Người mua, Chủ người bán"):
    // hộp thư thuộc về chính tài khoản đã đăng nhập, nên xưởng mở từ đây thay vì
    // cần một hộp thư riêng.
    { title: 'Thông báo cửa hàng', path: routes.base.notifications, icon: 'bell' },
  ];

  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>
        <div className={styles.zoneTag}>KÊNH NGƯỜI BÁN</div>
        <div className={styles.shopStatus}>
          <span className={styles.onlineDot} /> Đang hoạt động
        </div>
      </div>

      <nav className={styles.nav}>
        {items
          .filter((it) => it.condition !== false)
          .map((it) => {
            const isActive = location.pathname === it.path || (it.path !== routes.vendor.overview && location.pathname.startsWith(it.path));
            return (
              <Link
                key={it.path}
                to={it.path}
                className={`${styles.navLink} ${isActive ? styles.active : ''}`}
              >
                <Icon name={it.icon} size={18} />
                <span className={styles.navLabel}>{it.title}</span>
                {it.badge && <span className={styles.badge}>{it.badge}</span>}
              </Link>
            );
          })}
      </nav>

      <div className={styles.footerLink}>
        <Link to={routes.base.home} className={styles.backHomeBtn}>
          <Icon name="arrowLeft" size={16} /> ↩ Về trang mua hàng
        </Link>
      </div>
    </aside>
  );
}
