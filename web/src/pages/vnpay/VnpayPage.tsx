import { useNavigate, useParams } from 'react-router-dom';
import { fetchPayment, finishPayment, VnpayGateway } from '../../features/payments';
import { routes } from '../../shared/config/routes';
import { EmptyState, LoadingState, useAsync } from '../../shared/ui';

/** M4.2: the simulated VNPay page, outside the Moonkage frame. */
export function VnpayPage() {
  const { paymentId = '' } = useParams();
  const navigate = useNavigate();
  const payment = useAsync(() => fetchPayment(paymentId), [paymentId]);
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
