# 03 — Business Logic Issues

## 1. Kết quả tổng hợp

| Phân loại | Số lượng |
|---|---:|
| `CONFIRMED BUG` | 3 |
| `HIGH-RISK LOGIC` | 2 |
| `FE-BE MISMATCH` | 5 |
| `MISSING VALIDATION` | 2 |
| **Tổng** | **12** |

| Severity | Số lượng |
|---|---:|
| CRITICAL | 1 |
| HIGH | 5 |
| MEDIUM | 6 |
| LOW | 0 |

Mức chắc chắn dùng ba mức: **Cao** = code path trực tiếp, không phụ thuộc cấu hình chưa biết; **Trung bình** = kết quả phụ thuộc timing hoặc policy chưa hoàn toàn khóa; **Thấp** = bằng chứng gián tiếp. Không issue nào dưới đây được ghi là đã tái hiện runtime.

## 2. Danh sách issue

### AUD-001 — Double click/retry tạo nhiều checkout độc lập

| Thuộc tính | Giá trị |
|---|---|
| Nghiệp vụ | Checkout, giữ tồn kho, tạo payment |
| Severity / loại | **HIGH / CONFIRMED BUG** |
| Mức chắc chắn | **Cao** về thiếu idempotency; Trung bình về khả năng người dùng kích hoạt đúng timing |

- **Mô tả:** `useAction.run` gọi `setBusy(true)` nhưng không có synchronous/ref guard. `CheckoutServiceImpl.create` sinh `UUID.randomUUID()` cho mọi request và không nhận idempotency key từ client.
- **Kịch bản tái hiện tĩnh:** người mua click nút thanh toán hai lần trước React re-render, hoặc client retry sau mất response. Hai `POST /api/checkouts` cùng cart tạo hai `checkoutId`; nếu stock đủ, mỗi request giữ kho và tạo payment riêng.
- **Expected:** cùng một ý định checkout trong cửa sổ retry trả cùng checkout/payment, hoặc request sau bị từ chối.
- **Actual suy ra:** idempotency của payment chỉ dùng `checkoutId`; hai checkout có hai key khác nhau nên không bị deduplicate.
- **Frontend:** `web/src/shared/lib/useAction.ts:13-27`, `web/src/pages/base/checkout/CheckoutPage.tsx` — `handleProceedToPayment`.
- **Backend endpoint/class:** `POST /api/checkouts`; `CheckoutController.create`; `CheckoutServiceImpl.create` tại `api/order-service/.../CheckoutServiceImpl.java:93`.
- **Event/DB:** hai checkout rows, hai stock reservations, hai payment `PENDING`; mỗi payment có thể phát `payment.succeeded` riêng.
- **Root cause:** thiếu business idempotency key/unique active checkout; UI busy state không phải mutual exclusion.
- **Business impact:** khách có thể thanh toán hai lần, stock bị giữ gấp đôi và sinh đơn trùng.
- **Đề xuất:** client sinh `Idempotency-Key` ổn định cho một submit; backend lưu unique `(accountId, idempotencyKey)`, trả lại response cũ; thêm ref-lock FE và test concurrent/retry.

### AUD-002 — Access token cũ vẫn qua gateway sau khi reset password

| Thuộc tính | Giá trị |
|---|---|
| Nghiệp vụ | Authentication/authorization toàn nền tảng |
| Severity / loại | **CRITICAL / CONFIRMED BUG** |
| Mức chắc chắn | **Cao** |

- **Mô tả:** identity `JwtFilter` kiểm account và `acceptsTokenIssuedAt`, nhưng API Gateway chỉ verify chữ ký, thời hạn và `type=ACCESS`; downstream service tin `X-Account-Id`/role do gateway gắn.
- **Kịch bản:** lấy access token, thực hiện reset password, sau đó dùng token cũ gọi order/payment/vendor API trước khi token hết hạn.
- **Expected:** mốc vô hiệu token được `Account.changePassword` cập nhật phải có hiệu lực trên mọi service theo policy thống nhất.
- **Actual suy ra:** identity endpoints có thể từ chối token cũ, còn các service khác vẫn nhận header hợp lệ từ gateway.
- **Frontend:** token được giữ tại `web/src/shared/api/tokenVault.ts`; không phải root cause.
- **Backend endpoint/class:** mọi authenticated endpoint ngoài identity; `SecurityConfig.jwtDecoder` tại `api/api-gateway/.../SecurityConfig.java:124-133`; đối chứng `identity-service/.../JwtFilter.java:95`.
- **Event/DB:** account/token-issued-at state nằm ở identity DB nhưng gateway không tham chiếu.
- **Root cause:** revocation/account-state validation chỉ cục bộ ở identity, không ở trust boundary gateway.
- **Business impact:** token bị đánh cắp vẫn có thể xem dữ liệu, đặt hàng, thao tác Shop hoặc tiền sau khi chủ account đã reset password để thu hồi quyền, cho tới expiry.
- **Đề xuất:** gateway introspection/cache account security version, hoặc đưa `tokenVersion/securityStamp` vào JWT và phân phối revoke version; test reset password xuyên service. Nếu sau này có khóa/xóa account hoặc đổi role, tái dùng cùng cơ chế.

### AUD-003 — Notification inbox không có publisher domain

| Thuộc tính | Giá trị |
|---|---|
| Nghiệp vụ | In-app notification |
| Severity / loại | **HIGH / CONFIRMED BUG** |
| Mức chắc chắn | **Cao** theo source repository |

- **Mô tả:** FE, inbox API, consumer, DB handler và STOMP push đã tồn tại, nhưng không service nào publish `InAppNotificationEvent`/routing key `orchestrator.inapp.*`.
- **Kịch bản:** order/quote/mockup/dispute thay đổi trạng thái; mở header hoặc `NotificationsPage`.
- **Expected:** domain event tạo notification bền, tăng unread count, push realtime; refresh vẫn đọc lại được.
- **Actual suy ra:** `orchestrator.inapp.queue` không nhận event nghiệp vụ; inbox chỉ có dữ liệu nếu được chèn/publish từ nguồn ngoài repository.
- **Frontend:** `web/src/entities/notification`, `HeaderNotifications`, `NotificationsPage`.
- **Backend endpoint/class:** `GET/POST /api/notifications/**`; `NotificationConsumer.onInAppEvent`, `InAppEventHandler.handle`; binding tại `RabbitConfig.java:34,108`.
- **Event/DB:** thiếu producer sang `orchestrator.inapp.#`; `notifications` table và event log không được lấp bởi domain flow.
- **Root cause:** có channel infrastructure nhưng thiếu adapter mapping domain events → recipient notification.
- **Business impact:** buyer/vendor bỏ lỡ quote, maket, order, dispute và money action; vi phạm các AC yêu cầu thông báo.
- **Đề xuất:** định nghĩa mapping event-recipient-template, publish qua outbox hoặc orchestrator consume domain keys, bảo đảm eventId idempotent; thêm contract/integration test end-to-end.

### AUD-004 — Cart mapper làm mất availability/deliverability và biến phí không xác định thành 0

| Thuộc tính | Giá trị |
|---|---|
| Nghiệp vụ | Cart/checkout pricing |
| Severity / loại | **HIGH / FE-BE MISMATCH** |
| Mức chắc chắn | **Cao** |

- **Mô tả:** backend trả group `deliverable`, line `available`, `interprovince` và `shippingFee=null` khi không giao được. `mapCartDtoToEntity` bỏ các cờ và dùng `shippingFee ?? 0`.
- **Kịch bản:** product hết hàng/ngừng bán hoặc Shop không giao tới tỉnh; mở cart/checkout.
- **Expected:** line/group bị đánh dấu không hợp lệ, tổng không giả là có thể thanh toán, CTA bị khóa và nêu lý do.
- **Actual suy ra:** UI cộng mọi line, coi phí là 0, cho submit; backend `CheckoutServiceImpl.checkBuyable` mới từ chối.
- **Frontend:** `web/src/entities/cart/api/cartApi.ts:35-55`; `CartPage`, `CheckoutPage`.
- **Backend endpoint/class:** `GET /api/carts/me`; `CartServiceImpl`; `CartResponse`; `POST /api/checkouts` → `CheckoutServiceImpl`.
- **Event/DB:** không có mutation sai; mismatch ở response mapping/UI state.
- **Root cause:** entity FE không biểu diễn đủ contract cart.
- **Business impact:** hiển thị tổng sai, checkout dead-end, giảm tin cậy giá/phí.
- **Đề xuất:** mở rộng FE model, giữ `null`/unknown fee, render trạng thái từng line/group, disable checkout; contract test với unavailable/undeliverable.

### AUD-005 — Giảm quantity từ 1 gửi giá trị 0 mà backend không chấp nhận

| Thuộc tính | Giá trị |
|---|---|
| Nghiệp vụ | Cart quantity |
| Severity / loại | **MEDIUM / FE-BE MISMATCH** |
| Mức chắc chắn | **Cao** |

- **Mô tả/kịch bản:** `CartPage.changeQuantity` chỉ return khi `quantity < 0`; giảm từ 1 gọi PATCH với 0. `UpdateCartItemRequest` dùng `@Positive`.
- **Expected:** 0 xóa line hoặc nút giảm bị disable và người dùng dùng delete.
- **Actual suy ra:** backend trả validation error; line vẫn còn.
- **Frontend:** `web/src/pages/base/cart/CartPage.tsx:24`.
- **Backend:** `PATCH /api/carts/me/items/{itemId}`; `UpdateCartItemRequest.java:8`.
- **Event/DB:** không đổi cart do validation fail.
- **Root cause:** boundary quantity không thống nhất.
- **Business impact:** thao tác giỏ bị lỗi ở trường hợp phổ biến.
- **Đề xuất:** FE gọi DELETE khi về 0 hoặc chặn decrement tại 1; thêm boundary test.

### AUD-006 — FE ẩn order đủ điều kiện xin giải ngân cọc sớm

| Thuộc tính | Giá trị |
|---|---|
| Nghiệp vụ | Vendor disbursement, FR-41 |
| Severity / loại | **HIGH / FE-BE MISMATCH** |
| Mức chắc chắn | **Cao** |

- **Mô tả:** trang `VendorDisbursementsPage` chỉ đưa `ledgers.filter(l => l.payable)` vào dropdown. `payable` là điều kiện payout sau giao/qua complaint; backend giải ngân chỉ cần custom order, có held deposit, chưa payout và tổng pending không vượt held.
- **Kịch bản:** custom order vừa cọc, vendor cần vốn nguyên liệu trước production; mở trang giải ngân.
- **Expected:** order xuất hiện với phần cọc còn có thể xin theo AC-41.1/41.2.
- **Actual suy ra:** order chưa payable bị ẩn, vendor không thể gọi capability hợp lệ từ UI.
- **Frontend:** `web/src/pages/vendor/disbursements/VendorDisbursementsPage.tsx:43,107`.
- **Backend:** `POST /api/ledgers/{orderId}/disbursements`; `ReconciliationServiceImpl.requestDisbursement:113-143`.
- **Event/DB:** `disbursement.requested` không thể phát từ UI cho case chính.
- **Root cause:** dùng payout eligibility thay cho disbursement eligibility.
- **Business impact:** phá vỡ mục đích vốn cọc cho nguyên liệu/in ấn, có thể làm trễ custom order.
- **Đề xuất:** backend trả field `disbursementEligible`/`remainingDisbursableDeposit`; FE lọc theo field đó; test order `DEPOSITED`.

### AUD-007 — Form hóa đơn không validate trước khi submit checkout

| Thuộc tính | Giá trị |
|---|---|
| Nghiệp vụ | Checkout/invoice |
| Severity / loại | **MEDIUM / FE-BE MISMATCH** |
| Mức chắc chắn | **Cao** |

- **Mô tả:** khi `needInvoice=true`, handler gửi trực tiếp company name/tax code/address/email, không kiểm blank/format; backend yêu cầu `@NotBlank`, tax regex và `@Email`.
- **Kịch bản:** bật xuất hóa đơn, để trống hoặc nhập tax/email sai, bấm thanh toán.
- **Expected:** FE đánh dấu field trước request và không tạo checkout.
- **Actual suy ra:** backend trả 400; `useAction` chỉ hiển thị error action chung, không gắn lỗi vào field.
- **Frontend:** `CheckoutPage.tsx:57-95`, `InvoiceRequestForm`.
- **Backend:** `POST /api/checkouts`; `CreateCheckoutRequest.InvoiceInfoRequest`.
- **Event/DB:** validation xảy ra trước mutation.
- **Root cause:** FE chỉ validate recipient/phone, không mirror invoice constraints.
- **Business impact:** checkout bị chặn muộn, khó hiểu với khách doanh nghiệp.
- **Đề xuất:** shared schema/field validation và map error code → field; backend vẫn giữ validation authoritative.

### AUD-008 — Sản phẩm có thể lưu/hiển thị/giữ kho với hạn sử dụng đã qua

| Thuộc tính | Giá trị |
|---|---|
| Nghiệp vụ | Product expiry/safety |
| Severity / loại | **MEDIUM / MISSING VALIDATION** |
| Mức chắc chắn | **Cao** về code; requirement chỉ yêu cầu field nên không nâng thành confirmed bug |

- **Mô tả:** `ProductDetails` chỉ `require(expiryDate != null)`; catalog query và `StockServiceImpl` không kiểm expiry.
- **Kịch bản:** vendor tạo/cập nhật product với ngày hôm qua, bật bán; buyer tìm, add cart và checkout.
- **Expected:** policy hạn dùng tối thiểu được server enforce, ít nhất không bán hàng đã hết hạn.
- **Actual suy ra:** expiry không tham gia eligibility; nếu các điều kiện khác đúng, flow tiếp tục.
- **Frontend:** `VendorProductFormPage`, catalog/detail chỉ hiển thị ngày.
- **Backend:** product CRUD; catalog GET; internal reserve; `ProductDetails.java:73`.
- **Event/DB:** expired date được projection sang catalog.
- **Root cause:** expiry là dữ liệu mô tả, chưa là business invariant.
- **Business impact:** rủi ro bán thực phẩm hết hạn/không đủ hạn đến ngày giao.
- **Đề xuất:** PO chốt shelf-life rule; server validate create/update và recheck tại listing/reserve theo Vietnam time; batch unlist; test boundary.

### AUD-009 — Báo giá cho phép ngày giao sau deadline của yêu cầu

| Thuộc tính | Giá trị |
|---|---|
| Nghiệp vụ | Quotation/delivery commitment |
| Severity / loại | **MEDIUM / MISSING VALIDATION** |
| Mức chắc chắn | **Cao** về thiếu check; Trung bình về policy accept proposal muộn |

- **Mô tả:** request có `deliveryDeadline`; `QuoteServiceImpl.toTerms` chỉ chặn ngày giao trước hôm nay, không so với request.
- **Kịch bản:** request deadline 10/09; vendor quote delivery 20/09; buyer vẫn có thể accept và trả cọc.
- **Expected:** hoặc chặn quote sau deadline, hoặc yêu cầu buyer xác nhận rõ deadline thay đổi trước thanh toán.
- **Actual suy ra:** quote được submit/accept bình thường nếu các rule khác hợp lệ.
- **Frontend:** `VendorRequestDetailPage` gửi `deliveryDate`; `RequestComparePage` hiển thị.
- **Backend:** `POST /api/quote-requests/{id}/quotes`; `QuoteServiceImpl.toTerms:191-217`.
- **Event/DB:** agreement snapshot chứa cả requested deadline và quoted delivery date nhưng không enforce relation.
- **Root cause:** thiếu invariant/explicit deviation workflow.
- **Business impact:** custom mooncake có thể giao sau sự kiện dù buyer ban đầu ghi hạn.
- **Đề xuất:** chốt policy; ưu tiên chặn `deliveryDate > deliveryDeadline`, hoặc bắt buyer explicit override có audit trước acceptance.

### AUD-010 — Logout không revoke session phía server

| Thuộc tính | Giá trị |
|---|---|
| Nghiệp vụ | Session/logout |
| Severity / loại | **HIGH / HIGH-RISK LOGIC** |
| Mức chắc chắn | **Cao** về implementation; risk phụ thuộc token exposure/lifetime |

- **Mô tả:** `sessionApi.logout` chỉ `clearTokens()` và reset FE store; không có endpoint revoke refresh token/access token.
- **Kịch bản:** token đã bị sao chép ở thiết bị khác; chủ account logout trên browser.
- **Expected:** theo kỳ vọng “đăng xuất khỏi phiên”, refresh token của phiên bị revoke; tùy policy có thể revoke access token ngắn hạn.
- **Actual suy ra:** bản token đã sao chép dùng được tới expiry/refresh policy.
- **Frontend:** `web/src/entities/user/api/sessionApi.ts:63-68`.
- **Backend:** không có logout/revoke endpoint trong `AuthController`.
- **Event/DB:** không có persisted session/revocation row cho logout.
- **Root cause:** stateless JWT logout chỉ ở client, chưa có session registry/token family revocation.
- **Business impact:** account takeover window kéo dài, đặc biệt với Shop/admin.
- **Đề xuất:** refresh token rotation + token-family store/revoke endpoint; access token TTL ngắn; “logout all”; nối với security stamp của `AUD-002`.

### AUD-011 — Request có CLOSED/EXPIRED nhưng không có transition/sweeper tương ứng

| Thuộc tính | Giá trị |
|---|---|
| Nghiệp vụ | Quote request lifecycle |
| Severity / loại | **MEDIUM / HIGH-RISK LOGIC** |
| Mức chắc chắn | **Cao** theo source hiện có; thời điểm request hết hạn chưa được requirement chốt rõ |

- **Mô tả:** `RequestStatus` khai báo `OPEN, AWARDED, CLOSED, EXPIRED`; `QuoteRequest` chỉ có `award()` và không thấy command/scheduler chuyển `CLOSED/EXPIRED`.
- **Kịch bản:** request qua `deliveryDeadline` mà không có quote thắng; vendor tiếp tục thấy/submit quote nếu invitation/request guards chỉ kiểm `isOpen()`.
- **Expected:** có rule đóng/hết hạn rõ và loại request khỏi actionable queue.
- **Actual suy ra:** request có thể ở `OPEN` vô thời hạn; chỉ quote riêng lẻ hết validity.
- **Frontend:** `RequestsListPage`, `VendorRequestsPage` dựa vào status server.
- **Backend:** quote request GET/quote submit; `RequestStatus.java`, `QuoteRequest.java:141-150`.
- **Event/DB:** không thấy request-expired event/scheduler.
- **Root cause:** data enum đi trước lifecycle implementation/policy.
- **Business impact:** queue rác, quote vô nghĩa sau deadline, buyer/vendor hiểu sai trạng thái.
- **Đề xuất:** PO chốt expiry trigger; thêm close/cancel command và scheduled transition idempotent; ngăn submit sau cutoff.

### AUD-012 — FE kiểm amount giải ngân bằng tổng mọi ledger thay vì order được chọn

| Thuộc tính | Giá trị |
|---|---|
| Nghiệp vụ | Disbursement amount |
| Severity / loại | **MEDIUM / FE-BE MISMATCH** |
| Mức chắc chắn | **Cao** |

- **Mô tả:** `availableBalance` cộng `toReceive` của tất cả ledger và được dùng làm `max`/validation cho request của một `orderId`. Backend dùng `waiting + amount <= selected ledger.held`.
- **Kịch bản:** vendor có order A held 100k và order B 900k; chọn A, UI cho nhập đến tổng 1m, backend từ chối.
- **Expected:** max của order đang chọn = deposit held còn lại sau pending.
- **Actual suy ra:** FE có thể chấp nhận input vượt khả năng order; cũng có thể hiển thị số “có thể giải ngân” sai semantics.
- **Frontend:** `VendorDisbursementsPage.tsx:44,52,130`.
- **Backend:** `POST /api/ledgers/{orderId}/disbursements`; `ReconciliationServiceImpl.requestDisbursement:125-133`.
- **Event/DB:** backend không tạo row khi vượt held, nên toàn vẹn tiền vẫn giữ.
- **Root cause:** aggregate dashboard metric bị tái dùng làm per-order constraint.
- **Business impact:** request thất bại muộn, vendor không biết số vốn thực có thể xin.
- **Đề xuất:** tính max từ selected ledger + pending requests hoặc trả `remainingDisbursable`; đổi nhãn tổng dashboard.

## 3. Các cơ chế đã kiểm tra và không ghi thành bug

- Duplicate VNPay callback: signature/amount check, row lock và processed guard.
- Concurrent stock: pessimistic lock, deterministic product order, idempotent commit/release.
- Payment success nhưng order transaction lỗi: transactional inbox/outbox cho phép redelivery; không thấy đường tạo half-order trong cùng transaction.
- Quote expired acceptance: kiểm expiry lại ở acceptance; late deposit có refund path.
- Ownership order/chat/product: service kiểm lại, không chỉ dựa vào FE route.
- Review sớm/trùng: server guard đầy đủ.
- Dispute/payout race: cùng order lock và recheck open dispute.
- Payment return page: không tự kết luận success từ redirect; poll server-side.

