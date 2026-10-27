import { describe, expect, it } from 'vitest';
import { cartTotals, groupByShop, type CartItem } from './cartModel';

const item = (over: Partial<CartItem>): CartItem => ({
  productId: 'p', name: 'Bánh', price: 100000, stock: 10, quantity: 1, shopId: 's', shopName: 'Shop', shippingFee: 25000, shopTakesCustom: false, ...over,
});

describe('cart model', () => {
  it('makes one group per shop and counts shipping once per shop', () => {
    const groups = groupByShop([
      item({ productId: 'a', shopId: 'nn', price: 680000 }),
      item({ productId: 'b', shopId: 'nn', price: 85000, quantity: 2 }),
      item({ productId: 'c', shopId: 'tv', price: 420000, shippingFee: 20000 }),
    ]);
    expect(groups.map((g) => [g.shopId, g.goods])).toEqual([
      ['nn', 850000],
      ['tv', 420000],
    ]);
    expect(cartTotals(groups)).toEqual({ goods: 1270000, shipping: 45000, total: 1315000, lines: 3 });
  });
});
