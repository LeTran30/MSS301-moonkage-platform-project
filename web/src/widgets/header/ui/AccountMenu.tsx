import { Link } from 'react-router-dom';
import { useSession, userStrings } from '@/entities/user';
import { routes } from '@/shared/config/routes';
import { useDisclosure } from '@/shared/lib';
import styles from './AccountMenu.module.css';

/**
 * "Tài khoản ▾" of the buying area. Selling is not in this menu: it has its own link in the utility bar.
 * Closes on choice, Escape or a click outside.
 */
export function AccountMenu() {
  const { session, logout } = useSession();
  const { open, toggle, close, ref, id: menuId } = useDisclosure();

  if (!session) return null;
  const items = [
    { to: routes.account.overview, label: userStrings.menu.overview },
    { to: routes.account.orders, label: userStrings.menu.orders },
    { to: routes.account.quoteRequests, label: userStrings.menu.quotes },
    { to: routes.account.addresses, label: userStrings.menu.addresses },
    { to: routes.account.verifyNfc, label: userStrings.menu.verify },
    { to: routes.account.profile, label: userStrings.menu.profile },
    ...(session.isAdmin ? [{ to: routes.admin.overview, label: 'Quản trị' }] : []),
  ];

  return (
    <div className={styles.menu} ref={ref}>
      <button
        type="button"
        className={styles.toggle}
        aria-label={userStrings.menu.account}
        aria-expanded={open}
        aria-controls={menuId}
        onClick={toggle}
      >
        <svg className="mk-icon" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
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
            {userStrings.menu.logout}
          </button>
        </div>
      )}
    </div>
  );
}
