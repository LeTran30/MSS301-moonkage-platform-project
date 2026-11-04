import { Link, useLocation } from 'react-router-dom';
import { routes } from '@/shared/config';
import { Icon, type IconName } from '@/shared/ui';
import styles from './AdminSidebar.module.css';

type NavItem = {
  title: string;
  path: string;
  icon: IconName;
  badge?: number;
};

export function AdminSidebar() {
  const location = useLocation();

  // Sitemap IA: Quản trị (Q): Tổng quan · Người bán · Sản phẩm · Tiền · Khiếu nại · Cấu hình
  // Kèm số việc chờ của từng hàng theo FR-45, FR-47, FR-48, FR-49
  const items: NavItem[] = [
    { title: 'Tổng quan điều hành', path: routes.admin.overview, icon: 'dashboard' },
    { title: 'Duyệt người bán', path: routes.admin.vendors, icon: 'store', badge: 1 },
    { title: 'Kiểm duyệt sản phẩm', path: routes.admin.products, icon: 'cake' },
    { title: 'Duyệt giải ngân cọc', path: routes.admin.disbursements, icon: 'wallet', badge: 1 },
    { title: 'Chuyển tiền người bán', path: routes.admin.payouts, icon: 'creditCard' },
    { title: 'Đối soát sàn', path: routes.admin.reconciliation, icon: 'receipt' },
    { title: 'Xử lý khiếu nại', path: routes.admin.disputes, icon: 'alert', badge: 1 },
    { title: 'Danh mục Vỏ & Nhân', path: routes.admin.cakeCatalog, icon: 'layers' },
    { title: 'Cấu hình biểu phí', path: routes.admin.interprovinceFee, icon: 'settings' },
  ];

  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>
        <div className={styles.zoneTag}>QUẢN TRỊ HỆ THỐNG</div>
        <div className={styles.operatorTitle}>Đội Vận Hành Moonkage</div>
      </div>

      <nav className={styles.nav}>
        {items.map((it) => {
          const isActive = location.pathname === it.path || (it.path !== routes.admin.overview && location.pathname.startsWith(it.path));
          return (
            <Link
              key={it.path}
              to={it.path}
              className={`${styles.navLink} ${isActive ? styles.active : ''}`}
            >
              <Icon name={it.icon} size={18} />
              <span className={styles.navLabel}>{it.title}</span>
              {it.badge !== undefined && it.badge > 0 && <span className={styles.badge}>{it.badge}</span>}
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
