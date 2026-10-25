import { Link, NavLink, Outlet } from 'react-router-dom';
import { useApplications } from '../../features/admin';
import { useAuth } from '../../features/auth';
import logoMark from '../../shared/assets/moonkage-mark.png';
import { routes } from '../../shared/config/routes';

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
    <NavLink to={to} end={end} className="seller-nav__link">
      {label}
    </NavLink>
  );
  return (
    <div className="shop">
      <header className="mk-nav seller-bar">
        <div className="mk-nav__in">
          <Link to={routes.admin} className="mk-nav__brand">
            <img src={logoMark} alt="" />
            Moonkage <span className="seller-bar__zone">Quản trị</span>
          </Link>
          <span className="seller-bar__shop">{session.displayName}</span>
        </div>
        <nav className="mk-nav__in seller-nav" aria-label="Quản trị">
          {link(routes.admin, 'Tổng quan', true)}
          {link(routes.adminSellers, pending ? `Người bán (${pending})` : 'Người bán')}
          {link(routes.adminProducts, 'Sản phẩm')}
          {link(routes.adminMoney, 'Tiền')}
          {link(routes.adminDisputes, 'Khiếu nại')}
          {link(routes.adminConfig, 'Cấu hình')}
          <span className="seller-nav__spacer" />
          <Link to={routes.home} className="seller-nav__link">
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
