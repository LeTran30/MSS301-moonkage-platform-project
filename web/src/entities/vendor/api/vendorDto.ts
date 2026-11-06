/**
 * Wire shapes of the vendor-service contracts.
 *
 * Split out of the API modules so the DTO catalogue stays readable and the API
 * modules stay focused on the requests.
 */

/**
 * Wire shape of `com.moonkage.quotation.dto.response.SupplierResponse`.
 *
 * A supplier is a vendor that takes custom orders. The backend answers the list of
 * suppliers and the detail of one supplier with this shape — the vendor registration
 * aggregate (`/api/vendors`, `VendorDetailResponse`) is a different contract and is not
 * mixed in here.
 */
export interface SupplierDto {
  vendorId: string;
  businessName?: string;
  ordersOnly?: boolean;
  supplySource?: string;
  minQty?: number | null;
  leadTimeDays?: number | null;
  customCapabilities?: string[];
  deliveryAreas?: string[];
  earlyBirdOffer?: string;
  refPriceTiers?: string;
  isOwn?: boolean;
}

/**
 * Wire shape of `com.moonkage.vendor.vendor.dto.response.VendorDetailResponse`.
 *
 * The vendor aggregate as its owner and the admin see it (FR-27, AC-45.1). Personal
 * numbers arrive masked only.
 */
export interface VendorDetailDto {
  id: string;
  ownerAccountId?: string;
  businessName?: string;
  /** `VendorEntityType`: HOUSEHOLD_BUSINESS or SOLE_PROPRIETORSHIP (BR-33). */
  entityType?: 'HOUSEHOLD_BUSINESS' | 'SOLE_PROPRIETORSHIP';
  taxCode?: string;
  address?: string;
  provinceCode?: string;
  representativeName?: string;
  representativeIdMasked?: string;
  supplySource?: 'SELF_PRODUCED' | 'RESELL' | 'BOTH';
  sellsShop?: boolean;
  acceptsOrders?: boolean;
  bankAccount?: { bankName?: string; maskedNumber?: string; holder?: string };
  /** `VendorStatus`: PENDING, NEEDS_INFO, APPROVED, REJECTED, LOCKED. */
  status?: 'PENDING' | 'NEEDS_INFO' | 'APPROVED' | 'REJECTED' | 'LOCKED';
  statusReason?: string | null;
  canOperate?: boolean;
  localDeliveryFee?: number | null;
  deliveryAreas?: string[];
  registrationFeePaidAt?: string | null;
  documents?: Array<{ id: string; kind: string; uploadedAt?: string }>;
  ownerCheck?: unknown;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Wire shape of `com.moonkage.vendor.vendor.dto.response.OrderProfileResponse`
 * (FR-35): the vendor's order terms.
 */
export interface OrderProfileDto {
  minQty?: number;
  leadTimeDays?: number;
  priceTiers?: Array<{ fromQty: number; unitPrice: number }>;
  customTypes?: Array<'BAG' | 'CARD' | 'STICKER' | 'TEMPLATE_BOX'>;
  earlyBirdOffer?: string;
  weeklyCapacity?: number | null;
  crustCodes?: string[];
  fillingCodes?: string[];
  packagingTypes?: string;
  logoPrinting?: boolean;
  distributedBrands?: string;
  gatherableQty?: number | null;
  updatedAt?: string;
}

/** Wire shape of `com.moonkage.vendor.vendor.dto.request.SaveOrderProfileRequest`. */
export interface SaveOrderProfilePayload {
  minQty?: number;
  leadTimeDays: number;
  priceTiers: Array<{ fromQty: number; unitPrice: number }>;
  customTypes?: Array<'BAG' | 'CARD' | 'STICKER' | 'TEMPLATE_BOX'>;
  earlyBirdOffer?: string;
  weeklyCapacity?: number | null;
  crustCodes?: string[];
  fillingCodes?: string[];
  packagingTypes?: string;
  logoPrinting?: boolean;
  distributedBrands?: string;
  gatherableQty?: number | null;
}

/** Wire shape of `com.moonkage.vendor.vendor.dto.request.UpdateVendorRequest`. */
export interface UpdateVendorPayload {
  localDeliveryFee?: number;
  status?: 'PENDING' | 'NEEDS_INFO' | 'APPROVED' | 'REJECTED' | 'LOCKED';
  statusReason?: string;
}

/**
 * Wire shape of `com.moonkage.vendor.vendor.dto.request.SubmitVendorRequest`
 * (FR-26): the vendor profile for the first submission or a resubmission.
 *
 * `entityType` is `HOUSEHOLD_BUSINESS` or `SOLE_PROPRIETORSHIP`; a company is
 * refused by the backend (BR-33). `documents` hold the `objectKey` of files
 * uploaded first through `POST /api/vendors/uploads`.
 */
export interface SubmitVendorPayload {
  businessName: string;
  entityType: 'HOUSEHOLD_BUSINESS' | 'SOLE_PROPRIETORSHIP';
  taxCode: string;
  address: string;
  provinceCode: string;
  representativeName: string;
  representativeIdNumber: string;
  supplySource: 'SELF_PRODUCED' | 'RESELL' | 'BOTH';
  sellsShop: boolean;
  acceptsOrders: boolean;
  bankName: string;
  bankAccountNumber: string;
  bankAccountHolder: string;
  documents: Array<{
    kind: 'BUSINESS_LICENSE' | 'FOOD_SAFETY';
    objectKey: string;
  }>;
}

/**
 * Wire shape of `com.moonkage.vendor.vendor.dto.response.PresignedUploadLinkResponse`.
 *
 * Before `expiresAt`, the client sends a multipart POST to `uploadUrl` with
 * every `formFields` entry as a field and the file last, named `file`.
 */
export interface PresignedUploadLink {
  tempKey: string;
  uploadUrl: string;
  formFields?: Record<string, string>;
  expiresAt?: string;
}

/**
 * Wire shape of `com.moonkage.vendor.vendor.dto.response.VendorResponse`:
 * the vendor summary the owner and the admins see.
 */
export interface VendorResponseDto {
  id: string;
  ownerAccountId?: string;
  businessName?: string;
  status?: string;
  supplySource?: string;
  sellsShop?: boolean;
  acceptsOrders?: boolean;
}

/**
 * Wire shape of `com.moonkage.vendor.vendor.dto.response.VendorReviewResponse`
 * (FR-45): one admin decision on a pending profile.
 */
export interface VendorReviewDto {
  id: string;
  adminAccountId?: string;
  /** `ReviewDecision`: APPROVE, NEEDS_INFO, REJECT. */
  decision?: 'APPROVE' | 'NEEDS_INFO' | 'REJECT';
  reason?: string | null;
  licenseChecked?: boolean;
  registryChecked?: boolean;
  decidedAt?: string;
}

/**
 * Wire shape of `com.moonkage.vendor.vendor.dto.response.OwnerCheckResponse`
 * (AC-26.8, AC-45.4): how the declared representative compares with the
 * owner's NFC-verified ID card.
 */
export interface OwnerCheckDto {
  submissionNo?: number;
  ownerLegalName?: string;
  ownerIdMasked?: string;
  nfcVerifiedAt?: string;
  idMatch?: boolean;
  /** `NameMatch`: EXACT, FUZZY, MISMATCH. */
  nameMatch?: 'EXACT' | 'FUZZY' | 'MISMATCH';
  checkedAt?: string;
}

/**
 * Wire shape of `com.moonkage.vendor.vendor.dto.request.CreateVendorReviewRequest`
 * (FR-45): the admin's decision on a pending profile.
 *
 * `reason` is required unless the decision is APPROVE (AC-45.2); approving a
 * sole proprietorship also needs `registryChecked` (AC-45.5, A-14).
 */
export interface CreateVendorReviewPayload {
  decision: 'APPROVE' | 'NEEDS_INFO' | 'REJECT';
  reason?: string;
  licenseChecked?: boolean;
  registryChecked?: boolean;
}

/**
 * Wire shape of `com.moonkage.vendor.vendor.dto.response.VendorDocumentResponse`.
 *
 * A document of a shop; open it with
 * `GET /api/vendors/{vendorId}/documents/{documentId}` (AC-27.6, NFR-03).
 */
export interface VendorDocumentDto {
  id: string;
  /** `DocumentKind`: BUSINESS_LICENSE, FOOD_SAFETY or FEE_INVOICE. */
  kind: string;
  uploadedAt?: string;
}

/**
 * Wire shape of `com.moonkage.vendor.cakeattribute.dto.CakeAttributeResponse`
 * (FR-54): one crust or filling of the catalogue.
 */
export interface CakeAttributeDto {
  id: string;
  /** `CakeAttributeGroup`: CRUST or FILLING. */
  group?: 'CRUST' | 'FILLING';
  code: string;
  label: string;
  sortOrder?: number;
  active?: boolean;
}

/** Wire shape of `com.moonkage.vendor.cakeattribute.dto.CreateCakeAttributeRequest`. */
export interface CreateCakeAttributePayload {
  group: 'CRUST' | 'FILLING';
  label: string;
}

/** Wire shape of `com.moonkage.vendor.cakeattribute.dto.UpdateCakeAttributeRequest`. */
export interface UpdateCakeAttributePayload {
  label?: string;
  sortOrder?: number;
  active?: boolean;
}
