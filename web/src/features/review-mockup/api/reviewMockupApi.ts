import { orderPath, orderStore, type CustomOrder, type Order } from '@/entities/order';
import { apiClient } from '@/shared/api/client';
import { mockResponse } from '@/shared/api/mock';
import { config } from '@/shared/config/env';
import { today } from '@/shared/utils/format';

function patchCustom(orderId: string, change: (o: CustomOrder) => CustomOrder): Promise<Order | null> {
  const next = orderStore.update((list) => list.map((o) => (o.id === orderId && o.kind === 'custom' ? change(o) : o)));
  return mockResponse(next.find((o) => o.id === orderId) ?? null);
}

/** FR-20: the buyer's answer to one mockup version. */
async function reviewMockup(orderId: string, version: number, reviewStatus: 'APPROVED' | 'CHANGES_REQUESTED', reviewNote?: string) {
  await apiClient.patch(`${orderPath(orderId)}/mockups/${version}`, { reviewStatus, reviewNote });
}

export async function approveMockup(orderId: string, version: number) {
  if (!config.demoMode) return reviewMockup(orderId, version, 'APPROVED');
  return patchCustom(orderId, (o) => ({
    ...o,
    step: 'production',
    mockups: o.mockups.map((m) => (m.version === version ? { ...m, state: 'approved' } : m)),
    progress: [...o.progress, { label: `Bạn duyệt maket lần ${version}`, at: today() }],
  }));
}

export async function requestRevision(orderId: string, version: number, feedback: string) {
  if (!config.demoMode) return reviewMockup(orderId, version, 'CHANGES_REQUESTED', feedback);
  return patchCustom(orderId, (o) => ({
    ...o,
    mockups: o.mockups.map((m) => (m.version === version ? { ...m, state: 'revise', feedback } : m)),
    progress: [...o.progress, { label: 'Bạn yêu cầu sửa maket', at: today() }],
  }));
}
