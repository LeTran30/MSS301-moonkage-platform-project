import { createStore } from '@/shared/lib';

import type { Order } from './types';

/**
 * The orders of the caller.
 *
 * The store starts empty and is filled by `useOrders` from `order-service`.
 */
export const orderStore = createStore<Order[]>([]);
