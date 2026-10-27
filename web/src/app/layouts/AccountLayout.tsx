import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../features/auth';
import { SellEntryLink } from '../../features/seller-onboarding';
import { routes } from '../../shared/config/routes';
import styles from './AccountLayout.module.css';

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
    <div className={`${styles.layout} account-layout`}>
      <aside className={styles.sidebar} aria-label="Tài khoản">
        <div className={styles.user}>
          <span className={styles.initials} aria-hidden="true">
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
        <nav className={styles.nav}>
          {items.map((i) => (
            <NavLink key={i.to} to={i.to} end={i.end} className={styles.link}>
              {i.label}
            </NavLink>
          ))}
          <SellEntryLink status={session?.sellerStatus ?? 'none'} className={styles.link} />
          <button type="button" className={styles.link} onClick={logout}>
            Đăng xuất
          </button>
        </nav>
      </aside>
      <div className={`${styles.main} account-layout__main`}>
        <Outlet />
      </div>
    </div>
  );
}
