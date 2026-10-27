import { OrderList } from '@/entities/order';
import { PageHeader } from '@/shared/ui';

/** M6.1 */
export function OrdersPage() {
  return (
    <div className="stack-lg">
      <PageHeader title="Đơn hàng" />
      <OrderList />
    </div>
  );
}
