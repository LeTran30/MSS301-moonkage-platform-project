# quotation-service (`quotation_db`)

> **Trạng thái:** Đề xuất (2026-10-22). Một phần của [phác thảo API và database](README.md); quyết định ở [decisions.md](decisions.md).
>
> **Migration:** [`V2026_10_22_1000__align_with_api_db_outline.sql`](../../../api/quotation-service/src/main/resources/db/migration/V2026_10_22_1000__align_with_api_db_outline.sql)

Schema đã có khung `tender_*` nhưng chưa có controller nào. Đề xuất đổi tên theo thuật ngữ của Requirement (Request, Quote) ngay bây giờ, khi chưa có code phụ thuộc.

**Bảng**

| Bảng | Cột chính | Ràng buộc | Nguồn |
| --- | --- | --- | --- |
| `quote_requests` **Sửa** (từ `tender_requests`) | `id`, `buyer_account_id`, `type` (DIRECT, OPEN), `target_vendor_id`, `product_id`, `quantity`, `budget`, `custom_spec`, `delivery_deadline`, `delivery_province_code`, `delivery_recipient_name`, `delivery_recipient_phone`, `delivery_address_detail`, `source_order_id`, `status` (OPEN, AWARDED, CLOSED, EXPIRED) | DIRECT → có `target_vendor_id`; `quantity > 0` | FR-15, FR-16, BR-16, BR-22, BR-23 |
| `request_custom_types`, `request_logos` **Sửa** | `request_id`, `custom_type`; `request_id`, `position`, `object_key` |  | BR-14, FR-20 |
| `request_invitations` **Sửa** | `id`, `request_id`, `vendor_id`, `status` (PENDING, QUOTED, DECLINED), `decline_reason`, `responded_at` | `(request_id, vendor_id)` duy nhất; DECLINED bắt buộc lý do | FR-16, FR-36 |
| `quotes` **Sửa** | `id`, `request_id`, `vendor_id`, `revision_no`, `supersedes_quote_id`, `items_amount`, `custom_surcharge`, `shipping_fee`, `total_amount`, `deposit_rate`, `deposit_amount`, `remaining_amount`, `delivery_date`, `delivery_method`, `valid_until`, `notes`, `status` (SUBMITTED, WITHDRAWN, EXPIRED, ACCEPTED, CLOSED, REJECTED), `submitted_at`, `withdrawn_at` | Bất biến sau khi gửi, chỉ `status` đổi; `total = items + surcharge + shipping`; `deposit = floor(total × rate / 100)`; `remaining = total − deposit`; `0 < rate ≤ 100`; `valid_until` 1–14 ngày; mỗi `(request, vendor)` tối đa một SUBMITTED | FR-38, BR-05, BR-30, Q-19 |
| `quote_items` **Mới** | `quote_id`, `line_no`, `kind` (PRODUCT, CUSTOM), `description`, `product_ref`, `custom_type`, `quantity`, `unit_price`, `amount` | `amount = quantity × unit_price`; tổng PRODUCT = `items_amount`; tổng CUSTOM = `custom_surcharge` | AC-38.1, AC-38.2 |
| `quote_acceptances` **Sửa** (bản chép ràng buộc) | `id`, `quote_id`, `request_id`, `buyer_account_id`, `vendor_id`, `buyer_legal_name`, `buyer_id_masked`, `vendor_business_name`, `vendor_tax_code`, `invoice_*`, `snapshot` (jsonb), `content_hash`, `deposit_amount`, `payment_ref`, `status` (PENDING_PAYMENT, SUCCEEDED, FAILED, EXPIRED), `accepted_at`, `paid_at`, `payment_expires_at` | `snapshot`, `content_hash` không đổi sau khi tạo; mỗi yêu cầu tối đa một SUCCEEDED; mỗi báo giá tối đa một PENDING_PAYMENT | FR-19, BR-04, BR-17, D-11, D-12 |
| `vendor_snapshots` **Mới** (kỹ thuật) | Như catalog + `min_qty`, `ref_price_tiers` (jsonb), `lead_time_days`, `custom_capabilities`, `early_bird_offer`, năng lực sản xuất | Từ `vendor.updated` | FR-14, BR-16, D-16 |
| `processed_events`, `outbox_events` **Mới** |  |  | `request.created`, `quote.accepted`, ... |

**Vòng đời báo giá và bản chép ràng buộc (L-10).** Báo giá được chấp nhận là căn cứ để thu cọc, nên mọi con số đều được máy chủ tính, khóa lại và chép nguyên văn lúc chấp nhận.

1. **Gửi:** người bán gửi dòng hàng, dòng custom, phí giao, tỷ lệ cọc, ngày giao, cách giao, hạn hiệu lực. Máy chủ tính `items_amount`, `total_amount`, `deposit_amount`, `remaining_amount`; client không gửi số tiền tổng.
2. **Đổi giá:** không sửa. Người bán thu hồi bản cũ và gửi bản mới trong một transaction: `revision_no + 1`, `supersedes_quote_id` trỏ bản cũ (BR-05). Người mua thấy lịch sử các bản.
3. **Chấp nhận:** kiểm còn hiệu lực, BR-22, người bán `canOperate`. Tạo `quote_acceptances` với `snapshot` gồm báo giá, dòng hàng, yêu cầu, nội dung custom, địa chỉ giao, thông tin hóa đơn, họ tên và CCCD đã che của người mua, tên và mã số thuế của người bán; `content_hash` = SHA-256 của snapshot chuẩn hóa. Giao dịch cọc = đúng `deposit_amount` của snapshot.
4. **Trong lúc chờ cọc:** báo giá bị khóa, người bán không thu hồi được (409). `payment_expires_at` = sớm hơn giữa hạn thanh toán VNPay và `valid_until`; quá hạn thì EXPIRED, báo giá mở khóa.
5. **IPN thành công:** nếu yêu cầu đã có một lần chấp nhận SUCCEEDED khác hoặc báo giá đã hết hiệu lực, ghi FAILED và yêu cầu hoàn tiền (FR-19). Ngược lại: acceptance SUCCEEDED, quote ACCEPTED, báo giá khác CLOSED, yêu cầu AWARDED trong một transaction, phát `quote.accepted` mang nguyên `snapshot` và `content_hash`.
6. **Tạo đơn:** order tạo đơn đặt hàng từ snapshot (không gọi ngược quotation), lưu `agreement_id` và `agreement_hash` trên `orders`. Phần còn lại (FR-22), khiếu nại (FR-49) và xuất file sau này (FR-18) đều đọc từ snapshot này.

Requirement gọi đây là báo giá được chấp nhận và ràng buộc (BR-05); không có chữ ký số nên `content_hash` chỉ chứng minh nội dung không bị sửa sau khi chấp nhận.

**API công khai**

**Root QuoteRequest** (`/api/quote-requests`)

| Method, đường dẫn | Ai | Mục đích | FR |
| --- | --- | --- | --- |
| `POST /api/quote-requests/uploads` | M | Xin chỗ tải logo | FR-15, FR-16 |
| `POST /api/quote-requests` | M (đã NFC) | Tạo yêu cầu `type = DIRECT \| OPEN` kèm `logos[]`; kiểm BR-22, BR-23, BR-31, số lượng tối thiểu; tạo lời mời theo BR-16 | FR-15, FR-16 |
| `GET /api/quote-requests` | M | Yêu cầu của mình, kèm số vendor được mời, số báo giá | AC-16.3 |
| `GET /api/quote-requests?vendorId=` | S | Yêu cầu gửi tới hoặc mời Shop mình | FR-36 |
| `GET /api/quote-requests/{requestId}` | M, S | Chi tiết; với S kèm đơn giá gợi ý theo bậc giá tham khảo | FR-36, AC-38.2 |
| `GET /api/quote-requests/{requestId}/invitations` | M, S | Lời mời (M thấy tất cả, S thấy của mình) | AC-16.3 |
| `PATCH /api/quote-requests/{requestId}/invitations/{vendorId}` | S | `{status: DECLINED, declineReason}` | AC-36.3 |
| `GET /api/quote-requests/{requestId}/quotes` | M, S | Bảng so sánh (M); báo giá của mình (S) | FR-17 |
| `POST /api/quote-requests/{requestId}/quotes` | S | Gửi báo giá {items[], customItems[], shippingFee, depositRate, deliveryDate, deliveryMethod, validUntil, notes, supersedesQuoteId?}; máy chủ tính tổng, cọc, phần còn lại | FR-38 |
| `PATCH /api/quote-requests/{requestId}/quotes/{quoteId}` | S | `{status: WITHDRAWN}`; không sửa trường nào khác (BR-05) | FR-38 |
| `POST /api/quote-requests/{requestId}/quotes/{quoteId}/acceptance` | M | Chấp nhận kèm `invoiceInfo` → `{acceptanceId, paymentUrl}`; thất bại thì gửi lại được | FR-19, FR-24 |
| `GET /api/quote-requests/{requestId}/quotes/{quoteId}/acceptance` | M | Bản chép ràng buộc (snapshot, contentHash) và trạng thái thanh toán cọc | FR-19 |
| `GET /api/quote-requests/{requestId}/quotes/{quoteId}` | M, S | Chi tiết báo giá gồm dòng hàng; ?includeRevisions=true trả cả các bản trước | FR-17, BR-05 |

Yêu cầu trực tiếp cũng sinh một lời mời cho Shop đích, để từ chối và báo giá đi chung một đường với yêu cầu mở. Root giữ BR-17: chấp nhận một báo giá thì các báo giá còn lại đóng trong cùng transaction.

**Root Supplier** (`/api/suppliers`, chỉ đọc)

| Method, đường dẫn | Ai | Mục đích | FR |
| --- | --- | --- | --- |
| `GET /api/suppliers?provinceCode=&customType=&minQty=` | K, M | Đơn vị cung cấp nhận đặt hàng, nhãn "Chỉ nhận đặt hàng" | FR-14, AC-14.3 |
| `GET /api/suppliers/{vendorId}` | K, M | Hồ sơ nhận đặt hàng, cờ `isOwn` | FR-14 |

Hoãn: xuất báo giá ra file (FR-18), đặt lại từ đơn cũ (FR-23, dùng `source_order_id`), lịch công suất (FR-37).

## Sự kiện và API nội bộ

**Phát**

- `request.created`, `request.declined`, `quote.submitted`, `quote.withdrawn` → orchestrator
- `quote.accepted` (snapshot, `contentHash`, `invoiceInfo`, địa chỉ) → order, orchestrator

**Nghe**

- `vendor.updated`, `vendor.locked` → `vendor_snapshots`
- `payment.succeeded`, `payment.failed` (`purpose = DEPOSIT`) → chốt hoặc hủy lần chấp nhận

**API nội bộ**

- Gọi identity: `GET /internal/nfc/status/{accountId}` (BR-23)
- Gọi payment: `POST /internal/payments` (`DEPOSIT`), `POST /internal/refunds` (`QUOTE_EXPIRED`) khi báo giá hết hiệu lực lúc thanh toán

## Quyết định liên quan

[L-07](decisions.md), [L-10](decisions.md), [L-11](decisions.md), [L-12](decisions.md), [L-15](decisions.md), [L-17](decisions.md).
