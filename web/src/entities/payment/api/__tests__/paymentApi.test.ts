import { describe, it, expect, vi, beforeEach } from 'vitest';
import { paymentApi } from '../paymentApi';
import * as envModule from '@/shared/config/env';
import { apiClient } from '@/shared/api';
import { envelope } from '@/shared/api/__tests__/envelopeFixtures';

describe('Payment Entity - paymentApi (FR-09, BR-25)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(envModule, 'isDemoMode').mockReturnValue(false);
  });

  it('getById đọc trạng thái giao dịch của người gọi', async () => {
    const get = vi.spyOn(apiClient, 'get').mockResolvedValue(
      envelope({
        paymentId: 'pay-1',
        purpose: 'CHECKOUT',
        referenceId: 'chk-1',
        amount: 975000,
        status: 'PENDING',
        gatewayResponseCode: null,
        expiresAt: '2026-11-01T00:15:00Z',
        paidAt: null,
      }) as never,
    );

    const payment = await paymentApi.getById('pay-1');

    expect(get).toHaveBeenCalledWith('/payment-service/api/payments/pay-1');
    expect(payment?.status).toBe('PENDING');
    expect(payment?.purpose).toBe('CHECKOUT');
  });

  it('getById trả null khi máy chủ không có giao dịch', async () => {
    vi.spyOn(apiClient, 'get').mockResolvedValue(envelope(null) as never);

    await expect(paymentApi.getById('pay-missing')).resolves.toBeNull();
  });
});
