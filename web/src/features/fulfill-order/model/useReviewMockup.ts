import { useCallback } from 'react';
import { reviewMockup } from '../api/reviewMockupApi';
import type { MaketVersion, MockupReviewStatus } from '@/entities/order';

/**
 * The buyer approves a maket version or asks for changes (FR-20).
 *
 * `reviewNote` is required by the backend when the status is `CHANGES_REQUESTED`.
 */
export function useReviewMockup() {
  return useCallback(
    (
      orderId: string,
      versionNo: number,
      reviewStatus: MockupReviewStatus,
      reviewNote?: string,
    ): Promise<MaketVersion> => reviewMockup(orderId, versionNo, { reviewStatus, reviewNote }),
    [],
  );
}
