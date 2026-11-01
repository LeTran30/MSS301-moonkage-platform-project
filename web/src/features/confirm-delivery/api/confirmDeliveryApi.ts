import { orderPath, orderStore } from '@/entities/order';
import { apiClient } from '@/shared/api/client';
import { mockResponse } from '@/shared/api/mock';
import { config } from '@/shared/config/env';
import { nowStamp, today } from '@/shared/utils/format';

/** FR-11: the buyer confirms receipt; on the server this completes a buy-now order. */
export async function confirmReceived(orderId: string): Promise<void> {
  if (!config.demoMode) {
    await apiClient.patch(orderPath(orderId), { receivedConfirmed: true });
    return;
  }
  orderStore.update((list) =>
    list.map((o) =>
      o.id === orderId && o.kind === 'ready'
        ? { ...o, status: 'delivered', deliveredAt: today(), history: [{ label: 'Bạn xác nhận đã nhận hàng', at: nowStamp() }, ...o.history] }
        : o,
    ),
  );
  await mockResponse(null);
}
