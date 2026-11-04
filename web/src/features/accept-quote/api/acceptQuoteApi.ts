import { apiClient, GATEWAY, unwrap } from '@/shared/api';
import { isDemoMode } from '@/shared/config';
import { generateEntityId } from '@/shared/utils';
import { ANALYTICS_EVENTS, trackEvent } from '@/shared/observability';
import type { AcceptQuoteResponseDto, InvoiceInfoPayload } from '@/entities/request';

/**
 * The write side of accepting a quote (FR-19).
 *
 * The request entity owns the read and the shape of the quote; the write lives
 * here because it accepts the quote, not the quote data
 * (package-architecture §3 — `api/` of a feature holds the writes).
 */

/** Wire shape of `com.moonkage.quotation.dto.request.AcceptQuoteRequest`. */
export interface AcceptQuotePayload {
  invoiceInfo?: InvoiceInfoPayload;
}

/**
 * The buyer accepts a quote (FR-19).
 *
 * The backend freezes the binding copy and answers where to pay the deposit;
 * the order exists only after the deposit succeeds (BR-04).
 */
export async function acceptQuote(
  requestId: string,
  quoteId: string,
  payload?: AcceptQuotePayload
): Promise<AcceptQuoteResponseDto> {
  // Funnel chấp nhận báo giá (FR-19). Không ghi `invoiceInfo` — đó là thông
  // tin hóa đơn của người mua (NFR-03).
  trackEvent(ANALYTICS_EVENTS.acceptQuote, { request_id: requestId });

  if (isDemoMode()) {
    return {
      acceptanceId: generateEntityId('acc'),
      status: 'PENDING_PAYMENT',
      depositAmount: 0,
      paymentId: generateEntityId('pay'),
      paymentUrl: `/gateway/vnpay/${generateEntityId('pay')}`,
    };
  }
  const res = await apiClient.post<unknown>(
    GATEWAY.QUOTATION.ACCEPT_QUOTE(requestId, quoteId),
    payload ?? {}
  );
  const dto = unwrap<AcceptQuoteResponseDto>(res);
  if (!dto) {
    throw new Error('Máy chủ không trả về thông tin đặt cọc.');
  }
  return dto;
}
