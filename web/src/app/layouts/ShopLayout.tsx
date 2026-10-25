import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { AccountMenu, useAuth } from '../../features/auth';
import { CartLink } from '../../features/cart';
import { ProductSearchBox } from '../../features/catalog';
import { AreaPicker } from '../../features/delivery-area';
import { NotificationBell } from '../../features/notifications';
import { SellEntryLink } from '../../features/seller-onboarding';
import logoFull from '../../shared/assets/moonkage-logo.png';
import logoMark from '../../shared/assets/moonkage-mark.png';
import { routes } from '../../shared/config/routes';
import { strings } from '../../shared/config/strings';
import { useDisclosure } from '../../shared/ui';

/** "Đặt theo yêu cầu ▾": the description line and its ways in. */
function CustomOrderMenu() {
  const { open, toggle, close, ref, id } = useDisclosure();
  const location = useLocation();
  const active = location.pathname.startsWith(routes.customOrder) || location.pathname.startsWith(routes.suppliers);
  return (
    <div className="nav-menu" ref={ref}>
      <button type="button" className="nav-menu__toggle" aria-current={active ? 'page' : undefined} aria-expanded={open} aria-controls={id} onClick={toggle}>
        {strings.nav.custom}
        <svg className="mk-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div id={id} className="dropdown">
          <p className="dropdown__desc">{strings.nav.customDesc}</p>
          <Link to={routes.customOrder} className="dropdown__item" onClick={close}>
            {strings.nav.custom}
          </Link>
          <Link to={routes.newQuoteRequest} className="dropdown__item" onClick={close}>
            {strings.nav.newQuoteRequest} <small>{strings.nav.newQuoteRequestHint}</small>
          </Link>
          <Link to={routes.suppliers} className="dropdown__item" onClick={close}>
            {strings.nav.suppliers} <small>{strings.nav.suppliersHint}</small>
          </Link>
        </div>
      )}
    </div>
  );
}

/**
 * Frame of the buying area on the DS NavBar: the thin `brand` utility bar (delivery area left; selling and policy
 * right), the white main bar (logo emblem + "Moonkage", links, search, actions), the page, and the footer on
 * `brand` with the full logo (DS: the full logo sits on brand, its gold is too faint on white).
 */
export function ShopLayout() {
  const { session } = useAuth();
  const sellerStatus = session?.sellerStatus ?? 'none';

  return (
    <div className="shop">
      <header className="mk-nav">
        <div className="mk-topbar">
          <div className="mk-topbar__in">
            <AreaPicker />
            <nav aria-label={strings.nav.utility} className="topbar-links">
              <SellEntryLink status={sellerStatus} />
              <Link to={routes.policy}>{strings.nav.policy}</Link>
            </nav>
          </div>
        </div>
        <div className="mk-nav__in">
          <Link to={routes.home} className="mk-nav__brand" aria-label={`${strings.appName}, trang chủ`}>
            <img src={logoMark} alt="" />
            {strings.appName}
          </Link>
          <nav className="mk-nav__links" aria-label={strings.nav.main}>
            <NavLink to={routes.products}>
              {strings.nav.available}
            </NavLink>
            <CustomOrderMenu />
          </nav>
          <ProductSearchBox />
          <div className="mk-nav__actions">
            {session ? (
              <>
                <NotificationBell />
                <AccountMenu />
              </>
            ) : (
              <Link to={routes.login}>
                <svg className="mk-icon" viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
                </svg>
                {strings.nav.login}
              </Link>
            )}
            <CartLink />
          </div>
        </div>
      </header>

      <main className="shop__main">
        <Outlet />
      </main>

      <footer className="site-footer mk-on-brand">
        <div className="shop__inner site-footer__inner">
          <div className="site-footer__brand">
            <img src={logoFull} alt={strings.appName} className="site-footer__logo" />
            <p>{strings.footer.note}</p>
          </div>
          <nav className="site-footer__links" aria-label="Chân trang">
            <SellEntryLink status={sellerStatus} />
            <Link to={routes.policy}>{strings.nav.policy}</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
