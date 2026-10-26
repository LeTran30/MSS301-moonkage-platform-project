# Class Log: `QuoteAcceptanceServiceImpl`

- **Package:** `com.moonkage.quotation.service.impl`
- **Tham chiếu:** FR-19, FR-24, AC-19.1 → AC-19.4, BR-04, BR-05, BR-17, BR-22, L-10, D-11, D-12
- **Dependencies:** `QuoteAcceptanceRepository`, `QuoteRepository`, `VendorDirectory`, `RequestAccessPolicy`, `IdentityClient`, `PaymentClient`, `OutboxService`, `QuotationProperties`, `Clock`
- **Luật bất biến:**
  1. Đơn đặt hàng chỉ có khi cọc thành công: trước đó chỉ có lần chấp nhận PENDING_PAYMENT, quote vẫn SUBMITTED.
  2. Số tiền cọc thu đúng `deposit_amount` trong bản chép; `snapshot`, `content_hash`, `deposit_amount` không đổi sau khi ghi (trigger DB).
  3. Mỗi yêu cầu tối đa một lần chấp nhận SUCCEEDED; mỗi báo giá tối đa một lần chấp nhận PENDING_PAYMENT (index DB).
  4. Mọi bước khóa dòng yêu cầu trước, cùng thứ tự với `QuoteServiceImpl`, nên chấp nhận, gửi bản mới và nhận cọc không chen nhau.

## 1. Danh mục Method

| Method | Input | Output | ErrorCode | Mục đích |
| --- | --- | --- | --- | --- |
| `accept` | `accountId`, `requestId`, `quoteId`, `AcceptQuoteRequest?` | `AcceptQuoteResponse` | `NFC_NOT_VERIFIED`, `REQUEST_NOT_FOUND`, `REQUEST_ALREADY_AWARDED`, `REQUEST_NOT_OPEN`, `QUOTE_NOT_FOUND`, `QUOTE_NOT_ACCEPTABLE`, `ACCEPTANCE_IN_PROGRESS`, `SELF_DEALING`, `VENDOR_NOT_ACCEPTING_ORDERS`, `VENDOR_TAX_CODE_MISSING` | Tạo bản chép và giao dịch cọc |
| `getAcceptance` | `accountId`, `role`, `requestId`, `quoteId` | `AcceptanceResponse` | `REQUEST_NOT_FOUND`, `QUOTE_NOT_FOUND`, `ACCEPTANCE_NOT_FOUND` | Lần chấp nhận mới nhất của báo giá |
| `recordDepositPaid` | `acceptanceId`, `paidAt` | — | `ACCEPTANCE_NOT_FOUND` | Chốt báo giá, hoặc hoàn cọc đến trễ |
| `recordDepositFailed` | `acceptanceId` | — | `ACCEPTANCE_NOT_FOUND` | Mở khóa báo giá |
| `expireOverdue` | — | `int` | — | Lần chấp nhận quá hạn trả cọc → EXPIRED |

## 2. Pseudocode

### `accept(accountId, requestId, quoteId, body)`
1. **[Guard & Lock]**
   - Gọi identity; NẾU chưa VERIFIED → `NFC_NOT_VERIFIED` (bản chép cần họ tên và CCCD đã che).
   - Khóa dòng yêu cầu. NẾU người gọi không phải người mua → `REQUEST_NOT_FOUND`. NẾU AWARDED → `REQUEST_ALREADY_AWARDED`; không OPEN → `REQUEST_NOT_OPEN`.
   - Báo giá thuộc yêu cầu (không → `QUOTE_NOT_FOUND`); NẾU không SUBMITTED hoặc đã quá `validUntil` → `QUOTE_NOT_ACCEPTABLE`; NẾU đang có lần chấp nhận chờ cọc → `ACCEPTANCE_IN_PROGRESS`.
   - Người bán: NẾU người mua là chủ → `SELF_DEALING`; không `canOperate` → `VENDOR_NOT_ACCEPTING_ORDERS`; bản sao chưa có mã số thuế → `VENDOR_TAX_CODE_MISSING`.
2. **[Bản chép]**
   - `AgreementSnapshot`: yêu cầu, báo giá và dòng hàng, địa chỉ giao, người mua (họ tên, CCCD đã che), người bán (tên, MST), hóa đơn.
   - JSON chuẩn hóa (khóa sắp xếp, ngày dạng ISO) → `contentHash = SHA-256`.
   - `paymentExpiresAt = min(now + depositPaymentTimeout, validUntil)`.
3. **[Lưu & gọi payment]**
   - `saveAndFlush` lần chấp nhận PENDING_PAYMENT.
   - `POST /internal/payments {DEPOSIT, acceptanceId, depositAmount, paymentExpiresAt}`; lỗi → cả transaction rollback, người mua chấp nhận lại được.
   - Ghi `payment_ref = paymentId`.
4. **[Trả]** `{acceptanceId, depositAmount, paymentId, paymentUrl, paymentExpiresAt}`.

### `recordDepositPaid(acceptanceId, paidAt)`
1. **[Lock]** Đọc `requestId` của lần chấp nhận, khóa dòng yêu cầu, rồi mới nạp lần chấp nhận. NẾU đã SUCCEEDED → trả về (sự kiện lặp).
2. **[Còn thắng được?]** Lần chấp nhận còn PENDING_PAYMENT, yêu cầu còn OPEN, báo giá còn SUBMITTED và yêu cầu chưa có lần chấp nhận SUCCEEDED nào.
   - KHÔNG: lần chấp nhận còn chờ thì → FAILED; gọi `POST /internal/refunds {paymentId, QUOTE_EXPIRED, depositAmount}`; dừng.
3. **[Chốt]** Lần chấp nhận → SUCCEEDED (`paid_at`); báo giá → ACCEPTED; báo giá SUBMITTED khác của yêu cầu → CLOSED (BR-17); yêu cầu → AWARDED.
4. **[Sự kiện]** Outbox `quote.accepted` mang nguyên `snapshot`, `contentHash`, `acceptanceId` để order tạo đơn đặt hàng.

## 3. Ghi chú

- Gọi payment nằm trong transaction ghi: chấp nhận đổi một lần khóa ngắn lấy việc không bao giờ có lần chấp nhận không có giao dịch.
- `recordDepositPaid`, `recordDepositFailed` chưa có consumer gọi tới (cần RabbitMQ). Hoàn tiền lặp khi sự kiện đến lại được payment chặn (tối đa một lần hoàn tự động mỗi payment, P-03).
- `content_hash` chỉ chứng minh nội dung không bị sửa sau khi chấp nhận; không có chữ ký số.
