import { OrderList } from '../../features/orders';
import { PageHeader } from '../../shared/ui';

/** M6.1 */
export function OrdersPage() {
  return (
    <div className="stack-lg">
      <PageHeader title="Đơn hàng" />
      <OrderList />
    </div>
  );
}
