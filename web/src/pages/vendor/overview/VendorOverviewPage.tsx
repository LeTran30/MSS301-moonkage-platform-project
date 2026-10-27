import { useVendorOrders } from '@/entities/order';
import { useVendorContext, useVendorReload } from '@/entities/vendor';
import { useIncomingRequests } from '@/entities/vendor';
import { LoadingState } from '@/shared/ui';
import { VendorOverview } from '@/widgets/vendor-overview';

/** B1.0 */
export function VendorOverviewPage() {
  const profile = useVendorContext();
  const reload = useVendorReload();
  const orders = useVendorOrders();
  const requests = useIncomingRequests();
  if (orders.kind === 'loading' || requests.kind === 'loading') return <LoadingState />;
  return (
    <VendorOverview
      profile={profile}
      orders={orders.kind === 'loaded' ? orders.data : []}
      newRequests={requests.kind === 'loaded' ? requests.data.filter((r) => r.state === 'new').length : 0}
      onChanged={reload}
    />
  );
}
