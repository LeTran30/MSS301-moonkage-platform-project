import { useAsync } from '../../../shared/ui';
import { acceptQuote, closeRequest, createRequest, fetchRequest, fetchRequests, type NewRequest } from '../api/quotesApi';
import type { Quote, QuoteRequest, RequestStatus } from '../api/types';

export type { NewRequest, Quote, QuoteRequest, RequestStatus };
export { acceptQuote, closeRequest, createRequest };

export function useRequests() {
  return useAsync(fetchRequests, []);
}

export function useRequest(requestId: string) {
  return useAsync(() => fetchRequest(requestId), [requestId]);
}
