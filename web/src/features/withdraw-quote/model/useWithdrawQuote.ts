import { useCallback } from 'react';
import { withdrawQuote, type WithdrawQuotePayload } from '../api/withdrawQuoteApi';
import type { Quote } from '@/entities/request';

/**
 * The vendor takes back a quote it sent (BR-05).
 */
export function useWithdrawQuote() {
  return useCallback(
    (
      requestId: string,
      quoteId: string,
      payload?: WithdrawQuotePayload,
    ): Promise<Quote> => withdrawQuote(requestId, quoteId, payload),
    [],
  );
}
