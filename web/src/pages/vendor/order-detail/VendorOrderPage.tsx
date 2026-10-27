import { useParams } from 'react-router-dom';
import { useVendorOrder } from '@/entities/order';
import { OpenOnly } from '@/entities/vendor';
import { VendorCustomOrderView, VendorReadyOrderView } from '@/features/fulfill-order';
import { EmptyState, LoadingState } from '@/shared/ui';

/** B2.1 / B2.2 */
export function VendorOrderPage() {
  const { orderId = '' } = useParams();
  const order = useVendorOrder(orderId);
  if (order.kind === 'loading') return <LoadingState />;
  if (order.kind !== 'loaded' || !order.data) return <EmptyState title={`Không có đơn ${orderId}`} />;
  return (
    <OpenOnly>
      {order.data.kind === 'ready' ? (
        <VendorReadyOrderView order={order.data} onChanged={order.reload} />
      ) : (
        <VendorCustomOrderView order={order.data} onChanged={order.reload} />
      )}
    </OpenOnly>
  );
}
