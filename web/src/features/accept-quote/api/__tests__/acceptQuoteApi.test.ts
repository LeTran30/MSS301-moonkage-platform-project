import { describe, it, expect, vi, beforeEach } from 'vitest';
import { acceptQuote } from '../acceptQuoteApi';
import { apiClient } from '@/shared/api';
import { envelope } from '@/shared/api/__tests__/envelopeFixtures';

describe('Feature accept-quote - acceptQuoteApi (FR-19)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('acceptQuote() trả về nơi thanh toán cọc (FR-19)', async () => {
    vi.spyOn(apiClient, 'post').mockResolvedValue(
      envelope({
        acceptanceId: 'acc-1',
        status: 'PENDING_PAYMENT',
        depositAmount: 9000000,
        paymentId: 'pay-1',
        paymentUrl: 'https://sandbox.vnpay.vn/pay/pay-1',
        paymentExpiresAt: '2026-11-02T05:00:00Z',
      }),
    );

    const acceptance = await acceptQuote('req-1', 'quo-1');
    expect(acceptance.acceptanceId).toBe('acc-1');
    expect(acceptance.depositAmount).toBe(9000000);
    expect(acceptance.paymentUrl).toContain('pay-1');
  });

  it('acceptQuote() ném lỗi khi backend không trả dữ liệu', async () => {
    vi.spyOn(apiClient, 'post').mockResolvedValue(envelope(null));
    await expect(acceptQuote('req-1', 'quo-1')).rejects.toThrow();
  });
});
