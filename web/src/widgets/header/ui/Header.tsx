import { Link, NavLink, useLocation } from 'react-router-dom';
import { CartLink } from '@/entities/cart';
import { NotificationBell } from '@/entities/notification';
import { useCurrentUser } from '@/entities/user';
import { SellEntryLink } from '@/entities/vendor';
import { AreaPicker } from '@/features/choose-delivery-area';
import { ProductSearchBox } from '@/features/search-products';
import logoMark from '@/shared/assets/moonkage-mark.png';
import { routes } from '@/shared/config/routes';
import { useDisclosure } from '@/shared/lib';
import { AccountMenu } from './AccountMenu';
import styles from './Header.module.css';

const headerStrings = {
  appName: 'Moonkage',
  utility: 'Tiện ích',
  main: 'Điều hướng chính',
  available: 'Sản phẩm có sẵn',
  custom: 'Đặt theo yêu cầu',
  customDesc: 'Hộp và bánh làm riêng, đặt số lượng lớn, in tên hoặc biểu trưng.',
  newQuoteRequest: 'Gửi yêu cầu báo giá',
  newQuoteRequestHint: 'Các nhà cung cấp phù hợp sẽ gửi đề xuất',
  vendors: 'Tìm nhà cung cấp nhận đặt riêng',
  vendorsHint: 'Xem xưởng và làm việc trực tiếp',
  policy: 'Quy định và giải quyết khiếu nại',
  login: 'Đăng nhập',
} as const;

/** "Đặt theo yêu cầu ▾": the description line and its ways in. */
function CustomOrderMenu() {
  const { open, toggle, close, ref, id } = useDisclosure();
  const location = useLocation();
  const active = location.pathname.startsWith(routes.base.customOrder) || location.pathname.startsWith(routes.base.vendorDirectory);
  return (
    <div className="nav-menu" ref={ref}>
      <button type="button" className="nav-menu__toggle" aria-current={active ? 'page' : undefined} aria-expanded={open} aria-controls={id} onClick={toggle}>
        {headerStrings.custom}
        <svg className="mk-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div id={id} className="dropdown">
          <p className="dropdown__desc">{headerStrings.customDesc}</p>
          <Link to={routes.base.customOrder} className="dropdown__item" onClick={close}>
            {headerStrings.custom}
          </Link>
          <Link to={routes.base.newQuoteRequest} className="dropdown__item" onClick={close}>
            {headerStrings.newQuoteRequest} <small>{headerStrings.newQuoteRequestHint}</small>
          </Link>
          <Link to={routes.base.vendorDirectory} className="dropdown__item" onClick={close}>
            {headerStrings.vendors} <small>{headerStrings.vendorsHint}</small>
          </Link>
        </div>
      )}
    </div>
  );
}

export function Header() {
  const session = useCurrentUser();
  const vendorStatus = session?.vendorStatus ?? 'none';

  return (
    <header className={`${styles.nav} mk-nav`}>
      <div className={`${styles.topbar} mk-topbar`}>
        <div className={`${styles.topbarInner} mk-topbar__in`}>
          <AreaPicker />
          <nav aria-label={headerStrings.utility} className={`${styles.topbarLinks} topbar-links`}>
            <SellEntryLink status={vendorStatus} />
            <Link to={routes.base.policy}>{headerStrings.policy}</Link>
          </nav>
        </div>
      </div>
      <div className={`${styles.navInner} mk-nav__in`}>
        <Link to={routes.base.home} className={`${styles.brand} mk-nav__brand`} aria-label={`${headerStrings.appName}, trang chủ`}>
          <img src={logoMark} alt="" className={styles.brandLogo} />
          {headerStrings.appName}
        </Link>
        <nav className={`${styles.links} mk-nav__links`} aria-label={headerStrings.main}>
          <NavLink to={routes.base.products}>{headerStrings.available}</NavLink>
          <CustomOrderMenu />
        </nav>
        <ProductSearchBox />
        <div className={`${styles.actions} mk-nav__actions`}>
          {session ? (
            <>
              <NotificationBell />
              <AccountMenu />
            </>
          ) : (
            <Link to={routes.auth.login}>
              <svg className="mk-icon" viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
              </svg>
              {headerStrings.login}
            </Link>
          )}
          <CartLink />
        </div>
      </div>
    </header>
  );
}
