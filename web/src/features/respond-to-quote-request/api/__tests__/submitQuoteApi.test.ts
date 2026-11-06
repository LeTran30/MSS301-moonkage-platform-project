import { describe, it, expect, vi, beforeEach } from 'vitest';
import { submitQuote } from '../submitQuoteApi';
import { apiClient } from '@/shared/api';
import { envelope } from '@/shared/api/__tests__/envelopeFixtures';

describe('Feature respond-to-quote-request - submitQuoteApi (FR-38)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('submitQuote() gửi đủ các dòng và phí giao hàng (FR-38)', async () => {
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue(
      envelope({
        id: 'quo-new',
        vendorId: 'ven-quan',
        totalAmount: 22500000,
        depositRate: 40,
        depositAmount: 9000000,
        remainingAmount: 13500000,
        status: 'SUBMITTED',
      }),
    );

    const quote = await submitQuote('req-1', {
      items: [{ description: '150 hộp bánh', quantity: 150, unitPrice: 150000 }],
      shippingFee: 0,
      depositRate: 40,
      deliveryDate: '2026-11-08',
      deliveryMethod: 'Xe tải',
      validDays: 7,
      notes: 'ép kim',
    });

    expect(quote.depositAmount).toBe(9000000);
    const [url, body] = post.mock.calls[0];
    expect(url).toContain('/quotes');
    expect(body).toMatchObject({
      shippingFee: 0,
      depositRate: 40,
      validDays: 7,
      items: [{ quantity: 150, unitPrice: 150000 }],
    });
  });
});
