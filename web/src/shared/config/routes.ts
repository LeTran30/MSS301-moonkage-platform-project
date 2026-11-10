/**
 * Đường dẫn của mọi màn hình, gom theo khu vực (package-architecture §3, Tầng 1).
 * Đường dẫn lấy theo sitemap IA (viết không dấu, không chứa dữ liệu cá nhân – NFR-03).
 * Mã trang IA ghi ở chú thích cuối dòng.
 */
export const routes = {
  base: {
    home: '/', // M1.0
    catalog: '/san-pham', // M2.0
    product: (id: string) => `/san-pham/${id}`, // M2.1
    bulk: '/dat-so-luong-lon', // M3.0
    quoteRequestNew: '/dat-so-luong-lon/yeu-cau-moi', // M3.1
    vendors: '/don-vi-cung-cap', // M3.2
    vendor: (id: string) => `/don-vi-cung-cap/${id}`, // M3.3
    vendorRequest: (id: string) => `/don-vi-cung-cap/${id}/yeu-cau`, // M3.4
    cart: '/gio-hang', // M4.0
    checkout: '/thanh-toan', // M4.1
    paymentResult: '/thanh-toan/ket-qua', // M4.3
    notifications: '/thong-bao', // M6.6
    sellIntro: '/ban-hang/gioi-thieu', // M7.0
    sellRegister: '/ban-hang/dang-ky', // M7.1
    policy: '/chinh-sach', // M8.0
  },
  auth: {
    login: '/dang-nhap', // M5.1
    register: '/dang-ky', // M5.2
    registerConfirm: '/dang-ky/xac-nhan', // M5.3
    forgotPassword: '/quen-mat-khau', // M5.4
    resetPassword: '/dat-lai-mat-khau', // M5.5
  },
  account: {
    overview: '/tai-khoan', // M6.0
    orders: '/tai-khoan/don-hang', // M6.1
    order: (id: string) => `/tai-khoan/don-hang/${id}`, // M6.1.1, M6.1.2
    // The same page opened on the maket tab, where the buyer approves the latest version (FR-20).
    orderMaket: (id: string) => `/tai-khoan/don-hang/${id}?tab=maket`,
    orderDispute: (id: string) => `/tai-khoan/don-hang/${id}/khieu-nai`, // M6.1.3
    requests: '/tai-khoan/yeu-cau', // M6.2
    request: (id: string) => `/tai-khoan/yeu-cau/${id}`, // M6.2.1
    requestDeposit: (id: string) => `/tai-khoan/yeu-cau/${id}/dat-coc`, // M6.2.2
    addresses: '/tai-khoan/dia-chi', // M6.3
    address: (id: string) => `/tai-khoan/dia-chi/${id}`, // M6.3.1
    addressNew: '/tai-khoan/dia-chi/moi',
    verify: '/tai-khoan/xac-minh', // M6.4
    profile: '/tai-khoan/thong-tin', // M6.5
    wallet: '/tai-khoan/vi', // Ví người mua (Q-01)
    messages: '/tai-khoan/tin-nhan', // Nhắn tin với shop
    messagesWithShop: (vendorId: string) =>
      `/tai-khoan/tin-nhan?shop=${encodeURIComponent(vendorId)}`,
  },
  vendor: {
    overview: '/kenh-ban', // B1.0
    fee: '/kenh-ban/phi-mo-ban', // B1.1
    orders: '/kenh-ban/don-hang', // B2.0
    order: (id: string) => `/kenh-ban/don-hang/${id}`, // B2.1, B2.2
    requests: '/kenh-ban/yeu-cau', // B3.0
    request: (id: string) => `/kenh-ban/yeu-cau/${id}`, // B3.1
    quote: (id: string) => `/kenh-ban/yeu-cau/${id}/bao-gia`, // B3.2
    products: '/kenh-ban/san-pham', // B4.0
    product: (id: string) => `/kenh-ban/san-pham/${id}`, // B4.1
    productNew: '/kenh-ban/san-pham/moi',
    money: '/kenh-ban/tien', // B5.0
    reconciliation: '/kenh-ban/tien/doi-soat', // B5.1
    disbursements: '/kenh-ban/tien/giai-ngan', // B5.2
    messages: '/kenh-ban/tin-nhan', // Hộp thư khách hỏi shop
    settings: '/kenh-ban/cai-dat', // B6.0
    legal: '/kenh-ban/cai-dat/phap-ly', // B6.1
    zones: '/kenh-ban/cai-dat/vung-giao', // B6.2
    bulkTerms: '/kenh-ban/cai-dat/nhan-dat-hang', // B6.3
    capacity: '/kenh-ban/cai-dat/cong-suat', // B6.4 (hoãn)
  },
  admin: {
    overview: '/quan-tri', // Q1.0
    vendors: '/quan-tri/nguoi-ban', // Q2.0
    vendor: (id: string) => `/quan-tri/nguoi-ban/${id}`, // Q2.1
    products: '/quan-tri/san-pham', // Q3.0
    money: '/quan-tri/tien', // Q4.0
    disbursements: '/quan-tri/tien/giai-ngan', // Q4.1
    payouts: '/quan-tri/tien/chuyen-tien', // Q4.2
    withdrawals: '/quan-tri/tien/rut-tien', // Rút tiền từ ví người mua (Q-01)
    reconciliation: '/quan-tri/tien/doi-soat', // Q4.3
    disputes: '/quan-tri/khieu-nai', // Q5.0
    config: '/quan-tri/cau-hinh', // Q6.0
    interprovinceFee: '/quan-tri/cau-hinh/phi-lien-tinh', // Q6.1
    openingFee: '/quan-tri/cau-hinh/phi-mo-ban', // Q6.2
    vouchers: '/quan-tri/cau-hinh/voucher', // Q6.3 (hoãn)
    cakeCatalog: '/quan-tri/cau-hinh/vo-nhan', // Q6.4
  },
  system: {
    notFound: '/404',
  },
} as const;

export const ROUTES = {
  HOME: routes.base.home,
  CATALOG: routes.base.catalog,
  BULK_HUB: routes.base.bulk,
  BULK_REQUEST_NEW: routes.base.quoteRequestNew,
  VENDORS_LIST: routes.base.vendors,
  CART: routes.base.cart,
  CHECKOUT: routes.base.checkout,
  PAYMENT_RESULT: routes.base.paymentResult,
  POLICY: routes.base.policy,
  NOTIFICATIONS: routes.base.notifications,
  SELL_INTRO: routes.base.sellIntro,
  SELL_REGISTER: routes.base.sellRegister,

  LOGIN: routes.auth.login,
  REGISTER: routes.auth.register,

  ACCOUNT_OVERVIEW: routes.account.overview,
  ACCOUNT_ORDERS: routes.account.orders,
  ACCOUNT_REQUESTS: routes.account.requests,
  ACCOUNT_ADDRESSES: routes.account.addresses,
  ACCOUNT_NFC: routes.account.verify,
  ACCOUNT_PROFILE: routes.account.profile,
  ACCOUNT_NOTIFICATIONS: routes.base.notifications,

  VENDOR_OVERVIEW: routes.vendor.overview,
  VENDOR_ORDERS: routes.vendor.orders,
  VENDOR_REQUESTS: routes.vendor.requests,
  VENDOR_PRODUCTS: routes.vendor.products,
  VENDOR_MONEY: routes.vendor.money,
  VENDOR_SETTINGS: routes.vendor.settings,

  ADMIN_OVERVIEW: routes.admin.overview,
  ADMIN_VENDORS: routes.admin.vendors,
  ADMIN_PRODUCTS: routes.admin.products,
  ADMIN_MONEY: routes.admin.money,
  ADMIN_DISPUTES: routes.admin.disputes,
  ADMIN_CONFIG: routes.admin.config,
} as const;
