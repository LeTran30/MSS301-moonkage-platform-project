export type CartItem = {
  /** `itemId` của backend — dùng để gọi `PATCH` / `DELETE` trên một dòng giỏ. */
  itemId?: string;
  productId: string;
  name: string;
  price: number;
  image: string;
  vendorId: string;
  vendorName: string;
  quantity: number;
  stock: number;
  bulkQuoteThreshold?: number;
};

// FR-08, BR-29: Giỏ hàng tách theo Shop, phí giao từng Shop
export type ShopCartGroup = {
  vendorId: string;
  vendorName: string;
  shippingFee: number;
  items: CartItem[];
};

export type CartState = {
  groups: ShopCartGroup[];
};
