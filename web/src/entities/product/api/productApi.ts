import { apiClient, GATEWAY, unwrap, unwrapList, unwrapPage } from '@/shared/api';
import { isDemoMode, provinceCodeOf } from '@/shared/config';
import { MOCK_PRODUCTS } from '../model/productStore';
import { INITIAL_CRUSTS, INITIAL_FILLINGS } from '../model/types';
import type { Product, CakeTaxonomyItem } from '../model/types';

/**
 * Wire shape of `com.moonkage.catalog.dto.response.ProductListingResponse`.
 *
 * The backend names the money field `listPrice` and the taxonomy fields `crustCodes` /
 * `fillingCodes` — mapping the old names (`price`, `crusts`, `fillings`) silently produced
 * `undefined` for every product.
 */
export interface ProductDto {
  id: string;
  vendorId?: string;
  vendorName?: string;
  name: string;
  description?: string;
  crustCodes?: string[];
  fillingCodes?: string[];
  brand?: string;
  origin?: string | null;
  piecesPerBox?: number;
  listPrice: number;
  stock?: number;
  inStock?: boolean;
  expiryDate?: string;
  deliveryLabel?: string;
  quoteThreshold?: number | null;
  status?: 'ON_SALE' | 'HIDDEN' | 'REMOVED';
  imageKeys?: string[];
  imageUrls?: string[];
  ratingAvg?: number | null;
  ratingCount?: number;
  isOwn?: boolean;
  /**
   * Whether the Shop takes custom orders (BE-04). The backend field is named after the vendor snapshot it
   * comes from; the UI calls it `acceptsCustomOrder` because that is what the buyer sees.
   */
  vendorAcceptsOrders?: boolean;
  updatedAt?: string;
}

/** Wire shape of `com.moonkage.vendor.cakeattribute.dto.CakeAttributeResponse`. */
export interface CakeAttributeDto {
  id: string;
  group: 'CRUST' | 'FILLING';
  code: string;
  label: string;
  sortOrder: number;
  active: boolean;
}

/**
 * Backend `ProductStatus` is `ON_SALE | HIDDEN | REMOVED`; the UI uses
 * `ACTIVE | HIDDEN | REMOVED`. `ON_SALE` maps to `ACTIVE` — mapping it to `HIDDEN`
 * hid every product in the catalog.
 */
export function mapProductDtoToEntity(dto: ProductDto): Product {
  const images = dto.imageUrls && dto.imageUrls.length > 0 ? dto.imageUrls : [];
  const stock = dto.stock ?? 0;

  return {
    id: dto.id,
    name: dto.name,
    vendorId: dto.vendorId || '',
    vendorName: dto.vendorName || 'Xưởng bánh',
    brand: dto.brand || 'Moonkage',
    price: dto.listPrice ?? 0,
    stock,
    images: images.length > 0 ? images : ['/images/banh-nuong.jpg'],
    description: dto.description || '',
    expiryDate: dto.expiryDate ? formatExpiry(dto.expiryDate) : '',
    // Catalog `DeliveryLabel` is LOCAL or NATIONWIDE (BR-13).
    deliveryTag: dto.deliveryLabel === 'LOCAL' ? 'Giao nội thành' : 'Giao toàn quốc',
    province: dto.origin || '',
    rating: dto.ratingAvg ?? 0,
    reviewCount: dto.ratingCount ?? 0,
    crusts: (dto.crustCodes ?? []) as Product['crusts'],
    fillings: (dto.fillingCodes ?? []) as Product['fillings'],
    status: dto.status === 'ON_SALE' ? 'ACTIVE' : dto.status === 'REMOVED' ? 'REMOVED' : 'HIDDEN',
    soldCount: 0,
    bulkQuoteThreshold: dto.quoteThreshold ?? undefined,
    minBulkQuantity: dto.quoteThreshold ?? undefined,
    // A Shop that does not take orders must not show the "custom order" box (BE-04).
    acceptsCustomOrder: dto.vendorAcceptsOrders === true,
    manufactureLocation: dto.origin ?? undefined,
  };
}

/** Backend sends `LocalDate` (ISO `yyyy-MM-dd`); the UI shows `DD/MM/YYYY`. */
function formatExpiry(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return iso;
  return `${match[3]}/${match[2]}/${match[1]}`;
}

/** Map a `CakeAttributeResponse` to the UI taxonomy item. */
export function mapCakeAttributeDto(dto: CakeAttributeDto): CakeTaxonomyItem {
  return {
    code: dto.code,
    name: dto.label,
    type: dto.group === 'CRUST' ? 'crust' : 'filling',
    order: dto.sortOrder,
    isActive: dto.active,
  };
}

/**
 * Wire shape of `com.moonkage.catalog.dto.response.ProductReviewResponse`.
 *
 * The reviews of a product live in catalog-service: the buyer reads them
 * there, not from the order they were written in (AC-11.3).
 */
export interface ProductReviewDto {
  reviewId: string;
  rating: number;
  content?: string;
  createdAt?: string;
}

/** One review of a product, as the product page shows it. */
export interface ProductReview {
  id: string;
  rating: number;
  content: string;
  createdAt: string;
}

/** Map a backend review to the UI review. */
export function mapProductReviewDto(dto: ProductReviewDto): ProductReview {
  return {
    id: dto.reviewId,
    rating: dto.rating,
    content: dto.content ?? '',
    createdAt: dto.createdAt ?? new Date().toISOString(),
  };
}

export const productApi = {
  /**
   * Products delivered to `province`.
   *
   * `provinceCode` is mandatory on the backend (`@RequestParam String provinceCode`),
   * so omitting it answers 400.
   */
  async getProducts(province?: string, options?: { vendorId?: string; q?: string }): Promise<Product[]> {
    if (isDemoMode()) {
      return MOCK_PRODUCTS;
    }
    const params = new URLSearchParams({ provinceCode: provinceCodeOf(province) });
    if (options?.vendorId) params.set('vendorId', options.vendorId);
    if (options?.q) params.set('q', options.q);
    params.set('size', '100');

    const res = await apiClient.get<unknown>(`${GATEWAY.CATALOG.PRODUCTS}?${params.toString()}`);
    return unwrapPage<ProductDto>(res).map(mapProductDtoToEntity);
  },

  async getProductById(id: string, province?: string): Promise<Product | null> {
    if (isDemoMode()) {
      return MOCK_PRODUCTS.find((p) => p.id === id) || null;
    }
    const params = new URLSearchParams({ provinceCode: provinceCodeOf(province) });
    const res = await apiClient.get<unknown>(`${GATEWAY.CATALOG.PRODUCT_BY_ID(id)}?${params.toString()}`);
    // ProductReadController.getProduct trả về MỘT `ProductListingResponse` trong
    // envelope; `unwrapList` trả về mảng rỗng nên chi tiết sản phẩm luôn trống.
    const dto = unwrap<ProductDto>(res);
    return dto ? mapProductDtoToEntity(dto) : null;
  },

  /**
   * The reviews of a product (AC-11.3).
   *
   * `GET /api/products/{productId}/reviews` — the read model of catalog; the
   * buyer sees every review of the product, not only the ones of one order.
   */
  async getReviews(productId: string): Promise<ProductReview[]> {
    if (isDemoMode()) {
      return [];
    }
    const res = await apiClient.get<unknown>(GATEWAY.CATALOG.PRODUCT_REVIEWS(productId));
    return unwrapPage<ProductReviewDto>(res).map(mapProductReviewDto);
  },

  /**
   * The crust / filling catalog.
   *
   * Errors are NOT swallowed: a failing call must surface as an `ErrorState` so the user
   * knows the filter list is unreliable instead of seeing a silent default list.
   */
  async getTaxonomy(): Promise<{ crusts: CakeTaxonomyItem[]; fillings: CakeTaxonomyItem[] }> {
    if (isDemoMode()) {
      return { crusts: INITIAL_CRUSTS, fillings: INITIAL_FILLINGS };
    }

    const res = await apiClient.get<unknown>(`${GATEWAY.CATALOG.CAKE_ATTRIBUTES}`);
    const attributes = unwrapList<CakeAttributeDto>(res).map(mapCakeAttributeDto);
    const crusts = attributes.filter((a) => a.type === 'crust');
    const fillings = attributes.filter((a) => a.type === 'filling');

    return {
      crusts: crusts.length > 0 ? crusts : INITIAL_CRUSTS,
      fillings: fillings.length > 0 ? fillings : INITIAL_FILLINGS,
    };
  },
};
