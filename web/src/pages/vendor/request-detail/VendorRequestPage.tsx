import { useParams } from 'react-router-dom';
import { OpenOnly } from '@/entities/vendor';
import { useIncomingRequest } from '@/entities/vendor';
import { VendorRequestDetail } from '@/features/respond-to-quote-request';
import { EmptyState, LoadingState } from '@/shared/ui';

/** B3.1 */
export function VendorRequestPage() {
  const { requestId = '' } = useParams();
  const request = useIncomingRequest(requestId);
  if (request.kind === 'loading') return <LoadingState />;
  if (request.kind !== 'loaded' || !request.data) return <EmptyState title={`Không có yêu cầu ${requestId}`} />;
  return (
    <OpenOnly>
      <VendorRequestDetail request={request.data} onChanged={request.reload} />
    </OpenOnly>
  );
}
