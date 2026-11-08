import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  productApi,
  mapProductDtoToEntity,
  mapCakeAttributeDto,
  type ProductDto,
} from '../productApi';
import { apiClient } from '@/shared/api';
import { envelope, page } from '@/shared/api/__tests__/envelopeFixtures';

describe('Product Entity - productApi (T-01)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('mapProductDtoToEntity dùng đúng tên field của backend (listPrice, imageUrls, crustCodes)', () => {
    const dto: ProductDto = {
      id: 'p-01',
      name: 'Bánh nướng thập cẩm',
      listPrice: 85000,
      stock: 40,
      vendorId: 'ven-1',
      vendorName: 'Xưởng Cô Hoa',
      imageUrls: ['/a.jpg'],
      crustCodes: ['nuong'],
      fillingCodes: ['thap-cam'],
      ratingAvg: 4.8,
      ratingCount: 12,
      status: 'ON_SALE',
      expiryDate: '2026-11-15',
    };
    const entity = mapProductDtoToEntity(dto);
    expect(entity.id).toBe('p-01');
    expect(entity.name).toBe('Bánh nướng thập cẩm');
    expect(entity.price).toBe(85000);
    expect(entity.stock).toBe(40);
    expect(entity.images).toEqual(['/a.jpg']);
    expect(entity.crusts).toEqual(['nuong']);
    expect(entity.fillings).toEqual(['thap-cam']);
    expect(entity.rating).toBe(4.8);
    expect(entity.reviewCount).toBe(12);
    expect(entity.status).toBe('ACTIVE');
    expect(entity.expiryDate).toBe('15/11/2026');
  });

  it('ON_SALE của backend không bị ẩn (lỗi đã map thành HIDDEN)', () => {
    const hidden = mapProductDtoToEntity({
      id: 'x',
      name: 'x',
      listPrice: 1,
      status: 'HIDDEN',
    });
    const removed = mapProductDtoToEntity({
      id: 'x',
      name: 'x',
      listPrice: 1,
      status: 'REMOVED',
    });
    expect(hidden.status).toBe('HIDDEN');
    expect(removed.status).toBe('REMOVED');
  });

  it('mapCakeAttributeDto đọc label/sortOrder/active của backend', () => {
    const item = mapCakeAttributeDto({
      id: '1',
      group: 'CRUST',
      code: 'nuong',
      label: 'Bánh nướng',
      sortOrder: 1,
      active: true,
    });
    expect(item).toEqual({
      code: 'nuong',
      name: 'Bánh nướng',
      type: 'crust',
      order: 1,
      isActive: true,
    });
  });

  it('productApi.getProducts() bóc envelope phân trang và gửi provinceCode bắt buộc', async () => {
    const listing: ProductDto[] = [
      { id: 'api-prod-1', name: 'Bánh nướng Sen Trắng', listPrice: 95000 },
    ];
    const get = vi.spyOn(apiClient, 'get').mockResolvedValue(envelope(page(listing)));

    const products = await productApi.getProducts('Hà Nội');
    expect(products).toHaveLength(1);
    expect(products[0].id).toBe('api-prod-1');
    expect(products[0].price).toBe(95000);

    const calledUrl = get.mock.calls[0][0] as string;
    expect(calledUrl).toContain('provinceCode=01');
  });

  it('productApi.getProducts() không nuốt lỗi API', async () => {
    vi.spyOn(apiClient, 'get').mockRejectedValue(new Error('HTTP 500'));
    await expect(productApi.getProducts('Hà Nội')).rejects.toThrow('HTTP 500');
  });

  it('productApi.getTaxonomy() bóc envelope danh mục vỏ và nhân', async () => {
    vi.spyOn(apiClient, 'get').mockResolvedValue(
      envelope([
        {
          id: '1',
          group: 'CRUST',
          code: 'nuong',
          label: 'Bánh nướng',
          sortOrder: 1,
          active: true,
        },
        {
          id: '2',
          group: 'FILLING',
          code: 'thap-cam',
          label: 'Thập cẩm',
          sortOrder: 1,
          active: true,
        },
      ]),
    );

    const taxonomy = await productApi.getTaxonomy();
    expect(taxonomy.crusts).toHaveLength(1);
    expect(taxonomy.crusts[0].name).toBe('Bánh nướng');
    expect(taxonomy.fillings[0].name).toBe('Thập cẩm');
  });
});
