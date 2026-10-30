import { Link, NavLink } from 'react-router-dom';
import { useVendorContext } from '@/entities/vendor';
import logoMark from '@/shared/assets/moonkage-mark.png';
import { routes } from '@/shared/config/routes';
import { StatusBadge } from '@/shared/ui';
import styles from './VendorBar.module.css';

const stateLabel = { pending: 'Hồ sơ chờ duyệt', 'needs-more': 'Hồ sơ cần bổ sung', approved: 'Đã duyệt · chưa đóng phí', open: 'Đang mở bán', rejected: 'Hồ sơ bị từ chối' } as const;

/**
 * Bar of Kênh người bán: logo + zone name + shop state, and the menu. Orders, requests, products and money only
 * appear once the shop is open (FR-27).
 */
export function VendorBar() {
  const profile = useVendorContext();
  const open = profile.state === 'open';
  const link = (to: string, label: string, end = false) => (
    <NavLink to={to} end={end} className={styles.vendorLink}>
      {label}
    </NavLink>
  );

  return (
    <header className={`mk-nav ${styles.vendorBar}`}>
      <div className="mk-nav__in">
        <Link to={routes.vendor.overview} className="mk-nav__brand">
          <img src={logoMark} alt="" />
          Moonkage <span className={styles.vendorZone}>Kênh người bán</span>
        </Link>
        <span className={styles.vendorShop}>
          {profile.shopName} <StatusBadge tone={open ? 'ok' : 'soft'}>{stateLabel[profile.state]}</StatusBadge>
        </span>
      </div>
      <nav className={`mk-nav__in ${styles.vendorNav}`} aria-label="Kênh người bán">
        {link(routes.vendor.overview, 'Tổng quan', true)}
        {open && (
          <>
            {link(routes.vendor.orders, 'Đơn hàng')}
            {link(routes.vendor.requests, 'Báo giá')}
            {link(routes.vendor.products, 'Sản phẩm')}
            {link(routes.vendor.money, 'Dòng tiền')}
          </>
        )}
        {link(routes.vendor.settings, 'Hồ sơ xưởng')}
        {link(routes.vendor.fee, 'Biểu phí')}
        {link(routes.vendor.notifications, 'Thông báo')}
        <span className={styles.spacer} />
        <Link to={routes.base.home} className={styles.vendorLink}>
          ↩ Về trang mua hàng
        </Link>
      </nav>
    </header>
  );
}
