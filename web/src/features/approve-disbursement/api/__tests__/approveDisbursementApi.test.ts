import { describe, it, expect, vi, beforeEach } from 'vitest';
import { reviewDisbursement } from '../approveDisbursementApi';
import { apiClient } from '@/shared/api';
import { envelope } from '@/shared/api/__tests__/envelopeFixtures';

describe('Feature approve-disbursement - approveDisbursementApi (FR-47)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('reviewDisbursement() gọi PATCH đúng đường dẫn của Admin (FR-47)', async () => {
    const patch = vi.spyOn(apiClient, 'patch').mockResolvedValue(
      envelope({
        requestId: 'req-1',
        status: 'APPROVED',
        approvedAmount: 4_200_000,
      }) as never,
    );

    const reviewed = await reviewDisbursement('ord-1', 'req-1', {
      status: 'APPROVED',
      approvedAmount: 4_200_000,
    });

    // ReviewDisbursementRequest của payment-service: {status, approvedAmount?, reason?}.
    expect(patch).toHaveBeenCalledWith('/api/ledgers/ord-1/disbursements/req-1', {
      status: 'APPROVED',
      approvedAmount: 4_200_000,
    });
    expect(reviewed?.status).toBe('APPROVED');
  });

  it('reviewDisbursement() gửi reason khi từ chối', async () => {
    const patch = vi
      .spyOn(apiClient, 'patch')
      .mockResolvedValue(envelope({ requestId: 'req-1', status: 'REJECTED' }) as never);

    await reviewDisbursement('ord-1', 'req-1', {
      status: 'REJECTED',
      reason: 'Vượt quá số tiền cọc đang giữ',
    });

    expect(patch).toHaveBeenCalledWith('/api/ledgers/ord-1/disbursements/req-1', {
      status: 'REJECTED',
      reason: 'Vượt quá số tiền cọc đang giữ',
    });
  });
});
