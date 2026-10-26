# payment-service (`payment_db`)

> **Trạng thái:** Đề xuất (2026-10-22). Một phần của [phác thảo API và database](README.md); quyết định ở [decisions.md](decisions.md).
>
> **Migration:** [`V2026_10_22_1000__align_with_api_db_outline.sql`](../../../api/payment-service/src/main/resources/db/migration/V2026_10_22_1000__align_with_api_db_outline.sql)

Bảng `payments` hiện gắn cứng một `order_id`, nên không biểu diễn được một lần thanh toán cho N đơn (BR-29) hay phí đăng ký không gắn đơn (BR-31). Đề xuất tách giao dịch cổng thanh toán khỏi sổ tiền theo đơn, và ghi sổ dạng nhật ký chỉ thêm.

**Bảng**

| Bảng | Cột chính | Ràng buộc | Nguồn |
| --- | --- | --- | --- |
| `payments` **Sửa** | `id`, `purpose` (CHECKOUT, DEPOSIT, REMAINDER, REGISTRATION_FEE), `reference_id` (checkoutId / acceptanceId / orderId / vendorId), `payer_account_id`, `amount`, `gateway_txn_ref`, `gateway_txn_no`, `gateway_response_code`, `status` (PENDING, SUCCEEDED, FAILED, DUPLICATE), `expires_at`, `paid_at` | `gateway_txn_ref` duy nhất (IPN lặp lại an toàn); mỗi `(purpose, reference_id)` tối đa một SUCCEEDED, lần thành công sau ghi DUPLICATE và tự hoàn tiền (P-03); bỏ `order_id NOT NULL` | BR-25, BR-29, BR-31 |
| `payment_allocations` **Mới** | `payment_id`, `order_id`, `amount` | Tổng = `payments.amount`; phí đăng ký không có phân bổ; constraint trigger kiểm lúc commit (P-04) | BR-29 |
| `ledgers` **Sửa** | `id`, `order_id` (duy nhất), `vendor_id`, `total_collected` **Mới**, `held`, `disbursed`, `refunded`, `paid_out`, `expected_payout_date`, `version` | `CHECK (held = total_collected − disbursed − refunded − paid_out)`, mọi cột ≥ 0; khớp tổng `ledger_entries`, kiểm lúc commit (P-04) | NFR-09, FR-43, FR-51 |
| `ledger_entries` **Mới** | `id`, `order_id`, `kind` (COLLECT, DISBURSE, REFUND, PAYOUT), `amount`, `reference_id`, `actor_account_id`, `created_at` | Chỉ INSERT (trigger); mọi thay đổi `ledgers` thêm dòng ở đây trong cùng transaction | NFR-07, NFR-09 |
| `disbursement_requests` **Sửa** | `id`, `order_id`, `vendor_id` **Mới**, `amount`, `purpose` (MATERIALS, PRINTING, PACKAGING, RESTOCK), `status` (PENDING, APPROVED, REJECTED), `approved_amount`, `reason`, `decided_by` **Mới**, `decided_at` | Tổng đã duyệt + đang chờ ≤ cọc đang giữ | FR-41, FR-47, BR-09 |
| `refunds` **Mới** | `id`, `reason` (DISPUTE, LATE_PAYMENT, DUPLICATE_PAYMENT, QUOTE_EXPIRED), `order_id`, `dispute_id`, `original_payment_id`, `amount`, `status` (PENDING, SUCCEEDED, MANUAL_REQUIRED), `gateway_refund_ref`, `error` | Thay giá trị `REFUND` trong `payments.type`; dòng mới bắt buộc `original_payment_id`; DISPUTE bắt buộc đơn và khiếu nại; hoàn tự động tối đa một lần mỗi payment (P-01, P-03) | AC-49.3, A-11 |
| `payouts` **Mới** | `id`, `order_id`, `vendor_id`, `amount`, `approved_by`, `created_at` | Mỗi đơn một lần; trước khi ghi phải gọi `payout-lock` của order (P-02) | FR-48, BR-18 |
| `order_snapshots` **Mới** (kỹ thuật) | `order_id`, `vendor_id`, `kind`, `interprovince`, `total_amount`, `status`, `complaint_deadline`, `received_confirmed`, `dispute_open` | Từ sự kiện của order; chỉ dùng cho danh sách chờ chuyển tiền, không dùng để quyết định chuyển (P-02) | AC-48.1, AC-48.5 |
| `processed_events`, `outbox_events` **Mới** |  |  | `payment.succeeded`, `payment.failed`, ... |

**API công khai**

**Root Payment** (`/api/payments`)

| Method, đường dẫn | Ai | Mục đích | FR |
| --- | --- | --- | --- |
| `GET /api/payments/{paymentId}` | M | Trạng thái giao dịch của mình | FR-09 |
| `GET /api/payments?purpose=REGISTRATION_FEE&from=&to=` | A | Các khoản phí đăng ký đã thu | AC-51.3 |
| `GET /api/payments/vnpay/ipn`, `GET /api/payments/vnpay/return` | VNPay, K | Ngoại lệ như auth: callback của cổng thanh toán, không phải tài nguyên. IPN kiểm checksum và trả mã theo chuẩn VNPay | BR-25 |

Payment chỉ được tạo qua root nghiệp vụ sở hữu nó (Checkout, Acceptance, Order, Vendor), gọi `POST /internal/payments`; không có `POST /api/payments`.

**Root Ledger** (`/api/ledgers`, mỗi đơn một sổ, id = `orderId`)

| Method, đường dẫn | Ai | Mục đích | FR |
| --- | --- | --- | --- |
| `GET /api/ledgers?vendorId=&from=&to=` | S | Đối soát theo đơn: tổng, đang giữ, đã giải ngân, sẽ nhận, ngày dự kiến | FR-43 |
| `GET /api/ledgers?from=&to=&eligibleForPayout=&disbursementStatus=&refundStatus=&violation=` | A | Đối soát toàn nền tảng; `data.summary` mang tổng; lọc đơn đủ điều kiện chuyển tiền, yêu cầu giải ngân chờ, hoàn tiền cần xử lý tay, đơn vi phạm NFR-09 | FR-47, FR-48, FR-51, AC-49.3 |
| `GET /api/ledgers/{orderId}` | S, A | Sổ tiền một đơn | FR-43, AC-51.1 |
| `GET /api/ledgers/{orderId}/entries` | S, A | Nhật ký ghi sổ (chỉ đọc) | NFR-07 |
| `GET\|POST /api/ledgers/{orderId}/disbursements` | S | Xem, gửi yêu cầu giải ngân `{amount, purpose}` | FR-41 |
| `PATCH /api/ledgers/{orderId}/disbursements/{requestId}` | A | `{status: APPROVED \| REJECTED, approvedAmount?, reason?}` → ghi sổ | FR-47 |
| `PUT /api/ledgers/{orderId}/payout` | A | Duyệt chuyển tiền cho người bán (mỗi đơn một lần) | FR-48 |
| `GET /api/ledgers/{orderId}/refunds` | S, A | Các lần hoàn tiền | AC-49.3 |
| `GET /api/refunds?status=MANUAL_REQUIRED`, `PATCH /api/refunds/{refundId}` | A | Hoàn tiền VNPay từ chối, gồm cả lần không gắn đơn (trả trễ, trả trùng); PATCH = đã hoàn tay, sổ tiền ghi `REFUND` lúc này | AC-49.3 |

Ledger giữ NFR-09 trong một transaction cho mọi lần ghi sổ: giải ngân, hoàn tiền, chuyển tiền.

**Hoàn tiền.** Lệnh hoàn ghi `PENDING`; job gửi VNPay (`merchant_webapi`, command `refund`). VNPay nhận thì `SUCCEEDED` và sổ tiền ghi `REFUND` (khiếu nại: từ đơn; trả trễ, báo giá hết hạn: từ các đơn mà thanh toán đã được phân bổ; trả trùng: không ghi sổ). VNPay từ chối, lỗi mạng, hoặc số hoàn vượt số đang giữ (Q-01) thì `MANUAL_REQUIRED`, sổ không đổi.

**Chuyển tiền.** Từ chối khi đơn còn lệnh hoàn `PENDING`/`MANUAL_REQUIRED` hoặc yêu cầu giải ngân đang chờ; sau đó gọi `payout-lock` (409 → `LEDGER_007`), rồi chuyển toàn bộ số đang giữ.

## Sự kiện và API nội bộ

**Phát**

- `payment.succeeded`, `payment.failed` (kèm `purpose`, `referenceId`) → order, quotation, vendor. `payment.succeeded` = `{eventId, paymentId, purpose, referenceId, amount, paidAt}` (vendor-service đọc đúng các trường này)
- `refund.completed`, `refund.manual_required`, `disbursement.requested`, `disbursement.reviewed`, `payout.completed` → order, orchestrator

**Nghe**

- `order.created`, `order.status_changed`, `order.delivered`, `order.received_confirmed`, `dispute.opened`, `dispute.resolved` → `order_snapshots`, mở sổ, hoàn tiền

**API nội bộ**

- Cung cấp `POST /internal/payments` cho order, quotation, vendor: `{purpose, referenceId, payerAccountId, amount, expiresAt?, allocations[]?}` → `{paymentId, paymentUrl}`. Chỉ `CHECKOUT` gửi `allocations[]` (tổng = `amount`, mỗi đơn một dòng). `DEPOSIT` phân bổ toàn bộ cho đơn có id = `acceptanceId` (order-service tạo đơn đặt hàng từ `quote.accepted` với chính id này), `REMAINDER` cho đơn `referenceId`, `REGISTRATION_FEE` không phân bổ. Đã có lần thành công cho cùng `(purpose, referenceId)` thì trả 409 `PAYMENT_002`
- `payment.failed` = `{eventId, paymentId, purpose, referenceId, amount, reason (DECLINED | EXPIRED), gatewayResponseCode, failedAt}`. Thanh toán quá `expiresAt` mà chưa có IPN bị đánh FAILED (EXPIRED); IPN thành công đến sau vẫn được ghi SUCCEEDED và phát `payment.succeeded`, bên sở hữu tham chiếu tự quyết (P-01)
- Cung cấp `POST /internal/refunds` cho quotation (`QUOTE_EXPIRED`), order (`LATE_PAYMENT`): `{paymentId, reason, amount}`
- Gọi order: `POST /internal/orders/{orderId}/payout-lock` trước khi chuyển tiền (P-02)

## Quyết định liên quan

[P-01, P-02, P-03, P-04](db-review-proposals.md), [L-07](decisions.md), [L-08](decisions.md), [L-17](decisions.md).
