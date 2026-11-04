import { describe, it, expect, vi, beforeEach } from 'vitest';
import { quoteApi } from '../quoteApi';
import * as envModule from '@/shared/config/env';
import { apiClient } from '@/shared/api';
import { envelope } from '@/shared/api/__tests__/envelopeFixtures';
import type { QuoteRequestDto } from '../quoteDto';

describe('Request Entity - quoteApi (FR-15/16/17/19/38)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('quoteApi.getRequests() bóc đúng envelope danh sách của backend', async () => {
    vi.spyOn(envModule, 'isDemoMode').mockReturnValue(false);
    const listing: QuoteRequestDto[] = [
      {
        id: 'req-api-1',
        type: 'OPEN',
        quantity: 100,
        status: 'OPEN',
        invitedCount: 3,
      },
    ];
    vi.spyOn(apiClient, 'get').mockResolvedValue(envelope(listing));

    const requests = await quoteApi.getRequests();
    expect(requests).toHaveLength(1);
    expect(requests[0].id).toBe('req-api-1');
    expect(requests[0].quantity).toBe(100);
  });

  it('quoteApi.getRequestById() nối yêu cầu với danh sách báo giá', async () => {
    vi.spyOn(envModule, 'isDemoMode').mockReturnValue(false);
    vi.spyOn(apiClient, 'get')
      .mockResolvedValueOnce(envelope({ id: 'req-api-2', type: 'OPEN', quantity: 80 }))
      .mockResolvedValueOnce(
        envelope([{ id: 'quo-api-2', vendorId: 'ven-quan', totalAmount: 8000000, status: 'SUBMITTED' }])
      );

    const request = await quoteApi.getRequestById('req-api-2');
    expect(request?.id).toBe('req-api-2');
    expect(request?.quotes).toHaveLength(1);
    expect(request?.quotes[0].totalPrice).toBe(8000000);
  });

  it('quoteApi.getInvitations() đọc danh sách xưởng được mời (AC-36.3)', async () => {
    vi.spyOn(envModule, 'isDemoMode').mockReturnValue(false);
    vi.spyOn(apiClient, 'get').mockResolvedValue(
      envelope([{ vendorId: 'ven-1', status: 'PENDING' }]) as never,
    );

    const invitations = await quoteApi.getInvitations('req-1');

    expect(invitations).toHaveLength(1);
    expect(invitations[0].status).toBe('PENDING');
  });
});
