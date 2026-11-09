import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkoutOrder } from '../checkoutApi';
import { apiClient } from '@/shared/api';
import { envelope } from '@/shared/api/__tests__/envelopeFixtures';

describe('Feature checkout - checkoutApi (FR-08)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('checkoutOrder() trả về paymentUrl và paymentId của backend', async () => {
    vi.spyOn(apiClient, 'post').mockResolvedValue(
      envelope({
        checkoutId: 'chk-1',
        paymentId: 'pay-1',
        paymentUrl: 'https://sandbox.vnpay.vn/pay/chk-1',
        totalAmount: 530000,
        expiresAt: '2026-11-02T04:00:00Z',
      }),
    );

    const result = await checkoutOrder({
      recipientName: 'Anh Minh',
      recipientPhone: '0903123456',
      provinceCode: '01',
      addressDetail: '180 Triệu Việt Vương',
    });
    expect(result.checkoutId).toBe('chk-1');
    expect(result.paymentId).toBe('pay-1');
    expect(result.paymentUrl).toBe('https://sandbox.vnpay.vn/pay/chk-1');
  });
});
