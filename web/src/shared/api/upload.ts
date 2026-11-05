import { apiClient } from './client';
import { unwrap } from './envelope';

/**
 * The transport of a file upload to the private object storage (FR-26, FR-29).
 *
 * Step 1 asks the backend for a signed link, step 2 sends the bytes straight
 * to the object storage — the API service never receives them.
 *
 * Vì sao ở `shared/`: hai chỗ trong repo đây chỉ là **vận chuyển thuần** —
 * không biết tệp đó là bằng chứng khiếu nại, hóa đơn VAT hay maket. Quy tắc
 * nghiệp vụ ("tệp này vào kho nào", "báo tiến độ thế nào") thuộc về feature
 * `file-upload`, không thuộc về tầng `shared`.
 */

/** Wire shape of `com.moonkage.*.dto.response.PresignedUploadLinkResponse`. */
export interface UploadLink {
  tempKey: string;
  uploadUrl: string;
  formFields?: Record<string, string>;
  expiresAt?: string;
}

/**
 * Ask the backend for a signed upload link at `url`.
 *
 * `url` do người gọi chỉ định vì endpoint upload nằm ở service nào là quyết
 * định của nghiệp vụ, không phải của tầng vận chuyển.
 */
export async function createUploadLink(
  url: string,
  contentType: string,
  sizeBytes: number,
): Promise<UploadLink | null> {
  const res = await apiClient.post<unknown>(url, { contentType, sizeBytes });
  return unwrap<UploadLink>(res);
}

/**
 * Send the bytes of one file to a signed link.
 *
 * Step 2 of every upload: the link comes from the service that owns the
 * bucket, so the caller that already has the link does not have to ask again.
 * The form fields go first and the file last, named `file`.
 */
export async function uploadFileToLink(
  link: UploadLink,
  file: File,
  signal?: AbortSignal,
): Promise<void> {
  const form = new FormData();
  Object.entries(link.formFields ?? {}).forEach(([key, value]) => {
    form.append(key, value);
  });
  form.append('file', file);

  const res = await fetch(link.uploadUrl, { method: 'POST', body: form, signal });
  if (!res.ok) {
    throw new Error('Không tải được tệp lên kho lưu trữ.');
  }
}
