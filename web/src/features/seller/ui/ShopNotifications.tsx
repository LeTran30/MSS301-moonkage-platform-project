import { Link } from 'react-router-dom';
import { ErrorState, LoadingState, PageHeader } from '../../../shared/ui';
import { useShopNotifications } from '../model/useSeller';
import styles from './ShopNotifications.module.css';

/** B7.0: the shop's own inbox, separate from the owner's buying notifications (M6.6). */
export function ShopNotifications({ shopName }: { shopName: string }) {
  const state = useShopNotifications();
  if (state.kind === 'loading') return <LoadingState />;
  if (state.kind === 'error') return <ErrorState message={state.message} onRetry={state.reload} />;
  return (
    <div className="page page--narrow">
      <PageHeader title="Thông báo cửa hàng" lead={shopName} />
      <ul className={styles.list}>
        {state.data.map((n) => (
          <li key={n.id} className={`${styles.item}${n.unread ? ` ${styles.itemUnread}` : ''}`}>
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
