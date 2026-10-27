import { useNavigate, useParams } from 'react-router-dom';
import { finishPayment, usePayment, VnpayGateway } from '../../features/payments';
import { routes } from '../../shared/config/routes';
import { EmptyState, LoadingState } from '../../shared/ui';

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
            navigate(routes.paymentResult(paymentId), { replace: true });
          }}
        />
      )}
    </main>
  );
}
