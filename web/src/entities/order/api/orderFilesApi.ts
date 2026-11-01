import { apiClient, type ApiResponse } from '@/shared/api/client';
import { ordersPath } from '@/shared/api/gateway';
import { uploadToPresignedUrl, type PresignedUploadLink } from '@/shared/api/upload';
import { config } from '@/shared/config/env';
import { orderPath } from './orderDto';

/**
 * Step 1 and 2 of a mockup, invoice or evidence upload: the signed link from order-service, then the file straight
 * to storage. Answers the tempKey to send where the file is attached.
 */
export async function uploadOrderFile(file: File): Promise<string> {
  const res = await apiClient.post<ApiResponse<PresignedUploadLink>>(`${ordersPath}/uploads`, {
    contentType: file.type || 'application/octet-stream',
    sizeBytes: file.size,
  });
  return uploadToPresignedUrl(res.data.data, file);
}

/** FR-25: a short-lived link to the vendor's invoice. */
async function fetchInvoiceUrl(orderId: string): Promise<string> {
  const res = await apiClient.get<ApiResponse<{ downloadUrl: string }>>(`${orderPath(orderId)}/invoice`);
  return res.data.data.downloadUrl;
}

/** Opens the invoice in a new tab, or here when the browser blocks it; the demo has no file to open. */
export async function openInvoice(orderId: string): Promise<void> {
  if (config.demoMode) return;
  const url = await fetchInvoiceUrl(orderId);
  // no 'noopener' feature: with it window.open always answers null, and the fallback would also run
  if (!window.open(url, '_blank')) window.location.assign(url);
}
