import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRegistrationFeePayment } from '../payVendorFeeApi';
import { apiClient } from '@/shared/api';
import { envelope } from '@/shared/api/__tests__/envelopeFixtures';

describe('Feature pay-vendor-fee - payVendorFeeApi (FR-42, AC-27.4)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('createRegistrationFeePayment trả về paymentUrl của VNPay (AC-27.4)', async () => {
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue(
      envelope({
        paymentId: 'pay-1',
        amount: 200000,
        paymentUrl: 'https://vnpay.test/pay-1',
      }) as never,
    );

    const link = await createRegistrationFeePayment('ven-1');

    expect(post.mock.calls[0][0]).toBe('/api/vendors/ven-1/registration-fee-payments');
    expect(link).toEqual({
      paymentId: 'pay-1',
      amount: 200000,
      paymentUrl: 'https://vnpay.test/pay-1',
    });
  });
});
