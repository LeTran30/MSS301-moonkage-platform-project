import { useCallback } from 'react';
import { attachInvoice, uploadMockup } from '../api/orderDocumentWriteApi';
import type { FileLinkDto, MaketVersion } from '@/entities/order';

/**
 * The seller attaches the invoice file of an order (FR-27).
 *
 * `tempKey` is the key the file got when it was uploaded first.
 */
export function useAttachInvoice() {
  return useCallback(
    (orderId: string, tempKey: string): Promise<FileLinkDto | null> =>
      attachInvoice(orderId, tempKey),
    [],
  );
}

/** The seller sends a mockup of a custom order (FR-26). */
export function useUploadMockup() {
  return useCallback(
    (orderId: string, tempKey: string): Promise<MaketVersion> => uploadMockup(orderId, tempKey),
    [],
  );
}
