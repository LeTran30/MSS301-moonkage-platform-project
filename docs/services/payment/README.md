# Thanh toán, hoàn tiền và sổ tiền (payment-service)

payment-service giữ **tiền** của hệ thống: giao dịch cổng thanh toán (VNPay), hoàn tiền, sổ tiền theo đơn (escrow), yêu cầu giải ngân và lệnh chuyển tiền cho người bán. Mọi khoản ra khỏi hệ thống đều phải đi qua service này.

- Hợp đồng API + schema: [api-db/payment.md](../../architecture/api-db/payment.md). Khi tài liệu này lệch với `payment.md`, `payment.md` đúng.
- Quyết định liên quan: [api-db/decisions.md](../../architecture/api-db/decisions.md), đề xuất DB P-01 → P-04 ở [db-review-proposals.md](../../architecture/api-db/db-review-proposals.md).

## Trách nhiệm

**Có trách nhiệm**

- Tạo và theo dõi giao dịch thanh toán (`payments`) với cổng VNPay; nhận callback IPN của VNPay và kiểm chữ ký (BR-25).
- Nhận callback `return` để trang kết quả của web hỏi "đây là giao dịch nào" (không đổi trạng thái).
- Phân bổ tiền của một lần thanh toán cho nhiều đơn (`payment_allocations`, BR-29).
- Sổ tiền theo đơn (`ledgers`, `ledger_entries`): tổng đã thu, đang giữ, đã giải ngân, đã hoàn, đã chuyển (NFR-09).
- Hoàn tiền (`refunds`): tự động gửi VNPay, khi bị từ chối thì chuyển `MANUAL_REQUIRED` cho admin xử lý tay (AC-49.3).
- Yêu cầu giải ngân một phần tiền cọc và duyệt/từ chối (`disbursement_requests`, FR-41, FR-47).
- Chuyển tiền cho người bán, mỗi đơn một lần (`payouts`, FR-48), sau khi order-service khoá đơn (P-02).

**Không có trách nhiệm**

- Không tự tạo thanh toán từ phía người dùng. Payment được tạo qua `POST /internal/payments` bởi root nghiệp vụ sở hữu nó (order, quotation, vendor).
- Không biết trạng thái đơn hàng. payment-service giữ bản sao `order_snapshots` từ sự kiện của order-service và **không** quyết định dựa trên nó (P-02).
- Không quyết định khiếu nại. Admin ở order-service quyết định; payment-service chỉ thực hiện hoàn tiền theo yêu cầu.
- Không quản lý hàng, maket, sản phẩm, người bán.

## Bounded context và aggregate root

| Root | Tài nguyên con | Bảng | Đường dẫn gốc |
|---|---|---|---|
| Payment | — | `payments`, `payment_allocations` | `/api/payments` |
| Ledger (mỗi đơn một sổ) | entries, disbursements, refunds, payout | `ledgers`, `ledger_entries`, `disbursement_requests`, `refunds`, `payouts` | `/api/ledgers` |

Bảng kỹ thuật: `order_snapshots` (bản sao trạng thái đơn từ sự kiện), `processed_events` (inbox), `outbox_events` (outbox).

### Trạng thái

| Đối tượng | Chuyển được |
|---|---|
| Thanh toán (`PaymentStatus`) | `PENDING → SUCCEEDED` / `→ FAILED`; `DUPLICATE` khi đã có một lần thành công cho cùng `(purpose, reference_id)` (P-03) |
| Hoàn tiền (`RefundStatus`) | `PENDING → SUCCEEDED` (VNPay nhận) hoặc `→ MANUAL_REQUIRED` (VNPay từ chối / lỗi mạng) |
| Yêu cầu giải ngân (`DisbursementStatus`) | `PENDING → APPROVED` / `→ REJECTED` |

Bất biến số tiền (P-04, NFR-09): `held = totalCollected − disbursed − refunded − paidOut`, mọi cột ≥ 0; mọi thay đổi sổ tiền đều thêm một dòng `ledger_entries` trong cùng transaction.

## API công khai

Đọc danh tính từ header `X-Account-Id` / `X-User-Role` do gateway gắn. Response bọc trong `ApiResponse<T>` của `common-api`; riêng callback IPN của VNPay trả đúng dạng VNPay mong đợi, không bọc envelope.

Cột **Ai** dùng mã vai: **M** = `MEMBER` (người mua), **S** = người bán (chủ `vendor` của đơn — chủ người bán **không phải một vai**, D-19), **A** = `ADMIN`, **K** = trang kết quả web (không cần token).

| Method, đường dẫn | Ai | Việc |
|---|---|---|
| `GET /api/payments` | A | Danh sách giao dịch; lọc `purpose=`, `from=`, `to=` |
| `GET /api/payments/{paymentId}` | M | Trạng thái giao dịch của mình (trang kết quả poll endpoint này) |
| `GET /api/payments/vnpay/ipn` | VNPay | Callback server-to-server; kiểm chữ ký, đây là thứ **duy nhất** đánh dấu đã trả (BR-25) |
| `GET /api/payments/vnpay/return` | K | Trang kết quả web chuyển tiếp query của VNPay; trả giao dịch, không đổi gì |
| `GET /api/ledgers` | S, A | Đối soát: `vendorId=` của người bán; admin xem tất cả, `payableOnly=true` lấy đơn đang chờ chuyển tiền |
| `GET /api/ledgers/{orderId}` | S, A | Sổ tiền của một đơn |
| `GET /api/ledgers/{orderId}/entries` | S, A | Nhật ký ghi sổ (chỉ đọc) |
| `GET /api/ledgers/{orderId}/refunds` | S, A | Các lần hoàn tiền của đơn |
| `GET /api/ledgers/{orderId}/disbursements` | S, A | Các yêu cầu giải ngân của đơn |
| `POST /api/ledgers/{orderId}/disbursements` | S | Gửi yêu cầu giải ngân `{amount, purpose}` (FR-41) |
| `PATCH /api/ledgers/{orderId}/disbursements/{requestId}` | A | Duyệt hoặc từ chối `{status, approvedAmount?, reason?}` (FR-47) |
| `PUT /api/ledgers/{orderId}/payout` | A | Chuyển tiền cho người bán, mỗi đơn một lần (FR-48) |
| `GET /api/refunds` | A | Danh sách hoàn tiền; mặc định lọc `status=MANUAL_REQUIRED` |
| `PATCH /api/refunds/{refundId}` | A | Đánh dấu hoàn tay đã xong: `MANUAL_REQUIRED → SUCCEEDED` (AC-49.3) |

**Nội bộ** (gateway chặn `/internal/**`; trả dữ liệu không bọc):

| Method, đường dẫn | Ai gọi | Việc |
|---|---|---|
| `POST /internal/payments` | order, quotation, vendor | 201 `CreatePaymentResponse` (`{paymentId, paymentUrl}`) — giao dịch `PENDING` + link VNPay; header `Idempotency-Key` định danh lần thử (409 `PAYMENT_002` khi tham chiếu đã trả, P-03; cùng key trả lại đúng giao dịch cũ) |
| `POST /internal/refunds` | quotation (`QUOTE_EXPIRED`), order (`LATE_PAYMENT`) | 204 — yêu cầu hoàn `{paymentId, reason, amount}`; lặp lại trả 204 và không làm gì |

## Dữ liệu

Schema do Flyway quản lý (`api/payment-service/src/main/resources/db/migration`): `V1__baseline.sql`, `V2026_10_22_1000__align_with_api_db_outline.sql`, `V2026_11_03_1000__payment_idempotency_key.sql`.

| Bảng | Vai trò |
|---|---|
| `payments` | Giao dịch: `purpose` (`CHECKOUT`, `DEPOSIT`, `REMAINDER`, `REGISTRATION_FEE`), `reference_id` (checkoutId / acceptanceId / orderId / vendorId), `payer_account_id`, `amount`, `gateway_txn_ref` (duy nhất), `gateway_txn_no`, `gateway_response_code`, `status`, `expires_at`, `paid_at`, `idempotency_key` (duy nhất khi còn `PENDING`); một lần thành công cho mỗi `(purpose, reference_id)` |
| `payment_allocations` | Phân bổ tiền cho từng đơn (`payment_id`, `order_id`, `amount`); tổng bằng `payments.amount` |
| `ledgers` | Sổ tiền theo đơn: `order_id` duy nhất, `vendor_id`, `total_collected`, `held`, `disbursed`, `refunded`, `paid_out`, `expected_payout_date`, `version` |
| `ledger_entries` | Nhật ký chỉ-thêm (trigger chặn UPDATE/DELETE): `kind` (`COLLECT`, `DISBURSE`, `REFUND`, `PAYOUT`), `amount`, `reference_id`, `actor_account_id` |
| `disbursement_requests` | Yêu cầu giải ngân: `amount`, `purpose` (`MATERIALS`, `PRINTING`, `PACKAGING`, `RESTOCK`), `status`, `approved_amount`, `reason`, `decided_by`, `decided_at` |
| `refunds` | Hoàn tiền: `reason` (`DISPUTE`, `LATE_PAYMENT`, `DUPLICATE_PAYMENT`, `QUOTE_EXPIRED`), `order_id`, `dispute_id`, `original_payment_id`, `amount`, `status`, `gateway_refund_ref`, `error` |
| `payouts` | Lệnh chuyển tiền: `order_id` duy nhất, `vendor_id`, `amount`, `approved_by` |
| `order_snapshots` | Bản sao trạng thái đơn từ sự kiện của order-service: `kind`, `total_amount`, `status`, `complaint_deadline`, `received_confirmed`, `dispute_open`, `source_version` |
| `processed_events`, `outbox_events` | Inbox chống xử lý lặp và outbox phát sự kiện |

## Sự kiện

Phát qua outbox, exchange `moonkage.events` (`api/payment-service/src/main/java/com/moonkage/payment/config/RabbitConfig.java`):

| Routing key | Người nghe |
|---|---|
| `payment.succeeded` | order (`order-service.payment-succeeded`), quotation (`quotation-service.payment-succeeded`), vendor (`vendor-service.payment-events`) |
| `payment.failed` | order (`order-service.payment-failed`), quotation (`quotation-service.payment-failed`) |
| `refund.completed` | chưa có service nào bind — orchestrator chỉ nghe `orchestrator.email.#`, `orchestrator.inapp.#`, `audit.#` và các key `account.nfc_*` |
| `refund.manual_required` | chưa có service nào bind (như trên) |
| `disbursement.requested` | chưa có service nào bind (như trên) |
| `disbursement.reviewed` | chưa có service nào bind (như trên) |
| `payout.completed` | chưa có service nào bind (như trên) |

Xem mục "Chưa làm" của [orchestrator/README.md](../orchestrator/README.md): các sự kiện tiền của payment-service hiện **không** tới được hộp thư hay nhật ký kiểm toán.

Nghe (queue bền):

| Queue | Routing key | Xử lý |
|---|---|---|
| `payment-service.order-events` | `order.created`, `order.status_changed`, `order.delivered`, `order.received_confirmed` | Cập nhật `order_snapshots`, mở sổ tiền, mở xét điều kiện chuyển tiền |
| `payment-service.dispute-opened` | `dispute.opened` | Chuẩn bị hồ sơ hoàn tiền khi admin quyết định |
| `payment-service.dispute-resolved` | `dispute.resolved` | Thực hiện hoàn tiền theo quyết định |

Chống xử lý lặp bằng bảng `processed_events`.

## Phụ thuộc

| Service | Gọi qua | Mục đích |
|---|---|---|
| order | Feign `OrderClient` → `POST /internal/orders/{orderId}/payout-lock` | Khoá đơn trước khi chuyển tiền (P-02); 409 khi chưa đủ điều kiện |
| vendor | Feign `VendorClient` → `GET /internal/vendors/by-owner/{accountId}` | Tra tài khoản này sở hữu vendor nào (chủ người bán không phải vai, D-19) |

Không gọi identity, catalog, quotation hay orchestrator. VNPay được gọi trực tiếp qua `gateway/` (`VnpayGateway`, `VnpaySigner`, `VnpayRefundClient`).

## Tác vụ định kỳ

| Tác vụ | Khoảng chạy | Việc |
|---|---|---|
| `PaymentExpiryJob` | `payment.expiry-sweep-interval` (60s) | Đánh `FAILED` các giao dịch `PENDING` quá hạn → phát `payment.failed` (P-01) |
| `RefundJob` | `payment.refund-interval` (30s) | Gửi các hoàn tiền `PENDING` tới VNPay; bị từ chối thì thành `MANUAL_REQUIRED` |

Mọi tác vụ định kỳ của service chạy trên `spring.task.scheduling.pool.size` thread (mặc định của Spring Boot là **một**). Ở payment-service khai báo `size: 2` — xem `api/payment-service/src/main/resources/application.yml`. Lý do: `RefundJob` gọi ra VNPay (một hệ thống bên ngoài), còn relay outbox phát sự kiện của đơn; nếu chung một thread thì một lần gọi chậm làm sự kiện của đơn ngừng đi.

## Cấu hình và chạy local

Cổng `8087`, database `payment_db` (`PAYMENT_DB_HOST` / `PAYMENT_DB_PORT`, mặc định `localhost:5446`). Biến lấy từ `.env` ở thư mục gốc repo.

| Biến / khóa | Ghi chú |
|---|---|
| `PAYMENT_DB_HOST`, `PAYMENT_DB_PORT` | `payment_db` |
| `RABBITMQ_HOST`, `RABBITMQ_PORT`, `RABBITMQ_USERNAME`, `RABBITMQ_PASSWORD` | Broker sự kiện |
| `EUREKA_URL` | `http://localhost:8761/eureka/` |
| `VNPAY_TMN_CODE`, `VNPAY_HASH_SECRET` | Mã thương mại và secret của sandbox VNPay; thiếu thì `PAYMENT_005` (`GATEWAY_NOT_CONFIGURED`) |
| `VNPAY_PAY_URL` | Mặc định `https://sandbox.vnpayment.vn/paymentv2/vpcpay.html` |
| `VNPAY_RETURN_URL` | Mặc định `http://localhost:5173/thanh-toan/ket-qua` (trang kết quả của web) |
| `VNPAY_CONFIRM_ON_RETURN` | Mặc định `false`. Đặt `true` khi chạy local: VNPay không gọi được IPN về `localhost`, nên `GET /api/payments/vnpay/return` (trang kết quả chuyển tiếp query đã được VNPay ký) được ghi nhận như một IPN. Chữ ký vẫn bị kiểm, và ghi nhận lặp lại không đổi gì. Ở nơi VNPay gọi được IPN thì để `false`: khi đó chỉ IPN mới đánh dấu đã trả tiền (BR-25) |
| `VNPAY_API_URL` | Endpoint `merchant_webapi` dùng cho hoàn tiền (AC-49.3) |
| `VNPAY_REFUND_TIMEOUT` | Bao lâu thì bỏ một lần gọi hoàn tiền (mặc định `10s`). Lần gọi nằm trong tác vụ định kỳ nên **phải** có thời hạn: không có thời hạn thì một sandbox chậm giữ thread của scheduler, và relay outbox đi cùng thread đó cũng ngừng |
| `vnpay.default-lifetime` | `15m` — hạn thanh toán mặc định |
| `payment.expiry-sweep-interval` | `60s` |
| `payment.refund-interval` | `30s` |

### Mã sandbox VNPay

Mỗi người tự đăng ký merchant sandbox tại `https://sandbox.vnpayment.vn/devreg/`, bấm link kích hoạt trong email, rồi chép `vnp_TmnCode` và `vnp_HashSecret` từ email đó vào `VNPAY_TMN_CODE`, `VNPAY_HASH_SECRET` của `.env`. Sau đó chạy `docker compose up -d payment-service` để container đọc lại `.env`.

Nếu bấm thanh toán mà VNPay chuyển sang `Payment/Error.html?code=…`, xem mã lỗi:

| Mã | Nghĩa | Cách sửa |
|---|---|---|
| `71` | "Website này chưa được phê duyệt": mã merchant có tồn tại nhưng chưa kích hoạt hoặc đã bị khoá. VNPay kiểm tình trạng merchant trước, nên vẫn ra 71 dù chữ ký đúng hay sai | Kích hoạt qua email, hoặc đăng ký mã mới |
| `72` | Không có mã merchant này | Sửa `VNPAY_TMN_CODE` |
| `70` | Sai chữ ký | Sửa `VNPAY_HASH_SECRET` (secret phải đi cùng mã merchant) |

Khi chạy local, VNPay không gọi được IPN về máy, nên cần bật `VNPAY_CONFIRM_ON_RETURN=true`. Khi chưa có mã merchant dùng được, vẫn chạy được luồng thanh toán bằng một IPN giả: ký đúng bằng `VNPAY_HASH_SECRET` rồi gọi `GET /api/payments/vnpay/ipn`.

Chạy:

```bash
cd api
./mvnw -pl payment-service -am spring-boot:run
```

Trên Windows dùng `mvnw.cmd`. Cần Postgres `payment_db` và RabbitMQ đã bật (xem [../../guides/getting-started.md](../../guides/getting-started.md)).

## Kiểm thử

```bash
cd api
./mvnw -pl payment-service -am clean verify
```

Test tích hợp dùng Testcontainers (PostgreSQL, RabbitMQ); cần Docker.
