import { useCallback } from 'react';
import { acceptQuote, type AcceptQuotePayload } from '../api/acceptQuoteApi';
import type { AcceptQuoteResponseDto } from '@/entities/request';

/**
 * The buyer accepts one quote of a request (FR-08, FR-30).
 *
 * The backend creates the order and the deposit invoice from it.
 */
export function useAcceptQuote() {
  return useCallback(
    (
      requestId: string,
      quoteId: string,
      payload?: AcceptQuotePayload,
    ): Promise<AcceptQuoteResponseDto> => acceptQuote(requestId, quoteId, payload),
    [],
  );
}
