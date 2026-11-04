import { useEffect, useRef } from 'react';
import { useRealtime } from '@/shared/api/realtime';
import { notificationStore, type Notification } from '../model/notificationStore';

/**
 * The STOMP destination the orchestrator pushes the notifications to.
 *
 * `RealtimeDestination.NOTIFICATIONS` on the backend is `/queue/notifications`;
 * with the `/user` prefix the browser subscribes to `/user/queue/notifications`
 * and receives only what was sent to its own account.
 */
export const notificationsQueue = '/user/queue/notifications';

/**
 * Wire shape of the notification the orchestrator pushes
 * (`com.moonkage.orchestrator.domain.Notification`).
 */
export interface NotificationPush {
  id: string;
  recipientAccountId?: string;
  type?: string;
  title: string;
  content: string;
  targetUrl?: string | null;
  read?: boolean;
  createdAt?: string;
}

/**
 * Map a pushed notification to the UI entity.
 *
 * The backend `type` is free text (`GENERAL`, `ORDER`, …); the UI only knows
 * five kinds, so an unknown kind becomes `SYSTEM` instead of breaking the list.
 */
export function mapNotificationPush(push: NotificationPush): Notification {
  const known: Notification['type'][] = ['ORDER', 'QUOTE', 'MAKET', 'DISPUTE', 'SYSTEM'];
  const raw = (push.type ?? '').toUpperCase();
  const type = known.includes(raw as Notification['type'])
    ? (raw as Notification['type'])
    : 'SYSTEM';

  return {
    id: push.id,
    title: push.title,
    content: push.content,
    targetPath: push.targetUrl ?? '',
    createdAt: push.createdAt ?? new Date().toISOString(),
    isRead: Boolean(push.read),
    type,
  };
}

/**
 * Receive the notifications pushed by the orchestrator (NFR-10, AC-10.2).
 *
 * The socket is the fast path: a notification reaches the bell as soon as the
 * event arrives. The list itself stays in the store, so the page and the
 * header badge read the same data.
 */
export function useNotificationPush(): void {
  const { subscribe } = useRealtime();
  const handlerRef = useRef<(push: NotificationPush) => void>(() => {});

  useEffect(() => {
    handlerRef.current = (push) => {
      const notification = mapNotificationPush(push);
      notificationStore.set((prev) => {
        // The same notification can be pushed twice; keep the list unique.
        if (prev.some((n) => n.id === notification.id)) return prev;
        return [notification, ...prev];
      });
    };
  });

  useEffect(() => {
    return subscribe<NotificationPush>(notificationsQueue, (push) => {
      handlerRef.current(push);
    });
  }, [subscribe]);
}
