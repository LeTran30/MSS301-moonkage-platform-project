# 01 — Business Flow Inventory

## 1. Phạm vi và phương pháp

- Ngày audit: **2026-11-13**.
- Phương pháp: phân tích tĩnh route/component, API client, controller, service, entity/repository, migration, event producer/consumer và test hiện có. Không chạy hệ thống, không khẳng định đã tái hiện runtime.
- Nguồn yêu cầu chính: `docs/product/requirements.md` v1.8; source code hiện tại được dùng để xác minh implementation.
- Stack quan sát được: React/Vite ở `web/`; Spring Boot microservices ở `api/`; PostgreSQL/Flyway, RabbitMQ/outbox, MinIO, VNPay sandbox.
- Đã kiểm kê **47 luồng nghiệp vụ** và truy vết **126 endpoint handler** có annotation `@GetMapping`, `@PostMapping`, `@PutMapping`, `@PatchMapping`, `@DeleteMapping`, gồm public API và internal API.

## 2. Bản đồ hệ thống

| Miền | Frontend chính | Backend sở hữu dữ liệu | Tích hợp chính |
|---|---|---|---|
| Account/NFC | `web/src/pages/auth`, `pages/account` | `identity-service` | Email qua orchestrator, NFC event |
| Catalog | `pages/base/catalog`, `product-detail` | `vendor-service` write model; `catalog-service` read model | `product.*` projection event |
| Cart/Checkout/Order | `pages/base/cart`, `checkout`, `pages/account/orders` | `order-service` | catalog snapshot, vendor stock, payment |
| Quotation | `pages/base/*quote*`, `pages/vendor/requests` | `quotation-service` | vendor, identity NFC, payment, order event |
| Money | payment result, vendor/admin money pages | `payment-service` | VNPay, order payout lock, RabbitMQ |
| Vendor | `pages/vendor`, `pages/admin/vendors` | `vendor-service` | catalog projection, payment registration fee |
| Chat/Notification | message pages, notification page/header | `order-service` chat; `orchestrator-service` inbox | STOMP/WebSocket, RabbitMQ |

API Gateway là entry point công khai, xác thực JWT, loại header giả mạo rồi chuyển `X-Account-Id` và `X-User-Role` xuống service. Các đường `/internal/**` bị chặn ở gateway và được OpenFeign gọi trực tiếp giữa service.

## 3. Inventory FE → API → BE

### A. Account & Authentication — 7 luồng

| ID | Luồng | FE bắt đầu | API chính | BE/controller → service | Kết quả/state |
|---|---|---|---|---|---|
| A-01 | Đăng ký | `RegisterPage` | `POST /api/auth/register` | `AuthController` → `AuthServiceImpl` | Tạo account chưa xác minh, phát OTP email |
| A-02 | Xác minh tài khoản/gửi lại OTP | `RegisterConfirmPage` | `POST /api/auth/verify-account`, `/send-verify-account-otp` | `AuthController` → `AuthServiceImpl` | Account được kích hoạt hoặc báo OTP sai/hết hạn |
| A-03 | Đăng nhập/refresh | `LoginPage`, interceptor API | `POST /api/auth/login`, `/refresh-token` | `AuthController` → `AuthServiceImpl` | Cấp access/refresh token, tải `/api/accounts/me` |
| A-04 | Quên/đặt lại mật khẩu | `ForgotPasswordPage`, `ResetPasswordPage` | `POST /api/auth/send-reset-password-otp`, `/reset-password` | `AuthController` → `AuthServiceImpl` | Đổi mật khẩu, cập nhật mốc vô hiệu token ở identity |
| A-05 | Hồ sơ và địa chỉ | `ProfilePage`, `AddressesPage`, `AddressFormPage` | `GET/PATCH /api/accounts/me`; CRUD `/api/addresses` | `AccountController`, `AddressController` | Cập nhật hồ sơ/sổ địa chỉ có ownership check |
| A-06 | Xác minh NFC | `NfcVerifyPage` và app NFC | `POST/GET /api/nfc/sessions`, `POST .../card`, `GET /api/nfc/status` | `KycController` → KYC service | Session one-time; verified/failed/locked event |
| A-07 | Đăng xuất và route guard | Header/guard | Không có logout API | `sessionApi.logout`, `RequireAuth/Admin/Shop` | Xóa token phía tab; BE vẫn dựa vào token còn hiệu lực |

### B. Product Catalog — 5 luồng

| ID | Luồng | FE bắt đầu | API chính | BE/controller → service | Kết quả/state |
|---|---|---|---|---|---|
| B-01 | Tìm kiếm/lọc sản phẩm | `CatalogPage` | `GET /api/products`, `/facets` | `ProductReadController` → catalog query | Chỉ listing `ON_SALE`, vendor hoạt động, có Shop, giao được tỉnh |
| B-02 | Xem chi tiết/review | `ProductDetailPage` | `GET /api/products/{id}`, `.../reviews` | `ProductReadController` | Trả projection sản phẩm và đánh giá |
| B-03 | Đồng bộ catalog | Không có UI trực tiếp | Event `product.upserted/removed`, `vendor.*` | catalog projection adapters/repository | Read model version-guarded, eventual consistency |
| B-04 | Phí giao liên tỉnh | Catalog/checkout/admin config | `GET/PUT /api/interprovince-fees` | `InterprovinceFeeController` | Public read; admin write |
| B-05 | Snapshot tại cart/checkout | Cart/checkout | `POST /internal/products/snapshot` | `InternalProductController` | Giá/trạng thái/vendor delivery snapshot authoritative |

### C. Shopping Cart — 4 luồng

| ID | Luồng | FE bắt đầu | API chính | BE/controller → service | Kết quả/state |
|---|---|---|---|---|---|
| C-01 | Thêm vào giỏ | CTA product | `POST /api/carts/me/items` | `CartController` → `CartServiceImpl` | Chặn self-dealing, sản phẩm không mua được; upsert line |
| C-02 | Xem giỏ nhiều Shop | `CartPage` | `GET /api/carts/me?provinceCode=` | `CartController` → `CartServiceImpl` | Nhóm theo vendor, refresh giá/availability/delivery fee |
| C-03 | Đổi số lượng | `CartPage.changeQuantity` | `PATCH /api/carts/me/items/{itemId}` | `CartController` → cart service | Cập nhật quantity dương; quantity 0 bị validation từ chối |
| C-04 | Xóa line | `CartPage` | `DELETE /api/carts/me/items/{itemId}` | `CartController` → cart service | Xóa line thuộc account |

### D. Checkout — 3 luồng

| ID | Luồng | FE bắt đầu | API chính | BE/controller → service | Kết quả/state |
|---|---|---|---|---|---|
| D-01 | Nhập giao hàng/hóa đơn | `CheckoutPage` | dữ liệu gửi cùng `POST /api/checkouts` | Bean Validation ở `CreateCheckoutRequest` | Validate người nhận, phone, province, invoice |
| D-02 | Tạo checkout/giữ kho | `CheckoutPage.handleProceedToPayment` | `POST /api/checkouts` | `CheckoutController` → `CheckoutServiceImpl.create` | Refresh snapshot, reserve stock, snapshot tiền, tạo VNPay URL |
| D-03 | Đọc lại checkout | `PaymentResultPage` | `GET /api/checkouts/{checkoutId}` | `CheckoutServiceImpl.get` | Ownership check; trả trạng thái checkout/order creation |

### E. Payment & Ledger — 5 luồng

| ID | Luồng | FE bắt đầu | API/event | BE xử lý | Kết quả/state |
|---|---|---|---|---|---|
| E-01 | Tạo payment | checkout/deposit/remainder/fee | `POST /internal/payments` | `PaymentServiceImpl.create` | Idempotent theo key do caller cung cấp; payment `PENDING` |
| E-02 | VNPay IPN/return | VNPay/`PaymentResultPage` | `GET /api/payments/vnpay/ipn`, `/return` | `PaymentServiceImpl` | Verify signature+amount; IPN quyết định; return mặc định read-only |
| E-03 | Timeout/failure/late success | Scheduler + callback | `payment.failed/succeeded` | payment + owner service | Timeout phát failed; late/duplicate success được refund theo owner |
| E-04 | Ledger/đối soát | vendor/admin money pages | `GET /api/ledgers/**` | `LedgerController` → reconciliation service | held/disbursed/refunded/paidOut, entries và reconciliation |
| E-05 | Refund/manual refund | admin dispute | `GET/PATCH /api/refunds/**`, `POST /internal/refunds` | `RefundServiceImpl` | `PENDING → SUCCEEDED` hoặc `MANUAL_REQUIRED`; cập nhật ledger sau success |

### F. Order Management — 7 luồng

| ID | Luồng | FE bắt đầu | API/event | BE xử lý | Kết quả/state |
|---|---|---|---|---|---|
| F-01 | Tạo đơn mua ngay sau IPN | Không có call FE trực tiếp | `payment.succeeded` | `CheckoutServiceImpl.onPaid` | Commit stock, một Shop một order, inbox/outbox idempotency |
| F-02 | Danh sách/thống kê/chi tiết | buyer/vendor pages | `GET /api/orders`, `/stats`, `/{id}` | `OrderController` → `OrderServiceImpl` | Scope theo buyer/vendor/admin |
| F-03 | Vendor cập nhật trạng thái | `VendorOrderDetailPage` | `PATCH /api/orders/{id}` | `OrderServiceImpl.updateStatus` | Chỉ owner vendor; next-state; tracking với liên tỉnh |
| F-04 | Buyer xác nhận nhận hàng | `OrderDetailPage` | `PATCH /api/orders/{id}` | order service | Buyer owner; mở complaint deadline/payout eligibility |
| F-05 | Mẫu thiết kế (maket) | order detail | CRUD `/api/orders/{id}/mockups` | `OrderDocumentController` | Versioned upload; buyer approve/reject; custom state guard |
| F-06 | Invoice/progress | order detail | `/progress-updates`, `GET/PUT .../invoice` | order/document services | Timeline và invoice snapshot/file |
| F-07 | Thanh toán phần còn lại | buyer order detail | `POST /api/orders/{id}/payments` | `OrderServiceImpl.payRemainder` | Chỉ custom order ở `DELIVERED`; payment success → `COMPLETED` |

### G. Custom Order & Quotation — 6 luồng

| ID | Luồng | FE bắt đầu | API/event | BE xử lý | Kết quả/state |
|---|---|---|---|---|---|
| G-01 | Danh sách/hồ sơ supplier | `VendorsListPage`, `VendorDetailPage` | `GET /api/suppliers/**`, vendor summary | `SupplierController` | Public supplier discovery |
| G-02 | Yêu cầu trực tiếp | `DirectQuoteRequestPage` | `POST /api/quote-requests` | `QuoteRequestServiceImpl.create` | NFC, self-dealing, vendor active, min quantity, custom support |
| G-03 | Yêu cầu mở/mời vendor | `NewQuoteRequestPage` | `POST/GET /api/quote-requests`, invitation endpoints | quote request service | Match theo năng lực/area; invite/decline |
| G-04 | Gửi/sửa/thu hồi báo giá | vendor request detail | quote collection/detail/`PATCH` | `QuoteServiceImpl` | Một live quote/vendor; revision; validity 1–14 ngày; expiry sweep |
| G-05 | So sánh/chấp nhận/đặt cọc | `RequestComparePage`, `DepositPaymentPage` | acceptance GET/POST | `QuoteAcceptanceServiceImpl` | Recheck quote/vendor/NFC/self-dealing; payment cọc |
| G-06 | Tạo custom order | Event quote accepted/paid | `quote.accepted` → order | order event listener/service | Idempotent theo acceptance; snapshot agreement/money |

### H. Vendor Management — 4 luồng

| ID | Luồng | FE bắt đầu | API/event | BE xử lý | Kết quả/state |
|---|---|---|---|---|---|
| H-01 | Đăng ký/duyệt/khóa vendor | sell/admin vendor pages | `/api/vendors/**` | `VendorController` → `VendorServiceImpl` | NFC, hồ sơ, admin review/lock, ownership |
| H-02 | Phí mở bán/cấu hình | vendor/admin fee pages | vendor fee payment; `/api/registration-fee-config` | vendor + payment | Approved + paid mới `canOperate` |
| H-03 | Quản lý sản phẩm/năng lực/vùng giao | vendor settings/product pages | vendor product CRUD, delivery areas, order profile, cake attributes | vendor services | Owner-only; publish projection events |
| H-04 | Reserve/commit/release stock | Checkout nội bộ | `/internal/stock/reservations/**` | `StockServiceImpl` | Pessimistic lock theo thứ tự product; held/committed/released idempotent |

### I. Review & Dispute — 3 luồng

| ID | Luồng | FE bắt đầu | API/event | BE xử lý | Kết quả/state |
|---|---|---|---|---|---|
| I-01 | Đánh giá | buyer order detail | `GET/POST /api/reviews` | `ReviewServiceImpl` | BUY_NOW, delivered/completed, đúng product, unique order+product |
| I-02 | Mở khiếu nại/thêm bằng chứng | `OrderDisputePage`, vendor panel | dispute POST/evidence | `DisputeServiceImpl` | Buyer mở trong deadline; buyer/vendor thêm evidence khi `OPEN` |
| I-03 | Phân xử/khóa payout/refund | admin disputes | dispute queue/`PATCH`; payment refund | order + payment services | Lock cùng order row; resolve; refund async/manual; payout bị chặn khi open |

### J. Chat & Notification — 3 luồng

| ID | Luồng | FE bắt đầu | API/event | BE xử lý | Kết quả/state |
|---|---|---|---|---|---|
| J-01 | Conversation/thread/message | buyer/vendor messages | CRUD `/api/conversations/**` | `ChatServiceImpl` | Chỉ buyer hoặc current vendor owner; attachment temp key |
| J-02 | Read/typing/realtime | message pages | read/typing API; `chat.*` | order outbox → orchestrator `ChatConsumer` → STOMP | Fast-path push, persisted read state |
| J-03 | Notification inbox | header/`NotificationsPage` | `GET /api/notifications`, read/read-all | `NotificationService`, `InAppEventHandler` | Inbox/read API tồn tại; nguồn domain notification chưa nối đầy đủ |

## 4. Coverage endpoint theo service

| Service | Nhóm endpoint được truy vết |
|---|---|
| `identity-service` | auth, account, address, NFC, internal account/NFC lookup |
| `catalog-service` | product listing/facets/detail/reviews, interprovince fees, internal snapshot |
| `vendor-service` | vendor, documents, review, delivery areas, order profile, registration fee, product, cake attributes, internal stock |
| `quotation-service` | suppliers, quote requests, invitations, quotes, acceptance |
| `order-service` | cart, checkout, order, documents/mockups/invoice, review, dispute, dispute queue, chat, internal payout lock |
| `payment-service` | payments/IPN/return, ledger, disbursement, payout, refunds, internal payment/refund |
| `orchestrator-service` | notification inbox/read/read-all; WebSocket consumers không được tính là HTTP endpoint |

## 5. State machine chính quan sát được

- Checkout: `PENDING_PAYMENT → PAID | FAILED | EXPIRED`; order chỉ sinh sau `payment.succeeded` và stock commit.
- Payment: `PENDING → SUCCEEDED | FAILED | EXPIRED`; callback đã xử lý có guard chống lặp.
- Quote: draft/submitted có revision, `SUBMITTED → EXPIRED | CLOSED | ACCEPTED` theo nghiệp vụ acceptance.
- Acceptance: `PENDING_PAYMENT → PAID | FAILED | EXPIRED`; chỉ một quote thắng request.
- Order mua ngay: `PAID → CONFIRMED → SHIPPING → DELIVERED → COMPLETED` theo guard thực tế.
- Order custom: `DEPOSITED → AWAITING_MOCKUP_APPROVAL → IN_PRODUCTION → READY_TO_SHIP → DELIVERED → COMPLETED`.
- Dispute: `OPEN → RESOLVED`; refund có state riêng `PENDING → SUCCEEDED | MANUAL_REQUIRED`.
- Stock reservation: `HELD → COMMITTED | RELEASED`.

## 6. Giới hạn bằng chứng

- Không có runtime trace, log production, dữ liệu DB thực, cấu hình VNPay triển khai hoặc kiểm thử tải/concurrency thực tế.
- Các scheduler được xác minh qua source nhưng không xác minh chúng đang được enable trong môi trường triển khai.
- App mobile NFC không nằm đầy đủ trong repository web nên chỉ truy vết contract/server-side.
- Không suy diễn mùa vụ/preorder là bug: requirements v1.4 ghi rõ không mô hình hóa mùa vụ.

