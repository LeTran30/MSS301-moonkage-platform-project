import { createStore, useStore } from '@/shared/lib';

export type Notification = {
  id: string;
  title: string;
  content: string;
  targetPath: string; // Mở thẳng trang liên quan (NFR-10, AC-10.2)
  createdAt: string;
  isRead: boolean;
  type: 'ORDER' | 'QUOTE' | 'MAKET' | 'DISPUTE' | 'SYSTEM';
};

/**
 * The notifications of the caller.
 *
 * Two ways in:
 * - the STOMP push of `/user/queue/notifications` (fast path, see `useNotificationPush`);
 * - `GET /api/notifications` (BE-04b): what the browser missed — a reload, a closed
 *   tab, a push that never came.
 *
 * The list starts empty rather than showing made-up entries.
 */
export const notificationStore = createStore<Notification[]>([]);

export function useNotifications() {
  return useStore(notificationStore);
}

export function useUnreadNotificationsCount() {
  const notifs = useNotifications();
  return notifs.filter((n) => !n.isRead).length;
}

/**
 * Mark one notification as read locally.
 *
 * The server is the source of truth: the caller of this function is expected to
 * have called `POST /api/notifications/{id}/read` as well.
 */
export function markNotificationAsRead(id: string) {
  notificationStore.set((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
}

/** Mark every notification of the caller as read. */
export function markAllNotificationsAsRead() {
  notificationStore.set((prev) => prev.map((n) => ({ ...n, isRead: true })));
}
