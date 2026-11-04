import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ledgerApi } from '../ledgerApi';
import * as envModule from '@/shared/config/env';
import { apiClient } from '@/shared/api';
import { envelope, page } from '@/shared/api/__tests__/envelopeFixtures';

describe('Payment Entity - ledgerApi (FR-41, FR-43, FR-47, FR-48)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(envModule, 'isDemoMode').mockReturnValue(false);
  });

  it('getLedgers() gọi đúng URL của payment-service kèm vendorId', async () => {
    const get = vi
      .spyOn(apiClient, 'get')
      .mockResolvedValue(
        envelope(
          page([
            {
              orderId: 'ord-1',
              vendorId: 'ven-1',
              kind: 'CUSTOM_ORDER',
              totalCollected: 8_400_000,
              held: 8_400_000,
              toReceive: 8_400_000,
              expectedPayoutDate: '2026-11-10',
              payable: true,
            },
          ])
        ) as never
      );

    const ledgers = await ledgerApi.getLedgers({ vendorId: 'ven-1' });

    expect(get).toHaveBeenCalledWith(
      '/payment-service/api/ledgers?vendorId=ven-1&size=200'
    );
    expect(ledgers).toHaveLength(1);
    expect(ledgers[0].orderId).toBe('ord-1');
    expect(ledgers[0].payable).toBe(true);
  });

  it('getLedgers() hỗ trợ lọc payableOnly của Admin (AC-48.1)', async () => {
    const get = vi
      .spyOn(apiClient, 'get')
      .mockResolvedValue(envelope(page([])) as never);

    await ledgerApi.getLedgers({ payableOnly: true });

    expect(get).toHaveBeenCalledWith(
      '/payment-service/api/ledgers?payableOnly=true&size=200'
    );
  });

  it('getEntries() đọc sổ ký quỹ của một đơn (NFR-07)', async () => {
    const get = vi.spyOn(apiClient, 'get').mockResolvedValue(
      envelope([
        { kind: 'HOLD', amount: 1_000_000, referenceId: 'ord-1', createdAt: '2026-11-01T00:00:00Z' },
      ]) as never
    );

    const entries = await ledgerApi.getEntries('ord-1');

    expect(get).toHaveBeenCalledWith('/payment-service/api/ledgers/ord-1/entries');
    expect(entries[0].amount).toBe(1_000_000);
  });
});
