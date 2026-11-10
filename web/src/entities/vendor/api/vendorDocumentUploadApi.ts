import { createUploadLink, GATEWAY, uploadFileToLink } from '@/shared/api';

/**
 * Upload one document of a vendor's legal profile (FR-26, AC-27.2).
 *
 * Step 1 asks vendor-service for a signed link (`POST /api/vendors/uploads`),
 * step 2 sends the bytes straight to the object storage. The `tempKey` it
 * returns goes into the `documents` of the submission.
 *
 * Vì sao nằm ở entity: cả khai hồ sơ lần đầu (`register-vendor`) lẫn nộp lại
 * (`edit-vendor-settings`) đều tải giấy tờ vào cùng một kho, mà FSD cấm
 * feature import feature.
 */
export async function uploadVendorDocument(file: File): Promise<string> {
  const link = await createUploadLink(
    GATEWAY.VENDOR.UPLOADS,
    file.type || 'application/octet-stream',
    file.size,
  );
  if (!link?.uploadUrl || !link.tempKey) {
    throw new Error('Máy chủ không trả về liên kết tải tệp lên.');
  }

  await uploadFileToLink(link, file);
  return link.tempKey;
}
