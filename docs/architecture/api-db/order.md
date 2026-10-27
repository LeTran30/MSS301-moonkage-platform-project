# order-service (`order_db`)

> **Trạng thái:** Đề xuất (2026-10-22). Một phần của [phác thảo API và database](README.md); quyết định ở [decisions.md](decisions.md).
>
> **Migration:** [`V2026_10_22_1000__align_with_api_db_outline.sql`](../../../api/order-service/src/main/resources/db/migration/V2026_10_22_1000__align_with_api_db_outline.sql)

Schema đã có đơn, maket, tiến độ, khiếu nại, đánh giá. Thiếu phiên checkout (D-10) nên chưa đúng "thanh toán thất bại thì không tạo đơn" (FR-09). Một `orders` dùng chung cho mua ngay và đặt hàng, phân biệt bằng `kind`.

**Bảng**

| Bảng | Cột chính | Ràng buộc | Nguồn |
| --- | --- | --- | --- |
| `cart_items` **Sửa** | `id`, `buyer_account_id`, `product_id`, `vendor_id`, `quantity` | `(buyer_account_id, product_id)` duy nhất | FR-08 |
| `checkouts` **Mới** (kỹ thuật) | `id` (= `payment_group_id`), `buyer_account_id`, địa chỉ chép (`recipient_name`, `recipient_phone`, `province_code`, `address_detail`), `invoice_*`, `total_amount`, `payment_id`, `status` (PENDING_PAYMENT, SUCCEEDED, FAILED, EXPIRED, REFUND_REQUESTED), `expires_at` | Order chỉ tạo khi SUCCEEDED; `expires_at` = hạn VNPay + 5 phút, gửi sang vendor làm hạn giữ hàng (P-01) | FR-09, BR-29, D-10 |
| `checkout_groups` **Mới** | `checkout_id`, `vendor_id`, `order_id`, `items_amount`, `shipping_fee`, `interprovince` | PK `(checkout_id, vendor_id)`; mỗi Shop một dòng, phí giao không lặp theo sản phẩm; `order_id` cấp sẵn lúc tạo checkout để phân bổ tiền và tạo đơn lặp lại an toàn (P-01) | BR-29, BR-30 |
| `checkout_lines` **Mới** | `checkout_id`, `line_no`, `vendor_id`, `product_id`, `product_name`, `unit_price`, `quantity` | Giá chép lúc tạo (BR-19); thuộc một `checkout_groups` | BR-29 |
| `orders` **Sửa** | `id`, `kind` (BUY_NOW, CUSTOM_ORDER), `buyer_account_id`, `vendor_id`, `payment_group_id` (đổi từ `checkout_id`), `quote_id`, `agreement_id`, `agreement_hash` **Mới** (L-10), `items_amount`, `shipping_fee`, `discount_amount`, `total_amount`, `deposit_amount`, `remaining_amount` **Mới**, `has_custom`, `interprovince`, địa chỉ chép (thêm `recipient_name`, `recipient_phone`, `province_code`), `delivery_date`, `delivery_method` **Mới**, `invoice_name`, `invoice_tax_code`, `invoice_address`, `invoice_email`, `invoice_object_key`, `tracking_code`, `status`, `delivered_at`, `received_confirmed_at`, `complaint_deadline` **Mới**, `payout_locked_at` **Mới** (P-02), `version` | `status` mua ngay: PAID → CONFIRMED → SHIPPING → DELIVERED → COMPLETED; đặt hàng: DEPOSITED → AWAITING_MOCKUP_APPROVAL → IN_PRODUCTION → READY_TO_SHIP → DELIVERED → COMPLETED; CHECK ghép `kind` với `status` (P-06); liên tỉnh SHIPPING bắt buộc `tracking_code` | FR-09, FR-10, FR-19, FR-21, FR-24, FR-32, FR-40, FR-42, D-13 |
| `order_items` | `id`, `order_id`, `product_id`, `product_name`, `unit_price`, `quantity`, `subtotal` |  | BR-19 |
| `mockup_versions` **Sửa** | `id`, `order_id`, `version_no`, `object_key`, `uploaded_at`, `review_status` (PENDING_REVIEW, APPROVED, CHANGES_REQUESTED), `review_note`, `reviewed_at` | `(order_id, version_no)` duy nhất; không ghi đè | FR-20, FR-39, BR-15 |
| `progress_updates`, `progress_update_photos` | `id`, `order_id`, `milestone`, `note`, `created_at`; ảnh `object_key` | Chỉ thêm, không sửa | FR-40 |
| `reviews` **Sửa** | `id`, `order_id`, `product_id`, `vendor_id`, `buyer_account_id`, `rating` (1–5), `content` | Bỏ `vendor_reply`, `replied_at` (người bán không trả lời); chỉ `kind = BUY_NOW` đã giao | FR-11, BR-32 |
| `disputes` | `id`, `order_id`, `buyer_account_id`, `reason` (WRONG_ITEM, DAMAGED, LATE_DELIVERY, WRONG_LOGO, OTHER), `description`, `status` (OPEN, RESOLVED), `decision` (FULL_REFUND, PARTIAL_REFUND, REJECTED), `refund_amount`, `decision_reason`, `decided_by`, `resolved_at` | Mỗi đơn tối đa một khiếu nại OPEN | FR-12, FR-49 |
| `dispute_evidences` | `id`, `dispute_id`, `party` (BUYER, VENDOR), `object_key`, `note` |  | AC-49.1 |
| `vouchers` (hoãn) | đã có trong code |  | FR-13, FR-50 |
| `vendor_snapshots`, `processed_events`, `outbox_events` **Mới** |  |  | BR-22, D-12 |

**API công khai**

**Root Cart** (`/api/carts`)

| Method, đường dẫn | Ai | Mục đích | FR |
| --- | --- | --- | --- |
| `GET /api/carts/me?provinceCode=` | M | Giỏ tách theo Shop + phí giao từng Shop tới tỉnh đã chọn | FR-08, AC-09.1 |
| `POST /api/carts/me/items` | M | Thêm sản phẩm; vượt tồn kho hoặc ngưỡng thì từ chối kèm gợi ý gửi yêu cầu | FR-08, BR-22 |
| `PATCH\|DELETE /api/carts/me/items/{itemId}` | M | Đổi số lượng, bỏ | FR-08 |

**Root Checkout** (`/api/checkouts`)

| Method, đường dẫn | Ai | Mục đích | FR |
| --- | --- | --- | --- |
| `POST /api/checkouts` | M | `{recipientName, recipientPhone, provinceCode, addressDetail, invoiceInfo?}` từ giỏ → giữ hàng, `{checkoutId, paymentId, paymentUrl, totalAmount, expiresAt}`. Địa chỉ là một địa chỉ đã lưu ở identity, web gửi nguyên nội dung vì identity chưa có API nội bộ đọc địa chỉ | FR-09, BR-28 |
| `GET /api/checkouts/{checkoutId}` | M | Trạng thái và các `orderIds` đã tạo | FR-09, BR-29 |

**Root Order** (`/api/orders`)

| Method, đường dẫn | Ai | Mục đích | FR |
| --- | --- | --- | --- |
| `GET /api/orders?paymentGroupId=&kind=&status=` | M | Đơn của mình, nhóm theo lần thanh toán | FR-10, FR-21 |
| `GET /api/orders?vendorId=&status=&missingInvoice=` | S | Đơn của Shop, cờ thiếu hóa đơn | FR-32, AC-44.3 |
| `GET /api/orders?disputeStatus=OPEN` | A | Đơn đang khiếu nại | FR-49 |
| `GET /api/orders/{orderId}` | M, S, A | Chi tiết gồm `items`, địa chỉ, thông tin hóa đơn DN | FR-10, AC-32.1 |
| `PATCH /api/orders/{orderId}` | S | `{status, trackingCode?, note?, photos[]?}`: chuyển trạng thái đúng thứ tự; mỗi lần tự ghi một `progress-update` | FR-32, FR-40, FR-42 |
| `PATCH /api/orders/{orderId}` | M | `{receivedConfirmed: true}` | FR-11 |
| `GET /api/orders/{orderId}/progress-updates` | M, S, A | Lịch sử tiến độ (chỉ đọc) | FR-21 |
| `POST /api/orders/uploads` | M, S | Xin chỗ tải maket, ảnh tiến độ, hóa đơn, bằng chứng | FR-12, FR-39, FR-40, FR-44 |
| `GET\|POST /api/orders/{orderId}/mockups` | M, S | Xem; S tải phiên bản mới | FR-20, FR-39 |
| `PATCH /api/orders/{orderId}/mockups/{versionNo}` | M | `{reviewStatus: APPROVED \| CHANGES_REQUESTED, reviewNote}` | FR-20 |
| `GET\|PUT /api/orders/{orderId}/invoice` | M, S | M tải về; S gắn file | FR-25, FR-44 |
| `POST /api/orders/{orderId}/payments` | M | Phần còn lại của đơn đặt hàng → `{paymentId, paymentUrl}` | FR-22 |
| `GET\|POST /api/orders/{orderId}/dispute` | M, S, A | M mở khiếu nại; cả ba xem | FR-12, AC-49.1 |
| `PATCH /api/orders/{orderId}/dispute` | A | `{decision, refundAmount?, decisionReason}` | AC-49.2 |
| `POST /api/orders/{orderId}/dispute/evidences` | M, S | Gắn bằng chứng của mỗi bên | AC-49.1 |
| `GET\|POST /api/orders/{orderId}/reviews` | M | Đánh giá sản phẩm trong đơn mua ngay đã giao | FR-11, BR-32 |

Dispute nằm trong Order vì nó chặn chuyển trạng thái tiền của đơn (BR-18) và mỗi đơn tối đa một khiếu nại mở. Khách xem đánh giá theo sản phẩm qua `GET /api/products/{productId}/reviews`: catalog giữ bản sao đánh giá từ sự kiện `review.created`, vì đường dẫn này thuộc read model Product ở catalog.

**Vòng đời checkout (P-01).** Một đồng hồ: order đặt `payments.expires_at` (hạn VNPay), `checkouts.expires_at` (hạn đó + 5 phút) và gửi giá trị sau sang vendor làm hạn giữ hàng.

| Từ | Sự kiện | Sang |
| --- | --- | --- |
| `PENDING_PAYMENT` | `payment.succeeded` | `SUCCEEDED`: chốt hàng đã giữ, tạo đơn với id có sẵn trong `checkout_groups` |
| `PENDING_PAYMENT` | `payment.failed` / quá `expires_at` | `FAILED` / `EXPIRED`: trả hàng |
| `FAILED`, `EXPIRED` | `payment.succeeded` đến trễ | Giữ hàng lại: đủ thì `SUCCEEDED`; không đủ thì `REFUND_REQUESTED`, hoàn tiền `LATE_PAYMENT` |

**Đơn đặt hàng từ `quote.accepted`.** Id đơn = `acceptanceId`: payment-service ghi tiền cọc vào đúng id này (payment.md). Mỗi dòng báo giá thành một `order_items`; dòng custom không có sản phẩm catalog nên `product_id` = `quoteId`. `interprovince` = false vì cách giao đã thỏa thuận trong báo giá (BR-30).

**Chuyển trạng thái (`PATCH /api/orders/{orderId}`).** Người bán chỉ đi đúng bước kế tiếp; mỗi bước ghi một `progress_updates`. `DEPOSITED` → `AWAITING_MOCKUP_APPROVAL` khi có custom, ngược lại → `IN_PRODUCTION`; rời `AWAITING_MOCKUP_APPROVAL` cần một maket `APPROVED` (BR-15). `DELIVERED` đặt `complaint_deadline` (3 ngày mua ngay nội thành, 7 ngày còn lại, Q-10 tạm) và phát `order.delivered`. Người mua xác nhận đã nhận: đơn mua ngay sang `COMPLETED`; đơn đặt hàng sang `COMPLETED` khi `payment.succeeded` (`REMAINDER`) đến (AC-22.2).

**Khóa chuyển tiền (P-02).** `POST /internal/orders/{orderId}/payout-lock` khóa dòng đơn (`SELECT … FOR UPDATE`), kiểm đã nhận hoặc quá hạn khiếu nại và không có khiếu nại mở, rồi ghi `payout_locked_at`; gọi lại trả 200. Mở khiếu nại khóa cùng dòng và trả 409 khi đã khóa chuyển tiền.

## Sự kiện và API nội bộ

**Phát**

- `order.created`, `order.status_changed`, `order.delivered` (kèm `complaintDeadline`), `order.received_confirmed`, `dispute.opened`, `dispute.resolved` → payment, orchestrator
- `mockup.uploaded`, `mockup.reviewed`, `progress.updated`, `invoice.attached` → orchestrator
- `review.created` → catalog

**Nghe**

- `vendor.updated`, `vendor.locked` → `vendor_snapshots`
- `product.removed` → loại khỏi giỏ
- `quote.accepted` → tạo đơn đặt hàng từ snapshot
- `payment.succeeded`, `payment.failed` (`CHECKOUT`, `REMAINDER`) → tạo đơn từ checkout hoặc đóng checkout; ghi đã trả phần còn lại. Thành công: gọi vendor chốt hàng (`POST /internal/stock/reservations/{checkoutId}/commit`); đến trễ (checkout `FAILED`, `EXPIRED`) thì lệnh chốt đó tự lấy hàng lại, 409 thì `REFUND_REQUESTED` và gọi `POST /internal/refunds` (`LATE_PAYMENT`)
- `refund.completed`, `refund.manual_required`, `payout.completed`

**API nội bộ**

- Gọi catalog: `POST /internal/products/snapshot` (phí giao)
- Gọi vendor: `POST /internal/stock/reservations`, `POST /internal/stock/reservations/{checkoutId}/commit`, `DELETE /internal/stock/reservations/{checkoutId}` (xem vendor.md)
- Gọi payment: `POST /internal/payments` (`CHECKOUT` kèm `allocations[]` theo `order_id` có sẵn, `REMAINDER`), `POST /internal/refunds` (`LATE_PAYMENT`)
- Cung cấp `POST /internal/orders/{orderId}/payout-lock` cho payment (P-02)

## Quyết định liên quan

[P-01, P-02, P-06](db-review-proposals.md), [L-05](decisions.md), [L-07](decisions.md), [L-09](decisions.md), [L-10](decisions.md), [L-11](decisions.md), [L-12](decisions.md), [L-13](decisions.md), [L-15](decisions.md), [L-17](decisions.md).
