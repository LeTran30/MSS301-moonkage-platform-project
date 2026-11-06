import { describe, it, expect, vi, beforeEach } from 'vitest';
import { orderApi } from '../orderApi';
import { apiClient } from '@/shared/api';
import { envelope, page } from '@/shared/api/__tests__/envelopeFixtures';
import type { OrderDto } from '../orderDto';

describe('Order Entity - orderApi (T-01)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('orderApi.getOrders() bóc đúng envelope phân trang của backend', async () => {
    const listing: OrderDto[] = [
      {
        id: 'ORD-API-99',
        itemsAmount: 200000,
        shippingFee: 20000,
        totalAmount: 220000,
        status: 'DELIVERED',
        kind: 'BUY_NOW',
        createdAt: '2026-10-25T10:00:00Z',
      },
    ];
    vi.spyOn(apiClient, 'get').mockResolvedValue(envelope(page(listing)));

    const orders = await orderApi.getOrders();
    expect(orders).toHaveLength(1);
    expect(orders[0].id).toBe('ORD-API-99');
    expect(orders[0].status).toBe('DELIVERED');
    expect(orders[0].total).toBe(220000);
  });

  it('orderApi.getOrders() gửi bộ lọc vendorId, kind và openDispute (FR-32, FR-49)', async () => {
    const get = vi.spyOn(apiClient, 'get').mockResolvedValue(envelope(page([])) as never);

    await orderApi.getOrders({
      vendorId: 'ven-1',
      kind: 'CUSTOM_ORDER',
      openDispute: true,
    });

    const url = String(get.mock.calls[0][0]);
    expect(url).toContain('vendorId=ven-1');
    expect(url).toContain('kind=CUSTOM_ORDER');
    expect(url).toContain('disputeStatus=OPEN');
  });

  it('orderApi.getProgressUpdates() đọc lịch sử tiến độ của đơn (FR-21)', async () => {
    vi.spyOn(apiClient, 'get').mockResolvedValue(
      envelope([
        {
          milestone: 'IN_PRODUCTION',
          note: 'Đang làm bánh',
          createdAt: '2026-10-25T10:00:00Z',
        },
      ]) as never,
    );

    const updates = await orderApi.getProgressUpdates('ord-1');

    expect(updates).toHaveLength(1);
    expect(updates[0].milestone).toBe('IN_PRODUCTION');
    expect(updates[0].note).toBe('Đang làm bánh');
  });
});
