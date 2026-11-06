import { useCallback } from 'react';

import { uploadFileToLink } from '@/shared/api';

import { createVendorUploadLink } from '../api/vendorSettingsApi';

/**
 * Upload one document of the shop's legal profile (FR-26).
 *
 * Vì sao có hook riêng thay vì dùng feature `file-upload`: FSD cấm feature
 * import feature. Feature này đã có sẵn endpoint riêng
 * (`POST /api/vendors/uploads`) nên nó tự lo vòng đời tải của mình.
 */
export function useUploadVendorDocument() {
  return useCallback(async (file: File): Promise<string | null> => {
    const link = await createVendorUploadLink(
      file.type || 'application/octet-stream',
      file.size,
    );
    if (!link?.uploadUrl || !link.tempKey) {
      throw new Error('Máy chủ không trả về liên kết tải tệp lên.');
    }

    await uploadFileToLink(link, file);
    return link.tempKey;
  }, []);
}
