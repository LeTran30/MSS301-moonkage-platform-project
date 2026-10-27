import { useNavigate, useParams } from 'react-router-dom';
import { usePayment } from '@/entities/payment';
import { finishPayment, VnpayGateway } from '@/features/pay';
import { routes } from '@/shared/config/routes';
import { EmptyState, LoadingState } from '@/shared/ui';

/** M4.2: the simulated VNPay page, outside the Moonkage frame. */
export function VnpayPage() {
  const { paymentId = '' } = useParams();
  const navigate = useNavigate();
  const payment = usePayment(paymentId);
  return (
    <main className="vnpay-page">
      {payment.kind === 'loading' && <LoadingState />}
      {payment.kind === 'loaded' && !payment.data && <EmptyState title="Không có giao dịch này" />}
      {payment.kind === 'loaded' && payment.data && (
        <VnpayGateway
          payment={payment.data}
          onResult={async (paid) => {
            await finishPayment(paymentId, paid);
            navigate(routes.base.paymentResult(paymentId), { replace: true });
          }}
        />
      )}
    </main>
  );
}
