import { Link, useNavigate, useParams } from 'react-router-dom';
import { remainingAmount, useOrder } from '@/entities/order';
import { ReadyOrderView } from '@/features/confirm-delivery';
import { startPayment } from '@/features/pay';
import { CustomOrderView } from '@/features/review-mockup';
import { routes } from '@/shared/config/routes';
import { EmptyState, ErrorState, LoadingState } from '@/shared/ui';

/** M6.1.1 / M6.1.2: one path for both kinds of order; the page picks the view by kind (Đ6). */
export function OrderDetailPage() {
  const { orderId = '' } = useParams();
  const navigate = useNavigate();
  const order = useOrder(orderId);
  if (order.kind === 'loading') return <LoadingState />;
  if (order.kind === 'error') return <ErrorState message={order.message} onRetry={order.reload} />;
  if (!order.data)
    return (
      <EmptyState title={`Không có đơn ${orderId}`}>
        <Link to={routes.account.orders} className="mk-btn mk-btn--quiet">
          Về Đơn hàng
        </Link>
      </EmptyState>
    );
  if (order.data.kind === 'ready') return <ReadyOrderView order={order.data} onChanged={order.reload} />;
  return (
    <CustomOrderView
      order={order.data}
      onChanged={order.reload}
      onPayRemaining={async (o) => {
        const payment = await startPayment('remaining', remainingAmount(o), `Phần còn lại đơn ${o.id}`, { orderId: o.id });
        navigate(routes.gateway.vnpay(payment.id));
      }}
    />
  );
}
