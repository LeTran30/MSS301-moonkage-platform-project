import { QueryClient } from '@tanstack/react-query';
import { ApiError } from './client';

/**
 * Query key factory.
 *
 * Every key is an array whose first element is the entity name, so keys stay
 * hierarchical: invalidating `['product']` drops every product query, while
 * invalidating `['product', 'detail', 'prod_01']` drops one product.
 */
export const queryKeys = {
  product: {
    catalog: (provinceCode: string) => ['product', 'catalog', provinceCode] as const,
    detail: (productId: string, provinceCode?: string) =>
      ['product', 'detail', productId, provinceCode ?? ''] as const,
    reviews: (productId: string) => ['product', 'reviews', productId] as const,
    taxonomy: () => ['product', 'taxonomy'] as const,
  },
  vendor: {
    catalog: () => ['vendor', 'catalog'] as const,
    detail: (vendorId: string | null) => ['vendor', 'detail', vendorId ?? ''] as const,
    myId: () => ['vendor', 'my-id'] as const,
    orderProfile: (vendorId: string) => ['vendor', 'order-profile', vendorId] as const,
    deliveryAreas: (vendorId: string) => ['vendor', 'delivery-areas', vendorId] as const,
    search: (status?: string, ownerAccountId?: string) =>
      ['vendor', 'search', status ?? '', ownerAccountId ?? ''] as const,
    registrationFee: () => ['vendor', 'registration-fee'] as const,
    products: (vendorId: string) => ['vendor', 'products', vendorId] as const,
    product: (vendorId: string, productId: string | null) =>
      ['vendor', 'product', vendorId, productId ?? ''] as const,
  },
  order: {
    list: (vendorId: string | null, openDispute: boolean, status?: string) =>
      ['order', 'list', vendorId ?? '', openDispute, status ?? ''] as const,
    detail: (orderId: string) => ['order', 'detail', orderId] as const,
    progress: (orderId: string) => ['order', 'progress', orderId] as const,
    reviews: (orderId: string) => ['order', 'reviews', orderId] as const,
    mockups: (orderId: string) => ['order', 'mockups', orderId] as const,
    invoice: (orderId: string) => ['order', 'invoice', orderId] as const,
  },
  chat: {
    inbox: (as: string) => ['chat', 'inbox', as] as const,
    thread: (conversationId: string) => ['chat', 'thread', conversationId] as const,
  },
  cart: {
    mine: (provinceCode: string) => ['cart', 'mine', provinceCode] as const,
  },
  quote: {
    requests: () => ['quote', 'requests'] as const,
    requestsByVendor: (vendorId: string) => ['quote', 'requests-by-vendor', vendorId] as const,
    detail: (requestId: string) => ['quote', 'detail', requestId] as const,
    invitations: (requestId: string) => ['quote', 'invitations', requestId] as const,
    quotes: (requestId: string) => ['quote', 'quotes', requestId] as const,
  },
  dispute: {
    open: () => ['dispute', 'open'] as const,
    byOrder: (orderId: string) => ['dispute', 'by-order', orderId] as const,
    byId: (disputeId: string) => ['dispute', 'by-id', disputeId] as const,
  },
  ledger: {
    list: (vendorId?: string) => ['ledger', 'list', vendorId ?? ''] as const,
    detail: (ledgerId: string) => ['ledger', 'detail', ledgerId] as const,
  },
  nfc: {
    status: () => ['nfc', 'status'] as const,
    session: (sessionId: string) => ['nfc', 'session', sessionId] as const,
  },
  platformProduct: {
    list: () => ['platform-product', 'list'] as const,
  },
  vendorAttribute: {
    list: (group: string, includeHidden: boolean) =>
      ['vendor-attribute', 'list', group, includeHidden] as const,
  },
} as const;

/**
 * The single query client of the app.
 *
 * Defaults chosen for a catalogue that changes rarely but must feel instant:
 * - `staleTime` 60s: a screen that re-mounts within a minute reuses the cache
 *   instead of hitting the API again. This is what removes the duplicated
 *   `/catalog/products` call between the bootstrap and the catalogue page.
 * - `retry` 1: one retry for a transient network blip, but a 4xx is not retried.
 * - `refetchOnWindowFocus` off: the app is a B2B back-office, a refocus should
 *   not trigger a burst of requests.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      retry: (failureCount, error) => {
        // A 4xx is a client mistake: retrying changes nothing.
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false;
        return failureCount < 1;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});
