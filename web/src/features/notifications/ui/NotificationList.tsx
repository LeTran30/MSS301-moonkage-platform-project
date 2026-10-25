import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ErrorState, LoadingState } from '../../../shared/ui';
import { useNotifications } from '../model/useNotifications';
import { notificationStrings } from '../strings';

export function NotificationList() {
  const state = useNotifications();
  const [allRead, setAllRead] = useState(false);

  if (state.kind === 'loading') return <LoadingState />;
  if (state.kind === 'error') return <ErrorState message={state.message} onRetry={state.reload} />;

  return (
    <div className="notifications">
      <div className="notifications__bar">
        <button type="button" className="mk-btn mk-btn--text mk-btn--sm" onClick={() => setAllRead(true)} disabled={allRead}>
          {notificationStrings.markAll}
        </button>
      </div>
      {state.data.length === 0 ? (
        <p className="muted">{notificationStrings.empty}</p>
      ) : (
        <ul className="notifications__list">
          {state.data.map((n) => {
            const unread = n.unread && !allRead;
            return (
              <li key={n.id} className={`notifications__item${unread ? ' notifications__item--unread' : ''}`}>
                <div>
                  <p>
                    {unread ? <strong>{n.title}</strong> : n.title}
                    {n.detail && ` · ${n.detail}`}
                  </p>
                  <p className="muted">
                    {n.source} · {n.when}
                  </p>
                </div>
                <Link to={n.to} className="mk-btn mk-btn--quiet mk-btn--sm">
                  {notificationStrings.open}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
