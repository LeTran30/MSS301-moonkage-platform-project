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

type Props = {
  /** Gọi khi người dùng chọn một mục (dùng để đóng drawer trên mobile). */
  onNavigate?: () => void;
  /** Ẩn phần đầu (nhãn khu + tên đội vận hành) — dùng khi nằm trong drawer đã có tiêu đề. */
  showHeader?: boolean;
};

/**
 * Nội dung menu quản trị — dùng chung cho sidebar cột cố định (desktop) và
 * drawer trượt (mobile).
 */
export function AdminSidebarContent({ onNavigate, showHeader = true }: Props = {}) {
  const location = useLocation();

  // Sitemap IA: Quản trị (Q): Tổng quan · Người bán · Sản phẩm · Tiền · Khiếu nại · Cấu hình
  // Kèm số việc chờ của từng hàng theo FR-45, FR-47, FR-48, FR-49
  const items: NavItem[] = [
    {
      title: 'Tổng quan điều hành',
      path: routes.admin.overview,
      icon: 'dashboard',
    },
    {
      title: 'Duyệt người bán',
      path: routes.admin.vendors,
      icon: 'store',
      badge: 1,
    },
    { title: 'Kiểm duyệt sản phẩm', path: routes.admin.products, icon: 'cake' },
    {
      title: 'Duyệt giải ngân cọc',
      path: routes.admin.disbursements,
      icon: 'wallet',
      badge: 1,
    },
    {
      title: 'Chuyển tiền người bán',
      path: routes.admin.payouts,
      icon: 'creditCard',
    },
    {
      title: 'Rút tiền từ ví',
      path: routes.admin.withdrawals,
      icon: 'wallet',
    },
    {
      title: 'Đối soát sàn',
      path: routes.admin.reconciliation,
      icon: 'receipt',
    },
    {
      title: 'Xử lý khiếu nại',
      path: routes.admin.disputes,
      icon: 'alert',
      badge: 1,
    },
    {
      title: 'Danh mục vỏ và nhân',
      path: routes.admin.cakeCatalog,
      icon: 'layers',
    },
    {
      title: 'Cấu hình biểu phí',
      path: routes.admin.interprovinceFee,
      icon: 'settings',
    },
  ];

  return (
    <>
      {showHeader && (
        <div className={styles.header}>
          <div className={styles.zoneTag}>QUẢN TRỊ HỆ THỐNG</div>
          <div className={styles.operatorTitle}>Đội Vận Hành Moonkage</div>
        </div>
      )}

      <nav className={styles.nav} aria-label="Điều hướng quản trị">
        {items.map((it) => {
          const isActive =
            location.pathname === it.path ||
            (it.path !== routes.admin.overview && location.pathname.startsWith(it.path));
          return (
            <Link
              key={it.path}
              to={it.path}
              className={`${styles.navLink} ${isActive ? styles.active : ''}`}
              aria-current={isActive ? 'page' : undefined}
              onClick={onNavigate}
            >
              <Icon name={it.icon} size={18} />
              <span className={styles.navLabel}>{it.title}</span>
              {it.badge !== undefined && it.badge > 0 && (
                <span className={styles.badge}>{it.badge}</span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className={styles.footerLink}>
        <Link to={routes.base.home} className={styles.backHomeBtn} onClick={onNavigate}>
          <Icon name="arrowLeft" size={16} /> Về trang mua hàng
        </Link>
      </div>
    </>
  );
}

/**
 * Sidebar cột cố định của khu vực quản trị (chỉ hiện từ breakpoint `lg` trở lên).
 * Ở màn hình hẹp, `SidebarDrawer` hiển thị cùng nội dung trong drawer trượt.
 */
export function AdminSidebar(props: Props = {}) {
  return (
    <aside className={styles.sidebar} aria-label="Quản trị hệ thống">
      <AdminSidebarContent {...props} />
    </aside>
  );
}
