import { describe, it, expect, vi, beforeEach } from 'vitest';
import { advanceOrder } from '../advanceOrderApi';
import * as envModule from '@/shared/config/env';
import { apiClient } from '@/shared/api';
import { envelope } from '@/shared/api/__tests__/envelopeFixtures';

describe('Feature advance-order-status - advanceOrderApi (FR-32, FR-40, FR-42)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(envModule, 'isDemoMode').mockReturnValue(false);
  });

  it('gửi PATCH đúng endpoint của đơn và trả về entity đã map', async () => {
    const patch = vi.spyOn(apiClient, 'patch').mockResolvedValue(
      envelope({
        id: 'ord-1',
        kind: 'BUY_NOW',
        status: 'CONFIRMED',
        totalAmount: 500000,
      }) as never,
    );

    const order = await advanceOrder('ord-1', { status: 'CONFIRMED', note: 'Đã chuẩn bị nguyên liệu' });

    expect(patch).toHaveBeenCalledWith('/order-service/api/orders/ord-1', {
      status: 'CONFIRMED',
      note: 'Đã chuẩn bị nguyên liệu',
    });
    expect(order.id).toBe('ord-1');
    expect(order.status).toBe('CONFIRMED');
    expect(order.total).toBe(500000);
  });

  it('báo lỗi khi máy chủ không trả về trạng thái đơn', async () => {
    vi.spyOn(apiClient, 'patch').mockResolvedValue(envelope(null) as never);

    await expect(advanceOrder('ord-2', { status: 'SHIPPING' })).rejects.toThrow(
      /không trả về trạng thái đơn hàng/i,
    );
  });
});
