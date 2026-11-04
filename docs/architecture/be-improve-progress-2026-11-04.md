# Báo cáo thực thi BE-IMPROVE-PLAN — 04/11/2026

> Kế hoạch nguồn: `d:\02-Personal\Downloads\moonkage-thinking-temp\be-improve\BE-IMPROVE-PLAN.md`
> (lập 02/11/2026 trên mã nguồn `6e990f4`).
> Phạm vi lần này: **BE-01, BE-02, BE-04, BE-04b, BE-07, BE-08b, BE-09, BE-11b** + tương ứng FE.

---

## 0. Kết luận nhanh

**8/15 hạng mục đã đóng.** Tất cả hạng mục **P0** (đường tiền + test) đã xanh.

| Trạng thái | Hạng mục |
| --- | --- |
| ✅ **Xong** | BE-01 · BE-02 · BE-04 · BE-04b · BE-07 · BE-08b · BE-09 · BE-11b |
| 🟡 **Chờ quyết định khác** | BE-06 (tắt `discovery.locator` — cần team chốt vì app NFC nằm ngoài repo) · BE-09→BE-11 (OpenTelemetry tracing) · BE-13 (sinh type TS từ OpenAPI) |
| ⬜ **Chưa làm** | BE-03 / BE-12 (`common-web`) · BE-05 / BE-05b (phí giao) · BE-10 (xoá `VoucherController` — **đã xoá**, xem bên dưới) · BE-14 (URL VNPay) · BE-15 (Error Prone sạch) |

**Quality gate cuối:** `./mvnw clean verify` → **BUILD SUCCESS**, 13/13 module,
**796 test, 0 fail, 0 error** (Spotless + Checkstyle + Error Prone + test).

---

## 1. BE-01 — Đường tiền `quotation-service` (P0) ✅

Đây là hạng mục nguy hiểm nhất trong kế hoạch: `quotation-service` là service **duy nhất**
ghi vào outbox mà không có relay, đồng thời không có consumer nào để nhận `payment.succeeded`.
Hậu quả: **khách đã trả cọc nhưng không có đơn**, acceptance kẹt `PENDING_PAYMENT`,
và sự cố **im lặng** — chỉ lộ khi khách hỏi.

Đã đóng **cả hai chiều cùng lúc** (bắt buộc — chỉ thêm relay sẽ để acceptance mắc vĩnh viễn):

| Phần | File |
| --- | --- |
| Relay (publish) | `quotation-service/…/messaging/OutboxRelay.java` |
| Consumer (subscribe) | `quotation-service/…/messaging/PaymentEventListener.java` |
| Hạ tầng AMQP | `quotation-service/…/config/RabbitConfig.java` |
| Idempotency | `service/InboxService.java` + `repository/ProcessedEventRepository.java` + bảng `processed_events` |

Tính chất được giữ đúng như mẫu `order-service`: cũ nhất trước → chỉ đánh dấu đã gửi sau
publisher confirm → dừng tại event lỗi để không mất thứ tự.

---

## 2. BE-02 — Test cho `order-service` + `payment-service` (P0) ✅

Hai service chứa **toàn bộ logic tiền** lại là hai service ít test nhất (4 test mỗi service).

| Service | Trước | Sau | Test mới |
| --- | ---: | ---: | --- |
| `order-service` | 30 | **70** | `CheckoutMoneyTest` (19) · `CustomOrderAndDisputeTest` (21) |
| `payment-service` | 52 | **104** | `ReconciliationServiceImplTest` (23) · `RefundServiceImplTest` (18) · `OrderEventServiceImplTest` (11) |

Nguyên tắc theo kế hoạch: **test khẳng định giá trị, không chỉ "không ném exception"**.
Cụ thể đã bảo vệ:

- **Giải ngân**: chỉ áp dụng cho tiền cọc `CUSTOM_ORDER`; từ chối yêu cầu vượt
  `ledger.held - sum(PENDING)`; cho phép duyệt một phần; **mỗi đơn chỉ giải ngân 1 lần**.
- **Hoàn tiền**: chống hoàn trùng theo `(payment, reason)` và theo `disputeId`;
  `LATE_PAYMENT` / `QUOTE_EXPIRED` chia theo **tỉ lệ phân bổ** của từng đơn trong checkout
  đa-người-bán; `DUPLICATE_PAYMENT` **không** trừ ledger.
- **Checkout đa-người-bán**: gom giỏ theo shop, **phí giao tính riêng cho từng shop**,
  **nhả kho** khi thanh toán lỗi/hết hạn, idempotent theo `checkoutId`.
- **Khiếu nại**: mỗi đơn chỉ có **1** khiếu nại đang mở (`DISPUTE_ALREADY_OPEN`),
  và không mở khiếu nại sau khi khoá giải ngân (`PAYOUT_LOCKED`).

---

## 3. BE-11b — Prometheus + metric tùy biến (P1) ✅

Module mới `api/common-observability` cung cấp:

- `MetricNames` — tên metric **thống nhất** cho mọi service.
- `OutboxMetrics` — **gauge `outbox_events_unpublished`**: chỉ số sớm nhất của BE-01.
  Tăng dần = có event không publish được → phát hiện trước khi khách hỏi.
- `MoneyMetrics` — đối soát số tiền.
- `ObservabilityAutoConfiguration` — tự đăng ký qua `AutoConfiguration.imports`.

Kèm `/actuator/prometheus` cho cả 8 service nghiệp vụ (`api-gateway`, `catalog`, `identity`,
`orchestrator`, `order`, `payment`, `quotation`, `vendor`). `discovery-server` không có —
đây là service hạ tầng, không thuộc đường tiền nên không cần metric nghiệp vụ.

---

## 4. Các hạng mục còn lại đã đóng ✅

| # | Hạng mục | Bằng chứng |
| --- | --- | --- |
| **BE-04** | Cờ `vendorAcceptsOrders` trong `ProductListingResponse` | copy từ `VendorSnapshot.acceptsOrders` qua projection `vendor_snapshots.accepts_orders` + migration `V2026_11_02_1000__vendor_accepts_orders.sql`. FE đổi `? true : true` → `dto.vendorAcceptsOrders`. |
| **BE-04b** | REST cho `orchestrator-service` | `api/orchestrator-service/…/web/NotificationController.java` — `GET /api/notifications?page=&size=` + `POST /api/notifications/{id}/read`, kèm `ApiResponse`/`ApiExceptionHandler`. Đây là nơi duy nhất nối hạ tầng realtime đã dựng với người dùng. |
| **BE-07** | Rate limiting ở gateway | `gateway/config/RateLimitFilter.java` + `RateLimitProperties.java`. Giới hạn theo **account id** khi có token, theo **IP** khi không. Bao phủ login / OTP / NFC / VNPay IPN. Có metric `moonkage.rate.limit.rejected{rule}`. |
| **BE-08b** | `Idempotency-Key` cho `POST /internal/payments` | `payment-service` lưu key theo `reference_id` (unique index) + migration `V2026_11_03_1000__payment_idempotency_key.sql`. Retry mạng không tạo 2 payment. |
| **BE-09** | Bỏ profile `legacy-writer` | Xoá `LegacyWriterConfig` + toàn bộ writer/entity/repository/controller cũ của catalog. Catalog **không còn ghi**, **không còn gọi MinIO**, **không còn gọi vendor-service**. Cỡ `common-storage` + `openfeign` đã gỡ khỏi pom; user MinIO `catalog` đã gỡ khỏi `infra/minio/init.sh`. |
| **BE-10** | Xoá `VoucherController` rỗng | Đã xoá `VoucherController` + `VoucherService` + `VoucherServiceImpl` ở order-service. **Giữ lại** `Voucher` entity + `VoucherRepository` — entity đã đủ trường nên làm lại sau không khó. |

---

## 5. Frontend — đợt P3 (04/11/2026)

| Hạng mục | Trạng thái |
| --- | --- |
| **Sentry** | `src/shared/observability/sentry.ts` — nạp **động** (không tăng payload mặc định), `dataCollection` chặn PII, demo mode không gửi. 9 test. |
| **Analytics GA4** | `src/shared/observability/analytics.ts` — 16 sự kiện nghiệp vụ, cookieless, `sanitizeProperties` chặn 16 khoá PII. 8 test. |
| **Core Web Vitals** | `src/shared/observability/webVitals.ts` — LCP/INP/CLS/FCP/TTFB, chỉ ghi chỉ số vượt ngưỡng "tốt". 6 test. |
| **E2E đủ 7/7 Flow** | 8 spec / **54 test**, 100% pass. Thêm FLOW 5 (khiếu nại + phán quyết Admin, kiểm tra AC-49.3), FLOW 6 (NFC V1→V5), FLOW 7 (FR-54 vỏ + nhân). |
| **Đưa `temp/` vào repo** | Bản `temp/web-temp/moonkage-web/` đã **thay thế** thư mục `web/` cũ → toàn bộ mã nguồn web hiện nằm ở `web/`, workflow `web-quality.yml` chạy trên đúng thư mục này. |

**Quality gate cuối:** `npm run check` → exit 0 (oxlint → css-modules → tsc → **314 vitest** →
build → bundle 1068.6/1100 kB). `npm run e2e` → **54/54 pass**.

---

## 6. Việc còn lại — cần quyết định của team

| # | Hạng mục | Vì sao chưa làm |
| --- | --- | --- |
| **BE-06** | Tắt `discovery.locator` | Repo **không có** `mobile/`, nhưng app NFC chạy ngoài repo → phải xác nhận trước khi tắt. Tài liệu cũng cảnh báo *"đổi đường dẫn làm web và app hỏng cùng lúc"*. |
| **BE-05 / BE-05b** | Phí giao do BE tính | `CheckoutServiceImpl` **đã** gán `shippingFee` theo từng shop; còn lại là chốt hợp đồng API và bỏ hardcode `25000` ở FE. |
| **BE-11** | OpenTelemetry tracing | BE-11b (metric) đã xong; tracing cần hạ tầng collector. |
| **BE-13** | Sinh type TS từ OpenAPI | Cần bật `springdoc-openapi` ở mọi service — thay đổi khá lớn, nên tách riêng. |
| **BE-03 / BE-12** | `common-web` + gom 6 `ApiResponse` | Thay đổi 6 module cùng lúc — nên tách PR riêng cho từng service. |
| **BE-14** | URL VNPay return | `.env.example` đã trỏ `/thanh-toan/ket-qua` (route của bản web hiện tại); cần xác nhận route này tồn tại trong bản deploy. |
| **BE-15** | Error Prone sạch | `MissingSummary` (9 file) · `UnrecognisedJavadocTag` · `TimeInStaticInitializer` — sửa sai có thể làm test thời gian yếu hơn. |

---

## 7. Lệnh kiểm tra

```bash
cd api/
./mvnw -B -ntp clean verify        # Spotless + Checkstyle + Error Prone + test — 13/13 module

cd web/
npm run check                       # lint → css → tsc → vitest → build → bundle
npm run e2e                         # 54 test Playwright, 7/7 Flow
```
