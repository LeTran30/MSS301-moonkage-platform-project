import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createProductReview } from '../createReviewApi';
import { apiClient } from '@/shared/api';
import { envelope } from '@/shared/api/__tests__/envelopeFixtures';

describe('Feature write-review - createReviewApi (FR-11, BR-32)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('createProductReview() gửi POST đúng endpoint reviews', async () => {
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue(
      envelope({
        reviewId: 'REV-9',
        productId: 'PROD-9',
        rating: 4,
        content: 'Ổn',
      }),
    );

    const review = await createProductReview('ORD-1', {
      productId: 'PROD-9',
      rating: 4,
      content: 'Ổn',
    });
    expect(post).toHaveBeenCalledWith('/order-service/api/orders/ORD-1/reviews', {
      productId: 'PROD-9',
      rating: 4,
      content: 'Ổn',
    });
    expect(review.id).toBe('REV-9');
  });
});
