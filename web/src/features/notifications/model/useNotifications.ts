import { useAsync } from '../../../shared/ui';
import { fetchNotifications } from '../api/notificationsApi';

export function useNotifications() {
  return useAsync(fetchNotifications, []);
}
