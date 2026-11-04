import { apiClient, GATEWAY, unwrap } from '@/shared/api';
import { isDemoMode } from '@/shared/config';
import { orderStore, type MaketVersion } from '@/entities/order';
import type { FileLinkDto, MockupDto, UploadLinkDto } from '@/entities/order';

/**
 * The write side of the order documents (FR-20, FR-25, FR-39, FR-44).
 *
 * The order entity owns the read and the shape of the documents; the writes
 * live here because they change the case, not the order data
 * (package-architecture §3 — `api/` of a feature holds the writes).
 */

/**
 * Step 1 of any file upload (maket, ảnh tiến độ, hóa đơn, bằng chứng):
 * ask the backend for a signed link, then send the file to `uploadUrl`.
 */
export async function createOrderUploadLink(
  contentType: string,
  sizeBytes: number
): Promise<UploadLinkDto | null> {
  if (isDemoMode()) {
    return null;
  }
  const res = await apiClient.post<unknown>(GATEWAY.ORDER.UPLOADS, {
    contentType,
    sizeBytes,
  });
  return unwrap<UploadLinkDto>(res);
}

/** FR-39: the vendor sends a new maket version (`tempKey` of the upload). */
export async function uploadMockup(orderId: string, tempKey: string): Promise<MaketVersion> {
  if (isDemoMode()) {
    const order = orderStore.get().find((o) => o.id === orderId);
    const versions = order?.maketVersions ?? [];
    const version: MaketVersion = {
      version: versions.length + 1,
      imageUrl: '',
      submittedAt: new Date().toISOString(),
      status: 'PENDING',
    };
    return version;
  }
  const res = await apiClient.post<unknown>(GATEWAY.ORDER.MAKET_MOCKUPS(orderId), { tempKey });
  const dto = unwrap<MockupDto>(res);
  if (!dto) {
    throw new Error('Máy chủ không trả về bản maket vừa tải lên.');
  }
  return mapMockupDtoToEntity(dto);
}

/** FR-44: the vendor attaches the invoice it issued (`tempKey` of the upload). */
export async function attachInvoice(
  orderId: string,
  tempKey: string
): Promise<FileLinkDto | null> {
  if (isDemoMode()) {
    return { downloadUrl: '/invoices/invoice.pdf' };
  }
  const res = await apiClient.put<unknown>(GATEWAY.ORDER.INVOICE(orderId), { tempKey });
  return unwrap<FileLinkDto>(res);
}

/** Map a backend mockup to the UI maket version. */
function mapMockupDtoToEntity(dto: MockupDto): MaketVersion {
  const statusMap: Record<string, MaketVersion['status']> = {
    PENDING_REVIEW: 'PENDING',
    APPROVED: 'APPROVED',
    CHANGES_REQUESTED: 'REJECTED',
  };
  return {
    version: dto.versionNo,
    imageUrl: dto.downloadUrl,
    submittedAt: dto.uploadedAt ?? new Date().toISOString(),
    status: statusMap[dto.reviewStatus] ?? 'PENDING',
    comment: dto.reviewNote ?? undefined,
  };
}
