import { Link } from 'react-router-dom';
import { ErrorState, LoadingState, PageHeader } from '../../../shared/ui';
import { useShopNotifications } from '../model/useSeller';

/** B7.0: the shop's own inbox, separate from the owner's buying notifications (M6.6). */
export function ShopNotifications({ shopName }: { shopName: string }) {
  const state = useShopNotifications();
  if (state.kind === 'loading') return <LoadingState />;
  if (state.kind === 'error') return <ErrorState message={state.message} onRetry={state.reload} />;
  return (
    <div className="page page--narrow">
      <PageHeader title="Thông báo cửa hàng" lead={shopName} />
      <ul className="notifications__list">
        {state.data.map((n) => (
          <li key={n.id} className={`notifications__item${n.unread ? ' notifications__item--unread' : ''}`}>
            <div>
              <p>
                {n.unread ? <strong>{n.title}</strong> : n.title} · {n.detail}
              </p>
              <p className="muted">
                {n.source} · {n.when}
              </p>
            </div>
            <Link to={n.to} className="mk-btn mk-btn--quiet mk-btn--sm">
              Mở
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
