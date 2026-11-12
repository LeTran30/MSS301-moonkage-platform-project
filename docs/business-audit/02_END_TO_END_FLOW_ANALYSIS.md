# 02 — End-to-End Flow Analysis

## 1. Cách đọc

Tài liệu này phân tích 47 luồng trong inventory theo chuỗi FE → API Gateway → controller/service → database/event → UI. Các nhận định là kết quả phân tích tĩnh. Issue cụ thể được dẫn bằng mã `AUD-*` trong `03_BUSINESS_LOGIC_ISSUES.md`; điểm chưa chốt dùng mã `GAP-*` trong `04_BUSINESS_GAPS.md`.

## 2. A — Account & Authentication

### Happy path

1. `RegisterPage` kiểm tra dữ liệu cơ bản, gọi `POST /api/auth/register`; `AuthServiceImpl` tạo account và gửi OTP qua event email.
2. `RegisterConfirmPage` xác nhận OTP; login cấp access/refresh token. FE lưu token trong `sessionStorage`, sau đó gọi `GET /api/accounts/me` để dựng user state.
3. API Gateway verify HS256, `exp` và claim `type=ACCESS`, loại header caller tự gắn, rồi forward account/role.
4. Refresh token được identity kiểm account và `acceptsTokenIssuedAt`; password reset cập nhật mốc vô hiệu token.
5. NFC session thuộc account, one-time, có hạn; server kiểm định dạng, hạn thẻ, duplicate identity và rate/lock trước khi chuyển `VERIFIED`.

### Failure path và guard

- OTP sai/hết hạn, credential sai, refresh token sai loại/hết hạn đều bị identity từ chối.
- Route guard chỉ là UX; ownership/role quan trọng vẫn được service kiểm lại.
- Gateway không gọi identity để recheck mốc vô hiệu token trên mỗi request. Vì vậy access token phát hành trước khi reset password vẫn đi vào các service khác cho tới khi JWT hết hạn (`AUD-002`).
- Logout chỉ xóa token ở tab, không revoke refresh/access token server-side (`AUD-010`).
- App NFC không có đủ source trong repository; server flow được chứng minh, UX native chưa đủ bằng chứng.

## 3. B — Product Catalog

### Happy path

1. `CatalogPage` gửi province/filter/sort tới `GET /api/products`; catalog query chỉ trả projection phù hợp trạng thái product, vendor operation/Shop và vùng giao.
2. `ProductDetailPage` đọc chi tiết và review; CTA tự mua bị chặn thêm lần nữa khi add cart và checkout.
3. Vendor tạo/cập nhật/gỡ product ở write model. Outbox phát event; catalog adapter cập nhật projection với version guard, tránh event cũ ghi đè event mới.
4. Checkout không tin giá FE hay projection cũ: gọi internal snapshot rồi reserve tại vendor-service; giá đã reserve trở thành snapshot của checkout.

### Failure path và tính nhất quán

- Projection có thể trễ tạm thời do eventual consistency, nhưng checkout authoritative sẽ từ chối trạng thái/stock không còn hợp lệ.
- `expiryDate` bắt buộc nhưng không được kiểm phải ở tương lai; catalog và stock reservation cũng không loại sản phẩm đã hết hạn (`AUD-008`).
- Combo/set/hộp quà hiện là product/description/attributes, chưa có mô hình thành phần tồn kho riêng (`GAP-05`).

## 4. C — Shopping Cart

### Happy path

1. Add-to-cart gửi `productId`, quantity; server kiểm purchasable và self-dealing.
2. `GET /api/carts/me?provinceCode=` hydrate lại product/vendor snapshot, tính group subtotal, `deliverable`, `available` và shipping fee theo Shop.
3. Cart chứa nhiều Shop; checkout sau này tách một order/Shop nhưng thu tiền một lần.
4. Update/delete đều dựa trên cart ownership của account.

### Failure path

- Sản phẩm đổi giá/hết hàng/ngừng bán được phản ánh trong response server, nhưng mapper FE bỏ `available`, `deliverable`, `interprovince` và ép phí `null` thành 0. UI tiếp tục hiển thị tổng thấp hơn và nút checkout; backend chỉ báo lỗi sau submit (`AUD-004`).
- Khi quantity đang là 1, nút giảm gọi update với 0; FE chỉ chặn `< 0`, trong khi DTO backend yêu cầu quantity dương. Người dùng nhận lỗi thay vì line bị xóa (`AUD-005`).
- Checkout vẫn revalidate toàn bộ, nên hai lỗi trên chủ yếu gây sai UX/tổng hiển thị và không làm backend chấp nhận đơn sai.

## 5. D — Checkout

### Happy path

1. `CheckoutPage` tải cart theo province, prefill địa chỉ đã lưu, thu recipient/invoice info.
2. `POST /api/checkouts` không nhận giá/tổng từ FE. `CheckoutServiceImpl.create` tải cart, check buyable/deliverable/self-dealing, tạo `checkoutId`, reserve stock có hạn, tính group/line snapshot, lưu checkout rồi gọi internal payment với `checkoutId` làm idempotency key.
3. FE mở VNPay URL. Nếu payment tạo thất bại, backend đánh checkout failed và cố release reservation.
4. IPN success → stock commit → transaction tạo order theo từng Shop → cart được xử lý. Inbox/outbox và row lock giúp event retry không tạo lặp trên cùng checkout.

### Failure path và concurrency

- Hai lần gọi `POST /api/checkouts` độc lập luôn nhận hai UUID. `useAction` chỉ set React state, không có synchronous/ref lock; hai click trước re-render có thể tạo hai checkout, hai hold và hai payment (`AUD-001`). Idempotency tại payment chỉ bảo vệ retry của cùng `checkoutId`, không bảo vệ duplicate business request.
- Concurrent reserve cùng product được `StockServiceImpl` khóa pessimistic theo thứ tự ID, nên không oversell tại reserve.
- Nếu stock commit sau late payment thất bại, order-service yêu cầu refund và không tạo order.
- Invoice bật nhưng FE không validate bốn field/tax/email trước submit; backend từ chối toàn request, UI chỉ nhận action error thay vì field error (`AUD-007`).
- Voucher không được gửi/tính vì feature được requirements hoãn, xem `GAP-01` chứ không phải bug checkout.

## 6. E — Payment, Refund và Ledger

### Happy path

1. Owner service gọi `POST /internal/payments` với idempotency key ổn định: checkout ID, acceptance ID, order ID hoặc vendor ID.
2. `PaymentServiceImpl` lưu amount/reference/purpose, sinh VNPay URL. IPN verify secure hash, transaction reference và amount; row lock đảm bảo callback đầu tiên quyết định.
3. `gatewayResponseCode` đã có khiến callback lặp trở thành no-op. Unique-success/purpose/reference và refund path xử lý duplicate/late payment.
4. `PaymentResultPage` không kết luận chỉ từ query return; nó đọc signed return rồi poll payment/checkout server-side, nên refresh không làm mất business state.
5. Payment event tạo/cập nhật ledger. Refund chỉ dịch chuyển `refunded/held` sau `SUCCEEDED`; gateway từ chối chuyển `MANUAL_REQUIRED` để admin xác nhận thủ công.

### Failure path

- Payment timeout phát `payment.failed`, owner release stock hoặc expire acceptance.
- Payment success nhưng order transaction lỗi: inbox/status/order/outbox cùng transaction rollback, message có thể redeliver. Stock commit idempotent; rủi ro vận hành còn lại là poison message/DLQ cần monitoring (`GAP-11`).
- `vnpay.confirm-on-return` mặc định `false`; nếu môi trường bật `true`, return có thể mutate trái BR-25. Không có bằng chứng cấu hình triển khai nên chỉ ghi rủi ro cấu hình ở `GAP-12`.
- Refund completion cập nhật ledger nhưng order không có state `REFUNDED/CANCELLED`; semantics sau hoàn tiền chưa được product chốt (`GAP-02`).

## 7. F — Order Management

### Happy path

- API list/detail áp scope buyer/vendor/admin; `OrderServiceImpl` kiểm ownership lại ở write path.
- Vendor chỉ đi state kế tiếp; custom order bắt buộc mockup approval trước production; đơn liên tỉnh cần tracking khi shipping.
- Buyer xác nhận nhận hàng; complaint deadline và payout eligibility được tính. Remainder chỉ được tạo cho custom order ở `DELIVERED`; success chuyển `COMPLETED`.
- Progress update, mockup version và invoice được lưu riêng, tạo timeline/hồ sơ dispute.

### State transition

```text
BUY_NOW: PAID -> CONFIRMED -> SHIPPING -> DELIVERED -> COMPLETED
CUSTOM:  DEPOSITED -> AWAITING_MOCKUP_APPROVAL -> IN_PRODUCTION
         -> READY_TO_SHIP -> DELIVERED -> COMPLETED
```

### Failure path

- Buyer không thể update order vendor; vendor khác không thể update do vendor ownership lookup.
- Không có cancellation/refund state hay cancel command. Requirements Q-01 còn mở và nói đi qua dispute, nên đây là business gap, không kết luận bug (`GAP-02`).
- Nhiều Shop tạo nhiều order nhưng cùng recipient/province và không có promised delivery date riêng cho BUY_NOW (`GAP-06`).
- Lịch sử transition đầy đủ dạng immutable status history chưa thấy API/model riêng; hiện có current status và progress updates (`GAP-07`).

## 8. G — Custom Order & Quotation

### Happy path

1. Buyer verified NFC tạo DIRECT hoặc OPEN request; server kiểm deadline/address, self-dealing và vendor capability. OPEN match thêm delivery areas.
2. Chỉ vendor được mời, đang hoạt động mới gửi quote. Quote tính item total + shipping, deposit, delivery date, validity; sửa giá tạo revision/supersede, không mutate quote đã gửi.
3. Acceptance recheck buyer ownership, NFC, quote live/chưa hết hạn, vendor active/tax identity và self-dealing. Deposit expiry không vượt quote expiry.
4. Deposit success lock request; quote thắng award request, các quote còn lại đóng; duplicate event bị inbox chặn. Late deposit được yêu cầu refund.
5. Event agreement tạo custom order idempotent theo acceptance ID.

### Failure path

- Quote hết hạn bị sweep và acceptance cũng kiểm thời điểm hiện tại, nên không thể accept hợp lệ sau expiry.
- `QuoteServiceImpl.toTerms` chỉ chặn `deliveryDate < today`, không chặn delivery sau `QuoteRequest.deliveryDeadline`; buyer có thể nhận và accept đề xuất trái hạn giao ban đầu (`AUD-009`).
- Direct request không áp delivery area, trong khi requirements có chủ đích cho custom shipping được thương lượng nhưng AC giữa DIRECT/OPEN chưa hoàn toàn đồng nhất (`GAP-03`).
- Enum request có `CLOSED/EXPIRED`, nhưng source chỉ thấy `award()` chuyển `AWARDED`; vòng đời đóng/hết hạn của request chưa có rule/scheduler rõ (`AUD-011`).
- Export quote và reorder được requirements đánh dấu deferred/chưa hoàn chỉnh (`GAP-08`, `GAP-09`).

## 9. H — Vendor Management và Stock

### Happy path

- Chủ account verified NFC nộp hồ sơ; admin review/lock; approved vendor trả registration fee mới có thể operate.
- Vendor ownership được kiểm ở service, không dựa vào role `VENDOR`. Một account có thể sở hữu vendor nhưng gateway role vẫn là `MEMBER`.
- Product CRUD, delivery areas, order profile và attributes có owner/admin guard; event cập nhật catalog projection.
- Reserve stock lock product theo thứ tự ổn định, giảm available stock và lưu reservation lines. Retry cùng checkout trả cùng reservation; commit/release idempotent; sweep release expired hold.

### Failure path

- Vendor khác không thể sửa product/order do check owner.
- Nếu catalog projection trễ, checkout snapshot/reserve vẫn là lớp chặn cuối.
- FE giải ngân lọc theo `ledger.payable`, tức điều kiện payout sau giao hàng, nên ẩn chính các order custom có cọc đang giữ mà FR-41 cho phép xin vốn sớm (`AUD-006`).
- FE so requested amount với tổng available của mọi ledger, không phải held/remaining deposit của order đang chọn; backend từ chối muộn (`AUD-012`).

## 10. I — Review & Dispute

### Happy path

- Review: buyer owner, `BUY_NOW`, order `DELIVERED/COMPLETED`, đúng product trong order, unique `(order, product)`; custom order bị BR-32 loại trừ.
- Dispute: buyer mở sau delivery và trước complaint deadline; một open dispute/order; buyer/vendor thêm evidence khi open.
- Payout và mở dispute dùng cùng order lock. `lockForPayout` chỉ cho qua khi nhận hàng hoặc quá deadline và không có open dispute, loại race payout-vs-dispute.
- Admin resolve bắt buộc decision/reason và amount hợp lệ; event sang payment tạo refund một lần/dispute. Refund lỗi chuyển manual queue.

### Failure path

- Review sớm/trùng/sai order bị backend từ chối kể cả gọi API trực tiếp.
- Dispute muộn hoặc order chưa giao bị từ chối.
- Refund lớn hơn số held sau disbursement là Q-01 chưa quyết; backend bảo toàn ledger nhưng product policy chưa đầy đủ (`GAP-02`).
- Sau khi admin quyết định refund, buyer thấy quyết định/amount nhưng chưa có unified order/refund lifecycle để phân biệt “đã quyết”, “đang hoàn”, “đã hoàn” (`GAP-04`).

## 11. J — Chat & Notification

### Happy path chat

- Start conversation chặn tự chat với Shop mình và dùng unique buyer/vendor pair.
- Mọi thread/send/read/typing gọi `partyOf`: chỉ buyer hoặc current vendor owner. Attachment dùng temp upload key.
- Message/read/typing phát `chat.*`; orchestrator `ChatConsumer` push STOMP tới hai phía. Message/read state bền ở order DB, typing chỉ là hint realtime.

### Notification và failure path

- FE có inbox store, header count, page, read/read-all API và `/user/queue/notifications` bridge.
- Orchestrator có queue `orchestrator.inapp.queue`, consumer, `InAppEventHandler`, DB repository và STOMP publisher.
- Tuy nhiên toàn repository không có producer `InAppNotificationEvent` hay routing key `orchestrator.inapp.*` ngoài chính orchestrator. Các domain event không tự biến thành inbox notification. Vì vậy các notification nghiệp vụ thông thường không đi tới inbox (`AUD-003`).
- NFC/chat realtime đi queue riêng và không bù cho notification inbox.

## 12. Đánh giá các trường hợp đặc biệt bắt buộc

| Trường hợp | Kết luận tĩnh |
|---|---|
| Double click checkout | Không an toàn ở business-request level; `AUD-001` |
| Duplicate payment callback | Có signature/amount/row lock/processed guard; đạt |
| Concurrent stock reservation | Pessimistic lock + deterministic order; đạt |
| Payment success, order creation fail | Transaction rollback + redelivery/idempotency; cần DLQ/ops evidence |
| Order canceled nhưng payment success | Cancellation chưa được mô hình hóa; `GAP-02` |
| Refund success nhưng order không cập nhật | Ledger cập nhật, order không có refunded state; `GAP-02/GAP-04` |
| Quote hết hạn vẫn accept | Backend recheck expiry; đạt |
| Buyer/vendor thao tác order người khác | Ownership guard server-side; đạt theo source |
| Review trước nhận hàng | Bị chặn server-side; đạt |
| Dispute sau deadline | Bị chặn server-side; đạt |
| FE báo success khi BE fail | Payment page poll server; đạt; các action khác hiển thị error chung |
| Refresh làm mất state | Payment/checkout/order state đọc lại từ server; token ở sessionStorage giữ trong cùng tab |
| Retry tạo dữ liệu trùng | Event/payment có idempotency; checkout request mới chưa có, `AUD-001` |

