import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createQuoteRequest } from '../createQuoteRequestApi';
import * as envModule from '@/shared/config/env';
import { apiClient } from '@/shared/api';
import { envelope } from '@/shared/api/__tests__/envelopeFixtures';

describe('Feature request-quote - createQuoteRequestApi (FR-15, FR-16)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('createQuoteRequest() gửi đúng body CreateQuoteRequestRequest', async () => {
    vi.spyOn(envModule, 'isDemoMode').mockReturnValue(false);
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue(
      envelope({
        id: 'req-new',
        type: 'OPEN',
        quantity: 150,
        status: 'OPEN',
        delivery: {
          recipientName: 'Chị Lan',
          recipientPhone: '0918889999',
          provinceCode: '01',
          addressDetail: '29 Liễu Giai',
        },
      })
    );

    const created = await createQuoteRequest({
      type: 'OPEN',
      quantity: 150,
      budget: 160000,
      customTypes: ['BAG'],
      customSpec: 'In logo',
      deliveryDeadline: '2026-11-10',
      delivery: {
        recipientName: 'Chị Lan',
        recipientPhone: '0918889999',
        provinceCode: '01',
        addressDetail: '29 Liễu Giai',
      },
    });

    expect(created.id).toBe('req-new');
    const [url, body] = post.mock.calls[0];
    expect(url).toContain('/quote-requests');
    expect(body).toMatchObject({
      type: 'OPEN',
      quantity: 150,
      delivery: { provinceCode: '01', recipientPhone: '0918889999' },
    });
  });
});
