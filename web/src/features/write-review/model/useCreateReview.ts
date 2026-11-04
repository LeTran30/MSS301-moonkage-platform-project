import { useCallback } from 'react';
import { createProductReview } from '../api/createReviewApi';
import type { CreateReviewPayload, ProductReview } from '@/entities/order';

/**
 * The buyer writes a review for one product of a delivered order (FR-11).
 */
export function useCreateReview() {
  return useCallback(
    (orderId: string, payload: CreateReviewPayload): Promise<ProductReview> =>
      createProductReview(orderId, payload),
    [],
  );
}
