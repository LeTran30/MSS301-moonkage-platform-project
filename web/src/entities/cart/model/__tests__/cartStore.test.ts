import { describe, it, expect, beforeEach } from 'vitest';
import { cartStore, addToCart, updateCartQuantity, clearCart } from '../cartStore';

const mockItemA = {
  productId: 'prod_01',
  name: 'Bánh Nướng Thập Cẩm Gà Quay',
  price: 135000,
  image: '/images/banh-nuong.jpg',
  vendorId: 'ven_quan',
  vendorName: 'Hiệu Bánh Gia Truyền Bảo An',
  stock: 120,
  bulkQuoteThreshold: 30,
};

const mockItemVendor2 = {
  productId: 'prod_03',
  name: 'Hộp Quà Thượng Hạng Đông Phương',
  price: 450000,
  image: '/images/hop-qua.jpg',
  vendorId: 'ven_dong_phuong',
  vendorName: 'Xưởng Bánh Đông Phương',
  stock: 50,
};

describe('CartStore - Giỏ hàng tách theo Shop & Phí giao (FR-08, BR-29, FR-09, FR-10)', () => {
  beforeEach(() => {
    clearCart();
  });

  it('bắt đầu với giỏ hàng rỗng sau khi clearCart', () => {
    const state = cartStore.get();
    expect(state.groups).toHaveLength(0);
  });

  it('thêm sản phẩm vào giỏ hàng thành công', () => {
    addToCart(mockItemA, 2);
    const state = cartStore.get();

    expect(state.groups).toHaveLength(1);
    expect(state.groups[0].vendorId).toBe('ven_quan');
    expect(state.groups[0].items).toHaveLength(1);
    expect(state.groups[0].items[0].productId).toBe('prod_01');
    expect(state.groups[0].items[0].quantity).toBe(2);
  });

  it('cộng dồn số lượng khi thêm cùng một sản phẩm', () => {
    addToCart(mockItemA, 2);
    addToCart(mockItemA, 3);
    const state = cartStore.get();

    expect(state.groups).toHaveLength(1);
    expect(state.groups[0].items[0].quantity).toBe(5);
  });

  it('tách nhóm riêng biệt khi thêm sản phẩm từ 2 shop khác nhau (FR-08, BR-29)', () => {
    addToCart(mockItemA, 1);
    addToCart(mockItemVendor2, 1);
    const state = cartStore.get();

    expect(state.groups).toHaveLength(2);
    expect(state.groups[0].vendorId).toBe('ven_quan');
    expect(state.groups[1].vendorId).toBe('ven_dong_phuong');
  });

  it('cập nhật số lượng sản phẩm trong giỏ', () => {
    addToCart(mockItemA, 2);
    updateCartQuantity('prod_01', 4);
    const state = cartStore.get();

    expect(state.groups[0].items[0].quantity).toBe(4);
  });

  it('xóa sản phẩm khi số lượng cập nhật về 0', () => {
    addToCart(mockItemA, 2);
    updateCartQuantity('prod_01', 0);
    const state = cartStore.get();

    expect(state.groups).toHaveLength(0);
  });

  it('clearCart xóa sạch toàn bộ các nhóm đơn hàng', () => {
    addToCart(mockItemA, 2);
    addToCart(mockItemVendor2, 1);
    clearCart();
    const state = cartStore.get();

    expect(state.groups).toHaveLength(0);
  });
});
