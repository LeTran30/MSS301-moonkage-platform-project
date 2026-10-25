import { useNavigate, useParams } from 'react-router-dom';
import { QuoteCompare, useRequest } from '../../features/quotes';
import { routes } from '../../shared/config/routes';
import { EmptyState, ErrorState, LoadingState } from '../../shared/ui';

/** M6.2.1 */
export function QuoteRequestPage() {
  const { requestId = '' } = useParams();
  const navigate = useNavigate();
  const request = useRequest(requestId);
  if (request.kind === 'loading') return <LoadingState />;
  if (request.kind === 'error') return <ErrorState message={request.message} onRetry={request.reload} />;
  if (!request.data) return <EmptyState title={`Không có yêu cầu ${requestId}`} />;
  return <QuoteCompare request={request.data} onChanged={request.reload} onAccept={(supplierId) => navigate(routes.acceptQuote(requestId, supplierId))} />;
}
