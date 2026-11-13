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
    expect(post).toHaveBeenCalledWith(
      '/api/ledgers/ord-1/disbursements',
      {
        amount: 4_200_000,
        purpose: 'MATERIALS',
      },
      {
        headers: { 'Idempotency-Key': expect.any(String) },
      },
    );
    expect(created?.requestId).toBe('req-1');
  });

  it('giữ nguyên Idempotency-Key khi retry sau lỗi mạng', async () => {
    const post = vi.spyOn(apiClient, 'post')
      .mockRejectedValueOnce(new Error('network lost'))
      .mockResolvedValueOnce(envelope({ requestId: 'req-retried' }) as never);
    const payload = { amount: 650_000, purpose: 'PRINTING' as const };

    await expect(requestDisbursement('ord-retry', payload)).rejects.toThrow('network lost');
    await requestDisbursement('ord-retry', payload);

    const firstKey = post.mock.calls[0][2]?.headers?.['Idempotency-Key'];
    const secondKey = post.mock.calls[1][2]?.headers?.['Idempotency-Key'];
    expect(firstKey).toBeTruthy();
    expect(secondKey).toBe(firstKey);
  });
});
