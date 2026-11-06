import { useCallback } from 'react';
import { uploadFileToLink } from '@/shared/api';
import { createProductUploadLink } from '../api/productUploadApi';

/**
 * Upload one image of a product and keep its `tempKey` (FR-29).
 *
 * The `tempKey` goes into `imageKeys` of the product that is created or
 * replaced afterwards; the backend removes an upload that never got attached
 * after a day.
 */
export function useUploadProductImage() {
  return useCallback(
    async (vendorId: string, file: File): Promise<string | null> => {
      const link = await createProductUploadLink(
        vendorId,
        file.type || 'application/octet-stream',
        file.size,
      );
      if (!link?.uploadUrl || !link.tempKey) {
        return null;
      }
      await uploadFileToLink(link, file);
      return link.tempKey;
    },
    [],
  );
}
