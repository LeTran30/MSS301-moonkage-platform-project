import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { deposit as quoteDeposit, useRequest } from '@/entities/quote';
import { AcceptQuote, acceptQuote } from '@/features/accept-quote';
import { startPayment } from '@/features/pay';
import { acceptQuoteVendorParam, routes } from '@/shared/config/routes';
import { EmptyState, LoadingState } from '@/shared/ui';

/** M6.2.2: accept (binding, closes the other quotes) then pay the deposit on VNPay; the order is made after. */
export function AcceptQuotePage() {
  const { requestId = '' } = useParams();
  const vendorId = useSearchParams()[0].get(acceptQuoteVendorParam) ?? '';
  const navigate = useNavigate();
  const request = useRequest(requestId);
  if (request.kind === 'loading') return <LoadingState />;
  const quote = request.kind === 'loaded' ? request.data?.quotes.find((q) => q.vendorId === vendorId) : undefined;
  if (request.kind !== 'loaded' || !request.data || !quote) return <EmptyState title="Không tìm thấy báo giá này" />;
  const r = request.data;
  return (
    <AcceptQuote
      request={r}
      quote={quote}
      invoiceCompany="Công ty TNHH Mặt Trời"
      onBack={() => navigate(routes.account.quoteRequest(requestId))}
      onPay={async () => {
        await acceptQuote(requestId, vendorId);
        const payment = await startPayment('deposit', quoteDeposit(quote), `Đặt cọc ${quote.depositPercent}% · ${r.id} · ${quote.vendorName}`, {
          requestId,
          vendorName: quote.vendorName,
          title: `${quote.boxes} hộp · ${quote.custom.toLowerCase()}`,
          value: quote.total,
          depositPercent: quote.depositPercent,
        });
        navigate(routes.gateway.vnpay(payment.id));
      }}
    />
  );
}
