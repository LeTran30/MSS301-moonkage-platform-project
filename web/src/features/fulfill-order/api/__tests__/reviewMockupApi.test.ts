import { describe, it, expect, vi, beforeEach } from 'vitest';
import { reviewMockup } from '../reviewMockupApi';
import { apiClient } from '@/shared/api';
import { envelope } from '@/shared/api/__tests__/envelopeFixtures';

describe('Feature fulfill-order - reviewMockupApi (FR-20)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('reviewMockup() gửi PATCH đúng endpoint và payload', async () => {
    const patch = vi.spyOn(apiClient, 'patch').mockResolvedValue(
      envelope({
        versionNo: 3,
        downloadUrl: '/m3.pdf',
        reviewStatus: 'APPROVED',
      }),
    );

    await reviewMockup('ORD-1', 3, { reviewStatus: 'APPROVED' });
    expect(patch).toHaveBeenCalledWith('/api/orders/ORD-1/mockups/3', {
      reviewStatus: 'APPROVED',
    });
  });
});
