import { apiClient, GATEWAY, unwrap } from '@/shared/api';

import { ANALYTICS_EVENTS, trackEvent } from '@/shared/observability';
import { type QuoteRequest } from '@/entities/request';
import { mapQuoteRequestDto, type QuoteRequestDto } from '@/entities/request';

/**
 * The write side of the quote request (FR-15, FR-16).
 *
 * The request entity owns the read (`getRequests`, `getRequestById`) and the
 * shape of the request; the write lives here because it creates the request,
 * not the request data (package-architecture §3 — `api/` of a feature holds
 * the writes).
 */

/** Wire shape of `com.moonkage.quotation.dto.request.CreateQuoteRequestRequest`. */
export interface CreateQuoteRequestPayload {
  type: 'OPEN' | 'DIRECT';
  targetVendorId?: string;
  productId?: string;
  quantity: number;
  budget?: number;
  customTypes?: QuoteRequest['customTypes'];
  customSpec?: string;
  deliveryDeadline: string;
  delivery: {
    recipientName: string;
    recipientPhone: string;
    provinceCode: string;
    addressDetail: string;
  };
}

/**
 * Create a quote request (FR-15 DIRECT, FR-16 OPEN).
 *
 * The backend needs a verified NFC account (BR-23) and answers with the
 * created request.
 */
export async function createQuoteRequest(
  payload: CreateQuoteRequestPayload,
): Promise<QuoteRequest> {
  // Funnel báo giá (FR-15, FR-16). Không ghi `budget`, `customSpec` hay thông
  // tin giao hàng — đó là dữ liệu tài chính và PII (NFR-03).
  trackEvent(ANALYTICS_EVENTS.submitQuoteRequest, {
    type: payload.type,
    quantity: payload.quantity,
  });

  const res = await apiClient.post<unknown>(GATEWAY.QUOTATION.REQUESTS, payload);
  const dto = unwrap<QuoteRequestDto>(res);
  if (!dto) {
    throw new Error('Máy chủ không trả về yêu cầu báo giá.');
  }
  return mapQuoteRequestDto(dto);
}
