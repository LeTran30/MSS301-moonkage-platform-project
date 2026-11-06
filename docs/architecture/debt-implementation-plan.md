# Kế hoạch thực hiện — các việc còn nợ sau đợt chuẩn hoá kiến trúc 2026-11-06

> **Trạng thái:** Đề xuất (2026-11-06). Khi mọi hạng mục đã xong thì chuyển vào `archive/` theo [quy tắc 6](../README.md).
> **Căn cứ:** [codebase-conformance-review.md](codebase-conformance-review.md) (33/33 phát hiện đã đóng, còn 1 hạng mục `P2-12`), [be-improve-progress-2026-11-04.md](be-improve-progress-2026-11-04.md) §6 (BE-06, BE-11, BE-13, BE-14, BE-15), [user-flow-readiness.md](user-flow-readiness.md) (F2–F7 chưa chạy thật), [web/doc/ui-ux-audit-2026-11-05.md](../../web/doc/ui-ux-audit-2026-11-05.md) §17.8, [api-db/decisions.md](api-db/decisions.md) (D-25 → D-30 còn "Đề xuất").
> **Nhánh hiện tại:** `feat/ui-ux-standardization` @ `c66bae7` · **PR:** [#98](https://github.com/LeTran30/MSS301-moonkage-platform-project/pull/98)

---

## 0. Tóm tắt

Còn **9 hạng mục** trong **4 nhóm**. Tổng ước lượng **13–17 ngày công**.

| Nhóm | Hạng mục | Ước lượng | Phụ thuộc | Ưu tiên |
|---|---|---|---|---|
| **A. Đường dẫn API** | A-1 · A-2 · A-3 | 3–4 ngày | A-1 → A-2 → A-3 | **P0** |
| **B. Luồng nghiệp vụ** | B-1 · B-2 · B-3 | 4–5 ngày | B-1 → B-2 | **P0** |
| **C. Hạ tầng & chất lượng** | C-1 · C-2 · C-3 | 3–4 ngày | độc lập | **P1** |
| **D. Tài liệu & quyết định** | D-1 · D-2 · D-3 | 3–4 ngày | độc lập | **P1** |

> **Điểm quan trọng nhất của kế hoạch này:** phần lớn việc còn nợ **không** phụ thuộc app mobile. Chỉ **A-3 (tắt `discovery.locator`)** là cần xác nhận từ bên ngoài repo. Vì vậy A-1 và A-2 có thể làm ngay.

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

**Việc cần làm:**

1. Liệt kê **đầy đủ** endpoint công khai của 4 service bằng `rg "@(Get|Post|Put|Patch|Delete)Mapping" api/<service>/src/main/java/.../controller/` → suy ra tập `Path` cần khai báo.
2. Thêm route vào `application.yml`.
3. **Không** thêm `/internal/**` — gateway đã `denyAll()` (D-30 mục 5).
4. Cập nhật `SecurityConfig.java`: mọi `permitAll()` hiện liệt kê **cả hai** dạng (dạng cũ để tương thích app mobile). Ở đợt này **giữ nguyên** cả hai — việc dọn dẹp thuộc A-3.
5. Test: `LegacyPathRedirectFilterTest` mở rộng thêm case 4 route mới.

**Xong khi:** mọi đường dẫn chuẩn của 4 service trả đúng HTTP status (không phải 404) khi gọi qua gateway.

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

**Điều kiện tiên quyết — không nằm trong repo này:**

> App Flutter (Moonkage Verify) gọi dạng có tên service và **không nằm trong repo này** (`mobile/` không tồn tại — đã kiểm chứng 2026-11-06).

**Quy trình chốt:**

| Bước | Việc | Ai |
|---|---|---|
| 1 | Xác nhận phiên bản app mobile đã chuyển sang `/api/...` | Mobile lead |
| 2 | Đợi **một release** của app đã phát hành (không phải bản build cục bộ) | Mobile lead |
| 3 | Tắt locator + dọn `SecurityConfig` | BE lead |
| 4 | Xoá `LegacyPathRedirectFilter` ở release kế tiếp | BE lead |

**Xong khi:** `discovery.locator.enabled: false` và `rg "-service/api/" api/ web/src` trả **0** kết quả ngoài `docs/archive/`.

---

## 2. Nhóm B — Luồng nghiệp vụ chưa chạy thật

### B-1 — Chạy thật F2 và F3 (báo giá có in logo)

**Chủ sở hữu:** BE lead · **Ước lượng:** 2–3 ngày · **Việc đã được khép lại trong code, cần kiểm chứng**

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

---

### B-2 — Chạy thật F4, F5, F7 qua gateway

**Chủ sở hữu:** BE lead · **Ước lượng:** 1–2 ngày**

| Luồng | Cần kiểm chứng | Ghi chú |
|---|---|---|
| F4 Trở thành người bán | Nộp hồ sơ → admin duyệt → phí đăng ký qua VNPay (vendor nghe `payment.succeeded`) | Phụ thuộc merchant VNPay sandbox |
| F5 Khiếu nại | Mở khiếu nại → payment giữ tiền khi `dispute.opened` → admin xử lý → hoàn VNPay | Lỗi hoàn → `refund.manual_required` |
| F7 Quản lý sản phẩm | Sửa, ẩn/hiện, admin gỡ sản phẩm | Chưa chạy thật lần nào |

**Xong khi:** cột "Chạy thật" của F4, F5, F7 ghi "Có".

---

### B-3 — Còn lại trong `user-flow-readiness.md`

**Chủ sở hữu:** BE lead + FE lead · **Ước lượng:** 1 ngày**

| # | Việc | Loại |
|---|---|---|
| 3.1 | Thêm **tỉnh của Shop** vào projection của catalog (`ProductListing` hiện **không** có trường province — đã kiểm chứng 2026-11-06) | Migration + entity + projection |
| 3.2 | `GET /api/vendors/{id}` hiện chỉ cho chủ Shop và admin → người mua cần xem tỉnh của Shop | Thêm endpoint công khai read-only |
| 3.3 | VNPay sandbox trả lỗi 71 "Website này chưa được phê duyệt" | **Không sửa bằng code** — cấu hình merchant (`VNPAY_TMN_CODE`, URL trả về đăng ký với VNPay) |
| 3.4 | IPN thật không tới được `localhost` | Cần tunnel khi thử VNPay thật |

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

---

### C-2 — OpenTelemetry tracing (BE-11)

**Chủ sở hữu:** BE lead · **Ước lượng:** 1–2 ngày + hạ tầng collector · **Phụ thuộc hạ tầng ngoài repo**

BE-11b (metric Prometheus) đã xong: `common-observability` có `MetricNames`, `OutboxMetrics`, `MoneyMetrics`, `PiiMasker`; 8 service có `/actuator/prometheus`.

Phần còn lại là **tracing** (span giữa các service qua RabbitMQ). Cần:

1. Collector (Jaeger / Tempo / OTel Collector) — **hạ tầng, không có trong repo**.
2. `opentelemetry-instrumentation-spring-boot-starter` + `opentelemetry-rabbitmq` ở 8 service.
3. Truyền `traceparent` qua header RabbitMQ.
4. `PiiMasker` phải áp cho attribute của span (trace là nơi PII dễ lọt).

**Xong khi:** một trace xuyên `web → gateway → order → payment` hiển thị trong collector, và không span nào chứa PII thô.

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

### D-2 — Dọn đường dẫn cũ còn sót trong CSS và copy

**Chủ sở hữu:** FE lead · **Ước lượng:** 0,5 ngày**

| # | Việc | Vị trí | Ghi chú |
|---|---|---|---|
| 2.1 | Chuẩn hoá breakpoint còn lệch: token có `--breakpoint-sm/md/lg/xl` (480/768/1024/1280) nhưng nhiều file dùng `500/640/720/860/900/960px` | 20+ file `.module.css` | Đổi hàng loạt sẽ sửa hành vi hiển thị — làm **từng nhóm** và kiểm bằng browser |
| 2.2 | Script `check-design-tokens.mjs` | `web/scripts/` | Audit ghi "**Chưa làm** (P1)" — chặn px/hex hardcode ngoài token |
| 2.3 | `AdminInterprovinceFeePage` dùng `max-height: 480px` + `overflow-y: auto` → cuộn ngang + cuộn dọc lồng nhau trên mobile | `web/src/pages/admin/` | Sửa riêng file này |
| 2.4 | `Checkbox`/`Radio` dùng `<input>` native + `accent-color` ⇒ hình dạng do trình duyệt vẽ | `web/src/shared/ui/Checkbox`, `Radio` | Quyết định: giữ native (giữ bàn phím + autofill) hoặc tự dựng |
| 2.5 | 89/132 CSS module không có `@media` | `web/src/` | **Đã kiểm chứng là bố cục một cột** — không phải nợ. Gate `check-responsive.mjs` chặn tái phát |

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
| OTel tracing | Không có collector ở môi trường dev | C-2 chỉ làm khi hạ tầng có sẵn; metric đã đủ cho vận hành |
| Cổng chất lượng mới chặn nhầm | Dừng PR không liên quan | Mỗi gate có allowlist kèm lý do; sửa gate = thêm lý do, không xoá |
