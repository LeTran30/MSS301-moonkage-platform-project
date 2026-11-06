import { apiClient, GATEWAY, unwrap } from '@/shared/api';

import { type MaketVersion } from '@/entities/order';
import type { MockupDto, MockupReviewStatus } from '@/entities/order';

/**
 * The write side of the buyer's review of a maket (FR-20).
 *
 * The order entity owns the read and the shape of the maket; the write lives
 * here because it decides the version, not the order data
 * (package-architecture §3 — `api/` of a feature holds the writes).
 */

/**
 * The buyer approves a maket version or asks for changes (FR-20).
 *
 * `reviewNote` is required by the backend when the status is `CHANGES_REQUESTED`.
 */
export async function reviewMockup(
  orderId: string,
  versionNo: number,
  payload: { reviewStatus: MockupReviewStatus; reviewNote?: string },
): Promise<MaketVersion> {
  const res = await apiClient.patch<unknown>(
    GATEWAY.ORDER.MAKET_PATCH(orderId, versionNo),
    payload,
  );
  const dto = unwrap<MockupDto>(res);
  if (!dto) {
    throw new Error('Máy chủ không trả về trạng thái maket.');
  }
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
