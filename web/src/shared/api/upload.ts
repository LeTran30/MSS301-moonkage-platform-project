import { apiClient } from './client';
import { GATEWAY } from './gateway';
import { unwrap } from './envelope';
import { isDemoMode } from '@/shared/config';

/**
 * The write side of a file upload to the private object storage (FR-26, FR-29).
 *
 * Step 1 asks the backend for a signed link, step 2 sends the bytes straight
 * to the object storage — the API service never receives them.
 *
 * The order and the vendor documents live in different buckets, so the caller
 * says which one it wants.
 */

/** Wire shape of `com.moonkage.*.dto.response.PresignedUploadLinkResponse`. */
export interface UploadLink {
  tempKey: string;
  uploadUrl: string;
  formFields?: Record<string, string>;
  expiresAt?: string;
}

/** Which service owns the bucket the file goes to. */
export type UploadTarget = 'ORDER' | 'VENDOR';

/** Ask the backend for a signed upload link. */
export async function createUploadLink(
  target: UploadTarget,
  contentType: string,
  sizeBytes: number
): Promise<UploadLink | null> {
  if (isDemoMode()) {
    return null;
  }
  const url = target === 'ORDER' ? GATEWAY.ORDER.UPLOADS : GATEWAY.VENDOR.UPLOADS;
  const res = await apiClient.post<unknown>(url, { contentType, sizeBytes });
  return unwrap<UploadLink>(res);
}

/**
 * Send one file to the private object storage and keep its `tempKey`.
 *
 * In demo mode there is no backend to ask, so the answer is `null` and the
 * caller tells the user the step was skipped.
 */
export async function uploadFile(
  target: UploadTarget,
  file: File
): Promise<string | null> {
  const link = await createUploadLink(
    target,
    file.type || 'application/octet-stream',
    file.size
  );
  if (!link?.uploadUrl || !link.tempKey) {
    if (isDemoMode()) {
      return null;
    }
    throw new Error('Máy chủ không trả về liên kết tải tệp lên.');
  }

  await uploadFileToLink(link, file);
  return link.tempKey;
}

/**
 * Send the bytes of one file to a signed link.
 *
 * Step 2 of every upload: the link comes from the service that owns the
 * bucket, so the caller that already has the link does not have to ask again.
 * The form fields go first and the file last, named `file`.
 */
export async function uploadFileToLink(link: UploadLink, file: File): Promise<void> {
  const form = new FormData();
  Object.entries(link.formFields ?? {}).forEach(([key, value]) => {
    form.append(key, value);
  });
  form.append('file', file);

  const res = await fetch(link.uploadUrl, { method: 'POST', body: form });
  if (!res.ok) {
    throw new Error('Không tải được tệp lên kho lưu trữ.');
  }
}
