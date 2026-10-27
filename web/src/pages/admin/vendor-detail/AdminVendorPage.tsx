import { useParams } from 'react-router-dom';
import { useApplication } from '@/entities/vendor';
import { ApplicationReview } from '@/features/review-applications';
import { EmptyState, ErrorState, LoadingState } from '@/shared/ui';

/** Q2.1 */
export function AdminVendorPage() {
  const { vendorId = '' } = useParams();
  const state = useApplication(vendorId);
  if (state.kind === 'loading') return <LoadingState />;
  if (state.kind === 'error') return <ErrorState message={state.message} onRetry={state.reload} />;
  if (!state.data) return <EmptyState title="Không tìm thấy hồ sơ" />;
  return <ApplicationReview key={state.data.history.length} app={state.data} onChanged={state.reload} />;
}
