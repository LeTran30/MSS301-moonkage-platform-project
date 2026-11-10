# Sơ đồ State Machine

Mỗi sơ đồ là vòng đời của một thực thể có trạng thái. Tên trạng thái là giá trị enum trong code, kèm nghĩa tiếng Việt. Nhãn trên mũi tên ghi **ai hoặc cái gì** làm đổi trạng thái và điều kiện chặn (guard) trong ngoặc vuông.

| # | Thực thể | Enum | Nơi đổi trạng thái |
|---|---|---|---|
| 1 | Đơn mua ngay | `OrderStatus` | `CheckoutServiceImpl`, `OrderServiceImpl.nextStatus()` |
| 2 | Đơn đặt hàng | `OrderStatus` | `OrderServiceImpl`, `OrderDocumentServiceImpl` |
| 3 | Phiên thanh toán giỏ hàng | `CheckoutStatus` | `CheckoutServiceImpl` |
| 4 | Yêu cầu báo giá và lời mời | `RequestStatus`, `InvitationStatus` | `QuoteRequest`, `RequestInvitation` |
| 5 | Báo giá | `QuoteStatus` | `Quote`, `QuoteExpiryJob` |
| 6 | Lần chấp nhận báo giá | `AcceptanceStatus` | `QuoteAcceptance`, `QuoteAcceptanceServiceImpl` |
| 7 | Hồ sơ Shop | `VendorStatus` | `Vendor` |
| 8 | Sản phẩm | `ProductStatus` | `Product` |
| 9 | Khiếu nại | `DisputeStatus` | `DisputeServiceImpl` |
| 10 | Thanh toán và hoàn tiền | `PaymentStatus`, `RefundStatus` | `PaymentServiceImpl`, `RefundJob` |
| 11 | Xác minh NFC | `NfcStatus` | `LegalProfileServiceImpl`, `NfcAttemptTracker` |

## 1. Đơn mua ngay (`OrderKind.BUY_NOW`)

Đơn chỉ được tạo **sau khi** tiền đã vào (`payment.succeeded`), nên trạng thái đầu là `PAID`. Chủ Shop chỉ được chuyển đơn sang **đúng một** bước kế tiếp (`nextStatus()`).

```mermaid
stateDiagram-v2
    [*] --> PAID : VNPay báo thanh toán thành công,<br/>đã chốt tồn kho
    PAID --> CONFIRMED : Chủ Shop xác nhận đơn
    CONFIRMED --> SHIPPING : Chủ Shop giao cho vận chuyển<br/>[đơn liên tỉnh phải có mã vận đơn]
    SHIPPING --> DELIVERED : Chủ Shop báo đã giao<br/>/ đặt hạn khiếu nại
    DELIVERED --> COMPLETED : Người mua bấm "Đã nhận hàng"<br/>[không có khiếu nại đang mở]
    COMPLETED --> [*]

    state DELIVERED {
        [*] --> TrongHanKhieuNai
        TrongHanKhieuNai --> CoKhieuNai : Người mua mở khiếu nại
        CoKhieuNai --> TrongHanKhieuNai : Quản trị phân xử
    }

    note right of PAID : Đã thanh toán
    note right of DELIVERED : Đã giao. Tiền vẫn đang giữ,<br/>chưa chuyển cho Shop
```

## 2. Đơn đặt hàng (`OrderKind.CUSTOM_ORDER`)

Đơn được tạo khi tiền cọc đã vào (sự kiện `quote.accepted`). Có in logo hay túi riêng (`hasCustom`) thì phải qua bước duyệt maket (BR-15).

```mermaid
stateDiagram-v2
    [*] --> DEPOSITED : Tiền cọc đã vào,<br/>sự kiện quote.accepted
    DEPOSITED --> AWAITING_MOCKUP_APPROVAL : Chủ Shop tải maket lên<br/>[hasCustom]
    DEPOSITED --> IN_PRODUCTION : Chủ Shop bắt đầu sản xuất<br/>[không có tuỳ chỉnh]
    AWAITING_MOCKUP_APPROVAL --> IN_PRODUCTION : Chủ Shop bắt đầu sản xuất<br/>[có bản maket đã được duyệt]
    IN_PRODUCTION --> READY_TO_SHIP : Chủ Shop báo xong hàng
    READY_TO_SHIP --> DELIVERED : Chủ Shop báo đã giao<br/>/ đặt hạn khiếu nại
    DELIVERED --> COMPLETED : Người mua trả phần còn lại<br/>qua VNPay
    COMPLETED --> [*]

    state AWAITING_MOCKUP_APPROVAL {
        [*] --> PENDING_REVIEW : Chủ Shop tải bản maket
        PENDING_REVIEW --> CHANGES_REQUESTED : Người mua yêu cầu sửa
        CHANGES_REQUESTED --> PENDING_REVIEW : Chủ Shop tải bản mới
        PENDING_REVIEW --> APPROVED : Người mua duyệt
    }

    note right of DEPOSITED : Đã đặt cọc
    note right of AWAITING_MOCKUP_APPROVAL : Chờ duyệt maket.<br/>Mỗi bản maket là một MockupVersion
```

Mỗi lần chuyển bước, order-service ghi một `ProgressUpdate` (ghi chú và ảnh) để người mua theo dõi tiến độ (FR-21).

## 3. Phiên thanh toán giỏ hàng (`CheckoutStatus`)

Một lần bấm "Thanh toán" là một `Checkout`. Phiên này giữ tồn kho ở vendor-service trong lúc chờ VNPay.

```mermaid
stateDiagram-v2
    [*] --> PENDING_PAYMENT : Người mua bấm thanh toán<br/>/ giữ tồn kho, tạo link VNPay
    PENDING_PAYMENT --> SUCCEEDED : payment.succeeded<br/>[chốt được tồn kho]<br/>/ tạo mỗi Shop một đơn PAID
    PENDING_PAYMENT --> REFUND_REQUESTED : payment.succeeded<br/>[hàng đã hết khi tiền tới]<br/>/ yêu cầu hoàn tiền
    PENDING_PAYMENT --> FAILED : payment.failed<br/>/ nhả tồn kho
    PENDING_PAYMENT --> EXPIRED : Quá hạn, CheckoutExpiryJob<br/>/ nhả tồn kho
    SUCCEEDED --> [*]
    REFUND_REQUESTED --> [*]
    FAILED --> [*]
    EXPIRED --> [*]
```

Tồn kho đi kèm (`ReservationStatus` ở vendor-service): `HELD` → `COMMITTED` khi thanh toán xong, hoặc `HELD` → `RELEASED` khi thất bại hay quá hạn.

## 4. Yêu cầu báo giá và lời mời

```mermaid
stateDiagram-v2
    direction LR
    state "Yêu cầu (QuoteRequest)" as REQ {
        [*] --> OPEN : Người mua tạo yêu cầu<br/>[đã xác minh NFC]
        OPEN --> AWARDED : Một báo giá được trả cọc thành công
        AWARDED --> [*]
    }
    state "Lời mời gửi một Shop (RequestInvitation)" as INV {
        [*] --> PENDING : Yêu cầu được gửi tới Shop
        PENDING --> QUOTED : Shop gửi báo giá
        PENDING --> DECLINED : Shop từ chối kèm lý do
        QUOTED --> [*]
        DECLINED --> [*]
    }
```

Enum `RequestStatus` còn `CLOSED` và `EXPIRED`, nhưng hiện chưa có code nào chuyển yêu cầu sang hai trạng thái này.

## 5. Báo giá (`QuoteStatus`)

```mermaid
stateDiagram-v2
    [*] --> SUBMITTED : Chủ Shop gửi báo giá
    SUBMITTED --> WITHDRAWN : Chủ Shop rút lại<br/>(có thể gửi bản sửa mới)
    SUBMITTED --> EXPIRED : Quá validUntil, QuoteExpiryJob<br/>[không có lần đặt cọc đang chờ]
    SUBMITTED --> ACCEPTED : Người mua trả cọc thành công
    SUBMITTED --> CLOSED : Báo giá khác của cùng yêu cầu<br/>được chấp nhận (BR-17)
    WITHDRAWN --> [*]
    EXPIRED --> [*]
    ACCEPTED --> [*]
    CLOSED --> [*]
```

Enum có `REJECTED`, nhưng hiện chưa có code nào chuyển báo giá sang trạng thái này.

## 6. Lần chấp nhận báo giá (`AcceptanceStatus`)

Mỗi lần người mua bấm "Chấp nhận và đặt cọc" tạo một `QuoteAcceptance`. Bản ghi này chụp lại điều khoản, rồi chờ tiền cọc.

```mermaid
stateDiagram-v2
    [*] --> PENDING_PAYMENT : Người mua chấp nhận báo giá<br/>[báo giá còn hiệu lực,<br/>chưa có lần cọc nào đang chờ]
    PENDING_PAYMENT --> SUCCEEDED : Tiền cọc vào<br/>[báo giá vẫn còn nhận được]<br/>/ Quote ACCEPTED, Request AWARDED,<br/>phát quote.accepted
    PENDING_PAYMENT --> FAILED : payment.failed
    PENDING_PAYMENT --> EXPIRED : Quá paymentExpiresAt
    SUCCEEDED --> [*]
    FAILED --> [*]
    EXPIRED --> [*]
```

Nếu tiền cọc tới khi báo giá không còn nhận được nữa (đã hết hạn, hoặc báo giá khác đã thắng), cọc được hoàn lại với lý do `QUOTE_EXPIRED`.

## 7. Hồ sơ Shop (`VendorStatus`)

```mermaid
stateDiagram-v2
    [*] --> PENDING : Thành viên nộp hồ sơ<br/>và giấy tờ
    PENDING --> APPROVED : Quản trị duyệt
    PENDING --> NEEDS_INFO : Quản trị yêu cầu bổ sung<br/>(kèm lý do)
    PENDING --> REJECTED : Quản trị từ chối<br/>(kèm lý do)
    NEEDS_INFO --> PENDING : Chủ hồ sơ nộp lại
    REJECTED --> PENDING : Chủ hồ sơ nộp lại
    APPROVED --> LOCKED : Quản trị khoá vì vi phạm<br/>(kèm lý do)
    LOCKED --> [*]

    state APPROVED {
        [*] --> ChuaDongPhi
        ChuaDongPhi --> DuocBan : Đóng phí mở bán qua VNPay
    }
    note right of APPROVED : Chỉ "Được bán" mới nhận đơn<br/>và yêu cầu (canOperate)
```

Chưa có chức năng mở khoá Shop (`VendorStatus` ghi rõ "Unlocking is not a requirement").

## 8. Sản phẩm (`ProductStatus`)

```mermaid
stateDiagram-v2
    [*] --> ON_SALE : Chủ Shop đăng sản phẩm
    ON_SALE --> HIDDEN : Chủ Shop ẩn
    HIDDEN --> ON_SALE : Chủ Shop hiện lại
    ON_SALE --> REMOVED : Quản trị gỡ vì vi phạm<br/>(kèm lý do)
    HIDDEN --> REMOVED : Quản trị gỡ vì vi phạm
    REMOVED --> [*]
```

Sản phẩm không bao giờ bị xoá, chỉ ẩn hoặc bị gỡ (requirements mục 4.2). Mua ngay chỉ được khi `ON_SALE` và còn đủ tồn kho (`Product.canSupply`).

## 9. Khiếu nại (`DisputeStatus`)

```mermaid
stateDiagram-v2
    [*] --> OPEN : Người mua mở khiếu nại<br/>[đơn đã giao, còn trong hạn,<br/>chưa khoá giải ngân,<br/>chưa có khiếu nại đang mở]
    OPEN --> OPEN : Người mua hoặc Chủ Shop<br/>gửi thêm bằng chứng
    OPEN --> RESOLVED : Quản trị phân xử
    RESOLVED --> [*]

    state RESOLVED {
        direction LR
        [*] --> FULL_REFUND
        [*] --> PARTIAL_REFUND
        [*] --> REJECTED
    }
    note right of RESOLVED : Hoàn toàn bộ hoặc một phần<br/>thì phát dispute.resolved<br/>để payment-service hoàn tiền
```

## 10. Thanh toán và hoàn tiền

```mermaid
stateDiagram-v2
    direction LR
    state "Thanh toán (PaymentStatus)" as PAY {
        [*] --> PENDING : Tạo link VNPay
        PENDING --> SUCCEEDED : VNPay xác nhận
        PENDING --> FAILED : VNPay từ chối hoặc quá hạn
        FAILED --> SUCCEEDED : VNPay xác nhận muộn
        PENDING --> DUPLICATE : Lần trả thứ hai<br/>cho cùng mục đích<br/>/ hoàn tự động
    }
    state "Hoàn tiền (RefundStatus)" as REF {
        [*] --> R_PENDING : Có lý do hoàn tiền
        R_PENDING --> R_SUCCEEDED : VNPay hoàn thành công<br/>(RefundJob)
        R_PENDING --> MANUAL_REQUIRED : VNPay từ chối hoặc quá thời gian
        MANUAL_REQUIRED --> R_SUCCEEDED : Quản trị hoàn tay rồi đánh dấu
    }
```

`R_PENDING` và `R_SUCCEEDED` là tên trong sơ đồ để khỏi trùng với trạng thái của `Payment`. Trong code là `RefundStatus.PENDING` và `RefundStatus.SUCCEEDED`.

## 11. Xác minh NFC (`NfcStatus`)

```mermaid
stateDiagram-v2
    [*] --> NOT_VERIFIED : Tạo tài khoản
    NOT_VERIFIED --> VERIFIED : App gửi dữ liệu thẻ hợp lệ<br/>/ lưu hồ sơ pháp lý
    NOT_VERIFIED --> LOCKED : Sai quá số lần cho phép
    LOCKED --> NOT_VERIFIED : Hết thời gian khoá
    VERIFIED --> [*]
```

`NfcStatus` không lưu thành cột mà được suy ra: có `LegalProfile.nfcVerifiedAt` thì là `VERIFIED`, đang trong thời gian khoá (`NfcLockout`) thì là `LOCKED`.
