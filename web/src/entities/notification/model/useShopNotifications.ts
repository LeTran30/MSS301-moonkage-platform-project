import { useAsync } from '@/shared/lib';
import { fetchShopNotifications } from '../api/shopNotificationsApi';

export function useShopNotifications() {
  return useAsync(fetchShopNotifications, []);
}
