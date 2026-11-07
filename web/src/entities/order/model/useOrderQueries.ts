import { useQueries } from '@tanstack/react-query';
import { useQueryData } from '@/shared/lib';
import { queryKeys } from '@/shared/api';
import { orderApi } from '../api/orderApi';
import type { ProgressUpdate } from '../api/orderDto';
import { orderDocumentApi, type FileLinkDto, type ProductReview } from '../api/orderDocumentApi';
import type { MaketVersion, Order } from './types';

/**
 * The orders of the caller.
 *
 * `vendorId` narrows the list to one shop (the seller channel); `openDispute`
 * keeps only the orders waiting for a decision (FR-49).
 */
export function useOrderList(options?: {
  vendorId?: string | null;
  openDispute?: boolean;
  status?: string;
}) {
  const vendorId = options?.vendorId ?? null;
  const openDispute = options?.openDispute ?? false;
  const status = options?.status;
  return useQueryData(queryKeys.order.list(vendorId, openDispute, status), () =>
    orderApi.getOrders({ vendorId: vendorId ?? undefined, openDispute, status }),
  );
}

/** One order of the caller. */
export function useOrderDetail(orderId: string) {
  return useQueryData(queryKeys.order.detail(orderId), () => orderApi.getOrderById(orderId));
}

/** The progress history of an order (FR-21). */
export function useOrderProgress(orderId: string) {
  return useQueryData(queryKeys.order.progress(orderId), () => orderApi.getProgressUpdates(orderId));
}

/** The reviews of an order (FR-11, BR-32). */
export function useOrderReviews(orderId: string) {
  return useQueryData(queryKeys.order.reviews(orderId), () => orderDocumentApi.getReviews(orderId));
}

/**
 * The ids of these orders whose latest maket waits for the buyer (FR-20).
 *
 * An order stays `WAITING_MAKET` after the buyer approved until the Shop starts
 * production, so it reads the latest maket of each such order. It shares
 * the cache of `useOrderMockups`, so a review updates the list too.
 */
export function usePendingMaketOrderIds(orders: Order[]): string[] {
  const waiting = orders.filter((o) => o.status === 'WAITING_MAKET');
  const results = useQueries({
    queries: waiting.map((o) => ({
      queryKey: queryKeys.order.mockups(o.id),
      queryFn: () => orderDocumentApi.getMockups(o.id),
    })),
  });
  return waiting
    .filter((_, i) => {
      const versions = results[i]?.data ?? [];
      if (versions.length === 0) return false;
      const latest = versions.reduce((a, b) => (b.version > a.version ? b : a));
      return latest.status === 'PENDING';
    })
    .map((o) => o.id);
}

/** The maket versions of a custom order (FR-20, FR-39). */
export function useOrderMockups(orderId: string, options?: { enabled?: boolean }) {
  return useQueryData(
    queryKeys.order.mockups(orderId),
    () => orderDocumentApi.getMockups(orderId),
    options,
  );
}

/** The link to the vendor's invoice of an order (FR-25). */
export function useOrderInvoice(orderId: string) {
  return useQueryData(queryKeys.order.invoice(orderId), () => orderDocumentApi.getInvoice(orderId));
}

export type { FileLinkDto, MaketVersion, Order, ProductReview, ProgressUpdate };
