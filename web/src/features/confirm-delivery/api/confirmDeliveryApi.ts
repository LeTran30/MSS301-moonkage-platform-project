import { orderStore, type Order } from '@/entities/order';
import { mockResponse } from '@/shared/api/mock';
import { nowStamp, today } from '@/shared/utils/format';

export function confirmReceived(orderId: string): Promise<Order | null> {
  const next = orderStore.update((list) =>
    list.map((o) =>
      o.id === orderId && o.kind === 'ready'
        ? { ...o, status: 'delivered', deliveredAt: today(), history: [{ label: 'Bạn xác nhận đã nhận hàng', at: nowStamp() }, ...o.history] }
        : o,
    ),
  );
  return mockResponse(next.find((o) => o.id === orderId) ?? null);
}
