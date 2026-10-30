import { useParams } from 'react-router-dom';
import { useDispute } from '@/entities/dispute';
import { DisputeDecision } from '@/features/resolve-disputes';
import { EmptyState, ErrorState, LoadingState } from '@/shared/ui';

/** Q5.1 */
export function AdminDisputePage() {
  const { disputeId = '' } = useParams();
  const state = useDispute(disputeId);
  if (state.kind === 'loading') return <LoadingState />;
  if (state.kind === 'error') return <ErrorState message={state.message} onRetry={state.reload} />;
  if (!state.data) return <EmptyState title="Không tìm thấy khiếu nại" />;
  return <DisputeDecision key={state.data.state} dispute={state.data} onChanged={state.reload} />;
}
