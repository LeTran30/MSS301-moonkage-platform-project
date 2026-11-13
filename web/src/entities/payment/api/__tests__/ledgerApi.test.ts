import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ledgerApi } from '../ledgerApi';
import { apiClient } from '@/shared/api';
import { envelope, page } from '@/shared/api/__tests__/envelopeFixtures';

describe('Payment Entity - ledgerApi (FR-41, FR-43, FR-47, FR-48)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('getLedgers() gọi đúng URL của payment-service kèm vendorId', async () => {
    const get = vi.spyOn(apiClient, 'get').mockResolvedValue(
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
        ]),
      ) as never,
    );

    const ledgers = await ledgerApi.getLedgers({ vendorId: 'ven-1' });

    expect(get).toHaveBeenCalledWith('/api/ledgers?vendorId=ven-1&page=0&size=100');
    expect(ledgers).toHaveLength(1);
    expect(ledgers[0].orderId).toBe('ord-1');
    expect(ledgers[0].payable).toBe(true);
  });

  it('getLedgers() hỗ trợ lọc payableOnly của Admin (AC-48.1)', async () => {
    const get = vi.spyOn(apiClient, 'get').mockResolvedValue(envelope(page([])) as never);

    await ledgerApi.getLedgers({ payableOnly: true });

    expect(get).toHaveBeenCalledWith('/api/ledgers?payableOnly=true&page=0&size=100');
  });

  it('getLedgers() đọc tiếp trang sau để không bỏ sót payout thứ 101', async () => {
    const firstPage = Array.from({ length: 100 }, (_, index) => ({
      orderId: `ord-${index}`,
      payable: true,
    }));
    const get = vi.spyOn(apiClient, 'get')
      .mockResolvedValueOnce(envelope(page(firstPage)) as never)
      .mockResolvedValueOnce(envelope(page([{ orderId: 'ord-100', payable: true }])) as never);

    const ledgers = await ledgerApi.getLedgers({ payableOnly: true });

    expect(ledgers).toHaveLength(101);
    expect(get).toHaveBeenNthCalledWith(2, '/api/ledgers?payableOnly=true&page=1&size=100');
  });

  it('getEntries() đọc sổ ký quỹ của một đơn (NFR-07)', async () => {
    const get = vi.spyOn(apiClient, 'get').mockResolvedValue(
      envelope([
        {
          kind: 'HOLD',
          amount: 1_000_000,
          referenceId: 'ord-1',
          createdAt: '2026-11-01T00:00:00Z',
        },
      ]) as never,
    );

    const entries = await ledgerApi.getEntries('ord-1');

    expect(get).toHaveBeenCalledWith('/api/ledgers/ord-1/entries');
    expect(entries[0].amount).toBe(1_000_000);
  });

  it('getDisbursementRequests() dùng endpoint phân trang thay vì gọi từng ledger', async () => {
    const get = vi.spyOn(apiClient, 'get').mockResolvedValue(
      envelope(
        page([
          {
            requestId: 'req-1',
            orderId: 'ord-1',
            vendorId: 'ven-1',
            amount: 500_000,
            status: 'PENDING',
            ledger: { orderId: 'ord-1', vendorId: 'ven-1', held: 1_000_000 },
          },
        ]),
      ) as never,
    );

    const requests = await ledgerApi.getDisbursementRequests({
      vendorId: 'ven-1',
      page: 2,
      size: 50,
    });

    expect(get).toHaveBeenCalledWith(
      '/api/ledgers/disbursements?vendorId=ven-1&page=2&size=50',
    );
    expect(requests[0].ledger.held).toBe(1_000_000);
  });
});
