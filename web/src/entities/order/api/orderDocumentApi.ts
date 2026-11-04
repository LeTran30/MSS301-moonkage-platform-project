import { apiClient, GATEWAY, unwrap, unwrapList } from '@/shared/api';
import { isDemoMode } from '@/shared/config';
import { orderStore, type MaketVersion } from '../model';

/**
 * Wire shape of `com.moonkage.order.dto.response.MockupResponse`.
 *
 * The backend names the file link `downloadUrl` (a short-lived link), the status
 * `reviewStatus` and the note `reviewNote`.
 */
export interface MockupDto {
  versionNo: number;
  downloadUrl: string;
  reviewStatus: 'PENDING_REVIEW' | 'APPROVED' | 'CHANGES_REQUESTED';
  reviewNote?: string | null;
  uploadedAt?: string;
  reviewedAt?: string | null;
}

/**
 * Backend `com.moonkage.order.enums.MockupReviewStatus`.
 *
 * The UI used `PENDING | APPROVED | REJECTED`; `CHANGES_REQUESTED` is not the same
 * as `REJECTED` — the vendor may send a new version, so the mockup is not refused.
 */
export type MockupReviewStatus = 'PENDING_REVIEW' | 'APPROVED' | 'CHANGES_REQUESTED';

const MOCKUP_STATUS_MAP: Record<MockupReviewStatus, MaketVersion['status']> = {
  PENDING_REVIEW: 'PENDING',
  APPROVED: 'APPROVED',
  CHANGES_REQUESTED: 'REJECTED',
};

/** Map a backend mockup to the UI maket version. */
export function mapMockupDtoToEntity(dto: MockupDto): MaketVersion {
  return {
    version: dto.versionNo,
    imageUrl: dto.downloadUrl,
    submittedAt: dto.uploadedAt ?? new Date().toISOString(),
    status: MOCKUP_STATUS_MAP[dto.reviewStatus] ?? 'PENDING',
    comment: dto.reviewNote ?? undefined,
  };
}

/**
 * Wire shape of `com.moonkage.order.dto.response.ReviewResponse`.
 *
 * One review per product of a delivered buy-now order (FR-11, BR-32).
 */
export interface ReviewDto {
  reviewId: string;
  productId: string;
  rating: number;
  content?: string;
  createdAt?: string;
}

/** Wire shape of `com.moonkage.order.dto.request.CreateReviewRequest`. */
export interface CreateReviewPayload {
  productId: string;
  rating: number;
  content?: string;
}

export type ProductReview = {
  id: string;
  productId: string;
  rating: number;
  content: string;
  createdAt: string;
};

/** Map a backend review to the UI review. */
export function mapReviewDtoToEntity(dto: ReviewDto): ProductReview {
  return {
    id: dto.reviewId,
    productId: dto.productId,
    rating: dto.rating,
    content: dto.content ?? '',
    createdAt: dto.createdAt ?? new Date().toISOString(),
  };
}

/** Wire shape of `com.moonkage.order.dto.response.FileLinkResponse`. */
export interface FileLinkDto {
  fileId?: string;
  downloadUrl: string;
  fileName?: string;
}

/**
 * Wire shape of `com.moonkage.order.dto.response.PresignedUploadLinkResponse`.
 *
 * Before `expiresAt`, the client sends a multipart POST to `uploadUrl` with
 * every `formFields` entry as a field and the file last, named `file`.
 */
export interface UploadLinkDto {
  tempKey: string;
  uploadUrl: string;
  formFields?: Record<string, string>;
  expiresAt?: string;
}

/**
 * The read side of the order documents (FR-11, FR-20, FR-25).
 *
 * The writes (`uploadMockup`, `attachInvoice`, `reviewMockup`) belong to the
 * `fulfill-order` feature (package-architecture §3 — `api/` of a feature holds
 * the writes).
 */
export const orderDocumentApi = {
  /** The maket versions of an order (FR-20, FR-39). */
  async getMockups(orderId: string): Promise<MaketVersion[]> {
    if (isDemoMode()) {
      return orderStore.get().find((o) => o.id === orderId)?.maketVersions ?? [];
    }
    const res = await apiClient.get<unknown>(GATEWAY.ORDER.MAKET_MOCKUPS(orderId));
    return unwrapList<MockupDto>(res).map(mapMockupDtoToEntity);
  },

  /** The reviews of an order (FR-11). */
  async getReviews(orderId: string): Promise<ProductReview[]> {
    if (isDemoMode()) {
      return [];
    }
    const res = await apiClient.get<unknown>(GATEWAY.ORDER.REVIEWS(orderId));
    return unwrapList<ReviewDto>(res).map(mapReviewDtoToEntity);
  },

  /** The link to the vendor's invoice (FR-25). */
  async getInvoice(orderId: string): Promise<FileLinkDto | null> {
    if (isDemoMode()) {
      const order = orderStore.get().find((o) => o.id === orderId);
      return order?.invoiceCompanyInfo ? { downloadUrl: '/invoices/invoice.pdf' } : null;
    }
    const res = await apiClient.get<unknown>(`${GATEWAY.ORDER.ORDER_BY_ID(orderId)}/invoice`);
    return unwrap<FileLinkDto>(res);
  },
};
