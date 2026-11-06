import { apiClient, GATEWAY, unwrap } from '@/shared/api';
import { isDemoMode } from '@/shared/config';
import type { VendorDocumentDto } from '@/entities/vendor';

/**
 * The write side of the admin's attachment of the registration fee invoice
 * (Q-36, AC-27.6).
 *
 * The vendor entity owns the read and the shape of the document; the write
 * lives here because it attaches a file, not the vendor data
 * (package-architecture §3 — `api/` of a feature holds the writes).
 */

/**
 * Wire shape of `com.moonkage.vendor.vendor.dto.request.CreateVendorDocumentRequest`.
 *
 * `objectKey` is the `tempKey` of the file uploaded first through
 * `POST /api/vendors/uploads`.
 */
export interface CreateVendorDocumentPayload {
  /** `DocumentKind`: only FEE_INVOICE for this endpoint (Q-36). */
  kind: 'FEE_INVOICE';
  objectKey: string;
}

/**
 * The admin attaches the registration fee invoice of a shop (Q-36).
 */
export async function attachVendorDocument(
  vendorId: string,
  payload: CreateVendorDocumentPayload
): Promise<VendorDocumentDto | null> {
  if (isDemoMode()) {
    return null;
  }
  const res = await apiClient.post<unknown>(GATEWAY.VENDOR.DOCUMENTS(vendorId), payload);
  const dto = unwrap<VendorDocumentDto>(res);
  return dto ?? null;
}
