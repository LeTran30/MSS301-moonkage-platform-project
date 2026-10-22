# API nội bộ và sự kiện

> **Trạng thái:** Đề xuất (2026-10-22). Một phần của [phác thảo API và database](README.md); quyết định ở [decisions.md](decisions.md).

Gọi đồng bộ chỉ khi bên gọi cần câu trả lời ngay để quyết định; mọi thứ khác đi qua RabbitMQ (exchange `moonkage.events`, routing key `<miền>.<sự_kiện>`, mỗi sự kiện có `eventId`).

**API nội bộ (`/internal/**`, gateway chặn)**

| Bên gọi → bên được gọi | Endpoint | Dùng cho | Code |
| --- | --- | --- | --- |
| vendor, quotation → identity | `GET /internal/nfc/status/{accountId}` | BR-23; họ tên, CCCD đã che cho AC-45.1 | Đã có |
| vendor → identity | `POST /internal/accounts/check` | Băm số định danh, so với CCCD của chủ (BR-27) | Đã có |
| catalog, quotation, order → vendor | `GET /internal/vendors/by-owner/{accountId}` | Dựng lại bản sao khi khởi động | Đã có |
| order → catalog | `POST /internal/products/snapshot` | Phí giao theo vendor và cờ liên tỉnh (D-14) | Mới |
| order → vendor | `POST /internal/stock/reservations`, `DELETE /internal/stock/reservations/{checkoutId}` | Giữ (kèm `expiresAt` của checkout), giữ lại khi IPN đến trễ, trả tồn kho (BR-28, P-01); trả giá hiện hành để chép vào phiên checkout | Mới |
| order, quotation, vendor → payment | `POST /internal/payments` | `{purpose, referenceId, amount, allocations[]?}` → `{paymentId, paymentUrl}` | Mới |
| quotation, order → payment | `POST /internal/refunds` | `{paymentId, reason, amount}`: hoàn cọc khi báo giá hết hiệu lực lúc thanh toán (`QUOTE_EXPIRED`, FR-19); hoàn checkout trả trễ khi hết hàng (`LATE_PAYMENT`, P-01) | Mới |
| payment → order | `POST /internal/orders/{orderId}/payout-lock` | Khóa đơn trước khi chuyển tiền; mở khiếu nại sau đó bị 409 (BR-18, P-02) | Mới |

**Sự kiện chính**

| Bên phát | Routing key | Bên nghe |
| --- | --- | --- |
| identity | `account.nfc_verified`, `account.nfc_failed`, `account.nfc_locked`; email OTP | orchestrator |
| vendor | `vendor.updated`, `vendor.locked` | catalog, quotation, order (+ orchestrator) |
| vendor | `vendor.submitted`, `vendor.onboarding_recorded`, `vendor.reviewed`, `vendor.registration_fee_paid`, `registration_fee.changed`, `vendor.bank_account_changed` | orchestrator |
| vendor | `product.upserted, product.removed` | catalog, order, orchestrator |
| catalog | `interprovince_fee.changed` | orchestrator |
| quotation | `request.created`, `request.declined`, `quote.submitted`, `quote.withdrawn` | orchestrator |
| quotation | `quote.accepted` (bản chép báo giá, `invoiceInfo`, địa chỉ) | order, orchestrator |
| order | `order.created`, `order.status_changed`, `order.delivered` (kèm `complaintDeadline`), `order.received_confirmed`, `dispute.opened`, `dispute.resolved` | payment, orchestrator |
| order | `mockup.uploaded`, `mockup.reviewed`, `progress.updated`, `invoice.attached` | orchestrator |
| order | `review.created` | catalog |
| payment | `payment.succeeded`, `payment.failed` (kèm `purpose`, `referenceId`) | order, quotation, vendor (chốt giữ hàng, ghi đã đóng phí) |
| payment | `refund.completed`, `refund.manual_required`, `disbursement.requested`, `disbursement.reviewed`, `payout.completed` | order, orchestrator |

Mọi service phát sự kiện về tiền, trạng thái, tồn kho hoặc audit đều ghi `outbox_events` trong cùng transaction (NFR-05). Bên nghe lưu `eventId` đã xử lý để bỏ trùng.
