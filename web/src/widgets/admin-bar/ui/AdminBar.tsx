import { Link, NavLink } from 'react-router-dom';
import { useCurrentUser } from '@/entities/user';
import { useApplications } from '@/entities/vendor';
import logoMark from '@/shared/assets/moonkage-mark.png';
import { routes } from '@/shared/config/routes';
import styles from './AdminBar.module.css';

/** Bar of Quản trị: logo + zone name + who is logged in, and the menu with the count of vendor applications to review. */
export function AdminBar() {
  const session = useCurrentUser();
  const apps = useApplications();
  const pending = apps.kind === 'loaded' ? apps.data.filter((a) => a.state === 'pending').length : 0;
  const link = (to: string, label: string, end = false) => (
    <NavLink to={to} end={end} className={styles.adminLink}>
      {label}
    </NavLink>
  );
  return (
    <header className={`mk-nav ${styles.adminBar}`}>
      <div className="mk-nav__in">
        <Link to={routes.admin.overview} className="mk-nav__brand">
          <img src={logoMark} alt="" />
          Moonkage <span className={styles.adminZone}>Quản trị</span>
        </Link>
        <span className={styles.adminUser}>{session?.displayName}</span>
      </div>
      <nav className={`mk-nav__in ${styles.adminNav}`} aria-label="Quản trị">
        {link(routes.admin.overview, 'Tổng quan', true)}
        {link(routes.admin.vendors, pending ? `Người bán (${pending})` : 'Người bán')}
        {link(routes.admin.products, 'Sản phẩm')}
        {link(routes.admin.money, 'Tiền')}
        {link(routes.admin.disputes, 'Khiếu nại')}
        {link(routes.admin.config, 'Cấu hình')}
        <span className={styles.spacer} />
        <Link to={routes.base.home} className={styles.adminLink}>
          ↩ Về trang mua hàng
        </Link>
      </nav>
    </header>
  );
}
