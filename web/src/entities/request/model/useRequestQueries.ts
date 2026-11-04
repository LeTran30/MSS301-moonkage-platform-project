import { useQueryData } from '@/shared/lib';
import { queryKeys } from '@/shared/api';
import { quoteApi } from '../api/quoteApi';
import type { QuoteRequest } from '../model/requestStore';

/**
 * The quote requests of the caller (the buyer asks, the seller answers).
 */
export function useQuoteRequestList() {
  return useQueryData(queryKeys.quote.requests(), () => quoteApi.getRequests());
}

/**
 * The requests that invited one shop (FR-36).
 *
 * The backend decides from the token whose shop it is, so the client only
 * passes the `vendorId` it already knows.
 */
export function useVendorRequestList(vendorId: string | null) {
  return useQueryData(queryKeys.quote.requestsByVendor(vendorId ?? ''), () =>
    vendorId ? quoteApi.getRequestsByVendor(vendorId) : Promise.resolve([]),
  );
}

/** One quote request with its quotes. */
export function useQuoteRequest(requestId: string | null) {
  return useQueryData(queryKeys.quote.detail(requestId ?? ''), () =>
    requestId ? quoteApi.getRequestById(requestId) : Promise.resolve(null),
  );
}

/**
 * The vendors invited to one request (AC-36.3).
 *
 * The vendor uses it to see whether it was invited and whether it answered.
 */
export function useRequestInvitations(requestId: string | null) {
  return useQueryData(queryKeys.quote.invitations(requestId ?? ''), () =>
    requestId ? quoteApi.getInvitations(requestId) : Promise.resolve([]),
  );
}

/**
 * The quotes of one request (FR-17).
 *
 * A buyer sees every quote; a vendor sees only its own, because the backend
 * decides from the token (QuoteRequestController.getQuotes).
 */
export function useRequestQuotes(requestId: string | null) {
  return useQueryData(queryKeys.quote.quotes(requestId ?? ''), () =>
    requestId ? quoteApi.getQuotes(requestId) : Promise.resolve([]),
  );
}

export type { QuoteRequest };
