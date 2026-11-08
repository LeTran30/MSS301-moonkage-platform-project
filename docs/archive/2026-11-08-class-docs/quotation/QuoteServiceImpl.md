# Class Log: `QuoteServiceImpl`

- **Package:** `com.moonkage.quotation.service.impl`
- **Tham chiếu:** FR-17, FR-38, AC-17.3, AC-38.1 → AC-38.3, BR-05, BR-14, BR-22, BR-30, Q-19, L-10
- **Dependencies:** `QuoteRepository`, `QuoteAcceptanceRepository`, `RequestInvitationRepository`, `VendorDirectory`, `RequestAccessPolicy`, `OutboxService`, `Clock`
- **Luật bất biến:**
  1. Báo giá đã gửi không đổi; chỉ `status` chuyển (SUBMITTED → WITHDRAWN, EXPIRED, ACCEPTED, CLOSED).
  2. Mọi số tiền do máy chủ tính từ dòng hàng: `total = items + custom + shipping`, `deposit = floor(total × rate / 100)`, `remaining = total − deposit` (`QuoteTerms`, cùng công thức với CHECK trong DB).
  3. Mỗi người bán tối đa một báo giá SUBMITTED trên một yêu cầu; đổi giá là bản mới thay bản cũ trong cùng transaction.
  4. Báo giá đang chờ cọc không thu hồi được.

## 1. Danh mục Method

| Method | Input | Output | ErrorCode | Mục đích |
| --- | --- | --- | --- | --- |
| `getQuotes` | `accountId`, `role`, `requestId` | `List<QuoteResponse>` | `REQUEST_NOT_FOUND` | Bản mới nhất của mỗi người bán |
| `getQuote` | `…`, `quoteId`, `includeRevisions` | `QuoteResponse` | `REQUEST_NOT_FOUND`, `QUOTE_NOT_FOUND` | Chi tiết, kèm các bản trước |
| `submit` | `accountId`, `requestId`, `SubmitQuoteRequest` | `QuoteResponse` | `ACCESS_DENIED`, `VENDOR_NOT_ACCEPTING_ORDERS`, `REQUEST_NOT_FOUND`, `SELF_DEALING`, `REQUEST_NOT_OPEN`, `INVITATION_NOT_FOUND`, `INVITATION_DECLINED`, `DELIVERY_DATE_PASSED`, `INVALID_VALIDITY`, `INVALID_QUOTE_LINES`, `INVALID_DEPOSIT`, `QUOTE_ALREADY_SUBMITTED`, `INVALID_SUPERSEDED_QUOTE`, `QUOTE_LOCKED` | Gửi báo giá hoặc bản mới |
| `update` | `accountId`, `requestId`, `quoteId`, `UpdateQuoteRequest` | `QuoteResponse` | `INVALID_STATE_TRANSITION`, `QUOTE_NOT_FOUND`, `QUOTE_LOCKED` | Thu hồi |
| `expireOverdue` | — | `int` | — | Đánh dấu EXPIRED báo giá quá hạn, trừ báo giá đang chờ cọc |

## 2. Pseudocode

### `submit(accountId, requestId, body)`
1. **[Guard & Lock]**
   - Người bán của người gọi (không có → `ACCESS_DENIED`); NẾU không nhận đặt hàng hoặc không `canOperate` → `VENDOR_NOT_ACCEPTING_ORDERS`.
   - Khóa dòng yêu cầu. NẾU người bán do người mua làm chủ → `SELF_DEALING`. NẾU yêu cầu không OPEN → `REQUEST_NOT_OPEN`. Không có lời mời → `INVITATION_NOT_FOUND`; lời mời đã từ chối → `INVITATION_DECLINED`.
2. **[Tính điều khoản]**
   - NẾU ngày giao trước hôm nay → `DELIVERY_DATE_PASSED`. NẾU `validDays` ngoài 1–14 → `INVALID_VALIDITY`.
   - Dòng PRODUCT từ `items`; dòng CUSTOM từ `customItems`, NẾU loại custom không có trong yêu cầu → `INVALID_QUOTE_LINES`.
   - `QuoteTerms.compute`: không có dòng PRODUCT hoặc phí giao âm → `INVALID_QUOTE_LINES`; tỷ lệ cọc ngoài (0, 100], quá 2 số lẻ hoặc tiền cọc = 0 → `INVALID_DEPOSIT`. `validUntil = now + validDays`.
3. **[Bản cũ]**
   - NẾU người bán đang có báo giá SUBMITTED khác bản được thay → `QUOTE_ALREADY_SUBMITTED`.
   - Có `supersedesQuoteId`: phải là báo giá của chính người bán trên yêu cầu này, đang SUBMITTED hoặc WITHDRAWN và chưa bị bản nào thay → nếu không `INVALID_SUPERSEDED_QUOTE`. NẾU đang SUBMITTED: chờ cọc → `QUOTE_LOCKED`; ngược lại thu hồi và `saveAndFlush` ngay.
4. **[Lưu & sự kiện]** `Quote.submit` (revision = bản cũ + 1), `saveAndFlush`; lời mời → QUOTED; outbox `quote.submitted`.
5. **[Trả]** `QuoteResponse`.

### `update(accountId, requestId, quoteId, body)`
1. NẾU `status ≠ WITHDRAWN` → `INVALID_STATE_TRANSITION`. Khóa yêu cầu; báo giá phải của người bán người gọi → nếu không `QUOTE_NOT_FOUND`.
2. Có lần chấp nhận PENDING_PAYMENT → `QUOTE_LOCKED`. `quote.withdraw(now)` (chỉ từ SUBMITTED).
3. Outbox `quote.withdrawn`.

## 3. Ghi chú

- Thu hồi bản cũ phải flush trước khi chèn bản mới: Hibernate chèn trước rồi mới cập nhật, nên nếu không flush thì index "một SUBMITTED mỗi người bán" báo trùng.
- `QuoteExpiryJob` chạy mỗi phút: hết hạn lần chấp nhận chưa trả cọc trước, rồi mới hết hạn báo giá; trong lúc chờ, `acceptable` của response và kiểm tra khi chấp nhận đã dùng `validUntil`.
