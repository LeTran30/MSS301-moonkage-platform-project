import { apiClient, GATEWAY, unwrap } from '@/shared/api';

import { mapQuoteDto, type QuoteDto } from '@/entities/request';
import type { Quote } from '@/entities/request';

/**
 * The write side of taking back a sent quote (BR-05).
 *
 * The request entity owns the read and the shape of the quote; the write lives
 * here because it withdraws the quote, not the quote data
 * (package-architecture §3 — `api/` of a feature holds the writes).
 */

/**
 * Wire shape of `com.moonkage.quotation.dto.request.UpdateQuoteRequest`.
 *
 * A sent quote is never edited: the only change is `WITHDRAWN` (BR-05).
 */
export interface WithdrawQuotePayload {
  status: 'WITHDRAWN';
}

/**
 * The vendor takes back a quote it sent (BR-05).
 */
export async function withdrawQuote(
  requestId: string,
  quoteId: string,
  payload: WithdrawQuotePayload = { status: 'WITHDRAWN' },
): Promise<Quote> {
  const res = await apiClient.patch<unknown>(
    GATEWAY.QUOTATION.UPDATE_QUOTE(requestId, quoteId),
    payload,
  );
  const dto = unwrap<QuoteDto>(res);
  if (!dto) {
    throw new Error('Máy chủ không trả về báo giá vừa rút.');
  }
  return mapQuoteDto(dto);
}
