import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../features/auth';
import { SellEntryLink } from '../../features/seller-onboarding';
import { routes } from '../../shared/config/routes';

const items = [
  { to: routes.account, label: 'Tổng quan', end: true },
  { to: routes.orders, label: 'Đơn hàng' },
  { to: routes.quoteRequests, label: 'Yêu cầu và báo giá' },
  { to: routes.addresses, label: 'Địa chỉ giao hàng' },
  { to: routes.verifyNfc, label: 'Xác minh danh tính' },
  { to: routes.profile, label: 'Thông tin cá nhân' },
];

/** The account pages (M6.x): a left menu, the page on the right. */
export function AccountLayout() {
  const { session, logout } = useAuth();
  return (
    <div className="shop__inner account-layout">
      <aside className="account-nav" aria-label="Tài khoản">
        <div className="account-nav__user">
          <span className="account-menu__initials" aria-hidden="true">
            {(session?.displayName ?? '?')
              .split(/\s+/)
              .slice(-2)
              .map((w) => w[0])
              .join('')}
          </span>
          <span>
            <strong>{session?.displayName}</strong>
            <br />
            <span className="muted">{session?.accountId}</span>
          </span>
        </div>
        <nav>
          {items.map((i) => (
            <NavLink key={i.to} to={i.to} end={i.end} className="account-nav__link">
              {i.label}
            </NavLink>
          ))}
          <SellEntryLink status={session?.sellerStatus ?? 'none'} className="account-nav__link" />
          <button type="button" className="account-nav__link" onClick={logout}>
            Đăng xuất
          </button>
        </nav>
      </aside>
      <div className="account-layout__main">
        <Outlet />
      </div>
    </div>
  );
}
