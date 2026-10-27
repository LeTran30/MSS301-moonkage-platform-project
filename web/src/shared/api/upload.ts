import { config } from '../config/env';
import { ApiError } from './client';

const NETWORK_ERROR_MSG = 'Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.';

/**
 * MinIO presigned POST link returned by `POST /api/<root>/uploads` (common-storage `PresignedUploadLinkResponse`).
 * Every `formFields` entry must be appended to the multipart FormData before the `file` field.
 */
export interface PresignedUploadLink {
  tempKey: string;
  uploadUrl: string;
  formFields: Record<string, string>;
  expiresAt: string;
}

export interface UploadRequestPayload {
  contentType: string;
  sizeBytes: number;
}

/** Build a stand-in upload link for demo mode (`config.demoMode`). */
export function demoUploadLink(prefix = 'tmp/demo'): PresignedUploadLink {
  const now = Date.now();
  return {
    tempKey: `${prefix}/${now}-${Math.random().toString(36).slice(2, 8)}`,
    uploadUrl: 'demo://upload',
    formFields: {},
    expiresAt: new Date(now + 10 * 60 * 1000).toISOString(),
  };
}

/**
 * Uploads `file` directly to MinIO using the presigned POST link and resolves to `link.tempKey` (`objectKey`).
 * In demo mode, skips the network call and resolves to `link.tempKey` immediately.
 */
export async function uploadToPresignedUrl(link: PresignedUploadLink, file: File): Promise<string> {
  if (config.demoMode || link.uploadUrl.startsWith('demo://')) {
    return link.tempKey;
  }
  const formData = new FormData();
  for (const [key, value] of Object.entries(link.formFields)) {
    formData.append(key, value);
  }
  formData.append('file', file);

  let response: Response;
  try {
    response = await fetch(link.uploadUrl, {
      method: 'POST',
      body: formData,
    });
  } catch {
    throw new ApiError(0, null, NETWORK_ERROR_MSG);
  }

  if (!response.ok) {
    throw new ApiError(response.status, 'UPLOAD_FAILED', 'Tải tệp lên không thành công. Vui lòng thử lại.');
  }
  return link.tempKey;
}
