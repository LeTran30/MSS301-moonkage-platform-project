import { describe, it, expect, vi, beforeEach } from 'vitest';
import { requestDisbursement } from '../requestDisbursementApi';
import { apiClient } from '@/shared/api';
import { envelope } from '@/shared/api/__tests__/envelopeFixtures';

describe('Feature request-disbursement - requestDisbursementApi (FR-41)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('requestDisbursement() gửi amount + purpose của FR-41', async () => {
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue(
      envelope({
        requestId: 'req-1',
        orderId: 'ord-1',
        amount: 4_200_000,
        purpose: 'MATERIALS',
        status: 'PENDING',
      }) as never,
    );

    const created = await requestDisbursement('ord-1', {
      amount: 4_200_000,
      purpose: 'MATERIALS',
    });

    // CreateDisbursementRequest của payment-service chỉ nhận {amount, purpose}.
    expect(post).toHaveBeenCalledWith('/payment-service/api/ledgers/ord-1/disbursements', {
      amount: 4_200_000,
      purpose: 'MATERIALS',
    });
    expect(created?.requestId).toBe('req-1');
  });
});
