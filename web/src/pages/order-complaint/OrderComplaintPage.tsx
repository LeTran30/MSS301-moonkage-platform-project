import { useNavigate, useParams } from 'react-router-dom';
import { ComplaintView, useComplaint, useOrder } from '../../features/orders';
import { routes } from '../../shared/config/routes';
import { EmptyState, LoadingState } from '../../shared/ui';

/** M6.1.3 */
export function OrderComplaintPage() {
  const { orderId = '' } = useParams();
  const navigate = useNavigate();
  const order = useOrder(orderId);
  const complaint = useComplaint(orderId);
  if (order.kind === 'loading' || complaint.kind === 'loading') return <LoadingState />;
  if (order.kind !== 'loaded' || !order.data || order.data.kind !== 'ready') return <EmptyState title="Đơn này không báo vấn đề được" />;
  return (
    <ComplaintView
      order={order.data}
      complaint={complaint.kind === 'loaded' ? complaint.data : null}
      onSent={complaint.reload}
      onCancel={() => navigate(routes.order(orderId))}
    />
  );
}
