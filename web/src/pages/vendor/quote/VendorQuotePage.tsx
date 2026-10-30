import { useNavigate, useParams } from 'react-router-dom';
import { OpenOnly } from '@/entities/vendor';
import { useIncomingRequest } from '@/entities/vendor';
import { useTerms } from '@/entities/vendor';
import { QuoteComposer } from '@/features/respond-to-quote-request';
import { routes } from '@/shared/config/routes';
import { EmptyState, LoadingState } from '@/shared/ui';

/** B3.2 */
export function VendorQuotePage() {
  const { requestId = '' } = useParams();
  const navigate = useNavigate();
  const request = useIncomingRequest(requestId);
  const terms = useTerms();
  if (request.kind === 'loading' || terms.kind === 'loading') return <LoadingState />;
  if (request.kind !== 'loaded' || !request.data || terms.kind !== 'loaded') return <EmptyState title={`Không có yêu cầu ${requestId}`} />;
  return (
    <OpenOnly>
      <QuoteComposer
        request={request.data}
        terms={terms.data}
        onCancel={() => navigate(routes.vendor.request(requestId))}
        onSent={() => navigate(routes.vendor.request(requestId))}
      />
    </OpenOnly>
  );
}
