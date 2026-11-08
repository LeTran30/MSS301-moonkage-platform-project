import { apiClient, GATEWAY, unwrap, unwrapList } from '@/shared/api';

import { useEffect, useState } from 'react';
import { useStore } from '@/shared/lib';
import { requestStore, type Quote, type QuoteRequest } from '../model/requestStore';
import { mapQuoteDto, mapQuoteRequestDto } from './quoteMappers';
import type { AcceptanceDto, InvitationDto, QuoteDto, QuoteRequestDto } from './quoteDto';

/**
 * The read side of the quotation-service (FR-15, FR-16, FR-21, FR-36).
 *
 * The requests of the caller and the quotes attached to them are two reads;
 * the writes live in the features that own them.
 */
export const quoteApi = {
  /** The buyer's quote requests, or the vendor's invitations. */
  async getRequests(): Promise<QuoteRequest[]> {
    const res = await apiClient.get<unknown>(GATEWAY.QUOTATION.REQUESTS);
    return unwrapList<QuoteRequestDto>(res).map(mapQuoteRequestDto);
  },

  /**
   * The requests that invited one shop (FR-36).
   *
   * `GET /api/quote-requests?vendorId=...` answers the requests sent to the
   * caller's shop; without `vendorId` the backend answers the caller's own
   * requests as a buyer (AC-16.3). Each request carries the Shop's own quotes
   * (the backend answers a vendor only its quotes), so the screen knows
   * whether the Shop already answered and which quote it may withdraw.
   */
  async getRequestsByVendor(vendorId: string): Promise<QuoteRequest[]> {
    const params = new URLSearchParams({ vendorId });
    const res = await apiClient.get<unknown>(`${GATEWAY.QUOTATION.REQUESTS}?${params.toString()}`);
    const requests = unwrapList<QuoteRequestDto>(res).map(mapQuoteRequestDto);
    return Promise.all(
      requests.map(async (request) => ({ ...request, quotes: await quoteApi.getQuotes(request.id) })),
    );
  },

  async getRequestById(id: string): Promise<QuoteRequest | null> {
    const res = await apiClient.get<unknown>(GATEWAY.QUOTATION.REQUEST_BY_ID(id));
    const dto = unwrap<QuoteRequestDto>(res);
    if (!dto) return null;

    const request = mapQuoteRequestDto(dto);
    const quotesRes = await apiClient.get<unknown>(GATEWAY.QUOTATION.REQUEST_QUOTES(id));
    request.quotes = unwrapList<QuoteDto>(quotesRes).map(mapQuoteDto);
    return request;
  },

  /** The vendor's quotes for one request. */
  async getQuotes(requestId: string): Promise<Quote[]> {
    const res = await apiClient.get<unknown>(GATEWAY.QUOTATION.REQUEST_QUOTES(requestId));
    return unwrapList<QuoteDto>(res).map(mapQuoteDto);
  },

  /** The vendors invited to a request (AC-36.3). */
  async getInvitations(requestId: string): Promise<InvitationDto[]> {
    const res = await apiClient.get<unknown>(GATEWAY.QUOTATION.REQUEST_INVITATIONS(requestId));
    return unwrapList<InvitationDto>(res);
  },

  /**
   * One quote of a request (FR-17).
   *
   * `includeRevisions=true` also answers the older revisions this quote
   * replaced, newest first.
   */
  async getQuote(
    requestId: string,
    quoteId: string,
    includeRevisions = false,
  ): Promise<QuoteDto | null> {
    const params = new URLSearchParams();
    if (includeRevisions) params.set('includeRevisions', 'true');
    const query = params.toString();
    const res = await apiClient.get<unknown>(
      query
        ? `${GATEWAY.QUOTATION.QUOTE_BY_ID(requestId, quoteId)}?${query}`
        : GATEWAY.QUOTATION.QUOTE_BY_ID(requestId, quoteId),
    );
    return unwrap<QuoteDto>(res);
  },

  /**
   * The binding copy of an accepted quote and its deposit (FR-19).
   *
   * Only after the deposit succeeded does the copy become the order's
   * agreement (BR-04).
   */
  async getAcceptance(requestId: string, quoteId: string): Promise<AcceptanceDto | null> {
    const res = await apiClient.get<unknown>(GATEWAY.QUOTATION.GET_ACCEPTANCE(requestId, quoteId));
    const dto = unwrap<AcceptanceDto>(res);
    return dto ?? null;
  },
};

/**
 * The quote requests of the caller, kept in the entity store so every screen
 * (account, vendor, overview) reads the same data.
 *
 * The first render shows the store (empty in a real session); the API answers
 * right after and the store is replaced, so the UI re-renders.
 */
export function useRequests(): QuoteRequest[] {
  const requests = useStore(requestStore);
  const [, setNonce] = useState(0);

  useEffect(() => {
    let current = true;
    quoteApi
      .getRequests()
      .then((loaded) => {
        if (current) {
          requestStore.set(loaded);
          setNonce((n) => n + 1);
        }
      })
      .catch(() => {
        // The error surfaces on the screens that load the requests themselves;
        // the store keeps whatever it had.
      });
    return () => {
      current = false;
    };
  }, []);

  return requests;
}

/** One quote request of the caller. */
export function useRequest(id: string): QuoteRequest | undefined {
  const requests = useRequests();
  return requests.find((r) => r.id === id);
}
