export const CHECKOUT_STEPS = ['Giỏ hàng', 'Giao hàng và hóa đơn', 'Thanh toán VNPay', 'Kết quả'];

/** A cart line with what the page knows of its product (from the catalogue). */
export interface CartItem {
  productId: string;
  name: string;
  price: number;
  stock: number;
  quantity: number;
  shopId: string;
  shopName: string;
  shippingFee: number;
  shopTakesCustom: boolean;
}

export interface ShopGroup {
  shopId: string;
  shopName: string;
  shippingFee: number;
  items: CartItem[];
  goods: number;
}

/** One order per shop (BR: each shop is its own order), shipping counted once per shop. */
export function groupByShop(items: CartItem[]): ShopGroup[] {
  const groups = new Map<string, ShopGroup>();
  items.forEach((item) => {
    const g = groups.get(item.shopId) ?? { shopId: item.shopId, shopName: item.shopName, shippingFee: item.shippingFee, items: [], goods: 0 };
    g.items.push(item);
    g.goods += item.price * item.quantity;
    groups.set(item.shopId, g);
  });
  return [...groups.values()];
}

export function cartTotals(groups: ShopGroup[]) {
  const goods = groups.reduce((n, g) => n + g.goods, 0);
  const shipping = groups.reduce((n, g) => n + g.shippingFee, 0);
  const lines = groups.reduce((n, g) => n + g.items.length, 0);
  return { goods, shipping, total: goods + shipping, lines };
}
