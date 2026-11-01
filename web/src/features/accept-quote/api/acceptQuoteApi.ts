import { startDemoPayment, type PaymentLink } from '@/entities/payment';
import { deposit, fetchRequest, quoteRequestStore, type Quote, type QuoteRequest } from '@/entities/quote';
import { ApiError, apiClient, type ApiResponse } from '@/shared/api/client';
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

const QUOTE_WITHOUT_ID_MSG = 'Không tìm thấy báo giá này trên máy chủ. Tải lại trang rồi thử lại.';

/** quotation-service `AcceptQuoteResponse`: where to pay the deposit (BR-04). */
interface AcceptQuoteResponseDto {
  acceptanceId: string;
  depositAmount: number;
  paymentId: string;
  paymentUrl: string;
  paymentExpiresAt: string;
}

/**
 * Accepting one quote is binding: the other quotes of the request close (BR-17). Answers where to pay the deposit;
 * the order exists only after it succeeds.
 */
export async function acceptQuote(request: QuoteRequest, quote: Quote): Promise<PaymentLink> {
  if (config.demoMode) {
    quoteRequestStore.update((list) => list.map((r) => (r.id === request.id ? { ...r, status: 'accepted', acceptedVendorId: quote.vendorId } : r)));
    return startDemoPayment('deposit', deposit(quote), `Đặt cọc ${quote.depositPercent}% · ${request.id} · ${quote.vendorName}`, {
      requestId: request.id,
      vendorName: quote.vendorName,
      title: `${quote.boxes} hộp · ${quote.custom.toLowerCase()}`,
      value: quote.total,
      depositPercent: quote.depositPercent,
    });
  }
  // a server quote always has its id; only seed quotes lack one
  if (!quote.id) throw new ApiError(0, null, QUOTE_WITHOUT_ID_MSG);
  const res = await apiClient.post<ApiResponse<AcceptQuoteResponseDto>>(
    `${quoteRequestsApi}/${encodeURIComponent(request.id)}/quotes/${encodeURIComponent(quote.id)}/acceptance`,
    {},
  );
  const { paymentId, paymentUrl } = res.data.data;
  return { paymentId, paymentUrl };
}
