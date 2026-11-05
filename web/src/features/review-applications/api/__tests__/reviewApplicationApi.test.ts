import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createVendorReview } from '../reviewApplicationApi';
import { apiClient } from '@/shared/api';
import { envelope } from '@/shared/api/__tests__/envelopeFixtures';

describe('Feature review-applications - reviewApplicationApi (FR-45, AC-45.2)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('createVendorReview gửi decision + reason (AC-45.2)', async () => {
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue(
      envelope({
        id: 'rev-1',
        decision: 'REJECT',
        reason: 'Ảnh giấy phép mờ',
      }) as never,
    );

    await createVendorReview('ven-1', {
      decision: 'REJECT',
      reason: 'Ảnh giấy phép mờ',
      licenseChecked: true,
    });

    const [url, body] = post.mock.calls[0];
    expect(url).toBe('/api/vendors/ven-1/reviews');
    expect(body).toEqual({
      decision: 'REJECT',
      reason: 'Ảnh giấy phép mờ',
      licenseChecked: true,
    });
  });
});
