import { useAsync } from '@/shared/lib';
import { fetchNotifications } from '../api/notificationsApi';

export function useNotifications() {
  return useAsync(fetchNotifications, []);
}
