import { apiClient, GATEWAY, unwrap } from '@/shared/api';
import { isDemoMode } from '@/shared/config';

/**
 * Wire shape of `com.moonkage.orchestrator.contract.NotificationResponse`.
 */
export interface NotificationDto {
  id: string;
  type: string;
  title: string;
  content: string;
  targetUrl?: string | null;
  read: boolean;
  createdAt?: string;
}

/**
 * Wire shape of `com.moonkage.orchestrator.contract.NotificationPageResponse`.
 */
export interface NotificationPageDto {
  content: NotificationDto[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  unread: number;
}

/**
 * The caller's notification inbox (NFR-10, BE-04b).
 *
 * The socket (`useNotificationPush`) is the fast path: a notification reaches the
 * bell the moment the event arrives. This REST call is the durable path: it
 * reads back what the browser missed (a reload, a closed tab, a push that never
 * came).
 */
export const notificationApi = {
  /** One page of the caller's notifications, newest first. */
  async list(options?: { page?: number; size?: number }): Promise<NotificationPageDto | null> {
    if (isDemoMode()) {
      return null;
    }
    const params = new URLSearchParams();
    params.set('page', String(options?.page ?? 0));
    params.set('size', String(options?.size ?? 20));
    const res = await apiClient.get<unknown>(`${GATEWAY.ORCHESTRATOR.NOTIFICATIONS}?${params.toString()}`);
    return unwrap<NotificationPageDto>(res);
  },

  /** Marks one notification of the caller as read; safe to repeat. */
  async markRead(notificationId: string): Promise<NotificationDto | null> {
    if (isDemoMode()) {
      return null;
    }
    const res = await apiClient.post<unknown>(GATEWAY.ORCHESTRATOR.NOTIFICATION_MARK_READ(notificationId));
    return unwrap<NotificationDto>(res);
  },

  /** Marks every notification of the caller as read; answers how many were still unread. */
  async markAllRead(): Promise<number | null> {
    if (isDemoMode()) {
      return null;
    }
    const res = await apiClient.post<unknown>(GATEWAY.ORCHESTRATOR.NOTIFICATIONS_MARK_ALL_READ);
    const count = unwrap<number>(res);
    return count === null ? null : count;
  },
};
