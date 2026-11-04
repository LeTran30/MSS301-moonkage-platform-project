import { apiClient, GATEWAY, unwrap, unwrapList } from '@/shared/api';
import { isDemoMode, provinceCodeOf } from '@/shared/config';
import { vendorStore, type Vendor } from '../model/vendorStore';
import type {
  OrderProfileDto,
  SupplierDto,
  VendorDetailDto,
  VendorResponseDto,
} from './vendorDto';

/** Map a supplier to the UI vendor shape. */
export function mapSupplierToVendor(dto: SupplierDto): Vendor {
  return {
    id: dto.vendorId,
    name: dto.businessName || 'Xưởng bánh',
    legalName: dto.businessName || '',
    businessType: 'HKD',
    taxCode: '',
    representativeName: '',
    idCardNumberMasked: '',
    address: '',
    province: dto.deliveryAreas?.[0] || 'Hà Nội',
    phone: '',
    email: '',
    sellingMode: dto.ordersOnly ? 'CUSTOM_ORDER' : 'BOTH',
    sourceType: dto.supplySource === 'RESELL' ? 'Bán lại' : 'Tự sản xuất',
    status: 'APPROVED',
    hasOpeningFeePaid: true,
    rating: 0,
    reviewCount: 0,
    introduction: dto.earlyBirdOffer || '',
    deliveryProvinces: dto.deliveryAreas ?? [],
    bulkMinQuantity: dto.minQty ?? undefined,
    bulkLeadTimeDays: dto.leadTimeDays ?? undefined,
    supportedCustomOptions: dto.customCapabilities ?? undefined,
  };
}

/** Map the vendor aggregate to the UI vendor shape. */
export function mapVendorDetailToVendor(dto: VendorDetailDto): Vendor {
  const statusMap: Record<string, Vendor['status']> = {
    PENDING: 'PENDING',
    NEEDS_INFO: 'NEED_INFO',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
    LOCKED: 'LOCKED',
  };
  return {
    id: dto.id,
    name: dto.businessName || 'Xưởng bánh',
    legalName: dto.businessName || '',
    businessType: dto.entityType === 'SOLE_PROPRIETORSHIP' ? 'DNTN' : 'HKD',
    taxCode: dto.taxCode || '',
    representativeName: dto.representativeName || '',
    idCardNumberMasked: dto.representativeIdMasked || '',
    address: dto.address || '',
    province: dto.provinceCode || '',
    phone: '',
    email: '',
    sellingMode:
      dto.sellsShop && dto.acceptsOrders ? 'BOTH' : dto.acceptsOrders ? 'CUSTOM_ORDER' : 'RETAIL_SHOP',
    sourceType:
      dto.supplySource === 'RESELL' ? 'Bán lại' : dto.supplySource === 'BOTH' ? 'Cả hai' : 'Tự sản xuất',
    status: statusMap[dto.status ?? 'PENDING'] ?? 'PENDING',
    hasOpeningFeePaid: Boolean(dto.registrationFeePaidAt),
    rating: 0,
    reviewCount: 0,
    introduction: '',
    deliveryProvinces: dto.deliveryAreas ?? [],
  };
}

/**
 * The read side of the vendor catalogue (FR-14, FR-27, FR-35).
 *
 * Suppliers (vendors that take custom orders) and the vendor registration
 * aggregate are two different contracts; both live in the vendor-service but
 * answer different shapes.
 */
export const vendorCatalogApi = {
  /**
   * Vendors that take custom orders.
   *
   * `provinceCode` is optional here but the backend filters by it, so the UI always
   * sends the delivery province of the current session.
   */
  async getVendors(province?: string, options?: { minQty?: number; q?: string }): Promise<Vendor[]> {
    if (isDemoMode()) {
      return vendorStore.get();
    }
    const params = new URLSearchParams();
    const code = provinceCodeOf(province);
    if (code) params.set('provinceCode', code);
    if (options?.minQty !== undefined) params.set('minQty', String(options.minQty));
    if (options?.q) params.set('q', options.q);

    const query = params.toString();
    const res = await apiClient.get<unknown>(
      query ? `${GATEWAY.VENDOR.SUPPLIERS}?${query}` : GATEWAY.VENDOR.SUPPLIERS,
    );
    return unwrapList<SupplierDto>(res).map(mapSupplierToVendor);
  },

  /** One supplier, from the same aggregate as the list. */
  async getVendorById(id: string): Promise<Vendor | null> {
    if (isDemoMode()) {
      return vendorStore.get().find((v) => v.id === id) || null;
    }
    const res = await apiClient.get<unknown>(GATEWAY.VENDOR.SUPPLIER_BY_ID(id));
    // SupplierController.getSupplier trả về MỘT `SupplierResponse` trong envelope.
    const dto = unwrap<SupplierDto>(res);
    return dto ? mapSupplierToVendor(dto) : null;
  },

  /**
   * The vendor aggregate of the owner or the admin (FR-27).
   *
   * `GET /api/vendors/{vendorId}` answers `VendorDetailResponse`, a different
   * contract than the supplier list above.
   */
  async getVendorDetail(id: string): Promise<VendorDetailDto | null> {
    if (isDemoMode()) {
      return null;
    }
    const res = await apiClient.get<unknown>(GATEWAY.VENDOR.BY_ID(id));
    return unwrap<VendorDetailDto>(res);
  },

  /**
   * The id of the caller's own vendor profile (FR-27).
   *
   * `GET /api/vendors?ownerAccountId=me` answers the summaries of the caller;
   * the backend replaces `me` with the account id of the access token.
   */
  async getMyVendorId(): Promise<string | null> {
    if (isDemoMode()) {
      return null;
    }
    const res = await apiClient.get<unknown>(`${GATEWAY.VENDOR.BASE}?ownerAccountId=me`);
    const list = unwrapList<VendorResponseDto>(res);
    return list.length > 0 ? list[0].id : null;
  },

  /** The vendor's order terms (FR-35). */
  async getOrderProfile(id: string): Promise<OrderProfileDto | null> {
    if (isDemoMode()) {
      return null;
    }
    const res = await apiClient.get<unknown>(GATEWAY.VENDOR.ORDER_PROFILE(id));
    return unwrap<OrderProfileDto>(res);
  },

  /**
   * The provinces the vendor delivers to (FR-28, AC-28.1).
   *
   * `GET /api/vendors/{vendorId}/delivery-areas` answers the province codes in
   * code order; the province is the unit of the delivery area (Q-12).
   */
  async getDeliveryAreas(id: string): Promise<string[]> {
    if (isDemoMode()) {
      return [];
    }
    const res = await apiClient.get<unknown>(GATEWAY.VENDOR.DELIVERY_AREAS(id));
    return unwrapList<string>(res);
  },

  /** A short-lived link to one private document (AC-27.6, NFR-03). */
  async getDocumentLink(vendorId: string, documentId: string): Promise<string | null> {
    if (isDemoMode()) {
      return null;
    }
    const res = await apiClient.get<unknown>(GATEWAY.VENDOR.DOCUMENT_LINK(vendorId, documentId));
    const dto = unwrap<{ url?: string }>(res);
    return dto?.url ?? null;
  },

  /**
   * The registration fee payment link (FR-27, FR-53): the owner pays the
   * registration fee once the profile is approved.
   *
   * `RegistrationFeePaymentLinkResponse`: the fee level in effect when the
   * payment was created (AC-53.3), and the VNPay page to open.
   */
  async getRegistrationFeePayments(
    vendorId: string
  ): Promise<Array<{ paymentId: string; amount: number; paidAt?: string | null }>> {
    if (isDemoMode()) {
      return [];
    }
    const res = await apiClient.get<unknown>(
      `${GATEWAY.VENDOR.REGISTRATION_FEE_PAYMENT(vendorId)}`
    );
    return unwrapList<{ paymentId: string; amount: number; paidAt?: string | null }>(res);
  },
};
