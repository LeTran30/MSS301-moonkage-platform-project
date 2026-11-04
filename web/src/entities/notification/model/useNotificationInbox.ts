import { useCallback, useEffect, useState } from 'react';
import { notificationApi, type NotificationDto } from '../api/notificationApi';
import { notificationStore, type Notification } from '../model/notificationStore';
import { mapNotificationPush } from './useNotificationPush';

/**
 * Map the wire shape to the UI entity.
 *
 * The backend `type` is free text (`GENERAL`, `ORDER_STATUS`, …); the UI only
 * knows five kinds, so an unknown kind becomes `SYSTEM` instead of breaking
 * the list. The mapping is shared with the STOMP push, so both paths give the
 * same entity.
 */
export function mapNotificationDto(dto: NotificationDto): Notification {
  return mapNotificationPush({
    id: dto.id,
    type: dto.type,
    title: dto.title,
    content: dto.content,
    targetUrl: dto.targetUrl ?? undefined,
    read: dto.read,
    createdAt: dto.createdAt,
  });
}

/**
 * Read the caller's inbox back from the server (BE-04b).
 *
 * The socket is the fast path (a notification reaches the bell the moment the
 * event arrives); this call is the durable path — it fills the list after a
 * reload, when the push was missed or the tab was closed.
 */
export function useNotificationInbox(): { loading: boolean; reload: () => void } {
  const [loading, setLoading] = useState(false);

  // Fetch and merge into the store. It touches no React state, so it can run
  // from an effect without a cascading render.
  const fetchInbox = useCallback(async (): Promise<void> => {
    const page = await notificationApi.list({ size: 50 });
    if (!page) return;
    const notifications = page.content.map(mapNotificationDto);
    notificationStore.set((prev) => {
      // The pushed notifications the server has not stored yet stay in the list.
      const known = new Set(notifications.map((n) => n.id));
      return [...notifications, ...prev.filter((n) => !known.has(n.id))];
    });
  }, []);

  const reload = useCallback(() => {
    setLoading(true);
    void fetchInbox()
      .catch(() => {
        // The inbox keeps whatever the socket delivered; a failed read is not fatal.
      })
      .finally(() => setLoading(false));
  }, [fetchInbox]);

  useEffect(() => {
    void fetchInbox().catch(() => {
      // The inbox keeps whatever the socket delivered; a failed read is not fatal.
    });
  }, [fetchInbox]);

  return { loading, reload };
}
