import { orderStore, type CustomOrder, type Order } from '@/entities/order';
import { mockResponse } from '@/shared/api/mock';
import { today } from '@/shared/utils/format';

function patchCustom(orderId: string, change: (o: CustomOrder) => CustomOrder): Promise<Order | null> {
  const next = orderStore.update((list) => list.map((o) => (o.id === orderId && o.kind === 'custom' ? change(o) : o)));
  return mockResponse(next.find((o) => o.id === orderId) ?? null);
}

export function approveMockup(orderId: string) {
  return patchCustom(orderId, (o) => ({
    ...o,
    step: 'production',
    mockups: o.mockups.map((m, i) => (i === 0 ? { ...m, state: 'approved' } : m)),
    progress: [...o.progress, { label: `Bạn duyệt maket lần ${o.mockups[0]?.version ?? 1}`, at: today() }],
  }));
}

export function requestRevision(orderId: string, feedback: string) {
  return patchCustom(orderId, (o) => ({
    ...o,
    mockups: o.mockups.map((m, i) => (i === 0 ? { ...m, state: 'revise', feedback } : m)),
    progress: [...o.progress, { label: 'Bạn yêu cầu sửa maket', at: today() }],
  }));
}
