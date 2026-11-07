import { useCallback } from 'react';
import { queryClient, queryKeys } from '@/shared/api';
import { reviewMockup } from '../api/reviewMockupApi';
import type { MaketVersion, MockupReviewStatus } from '@/entities/order';

/**
 * The buyer approves a maket version or asks for changes (FR-20).
 *
 * `reviewNote` is required by the backend when the status is `CHANGES_REQUESTED`.
 * The maket versions are read again, so the panel and the "Việc cần bạn xử lý"
 * count drop the version the buyer just reviewed.
 */
export function useReviewMockup() {
  return useCallback(
    (
      orderId: string,
      versionNo: number,
      reviewStatus: MockupReviewStatus,
      reviewNote?: string,
    ): Promise<MaketVersion> =>
      reviewMockup(orderId, versionNo, { reviewStatus, reviewNote }).then(async (reviewed) => {
        await queryClient.invalidateQueries({ queryKey: queryKeys.order.mockups(orderId) });
        return reviewed;
      }),
    [],
  );
}
