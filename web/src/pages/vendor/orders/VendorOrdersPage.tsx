import { VendorOrders } from '@/entities/order';
import { OpenOnly } from '@/entities/vendor';

/** B2.0 */
export function VendorOrdersPage() {
  return (
    <OpenOnly>
      <VendorOrders />
    </OpenOnly>
  );
}
