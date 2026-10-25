import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../features/auth';
import { useSellerProfile } from '../../features/seller';
import logoMark from '../../shared/assets/moonkage-mark.png';
import { routes } from '../../shared/config/routes';
import { LoadingState, StatusBadge } from '../../shared/ui';

const stateLabel = { pending: 'Hồ sơ chờ duyệt', 'needs-more': 'Hồ sơ cần bổ sung', approved: 'Đã duyệt · chưa đóng phí', open: 'Đang mở bán', rejected: 'Hồ sơ bị từ chối' } as const;

/**
 * Kênh người bán: its own bar (logo + zone name + shop state) and menu. Orders, requests, products and money only
 * appear once the shop is open (FR-27). An account without a seller profile is sent to "Bán hàng trên Moonkage".
 */
export function SellerLayout() {
  const { session } = useAuth();
  const profile = useSellerProfile();
  if (!session || session.sellerStatus === 'none') {
    return (
      <div className="shop__inner page page--narrow">
        <h1 className="title-text">Kênh người bán chỉ dành cho người bán</h1>
        <p className="lead-text">Tài khoản này chưa có hồ sơ người bán.</p>
        <Link to={routes.sellIntro} className="mk-btn mk-btn--primary">
          Xem Bán hàng trên Moonkage
        </Link>
      </div>
    );
  }
  if (profile.kind !== 'loaded') return <LoadingState />;
  const p = profile.data;
  const open = p.state === 'open';
  const link = (to: string, label: string, end = false) => (
    <NavLink to={to} end={end} className="seller-nav__link">
      {label}
    </NavLink>
  );

  return (
    <div className="shop">
      <header className="mk-nav seller-bar">
        <div className="mk-nav__in">
          <Link to={routes.sellerChannel} className="mk-nav__brand">
            <img src={logoMark} alt="" />
            Moonkage <span className="seller-bar__zone">Kênh người bán</span>
          </Link>
          <span className="seller-bar__shop">
            {p.shopName} <StatusBadge tone={open ? 'ok' : 'soft'}>{stateLabel[p.state]}</StatusBadge>
          </span>
        </div>
        <nav className="mk-nav__in seller-nav" aria-label="Kênh người bán">
          {link(routes.sellerChannel, 'Tổng quan', true)}
          {open && link(routes.sellerOrders, 'Đơn hàng')}
          {open && p.ways.custom && link(routes.sellerRequests, 'Yêu cầu báo giá')}
          {open && p.ways.shop && link(routes.sellerProducts, 'Sản phẩm')}
          {open && link(routes.sellerMoney, 'Tiền')}
          {link(routes.sellerSettings, 'Cài đặt bán hàng')}
          <span className="seller-nav__spacer" />
          {link(routes.sellerNotifications, 'Thông báo')}
          <Link to={routes.home} className="seller-nav__link">
            ↩ Về trang mua hàng
          </Link>
        </nav>
      </header>
      <main className="shop__main shop__inner">
        <Outlet context={{ profile: p, reload: profile.reload }} />
      </main>
    </div>
  );
}
