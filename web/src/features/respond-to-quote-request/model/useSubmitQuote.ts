import { useCallback } from 'react';
import { submitQuote, type SubmitQuotePayload } from '../api/submitQuoteApi';
import type { Quote } from '@/entities/request';

/**
 * The seller answers a quote request (FR-30).
 *
 * The page owns the form; this model owns the write.
 */
export function useSubmitQuote() {
  return useCallback(
    (requestId: string, payload: SubmitQuotePayload): Promise<Quote> =>
      submitQuote(requestId, payload),
    [],
  );
}
