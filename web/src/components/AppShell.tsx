import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { routes } from '../routes';
import { strings } from '../strings';

/** Header on `night` and the page area; every logged-in page renders inside it. */
export function AppShell() {
  const { session, logout } = useAuth();

  return (
    <>
      <header className="app-header mk-on-night">
        <div className="app-header__inner">
          <span className="brand-text">{strings.appName}</span>
          <nav aria-label={strings.nav.main}>
            <NavLink to={routes.verifyNfc} className="app-header__link">
              {strings.nav.verifyNfc}
            </NavLink>
          </nav>
          <div className="app-header__user">
            <span className="app-header__name">{session?.displayName}</span>
            <button type="button" className="mk-btn mk-btn--sm app-header__logout" onClick={logout}>
              {strings.nav.logout}
            </button>
          </div>
        </div>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </>
  );
}
