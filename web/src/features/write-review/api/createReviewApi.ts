import { apiClient, GATEWAY, unwrap } from '@/shared/api';

import type { CreateReviewPayload, ProductReview, ReviewDto } from '@/entities/order';

/**
 * The write side of the buyer's product review (FR-11, BR-32).
 *
 * The order entity owns the read and the shape of the review; the write lives
 * here because it books the review, not the order data
 * (package-architecture §3 — `api/` of a feature holds the writes).
 */

/** Write a review for one product of a delivered order (FR-11, BR-32). */
export async function createProductReview(
  orderId: string,
  payload: CreateReviewPayload,
): Promise<ProductReview> {
  const res = await apiClient.post<unknown>(GATEWAY.ORDER.REVIEWS(orderId), payload);
  const dto = unwrap<ReviewDto>(res);
  if (!dto) {
    throw new Error('Máy chủ không trả về đánh giá.');
  }
  return {
    id: dto.reviewId,
    productId: dto.productId,
    rating: dto.rating,
    content: dto.content ?? '',
    createdAt: dto.createdAt ?? new Date().toISOString(),
  };
}
