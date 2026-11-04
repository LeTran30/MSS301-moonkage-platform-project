import { useState } from 'react';
import { Link } from 'react-router-dom';
import { routes } from '@/shared/config';
import { Icon } from '@/shared/ui';
import {
  markNotificationAsRead,
  useNotifications,
  useUnreadNotificationsCount,
} from '@/entities/notification';
import styles from './Header.module.css';

/** Nút chuông + dropdown thông báo chưa đọc. */
export function HeaderNotifications() {
  const [open, setOpen] = useState(false);
  const unreadCount = useUnreadNotificationsCount();
  const notifications = useNotifications();

  return (
    <div className={styles.notifWrap}>
      <button
        type="button"
        className={styles.iconBtn}
        onClick={() => setOpen(!open)}
        aria-label="Thông báo"
        aria-expanded={open}
      >
        <Icon name="bell" size={20} />
        {unreadCount > 0 && <span className={styles.badge}>{unreadCount}</span>}
      </button>
      {open && (
        <div className={styles.notifDropdown}>
          <div className={styles.notifHeader}>
            <strong>Thông báo</strong>
            <Link to={routes.base.notifications} onClick={() => setOpen(false)}>
              Xem tất cả
            </Link>
          </div>
          <div className={styles.notifList}>
            {notifications.map((n) => (
              <Link
                key={n.id}
                to={n.targetPath}
                className={`${styles.notifItem} ${!n.isRead ? styles.unread : ''}`}
                onClick={() => {
                  markNotificationAsRead(n.id);
                  setOpen(false);
                }}
              >
                <div className={styles.notifDot} />
                <div>
                  <div className={styles.notifTitle}>{n.title}</div>
                  <div className={styles.notifContent}>{n.content}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
