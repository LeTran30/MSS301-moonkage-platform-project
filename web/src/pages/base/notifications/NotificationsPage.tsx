import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Tabs, EmptyState, Icon, type IconName } from '@/shared/ui';
import { formatDateTime } from '@/shared/utils';
import {
  notificationApi,
  useNotificationInbox,
  useNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  type Notification,
} from '@/entities/notification';
import { useCurrentUser } from '@/entities/user';
import styles from './NotificationsPage.module.css';

type NotifTab = 'ALL' | 'ORDER' | 'QUOTE' | 'MAKET' | 'DISPUTE';

/** Icon SVG theo loại thông báo (thay cho emoji gốc). */
const NOTIF_ICONS: Record<string, IconName> = {
  ORDER: 'package',
  QUOTE: 'file',
  MAKET: 'sparkle',
  DISPUTE: 'scale',
};

export function NotificationsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<NotifTab>('ALL');
  const notifications = useNotifications();
  // The socket pushes new notifications; this reads back the ones the browser
  // missed (a reload, a closed tab) — BE-04b.
  useNotificationInbox();

  // IA M6.6 serves both audiences: "Người mua, Chủ người bán". The inbox belongs
  // to the signed-in account, so a shop owner opens the same screen and reads the
  // notifications of the shop (new RFQ, new order, maket revision, disbursement).
  const user = useCurrentUser();
  const isShopOwner = user.role === 'VENDOR' || Boolean(user.vendorId);
  const heading = isShopOwner ? 'Thông báo cửa hàng' : 'Trung tâm thông báo';
  const description = isShopOwner
    ? user.vendorName
      ? `Cập nhật của ${user.vendorName}: yêu cầu báo giá mới, đơn hàng vào xưởng, maket cần sửa.`
      : 'Yêu cầu báo giá mới, đơn hàng vào xưởng, maket cần sửa và đợt giải ngân cọc.'
    : 'Cập nhật trạng thái tiến độ đơn hàng, duyệt Maket thiết kế, báo giá mới và phán quyết khiếu nại.';

  const filtered = notifications.filter((n) => {
    if (activeTab === 'ORDER') return n.type === 'ORDER';
    if (activeTab === 'QUOTE') return n.type === 'QUOTE';
    if (activeTab === 'MAKET') return n.type === 'MAKET';
    if (activeTab === 'DISPUTE') return n.type === 'DISPUTE';
    return true;
  });

  const handleMarkAllRead = () => {
    markAllNotificationsAsRead();
    // The server is the source of truth; a failed call leaves the badge as it was.
    void notificationApi.markAllRead().catch(() => undefined);
  };

  const handleItemClick = (n: Notification) => {
    markNotificationAsRead(n.id);
    void notificationApi.markRead(n.id).catch(() => undefined);
    if (n.targetPath) {
      navigate(n.targetPath);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{heading}</h1>
          <p className={styles.desc}>{description}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={handleMarkAllRead} iconLeft="check">
          Đánh dấu đã đọc tất cả
        </Button>
      </div>

      <Tabs
        items={[
          { id: 'ALL', label: `Tất cả (${notifications.length})` },
          { id: 'ORDER', label: 'Đơn hàng' },
          { id: 'QUOTE', label: 'Báo giá B2B' },
          { id: 'MAKET', label: 'Duyệt Maket' },
          { id: 'DISPUTE', label: 'Khiếu nại và ký quỹ' },
        ]}
        activeId={activeTab}
        onChange={(id) => setActiveTab(id as NotifTab)}
      />

      {filtered.length === 0 ? (
        <EmptyState
          icon="bell"
          title="Không có thông báo nào"
          description="Tất cả thông báo về đơn hàng và báo giá sẽ xuất hiện tại đây."
        />
      ) : (
        <div className={styles.list}>
          {filtered.map((n) => (
            <Card
              key={n.id}
              className={`${styles.itemCard} ${!n.isRead ? styles.unread : ''}`}
              onClick={() => handleItemClick(n)}
            >
              <div className={styles.iconWrap}>
                <span className={styles.icon}>
                  <Icon name={NOTIF_ICONS[n.type] ?? 'bell'} size={20} />
                </span>
              </div>

              <div className={styles.body}>
                <div className={styles.titleRow}>
                  <strong className={styles.itemTitle}>{n.title}</strong>
                  {!n.isRead && <span className={styles.newDot} />}
                </div>
                <p className={styles.itemMsg}>{n.content}</p>
                <span className={styles.itemTime}>{formatDateTime(n.createdAt)}</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
