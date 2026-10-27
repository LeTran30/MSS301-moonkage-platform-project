import { Link, NavLink, Outlet, ScrollRestoration } from 'react-router-dom';
import { useApplications } from '../../features/admin';
import { useAuth } from '../../features/auth';
import logoMark from '../../shared/assets/moonkage-mark.png';
import { routes } from '../../shared/config/routes';
import styles from './AdminLayout.module.css';

/** Quản trị: its own bar and menu, for admin accounts only. */
export function AdminLayout() {
  const { session } = useAuth();
  const apps = useApplications();
  if (!session?.isAdmin) {
    return (
      <div className="shop__inner page page--narrow">
        <h1 className="title-text">Khu quản trị chỉ dành cho quản trị viên</h1>
        <Link to={routes.home} className="mk-btn mk-btn--primary">
          Về trang mua hàng
        </Link>
      </div>
    );
  }
  const pending = apps.kind === 'loaded' ? apps.data.filter((a) => a.state === 'pending').length : 0;
  const link = (to: string, label: string, end = false) => (
    <NavLink to={to} end={end} className={styles.adminLink}>
      {label}
    </NavLink>
  );
  return (
    <div className="shop">
      <ScrollRestoration />
      <header className={`mk-nav ${styles.adminBar}`}>
        <div className="mk-nav__in">
          <Link to={routes.admin} className="mk-nav__brand">
            <img src={logoMark} alt="" />
            Moonkage <span className={styles.adminZone}>Quản trị</span>
          </Link>
          <span className={styles.adminUser}>{session.displayName}</span>
        </div>
        <nav className={`mk-nav__in ${styles.adminNav}`} aria-label="Quản trị">
          {link(routes.admin, 'Tổng quan', true)}
          {link(routes.adminSellers, pending ? `Người bán (${pending})` : 'Người bán')}
          {link(routes.adminProducts, 'Sản phẩm')}
          {link(routes.adminMoney, 'Tiền')}
          {link(routes.adminDisputes, 'Khiếu nại')}
          {link(routes.adminConfig, 'Cấu hình')}
          <span className={styles.spacer} />
          <Link to={routes.home} className={styles.adminLink}>
            ↩ Về trang mua hàng
          </Link>
        </nav>
      </header>
      <main className="shop__main shop__inner">
        <Outlet />
      </main>
    </div>
  );
}
