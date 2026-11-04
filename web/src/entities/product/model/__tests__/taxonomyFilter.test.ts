import { describe, it, expect } from 'vitest';
import { type Product } from '../types';
import { filterProducts } from '../filterProducts';

const sampleCatalog: Product[] = [
  {
    id: 'P1',
    name: 'Bánh nướng thập cẩm gà quay',
    price: 135000,
    images: ['/img/1.jpg'],
    rating: 5,
    soldCount: 10,
    vendorId: 'v1',
    vendorName: 'Hiệu Bảo An',
    crusts: ['nuong'],
    fillings: ['thap-cam'],
    expiryDate: '45 ngày',
    stock: 10,
    status: 'ACTIVE',
    brand: 'Bảo An',
    description: 'Bánh nướng cổ truyền',
    deliveryTag: 'Giao toàn quốc',
    province: 'Hà Nội',
    reviewCount: 25,
  },
  {
    id: 'P2',
    name: 'Bánh nướng đậu xanh hạt sen',
    price: 120000,
    images: ['/img/2.jpg'],
    rating: 4.8,
    soldCount: 20,
    vendorId: 'v1',
    vendorName: 'Hiệu Bảo An',
    crusts: ['nuong'],
    fillings: ['dau-xanh'],
    expiryDate: '45 ngày',
    stock: 15,
    status: 'ACTIVE',
    brand: 'Bảo An',
    description: 'Bánh nướng đậu xanh thơm ngọt',
    deliveryTag: 'Giao toàn quốc',
    province: 'Hà Nội',
    reviewCount: 30,
  },
  {
    id: 'P3',
    name: 'Bánh dẻo đậu xanh',
    price: 110000,
    images: ['/img/3.jpg'],
    rating: 4.7,
    soldCount: 30,
    vendorId: 'v2',
    vendorName: 'Đông Phương Hải Phòng',
    crusts: ['deo'],
    fillings: ['dau-xanh'],
    expiryDate: '30 ngày',
    stock: 25,
    status: 'ACTIVE',
    brand: 'Đông Phương',
    description: 'Bánh dẻo trắng ngọc',
    deliveryTag: 'Giao nội thành',
    province: 'Hải Phòng',
    reviewCount: 18,
  },
  {
    id: 'P4',
    name: 'Bánh dẻo sầu riêng',
    price: 150000,
    images: ['/img/4.jpg'],
    rating: 4.9,
    soldCount: 50,
    vendorId: 'v2',
    vendorName: 'Đông Phương Hải Phòng',
    crusts: ['deo'],
    fillings: ['sau-rieng'],
    expiryDate: '30 ngày',
    stock: 5,
    status: 'ACTIVE',
    brand: 'Đông Phương',
    description: 'Bánh dẻo sầu riêng tươi',
    deliveryTag: 'Giao nội thành',
    province: 'Hải Phòng',
    reviewCount: 42,
  },
];

describe('Quy tắc lọc danh mục Vỏ & Nhân (FR-06, AC-06.2, FR-54) - Production filterProducts', () => {
  it('trả về toàn bộ sản phẩm khi không áp dụng bộ lọc', () => {
    const res = filterProducts(sampleCatalog, {});
    expect(res).toHaveLength(4);
  });

  it('lọc theo 1 loại vỏ: chỉ trả về các bánh có vỏ tương ứng', () => {
    const res = filterProducts(sampleCatalog, { crusts: ['nuong'] });
    expect(res).toHaveLength(2);
    expect(res.every((p) => p.crusts?.includes('nuong'))).toBe(true);
  });

  it('lọc theo nhiều vỏ: áp dụng điều kiện HOẶC (OR) trong cùng nhóm', () => {
    const res = filterProducts(sampleCatalog, { crusts: ['nuong', 'deo'] });
    expect(res).toHaveLength(4); // Cả nuong HOẶC deo
  });

  it('lọc kết hợp Vỏ và Nhân: áp dụng điều kiện VÀ (AND) giữa hai nhóm (AC-06.2)', () => {
    // Vỏ: nướng VÀ Nhân: đậu xanh
    const res = filterProducts(sampleCatalog, { crusts: ['nuong'], fillings: ['dau-xanh'] });
    expect(res).toHaveLength(1);
    expect(res[0].id).toBe('P2');
  });

  it('lọc nhiều Vỏ kết hợp 1 Nhân: (Vỏ A HOẶC Vỏ B) VÀ Nhân C', () => {
    // (nướng HOẶC dẻo) VÀ đậu xanh => P2 và P3
    const res = filterProducts(sampleCatalog, { crusts: ['nuong', 'deo'], fillings: ['dau-xanh'] });
    expect(res).toHaveLength(2);
    expect(res.map((p) => p.id)).toEqual(['P2', 'P3']);
  });

  it('tìm kiếm theo tên sản phẩm, thương hiệu hoặc xưởng', () => {
    const resByVendor = filterProducts(sampleCatalog, { searchQuery: 'Đông Phương' });
    expect(resByVendor).toHaveLength(2);

    const resByName = filterProducts(sampleCatalog, { searchQuery: 'sầu riêng' });
    expect(resByName).toHaveLength(1);
    expect(resByName[0].id).toBe('P4');
  });

  it('sắp xếp theo giá tăng dần (price_asc) và giá giảm dần (price_desc)', () => {
    const resAsc = filterProducts(sampleCatalog, { sortOption: 'price_asc' });
    expect(resAsc[0].price).toBe(110000);
    expect(resAsc[resAsc.length - 1].price).toBe(150000);

    const resDesc = filterProducts(sampleCatalog, { sortOption: 'price_desc' });
    expect(resDesc[0].price).toBe(150000);
    expect(resDesc[resDesc.length - 1].price).toBe(110000);
  });
});
