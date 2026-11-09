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
  /** Vẫn hiện khi Shop chưa mở bán (hồ sơ đang xét hoặc chưa đóng phí). */
  beforeLaunch?: boolean;
};

type Props = {
  hasShop?: boolean;
  acceptsCustomOrders?: boolean;
  /**
   * Shop đã mở bán chưa (`canOperate`). Trước khi mở bán, kênh chỉ có trạng
   * thái hồ sơ, hồ sơ pháp lý và thông báo (B1.0).
   */
  canOperate?: boolean;
  /** Gọi khi người dùng chọn một mục (dùng để đóng drawer trên mobile). */
  onNavigate?: () => void;
  /** Ẩn phần đầu (nhãn khu + trạng thái) — dùng khi nằm trong drawer đã có tiêu đề. */
  showHeader?: boolean;
};

/**
 * Nội dung menu kênh người bán — dùng chung cho sidebar cột cố định (desktop)
 * và drawer trượt (mobile).
 */
export function VendorSidebarContent({
  hasShop = true,
  acceptsCustomOrders = true,
  canOperate = true,
  onNavigate,
  showHeader = true,
}: Props) {
  const location = useLocation();

  // Sitemap IA: Kênh người bán: Tổng quan · Đơn hàng · Yêu cầu báo giá · Sản phẩm · Tiền · Cài đặt bán hàng
  const items: NavItem[] = [
    {
      title: 'Tổng quan bán hàng',
      path: routes.vendor.overview,
      icon: 'dashboard',
      beforeLaunch: true,
    },
    { title: 'Đơn hàng của Shop', path: routes.vendor.orders, icon: 'package' },
    { title: 'Tin nhắn khách hàng', path: routes.vendor.messages, icon: 'message' },
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
    {
      title: 'Dòng tiền & Giải ngân',
      path: routes.vendor.disbursements,
      icon: 'wallet',
    },
    {
      title: 'Đối soát tài khoản',
      path: routes.vendor.reconciliation,
      icon: 'receipt',
    },
    {
      title: 'Cài đặt bán hàng',
      path: routes.vendor.settings,
      icon: 'settings',
    },
    {
      title: 'Hồ sơ pháp lý',
      path: routes.vendor.legal,
      icon: 'shield',
      condition: !canOperate, // Khi đã mở bán, mục này nằm trong Cài đặt bán hàng.
      beforeLaunch: true,
    },
    // Hộp thư thuộc về chính tài khoản đã đăng nhập, nên xưởng mở từ đây thay vì
    // cần một hộp thư riêng.
    {
      title: 'Thông báo cửa hàng',
      path: routes.base.notifications,
      icon: 'bell',
      beforeLaunch: true,
    },
  ];

  return (
    <>
      {showHeader && (
        <div className={styles.header}>
          <div className={styles.zoneTag}>KÊNH NGƯỜI BÁN</div>
          <div className={styles.shopStatus}>
            {canOperate ? (
              <>
                <span className={styles.onlineDot} /> Đang mở bán
              </>
            ) : (
              <>
                <span className={styles.pendingDot} /> Chưa mở bán
              </>
            )}
          </div>
        </div>
      )}

      <nav className={styles.nav} aria-label="Điều hướng kênh người bán">
        {items
          .filter((it) => it.condition !== false && (canOperate || it.beforeLaunch))
          .map((it) => {
            const isActive =
              location.pathname === it.path ||
              (it.path !== routes.vendor.overview && location.pathname.startsWith(it.path));
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
                {it.badge && <span className={styles.badge}>{it.badge}</span>}
              </Link>
            );
          })}
      </nav>

      <div className={styles.footerLink}>
        <Link to={routes.base.home} className={styles.backHomeBtn} onClick={onNavigate}>
          <Icon name="arrowLeft" size={16} /> Về kênh mua sắm
        </Link>
      </div>
    </>
  );
}

/**
 * Sidebar cột cố định của kênh người bán (chỉ hiện từ breakpoint `lg` trở lên).
 * Ở màn hình hẹp, `SidebarDrawer` hiển thị cùng nội dung trong drawer trượt.
 */
export function VendorSidebar(props: Props) {
  return (
    <aside className={styles.sidebar} aria-label="Kênh người bán">
      <VendorSidebarContent {...props} />
    </aside>
  );
}
