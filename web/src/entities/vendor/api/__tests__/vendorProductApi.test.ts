import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  vendorProductApi,
  mapVendorProductDtoToEntity,
  mapVendorProductStatus,
  mapDeliveryLabel,
  type VendorProductDto,
} from '../vendorProductApi';
import { apiClient } from '@/shared/api';
import { envelope } from '@/shared/api/__tests__/envelopeFixtures';

describe('Vendor Entity - vendorProductApi (T-02)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('mapVendorProductStatus giữ đúng quy tắc BR-24 (ON_SALE -> ACTIVE)', () => {
    expect(mapVendorProductStatus('ON_SALE')).toBe('ACTIVE');
    expect(mapVendorProductStatus('HIDDEN')).toBe('HIDDEN');
    expect(mapVendorProductStatus('REMOVED')).toBe('REMOVED');
    expect(mapVendorProductStatus(undefined)).toBe('HIDDEN');
  });

  it('mapDeliveryLabel đọc LOCAL | NATIONWIDE của backend', () => {
    expect(mapDeliveryLabel('LOCAL')).toBe('Giao nội thành');
    expect(mapDeliveryLabel('NATIONWIDE')).toBe('Giao toàn quốc');
    expect(mapDeliveryLabel(undefined)).toBe('Giao toàn quốc');
  });

  it('mapVendorProductDtoToEntity dùng đúng tên field của backend', () => {
    const dto: VendorProductDto = {
      id: 'p-1',
      vendorId: 'ven-1',
      name: 'Bánh nướng thập cẩm',
      listPrice: 85000,
      stock: 40,
      images: [{ key: 'products/1.jpg', url: 'https://cdn.test/1.jpg' }],
      crustCodes: ['nuong'],
      fillingCodes: ['thap-cam'],
      deliveryLabel: 'LOCAL',
      expiryDate: '2026-11-15',
      status: 'ON_SALE',
      version: 7,
    };
    const entity = mapVendorProductDtoToEntity(dto);
    expect(entity.id).toBe('p-1');
    expect(entity.price).toBe(85000);
    expect(entity.stock).toBe(40);
    expect(entity.images).toEqual(['https://cdn.test/1.jpg']);
    expect(entity.crusts).toEqual(['nuong']);
    expect(entity.fillings).toEqual(['thap-cam']);
    expect(entity.status).toBe('ACTIVE');
    expect(entity.deliveryTag).toBe('Giao nội thành');
    expect(entity.expiryDate).toBe('15/11/2026');
  });

  it('getProducts() gọi đúng URL của vendor-service', async () => {
    const get = vi
      .spyOn(apiClient, 'get')
      .mockResolvedValue(
        envelope([{ id: 'p-1', name: 'Bánh nướng', listPrice: 1000, status: 'ON_SALE' }]) as never,
      );

    const products = await vendorProductApi.getProducts('ven-1');
    expect(get).toHaveBeenCalledWith('/api/vendors/ven-1/products');
    expect(products).toHaveLength(1);
    expect(products[0].id).toBe('p-1');
  });
});
