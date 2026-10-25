import { Link } from 'react-router-dom';
import { routes } from '../../../shared/config/routes';
import { useNotifications } from '../model/useNotifications';
import { notificationStrings } from '../strings';

/** Bell of the buying area (DS NavBar action, icon only, read out by its label): buyer notifications only. */
export function NotificationBell() {
  const state = useNotifications();
  const unread = state.kind === 'loaded' ? state.data.filter((n) => n.unread).length : 0;
  return (
    <Link to={routes.notifications} aria-label={notificationStrings.bellLabel(unread)}>
      <svg className="mk-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6 9a6 6 0 0 1 12 0c0 6 2.5 7.5 2.5 7.5h-17S6 15 6 9Z" />
        <path d="M10 20a2 2 0 0 0 4 0" />
      </svg>
      {unread > 0 && (
        <span className="mk-nav__count mk-num" aria-hidden="true">
          {unread}
        </span>
      )}
    </Link>
  );
}
