import { useCallback } from 'react';
import { createQuoteRequest, type CreateQuoteRequestPayload } from '../api/createQuoteRequestApi';
import type { QuoteRequest } from '@/entities/request';

/**
 * The buyer asks for a quote on a big quantity (FR-15).
 *
 * The page owns the form; this model owns the write.
 */
export function useCreateQuoteRequest() {
  return useCallback(
    (payload: CreateQuoteRequestPayload): Promise<QuoteRequest> => createQuoteRequest(payload),
    [],
  );
}
