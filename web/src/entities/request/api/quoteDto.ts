import type { CustomType, QuoteStatus, RequestStatus } from '../model/requestStore';

/**
 * Wire shapes of the quotation-service contracts.
 *
 * Split out of the API module so the DTO catalogue stays readable and the API
 * module stays focused on the requests.
 */

/**
 * Wire shape of `com.moonkage.quotation.dto.response.DeliveryAddressResponse`.
 */
export interface DeliveryAddressDto {
  recipientName?: string;
  recipientPhone?: string;
  provinceCode?: string;
  addressDetail?: string;
}

/**
 * Wire shape of `com.moonkage.quotation.dto.response.QuoteRequestResponse`.
 */
export interface QuoteRequestDto {
  id: string;
  type?: 'OPEN' | 'DIRECT';
  buyerAccountId?: string;
  targetVendorId?: string;
  productId?: string;
  quantity?: number;
  budget?: number | null;
  customTypes?: CustomType[];
  customSpec?: string;
  deliveryDeadline?: string;
  delivery?: DeliveryAddressDto;
  status?: RequestStatus;
  invitedCount?: number;
  quoteCount?: number;
  suggestedUnitPrice?: number | null;
  createdAt?: string;
}

/**
 * Wire shape of `com.moonkage.quotation.dto.response.QuoteResponse`.
 */
export interface QuoteDto {
  id: string;
  requestId?: string;
  vendorId?: string;
  vendorName?: string;
  revisionNo?: number;
  supersedesQuoteId?: string | null;
  items?: Array<{
    lineNo?: number;
    kind?: string;
    description?: string;
    productRef?: string;
    customType?: string;
    quantity?: number;
    unitPrice?: number;
    amount?: number;
  }>;
  itemsAmount?: number;
  customSurcharge?: number;
  shippingFee?: number;
  totalAmount?: number;
  depositRate?: number | null;
  depositAmount?: number;
  remainingAmount?: number;
  deliveryDate?: string;
  deliveryMethod?: string;
  validUntil?: string;
  notes?: string;
  status?: QuoteStatus;
  acceptable?: boolean;
  submittedAt?: string;
  withdrawnAt?: string | null;
}

/**
 * Wire shape of `com.moonkage.quotation.dto.request.CreateQuoteRequestRequest`.
 *
 * `type` is `DIRECT` (one vendor, FR-15) or `OPEN` (many vendors, FR-16);
 * `targetVendorId` is required for DIRECT and ignored for OPEN.
 * `delivery` mirrors `DeliveryAddressRequest`; `provinceCode` is the 2-digit code.
 */
export interface CreateQuoteRequestPayload {
  type: 'OPEN' | 'DIRECT';
  targetVendorId?: string;
  productId?: string;
  quantity: number;
  budget?: number;
  customTypes?: CustomType[];
  customSpec?: string;
  deliveryDeadline: string;
  delivery: {
    recipientName: string;
    recipientPhone: string;
    provinceCode: string;
    addressDetail: string;
  };
}

/** Wire shape of `com.moonkage.quotation.dto.request.QuoteItemRequest`. */
export interface QuoteItemPayload {
  description: string;
  productRef?: string;
  quantity: number;
  unitPrice: number;
}

/** Wire shape of `com.moonkage.quotation.dto.request.CustomItemRequest`. */
export interface CustomItemPayload {
  customType: CustomType;
  description: string;
  quantity: number;
  unitPrice: number;
}

/**
 * Wire shape of `com.moonkage.quotation.dto.request.SubmitQuoteRequest`.
 *
 * The server computes every total, the deposit and the remainder: the client
 * sends the lines and the shipping fee only (FR-38).
 * `depositRate` is a percent in (0, 100]; `validDays` is 1..14 (Q-19).
 */
export interface SubmitQuotePayload {
  items: QuoteItemPayload[];
  customItems?: CustomItemPayload[];
  shippingFee: number;
  depositRate: number;
  deliveryDate: string;
  deliveryMethod: string;
  validDays: number;
  notes?: string;
  supersedesQuoteId?: string;
}

/** Wire shape of `com.moonkage.quotation.dto.request.InvoiceInfoRequest`. */
export interface InvoiceInfoPayload {
  name: string;
  taxCode: string;
  address: string;
  email: string;
}

/**
 * Wire shape of `com.moonkage.quotation.dto.request.AcceptQuoteRequest`
 * (`invoiceInfo` is optional, FR-24).
 */
export interface AcceptQuotePayload {
  invoiceInfo?: InvoiceInfoPayload;
}

/**
 * Wire shape of `com.moonkage.quotation.dto.response.AcceptQuoteResponse`:
 * where to pay the deposit. The order exists only after the deposit succeeds.
 */
export interface AcceptQuoteResponseDto {
  acceptanceId: string;
  status: 'PENDING_PAYMENT' | 'SUCCEEDED' | 'FAILED' | 'EXPIRED';
  depositAmount: number;
  paymentId: string;
  paymentUrl: string;
  paymentExpiresAt?: string;
}

/**
 * Wire shape of `com.moonkage.quotation.dto.response.AcceptanceResponse`.
 *
 * The binding copy and its deposit (FR-19). `snapshot` is the frozen
 * agreement as raw JSON; `contentHash` proves it did not change afterwards.
 */
export interface AcceptanceDto {
  id: string;
  quoteId: string;
  requestId: string;
  status: 'PENDING_PAYMENT' | 'SUCCEEDED' | 'FAILED' | 'EXPIRED';
  depositAmount: number;
  contentHash?: string;
  /** The frozen agreement, as raw JSON. */
  snapshot?: unknown;
  acceptedAt?: string;
  paymentExpiresAt?: string | null;
  paidAt?: string | null;
}

/**
 * Wire shape of `com.moonkage.quotation.dto.response.InvitationResponse`.
 */
export interface InvitationDto {
  vendorId: string;
  vendorName?: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';
  declineReason?: string | null;
  respondedAt?: string | null;
}
