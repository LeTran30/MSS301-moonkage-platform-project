import { createStore } from '@/shared/lib';

import type { Order } from './types';

/**
 * The orders of the caller.
 *
 * The store starts empty and is filled by `useOrders` from `order-service`.
 */
export const orderStore = createStore<Order[]>([]);

export function approveMaket(orderId: string, version: number) {
  orderStore.set((prev) =>
    prev.map((o) => {
      if (o.id !== orderId || !o.maketVersions) return o;
      return {
        ...o,
        status: 'IN_PRODUCTION',
        maketVersions: o.maketVersions.map((mv) =>
          mv.version === version ? { ...mv, status: 'APPROVED' } : mv,
        ),
        progressMilestones: o.progressMilestones?.map((m) =>
          m.id === 'm2' ? { ...m, completed: true, timestamp: new Date().toISOString() } : m,
        ),
      };
    }),
  );
}

export function requestMaketRevision(orderId: string, version: number, feedback: string) {
  orderStore.set((prev) =>
    prev.map((o) => {
      if (o.id !== orderId || !o.maketVersions) return o;
      return {
        ...o,
        maketVersions: o.maketVersions.map((mv) =>
          mv.version === version ? { ...mv, status: 'REJECTED', feedback } : mv,
        ),
      };
    }),
  );
}
