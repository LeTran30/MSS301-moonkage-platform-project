import { createStore } from '@/shared/lib';

/**
 * Backend `com.moonkage.quotation.enums.QuoteStatus`.
 *
 * The UI used `SENT | REVOKED`, which do not exist on the backend: a quote that
 * was sent is `SUBMITTED`, and a quote the vendor took back is `WITHDRAWN`.
 */
export type QuoteStatus =
  'SUBMITTED' | 'WITHDRAWN' | 'EXPIRED' | 'ACCEPTED' | 'CLOSED' | 'REJECTED';

/** Backend `com.moonkage.quotation.enums.RequestStatus`. */
export type RequestStatus = 'OPEN' | 'AWARDED' | 'CLOSED' | 'EXPIRED';

/** Backend `com.moonkage.quotation.enums.RequestType`. */
export type RequestType = 'OPEN' | 'DIRECT';

/**
 * Backend `com.moonkage.quotation.enums.CustomType` (BR-14): the only custom
 * work a request may ask for and the only custom lines a quote may contain.
 */
export type CustomType = 'BAG' | 'CARD' | 'STICKER' | 'TEMPLATE_BOX';

/**
 * What joins the parts of `customSpec`: the buyer's free text, "Vỏ: …" and "Nhân: …".
 *
 * The request form joins them with it and the spec list splits on it, so both sides read the same parts.
 */
export const SPEC_PART_SEPARATOR = ' | ';

/** The custom types among codes the backend sent, in the order of `CUSTOM_TYPES`; unknown codes are dropped. */
export function toCustomTypes(codes: readonly string[] | undefined): CustomType[] {
  const known = new Set(codes ?? []);
  return CUSTOM_TYPES.filter((type) => known.has(type));
}

/** Vietnamese labels of the request status (shown in the buyer and vendor UI). */
export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  OPEN: 'Đang mở',
  AWARDED: 'Đã chốt xưởng',
  CLOSED: 'Đã đóng',
  EXPIRED: 'Hết hạn',
};

/** Vietnamese labels of the quote status. */
export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  SUBMITTED: 'Đã gửi báo giá',
  WITHDRAWN: 'Đã rút báo giá',
  EXPIRED: 'Hết hiệu lực',
  ACCEPTED: 'Đã được chấp nhận',
  CLOSED: 'Đã kết thúc',
  REJECTED: 'Bị từ chối',
};

/** Vietnamese labels of the custom work types (BR-14). */
export const CUSTOM_TYPE_LABELS: Record<CustomType, string> = {
  BAG: 'Túi giấy',
  CARD: 'Thiệp chúc mừng',
  STICKER: 'Sticker thương hiệu',
  TEMPLATE_BOX: 'Hộp theo mẫu riêng',
};

/** The four custom types a buyer may pick, in the order the UI shows them. */
export const CUSTOM_TYPES: readonly CustomType[] = ['BAG', 'CARD', 'STICKER', 'TEMPLATE_BOX'];

export type Quote = {
  id: string;
  vendorId: string;
  vendorName: string;
  vendorRating: number;
  unitPrice: number;
  shippingFee: number;
  totalPrice: number;
  depositPercent: number; // Tỷ lệ cọc (VD: 40)
  depositAmount: number;
  remainingAmount: number;
  estimatedDeliveryDate: string;
  deliveryMethod: string;
  validUntil: string;
  samplePhotoUrl?: string;
  note?: string;
  status: QuoteStatus;
  /** Backend `revisionNo`: a revision of the same vendor quote (BR-05). */
  revisionNo?: number;
  /** Backend `acceptable`: false once expired or withdrawn, so the button is off. */
  acceptable?: boolean;
};

export type QuoteRequest = {
  id: string; // #REQ-502
  type: RequestType;
  buyerId: string;
  buyerName: string;
  targetVendorId?: string;
  targetVendorName?: string;
  quantity: number;
  deliveryDeadline: string;
  deliveryAddress: string;
  deliveryProvince: string;
  budgetPerBox?: number;
  customLogoFileName?: string;
  customRequirements?: string;
  crustPreference?: string;
  fillingPreference?: string;
  createdAt: string;
  status: RequestStatus;
  invitedVendorsCount: number;
  quotes: Quote[];
  /** Backend `CreateQuoteRequestRequest.delivery.recipientName`. */
  recipientName?: string;
  /** Backend `CreateQuoteRequestRequest.delivery.recipientPhone` (`0\d{9}`). */
  recipientPhone?: string;
  /** Backend `CreateQuoteRequestRequest.delivery.provinceCode` (2 digits). */
  provinceCode?: string;
  /** The custom work the buyer asked for (BR-14). */
  customTypes?: CustomType[];
  /** Backend `CreateQuoteRequestRequest.productId`, when the request is about a product. */
  productId?: string;
  /** Backend `QuoteRequestResponse.quoteCount`: live quotes received (AC-16.3). */
  quoteCount?: number;
};

/**
 * The quote requests of the caller.
 *
 * The store starts empty and is filled by `useRequests` from `quotation-service`.
 */
export const requestStore = createStore<QuoteRequest[]>([]);

/** The store without the React binding (see `useRequests` in the API layer). */
export function getRequests(): QuoteRequest[] {
  return requestStore.get();
}
