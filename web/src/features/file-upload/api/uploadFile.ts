import { createUploadLink, GATEWAY, uploadFileToLink, type UploadLink } from '@/shared/api';

/**
 * The write side of a file upload to the private object storage (FR-26, FR-29).
 *
 * Step 1 asks the backend for a signed link, step 2 sends the bytes straight
 * to the object storage — the API service never receives them.
 *
 * Vì sao nằm ở `features/` chứ không ở `shared/`: "tệp này vào kho nào" là một
 * quyết định nghiệp vụ (đơn hàng hay hồ sơ gian hàng), không phải tiện ích
 * hạ tầng. `shared/` chỉ giữ phần vận chuyển thuần (`createUploadLink`,
 * `uploadFileToLink`) — tầng `shared` không được chứa logic của feature.
 */

/**
 * Which service owns the bucket the file goes to.
 *
 * The order and the vendor documents live in different buckets, so the caller
 * says which one it wants.
 */
export type UploadTarget = 'ORDER' | 'VENDOR';

/** Giai đoạn của một lần tải tệp lên — dùng để báo tiến độ cho người dùng. */
export type UploadPhase = 'idle' | 'linking' | 'uploading' | 'done';

/** Tuỳ chọn của một lần tải tệp lên. */
export interface UploadOptions {
  /** Cho phép huỷ lần tải đang chạy (đóng gói FormData không tự huỷ được). */
  signal?: AbortSignal;
  /** Báo giai đoạn để giao diện vẽ tiến độ. */
  onPhase?: (phase: UploadPhase) => void;
}

/** Endpoint xin link tải lên của từng kho. */
const UPLOAD_URLS: Record<UploadTarget, string> = {
  ORDER: GATEWAY.ORDER.UPLOADS,
  VENDOR: GATEWAY.VENDOR.UPLOADS,
};

/**
 * Send one file to the private object storage and keep its `tempKey`.
 *
 * The backend always answers with a signed link; a missing link is an error.
 */
export async function uploadFile(
  target: UploadTarget,
  file: File,
  options: UploadOptions = {},
): Promise<string | null> {
  options.onPhase?.('linking');

  const link = await createUploadLink(
    UPLOAD_URLS[target],
    file.type || 'application/octet-stream',
    file.size,
  );
  if (!link?.uploadUrl || !link.tempKey) {
    throw new Error('Máy chủ không trả về liên kết tải tệp lên.');
  }

  options.onPhase?.('uploading');
  await uploadFileToLink(link, file, options.signal);

  options.onPhase?.('done');
  return link.tempKey;
}

export type { UploadLink };
