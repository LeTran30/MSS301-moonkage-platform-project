import { ShopNotifications } from '@/entities/notification';
import { useVendorContext } from '@/entities/vendor';

/** B7.0 */
export function VendorNotificationsPage() {
  return <ShopNotifications shopName={useVendorContext().shopName} />;
}
