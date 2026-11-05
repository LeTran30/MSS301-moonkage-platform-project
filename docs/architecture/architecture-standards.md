# Chuẩn kiến trúc Moonkage

> **Trạng thái:** Chuẩn hiệu hành (2026-11-05). Áp dụng cho toàn bộ mã nguồn trong `api/` và `web/`.
> **Phạm vi:** bắt buộc cho mọi thay đổi mới. Mã cũ không tự động hợp lệ — xem [đối chiếu tuân thủ](codebase-conformance-review.md).
> **Nguồn:** mọi quy tắc dưới đây đều bám theo code đang chạy, không lấy từ tài liệu lý thuyết. Khi tài liệu và code lệch nhau, **code là bản đúng** cho tới khi có quyết định kiến trúc mới ([`api-db/decisions.md`](api-db/decisions.md)).

## Mục lục

1. [Cách đọc tài liệu này](#1-cách-đọc-tài-liệu-này)
2. [Cấu trúc thư mục và quy tắc đặt tên](#2-cấu-trúc-thư-mục-và-quy-tắc-đặt-tên)
3. [Quy tắc API](#3-quy-tắc-api)
4. [Quy tắc dữ liệu](#4-quy-tắc-dữ-liệu)
5. [Quy tắc bảo mật](#5-quy-tắc-bảo-mật)
6. [Quy tắc frontend](#6-quy-tắc-frontend)
7. [Quy tắc kiểm thử và CI](#7-quy-tắc-kiểm-thử-và-ci)
8. [Quy tắc tài liệu](#8-quy-tắc-tài-liệu)
9. [Bảng tra nhanh: đặt tên sai → đúng](#9-bảng-tra-nhanh-đặt-tên-sai--đúng)
10. [Ngoại lệ đã biết](#10-ngoại-lệ-đã-biết)

---

## 1. Cách đọc tài liệu này

Mỗi quy tắc có ba phần:

| Phần | Ý nghĩa |
|---|---|
| **Mức độ bắt buộc** | `BẮT BUỘC` — vi phạm thì PR không được merge. `KHUYẾN NGHỊ` — mặc định theo, lệch thì phải ghi lý do trong PR. |
| **Lý do** | Một câu: vì sao quy tắc này tồn tại trong codebase này. |
| **Ví dụ đúng / sai** | Trích từ mã nguồn thật của repo, kèm đường dẫn. |

Quy tắc có hiệu lực ngay với code mới. Với code cũ, xem [đối chiếu tuân thủ](codebase-conformance-review.md) để biết mục nào đang nợ và xử lý theo thứ tự ưu tiên đã nêu.

---

## 2. Cấu trúc thư mục và quy tắc đặt tên

### 2.1. Backend: module Maven

**Mức độ bắt buộc: BẮT BUỘC**

**Lý do:** Mỗi service là một database riêng và một tiến trình riêng; gom chung là mất ranh giới dữ liệu.

Repo có 14 module Maven trong `api/` (đếm bằng `api/*/pom.xml`):

| Module | Vai trò |
|---|---|
| `api-gateway` | Cổng vào duy nhất: xác thực, rate limit, chặn `/internal/**`, định tuyến |
| `discovery-server` | Eureka |
| `identity-service`, `catalog-service`, `vendor-service`, `quotation-service`, `order-service`, `payment-service`, `orchestrator-service` | 7 service nghiệp vụ |
| `common-reference`, `common-storage`, `common-observability` | Thư viện dùng chung |
| `common-api`, `common-outbox` | Thư viện hợp đồng API và hạ tầng outbox — đã khai báo trong `api/pom.xml` nhưng **chưa service nào dùng** và **chưa commit**, xem [đối chiếu tuân thủ](codebase-conformance-review.md) |
| `config` | Không phải module: thư mục tài nguyên dùng chung cho build (`config/checkstyle/`, `config/archunit/`) |

**Ví dụ sai:** đặt thêm một entity của `order-service` vào `common-storage` để "dùng chung cho nhanh" — vi phạm ranh giới database (mỗi service một DB).

### 2.2. Backend: package gốc

**Mức độ bắt buộc: BẮT BUỘC**

**Lý do:** Package gốc phản ánh service sở hữu schema; ArchUnit và Spring đều dựa vào nó.

Package gốc là `com.moonkage.<tên-đơn-giản>`, **không** kèm hậu tố `-service`:

| Module | Package gốc | Thực tế trong repo |
|---|---|---|
| `identity-service` | `com.moonkage.identity` | `api/identity-service/src/main/java/com/moonkage/identity/` |
| `catalog-service` | `com.moonkage.catalog` | `api/catalog-service/src/main/java/com/moonkage/catalog/` |
| `vendor-service` | `com.moonkage.vendor` | `api/vendor-service/src/main/java/com/moonkage/vendor/` |
| `quotation-service` | `com.moonkage.quotation` | `api/quotation-service/src/main/java/com/moonkage/quotation/` |
| `order-service` | `com.moonkage.order` | `api/order-service/src/main/java/com/moonkage/order/` |
| `payment-service` | `com.moonkage.payment` | `api/payment-service/src/main/java/com/moonkage/payment/` |
| `orchestrator-service` | `com.moonkage.orchestrator` | `api/orchestrator-service/src/main/java/com/moonkage/orchestrator/` |
| `api-gateway` | `com.moonkage.gateway` | `api/api-gateway/src/main/java/com/moonkage/gateway/` |
| `discovery-server` | `com.moonkage.discovery` | `api/discovery-server/src/main/java/com/moonkage/discovery/` |
| `common-reference` | `com.moonkage.reference` | `api/common-reference/src/main/java/com/moonkage/reference/` |
| `common-storage` | `com.moonkage.storage` | `api/common-storage/src/main/java/com/moonkage/storage/` |
| `common-observability` | `com.moonkage.observability` | `api/common-observability/src/main/java/com/moonkage/observability/` |

**Ví dụ sai:** `package com.moonkage.order.service;` ✔ · `package com.moonkage.orderservice;` ✘

### 2.3. Backend: hai kiểu tổ chức package

**Mức độ bắt buộc: BẮT BUỘC (phải chọn một trong hai, không trộn)**

**Lý do:** Repo đang chuyển dần theo [coding-rules.md §1](../conventions/coding-rules.md); trộn hai kiểu trong cùng service làm người mới không tìm được class.

| Kiểu | Đặc trưng | Service đang dùng |
|---|---|---|
| **Package-by-component** | Nhóm theo nghiệp vụ: `account/`, `address/`, `auth/`, `kyc/`; DTO nằm trong `<component>/dto/` | `identity-service`, `vendor-service` |
| **Package-by-layer** | Nhóm theo tầng: `controller/`, `service/`, `repository/`, `entity/`, `dto/` | `catalog-service`, `quotation-service`, `order-service`, `payment-service` |

Quy tắc áp dụng cho cả hai:

- Một service dùng **một** kiểu cho code mới. Không tạo `controller/` mới trong `identity-service`.
- `orchestrator-service` dùng kiểu **hexagonal** (`application/`, `domain/`, `infrastructure/`, `contract/`, `web/`) — đây là ngoại lệ có chủ đích, xem [§10](#10-ngoại-lệ-đã-biết).

**Ví dụ sai (trộn kiểu trong `identity-service`):**

```java
// ✘ identity-service không có package controller/ theo package-by-component
package com.moonkage.identity.controller;

@RestController
public class CartController { }
```

**Ví dụ đúng:**

```java
// ✔ identity-service: controller đặt trong component
package com.moonkage.identity.web;   // identity dùng `web/` làm tầng controller
```

### 2.4. Backend: các tầng bắt buộc

**Mức độ bắt buộc: BẮT BUỘC**

**Lý do:** Bộ luật ArchUnit dùng chung (`api/config/archunit/com/moonkage/architecture/ArchitectureTest.java`) kiểm tra các luật này ở mọi module; vi phạm làm build fail.

```text
controller ──▶ service ──▶ repository
     │            │
     └──▶ dto    ├──▶ mapper ──▶ dto, entity
                  └──▶ entity
```

| Luật | Kiểm tra bằng |
|---|---|
| Controller không gọi repository | `CONTROLLERS_DO_NOT_USE_REPOSITORIES` |
| Controller không chạm entity JPA | `CONTROLLERS_DO_NOT_USE_ENTITIES` |
| DTO không phụ thuộc entity | `DTOS_DO_NOT_USE_ENTITIES` |
| Repository không gọi lên tầng trên | `REPOSITORIES_DO_NOT_USE_UPPER_LAYERS` |
| Service không gọi controller | `SERVICES_DO_NOT_USE_CONTROLLERS` |
| Không có vòng phụ thuộc giữa package | `NO_PACKAGE_CYCLES` |

**Ranh giới lỗi.** Mỗi service có **đúng một** `@RestControllerAdvice` xử lý lỗi toàn cục, đặt trong tầng controller (`controller/exception/` cho kiểu package-by-layer, `<component>/exception/` cho kiểu package-by-component). Mọi lỗi ra ngoài service đều phải đi qua advice đó để envelope phản hồi là một hình dạng duy nhất — không service nào được tự dựng lỗi bằng `ResponseEntity` rời rạc trong controller.

| Loại lỗi | Nơi xử lý |
|---|---|
| Lỗi nghiệp vụ đã định danh mã | `AppException` (tên thực tế trong repo: `AppException` ở identity/vendor/quotation/payment/order, `CatalogException` ở catalog) + `ErrorCode` của service, advice ánh xạ sang mã HTTP |
| Lỗi validate bean (`@Valid`) | Advice: `MethodArgumentNotValidException` → `errors[]` theo field |
| Lỗi JSON không đọc được | Advice: `HttpMessageNotReadableException` |
| Lỗi thiếu header bắt buộc | Advice: `MissingRequestHeaderException` |
| Lỗi không lường trước | Advice: fallback `Exception` → `500` + mã `COMMON_500`, không lộ stack trace ra ngoài |

**Ví dụ sai:**

```java
// ✘ Controller chạm entity: vi phạm CONTROLLERS_DO_NOT_USE_ENTITIES
@GetMapping("/{orderId}")
public Order get(@PathVariable String orderId) {
    return orderRepository.findById(orderId).orElseThrow();  // ✘ cả repository lẫn entity
}
```

**Ví dụ đúng:**

```java
// ✔ Controller chỉ nhận DTO
@GetMapping("/{orderId}")
public ApiResponse<OrderResponse> get(@PathVariable String orderId) {
    return ApiResponse.ok(orderService.getDetail(orderId));
}
```

**Ví dụ đúng (tách entity → DTO):**

```java
// ✔ mapper là nơi duy nhất chuyển entity → DTO
@Mapper(componentModel = "spring")
public interface OrderMapper {
    OrderResponse toResponse(Order order);
}
```

### 2.5. Backend: đặt tên class, method, biến

**Mức độ bắt buộc: BẮT BUỘC**

**Lý do:** Checkstyle (`api/config/checkstyle/checkstyle.xml`) chạy ở pha `validate` của mọi build; vi phạm làm build fail.

| Loại | Quy tắc | Ví dụ đúng |
|---|---|---|
| Class | Danh từ + ngữ cảnh, `PascalCase` | `ProductSnapshotPublisher`, `CheckoutServiceImpl` |
| Interface repository | `<Từ nguyên>Repository` | `OrderRepository`, `PaymentRepository` |
| Interface service | `<Từ nguyên>Service` | `OrderService`, `PaymentService` |
| Implementation | `<Từ nguyên>ServiceImpl` | `PaymentServiceImpl` |
| Mapper | `<Từ nguyên>Mapper` | `OrderMapper` |
| Method | Động từ + ngữ cảnh | `createPayment`, `findPendingByIdempotencyKey` |
| Hằng số | `UPPER_SNAKE_CASE` | `IDEMPOTENCY_KEY`, `SUCCESS_CODE` |
| Biến/field | `camelCase` | `idempotencyKey`, `accountId` |
| Enum | `UPPER_SNAKE_CASE` giá trị | `MEMBER`, `ADMIN`, `PENDING_PAYMENT` |

Chi tiết đầy đủ: [coding-rules.md §2](../conventions/coding-rules.md).

### 2.6. Frontend: cấu trúc FSD

**Mức độ bắt buộc: BẮT BUỘC**

**Lý do:** 6 tầng FSD được lint cưỡng chế bằng `no-restricted-imports` trong `web/.oxlintrc.json`; vi phạm làm `npm run lint` fail, và CI chạy lint với `--deny-warnings`.

| Tầng | Vai trò | Có thể import |
|---|---|---|
| `app/` | Khởi động, provider, định tuyến, layout, CSS token | mọi tầng dưới |
| `pages/` | Một route = một page | `widgets`, `features`, `entities`, `shared` |
| `widgets/` | Khối ghép nhiều feature | `features`, `entities`, `shared` |
| `features/` | Một **hành động** người dùng | `entities`, `shared` |
| `entities/` | Một **khái niệm** nghiệp vụ | `shared` (+ `@x` của entity khác) |
| `shared/` | Hạ tầng trung tính nghiệp vụ | chỉ `shared` |

Ba luật cốt lõi:

1. **Chỉ import xuống.**
2. **Không import ngang** — hai slice cùng tầng không import lẫn nhau.
3. **Chỉ qua cổng `index.ts`** — từ ngoài slice, import qua `index.ts`; bên trong slice dùng đường dẫn tương đối.

Ngoại lệ duy nhất giữa hai entity: cổng `@x` chỉ export **type**.

```text
entities/product/@x/vendor.ts   → export type { Product, ProductStatus, CakeCrust, CakeFilling }
entities/vendor/@x/user.ts      → export type { ... }
```

**Ví dụ sai:**

```tsx
// ✘ feature import feature khác
import { useLogin } from '@/features/login';
// ✘ import sâu vào ruột slice
import { LoginForm } from '@/features/login/ui/LoginForm';
// ✘ entity import entity trực tiếp
import { Product } from '@/entities/product/model/types';
```

**Ví dụ đúng:**

```tsx
// ✔ feature → entity qua cổng
import { useCart } from '@/entities/cart';
// ✔ entity → entity qua cổng @x
import type { Product } from '@/entities/product/@x/vendor';
```

### 2.7. Frontend: hình dạng thư mục component

**Mức độ bắt buộc: KHUYẾN NGHỊ (bắt buộc với component trong `shared/ui`)**

**Lý do:** Script `web/scripts/check-css-modules.mjs` kiểm tra class dùng trong TSX có tồn tại trong stylesheet; đặt lệch tên file sẽ làm script không tìm thấy cặp.

```text
shared/ui/Button/
├── Button.tsx           # component
├── Button.module.css   # style đặt cạnh
└── index.ts            # public API của component
```

Với component có test:

```text
shared/ui/Input/
├── Input.tsx
├── Input.module.css
├── index.ts
└── __tests__/
    ├── Input.axe.test.tsx
    └── Input.a11y.test.tsx
```

Trong `entities/` và `features/`, test đặt trong `__tests__/` ngay cạnh file được test:

```text
entities/product/api/productApi.ts
entities/product/api/__tests__/productApi.test.ts
```

Quy ước đặc biệt của repo: nhiều component dùng chung **một** stylesheet theo nhóm thay vì mỗi component một file (ví dụ `features/checkout/ui/checkoutUi.module.css` phục vụ `ShippingAddressForm`, `InvoiceRequestForm`, `PaymentMethodPanel`). Được chấp nhận khi các component thực sự là một màn hình con.

### 2.8. Frontend: đặt tên file

| Loại | Quy tắc | Ví dụ |
|---|---|---|
| Component React | `PascalCase.tsx` | `ProductCard.tsx`, `CheckoutPage.tsx` |
| Hook | `useXxx.ts` | `useCartSync.ts`, `useQueryData.ts` |
| API module | `xxxApi.ts` | `productApi.ts`, `cartWriteApi.ts` |
| CSS module | `PascalCase.module.css` hoặc `<nhóm>Ui.module.css` | `ProductCard.module.css`, `checkoutUi.module.css` |
| Test | `*.test.ts` / `*.test.tsx` trong `__tests__/` | `productApi.test.ts` |
| Cấu hình | `camelCase.ts` | `featureFlags.ts`, `queryClient.ts` |
| Tài liệu | `kebab-case.md` | `architecture-standards.md` |

### 2.9. Tài liệu: đặt tên và vị trí

**Mức độ bắt buộc: BẮT BUỘC**

**Lý do:** CI `docs-links.yml` dùng lychee kiểm tra link hỏng trong mọi file `.md`; đường dẫn sai sẽ làm PR fail.

- Tài liệu trong `docs/` đặt tên `kebab-case.md`, không có dấu cách, **không** ghi phiên bản trong tên (lịch sử nằm trong git và bảng thay đổi của file).
- Tài liệu hạ tầng web (`web/doc/`) đang dùng tên `UPPER_SNAKE_CASE` — lệch quy ước; xem [đối chiếu tuân thủ](codebase-conformance-review.md).
- Đường dẫn tài liệu phải tương đối (`../guides/database.md`), không dùng `file:///` hay đường dẫn máy cá nhân.

---

## 3. Quy tắc API

### 3.1. Bao bọc phản hồi (envelope)

**Mức độ bắt buộc: BẮT BUỘC**

**Lý do:** Frontend gọi 65 chỗ qua `useQueryData` và mọi mapper đều đi qua `unwrap()` (`web/src/shared/api/envelope.ts`); đổi hình dạng phản hồi là hỏng toàn bộ lớp API của web.

Hình dạng chuẩn — đúng như backend đang trả:

```json
{
  "status": 200,
  "code": "SUCCESS",
  "message": "OK",
  "data": { "...": "..." },
  "errors": [{ "field": "email", "message": "..." }],
  "path": "/api/accounts/me",
  "timestamp": "2026-11-05T05:00:00Z"
}
```

| Trường | Bắt buộc? | Ý nghĩa |
|---|---|---|
| `status` | Có | HTTP status, lặp lại để client không cần đọc header |
| `code` | Có | Mã lỗi nghiệp vụ (`SUCCESS`, `AUTH_007`, `COMMON_404`) |
| `message` | Có | Thông điệp cho người dùng, tiếng Việt |
| `data` | Có (null khi lỗi) | Payload |
| `errors` | Chỉ khi lỗi validate | Danh sách lỗi theo field |
| `path` | Tùy chọn | Đường dẫn request |
| `timestamp` | Có | Thời điểm sinh phản hồi |

Lưu ý hiện trạng: `catalog-service` và `orchestrator-service` **không** có trường `errors`; 5 service còn lại có. Chuẩn là có `errors` — xem [đối chiếu tuân thủ](codebase-conformance-review.md).

**Nguồn duy nhất của envelope:** `api/common-api` đã có `ApiResponse<T>` đúng chuẩn (record 7 trường, có `errors` + `FieldError`, đủ factory `ok()/ok(T)/created/error(...)`). Mọi service phải dùng nó — **không** tự định nghĩa lại. Lưu ý hiện trạng: module đã được khai báo trong `api/pom.xml` nhưng **chưa service nào khai báo dependency**, nên 7 bản `ApiResponse` cục bộ vẫn còn (xem [đối chiếu tuân thủ](codebase-conformance-review.md), H-01 và H-10).

**Ví dụ sai:**

```java
// ✘ trả entity JPA thẳng ra ngoài, không envelope
@GetMapping("/{id}")
public Product get(@PathVariable String id) { return product; }
```

**Ví dụ đúng:**

```java
@GetMapping("/{productId}")
public ApiResponse<ProductListingResponse> getProduct(@PathVariable String productId) {
    return ApiResponse.ok(service.getProduct(productId));
}
```

### 3.2. Đường dẫn và phương thức HTTP

**Mức độ bắt buộc: BẮT BUỘC**

**Lý do:** Gateway định tuyến theo đường dẫn tài nguyên; đổi đường dẫn là đổi hợp đồng với web và app mobile.

**Hình dạng:** `/api/<aggregate-root>/{rootId}/<sub-resource>/{subId}`.

```text
✔ /api/products/{productId}/reviews
✔ /api/vendors/{vendorId}/products/{productId}
✔ /api/orders/{orderId}/dispute/evidences
✔ /api/carts/me/items/{itemId}
✘ /api/mockups/{id}                    (tài nguyên con không có đường dẫn riêng)
✘ /api/seller/products                 (tách theo vai — đã bị L-17 bỏ)
```

**Phương thức:**

| Method | Dùng để | Ghi chú |
|---|---|---|
| `GET` | Đọc | Trả `200` |
| `POST` | Tạo | Trả `201` khi tạo tài nguyên mới |
| `PUT` | Thay toàn bộ | Idempotent |
| `PATCH` | Đổi một phần | Dùng để đổi trạng thái: `PATCH {"status": "..."}` |
| `DELETE` | Xóa | Chỉ tài nguyên được phép xóa; trả `204` |

Không có động từ nghiệp vụ trong URL (`/visibility`, `/review`, `/lock`); thao tác nghiệp vụ là đổi trạng thái hoặc tạo tài nguyên con.

**Ngoại lệ:** `/api/auth/**` (identity) và callback VNPay (`/api/payments/vnpay/ipn`, `/return`).

### 3.3. Phiên bản API

**Mức độ bắt buộc: BẮT BUỘC**

**Lý do:** D-18 đã chốt đường dẫn không số phiên bản; thêm `/v1` sẽ phá toàn bộ route của gateway.

Đường dẫn **không** chứa số phiên bản. Tương thích được đảm bảo bằng việc thêm trường vào payload, không bằng URL mới.

### 3.4. Phân trang

**Mức độ bắt buộc: BẮT BUỘC**

**Lý do:** `PageResponse` là hợp đồng giữa backend và `unwrapPage()` của frontend.

Tham số: `?page=` (0-based, mặc định `0`), `?size=` (mặc định `20`), `?sort=`.

Payload:

```json
{
  "content": [],
  "page": 0,
  "size": 20,
  "totalElements": 0,
  "totalPages": 0
}
```

Kích thước trang bị giới hạn (catalog chặn `size` ngoài khoảng 1–100).

### 3.5. Idempotency

**Mức độ bắt buộc: BẮT BUỘC (cho endpoint tiền và đặt cọc)**

**Lý do:** Retry sau khi mất phản hồi sẽ tạo trùng giao dịch tiền thật; `payments.idempotency_key` là chốt chặn duy nhất (P-03).

Header `Idempotency-Key` trên các endpoint:

| Endpoint | Giá trị key |
|---|---|
| `POST /internal/payments` | `checkoutId` / `acceptanceId` / `vendorId` tùy `purpose` |
| `POST /internal/orders/checkout` | `checkoutId` |

Cơ chế phía server: `PaymentServiceImpl.create()` tra `findPendingByIdempotencyKey()` trước; nếu có payment `PENDING` cùng key thì trả lại payment cũ thay vì tạo mới.

**Ví dụ sai:**

```java
// ✘ tạo payment không có idempotency
@PostMapping
public ResponseEntity<?> create(@RequestBody CreatePaymentRequest request) { ... }
```

### 3.6. Định dạng dữ liệu

**Mức độ bắt buộc: BẮT BUỘC**

**Lý do:** Frontend và app mobile parse theo một quy ước duy nhất.

| Kiểu | Quy ước | Ví dụ |
|---|---|---|
| JSON key | `camelCase` (cả API nội bộ) | `accountId`, `createdAt` |
| Enum | `UPPER_SNAKE_CASE` | `PENDING_PAYMENT` |
| Ngày | `yyyy-MM-dd` | `2026-11-05` |
| Thời điểm | ISO-8601 có offset | `2026-11-05T05:00:00Z` |
| Tiền | `bigint` VND, không số lẻ (NFR-09) | `520000` |
| Tỷ lệ cọc | `numeric(5,2)` | `30.00` |
| Id | `varchar(36)` UUID | `00000000-0000-4000-8000-000300000001` |

### 3.7. Xác thực và phân quyền ở Gateway

**Mức độ bắt buộc: BẮT BUỘC**

**Lý do:** Gateway là điểm vào duy nhất; nếu service tự tin token thì mọi service phải giữ cùng khóa bí mật và rò rỉ ở bất kỳ đâu là toàn hệ thống.

- JWT HS256, `sub` = `accountId`, `role` = `MEMBER` | `ADMIN`.
- Gateway **xoá** header `X-User-Id`, `X-Account-Id`, `X-User-Role` do client gửi lên, rồi gắn lại từ token đã xác thực.
- Dịch vụ sau gateway **chỉ** đọc danh tính qua `X-Account-Id` và `X-User-Role`.
- Gateway chặn `403` mọi đường dẫn `/internal/**` và `/*/internal/**` từ ngoài.

### 3.8. Gọi nội bộ

**Mức độ bắt buộc: BẮT BUỘC**

**Lý do:** `SecurityConfig` deny `/internal/**`; nếu một endpoint nội bộ đặt sai đường dẫn thì nó bị mở ra ngoài mà không ai hay biết.

Endpoint nội bộ đặt dưới `/internal/...` ở **phía service nhận**, không phải ở service gọi:

```java
// ✔ trong payment-service
@PostMapping("/internal/payments")
public ResponseEntity<?> create(@RequestHeader("Idempotency-Key") String key, ...) { ... }
```

Dịch vụ gọi dùng OpenFeign (`@FeignClient`), không gọi qua Gateway.

---

## 4. Quy tắc dữ liệu

### 4.1. Một service, một database

**Mức độ bắt buộc: BẮT BUỘC**

**Lý do:** Ranh giới dữ liệu là ranh giới microservice; dùng chung schema là dùng chung ghi.

7 database PostgreSQL 17 riêng biệt (`identity`, `catalog`, `quotation`, `order`, `vendor`, `payment`, `orchestrator`), mỗi service tự Flyway migration schema của mình.

Tham chiếu sang service khác **chỉ lưu id**, không có foreign key. Tham chiếu trong cùng service thì có FK thật.

### 4.2. Đặt tên cột và bảng

**Mức độ bắt buộc: BẮT BUỘC**

**Lý do:** SQL trong `db/migration` và `db/seed` được đọc và sửa bởi nhiều người; quy ước nhất quán giữ việc viết câu hỏi đọc schema dễ hơn.

| Quy tắc | Giá trị |
|---|---|
| Tên bảng | `snake_case`, số nhiều (`outbox_events`, `vendor_snapshots`) |
| Tên cột | `snake_case` |
| Khóa chính | `id` |
| Khóa ngoại | `<tên_bảng_1_số_ít>_id` (`account_id`, `vendor_id`, `order_id`) |
| Cột thời gian | `created_at`, `updated_at` |
| Cột phiên bản | `version` (optimistic lock) cho bảng có tranh chấp ghi |
| Tiền | `bigint`, hậu tố `_amount` khi cần phân biệt |
| Phần trăm/tỷ lệ | `numeric(5,2)` |

### 4.3. Xoá mềm

**Mức độ bắt buộc: BẮT BUỘC**

**Lý do:** L-04 đã chốt bỏ cột `products.deleted`: "xoá" sản phẩm là **ẩn** (đổi trạng thái), không xoá dòng.

Repo **không dùng** xoá mềm (`@SoftDelete` / `deleted_at`) ở bất kỳ entity nào — đã kiểm tra toàn bộ `api/**/src/main/java`. Xoá hẳn hoặc ẩn bằng trạng thái, tuỳ nghiệp vụ.

### 4.4. Id: UUIDv4 và ID seed xác định

**Mức độ bắt buộc: BẮT BUỘC**

**Lý do:** Id sinh ở runtime phải là UUIDv4; id trong seed phải cố định để test và tài liệu tham chiếu được.

| Ngữ cảnh | Quy tắc |
|---|---|
| Id do code sinh | UUIDv4, `varchar(36)` |
| Id trong `db/seed/R__seed.sql` | UUID **cố định**, theo sổ ID trong [`guides/database.md` §5](../guides/database.md) |

Định dạng ID seed: `00000000-0000-4000-8000-<loại 4 số><thứ tự 8 số>`.

| Loại | Mã | Ví dụ |
|---|---|---|
| account | `0001` | `00000000-0000-4000-8000-000100000001` |
| vendor | `0002` | `00000000-0000-4000-8000-000200000001` |
| product | `0003` | `00000000-0000-4000-8000-000300000001` |
| quote request | `0004` | `00000000-0000-4000-8000-000400000001` |
| order | `0005` | `00000000-0000-4000-8000-000500000001` |
| address | `0006` | `00000000-0000-4000-8000-000600000001` |
| delivery area | `0007` | `00000000-0000-4000-8000-000700000001` |
| registration fee config | `0008` | `00000000-0000-4000-8000-000800000001` |

Loại mới: lấy mã kế tiếp và **thêm một dòng vào bảng** trong `guides/database.md`.

### 4.5. Flyway: migration và seed

**Mức độ bắt buộc: BẮT BUỘC**

**Lý do:** Flyway kiểm checksum; sửa file đã merge làm mọi máy của thành viên khác báo lỗi lúc khởi động.

```text
<service>/src/main/resources/db/
├── migration/   V1__baseline.sql, V2026_10_21_0930__add_note_to_orders.sql
└── seed/        R__seed.sql
```

| Luật | Chi tiết |
|---|---|
| `migration/` | Chạy ở **mọi** môi trường. `ddl-auto: validate` — Hibernate chỉ kiểm, không sửa DB |
| Không sửa file `V…` đã merge | Muốn sửa thì thêm file mới |
| Tên file migration | `V<yyyy>_<MM>_<dd>_<HHmm>__<việc_làm>.sql` — đặt theo thời điểm tạo để hai người làm song song không trùng số |
| `seed/` | **Chỉ** ở máy dev. Bật qua `SPRING_FLYWAY_LOCATIONS=classpath:db/migration,classpath:db/seed` |
| File seed | Một file `R__seed.sql` mỗi service, chạy lại được: mọi `INSERT` có `ON CONFLICT DO NOTHING` |
| Seed và migration | Sửa `R__seed.sql` trong **cùng PR** với thay đổi schema |

Không có script seed chạy tay; không có auto-seeder bằng Java ở mọi môi trường (D-22).

### 4.6. Outbox / Inbox (event sourcing)

**Mức độ bắt buộc: BẮT BUỘC**

**Lý do:** Ghi vào DB và phát sự kiện phải là một giao dịch; phát trước rồi ghi sau là mất sự kiện.

**Mẫu Outbox — mỗi service phát sự kiện có:**

| Thành phần | Quy ước |
|---|---|
| Bảng | `outbox_events` |
| Index | `(created_at) WHERE published_at IS NULL` (P-08) |
| Cột | `id`, `aggregate_type`, `aggregate_id`, `event_type`, `payload`, `created_at`, `published_at` |
| Relay | `@Scheduled` đọc theo lô, gửi RabbitMQ, đánh dấu `published_at` |

**Relay dùng chung:** `api/common-outbox` cung cấp `OutboxRelay` (đọc theo lô → `waitForConfirmsOrDie` → mới đánh dấu `published_at`) và interface `OutboxEventSource` mà mỗi service tự cài. Service giữ bảng `outbox_events` và entity của riêng mình; không viết lại relay riêng.

Lưu ý hiện trạng: `api/common-outbox` đã được khai báo trong `api/pom.xml` nhưng **chưa service nào khai báo dependency**, và thư mục module **chưa được commit** — nên 5 bản `OutboxRelay` cục bộ vẫn còn (xem [đối chiếu tuân thủ](codebase-conformance-review.md) H-04 và H-10).

**Mẫu Inbox — mỗi service nhận sự kiện có:**

| Thành phần | Quy ước |
|---|---|
| Bảng | `processed_events` |
| Khóa | `(event_id, consumer_name)` — chống xử lý lặp |
| Luồng | Ghi inbox **và** áp dụng thay đổi trong cùng một transaction |

**Luồng tham chiếu — `product.upserted`:**

```text
vendor-service (ghi sản phẩm)
   → ProductServiceImpl.announceUpserted()
   → ProductSnapshotPublisher → outbox_events
   → OutboxRelay → RabbitMQ (routing key "product.upserted")
   → catalog-service: ProjectionInboxServiceImpl.capture()
   → inbox (processed_events) + CatalogProjectionServiceImpl.applyProduct()
   → bảng đọc product_views / product_listings
```

Catalog là **bản đọc dựng từ sự kiện**, không ghi sản phẩm (L-18, BE-09).

**Ví dụ sai:**

```java
// ✘ phát sự kiện trước khi commit transaction
productRepository.save(product);
rabbitTemplate.convertAndSend("product.upserted", snapshot);  // ✘ nếu transaction rollback, sự kiện đã đi
```

**Ví dụ đúng:**

```java
// ✔ ghi product và outbox trong cùng transaction, relay đọc bảng outbox
productRepository.save(product);
outboxService.append(OutboxEvent.of("product.upserted", product.getId(), snapshot));
```

### 4.7. Dữ liệu cá nhân

**Mức độ bắt buộc: BẮT BUỘC**

**Lý do:** NFR-03; số CCCD và số tài khoản ngân hàng không được nằm dạng thường trong DB.

| Dữ liệu | Cách lưu |
|---|---|
| Số định danh | `*_hash` (HMAC-SHA256 + pepper) + `*_masked` + `*_key_ver` |
| Số định danh (khi cần giải mã) | `*_enc bytea` (AES-256-GCM) + `pii_key_ver` |
| Số tài khoản ngân hàng | `bank_account_number_enc` + `bank_account_masked` (P-09) |
| Pepper | Chỉ cấp cho `identity-service` qua `ID_HASH_PEPPER_V1`; vendor gọi `POST /internal/accounts/check` (D-07) |

### 4.8. Cấu hình: `@ConfigurationProperties` thay cho `@Value`

**Mức độ bắt buộc: KHUYẾN NGHỊ**

**Lý do:** `@Value` không validate, không group, không tự sinh tài liệu; repo đã có 22 class `@ConfigurationProperties` nên đây là hướng đã được chọn.

Ưu tiên class `@ConfigurationProperties` cho nhóm cấu hình; `@Value` chỉ dùng cho **một** giá trị rời lẻ.

```java
// ✔ nhóm cấu hình
@ConfigurationProperties(prefix = "outbox")
public record OutboxProperties(int batchSize, Duration confirmTimeout) { }
```

```java
// ✘ nhóm giá trị rời rạc
@Value("${outbox.batch-size:100}") int batchSize,
@Value("${outbox.confirm-timeout:5s}") Duration confirmTimeout,
```

---

## 5. Quy tắc bảo mật

### 5.1. JWT

**Mức độ bắt buộc: BẮT BUỘC**

**Lý do:** D-19 chốt HS256 để gateway và service dùng chung một khóa bí mật.

| Thuộc tính | Giá trị |
|---|---|
| Thuật toán | HS256 |
| Claim `sub` | `accountId` (một id cho một người) |
| Claim `role` | `MEMBER` hoặc `ADMIN` (chuỗi đơn, không phải mảng) |
| Claim `type` | `ACCESS` hoặc `REFRESH` — gateway **chỉ** nhận `ACCESS` |
| Khóa | `JWT_SECRET` (Base64), cùng giá trị cho identity, gateway, orchestrator |

### 5.2. Ranh giới tin cậy header `X-User-*`

**Mức độ bắt buộc: BẮT BUỘC**

**Lý do:** Nếu service tin header do client gửi, bất kỳ ai cũng giả được danh tính.

1. Gateway **xoá** `X-User-Id`, `X-Account-Id`, `X-User-Role` đến từ client.
2. Gateway gắn lại `X-Account-Id` (= `sub`) và `X-User-Role` từ token đã xác thực.
3. Service **không** tự decode token, **không** đọc `Authorization`.

**Ví dụ sai:**

```java
// ✘ tin header từ client
@GetMapping("/api/orders")
public List<Order> list(@RequestHeader("X-Account-Id") String accountId) { ... }
```

**Ví dụ đúng:**

```java
// ✔ đọc qua annotation do framework đã kiểm
@GetMapping("/api/accounts/me")
public ResponseEntity<ApiResponse<AccountResponse>> me(@CurrentUser CurrentUserInfo user) {
    return ResponseEntity.ok(ApiResponse.ok(userProfileService.getMyAccount(user.accountId())));
}
```

### 5.3. Mô hình vai

**Mức độ bắt buộc: BẮT BUỘC**

**Lý do:** D-19 chốt hai vai `MEMBER` / `ADMIN`; chủ người bán **không phải** vai.

| Vai | Quyền |
|---|---|
| `MEMBER` | Người dùng đã đăng nhập |
| `ADMIN` | Quản trị |

Quyền sở hữu (vendor sở hữu sản phẩm, buyer sở hữu đơn) được kiểm bằng **so sánh id**, không bằng vai.

**Ví dụ sai:**

```java
// ✘ đưa "chủ vendor" thành vai
if (!"VENDOR".equals(role)) { throw new ForbiddenException(); }
```

**Ví dụ đúng:**

```java
// ✔ vai + kiểm chủ
if (!"ADMIN".equals(role) && !product.getVendor().getOwnerAccountId().equals(accountId)) {
    throw new ForbiddenException();
}
```

### 5.4. CORS

**Mức độ bắt buộc: BẮT BUỘC**

**Lý do:** `Access-Control-Allow-Origin: *` cộng với cookie `HttpOnly` là lỗ hổng CSRF.

- Danh sách origin đến từ biến môi trường `CORS_ORIGINS`, **không** hardcode trong code.
- Không dùng `*` khi bật chế độ cookie (`VITE_AUTH_MODE=cookie`).
- Method cho phép: `GET, POST, PUT, PATCH, DELETE, OPTIONS`.
- Header cho phép: `Authorization, Content-Type`.

```yaml
moonkage:
  cors:
    allowed-origins: ${CORS_ORIGINS}
```

### 5.5. Giới hạn tần suất

**Mức độ bắt buộc: BẮT BUỘC (cho endpoint nhạy cảm)**

**Lý do:** Endpoint đăng nhập, OTP, NFC và VNPay IPN là các điểm tấn công đáng giá.

Gateway giới hạn theo quy tắc định nghĩa trong `moonkage.rate-limit.rules`:

| Quy tắc | Mặc định | Đường dẫn |
|---|---|---|
| `login` | 10 | `/api/auth/login` |
| `otp` | 5 | `/api/auth/send-*` |
| `nfc` | 10 | `/api/nfc/**` |
| `ipn` | 120 | `/api/payments/vnpay/ipn` |
| `registration` | 60 | `/api/vendors` |

Đếm theo `accountId` nếu request đã xác thực, theo IP nếu ẩn danh. Phản hồi khi vượt: `429` kèm header `Retry-After`.

Giới hạn là **mỗi instance**; khi chạy nhiều gateway sau load balancer, bật `RATE_LIMIT_ENABLED=true` và hiểu rằng hạn mức thực tế bằng số instance × hạn mức cấu hình.

### 5.6. CSP và header bảo mật ở frontend

**Mức độ bắt buộc: BẮT BUỘC**

**Lý do:** CSP là hàng rào quan trọng nhất chống XSS; `script-src 'self'` chặn inline script.

Nội dung CSP nằm trong `web/src/shared/config/security.ts`:

```text
default-src 'self'
script-src 'self'
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com
font-src 'self' https://fonts.gstatic.com
img-src 'self' data: blob:
connect-src 'self' <gateway origin> <ws origin>
object-src 'none'
base-uri 'self'
form-action 'self'
upgrade-insecure-requests   ← CHỈ có trong header HTTP production
```

`frame-ancestors 'none'` chỉ dùng được qua **header HTTP**, không dùng được trong thẻ `<meta>`.

#### Quy tắc `upgrade-insecure-requests` (dễ tái phát — đọc trước khi sửa CSP)

`upgrade-insecure-requests` bảo trình duyệt nâng mọi request `http://` lên `https://`. Nó chỉ đúng khi **trang** được phục vụ qua HTTPS và mọi backend đã sẵn sàng phục vụ HTTPS.

Vì vậy:

| Nơi áp dụng | `upgrade-insecure-requests` | Lý do |
|---|---|---|
| Header HTTP ở nginx/CDN (`buildCspHeader()`) | **CÓ** | Đây là chuẩn production — trang chạy qua HTTPS. |
| Thẻ `<meta>` ở bản build (`applyCspMeta()`) | **CHỈ khi origin là HTTPS** | Ở origin HTTP (local/CI/E2E) directive này nâng request `http://` của gateway lên `https://` và chặn chính request đó. |

Origin loopback (`http://127.0.0.1:4173`) là "potentially trustworthy" nên vẫn là secure context ⇒ trình duyệt vẫn áp dụng `upgrade-insecure-requests` cho bản build E2E phục vụ bằng `vite preview`. Hậu quả nếu meta CSP chứa directive này ở môi trường HTTP: mọi `fetch`/`axios` tới `http://127.0.0.1:8080` bị trình duyệt chặn ⇒ danh mục rỗng, màn hình trắng, log console đầy lỗi CSP.

Vì vậy **không** đặt `upgrade-insecure-requests` trong `CSP_DIRECTIVES` dùng chung; dùng hằng `UPGRADE_INSECURE_REQUESTS` và hàm `isSecureOrigin()`.

Kèm theo đó, `connect-src` phải khai báo **cả hai** biến thể `http://` và `https://` (và `ws://`/`wss://`) cho cùng host, để CSP không lệch với `upgrade-insecure-requests` khi deploy thật qua HTTPS (`cspConnectSources()` tự sinh cả hai).

Header khác phải gửi ở production: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, `Strict-Transport-Security`.

### 5.7. Bí mật

**Mức độ bắt buộc: BẮT BUỘC**

**Lý do:** `.env` chứa khóa JWT, khóa AES, pepper, RSA của NFC.

- `.env` **không** commit (đã có trong `.gitignore`, kiểm chứng bằng `git check-ignore`).
- Chỉ `.env.example` được commit, giá trị placeholder.
- Mỗi service chỉ nhận biến nó cần; `NFC_TRANSPORT_PRIVATE_KEY_V1` và `ID_HASH_PEPPER_V1` chỉ cho `identity-service`.

---

## 6. Quy tắc frontend

### 6.1. Style chỉ dùng token

**Mức độ bắt buộc: BẮT BUỘC**

**Lý do:** `tokens.css` và `tokens-dark.css` là nguồn duy nhất của màu, khoảng cách, font, bo góc; viết giá trị cứng tạo hai nguồn sự thật và hỏng chế độ tối.

```css
/* ✔ */
.submitButton {
  padding: var(--space-4);
  color: var(--color-text);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}
```

```css
/* ✘ */
.submitButton {
  padding: 16px;
  color: #1a1a1a;
  border-radius: 8px;
  background: #ffffff;
}
```

Ngoài ra: selector một cấp, đặt tên class theo vai trò, không `:global()` trừ khi có chú thích lý do, không `!important`.

### 6.2. CSS Module

**Mức độ bắt buộc: BẮT BUỘC**

**Lý do:** Script `check-css-modules.mjs` chạy trong `npm run check` và trong CI; class dùng trong TSX mà không có trong stylesheet là lỗi hiển thị âm thầm.

```tsx
import styles from './ProductCard.module.css';

<article className={styles.card}>
```

Ngoại lệ duy nhất: 4 file CSS toàn cục nạp ở `web/src/app/main.tsx` (`tokens.css`, `tokens-dark.css`, `reset.css`, `global.css`).

### 6.3. Tách lớp API

**Mức độ bắt buộc: BẮT BUỘC**

**Lý do:** Ranh giới `api/` (gọi HTTP) và `model/` (state, hook, kiểu) là ranh giới "nơi dữ liệu đến từ đâu" — không trộn thì không kiểm được.

| Thư mục | Chứa |
|---|---|
| `entities/<x>/api/` | Hàm gọi HTTP, gọi `apiClient` từ `@/shared/api` |
| `entities/<x>/model/` | Kiểu dữ liệu, hook React Query, store |
| `entities/<x>/ui/` | Component hiển thị thuần |
| `features/<x>/api/` | Hàm **ghi** |
| `features/<x>/model/` | Hook mutation, logic hành động |

**Ví dụ sai:**

```ts
// ✘ axios trực tiếp trong entity, tự cấu hình baseURL
import axios from 'axios';
export const getProducts = () => axios.get('/api/products');
```

**Ví dụ đúng:**

```ts
// ✔ dùng client dùng chung, tự unwrap envelope
import { apiClient, unwrapPage } from '@/shared/api';

export async function getProducts(params: ProductSearchParams): Promise<Product[]> {
  const res = await apiClient.get(GATEWAY.CATALOG.PRODUCTS, { params });
  return unwrapPage<Product>(res);
}
```

Chỉ `web/src/shared/api/client.ts` được import `axios`.

### 6.4. React Query

**Mức độ bắt buộc: BẮT BUỘC**

**Lý do:** 65 call site dùng `useQueryData`; dùng `useQuery` thô ở nơi khác sẽ phá hợp đồng `AsyncStateKind` mà design system đang dùng.

| Việc | Cách làm |
|---|---|
| Đọc | `useQueryData(queryKey, load)` từ `@/shared/lib` |
| Ghi | `useMutation` trong `features/<x>/model/`, `onSuccess` → `queryClient.invalidateQueries` |
| Query key | Chỉ tạo qua factory `queryKeys` trong `web/src/shared/api/queryClient.ts` |
| Query client | Một instance duy nhất, `staleTime` 60s, `retry` 1 lần cho lỗi 5xx, không retry 4xx |

```ts
// ✔ invalidate theo key factory
await queryClient.invalidateQueries({ queryKey: queryKeys.cart.mine(provinceCode) });
```

### 6.5. Biến môi trường

**Mức độ bắt buộc: BẮT BUỘC**

**Lý do:** Đọc `import.meta.env` rải rác khiến không biết biến nào cần khai báo và giá trị mặc định ở đâu.

Mọi biến `VITE_*` đọc qua `web/src/shared/config/env.ts`. `import.meta.env` trực tiếp chỉ được dùng trong `shared/config/*`.

### 6.6. Cổng API gateway

**Mức độ bắt buộc: BẮT BUỘC**

**Lý do:** `web/src/shared/api/gateway.ts` là nơi duy nhất chứa đường dẫn backend; nếu mỗi entity tự viết URL thì đổi contract là sửa hàng chục chỗ.

```ts
export const GATEWAY = {
  VENDOR: {
    BASE: '/api/vendors',
    BY_ID: (id: string) => `/api/vendors/${id}`,
  },
} as const;
```

Đường dẫn nào backend **chưa** có thì đặt vào `NOT_IMPLEMENTED_YET`, không tự bịa.

### 6.7. Cổng `index.ts` của slice

**Mức độ bắt buộc: BẮT BUỘC**

**Lý do:** `index.ts` là hợp đồng giữa slice và bên ngoài; code bên trong slice được phép đổi tên/tách/xoá không phải báo ai.

- Export có tên, **không** dùng `export *`.
- Chỉ export cái bên ngoài thật sự cần.
- Page dùng `export default` để tương thích `lazy()`.

```ts
// features/add-to-cart/index.ts
export { AddToCartButton } from './ui/AddToCartButton';
export { useCartSync } from './model/useCartSync';
// KHÔNG export: cartWriteApi (chi tiết nội bộ)
```

### 6.8. Không rò mã đặc tả ra giao diện

**Mức độ bắt buộc: BẮT BUỘC**

**Lý do:** Script `check-no-spec-ids.mjs` chạy trong `npm run check` và CI; mã `FR-xx`, `FLOW n`, `M6.1.3` là mã nội bộ, người dùng cuối không hiểu.

Comment trong mã nguồn được phép nhắc mã đặc tả — đó là tài liệu cho người phát triển.

### 6.9. Không gọi API trực tiếp từ page

**Mức độ bắt buộc: BẮT BUỘC**

**Lý do:** Page chỉ lắp ráp; logic gọi dữ liệu và hành động thuộc `entities` (đọc) và `features` (ghi).

```tsx
// ✘ page tự gọi API
const { data } = useQuery({ queryKey: ['orders'], queryFn: () => apiClient.get('/api/orders') });
```

```tsx
// ✔ page dùng hook của entity
const { kind, data } = useOrderQueries.list();
```

### 6.10. Cổng `npm run check`

**Mức độ bắt buộc: BẮT BUỘC**

**Lý do:** Đây là cổng chất lượng duy nhất của web; CI chạy đúng chuỗi này.

```bash
npm run check
# = oxlint src e2e
# + node scripts/check-css-modules.mjs
# + node scripts/check-no-spec-ids.mjs
# + tsc -b
# + vitest run
# + vite build
# + node scripts/check-bundle-size.mjs
```

---

## 7. Quy tắc kiểm thử và CI

### 7.1. Backend

**Mức độ bắt buộc: BẮT BUỘC**

**Lý do:** CI `code-quality.yml` chạy `./mvnw -B -ntp clean verify` cho mọi thay đổi trong `api/**`.

Chuỗi kiểm tra trong `verify`:

| Công cụ | Pha | Phạm vi |
|---|---|---|
| Spotless | `validate` | Định dạng (Palantir, 4 space, 120 cột) |
| Checkstyle | `validate` | Tên, import bị cấm, magic number (`config/checkstyle/checkstyle.xml`) |
| Error Prone | `compile` | Lỗi compile-time |
| ArchUnit | `test` | Luật tầng (§2.4) |
| Unit test | `test` | JUnit 5 + Mockito |

```bash
cd api && ./mvnw -B -ntp clean verify
```

Sửa định dạng: `./mvnw spotless:apply`.

### 7.2. Frontend: unit test

**Mức độ bắt buộc: BẮT BUỘC**

**Lý do:** Test đặt cạnh code đúng nguyên tắc "đồng vị trị"; CI chạy `npm test` và `npm run coverage` (có ngưỡng sàn đặt trong `vite.config.ts`).

| Tầng | Test cái gì |
|---|---|
| `shared/utils`, `shared/lib` | Hàm thuần, hành vi hợp đồng |
| `shared/ui` | Hành vi, khả năng truy cập (`vitest-axe`) |
| `entities` | Hàm nghiệp vụ thuần, mapper |
| `features` | Hook với API giả lập, tương tác người dùng |
| `widgets`, `pages` | Luồng chính |

Bộ dữ liệu giả và mock handler dùng chung: `web/src/shared/test/`.

### 7.3. Frontend: E2E

**Mức độ bắt buộc: BẮT BUỘC**

**Lý do:** E2E chạy trên bản build thật (`vite preview` cổng 4173) nối với API Gateway thật — đây là bản kiểm duy nhất bắt được lệch contract.

- Công cụ: Playwright, chỉ Chromium để giới hạn thời gian chạy.
- Backend **phải** đang chạy: bộ test đọc dữ liệu thật từ PostgreSQL và ảnh thật từ MinIO.
- 7 luồng nghiệp vụ cốt lõi: `web/e2e/flow-01` … `flow-07`.

```bash
cd web && npm run e2e
```

Không có chế độ demo: mọi khẳng định phải chạy trên hệ thống thật.

### 7.4. Điều kiện merge

**Mức độ bắt buộc: BẮT BUỘC**

**Lý do:** CI không thể bỏ qua — hook git có thể bỏ qua (`--no-verify`), CI thì không.

| Workflow | Kích hoạt khi | Chạy |
|---|---|---|
| `code-quality.yml` | `api/**` thay đổi | `./mvnw clean verify` |
| `web-quality.yml` | `web/**` thay đổi | lint → CSS → spec-ID → encoding → build → bundle → vitest → coverage → E2E |
| `docs-links.yml` | `**/*.md` hoặc `api/**/*.java` thay đổi | lychee kiểm link hỏng → `check-class-docs.mjs` kiểm tài liệu class còn khớp mã nguồn |
| `pr-conventions.yml` | mọi PR | kiểm đặt tên branch, commit, PR |

### 7.5. Tài liệu phải đi kèm code

**Mức độ bắt buộc: BẮT BUỘC**

**Lý do:** Quy tắc 4 trong `docs/README.md`: tài liệu của service phải sửa **cùng PR** với code của service đó.

| Thay đổi code | Cập nhật tài liệu |
|---|---|
| Thêm/sửa endpoint | `docs/architecture/api-db/<service>.md` |
| Đổi schema | File migration + `docs/guides/database.md` nếu đụng sổ ID |
| Đổi quyết định kiến trúc | `docs/architecture/api-db/decisions.md` (ADR mới) |
| Đổi cấu trúc package | `docs/conventions/coding-rules.md` nếu quy ước đổi |
| Đổi/xoá một class có tài liệu ở `docs/services/<service>/classes/` | Sửa hoặc xoá `docs/services/<service>/classes/<ClassName>.md` **cùng PR** (xem [../README.md](../README.md) quy tắc 9) |

### 7.6. Tài liệu class nặng: ai sửa, khi nào, kiểm bằng gì

**Mức độ bắt buộc: BẮT BUỘC**

**Lý do:** `docs/services/*/classes/*.md` là tài liệu **sinh tay** mô tả pseudocode của class. Không có quy trình thì nó lệch dần và người đọc tưởng hành vi cũ vẫn đúng.

| Câu hỏi | Trả lời |
|---|---|
| **Phạm vi** | Mỗi file `docs/services/<service>/classes/<ClassName>.md` mô tả **một** class Java `api/<module>/src/main/java/**/<ClassName>.java`. Tên file phải **khớp đúng** tên class (kể cả phân biệt hoa thường). Ánh xạ thư mục → module: `docs/services/<service>` ↔ `api/<service>-service`, riêng `common-storage` giữ nguyên tên. |
| **Khi nào phải cập nhật** | Trong **cùng PR** với thay đổi chạm vào class: đổi tên class, đổi package, đổi/xoá method, đổi luật bất biến, đổi mã lỗi nghiệp vụ, đổi thứ tự trạng thái. Class không còn đáng viết tài liệu → **xoá file** tài liệu trong cùng PR. |
| **Ai giữ** | Tác giả của PR đó — người sửa code của class đó. Người giữ tài liệu chỉ cập nhật danh sách class nặng ở đây. |
| **Kiểm tra bằng gì** | `node docs/scripts/check-class-docs.mjs` — đối chiếu tên file `classes/<ClassName>.md` với file `<ClassName>.java` trong module tương ứng. Chạy trong `.github/workflows/docs-links.yml`, bước **Check class docs match source**; job này chạy khi `**/*.md` **hoặc** `api/**/*.java` thay đổi. |
| **Giới hạn của bước kiểm tra** | Script bắt được class **đã đổi tên hoặc bị xoá**. Nội dung tài liệu có còn đúng với hành vi mới thì người review PR phải đọc lại — CI không thay được bước đọc đó. |

Danh sách class được tài liệu hoá (20 file) nằm ở `docs/services/*/classes/`:

| Service | Class |
|---|---|
| identity | `AccountServiceImpl`, `AddressServiceImpl`, `AuthServiceImpl`, `EmailServiceImpl`, `LegalProfileServiceImpl`, `NfcServiceImpl`, `OtpServiceImpl`, `OutboxServiceImpl` |
| catalog | `CatalogProjectionServiceImpl`, `InterprovinceFeeServiceImpl`, `JdbcCatalogProjectionRepository`, `OutboxDeliveryServiceImpl`, `ProductReadServiceImpl`, `ProjectionInboxServiceImpl`, `ProjectionRecoveryServiceImpl`, `ProjectionReplayEntryServiceImpl` |
| quotation | `QuoteAcceptanceServiceImpl`, `QuoteRequestServiceImpl`, `QuoteServiceImpl` |
| common-storage | `ObjectStorage` |

Tiêu chuẩn nội dung một file tài liệu class: [../conventions/coding-rules.md](../conventions/coding-rules.md) Phần 5.

---

## 8. Quy tắc tài liệu

### 8.1. Nguyên tắc nguồn sự thật

**Mức độ bắt buộc: BẮT BUỘC**

**Lý do:** 70 file markdown trong `docs/`; chép lại nội dung ở nhiều nơi chắc chắn dẫn tới mâu thuẫn.

1. **Một nội dung, một chỗ.** Nơi khác chỉ đặt link.
2. **Không chép bảng quyết định.** ADR là nguồn; tài liệu khác dẫn `D-xx`.
3. **Code là bản đúng.** Khi tài liệu và code lệch, sửa tài liệu hoặc mở quyết định mới — đừng để hai nguồn cùng tồn tại.

### 8.2. Vị trí tài liệu

**Mức độ bắt buộc: BẮT BUỘC**

**Lý do:** Mỗi loại tài liệu có một chủ sở hữu và một nhịp cập nhật; đặt nhầm chỗ là tài liệu bị bỏ quên.

| Loại | Vị trí | Ví dụ |
|---|---|---|
| Yêu cầu nghiệp vụ | `docs/product/` | `requirements.md`, `user-stories.md` |
| Thiết kế hệ thống | `docs/architecture/` | `software-design.md` |
| Hợp đồng API + DB | `docs/architecture/api-db/` | `order.md`, `payment.md` |
| Quyết định kiến trúc | `docs/architecture/api-db/decisions.md` | ADR `D-xx`, `L-xx`, `P-xx` |
| Quy ước viết code | `docs/conventions/` | `coding-rules.md` |
| Hướng dẫn thao tác | `docs/guides/` | `database.md`, `getting-started.md` |
| Tài liệu service | `docs/services/<service>/` | `identity/README.md` |
| Bộ request Postman | `docs/api/` | `mk-auth.json` |
| Lịch sử, khảo sát đã xong | `docs/archive/` | `2026-10-26-*.md` |

### 8.3. Định dạng ADR

**Mức độ bắt buộc: BẮT BUỘC**

**Lý do:** `decisions.md` dùng mã đánh số `D-xx` (quyết định kiến trúc), `L-xx` (điểm lệch API/DB) và `P-xx` (đề xuất database); code và tài liệu khác trích dẫn theo mã này.

Một ADR mới phải có:

| Phần | Nội dung |
|---|---|
| **Mã** | Số kế tiếp, không dùng lại |
| **Context** | Vì sao phải quyết định, dựa trên code và tài liệu nào |
| **Decision** | Quyết định cụ thể, không mơ hồ |
| **Consequences** | Hệ quả, gồm cả hệ quả bất lợi |
| **Status** | `Đề xuất` · `Đã chốt (ngày)` · `Mở` |

Ví dụ mẫu (theo [api-db/decisions.md](api-db/decisions.md), mục D-25 → D-30):

```markdown
### D-25: <tên quyết định>

**Context.** <bối cảnh có căn cứ, dẫn file:line>

**Decision.** <quyết định>

**Consequences.** <hệ quả>

**Status.** Đề xuất (2026-11-05)
```

Quy ước bổ sung:

- **Mã** không dùng lại. `D-xx` là quyết định kiến trúc (đặt trong `docs/architecture/api-db/decisions.md`), `L-xx` là điểm lệch giữa API–DB và code, `P-xx` là đề xuất database (`api-db/db-review-proposals.md`).
- **Context phải dẫn `file:line` thật.** Một ADR không có căn cứ trong code là một ý kiến, không phải quyết định kiến trúc.
- **Decision là một danh sách đánh số** các quy tắc cụ thể, không phải một đoạn văn.
- **Consequences phải nêu cả hệ quả bất lợi.** ADR chỉ nêu lợi ích thì chưa phải quyết định, mà là lập luận bán hàng.
- **ADR đã chốt không sửa nội dung.** Sai thì thêm ADR mới thay vì sửa đè — lịch sử quyết định là tài sản của nhóm.
- ADR ở trạng thái `Đề xuất` hoặc `Mở` **không** được dùng làm căn cứ để viết code mới; nó phải được duyệt trước.

### 8.4. Quy tắc trạng thái tài liệu

**Mức độ bắt buộc: KHUYẾN NGHỊ**

**Lý do:** Người đọc phải biết tài liệu còn hiệu lực không.

- Tài liệu kế hoạch/rà soát ghi trạng thái ngay dưới tiêu đề: `Đề xuất` · `Đang làm` · `Xong <ngày>`.
- Xong thì chuyển vào `docs/archive/` với tên `YYYY-MM-DD-<việc>.md` và thêm dòng **Lưu trữ** trỏ tới tài liệu hiện hành.
- Tài liệu class nặng đặt ở `docs/services/<service>/classes/<ClassName>.md`.

---

## 9. Bảng tra nhanh: đặt tên sai → đúng

### 9.1. Backend

| Sai | Đúng | Vì sao |
|---|---|---|
| `com.moonkage.order.service` | `com.moonkage.order` | Package gốc bỏ hậu tố `-service` |
| `com.moonkage.orderservice` | `com.moonkage.order` | Một từ, không nối |
| `OrderServiceImpl` không implement interface | `OrderServiceImpl implements OrderService` | Luật tầng: service phải có interface để thay thế được khi test |
| `orderService` (biến) | `orderService` | ✔ đúng — tên biến `camelCase` |
| `ORDER_STATUS` | `OrderStatus` | Enum là `PascalCase`; **giá trị** là `UPPER_SNAKE_CASE` |
| `PaymentDTO` | `PaymentResponse` / `CreatePaymentRequest` | DTO gọi tên theo vai trò, không phải hậu tố chung |
| `getAllOrders()` | `findAll()` | Động từ + ngữ cảnh; tránh `get` trùng lặp |
| `ProductDTO` trong `dto/` dùng cho cả request và response | `ProductRequest` / `ProductResponse` | Tách chiều |
| `User` (entity) | `Account` | D-21: một người = một account; `sub` = `accountId` |
| `CUSTOMER` / `USER` (role) | `MEMBER` | D-19 chốt `MEMBER` / `ADMIN` |
| `id` kiểu `Long` | `id` kiểu `String` UUID | Khóa chính là `varchar(36)` |
| `@Column(name = "createdAt")` | `@Column(name = "created_at")` | `snake_case` |
| `@Column(name = "vendorId")` | `@Column(name = "vendor_id")` | `snake_case` |

### 9.2. Frontend

| Sai | Đúng |
|---|---|
| `features/cart/` | `entities/cart/` (khái niệm) hoặc `features/add-to-cart/` (hành động) |
| `features/auth/` gom login + register + reset | `features/login/`, `features/register/`, `features/reset-password/` |
| `components/` ở gốc `src/` | `shared/ui/<Tên>/` |
| `pages/orders/OrderList.tsx` | `pages/account/orders/OrdersPage.tsx` |
| `productCard.tsx` | `ProductCard.tsx` |
| `product-card.module.css` | `ProductCard.module.css` |
| `useCart.ts` (trong `shared`) | `entities/cart/model/useCart.ts` |
| `api/products.ts` (ở `shared`) | `entities/product/api/productApi.ts` |
| `import { ProductCard } from '@/entities/product/ui/ProductCard'` | `import { ProductCard } from '@/entities/product'` |
| `import axios from 'axios'` trong entity | `import { apiClient } from '@/shared/api'` |
| `import.meta.env.VITE_API_BASE_URL` trong component | `import { ENV } from '@/shared/config/env'` |
| `styles.button` với `className="button"` | `className={styles.button}` |
| `color: #1a1a1a` | `color: var(--color-text)` |
| `import { useLogin } from '@/features/login'` trong feature khác | Đưa phần dùng chung xuống `entities` |
| `export * from './model'` trong `index.ts` | Export có tên tường minh |

### 9.3. API path

| Sai | Đúng |
|---|---|
| `/api/seller/products` | `/api/vendors/{vendorId}/products` |
| `/api/admin/orders` | `/api/orders?vendorId=` (quyền do vai quyết định) |
| `/api/mockups/{id}` | `/api/orders/{orderId}/mockups/{versionNo}` |
| `/api/v1/products` | `/api/products` |
| `/catalog-service/api/products` (đường dẫn công khai) | `/api/products` (gateway định tuyến) |
| `/api/products/{id}/visibility` | `PATCH /api/products/{id}` với `{"status": "..."}` |
| `POST /internal/orders/checkout` từ web | Chỉ service-to-service mới gọi `/internal/**` |

---

## 10. Ngoại lệ đã biết

Các ngoại lệ dưới đây là **cố ý** và không phải mẫu để sao chép.

| Ngoại lệ | Lý do |
|---|---|
| `orchestrator-service` dùng layout hexagonal (`application/`, `domain/`, `infrastructure/`, `contract/`) khác 6 service kia | Service này không sở hữu nghiệp vụ người dùng; nó điều phối sự kiện và template. Luật ArchUnit vẫn áp dụng vì nó dùng tên package chuẩn (`controller`/`service`/`repository` không có — nên các luật liên quan `allowEmptyShould(true)`) |
| `catalog-service` và `orchestrator-service` không có trường `errors` trong envelope | Vẫn đúng hợp đồng ở mức tối thiểu; đang được chuẩn hoá về `ApiResponse` của `api/common-api` (xem [đối chiếu tuân thủ](codebase-conformance-review.md) H-01) |
| `identity-service` và `vendor-service` dùng `web/` làm tầng controller thay vì `controller/` | Package-by-component đặt controller cạnh component. Hướng đích chuẩn là `controller/` cho cả repo — xem H-09 |
| Nhiều component dùng chung một file `*Ui.module.css` | Các component thực chất là các phần của một màn hình. Quy tắc: file CSS phải có **ít nhất một** component dùng; xoá component thì xoá luôn stylesheet (H-06, H-07) |
| `shared/config/gateway.ts` và `shared/config/routes.ts` biết tên nghiệp vụ | Ngoại lệ đã thống nhất: chúng chỉ chứa *cấu hình đường dẫn*, không chứa logic. Tách ra sẽ buộc các slice import ngang nhau |
| `web/doc/` dùng tên file `UPPER_SNAKE_CASE` | Vẫn tồn tại; nên đổi về `kebab-case` khi có đợt dọn tài liệu (xem [đối chiếu tuân thủ](codebase-conformance-review.md)) |

---

## Tài liệu liên quan

| Tài liệu | Nội dung |
|---|---|
| [codebase-conformance-review.md](codebase-conformance-review.md) | Đối chiếu code hiện tại với chuẩn này, kèm backlog P0/P1/P2 |
| [software-design.md](software-design.md) | Thiết kế hệ thống, danh sách quyết định D-01 → D-24 |
| [api-db/README.md](api-db/README.md) | Quy ước chung về API và database |
| [api-db/decisions.md](api-db/decisions.md) | ADR đã chốt và đề xuất |
| [../conventions/coding-rules.md](../conventions/coding-rules.md) | Quy tắc đặt tên và tổ chức package chi tiết |
| [../conventions/code-quality-rules.md](../conventions/code-quality-rules.md) | Bộ quy tắc chất lượng, ba vòng cưỡng chế |
| [../guides/database.md](../guides/database.md) | Flyway, seed, sổ ID |
| [../README.md](../README.md) | Bản đồ tài liệu toàn repo |
