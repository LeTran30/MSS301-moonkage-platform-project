import type { Page, Route } from '@playwright/test';

/**
 * Câu trả lời của backend cho các test E2E.
 *
 * Luồng 1 không còn dữ liệu mock trong ứng dụng: catalog, giỏ, đơn và sản phẩm
 * của Shop luôn đọc từ máy chủ. Bản build E2E trỏ `VITE_API_BASE_URL` tới
 * `API_ORIGIN` (không có máy chủ nào ở đó) và các route dưới đây trả lời thay,
 * theo đúng hình dạng backend gửi: envelope `{ status, code, message, data }`,
 * trang `{ content, page, size, ... }`, mã vỏ/nhân thật của vendor-service.
 */
export const API_ORIGIN = 'http://127.0.0.1:9999';

function envelope<T>(data: T, status = 200) {
  return { status, code: 'SUCCESS', message: 'OK', data, timestamp: '2026-11-05T03:00:00Z' };
}

function paged<T>(content: T[]) {
  return { content, page: 0, size: content.length, totalElements: content.length, totalPages: 1 };
}

export const CAKE_ATTRIBUTES = [
  { id: 'a1', group: 'CRUST', code: 'banh-nuong', label: 'Bánh nướng', sortOrder: 1, active: true },
  { id: 'a2', group: 'CRUST', code: 'banh-deo', label: 'Bánh dẻo', sortOrder: 2, active: true },
  { id: 'a3', group: 'FILLING', code: 'thap-cam', label: 'Thập cẩm', sortOrder: 1, active: true },
  { id: 'a4', group: 'FILLING', code: 'dau-xanh', label: 'Đậu xanh', sortOrder: 2, active: true },
];

/** `ProductListingResponse` of catalog-service. */
export const CATALOG_PRODUCTS = [
  {
    id: 'p-thap-cam',
    vendorId: 'v-trang-vang',
    vendorName: 'Tiệm Bánh Trăng Vàng',
    name: 'Bánh nướng thập cẩm gà quay',
    description: 'Nhân thập cẩm truyền thống, gà quay, trứng muối.',
    crustCodes: ['banh-nuong'],
    fillingCodes: ['thap-cam'],
    brand: 'Trăng Vàng',
    origin: 'Hà Nội',
    piecesPerBox: 4,
    listPrice: 250000,
    stock: 50,
    inStock: true,
    expiryDate: '2026-12-31',
    deliveryLabel: 'NATIONWIDE',
    status: 'ON_SALE',
    imageUrls: ['/images/banh-nuong.jpg'],
    ratingAvg: 4.8,
    ratingCount: 12,
    vendorAcceptsOrders: true,
  },
  {
    id: 'p-dau-xanh',
    vendorId: 'v-trang-vang',
    vendorName: 'Tiệm Bánh Trăng Vàng',
    name: 'Bánh dẻo đậu xanh',
    description: 'Vỏ dẻo, nhân đậu xanh mịn.',
    crustCodes: ['banh-deo'],
    fillingCodes: ['dau-xanh'],
    brand: 'Trăng Vàng',
    origin: 'Hà Nội',
    piecesPerBox: 4,
    listPrice: 180000,
    stock: 30,
    inStock: true,
    expiryDate: '2026-12-31',
    deliveryLabel: 'LOCAL',
    status: 'ON_SALE',
    imageUrls: ['/images/banh-nuong.jpg'],
    ratingAvg: 0,
    ratingCount: 0,
    vendorAcceptsOrders: false,
  },
];

async function json(route: Route, data: unknown, status = 200) {
  await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(envelope(data, status)) });
}

/**
 * Trả lời mọi request tới `API_ORIGIN`. Endpoint của luồng 1 có dữ liệu; các
 * endpoint khác trả envelope rỗng, để trang không gặp lỗi mạng khi bản demo của
 * luồng đó chưa cần dữ liệu máy chủ.
 */
export async function stubApi(page: Page): Promise<void> {
  await page.route(`${API_ORIGIN}/**`, async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    const method = route.request().method();

    if (method === 'GET' && path === '/api/cake-attributes') return json(route, CAKE_ATTRIBUTES);
    if (method === 'GET' && path === '/catalog-service/api/products') return json(route, paged(CATALOG_PRODUCTS));
    const reviews = /^\/catalog-service\/api\/products\/([^/]+)\/reviews$/.exec(path);
    if (method === 'GET' && reviews) return json(route, paged([]));
    const product = /^\/catalog-service\/api\/products\/([^/]+)$/.exec(path);
    if (method === 'GET' && product) {
      const found = CATALOG_PRODUCTS.find((p) => p.id === product[1]);
      return found ? json(route, found) : json(route, null, 404);
    }
    if (method === 'GET' && path === '/order-service/api/carts/me') return json(route, { provinceCode: '01', groups: [] });
    if (method === 'GET' && /^\/api\/vendors\/[^/]+\/products$/.test(path)) return json(route, []);
    if (method === 'GET' && path.endsWith('/orders')) return json(route, paged([]));

    return json(route, method === 'GET' ? null : {});
  });
}
