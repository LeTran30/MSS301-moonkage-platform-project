import { apiClient, GATEWAY, unwrap, unwrapList } from '@/shared/api';
import { isDemoMode } from '@/shared/config';
import type { Product, ProductStatus } from '@/entities/product/@x/vendor';

/**
 * Wire shape of `com.moonkage.vendor.product.dto.response.ProductResponse`
 * (FR-29 to FR-34): a product as its Shop and the admins see it.
 *
 * `version` must be sent back when the product is replaced (FR-32, FR-33): the
 * backend answers 409 VENDOR_027 when someone changed it since.
 */
export interface VendorProductDto {
  id: string;
  vendorId?: string;
  name?: string;
  description?: string;
  brand?: string;
  origin?: string | null;
  resold?: boolean;
  piecesPerBox?: number | null;
  listPrice?: number;
  stock?: number;
  expiryDate?: string | null;
  /** `DeliveryLabel`: LOCAL or NATIONWIDE (AC-29.3). */
  deliveryLabel?: 'LOCAL' | 'NATIONWIDE';
  quoteThreshold?: number | null;
  priceTiers?: Array<{ fromQty: number; unitPrice: number }>;
  /** `key` is what a replace sends back to keep the image; `url` shows it. */
  images?: Array<{ key: string; url: string }>;
  crustCodes?: string[];
  fillingCodes?: string[];
  /** `ProductStatus`: ON_SALE, HIDDEN or REMOVED (BR-24). */
  status?: 'ON_SALE' | 'HIDDEN' | 'REMOVED';
  removedReason?: string | null;
  version?: number;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Wire shape of `com.moonkage.vendor.product.dto.request.SaveProductRequest`
 * (FR-29 to FR-33): the whole product, to create or to replace one.
 *
 * `imageKeys` hold the *temp keys* of files uploaded first through
 * `POST /api/vendors/{vendorId}/products/uploads` — not URLs.
 */
export interface SaveVendorProductPayload {
  /** The version read before editing; required to replace, ignored to create. */
  version?: number;
  /** Required when the vendor's supply source is BOTH (AC-29.2). */
  resold?: boolean;
  name?: string;
  description?: string;
  brand?: string;
  /** Required when the product is resold (AC-33.2). */
  origin?: string;
  piecesPerBox?: number;
  listPrice?: number;
  stock?: number;
  expiryDate?: string;
  deliveryLabel?: 'LOCAL' | 'NATIONWIDE';
  quoteThreshold?: number;
  priceTiers?: Array<{ fromQty: number; unitPrice: number }>;
  imageKeys?: string[];
  crustCodes?: string[];
  fillingCodes?: string[];
}

/**
 * Wire shape of `com.moonkage.vendor.product.dto.request.UpdateProductRequest`
 * (FR-34, FR-46): a change of status only.
 */
export interface UpdateVendorProductPayload {
  status: 'ON_SALE' | 'HIDDEN' | 'REMOVED';
  /** Required to remove a product for good (FR-46). */
  removedReason?: string;
}

/** Wire shape of `com.moonkage.vendor.product.dto.request.ProductImageUploadRequest`. */
export interface ProductImageUploadRequest {
  contentType: string;
  sizeBytes: number;
}

/** Wire shape of `com.moonkage.vendor.vendor.dto.response.PresignedUploadLinkResponse`. */
export interface ProductUploadLink {
  tempKey: string;
  uploadUrl: string;
  formFields?: Record<string, string>;
  expiresAt?: string;
}

/** Backend `ProductStatus` is `ON_SALE | HIDDEN | REMOVED`; the UI uses `ACTIVE | HIDDEN | REMOVED`. */
export function mapVendorProductStatus(status: string | undefined): ProductStatus {
  if (status === 'ON_SALE') return 'ACTIVE';
  if (status === 'REMOVED') return 'REMOVED';
  return 'HIDDEN';
}

/** Backend `DeliveryLabel` is `LOCAL | NATIONWIDE`; the UI shows the readable label. */
export function mapDeliveryLabel(label: string | undefined): Product['deliveryTag'] {
  return label === 'LOCAL' ? 'Giao nội thành' : 'Giao toàn quốc';
}

/** Backend sends `LocalDate` (ISO `yyyy-MM-dd`); the UI shows `DD/MM/YYYY`. */
function formatExpiry(iso: string | null | undefined): string {
  if (!iso) return '';
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return iso;
  return `${match[3]}/${match[2]}/${match[1]}`;
}

/** Map a vendor product to the UI entity. */
export function mapVendorProductDtoToEntity(dto: VendorProductDto): Product {
  return {
    id: dto.id,
    name: dto.name || '',
    vendorId: dto.vendorId || '',
    vendorName: '',
    brand: dto.brand || '',
    price: dto.listPrice ?? 0,
    stock: dto.stock ?? 0,
    images: (dto.images ?? []).map((image) => image.url).filter(Boolean),
    description: dto.description || '',
    expiryDate: formatExpiry(dto.expiryDate),
    deliveryTag: mapDeliveryLabel(dto.deliveryLabel),
    province: dto.origin || '',
    rating: 0,
    reviewCount: 0,
    crusts: (dto.crustCodes ?? []) as Product['crusts'],
    fillings: (dto.fillingCodes ?? []) as Product['fillings'],
    status: mapVendorProductStatus(dto.status),
    soldCount: 0,
    bulkQuoteThreshold: dto.quoteThreshold ?? undefined,
    isResell: dto.resold ?? undefined,
    manufactureLocation: dto.origin ?? undefined,
    removalReason: dto.removedReason ?? undefined,
  };
}

/**
 * The write side of a Shop's products (FR-29 to FR-34, FR-46).
 *
 * Buyers read products from `catalog-service`; the owner writes here.
 */
export const vendorProductApi = {
  /** The Shop's products, every status, newest first (FR-30). */
  async getProducts(vendorId: string): Promise<VendorProductDto[]> {
    if (isDemoMode()) {
      return [];
    }
    const res = await apiClient.get<unknown>(GATEWAY.VENDOR.PRODUCTS(vendorId));
    return unwrapList<VendorProductDto>(res);
  },

  /** One product as its Shop sees it, with the version to send back on PUT. */
  async getProduct(vendorId: string, productId: string): Promise<VendorProductDto | null> {
    if (isDemoMode()) {
      return null;
    }
    const res = await apiClient.get<unknown>(GATEWAY.VENDOR.PRODUCT_BY_ID(vendorId, productId));
    // ProductController.getProduct trả về MỘT `ProductResponse` trong envelope.
    const dto = unwrap<VendorProductDto>(res);
    return dto ?? null;
  },
};
