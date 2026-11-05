import { describe, it, expect, vi, beforeEach } from 'vitest';
import { withdrawQuote } from '../withdrawQuoteApi';
import { apiClient } from '@/shared/api';
import { envelope } from '@/shared/api/__tests__/envelopeFixtures';

describe('Feature withdraw-quote - withdrawQuoteApi (BR-05)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('gửi PATCH với status WITHDRAWN đúng endpoint của báo giá', async () => {
    const patch = vi.spyOn(apiClient, 'patch').mockResolvedValue(
      envelope({
        id: 'quo-1',
        vendorId: 'ven-1',
        totalAmount: 12000000,
        status: 'WITHDRAWN',
      }) as never,
    );

    const quote = await withdrawQuote('req-1', 'quo-1');

    expect(patch).toHaveBeenCalledWith('/quotation-service/api/quote-requests/req-1/quotes/quo-1', {
      status: 'WITHDRAWN',
    });
    expect(quote.status).toBe('WITHDRAWN');
    expect(quote.totalPrice).toBe(12000000);
  });
});
