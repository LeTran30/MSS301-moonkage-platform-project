import { NavLink } from 'react-router-dom';
import { useSession } from '@/entities/user';
import { SellEntryLink } from '@/entities/vendor';
import { routes } from '@/shared/config/routes';
import styles from './AccountSidebar.module.css';

const items = [
  { to: routes.account.overview, label: 'Tổng quan', end: true },
  { to: routes.account.orders, label: 'Đơn hàng' },
  { to: routes.account.quoteRequests, label: 'Yêu cầu và báo giá' },
  { to: routes.account.notifications, label: 'Thông báo' },
  { to: routes.account.addresses, label: 'Địa chỉ giao hàng' },
  { to: routes.account.verifyNfc, label: 'Xác minh danh tính' },
  { to: routes.account.profile, label: 'Thông tin cá nhân' },
];

/** Left menu of the account pages (M6.x): who is logged in, the account sections, selling, logging out. */
export function AccountSidebar() {
  const { session, logout } = useSession();
  return (
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
        <SellEntryLink status={session?.vendorStatus ?? 'none'} className={styles.link} />
        <button type="button" className={styles.link} onClick={logout}>
          Đăng xuất
        </button>
      </nav>
    </aside>
  );
}
