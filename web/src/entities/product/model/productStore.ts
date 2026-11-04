import { createStore, useStore } from '@/shared/lib';
import { isDemoMode } from '@/shared/config';
import { INITIAL_CRUSTS, INITIAL_FILLINGS, type CakeTaxonomyItem, type Product } from './types';

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'prod_01',
    name: 'Bánh Nướng Thập Cẩm Gà Quay 2 Trứng Muối',
    vendorId: 'ven_quan',
    vendorName: 'Hiệu Bánh Gia Truyền Bảo An',
    brand: 'Bảo An Bakery',
    price: 135000,
    stock: 120,
    images: ['/images/banh-nuong.jpg'],
    description:
      'Hương vị truyền thống Hà Nội hơn 40 năm. Nhân thập cẩm gồm lạp xưởng, mỡ đường, hạt điều, mè rang, lá chanh tươi và 2 tròng trứng muối đỏ bùi ngậy.',
    expiryDate: '15/11/2026',
    deliveryTag: 'Giao toàn quốc',
    province: 'Hà Nội',
    rating: 4.9,
    reviewCount: 86,
    crusts: ['nuong'],
    fillings: ['thap-cam', 'trung-muoi'],
    status: 'ACTIVE',
    soldCount: 420,
    bulkQuoteThreshold: 30,
    acceptsCustomOrder: true,
  },
  {
    id: 'prod_02',
    name: 'Hộp Quà Trăng Vàng Đoàn Viên (4 Bánh Cao Cấp)',
    vendorId: 'ven_quan',
    vendorName: 'Hiệu Bánh Gia Truyền Bảo An',
    brand: 'Bảo An Bakery',
    price: 680000,
    stock: 45,
    images: ['/images/hop-qua.jpg'],
    description:
      'Hộp sơn mài đỏ viền ép kim sang trọng, bao gồm 4 vị: Thập Cẩm Bát Bửu, Hạt Sen Cốm Mới, Đậu Đỏ Hạnh Nhân và Bánh Lạnh Trà Xanh.',
    expiryDate: '20/11/2026',
    deliveryTag: 'Giao toàn quốc',
    province: 'Hà Nội',
    rating: 5.0,
    reviewCount: 32,
    crusts: ['nuong', 'lanh'],
    fillings: ['thap-cam', 'hat-sen', 'tra-xanh', 'dau-do'],
    status: 'ACTIVE',
    soldCount: 180,
    bulkQuoteThreshold: 20,
    acceptsCustomOrder: true,
  },
  {
    id: 'prod_03',
    name: 'Bánh Dẻo Hương Hoa Bưởi Nhân Đậu Xanh Hạt Sen',
    vendorId: 'ven_thao',
    vendorName: 'Tiệm Bánh & Quà Thu Nguyệt',
    brand: 'Thu Nguyệt',
    price: 95000,
    stock: 80,
    images: ['/images/banh-deo.jpg'],
    description:
      'Vỏ dẻo mềm dẻo như nhung, ướp nước hoa bưởi vườn Diễn tự nhiên, ôm trọn nhân hạt sen và đậu xanh nhuyễn mịn ngọt thanh tao.',
    expiryDate: '05/11/2026',
    deliveryTag: 'Giao nội thành',
    province: 'Hà Nội',
    rating: 4.8,
    reviewCount: 54,
    crusts: ['deo'],
    fillings: ['dau-xanh', 'hat-sen'],
    status: 'ACTIVE',
    soldCount: 310,
    bulkQuoteThreshold: 40,
    acceptsCustomOrder: true,
  },
  {
    id: 'prod_04',
    name: 'Bánh Nướng Nhân Sầu Riêng Ri6 Trứng Muối Tan Chảy',
    vendorId: 'ven_quan',
    vendorName: 'Hiệu Bánh Gia Truyền Bảo An',
    brand: 'Bảo An Bakery',
    price: 145000,
    stock: 65,
    images: ['/images/sau-rieng.jpg'],
    description:
      'Đậm đà thịt sầu riêng Ri6 chín cây miền Tây, hòa quyện lớp kem sữa và trứng muối béo ngậy. Bánh nướng vàng ươm chuẩn nhiệt độ.',
    expiryDate: '10/11/2026',
    deliveryTag: 'Giao toàn quốc',
    province: 'TP. Hồ Chí Minh',
    rating: 4.7,
    reviewCount: 41,
    crusts: ['nuong'],
    fillings: ['sau-rieng', 'trung-muoi'],
    status: 'ACTIVE',
    soldCount: 250,
    bulkQuoteThreshold: 30,
    acceptsCustomOrder: true,
  },
  {
    id: 'prod_05',
    name: 'Bánh Trung Thu Lạnh Matcha Trà Xanh Đậu Đỏ',
    vendorId: 'ven_thao',
    vendorName: 'Tiệm Bánh & Quà Thu Nguyệt',
    brand: 'Thu Nguyệt',
    price: 110000,
    stock: 40,
    images: ['/images/tra-xanh.jpg'],
    description:
      'Vỏ bánh lạnh từ bột matcha Shizuoka thơm nồng, nhân đậu đỏ Azuki ninh nhừ thơm bùi. Thưởng thức mát lạnh bên tách trà sen.',
    expiryDate: '08/11/2026',
    deliveryTag: 'Giao nội thành',
    province: 'TP. Hồ Chí Minh',
    rating: 4.9,
    reviewCount: 19,
    crusts: ['lanh'],
    fillings: ['tra-xanh', 'dau-do'],
    status: 'ACTIVE',
    soldCount: 95,
    bulkQuoteThreshold: 25,
    acceptsCustomOrder: true,
  },
  {
    id: 'prod_06',
    name: 'Bánh Nướng Thập Cẩm Xá Xíu Cổ Truyền (Mẫu Thử)',
    vendorId: 'ven_quan',
    vendorName: 'Hiệu Bánh Gia Truyền Bảo An',
    brand: 'Bảo An Bakery',
    price: 120000,
    stock: 0,
    images: ['/images/banh-nuong.jpg'],
    description: 'Phiên bản giới hạn công thức bí truyền thập niên 80.',
    expiryDate: '01/11/2026',
    deliveryTag: 'Giao nội thành',
    province: 'Hà Nội',
    rating: 4.6,
    reviewCount: 12,
    crusts: ['nuong'],
    fillings: ['thap-cam'],
    status: 'HIDDEN',
    soldCount: 40,
  },
];

/**
 * The catalogue of the Shop.
 *
 * In demo mode the store starts with the mock list; against a live backend it
 * starts empty and is filled by `useProductCatalog` from `catalog-service`, so
 * the screens never show a product the backend does not know.
 */
export const productStore = createStore<Product[]>(
  isDemoMode() ? MOCK_PRODUCTS : [],
  isDemoMode() ? 'moonkage_products' : undefined
);

export const taxonomyStore = createStore<{ crusts: CakeTaxonomyItem[]; fillings: CakeTaxonomyItem[] }>(
  { crusts: INITIAL_CRUSTS, fillings: INITIAL_FILLINGS },
  isDemoMode() ? 'moonkage_taxonomy' : undefined
);

export function useProducts(): Product[] {
  return useStore(productStore);
}

export function useProduct(id: string): Product | undefined {
  const products = useProducts();
  return products.find((p) => p.id === id);
}

export function useTaxonomy() {
  return useStore(taxonomyStore);
}
