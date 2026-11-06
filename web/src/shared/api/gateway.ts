import { ENV } from '@/shared/config/env';

/**
 * Gateway Endpoints Mapping
 * Chuẩn hóa 7 microservices của nền tảng Moonkage theo kiến trúc Spring Cloud Gateway
 * Đối chiếu trực tiếp với các Controller trong backend (api/)
 */
export const GATEWAY = {
  // 1. Identity & Auth Service (AccountController, AuthController, KycController)
  IDENTITY: {
    LOGIN: '/identity-service/api/auth/login',
    REGISTER: '/identity-service/api/auth/register',
    REFRESH: '/identity-service/api/auth/refresh-token', // AuthController: @PostMapping("/refresh-token")
    ME: '/identity-service/api/accounts/me',             // AccountController: @GetMapping("/api/accounts/me")
    // AccountController: @PatchMapping("/api/accounts/me/profile") — đổi họ tên hiển thị (FR-02).
    UPDATE_PROFILE: '/identity-service/api/accounts/me/profile',
    NFC_SESSIONS: '/identity-service/api/nfc/sessions',  // KycController: /api/nfc/sessions
    NFC_SESSION_BY_ID: (sessionId: string) => `/identity-service/api/nfc/sessions/${sessionId}`,
    NFC_SESSION_CARD: (sessionId: string) => `/identity-service/api/nfc/sessions/${sessionId}/card`,
    NFC_VERIFY_STATUS: '/identity-service/api/nfc/status',
    // AddressController: @RequestMapping("/api/addresses") — FR-03, sổ địa chỉ nhận hàng.
    // Tài liệu api-db/identity.md vẽ "/api/accounts/me/addresses" (giai đoạn 3 của
    // api-db-alignment-plan.md), nhưng code đang chạy dùng "/api/addresses"; theo quy tắc
    // "file trong repo là bản đúng" (docs/architecture/api-db/README.md) ta theo code.
    ADDRESSES: '/identity-service/api/addresses',
    ADDRESS_BY_ID: (addressId: string) => `/identity-service/api/addresses/${addressId}`,
    // AuthController: @PostMapping("/verify-account")
    VERIFY_ACCOUNT: '/identity-service/api/auth/verify-account',
    // AuthController: @PostMapping("/send-verify-account-otp")
    SEND_VERIFY_ACCOUNT_OTP: '/identity-service/api/auth/send-verify-account-otp',
    // AuthController: @PostMapping("/reset-password")
    RESET_PASSWORD: '/identity-service/api/auth/reset-password',
    // AuthController: @PostMapping("/send-reset-password-otp")
    SEND_RESET_PASSWORD_OTP: '/identity-service/api/auth/send-reset-password-otp',
  },

  // 2. Vendor Management Service (VendorController, SupplierController)
  VENDOR: {
    BASE: '/api/vendors',                                // VendorController: @GetMapping("/api/vendors")
    BY_ID: (id: string) => `/api/vendors/${id}`,
    REGISTER: '/api/vendors',                            // VendorController: @PostMapping("/api/vendors")
    SUPPLIERS: '/quotation-service/api/suppliers',       // SupplierController
    SUPPLIER_BY_ID: (id: string) => `/quotation-service/api/suppliers/${id}`,
    REGISTRATION_FEE_CONFIG: '/api/registration-fee-config',
    // CakeAttributeController: @RequestMapping("/api/cake-attributes")
    CAKE_ATTRIBUTES: '/api/cake-attributes',
    // VendorController không có endpoint trả "vùng giao" dạng enum; vùng giao
    // là danh sách tỉnh của delivery-areas (FR-28).
    // VendorController: @PostMapping("/api/vendors/{vendorId}/documents") — admin gắn
    // hoá đơn phí đăng ký (Q-36).
    // VendorController: @GetMapping("/api/vendors/{vendorId}/delivery-areas")
    DELIVERY_AREAS: (vendorId: string) => `/api/vendors/${vendorId}/delivery-areas`,
    // VendorController: @GetMapping("/api/vendors/{vendorId}/order-profile")
    ORDER_PROFILE: (vendorId: string) => `/api/vendors/${vendorId}/order-profile`,
    // VendorController: @PostMapping("/api/vendors/uploads")
    UPLOADS: '/api/vendors/uploads',
    // VendorController: @PostMapping("/api/vendors/{vendorId}/documents")
    DOCUMENTS: (vendorId: string) => `/api/vendors/${vendorId}/documents`,
    // VendorController: @GetMapping("/api/vendors/{vendorId}/documents/{documentId}")
    DOCUMENT_LINK: (vendorId: string, documentId: string) =>
      `/api/vendors/${vendorId}/documents/${documentId}`,
    // VendorController: @GetMapping("/api/vendors/{vendorId}/reviews")
    REVIEWS: (vendorId: string) => `/api/vendors/${vendorId}/reviews`,
    // VendorController: @GetMapping("/api/vendors/{vendorId}/owner-checks")
    OWNER_CHECKS: (vendorId: string) => `/api/vendors/${vendorId}/owner-checks`,
    // VendorController: @PostMapping("/api/vendors/{vendorId}/registration-fee-payments")
    REGISTRATION_FEE_PAYMENT: (vendorId: string) =>
      `/api/vendors/${vendorId}/registration-fee-payments`,
    // ProductController: @RequestMapping("/api/vendors/{vendorId}/products")
    PRODUCTS: (vendorId: string) => `/api/vendors/${vendorId}/products`,
    PRODUCT_BY_ID: (vendorId: string, productId: string) =>
      `/api/vendors/${vendorId}/products/${productId}`,
    // ProductController: @PostMapping("/api/vendors/{vendorId}/products/uploads")
    PRODUCT_UPLOADS: (vendorId: string) => `/api/vendors/${vendorId}/products/uploads`,
  },
  // 3. Catalog & Taxonomy Service (ProductController, CakeAttributes)
  CATALOG: {
    PRODUCTS: '/catalog-service/api/products',          // ProductController: /api/products
    PRODUCT_BY_ID: (id: string) => `/catalog-service/api/products/${id}`,
    // ProductReadController: @GetMapping("/{productId}/reviews") — đánh giá của sản phẩm (AC-11.3).
    PRODUCT_REVIEWS: (id: string) => `/catalog-service/api/products/${id}/reviews`,
    CAKE_ATTRIBUTES: '/api/cake-attributes',             // Danh mục Vỏ & Nhân FR-54
    // BE nhận nhóm bằng query `?group=CRUST|FILLING`, không có path con riêng.
  },

  // 4. Quotation Service - B2B Số lượng lớn (QuoteRequestController)
  QUOTATION: {
    BASE: '/quotation-service/api',
    REQUESTS: '/quotation-service/api/quote-requests',
    REQUEST_BY_ID: (id: string) => `/quotation-service/api/quote-requests/${id}`,
    SUBMIT_QUOTE: (requestId: string) => `/quotation-service/api/quote-requests/${requestId}/quotes`,
    REQUEST_QUOTES: (requestId: string) => `/quotation-service/api/quote-requests/${requestId}/quotes`,
    // QuoteRequestController: @GetMapping("/{requestId}/invitations")
    REQUEST_INVITATIONS: (requestId: string) =>
      `/quotation-service/api/quote-requests/${requestId}/invitations`,
    // QuoteRequestController: @PostMapping("/{requestId}/quotes/{quoteId}/acceptance")
    ACCEPT_QUOTE: (requestId: string, quoteId: string) =>
      `/quotation-service/api/quote-requests/${requestId}/quotes/${quoteId}/acceptance`,
    GET_ACCEPTANCE: (requestId: string, quoteId: string) =>
      `/quotation-service/api/quote-requests/${requestId}/quotes/${quoteId}/acceptance`,
    // QuoteRequestController: @GetMapping("/{requestId}/quotes/{quoteId}")
    QUOTE_BY_ID: (requestId: string, quoteId: string) =>
      `/quotation-service/api/quote-requests/${requestId}/quotes/${quoteId}`,
    // QuoteRequestController: @PatchMapping("/{requestId}/quotes/{quoteId}") — chỉ WITHDRAWN (BR-05).
    UPDATE_QUOTE: (requestId: string, quoteId: string) =>
      `/quotation-service/api/quote-requests/${requestId}/quotes/${quoteId}`,
    // QuoteRequestController: @PatchMapping("/{requestId}/invitations/{vendorId}") — chỉ DECLINED (AC-36.3).
    UPDATE_INVITATION: (requestId: string, vendorId: string) =>
      `/quotation-service/api/quote-requests/${requestId}/invitations/${vendorId}`,
  },

  // 5. Order & Cart Service (CartController, CheckoutController, OrderDocumentController, DisputeController)
  ORDER: {
    CART: '/order-service/api/carts/me',
    CART_ITEMS: '/order-service/api/carts/me/items',
    // CartController: @DeleteMapping("/items/{itemId}") — 204, nothing to unwrap.
    CART_ITEM: (itemId: string) => `/order-service/api/carts/me/items/${itemId}`,
    CHECKOUT: '/order-service/api/checkouts',
    // CheckoutController: @GetMapping("/{checkoutId}") — trạng thái checkout + orderIds đã tạo (FR-09).
    CHECKOUT_BY_ID: (checkoutId: string) => `/order-service/api/checkouts/${checkoutId}`,
    ORDERS: '/order-service/api/orders',
    ORDER_BY_ID: (id: string) => `/order-service/api/orders/${id}`,
    // OrderController: @PatchMapping("/{orderId}") — vendor chuyển bước (FR-32, FR-40),
    // buyer xác nhận đã nhận (FR-11).
    ORDER_UPDATE: (id: string) => `/order-service/api/orders/${id}`,
    // FR-21: lịch sử tiến độ của đơn
    PROGRESS_UPDATES: (id: string) => `/order-service/api/orders/${id}/progress-updates`,
    // FR-22: thanh toán phần còn lại của đơn custom
    PAY_REMAINDER: (id: string) => `/order-service/api/orders/${id}/payments`,
    // Mockups / Maket (OrderDocumentController: @RequestMapping("/api/orders"))
    MAKET_MOCKUPS: (orderId: string) => `/order-service/api/orders/${orderId}/mockups`,
    MAKET_PATCH: (orderId: string, versionNo: number | string) =>
      `/order-service/api/orders/${orderId}/mockups/${versionNo}`,
    // OrderDocumentController: @PostMapping("/uploads")
    UPLOADS: '/order-service/api/orders/uploads',
    // OrderDocumentController: @GetMapping("/{orderId}/invoice")
    INVOICE: (orderId: string) => `/order-service/api/orders/${orderId}/invoice`,
    // Khiếu nại (số ít theo DisputeController: @RequestMapping("/api/orders/{orderId}/dispute"))
    DISPUTE: (orderId: string) => `/order-service/api/orders/${orderId}/dispute`,
    DISPUTE_EVIDENCES: (orderId: string) => `/order-service/api/orders/${orderId}/dispute/evidences`,
    // Đánh giá sản phẩm (ReviewController: @RequestMapping("/api/orders/{orderId}/reviews"))
    REVIEWS: (orderId: string) => `/order-service/api/orders/${orderId}/reviews`,
  },

  // 6. Payment & Escrow Service (LedgerController, PaymentController)
  PAYMENT: {
    BASE: '/payment-service/api',
    VNPAY_IPN: '/payment-service/api/payments/vnpay/ipn',
    VNPAY_RETURN: '/payment-service/api/payments/vnpay/return',
    // PaymentController: @GetMapping, @GetMapping("/{paymentId}") — trạng thái giao dịch để poll (FR-09).
    PAYMENTS: '/payment-service/api/payments',
    PAYMENT_BY_ID: (paymentId: string) => `/payment-service/api/payments/${paymentId}`,
    LEDGERS: '/payment-service/api/ledgers',
    LEDGER_BY_ORDER: (orderId: string) => `/payment-service/api/ledgers/${orderId}`,
    // LedgerController: @GetMapping("/{orderId}/entries")
    LEDGER_ENTRIES: (orderId: string) => `/payment-service/api/ledgers/${orderId}/entries`,
    // LedgerController: @GetMapping("/{orderId}/refunds")
    LEDGER_REFUNDS: (orderId: string) => `/payment-service/api/ledgers/${orderId}/refunds`,
    // LedgerController: @GetMapping("/{orderId}/disbursements")
    LEDGER_DISBURSEMENTS: (orderId: string) => `/payment-service/api/ledgers/${orderId}/disbursements`,
    // LedgerController: @PostMapping("/{orderId}/disbursements")
    LEDGER_DISBURSEMENT_CREATE: (orderId: string) =>
      `/payment-service/api/ledgers/${orderId}/disbursements`,
    // LedgerController: @PatchMapping("/{orderId}/disbursements/{requestId}")
    LEDGER_DISBURSEMENT_REVIEW: (orderId: string, requestId: string) =>
      `/payment-service/api/ledgers/${orderId}/disbursements/${requestId}`,
    // LedgerController: @PutMapping("/{orderId}/payout")
    LEDGER_PAYOUT: (orderId: string) => `/payment-service/api/ledgers/${orderId}/payout`,
    APPROVE_PAYOUT: (orderId: string) => `/payment-service/api/ledgers/${orderId}/payout`,
    // RefundController: @RequestMapping("/api/refunds") — các khoản hoàn cần xử lý tay (AC-49.3).
    REFUNDS: '/payment-service/api/refunds',
    REFUND_BY_ID: (refundId: string) => `/payment-service/api/refunds/${refundId}`,
  },

  // 7. Logistics & WebSocket Realtime (InterprovinceFeeController, STOMP)
  LOGISTICS: {
    // InterprovinceFeeController: @RequestMapping("/api/interprovince-fees").
    // Gateway định tuyến riêng path này tới catalog-service (application.yml).
    INTERPROVINCE_FEES: '/api/interprovince-fees',
    INTERPROVINCE_FEE_BY_PROVINCE: (provinceCode: string) =>
      `/api/interprovince-fees/provinces/${provinceCode}`,
    WS_REALTIME: '/ws',
  },

  // 8. Orchestrator Service (Notification, AuditLog)
  ORCHESTRATOR: {
    // NotificationController (BE-04b): @RequestMapping("/api/notifications").
    // Gateway định tuyến path này tới orchestrator-service (application.yml).
    NOTIFICATIONS: '/api/notifications',
    NOTIFICATION_MARK_READ: (notificationId: string) =>
      `/api/notifications/${notificationId}/read`,
    NOTIFICATIONS_MARK_ALL_READ: '/api/notifications/read-all',
    // orchestrator-service chưa có REST cho nhật ký kiểm toán.
    AUDIT_LOGS: '/orchestrator-service/api/audit-logs',
  },
} as const;

/**
 * Các endpoint dự kiến nhưng BE hiện tại chưa công khai REST hoặc đang xử lý qua luồng nội bộ
 */
export const NOT_IMPLEMENTED_YET = {
  AUDIT_LOGS: '/orchestrator-service/api/audit-logs', // orchestrator chưa có REST cho audit log
  VNPAY_CREATE_PUBLIC: '/payment-service/api/payments',      // BE-08b: cần endpoint public thay vì /internal/payments
} as const;

/** STOMP over WebSocket của orchestrator-service, đi qua gateway; token nằm trong CONNECT frame. */
export const realtimePath = '/ws';

/**
 * ws(s):// URL của một đường dẫn gateway, lấy từ `VITE_WS_URL` (ưu tiên) rồi tới `VITE_API_BASE_URL`.
 *
 * Không có cấu hình thì trả về `null`: không có máy chủ realtime để kết nối.
 */
export function websocketUrl(path: string): string {
  const base = ENV.wsUrl || ENV.apiBaseUrl;
  if (!base) return '';
  const url = new URL(path, base);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  return url.toString();
}

