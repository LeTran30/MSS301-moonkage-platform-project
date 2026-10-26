import { Link } from 'react-router-dom';
import { routes } from '../../../shared/config/routes';
import { useDisclosure } from '../../../shared/ui';
import { useAuth } from '../model/useAuth';
import { authStrings } from '../strings';

/** Initials for the avatar: first letters of the last two words of the name. */
function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return words.slice(-2).map((w) => w[0]?.toUpperCase() ?? '').join('') || '?';
}

/**
 * "Tài khoản ▾" of the buying area. Selling is not in this menu: it has its own link in the utility bar.
 * Closes on choice, Escape or a click outside.
 */
export function AccountMenu() {
  const { session, logout } = useAuth();
  const { open, toggle, close, ref, id: menuId } = useDisclosure();

  if (!session) return null;
  const items = [
    { to: routes.account, label: authStrings.menu.overview },
    { to: routes.orders, label: authStrings.menu.orders },
    { to: routes.quoteRequests, label: authStrings.menu.quotes },
    { to: routes.addresses, label: authStrings.menu.addresses },
    { to: routes.verifyNfc, label: authStrings.menu.verify },
    { to: routes.profile, label: authStrings.menu.profile },
    ...(session.isAdmin ? [{ to: routes.admin, label: 'Quản trị' }] : []),
  ];

  return (
    <div className="account-menu" ref={ref}>
      <button type="button" className="account-menu__toggle" aria-expanded={open} aria-controls={menuId} onClick={toggle}>
        <span className="account-menu__initials" aria-hidden="true">
          {initialsOf(session.displayName)}
        </span>
        {authStrings.menu.account}
        <svg className="mk-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div id={menuId} className="dropdown dropdown--right">
          <p className="dropdown__head">{session.displayName}</p>
          {items.map((item) => (
            <Link key={item.to} to={item.to} className="dropdown__item" onClick={close}>
              {item.label}
            </Link>
          ))}
          <div className="dropdown__sep" />
          <button
            type="button"
            className="dropdown__item"
            onClick={() => {
              close();
              logout();
            }}
          >
            {authStrings.menu.logout}
          </button>
        </div>
      )}
    </div>
  );
}
