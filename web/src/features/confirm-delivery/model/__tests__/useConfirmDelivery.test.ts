import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { apiClient, queryClient, queryKeys } from '@/shared/api';
import { envelope } from '@/shared/api/__tests__/envelopeFixtures';
import type { Order } from '@/entities/order';
import { useConfirmDelivery } from '../useConfirmDelivery';

describe('Feature confirm-delivery - useConfirmDelivery (FR-11)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    queryClient.clear();
  });

  it('đưa đơn trong cache chi tiết sang COMPLETED để trang ẩn nút "Đã nhận hàng"', async () => {
    const key = queryKeys.order.detail('ord-1');
    queryClient.setQueryData(key, { id: 'ord-1', status: 'DELIVERED' } as Order);
    vi.spyOn(apiClient, 'patch').mockResolvedValue(
      envelope({ id: 'ord-1', kind: 'BUY_NOW', status: 'COMPLETED', totalAmount: 530000 }) as never,
    );
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useConfirmDelivery());
    await result.current('ord-1');

    expect(queryClient.getQueryData<Order>(key)?.status).toBe('COMPLETED');
    expect(invalidate).toHaveBeenCalledWith({ queryKey: key });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: queryKeys.order.progress('ord-1') });
  });
});
