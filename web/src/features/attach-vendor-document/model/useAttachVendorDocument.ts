import { useCallback } from 'react';
import {
  attachVendorDocument,
  type CreateVendorDocumentPayload,
} from '../api/attachVendorDocumentApi';
import type { VendorDocumentDto } from '@/entities/vendor';

/**
 * The admin attaches the registration fee invoice of a shop (Q-36, AC-27.6).
 */
export function useAttachVendorDocument() {
  return useCallback(
    (
      vendorId: string,
      payload: CreateVendorDocumentPayload,
    ): Promise<VendorDocumentDto | null> => attachVendorDocument(vendorId, payload),
    [],
  );
}
