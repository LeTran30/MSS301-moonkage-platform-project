import { fetchRequest, quoteRequestStore, type Quote, type QuoteRequest } from '@/entities/quote';
import { apiClient } from '@/shared/api/client';
import { quoteRequestsApi } from '@/shared/api/gateway';
import { mockResponse } from '@/shared/api/mock';
import { config } from '@/shared/config/env';

export async function closeRequest(requestId: string): Promise<QuoteRequest | null> {
  const next = quoteRequestStore.update((list) => list.map((r) => (r.id === requestId ? { ...r, status: 'closed' } : r)));
  if (config.demoMode) {
    return mockResponse(next.find((r) => r.id === requestId) ?? null);
  }
  const current = await fetchRequest(requestId);
  return current ? { ...current, status: 'closed' } : null;
}

/** Accepting one quote is binding: the other quotes of the request close (BR-17). */
export async function acceptQuote(requestId: string, vendorId: string): Promise<{ request: QuoteRequest; quote: Quote } | null> {
  if (config.demoMode) {
    const next = quoteRequestStore.update((list) => list.map((r) => (r.id === requestId ? { ...r, status: 'accepted', acceptedVendorId: vendorId } : r)));
    const request = next.find((r) => r.id === requestId);
    const quote = request?.quotes.find((q) => q.vendorId === vendorId);
    return mockResponse(request && quote ? { request, quote } : null);
  }
  const request = await fetchRequest(requestId);
  const quote = request?.quotes.find((q) => q.vendorId === vendorId);
  if (!request || !quote) return null;
  if (quote.id) {
    await apiClient.post(
      `${quoteRequestsApi}/${encodeURIComponent(requestId)}/quotes/${encodeURIComponent(quote.id)}/acceptance`,
      {},
    );
  }
  return {
    request: { ...request, status: 'accepted', acceptedVendorId: vendorId },
    quote,
  };
}
