export type Crust = 'nuong' | 'deo' | 'than-tre';
export type Filling = 'thap-cam' | 'hat-sen' | 'dau-xanh' | 'tra-xanh' | 'khoai-mon' | 'me-den' | 'yen-sao' | 'vi-ca';

export interface ProductSummary {
  id: string;
  name: string;
  shopId: string;
  shopName: string;
  /** District of the shop; null when the shop has not declared one. */
  district: string | null;
  brand: string;
  crust: Crust;
  fillings: Filling[];
  price: number;
  rating: number | null;
  reviewCount: number;
  /** Provinces the shop delivers this product to (the area filter is always on, AC-05.3). */
  deliverTo: string[];
  /** Pack size as the shop wrote it: "4 bánh × 200g, hộp giấy cứng". */
  pack: string;
  /** Boxes left. */
  stock: number;
  /** Image URLs; empty until the shop uploads photos. */
  images: string[];
}

export interface Review {
  initial: string;
  name: string;
  stars: number;
  date: string;
  text: string;
}

export interface ProductDetail extends ProductSummary {
  shippingFrom: number;
  /** Spec rows of "Trong hộp": label → value. */
  specs: { label: string; value: string }[];
  /** The shop also takes custom orders (shows "Gửi yêu cầu cho Shop này"). */
  shopTakesCustom: boolean;
  reviews: Review[];
}
