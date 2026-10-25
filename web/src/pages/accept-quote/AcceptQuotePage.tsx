import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { startPayment } from '../../features/payments';
import { AcceptQuote, acceptQuote, quoteDeposit, useRequest } from '../../features/quotes';
import { routes } from '../../shared/config/routes';
import { EmptyState, LoadingState } from '../../shared/ui';

/** M6.2.2: accept (binding, closes the other quotes) then pay the deposit on VNPay; the order is made after. */
export function AcceptQuotePage() {
  const { requestId = '' } = useParams();
  const supplierId = useSearchParams()[0].get('don-vi') ?? '';
  const navigate = useNavigate();
  const request = useRequest(requestId);
  if (request.kind === 'loading') return <LoadingState />;
  const quote = request.kind === 'loaded' ? request.data?.quotes.find((q) => q.supplierId === supplierId) : undefined;
  if (request.kind !== 'loaded' || !request.data || !quote) return <EmptyState title="Không tìm thấy báo giá này" />;
  const r = request.data;
  return (
    <AcceptQuote
      request={r}
      quote={quote}
      invoiceCompany="Công ty TNHH Mặt Trời"
      onBack={() => navigate(routes.quoteRequest(requestId))}
      onPay={async () => {
        await acceptQuote(requestId, supplierId);
        const payment = await startPayment('deposit', quoteDeposit(quote), `Đặt cọc ${quote.depositPercent}% · ${r.id} · ${quote.supplierName}`, {
          requestId,
          supplier: quote.supplierName,
          title: `${quote.boxes} hộp · ${quote.custom.toLowerCase()}`,
          value: quote.total,
          depositPercent: quote.depositPercent,
        });
        navigate(routes.vnpay(payment.id));
      }}
    />
  );
}
