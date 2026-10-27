import { NotificationList, notificationStrings } from '@/entities/notification';

/** M6.6: buyer notifications only; shop notifications are in the vendor channel (B7.0). */
export function NotificationsPage() {
  return (
    <div className="shop__inner page page--narrow">
      <header className="page-head">
        <div>
          <h1 className="title-text">{notificationStrings.title}</h1>
          <p className="lead-text">{notificationStrings.lead}</p>
        </div>
      </header>
      <NotificationList />
    </div>
  );
}
