# Kế hoạch thực hiện — các việc còn nợ sau đợt chuẩn hoá kiến trúc 2026-11-06

> **Trạng thái:** Đề xuất (2026-11-06). Khi mọi hạng mục đã xong thì chuyển vào `archive/` theo [quy tắc 6](../README.md).
> **Căn cứ:** [codebase-conformance-review.md](codebase-conformance-review.md) (33/33 phát hiện đã đóng, còn 1 hạng mục `P2-12`), [be-improve-progress-2026-11-04.md](be-improve-progress-2026-11-04.md) §6 (BE-06, BE-11, BE-13, BE-14, BE-15), [user-flow-readiness.md](user-flow-readiness.md) (F2–F7 chưa chạy thật), [web/doc/ui-ux-audit-2026-11-05.md](../../web/doc/ui-ux-audit-2026-11-05.md) §17.8, [api-db/decisions.md](api-db/decisions.md) (D-25 → D-30 còn "Đề xuất").
> **Nhánh hiện tại:** `feat/ui-ux-standardization` @ `c66bae7` · **PR:** [#98](https://github.com/LeTran30/MSS301-moonkage-platform-project/pull/98)

---

## 0. Tóm tắt

Còn **9 hạng mục** trong **4 nhóm**. Tổng ước lượng **13–17 ngày công**.

| Nhóm | Hạng mục | Ước lượng | Phụ thuộc | Ưu tiên |
|---|---|---|---|---|
| **A. Đường dẫn API** | A-1 ✅ · A-2 ✅ · A-3 (308 ✅ · tắt locator ✅ · xoá filter ⛔) | 3–4 ngày | A-1 → A-2 → A-3 | **P0** |
| **B. Luồng nghiệp vụ** | B-1 ✅ · B-2 · B-3 ✅ | 4–5 ngày | B-1 → B-2 | **P0** |
| **C. Hạ tầng & chất lượng** | C-1 ✅ · C-2 ✅ · C-3 | 3–4 ngày | độc lập | **P1** |
| **D. Tài liệu & quyết định** | D-1 ✅ · D-2 · D-3 | 3–4 ngày | độc lập | **P1** |

> **Điểm quan trọng nhất của kế hoạch này:** phần lớn việc còn nợ **không** phụ thuộc app mobile. Chỉ **A-3 (tắt `discovery.locator`)** là cần xác nhận từ bên ngoài repo. Vì vậy A-1 và A-2 có thể làm ngay.
>
> **Tiến độ (2026-11-07):** A-1, A-2 và **toàn bộ A-3** (308 + tắt `discovery.locator` + dọn `SecurityConfig`) **đã xong**. App mobile (Flutter, repo riêng `C:\Workspace\MSS301\moonkage-mobile`) **đã chuyển** sang đường dẫn canonical `/api/...` — commit `d4c78aa`; 94/94 test Flutter pass. Việc còn lại của A-3 là **xoá `LegacyPathRedirectFilter`** ở release kế tiếp, sau khi app đã phát hành một release dùng đường dẫn canonical. **C-1** (tài liệu hoá 4 thư viện `common-*`) và **D-1** (chốt trạng thái ADR D-25 → D-30) cũng **đã xong** trong ngày 2026-11-06. **B-3** (tỉnh của Shop trong projection của catalog + endpoint công khai `GET /api/vendors/{vendorId}/summary`) **đã xong** trong ngày 2026-11-06; 3.3 và 3.4 của B-3 là hạ tầng ngoài repo nên không làm được bằng code.

---

## 1. Nhóm A — Đường dẫn API theo aggregate root (ADR D-30)

### Bối cảnh

D-18 đã chốt đường dẫn công khai là `/api/<tài-nguyên>/...`, **không** có tên service. Gateway hiện phục vụ **hai** kiểu:

| Kiểu | Ví dụ | Cơ chế |
|---|---|---|
| Chuẩn | `/api/products` | 4 route tường minh trong `api/api-gateway/src/main/resources/application.yml` |
| Cũ | `/catalog-service/api/products` | `discovery.locator` tự sinh route `/<tên-service>/**` |

**Trạng thái hiện tại (đã kiểm chứng 2026-11-06):**

| Service | Route chuẩn? | Số hằng đường dẫn cũ trong `web/src/shared/api/gateway.ts` |
|---|---|---|
| `catalog` | ✅ `/api/products`, `/api/interprovince-fees` | 3 (đã có 308) |
| `vendor` | ✅ `/api/vendors/**`, `/api/registration-fee-config`, `/api/cake-attributes` | đã chuyển `/api/...` |
| `orchestrator` | ✅ `/api/notifications/**`, `/ws/**` | 2 (đã có 308) |
| `identity` | ❌ | 15 |
| `quotation` | ❌ | 12 |
| `order` | ❌ | 17 |
| `payment` | ❌ | 16 |

**Tổng: 65 hằng đường dẫn cũ** trong 1 file, dùng bởi **61 file** trong `web/src`.

`LegacyPathRedirectFilter` **cố ý** không redirect 4 service này — redirect `/order-service/api/carts/me` → `/api/carts/me` sẽ dẫn tới 404 vì không route nào phục vụ `/api/carts/me`.

> **Cập nhật 2026-11-06 (A-1, A-2, A-3a đã xong):** cả 4 service trên **đã** có route chuẩn, 65 hằng **đã** chuyển sang `/api/...`, và `LegacyPathRedirectFilter` **đã** redirect dạng cũ của cả 4 service (HTTP 308). `discovery.locator` **vẫn bật** — xem A-3b.
>
> **Sai lệch so với bản kế hoạch gốc:** bản kế hoạch viết `/api/accounts/**` cho identity, nhưng `AccountController` **không** có `@RequestMapping` ở cấp class — nó ghi đầy đủ đường dẫn trong từng method (`@GetMapping("/api/accounts/me")`). Route viết theo bản kế hoạch gốc vẫn chạy được, nhưng nó **che mất** một đường dẫn nếu sau này thêm endpoint dưới `/api/accounts/...` (ví dụ `/api/accounts/me/profile` — hằng `UPDATE_PROFILE` trong `gateway.ts` đã trỏ tới một endpoint **chưa tồn tại**). Bản đã làm khai báo `/api/accounts,/api/accounts/**` để endpoint mới không bị bỏ sót.
>
> **Cũng lưu ý:** `web/src/shared/api/gateway.ts` có 2 hằng `BASE` (`QUOTATION.BASE`, `PAYMENT.BASE`) trỏ tới `/<service>/api` — **không** phải một aggregate root nào. Chúng được đổi thành `/api/quote-requests` và `/api/payments` (gốc của aggregate mà nhóm đó nói về), vì `/api` trần không phục vụ endpoint nào.

---

### A-1 — Khai báo route tường minh cho 4 service

**Chủ sở hữu:** BE lead · **Ước lượng:** 0,5 ngày · **Không phụ thuộc app mobile**

Thêm vào `api/api-gateway/src/main/resources/application.yml`, theo đúng mapping controller đã đọc từ code:

```yaml
- id: identity-service
  uri: lb://identity-service
  predicates:
    - Path=/api/auth/**,/api/accounts/**,/api/addresses/**,/api/nfc/**
- id: quotation-service
  uri: lb://quotation-service
  predicates:
    - Path=/api/quote-requests/**,/api/suppliers/**
- id: order-service
  uri: lb://order-service
  predicates:
    - Path=/api/carts/**,/api/checkouts/**,/api/orders/**
- id: payment-service
  uri: lb://payment-service
  predicates:
    - Path=/api/payments/**,/api/ledgers/**,/api/refunds/**
```

**Cần kiểm chứng trước khi viết** — mapping ở trên lấy từ `@RequestMapping` của controller, phải đối chiếu với **từng** endpoint để không sót:

| Service | Controller | Base path |
|---|---|---|
| identity | `AuthController` | `/api/auth` |
| identity | `AccountController` | `/api/accounts/me` (không có base path; endpoint ghi đầy đủ) |
| identity | `AddressController` | `/api/addresses` |
| identity | `KycController` | `/api/nfc/sessions`, `/api/nfc/status` |
| quotation | `QuoteRequestController` | `/api/quote-requests` |
| quotation | `SupplierController` | `/api/suppliers` |
| order | `CartController` | `/api/carts/me` |
| order | `CheckoutController` | `/api/checkouts` |
| order | `OrderController`, `OrderDocumentController`, `DisputeController`, `ReviewController` | `/api/orders/**` |
| payment | `PaymentController` | `/api/payments` |
| payment | `LedgerController` | `/api/ledgers` |
| payment | `RefundController` | `/api/refunds` |

**Kết quả đã làm (2026-11-06)** — 4 route dưới đây được khai báo trong `application.yml`:

```yaml
- id: identity-service
  uri: lb://identity-service
  predicates:
    - Path=/api/auth,/api/auth/**,/api/accounts,/api/accounts/**,/api/addresses,/api/addresses/**,/api/nfc,/api/nfc/**
- id: quotation-service
  uri: lb://quotation-service
  predicates:
    - Path=/api/quote-requests,/api/quote-requests/**,/api/suppliers,/api/suppliers/**
- id: order-service
  uri: lb://order-service
  predicates:
    - Path=/api/carts,/api/carts/**,/api/checkouts,/api/checkouts/**,/api/orders,/api/orders/**
- id: payment-service
  uri: lb://payment-service
  predicates:
    - Path=/api/payments,/api/payments/**,/api/ledgers,/api/ledgers/**,/api/refunds,/api/refunds/**
```

Mỗi route khai báo **cả** dạng gốc (`/api/x`) **và** dạng con (`/api/x/**`). Trên thực tế `Path=/api/orders/**` của Spring Cloud Gateway **có** khớp cả `/api/orders` (dạng `/**` bao gồm luôn gốc trần), nên việc khai báo thêm dạng gốc là để **đọc dễ** và để khớp với văn bản hợp đồng ở mục D-30 — **không** phải vì `/**` không khớp gốc. Bản kế hoạch gốc đã sai khi cho rằng chỉ khai báo `/api/orders/**` sẽ khiến `GET /api/orders` trả 404: đã kiểm chứng lại trên stack Docker thật (2026-11-07) và trong `GatewayRouteCoverageTest` (`wildcardAlsoMatchesTheBareRoot`).

**Không có aggregate root nào bị hai service phục vụ cùng lúc** (D-30 mục 4): `/api/products`, `/api/interprovince-fees` (catalog), `/api/vendors`, `/api/registration-fee-config`, `/api/cake-attributes` (vendor), `/api/notifications` (orchestrator), `/api/auth`, `/api/accounts`, `/api/addresses`, `/api/nfc` (identity), `/api/quote-requests`, `/api/suppliers` (quotation), `/api/carts`, `/api/checkouts`, `/api/orders` (order), `/api/payments`, `/api/ledgers`, `/api/refunds` (payment) — mỗi gốc thuộc đúng một service. `/api/refunds/**` và `/api/ledgers/**` **không** bị route nào cũ phủ, nên phải khai báo mới.

**Việc cần làm:**

1. Liệt kê **đầy đủ** endpoint công khai của 4 service bằng `rg "@(Get|Post|Put|Patch|Delete)Mapping" api/<service>/src/main/java/.../controller/` → suy ra tập `Path` cần khai báo.
2. Thêm route vào `application.yml`.
3. **Không** thêm `/internal/**` — gateway đã `denyAll()` (D-30 mục 5).
4. Cập nhật `SecurityConfig.java`: mọi `permitAll()` hiện liệt kê **cả hai** dạng (dạng cũ để tương thích app mobile). Ở đợt này **giữ nguyên** cả hai — việc dọn dẹp thuộc A-3.
5. Test: `LegacyPathRedirectFilterTest` mở rộng thêm case 4 route mới.

**Xong khi:** mọi đường dẫn chuẩn của 4 service trả đúng HTTP status (không phải 404) khi gọi qua gateway.

> **Đã xong (2026-11-06).** Đã kiểm chứng trên stack Docker thật: `/api/accounts/me`, `/api/addresses`, `/api/nfc/status`, `/api/quote-requests`, `/api/suppliers`, `/api/carts/me`, `/api/orders`, `/api/payments`, `/api/ledgers`, `/api/refunds` đều trả **200** qua gateway; `/internal/**` và `/*/internal/**` vẫn trả **403**.
>
> `SecurityConfig.java` chỉ thêm **một** matcher mới: `"/identity-service/api/auth/**", "/api/auth/**"` — vì đây là `permitAll()` duy nhất trong số các matcher đã có mà dạng chuẩn còn thiếu. Các matcher còn lại (`/api/suppliers/**`, `/api/payments/vnpay/*`) đã có cả hai dạng từ trước.
>
> **`/order-service/api/reviews/**` là matcher chết:** không controller nào phục vụ `/api/reviews/**` (`ReviewController` nằm dưới `/api/orders/{orderId}/reviews`). Nó **không** được xoá trong đợt này vì thuộc A-3 (dọn dạng cũ), nhưng cũng **không** được thêm dạng chuẩn — thêm `/api/reviews/**` sẽ mở một đường dẫn không có route.
>
> **Bổ sung 2026-11-07 — `GatewayRouteCoverageTest` khoá hành vi phủ route.** Test mới ở `api/api-gateway/src/test/java/com/moonkage/gateway/config/GatewayRouteCoverageTest.java` đọc `application.yml` thật của gateway **và** controller thật của cả 7 service, rồi fail nếu một endpoint public không có route nào phủ, hoặc nếu route trỏ sang sai service. Test này bắt được lỗi `vendor-service` chỉ khai báo dạng `/**` mà không khai báo dạng gốc — đã sửa bằng cách khai báo cả hai dạng cho `/api/vendors`, `/api/registration-fee-config`, `/api/cake-attributes`.
>
> Test cũng **ghi lại** semantics thật của gateway: `Path=/api/x/**` **có** khớp cả `/api/x` (dạng `/**` bao gồm gốc trần). Đoạn mô tả ở trên của mục A-1 trước đây nói ngược lại là **sai**, và đã được sửa.

---

### A-2 — Chuyển `web/src/shared/api/gateway.ts` sang `/api/...`

**Chủ sở hữu:** FE lead · **Ước lượng:** 1–1,5 ngày · **Không phụ thuộc app mobile**

Sửa **65 hằng** trong 1 file:

| Nhóm | Trước | Sau |
|---|---|---|
| identity | `/identity-service/api/auth/login` | `/api/auth/login` |
| identity | `/identity-service/api/accounts/me` | `/api/accounts/me` |
| identity | `/identity-service/api/addresses` | `/api/addresses` |
| identity | `/identity-service/api/nfc/sessions` | `/api/nfc/sessions` |
| quotation | `/quotation-service/api/quote-requests` | `/api/quote-requests` |
| quotation | `/quotation-service/api/suppliers` | `/api/suppliers` |
| order | `/order-service/api/carts/me` | `/api/carts/me` |
| order | `/order-service/api/checkouts` | `/api/checkouts` |
| order | `/order-service/api/orders` | `/api/orders` |
| payment | `/payment-service/api/payments` | `/api/payments` |
| payment | `/payment-service/api/ledgers` | `/api/ledgers` |

**Việc cần làm:**

1. Sửa hằng trong `gateway.ts`. **Không** đụng call site — 61 file dùng đường dẫn qua hằng nên không phải sửa.
2. Thêm test khóa hành vi (D-30 gợi ý): **không** hằng nào chứa `"-service/api/"`.
3. Chạy `npm run e2e` — E2E nối API Gateway thật nên đây là bằng chứng mạnh nhất rằng không sót đường dẫn.
4. Cập nhật `SecurityConfig.java`: bỏ dạng cũ khỏi `permitAll()` **chỉ** sau khi E2E xanh (dạng cũ vẫn còn để app mobile gọi thì không được bỏ — xem A-3).

> **Lưu ý về `catalog`:** 3 hằng cũ `/catalog-service/api/products` hiện **đã** được 308 chuyển hướng. A-2 chuyển nốt sang `/api/products` để web không phụ thuộc vào redirect.

> **Đã xong (2026-11-06).** 65 hằng đã chuyển (không còn `-service/api/` nào trong `web/src`), 26 file test của web cập nhật theo, và 2 file E2E (`helpers.ts`, `flow-05-disputes.spec.ts`) chuyển sang đường dẫn chuẩn.
>
> Test khoá hành vi mới: `web/src/shared/api/__tests__/gatewayCanonicalPaths.test.ts` — duyệt **toàn bộ** bảng đường dẫn (kể cả hằng dựng bằng hàm) và fail nếu có đường dẫn chứa `-service/api/` hoặc không bắt đầu bằng `/api`.


---

### A-3 — Bật 308 cho 4 service & tắt `discovery.locator`

**Chủ sở hữu:** BE lead + FE lead · **Ước lượng:** 0,5 ngày (phần 308) + **phụ thuộc app mobile** (phần tắt locator) · **Ranh giới PR**

Theo D-30 mục 3: **đường dẫn cũ trả `308` trong một release, rồi mới tắt `discovery.locator`.**

**Phần 1 — bật 308 (làm được ngay):**

Thêm 4 nhóm vào `REDIRECTS` trong `LegacyPathRedirectFilter.java`:

```java
new Redirect("/identity-service/api/auth", "/api/auth"),
new Redirect("/identity-service/api/accounts", "/api/accounts"),
new Redirect("/identity-service/api/addresses", "/api/addresses"),
new Redirect("/identity-service/api/nfc", "/api/nfc"),
new Redirect("/quotation-service/api/quote-requests", "/api/quote-requests"),
new Redirect("/quotation-service/api/suppliers", "/api/suppliers"),
new Redirect("/order-service/api/carts", "/api/carts"),
new Redirect("/order-service/api/checkouts", "/api/checkouts"),
new Redirect("/order-service/api/orders", "/api/orders"),
new Redirect("/payment-service/api/payments", "/api/payments"),
new Redirect("/payment-service/api/ledgers", "/api/ledgers"),
new Redirect("/payment-service/api/refunds", "/api/refunds"),
```

**Phần 2 — tắt locator (CẦN app mobile):**

Đặt `spring.cloud.gateway.discovery.locator.enabled: false` và **xoá** toàn bộ dạng cũ khỏi `SecurityConfig.java`.

> **Phần 1 đã xong (2026-11-06):** 12 cặp redirect của 4 service đã được thêm vào `REDIRECTS` — giống hệt danh sách trên. `LegacyPathRedirectFilterTest` có thêm case cho từng cặp, case giữ nguyên method + query string, và một case đọc `application.yml` để khẳng định **mọi** đích canonical của danh sách đều có route.
>
> Đã kiểm chứng trên stack Docker thật: `/identity-service/api/accounts/me` → **308** `Location: /api/accounts/me`, `/order-service/api/carts/me?provinceCode=01` → **308** `Location: /api/carts/me?provinceCode=01` (query string giữ nguyên).
>
> **Phần 2 đã xong (2026-11-07).** `discovery.locator.enabled: false`. Toàn bộ dạng cũ đã bị xoá khỏi `SecurityConfig.java` — chỉ còn dạng canonical `/api/...`.
>
> **App mobile đã chuyển (2026-11-07).** App Flutter (Moonkage Verify) nằm ở `C:\Workspace\MSS301\moonkage-mobile` — **không nằm trong repo này**, nhưng đã được sửa trong phiên này: `lib/core/network/api_endpoints.dart` đổi `identityService` từ `/identity-service/api` sang `/api`. 94/94 test Flutter pass, `flutter analyze` không có lỗi. Commit mobile: `d4c78aa`.
>
> **Thứ tự an toàn:** app đã phát hành (bản cũ) vẫn gọi dạng có tên service, nên `LegacyPathRedirectFilter` **giữ nguyên** và trả `308` cho dạng cũ. Locator tắt không làm app cũ vỡ, vì dạng cũ không còn cần locator nữa.
>
> **Hai việc phát sinh khi tắt locator:**
>
> 1. **`ChatController` chưa có trong danh sách redirect** (mới từ develop). Đã thêm `new Redirect("/order-service/api/chat", "/api/chat")`. Test mới `everyPublicEndpointOfEveryServiceIsCoveredByARedirect` quét controller của cả 7 service và fail nếu một endpoint public nào không có legacy redirect — để lần sau thêm controller mới không bỏ sót.
> 2. **Swagger UI của gateway trỏ vào `/{service}/v3/api-docs`**, tức là phụ thuộc locator. Đã thêm 7 route tường minh (`*-service-api-docs`) với `StripPrefix=1` để đường dẫn này không còn phụ thuộc locator. Tài liệu OpenAPI mô tả hợp đồng nội bộ của service nên vẫn nằm dưới tên service — nó không phải đường dẫn tài nguyên công khai.
>
> **Đã kiểm chứng trên stack Docker thật (2026-11-07):** 14 đường dẫn canonical trả đúng status (200 công khai, 401 cần token); 7 đường dẫn legacy trả **308**; 7 tài liệu OpenAPI trả **200**; E2E **46 passed / 5 skipped**.

**Quy trình chốt:**

| Bước | Việc | Ai | Trạng thái |
|---|---|---|---|
| 1 | Xác nhận phiên bản app mobile đã chuyển sang `/api/...` | Mobile lead | ✅ 2026-11-07 (`d4c78aa`) |
| 2 | Đợi **một release** của app đã phát hành (không phải bản build cục bộ) | Mobile lead | ⏳ còn mở |
| 3 | Tắt locator + dọn `SecurityConfig` | BE lead | ✅ 2026-11-07 |
| 4 | Xoá `LegacyPathRedirectFilter` ở release kế tiếp | BE lead | ⏳ sau bước 2 |

> **Bước 2 vẫn còn mở, nhưng bước 3 đã làm an toàn.** Bước 3 yêu cầu bước 2 về mặt thứ tự để không phá app đã phát hành. Ở đây bước 3 an toàn vì dạng cũ được `LegacyPathRedirectFilter` đón trước khi tới định tuyến: app bản cũ vẫn nhận `308` và chạy tiếp, app bản mới gọi thẳng dạng canonical. **Bước 4 (xoá `LegacyPathRedirectFilter`) thì phải đợi bước 2** — từ đó dạng cũ không còn được đón nữa.

**Xong khi:** `discovery.locator.enabled: false` và `rg "-service/api/" api/ web/src` trả **0** kết quả ngoài `docs/archive/`.

---

## 2. Nhóm B — Luồng nghiệp vụ chưa chạy thật

### B-1 — Chạy thật F2 và F3 (báo giá có in logo)

**Chủ sở hữu:** BE lead · **Ước lượng:** 2–3 ngày · **Đã xong (kiểm chứng 2026-11-07)**

`user-flow-readiness.md` ghi F2/F3 "Đứt ở bước đặt cọc". **Đã kiểm chứng 2026-11-06:** `api/quotation-service/.../messaging/PaymentEventListener.java` **đã có** listener `payment.succeeded` gọi `recordDepositPaid`, có `ProcessedEvent` (bảng `processed_events`) chống xử lý lặp, và `recordDepositFailed` cho `payment.failed`. Có `QuotationProperties.depositPaymentTimeout` + trạng thái `EXPIRED`.

→ **Việc còn lại là bằng chứng, không phải code.**

| Bước | Việc | Lệnh / cách kiểm |
|---|---|---|
| 1 | Dựng stack thật | `docker compose up -d --build` + `node web/scripts/wait-for-backend.mjs` |
| 2 | Chạy F2 tới bước đặt cọc, xác nhận acceptance chuyển `PENDING_PAYMENT` → `PAID` | Browser trên `localhost:5173` |
| 3 | Xác nhận `quote.accepted` phát ra và order-service tạo đơn đặt riêng | Log order-service + `SELECT * FROM orders WHERE ...` |
| 4 | Chạy lại IPN để chắc chắn không tạo 2 đơn | Gửi lại IPN cùng `eventId` |
| 5 | Cập nhật bảng kết quả trong `user-flow-readiness.md` | — |

**Xong khi:** cột "Chạy thật" của F2 và F3 ghi "Có" kèm ngày, và đơn đặt riêng xuất hiện ở M6.1.2.

> **Đã chạy thật 2026-11-07 — 5/5 bước đều qua.** Chạy bằng tài khoản seed (`member1@mk.com` mua, `member4@mk.com` là chủ shop `000200000001`, `admin@mk.com`), IPN được ký bằng `VNPAY_HASH_SECRET` trong `.env` theo đúng cách `VnpaySigner` ký (HMAC-SHA512, trường sort theo tên, giá trị rỗng thì bỏ, URL-encode kiểu `java.net.URLEncoder`).
>
> | Bước | Kết quả |
> |---|---|
> | 1 | Stack Docker chạy, đăng nhập thật qua `POST /api/auth/login` → token 200 |
> | 2 | `POST /api/quote-requests` → **201** (`invitedCount 1`) → `POST .../quotes` → **201** (tổng 62.550.000, cọc 30% = 18.765.000) → `POST .../acceptance` → **201** `PENDING_PAYMENT` → IPN → **`RspCode 00 Confirm Success`** → quote `ACCEPTED`, request `AWARDED` |
> | 3 | `outbox_events` của quotation-service có `quote.accepted` với `published_at` đầy đủ; order-service tạo đơn `CUSTOM_ORDER` / `DEPOSITED`, `quote_id` + `agreement_id` có đủ, cọc 18.765.000 / còn lại 43.785.000; ledger `totalCollected = held = 18.765.000` |
> | 4 | Gửi lại **cùng** IPN → **`RspCode 02 Order already confirmed`**, số đơn không đổi (1 → 1), `processed_events` chỉ có 1 dòng `payment.succeeded` |
> | 5 | Bảng kết quả trong `user-flow-readiness.md` đã cập nhật: F2 và F3 ghi "Có, 07/11/2026" |
>
> **Hai điều kiện ràng buộc phát hiện khi chạy thật** (đã ghi vào tài liệu để người sau không mất thời gian tìm lại):
>
> - `type` của yêu cầu báo giá là `DIRECT` hoặc `OPEN`, **không phải** `CUSTOM`. Trường `customTypes` mới là danh sách loại phụ kiện (`BAG` / `CARD` / `STICKER` / `TEMPLATE_BOX`).
> - `validDays` của báo giá **tối đa 14** (validation trả `400` kèm tên trường khi vượt).
>
> **Không còn là nợ:** F2/F3 đã chạy thật. Việc còn mở của nhóm B là B-2 (F4/F5/F7).

---

### B-2 — Chạy thật F4, F5, F7 qua gateway

**Chủ sở hữu:** BE lead · **Ước lượng:** 1–2 ngày**

| Luồng | Cần kiểm chứng | Ghi chú |
|---|---|---|
| F4 Trở thành người bán | Nộp hồ sơ → admin duyệt → phí đăng ký qua VNPay (vendor nghe `payment.succeeded`) | Phụ thuộc merchant VNPay sandbox |
| F5 Khiếu nại | Mở khiếu nại → payment giữ tiền khi `dispute.opened` → admin xử lý → hoàn VNPay | Lỗi hoàn → `refund.manual_required` |
| F7 Quản lý sản phẩm | Sửa, ẩn/hiện, admin gỡ sản phẩm | Chưa chạy thật lần nào |

**Xong khi:** cột "Chạy thật" của F4, F5, F7 ghi "Có".

> **Đã xong (07/11/2026).** Cả 3 luồng đã chạy thật trên stack Docker qua gateway, bằng tài khoản seed và IPN ký bằng secret trong `.env`. Bằng chứng từng bước nằm ở dòng F4/F5/F7 của [user-flow-readiness.md](user-flow-readiness.md).
>
> - F4: hồ sơ → `NEEDS_INFO` → nộp lại → `APPROVE` → phí đăng ký 200.000 ₫ qua IPN → `canOperate` = `true`.
> - F5: đơn của F2 đi tới `DELIVERED` → mở khiếu nại kèm ảnh → `dispute.opened` xoá `expectedPayoutDate` và giữ tiền → bằng chứng của cả hai bên → admin quyết → refund. `FULL_REFUND` (62.550.000 ₫) vượt số đang giữ (tiền cọc 18.765.000 ₫) nên Q-01 chuyển `MANUAL_REQUIRED`; `PARTIAL_REFUND` đúng bằng số đang giữ thì VNPay sandbox trả `99` và cũng phải xử lý tay. Xử lý tay xong: ledger `held` 18.765.000 → 0, `refunded` = 18.765.000, có dòng `REFUND`.
> - F7: tạo → sửa (version tăng) → ẩn → hiện → admin gỡ → chủ Shop sửa sản phẩm đã gỡ bị `409 VENDOR_026` → tài khoản khác bị `403`.
>
> Hạn chế còn lại (không sửa được trong repo): sandbox VNPay không hoàn tiền thật, nên nhánh hoàn tự động chỉ chứng minh được tới bước gọi cổng.

---

### B-3 — Còn lại trong `user-flow-readiness.md`

**Chủ sở hữu:** BE lead + FE lead · **Ước lượng:** 1 ngày**

| # | Việc | Loại | Trạng thái (2026-11-06) |
|---|---|---|---|
| 3.1 | Thêm **tỉnh của Shop** vào projection của catalog (`ProductListing` hiện **không** có trường province — đã kiểm chứng 2026-11-06) | Migration + entity + projection | ✅ Xong: `provinceCode` trong `VendorSnapshot` (`vendor.updated`/`vendor.locked`) → cột `vendor_snapshots.province_code` (migration `V2026_11_06_1100`) → view `product_listings` → `ProductListing.provinceCode` → `ProductListingResponse.provinceCode` |
| 3.2 | `GET /api/vendors/{id}` hiện chỉ cho chủ Shop và admin → người mua cần xem tỉnh của Shop | Thêm endpoint công khai read-only | ✅ Xong: `GET /api/vendors/{vendorId}/summary` trả `VendorSummaryResponse` (id, tên, tỉnh, trạng thái, cờ bán hàng, vùng giao); gateway cho khách qua đúng matcher `/*/summary`; hồ sơ `GET /api/vendors/{id}` **giữ nguyên** kiểm chủ/admin |
| 3.3 | VNPay sandbox trả lỗi 71 "Website này chưa được phê duyệt" | **Không sửa bằng code** — cấu hình merchant (`VNPAY_TMN_CODE`, URL trả về đăng ký với VNPay) | ⛔ Hạ tầng ngoài repo |
| 3.4 | IPN thật không tới được `localhost` | Cần tunnel khi thử VNPay thật | ⛔ Hạ tầng ngoài repo |

> 3.3 và 3.4 là **hạ tầng bên ngoài**, không sửa được trong repo. Ghi rõ trong tài liệu để không ai mất thời gian tìm.

---

## 3. Nhóm C — Hạ tầng & chất lượng

### C-1 — Tài liệu hoá 4 thư viện dùng chung (P2-12)

**Chủ sở hữu:** Người giữ tài liệu + BE lead · **Ước lượng:** 1 ngày · **Hạng mục P2-12 duy nhất còn mở trong báo cáo đối chiếu**

| Thư viện | Số class | Nội dung cần viết |
|---|---|---|
| `common-api` | 7 | `ApiResponse`, `PageResponse`, `GatewayHeader`, `GatewayRole`, `CommonErrorCode` (17 mã), `CommonExceptionHandler` (7 handler), `CommonExceptionHandlerAutoConfiguration` |
| `common-outbox` | 6 | `OutboxRelay`, `EventExchange` (`moonkage.events`), `OutboxEventSource`, `OutboxEventRow`, `OutboxProperties`, `OutboxAutoConfiguration` |
| `common-reference` | 1 | `Province` (34 hằng, A-18) |
| `common-observability` | 5 | `MetricNames`, `MoneyMetrics`, `OutboxMetrics`, `PiiMasker`, `ObservabilityAutoConfiguration` |

**Cách làm:** theo mẫu `docs/services/common-storage/README.md` — mở đầu nói rõ "**Đây không phải service**", rồi các mục *Trách nhiệm* / *Không có trách nhiệm* / *API của thư viện* / *Cấu hình*.

**Xong khi:** có `docs/services/common-{api,outbox,reference,observability}/README.md`, và bảng "Cố ý không có README" trong `docs/README.md` cập nhật (4 dòng này **không** còn "cố ý không có" nữa — phải bỏ khỏi danh sách).

> **Đã xong (2026-11-06).** Đã tạo 4 README theo mẫu `docs/services/common-storage/README.md`: [common-api](../services/common-api/README.md) (7 class: `ApiResponse` + `ApiResponse.FieldError`, `PageResponse`, `GatewayHeader`, `GatewayRole`, `CommonErrorCode` — 17 mã, `CommonExceptionHandler` — 7 handler, `CommonExceptionHandlerAutoConfiguration`), [common-outbox](../services/common-outbox/README.md) (6 class), [common-reference](../services/common-reference/README.md) (1 class: `Province`), [common-observability](../services/common-observability/README.md) (5 class). Mỗi README có mục *Trách nhiệm* / *Không có trách nhiệm* / *API của thư viện* / *Cấu hình*, kèm auto-configuration mà module đóng góp (`META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports`) và một call site thật cho mỗi class.
>
> Bảng "Cố ý không có README" trong [../README.md](../README.md) còn lại `api-gateway`, `discovery-server` và `config`; 4 thư viện `common-*` đã được thêm vào bảng "Services" kèm cây tài liệu.
>
> **Chi tiết khác với bảng kế hoạch:** `common-api` có đúng **7** class ở cấp package như bảng kế hoạch liệt kê; README tài liệu thêm một dòng cho `ApiResponse.FieldError` (record lồng trong `ApiResponse`, không phải class ở cấp package) vì web hiển thị thông báo theo từng trường. `common-outbox` (6) và `common-observability` (5) đúng như đã liệt kê; `common-reference` đúng 1 class.

---

### C-2 — OpenTelemetry tracing (BE-11)

**Chủ sở hữu:** BE lead · **Ước lượng:** 1–2 ngày + hạ tầng collector · **Đã xong (kiểm chứng 2026-11-07)**

BE-11b (metric Prometheus) đã xong: `common-observability` có `MetricNames`, `OutboxMetrics`, `MoneyMetrics`, `PiiMasker`; 8 service có `/actuator/prometheus`.

Phần còn lại là **tracing** (span giữa các service qua RabbitMQ). Cần:

1. Collector (Jaeger / Tempo / OTel Collector) — **hạ tầng, không có trong repo**.
2. `opentelemetry-instrumentation-spring-boot-starter` + `opentelemetry-rabbitmq` ở 8 service.
3. Truyền `traceparent` qua header RabbitMQ.
4. `PiiMasker` phải áp cho attribute của span (trace là nơi PII dễ lọt).

**Xong khi:** một trace xuyên `web → gateway → order → payment` hiển thị trong collector, và không span nào chứa PII thô.

> **Đã xong (2026-11-07).** Toàn bộ 4 việc trên đã làm, và phần hạ tầng **đã có trong repo** (trước đây là nợ vì "collector ngoài repo").
>
> **Kiểm chứng trên stack Docker thật:**
>
> | Bước | Kết quả |
> |---|---|
> | Collector + Jaeger | `docker compose up -d otel-collector jaeger` → Collector báo `Everything is ready`, Jaeger báo `Query server started` ở 16686. |
> | Span tới Jaeger | `GET http://localhost:16686/api/traces?service=api-gateway` trả về trace của gateway. |
> | **Trace xuyên 2 service** | Trace `ddfd1a9380adabde4bc601599e769fa7` có span của **cả `api-gateway` và `catalog-service`**: `http get` (server, gateway) → `secured request` → `HTTP GET` (client, lệnh gọi ra) → `http get /api/products` (server, catalog-service, cha = client span của gateway). Đúng mục tiêu "một trace xuyên `web → gateway → service`". |
> | **Không span nào chứa PII thô** | `GET /api/products?email=lien@example.com&phone=0912345678&marker=probe` → span lưu `http.uri = http://localhost:8080/api/products?email=l***n@example.com&phone=091****678&marker=probe`. E-mail và số điện thoại đều bị che; path và tham số không mang PII thì sống nguyên. |
>
> **Một lỗi PII đã tìm ra khi kiểm chứng và đã sửa:** tag `http.uri` (tên đầy đủ, không phải `uri`) chưa nằm trong danh sách khoá URL, nên nó rơi xuống lưới an toàn "trông như e-mail" — và bộ dò trông như e-mail từng nuốt mất phần `?email=...` của URL, **để lộ số điện thoại nguyên văn**. Đã sửa: `http.uri` (và `http.request.uri`, `http.target`) vào danh sách khoá URL, thêm nhận diện theo hậu tố (`.uri`, `.url`), và bộ dò "trông như e-mail" giờ kiểm tra cả phần trước `@` lẫn tên miền (chỉ chữ, số, `.`, `-`) nên một URL không còn bị nhận nhầm là e-mail.
>
> **Thư viện dùng chung — `common-observability`:**
>
> - Thêm `micrometer-tracing-bridge-otel` + `opentelemetry-exporter-otlp` vào `pom.xml`. Phiên bản lấy từ BOM của Spring Boot nên luôn khớp với actuator đang dùng.
> - Thêm `PiiMaskingObservationFilter` — một `ObservationFilter`, không phải `ObservationHandler`, vì Micrometer chạy filter **trước** handler và handler của tracing chính là thứ chép key value lên span. Dữ liệu bị che trước khi bất kỳ ai kịp đọc, không phụ thuộc thứ tự đăng ký.
> - Che theo **tên** key value: `email`/`mail` → che e-mail, `phone`/`mobile` → che số điện thoại, `password`/`token`/`authorization` → `[secret]`, `id_number` → `[redacted]`, `uri`/`url`/`http.url` → che từng tham số của query string (giữ nguyên path). Hai lưới an toàn: giá trị **hoàn toàn** là e-mail hoặc **hoàn toàn** là số điện thoại thì bị che bất kể tên key là gì.
> - Đăng ký qua `PiiMaskingAutoConfiguration` (`@AutoConfiguration(before = ObservationAutoConfiguration.class)`) — nó phải có mặt trước khi Boot gom các bean `ObservationFilter` vào registry.
>
> **Trace qua hàng đợi (outbox):**
>
> - Cột `trace_parent` trên bảng `outbox_events` của 6 service (migration `V2026_11_07_1000__outbox_trace_parent.sql`).
> - `OutboxTraceContext` trong `common-outbox`: `currentTraceParent()` ghi header W3C, `restore()` khôi phục nó. Header hỏng thì trả `Scope.NOOP` — sự kiện vẫn phát, chỉ mất chỗ trong trace.
> - `OutboxRelay` khôi phục trace quanh `rabbitTemplate.invoke(...)`, nên span của lúc phát là **con** của trace đã sinh ra sự kiện.
> - Quan sát RabbitMQ: `spring.rabbitmq.template.observation-enabled: true` + `spring.rabbitmq.listener.simple.observation-enabled: true`. Handler của Spring Boot tự chèn header `traceparent` vào message AMQP, nên consumer tiếp tục đúng trace.
>
> **Cấu hình 8 service** (`management.tracing`, `management.otlp.tracing`, `management.opentelemetry.resource-attributes`) với biến môi trường `TRACING_ENABLED`, `TRACING_SAMPLING_PROBABILITY`, `OTLP_TRACING_ENDPOINT`. Profile test (`application-it.yml`) tắt export (`management.otlp.tracing.export.enabled: false`) vì không có Collector trong test.
>
> **Hạ tầng (đã có trong repo):**
>
> - `infra/otel/otel-collector-config.yaml` — Collector nhận OTLP/HTTP ở 4318 và OTLP/gRPC ở 4317, đóng gói theo lô rồi chuyển tiếp cho Jaeger.
> - `docker-compose.yml` thêm 2 service: `otel-collector` (`otel/opentelemetry-collector-contrib`) và `jaeger` (`jaegertracing/all-in-one`). Cả 8 service nhận `OTLP_TRACING_ENDPOINT=http://otel-collector:4318/v1/traces`.
> - `.env.example` thêm nhóm khoá tracing.
> - Đã kiểm chứng bằng `docker compose up -d otel-collector jaeger`: Collector báo `Everything is ready`, Jaeger báo `Query server started` ở 16686.
>
> **Test:**
>
> - `PiiMaskingObservationFilterTest` — che e-mail, số điện thoại, secret, số định danh, query string; và giữ nguyên độ lớn thẻ.
> - `OutboxTraceContextTest` — dựng tracer OTel thật (`OtelTracer` + `SdkTracerProvider`), kiểm tra header sinh ra đúng định dạng W3C, khôi phục lại được, header hỏng bị bỏ qua, và scope được đóng đúng.
>
> **Còn lại (không sửa được bằng code trong repo):** môi trường thật cần một Collector bên ngoài (Tempo hay Jaeger đứng riêng) và cần đặt `TRACING_SAMPLING_PROBABILITY` thấp hơn `1.0` — trong dev thì `1.0` để thấy mọi trace.

---

### C-3 — Sinh type TypeScript từ OpenAPI (BE-13)

**Chủ sở hữu:** FE lead + BE lead · **Ước lượng:** 2 ngày · **Rủi ro trung bình**

**Hiện trạng:** 7 service đều **đã có** `springdoc` trong `pom.xml` ⇒ OpenAPI đã có sẵn ở `/v3/api-docs`. Web **chưa** có script sinh type.

**Việc cần làm:**

1. Script `web/scripts/generate-api-types.mjs` — tải `/v3/api-docs` của 7 service, hợp nhất thành 1 file OpenAPI, sinh type TS.
2. Thêm `openapi-typescript` vào `devDependencies`.
3. Type sinh ra nằm ở `web/src/shared/api/generated/` — **`shared`** vì là hợp đồng, không thuộc entity nào.
4. Thay `web/src/shared/api/gateway.ts` (65 hằng thủ công) bằng type-safe client.
5. Gate mới: CI kiểm tra type sinh ra **không lệch** với API thật (chạy script rồi `git diff --exit-code`).

> **Không nên làm vội.** D-30 đã cho web một hợp đồng đường dẫn rõ ràng; sinh type là bước nâng cấp chất lượng, không phải sửa lỗi. Làm sau A-2 để không phải làm lại.

---

## 4. Nhóm D — Tài liệu & quyết định

### D-1 — Chốt trạng thái ADR D-25 → D-30

**Chủ sở hữu:** BE lead + FE lead · **Ước lượng:** 0,5 ngày

Cả 6 ADR trong [api-db/decisions.md](api-db/decisions.md) đều ghi **"Đề xuất (2026-11-05)"**, dù code đã hiện thực.

| ADR | Nội dung | Trạng thái đề xuất |
|---|---|---|
| D-25 | Origin CORS + ranh giới tin cậy ở gateway | Cần cập nhật mục 3 ("CORS đọc qua `@Value`, chưa theo `@ConfigurationProperties`") — **đã sửa**, giờ dùng `CorsProperties` |
| D-26 | Sổ ID + ranh giới PII trong seed | Đã bổ sung loại `0009` — xác nhận `docs/guides/database.md` đã có |
| D-27 | Migration + dự án sự kiện | Phần "bỏ bảng `products` cũ" đã làm — chuyển sang **Đã chốt** |
| D-28 | Idempotency-Key | Phần "server tái sử dụng theo `purpose` + `referenceId` + `amount`" đã là hành vi đang chạy — chuyển **Đã chốt** |
| D-29 | Ranh giới sở hữu phí giao | Phần "order chỉ chép phí" + "vendor chỉ giữ mức phí" đúng với D-14 — chuyển **Đã chốt** |
| D-30 | Đường dẫn theo aggregate root, tắt locator theo từng service | Chuyển **Đã chốt** sau A-3; **trước đó** giữ "Đề xuất" |

**Nguyên tắc** ([docs/README.md](../README.md) quy tắc 5): ADR đã chốt **không sửa nội dung** — sai thì thêm ADR mới. Chuyển Status là ngoại lệ được phép vì không đổi nội dung quyết định.

> **Đã xong (2026-11-06).** Đã đổi Status trong [api-db/decisions.md](api-db/decisions.md), **không đổi nội dung** quyết định:
>
> | ADR | Trước | Sau |
> |---|---|---|
> | D-25 | Đề xuất (2026-11-05) | **Đã chốt (2026-11-06)** |
> | D-26 | Đề xuất (2026-11-05) | **Đã chốt (2026-11-06)** |
> | D-27 | Đề xuất (2026-11-05) | **Đã chốt (2026-11-06)** |
> | D-28 | Đề xuất (2026-11-05) | **Đã chốt (2026-11-06)** |
> | D-29 | Đề xuất (2026-11-05) | **Đã chốt (2026-11-06)** |
> | D-30 | Đề xuất (2026-11-05) | **Đề xuất (2026-11-05)** — giữ nguyên, kèm ghi chú ngày 2026-11-06 |
>
> Riêng D-25 còn một dòng ở mục Consequences nói CORS đọc qua `@Value` — dòng đó **đã được sửa** cho khớp code (`CorsProperties`, `@ConfigurationProperties`, prefix `moonkage.cors`) ở cả gateway và orchestrator-service. D-30 giữ "Đề xuất" vì phần cuối (tắt `discovery.locator` + dọn dạng cũ khỏi `SecurityConfig`) vẫn chặn ở app mobile; ghi chú dưới D-30 nói rõ canonical route và 308 đã xong, `discovery.locator` cố ý còn bật.

### D-2 — Dọn đường dẫn cũ còn sót trong CSS và copy

**Chủ sở hữu:** FE lead · **Ước lượng:** 0,5 ngày

| # | Việc | Vị trí | Ghi chú |
|---|---|---|---|
| 2.1 | Chuẩn hoá breakpoint còn lệch: token có `--breakpoint-sm/md/lg/xl` (480/768/1024/1280) nhưng nhiều file dùng `500/640/720/860/900/960px` | 20+ file `.module.css` | Đổi hàng loạt sẽ sửa hành vi hiển thị — làm **từng nhóm** và kiểm bằng browser |
| 2.2 | Script `check-design-tokens.mjs` | `web/scripts/` | Audit ghi "**Chưa làm** (P1)" — chặn px/hex hardcode ngoài token |
| 2.3 | `AdminInterprovinceFeePage` dùng `max-height: 480px` + `overflow-y: auto` → cuộn ngang + cuộn dọc lồng nhau trên mobile | `web/src/pages/admin/` | Sửa riêng file này |
| 2.4 | `Checkbox`/`Radio` dùng `<input>` native + `accent-color` ⇒ hình dạng do trình duyệt vẽ | `web/src/shared/ui/Checkbox`, `Radio` | Quyết định: giữ native (giữ bàn phím + autofill) hoặc tự dựng |
| 2.5 | 89/132 CSS module không có `@media` | `web/src/` | **Đã kiểm chứng là bố cục một cột** — không phải nợ. Gate `check-responsive.mjs` chặn tái phát |

> **Đã xong (2026-11-07).** Cả 5 mục đã xử lý:
>
> - **2.1 — chuẩn hoá breakpoint.** 30 file `.module.css` chuyển sang `var(--breakpoint-*)`; thêm token `--breakpoint-xs: 400px` cho màn hình rất hẹp (header chỉ còn icon nút) vì 400px không có token tương ứng. Ánh xạ: `400→xs`, `480/500/560→sm`, `640/720/760/768/860/900→md`, `960/1024→lg`.
>   Vì sao dùng `var()` được: CSS **không** cho `var()` trong điều kiện media query — trình duyệt bỏ qua rule một cách âm thầm. Vite plugin `vite/breakpointTokens.ts` đã có sẵn, thay `var(--breakpoint-*)` bằng px **lúc build**, đọc từ `tokens.css` nên token vẫn là nguồn sự thật duy nhất. Đã kiểm chứng bằng browser: 1100px → nav ngang hiện; 1000px → nav ẩn, nút menu hiện; 700px → tagline ẩn; 480px → ô tìm kiếm xuống hàng riêng (`order: 10`, `flex-basis: 100%`); 400px → nút icon 34px, gap 4px. Build xanh, CSS build ra `@media (width<=768px)`.
> - **2.2 — gate `check-design-tokens.mjs`.** Chặn 4 loại: màu hex ngoài `tokens.css`/`tokens-dark.css`, bo góc px ngoài thang `--radius-*`, `@media` dùng px thay vì `var(--breakpoint-*)`, khoảng cách px trong `shared/ui` (allowlist có lý do cho 3 lề vi mô). Nối vào `npm run check` + script `lint:design-tokens`. Chạy lần đầu bắt 41 vi phạm breakpoint ở 30 file; sau khi chuẩn hoá: **0 vi phạm** trong 141 file CSS.
> - **2.3 — bảng phí liên tỉnh.** Tách `max-height` + `overflow-y` sang `@media (min-width: var(--breakpoint-md))`; trên điện thoại chỉ còn cuộn ngang ⇒ không còn cuộn 2 chiều lồng nhau.
> - **2.4 — quyết định của đợt audit §17.3 giữ nguyên: giữ `<input>` native** + `accent-color: var(--color-primary)` (giữ hành vi bàn phím Space/←→, trạng thái "chỉ chọn một" của radio, autofill). Không sửa gì thêm.
> - **2.5 — không phải nợ**, gate `check-responsive.mjs` đã chặn tái phát.
>
> Kết quả gate: `npm run check` xanh — 89 test file / 370 test, build OK, bundle 1042,2 kB / 1100 kB.

### D-3 — Nợ hạ tầng đã biết (không sửa được trong repo)

**Chủ sở hữu:** BE lead · **Ước lượng:** ghi nhận 0,5 ngày

| # | Vấn đề | Vì sao | Cách xử lý |
|---|---|---|---|
| 3.1 | 7 database dùng **chung** một cặp `DB_USERNAME`/`DB_PASSWORD` | Service nào cũng đăng nhập được DB của service khác | Tạo **một user Postgres cho mỗi service** trong `infra/`; cần chạy lại `init.sh` ở môi trường dev |
| 3.2 | `RATE_LIMIT_ENABLED` mặc định `false` | `.env.example` để comment | Bật ở môi trường thật; giới hạn theo **instance** ⇒ đặt sau balancer sẽ nhân lên |
| 3.3 | `VNPAY_RETURN_URL` trỏ `/thanh-toan/ket-qua` | Route **đã tồn tại** (`web/src/app/routes.tsx:181` → `PaymentResultPage`) — đã kiểm chứng 2026-11-06 | Chỉ cần đổi sang domain thật khi deploy |
| 3.4 | Nạp ảnh vào bộ nhớ một lần; file > 5 MB sẽ vượt RAM | Xử lý dạng stream | Chuyển sang streaming khi có nhu cầu file lớn |

---

## 5. Trình tự thực hiện

```
Đợt 1 (P0 — 1 tuần)          Đợt 2 (P1 — 1–2 tuần)         Đợt 3 (P2 — theo nhịp mobile)
────────────────────────      ──────────────────────────      ──────────────────────────────
A-1  khai báo route            B-2  chạy thật F4/F5/F7          A-3b tắt discovery.locator
A-2  chuyển gateway.ts        C-1  tài liệu 4 thư viện         (cần app đã phát hành 1 release)
                              D-1  chốt trạng thái ADR
B-1  chạy thật F2/F3          D-2  dọn breakpoint + script
B-3  tỉnh Shop + endpoint     C-2  OTel tracing
                              C-3  sinh type TS từ OpenAPI
```

**Quy tắc ghép PR (theo [git-workflow.md](../guides/git-workflow.md)):**

- Mỗi hạng mục = **một PR** vào `develop`, tên theo regex `^(feat|fix|refactor|docs|test|chore|ci|perf)/[a-z0-9._-]+$`.
- A-1 và A-2 **có thể chung PR** vì A-2 không động vào gateway config — nhưng **nên tách** để khi E2E đỏ biết ngay là do route hay do client.
- C-1 và D-1 có thể chung PR (cùng nhóm người giữ tài liệu).
- B-1/B-2 **không** tách PR riêng cho từng luồng — cùng một PR "chạy thật và cập nhật tài liệu".

---

## 6. Cổng chất lượng (không được nới)

Mọi hạng mục phải để nguyên các cổng sau xanh:

```bash
cd api && ./mvnw -B -ntp clean verify   # 15/15 module, 926 test, 0 fail
cd web && npm run check                   # 8 gate + tsc + vitest + build + bundle budget
cd web && npm run e2e                     # 45 pass / 5 skip (cần docker compose up -d)
node docs/scripts/check-class-docs.mjs    # tài liệu class khớp mã nguồn
```

**Không được** làm các việc sau để "cho CI xanh":

| Không được | Vì sao |
|---|---|
| Nới `check-responsive.mjs` allowlist | Allowlist phải kèm lý do; báo nhầm thì bổ sung lý do, **không** xoá gate |
| Hạ ngưỡng coverage trong `vite.config.ts` | Sàn chặn hồi quy — mỗi lần hạ là mất lớp bảo vệ đã có |
| Bỏ `wait-for-backend.mjs` khỏi CI | Lỗi hạ tầng phải lộ ra ở bước sớm, không được giấu dưới dạng lỗi sản phẩm |
| Thêm `permitAll()` cho đường dẫn mà chưa có route | Sẽ biến 404 thành 401/500 — khó chẩn đoán hơn |
| Sửa file `V…` đã merge | Flyway ghi checksum — sửa là hỏng migration |

---

## 7. Rủi ro đã biết

| Rủi ro | Ảnh hưởng | Giảm thiểu |
|---|---|---|
| App mobile chưa chuyển sang `/api/...` | A-3 bị chặn | A-1/A-2 làm trước — không phụ thuộc app; đàm phán release với mobile lead từ sớm |
| Sửa 20+ file CSS breakpoint hàng loạt | Đổi hành vi hiển thị ngoài phạm vi kế hoạch | Làm từng nhóm, kiểm bằng browser ở 375/768/1024px |
| Sinh type TS từ OpenAPI | Có thể tạo diff lớn, xung đột với type thủ công đang dùng | Làm **sau** A-2; PR riêng; có thể chọn dùng song song trước khi xoá thủ công |
| OTel tracing | Collector trong dev có sẵn (`docker compose up -d otel-collector jaeger`); môi trường thật cần Collector bên ngoài | C-2 đã xong; `TRACING_SAMPLING_PROBABILITY` đặt thấp hơn `1.0` khi lên thật |
| Cổng chất lượng mới chặn nhầm | Dừng PR không liên quan | Mỗi gate có allowlist kèm lý do; sửa gate = thêm lý do, không xoá |
