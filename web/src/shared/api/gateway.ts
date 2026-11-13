import { ENV } from '@/shared/config/env';

/**
 * Gateway Endpoints Mapping
 * Chuẩn hóa 7 microservices của nền tảng Moonkage theo kiến trúc Spring Cloud Gateway
 * Đối chiếu trực tiếp với các Controller trong backend (api/)
 */
export const GATEWAY = {
  // 1. Identity & Auth Service (AccountController, AuthController, KycController)
  IDENTITY: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    REFRESH: '/api/auth/refresh-token', // AuthController: @PostMapping("/refresh-token")
    ME: '/api/accounts/me', // AccountController: @GetMapping("/api/accounts/me")
    // AccountController: @PatchMapping("/api/accounts/me/profile") — đổi họ tên hiển thị (FR-02).
    UPDATE_PROFILE: '/api/accounts/me/profile',
    NFC_SESSIONS: '/api/nfc/sessions', // KycController: /api/nfc/sessions
    NFC_SESSION_BY_ID: (sessionId: string) => `/api/nfc/sessions/${sessionId}`,
    NFC_SESSION_CARD: (sessionId: string) => `/api/nfc/sessions/${sessionId}/card`,
    NFC_VERIFY_STATUS: '/api/nfc/status',
    // AddressController: @RequestMapping("/api/addresses") — FR-03, sổ địa chỉ nhận hàng.
    // Tài liệu api-db/identity.md vẽ "/api/accounts/me/addresses" (giai đoạn 3 của
    // api-db-alignment-plan.md), nhưng code đang chạy dùng "/api/addresses"; theo quy tắc
    // "file trong repo là bản đúng" (docs/architecture/api-db/README.md) ta theo code.
    ADDRESSES: '/api/addresses',
    ADDRESS_BY_ID: (addressId: string) => `/api/addresses/${addressId}`,
    // AuthController: @PostMapping("/verify-account")
    VERIFY_ACCOUNT: '/api/auth/verify-account',
    // AuthController: @PostMapping("/send-verify-account-otp")
    SEND_VERIFY_ACCOUNT_OTP: '/api/auth/send-verify-account-otp',
    // AuthController: @PostMapping("/reset-password")
    RESET_PASSWORD: '/api/auth/reset-password',
    // AuthController: @PostMapping("/send-reset-password-otp")
    SEND_RESET_PASSWORD_OTP: '/api/auth/send-reset-password-otp',
  },

  // 2. Vendor Management Service (VendorController, SupplierController)
  VENDOR: {
    BASE: '/api/vendors', // VendorController: @GetMapping("/api/vendors")
    BY_ID: (id: string) => `/api/vendors/${id}`,
    // VendorController: @GetMapping("/api/vendors/{vendorId}/summary") — tóm tắt công khai
    // của một tiệm bánh (B-3.2): mở cho khách, chỉ có id, tên, tỉnh và các cờ bán hàng.
    SUMMARY: (id: string) => `/api/vendors/${id}/summary`,
    REGISTER: '/api/vendors', // VendorController: @PostMapping("/api/vendors")
    SUPPLIERS: '/api/suppliers', // SupplierController
    SUPPLIER_BY_ID: (id: string) => `/api/suppliers/${id}`,
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
    PRODUCTS: '/api/products', // ProductController: /api/products
    PRODUCT_BY_ID: (id: string) => `/api/products/${id}`,
    // ProductReadController: @GetMapping("/{productId}/reviews") — đánh giá của sản phẩm (AC-11.3).
    PRODUCT_REVIEWS: (id: string) => `/api/products/${id}/reviews`,
    CAKE_ATTRIBUTES: '/api/cake-attributes', // Danh mục Vỏ & Nhân FR-54
    // BE nhận nhóm bằng query `?group=CRUST|FILLING`, không có path con riêng.
  },

  // 4. Quotation Service - B2B Số lượng lớn (QuoteRequestController)
  QUOTATION: {
    // D-30 routes by aggregate root, so a service has no base path any more: the base of this group is the root
    // of the aggregate it is about (QuoteRequestController: @RequestMapping("/api/quote-requests")).
    BASE: '/api/quote-requests',
    REQUESTS: '/api/quote-requests',
    REQUEST_BY_ID: (id: string) => `/api/quote-requests/${id}`,
    SUBMIT_QUOTE: (requestId: string) => `/api/quote-requests/${requestId}/quotes`,
    REQUEST_QUOTES: (requestId: string) => `/api/quote-requests/${requestId}/quotes`,
    // QuoteRequestController: @GetMapping("/{requestId}/invitations")
    REQUEST_INVITATIONS: (requestId: string) => `/api/quote-requests/${requestId}/invitations`,
    // QuoteRequestController: @PostMapping("/{requestId}/quotes/{quoteId}/acceptance")
    ACCEPT_QUOTE: (requestId: string, quoteId: string) =>
      `/api/quote-requests/${requestId}/quotes/${quoteId}/acceptance`,
    GET_ACCEPTANCE: (requestId: string, quoteId: string) =>
      `/api/quote-requests/${requestId}/quotes/${quoteId}/acceptance`,
    // QuoteRequestController: @GetMapping("/{requestId}/quotes/{quoteId}")
    QUOTE_BY_ID: (requestId: string, quoteId: string) =>
      `/api/quote-requests/${requestId}/quotes/${quoteId}`,
    // QuoteRequestController: @PatchMapping("/{requestId}/quotes/{quoteId}") — chỉ WITHDRAWN (BR-05).
    UPDATE_QUOTE: (requestId: string, quoteId: string) =>
      `/api/quote-requests/${requestId}/quotes/${quoteId}`,
    // QuoteRequestController: @PatchMapping("/{requestId}/invitations/{vendorId}") — chỉ DECLINED (AC-36.3).
    UPDATE_INVITATION: (requestId: string, vendorId: string) =>
      `/api/quote-requests/${requestId}/invitations/${vendorId}`,
  },

  // 5. Order & Cart Service (CartController, CheckoutController, OrderDocumentController, DisputeController)
  ORDER: {
    CART: '/api/carts/me',
    CART_ITEMS: '/api/carts/me/items',
    // CartController: @DeleteMapping("/items/{itemId}") — 204, nothing to unwrap.
    CART_ITEM: (itemId: string) => `/api/carts/me/items/${itemId}`,
    CHECKOUT: '/api/checkouts',
    // CheckoutController: @GetMapping("/{checkoutId}") — trạng thái checkout + orderIds đã tạo (FR-09).
    CHECKOUT_BY_ID: (checkoutId: string) => `/api/checkouts/${checkoutId}`,
    ORDERS: '/api/orders',
    ORDER_BY_ID: (id: string) => `/api/orders/${id}`,
    // OrderController: @PatchMapping("/{orderId}") — vendor chuyển bước (FR-32, FR-40),
    // buyer xác nhận đã nhận (FR-11).
    ORDER_UPDATE: (id: string) => `/api/orders/${id}`,
    // FR-21: lịch sử tiến độ của đơn
    PROGRESS_UPDATES: (id: string) => `/api/orders/${id}/progress-updates`,
    // FR-22: thanh toán phần còn lại của đơn custom
    PAY_REMAINDER: (id: string) => `/api/orders/${id}/payments`,
    // Mockups / Maket (OrderDocumentController: @RequestMapping("/api/orders"))
    MAKET_MOCKUPS: (orderId: string) => `/api/orders/${orderId}/mockups`,
    MAKET_PATCH: (orderId: string, versionNo: number | string) =>
      `/api/orders/${orderId}/mockups/${versionNo}`,
    // OrderDocumentController: @PostMapping("/uploads")
    UPLOADS: '/api/orders/uploads',
    // OrderDocumentController: @GetMapping("/{orderId}/invoice")
    INVOICE: (orderId: string) => `/api/orders/${orderId}/invoice`,
    // Khiếu nại (số ít theo DisputeController: @RequestMapping("/api/orders/{orderId}/dispute"))
    /** FR-49, Q5.0: the admin's disputes across orders (`?status=OPEN|RESOLVED`). */
    DISPUTES: '/api/orders/disputes',
    DISPUTE: (orderId: string) => `/api/orders/${orderId}/dispute`,
    DISPUTE_EVIDENCES: (orderId: string) => `/api/orders/${orderId}/dispute/evidences`,
    // Đánh giá sản phẩm (ReviewController: @RequestMapping("/api/orders/{orderId}/reviews"))
    REVIEWS: (orderId: string) => `/api/orders/${orderId}/reviews`,
    // Nhắn tin khách ↔ shop, mỗi cặp một cuộc trò chuyện (ChatController: @RequestMapping("/api/chat/conversations")).
    // Tin mới, đã xem và đang soạn được đẩy qua STOMP /user/queue/chat.
    CHAT_CONVERSATIONS: '/api/chat/conversations',
    CHAT_CONVERSATION: (id: string) => `/api/chat/conversations/${id}`,
    CHAT_MESSAGES: (id: string) => `/api/chat/conversations/${id}/messages`,
    CHAT_READ: (id: string) => `/api/chat/conversations/${id}/read`,
    CHAT_TYPING: (id: string) => `/api/chat/conversations/${id}/typing`,
  },

  // 6. Payment & Escrow Service (LedgerController, PaymentController)
  PAYMENT: {
    // D-30 routes by aggregate root, so a service has no base path any more: the base of this group is the root
    // of the aggregate it is about (PaymentController: @RequestMapping("/api/payments")).
    BASE: '/api/payments',
    VNPAY_IPN: '/api/payments/vnpay/ipn',
    VNPAY_RETURN: '/api/payments/vnpay/return',
    // PaymentController: @GetMapping, @GetMapping("/{paymentId}") — trạng thái giao dịch để poll (FR-09).
    PAYMENTS: '/api/payments',
    PAYMENT_BY_ID: (paymentId: string) => `/api/payments/${paymentId}`,
    LEDGERS: '/api/ledgers',
    DISBURSEMENTS: '/api/ledgers/disbursements',
    LEDGER_BY_ORDER: (orderId: string) => `/api/ledgers/${orderId}`,
    // LedgerController: @GetMapping("/{orderId}/entries")
    LEDGER_ENTRIES: (orderId: string) => `/api/ledgers/${orderId}/entries`,
    // LedgerController: @GetMapping("/{orderId}/refunds")
    LEDGER_REFUNDS: (orderId: string) => `/api/ledgers/${orderId}/refunds`,
    // LedgerController: @GetMapping("/{orderId}/disbursements")
    LEDGER_DISBURSEMENTS: (orderId: string) => `/api/ledgers/${orderId}/disbursements`,
    // LedgerController: @PostMapping("/{orderId}/disbursements")
    LEDGER_DISBURSEMENT_CREATE: (orderId: string) => `/api/ledgers/${orderId}/disbursements`,
    // LedgerController: @PatchMapping("/{orderId}/disbursements/{requestId}")
    LEDGER_DISBURSEMENT_REVIEW: (orderId: string, requestId: string) =>
      `/api/ledgers/${orderId}/disbursements/${requestId}`,
    // LedgerController: @PutMapping("/{orderId}/payout")
    LEDGER_PAYOUT: (orderId: string) => `/api/ledgers/${orderId}/payout`,
    APPROVE_PAYOUT: (orderId: string) => `/api/ledgers/${orderId}/payout`,
    // RefundController: @RequestMapping("/api/refunds") — các khoản hoàn cần xử lý tay (AC-49.3).
    REFUNDS: '/api/refunds',
    REFUND_BY_ID: (refundId: string) => `/api/refunds/${refundId}`,
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
    NOTIFICATION_MARK_READ: (notificationId: string) => `/api/notifications/${notificationId}/read`,
    NOTIFICATIONS_MARK_ALL_READ: '/api/notifications/read-all',
    // orchestrator-service chưa có REST cho nhật ký kiểm toán, nên đường dẫn này
    // chưa có route nào phục vụ (D-30: chỉ khai báo route cho endpoint đang chạy).
    AUDIT_LOGS: '/api/audit-logs',
  },
} as const;

/**
 * Các endpoint dự kiến nhưng BE hiện tại chưa công khai REST hoặc đang xử lý qua luồng nội bộ
 */
export const NOT_IMPLEMENTED_YET = {
  AUDIT_LOGS: '/api/audit-logs', // orchestrator chưa có REST cho audit log
  VNPAY_CREATE_PUBLIC: '/api/payments', // BE-08b: cần endpoint public thay vì /internal/payments
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
