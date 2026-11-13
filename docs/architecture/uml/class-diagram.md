# Sơ đồ Class (mô hình miền)

Mỗi microservice có database riêng (D-1). Vì vậy sơ đồ chia theo service:

- **Trong một service:** quan hệ là liên kết JPA thật (`@ManyToOne`, `@OneToMany`), vẽ nét liền kèm bội số.
- **Giữa hai service:** chỉ tham chiếu bằng ID, không có khoá ngoại. Vẽ nét đứt `..>` kèm tên trường giữ ID.

Mỗi class chỉ ghi các thuộc tính có nghĩa nghiệp vụ. Bỏ `createdAt`, `updatedAt`, `version` và các bảng kỹ thuật (`OutboxEvent`, `ProcessedEvent`). Nguồn: entity JPA trong `api/<service>/src/main/java`.

## 1. Toàn cảnh: các thực thể chính và tham chiếu giữa service

```mermaid
classDiagram
    direction LR
    class Account {
        <<identity>>
    }
    class Vendor {
        <<vendor>>
    }
    class Product {
        <<vendor>>
    }
    class QuoteRequest {
        <<quotation>>
    }
    class Quote {
        <<quotation>>
    }
    class Order {
        <<order>>
    }
    class Dispute {
        <<order>>
    }
    class Payment {
        <<payment>>
    }
    class Ledger {
        <<payment>>
    }
    class Notification {
        <<orchestrator>>
    }

    Vendor "0..1" ..> "1" Account : ownerAccountId
    Vendor "1" --> "0..*" Product
    QuoteRequest ..> Account : buyerAccountId
    QuoteRequest "1" --> "0..*" Quote
    Quote ..> Vendor : vendorId
    Order ..> Account : buyerAccountId
    Order ..> Vendor : vendorId
    Order ..> Quote : quoteId (đơn đặt hàng)
    Order "1" --> "0..*" Dispute
    Payment ..> Order : referenceId
    Ledger "1" ..> "1" Order : orderId
    Notification ..> Account : recipientAccountId
```

## 2. identity-service

```mermaid
classDiagram
    class Account {
        +String id
        +Email email
        +PhoneNumber phoneNumber
        +PasswordHash passwordHash
        +Role role
        +boolean accountVerified
    }
    class UserProfile {
        +String accountId
        +String fullName
        +String avatarKey
    }
    class LegalProfile {
        +String accountId
        +String legalName
        +String idNumberHash
        +String idNumberMasked
        +Instant nfcVerifiedAt
    }
    class Address {
        +String id
        +String recipientName
        +PhoneNumber recipientPhone
        +String provinceCode
        +String wardName
        +String detail
        +boolean isDefault
    }
    class Role {
        <<enumeration>>
        MEMBER
        ADMIN
    }
    class NfcStatus {
        <<enumeration>>
        NOT_VERIFIED
        VERIFIED
        LOCKED
    }
    Account "1" -- "1" UserProfile
    Account "1" -- "0..1" LegalProfile : xác minh NFC
    Account "1" -- "0..*" Address
    Account --> Role
    LegalProfile ..> NfcStatus : suy ra
```

`Email`, `PhoneNumber`, `PasswordHash` là value object, nhúng vào bảng `accounts`. `NfcStatus` không lưu thành cột: có `nfcVerifiedAt` thì là `VERIFIED`, đang bị khoá do sai nhiều lần thì là `LOCKED`, còn lại là `NOT_VERIFIED` (`LegalProfileServiceImpl`). Số CCCD chỉ lưu dạng băm và dạng đã che.

## 3. vendor-service

```mermaid
classDiagram
    class Vendor {
        +String id
        +String ownerAccountId
        +String businessName
        +VendorEntityType entityType
        +TaxCode taxCode
        +ProvinceCode provinceCode
        +BankAccount bankAccount
        +boolean sellsShop
        +boolean acceptsOrders
        +VendorStatus status
        +String statusReason
        +DeliveryFee localDeliveryFee
        +Instant registrationFeePaidAt
        +resubmit(profile)
        +decide(decision, reason)
        +lock(reason)
        +canOperate() bool
    }
    class VendorDocument {
        +String id
        +DocumentKind kind
        +String objectKey
    }
    class VendorReview {
        +String id
        +String adminAccountId
        +ReviewDecision decision
        +String reason
        +Instant decidedAt
    }
    class DeliveryArea {
        +String id
        +ProvinceCode provinceCode
    }
    class OrderProfile {
        +String id
        +Quantity minQty
        +int leadTimeDays
        +Quantity weeklyCapacity
        +Set~CustomType~ customTypes
    }
    class RefPriceTier {
        +Quantity fromQty
        +Price unitPrice
    }
    class Product {
        +String id
        +String vendorId
        +String name
        +Price listPrice
        +int stock
        +LocalDate expiryDate
        +Quantity quoteThreshold
        +List~String~ imageKeys
        +ProductStatus status
        +hide()
        +show()
        +remove(reason)
    }
    class ProductPriceTier {
        +String id
        +Quantity fromQty
        +Price unitPrice
    }
    class StockReservation {
        +String checkoutId
        +String productId
        +Quantity qty
        +Price unitPrice
        +ReservationStatus status
        +Instant expiresAt
    }
    class CakeAttribute {
        +String id
        +CakeAttributeGroup attributeGroup
        +CakeAttributeCode code
        +CakeAttributeLabel label
        +boolean active
    }
    class RegistrationFeeConfig {
        +Price amount
        +Instant effectiveFrom
    }

    Vendor "1" *-- "1..*" VendorDocument
    Vendor "1" -- "0..*" VendorReview : lịch sử duyệt
    Vendor "1" *-- "0..*" DeliveryArea
    Vendor "1" -- "0..1" OrderProfile
    OrderProfile "1" *-- "0..*" RefPriceTier
    Vendor "1" -- "0..*" Product
    Product "1" *-- "0..*" ProductPriceTier
    Product "0..*" -- "0..*" CakeAttribute : vỏ, nhân
    Product "1" -- "0..*" StockReservation : giữ hàng khi checkout
```

`VendorStatus`: `PENDING`, `NEEDS_INFO`, `APPROVED`, `REJECTED`, `LOCKED`. `ProductStatus`: `ON_SALE`, `HIDDEN`, `REMOVED`. `ReservationStatus`: `HELD`, `COMMITTED`, `RELEASED`. Vòng đời xem [state-machines.md](state-machines.md).

## 4. quotation-service

```mermaid
classDiagram
    class QuoteRequest {
        +String id
        +String buyerAccountId
        +RequestType type
        +String targetVendorId
        +int quantity
        +Long budget
        +LocalDate deliveryDeadline
        +Set~CustomType~ customTypes
        +RequestStatus status
        +award()
    }
    class RequestInvitation {
        +String id
        +String vendorId
        +InvitationStatus status
        +String declineReason
    }
    class Quote {
        +String id
        +String vendorId
        +int revisionNo
        +String supersedesQuoteId
        +List~QuoteItem~ items
        +long totalAmount
        +BigDecimal depositRate
        +long depositAmount
        +long remainingAmount
        +LocalDate deliveryDate
        +Instant validUntil
        +QuoteStatus status
        +withdraw()
        +accept()
        +close()
    }
    class QuoteItem {
        <<embeddable>>
        +QuoteItemKind kind
        +String description
        +CustomType customType
        +int quantity
        +long unitPrice
        +long amount
    }
    class QuoteAcceptance {
        +String id
        +String buyerLegalName
        +String invoiceTaxCode
        +String snapshot
        +String contentHash
        +long depositAmount
        +AcceptanceStatus status
        +Instant paymentExpiresAt
        +succeed(paidAt)
        +fail()
    }
    class VendorSnapshot {
        +String vendorId
        +String businessName
        +boolean canOperate
        +boolean acceptsOrders
        +List~String~ deliveryAreas
    }

    QuoteRequest "1" *-- "0..*" RequestInvitation : mời Shop
    QuoteRequest "1" -- "0..*" Quote
    Quote "1" *-- "1..*" QuoteItem
    Quote "0..1" --> "0..1" Quote : supersedesQuoteId (bản sửa)
    Quote "1" -- "0..*" QuoteAcceptance : mỗi lần bấm chấp nhận
    RequestInvitation ..> VendorSnapshot : vendorId
```

`RequestType`: `DIRECT` (gửi một Shop, FR-15) hoặc `OPEN` (gửi nhiều xưởng, FR-16). `QuoteAcceptance` chụp lại toàn bộ điều khoản (`snapshot`, `contentHash`) tại lúc chấp nhận. Đó là bản thoả thuận mà `Order.agreementHash` trỏ tới.

## 5. order-service

```mermaid
classDiagram
    class CartItem {
        +String buyerAccountId
        +String productId
        +String vendorId
        +Integer quantity
    }
    class Checkout {
        +String id
        +String buyerAccountId
        +Long totalAmount
        +String paymentId
        +CheckoutStatus status
        +Instant expiresAt
    }
    class CheckoutGroup {
        +String vendorId
        +String orderId
        +Long itemsAmount
        +Long shippingFee
        +boolean interprovince
    }
    class CheckoutLine {
        +Integer lineNo
        +String productId
        +String productName
        +Integer quantity
        +Long unitPrice
    }
    class Order {
        +String id
        +OrderKind kind
        +String buyerAccountId
        +String vendorId
        +String quoteId
        +Long totalAmount
        +Long depositAmount
        +Long remainingAmount
        +boolean hasCustom
        +InvoiceInfo invoiceInfo
        +OrderStatus status
        +String trackingCode
        +Instant deliveredAt
        +Instant complaintDeadline
        +Instant payoutLockedAt
    }
    class OrderItem {
        +String productId
        +String productName
        +Integer quantity
        +Long unitPrice
        +Long subtotal
    }
    class MockupVersion {
        +Integer versionNo
        +String objectKey
        +MockupReviewStatus reviewStatus
        +String reviewNote
    }
    class ProgressUpdate {
        +OrderStatus milestone
        +String note
        +List~String~ photoKeys
    }
    class Dispute {
        +String id
        +DisputeReason reason
        +DisputeStatus status
        +DisputeDecision decision
        +Long refundAmount
        +String decidedBy
    }
    class DisputeEvidence {
        +DisputeParty party
        +String objectKey
        +String note
    }
    class Review {
        +String productId
        +Integer rating
        +String content
    }
    class ChatConversation {
        +String buyerAccountId
        +String vendorId
        +Instant lastMessageAt
    }
    class ChatMessage {
        +Long seq
        +String senderAccountId
        +ChatParty senderParty
        +String body
        +String attachmentKey
    }
    class Voucher {
        <<chưa có API>>
        +String code
        +Long discountAmount
        +Long minOrderAmount
        +Instant validTo
        +Integer maxUses
    }

    Checkout "1" *-- "1..*" CheckoutGroup : mỗi Shop một nhóm
    CheckoutGroup "1" *-- "1..*" CheckoutLine
    CheckoutGroup "1" --> "0..1" Order : tạo khi thanh toán xong
    Order "1" *-- "1..*" OrderItem
    Order "1" *-- "0..*" MockupVersion
    Order "1" *-- "0..*" ProgressUpdate
    Order "1" -- "0..*" Dispute
    Dispute "1" *-- "0..*" DisputeEvidence
    Order "1" -- "0..*" Review
    ChatConversation "1" *-- "0..*" ChatMessage
```

`OrderKind`: `BUY_NOW` (mua ngay, tạo từ `Checkout`) hoặc `CUSTOM_ORDER` (đặt hàng, tạo từ sự kiện `quote.accepted`, `Order.id` = `QuoteAcceptance.id`). `Voucher` mới có bảng, chưa có service hay controller.

## 6. payment-service

```mermaid
classDiagram
    class Payment {
        +String id
        +PaymentPurpose purpose
        +String referenceId
        +String payerAccountId
        +Long amount
        +String gatewayTxnRef
        +PaymentStatus status
        +Instant expiresAt
    }
    class PaymentAllocation {
        +String orderId
        +Long amount
    }
    class Ledger {
        +String orderId
        +String vendorId
        +Long totalCollected
        +Long held
        +Long disbursed
        +Long refunded
        +Long paidOut
    }
    class LedgerEntry {
        +LedgerEntryKind kind
        +Long amount
        +String referenceId
        +String actorAccountId
    }
    class Refund {
        +String orderId
        +RefundReason reason
        +String disputeId
        +Long amount
        +RefundStatus status
    }
    class DisbursementRequest {
        +String orderId
        +Long amount
        +Long approvedAmount
        +DisbursementStatus status
        +String decidedBy
    }
    class Payout {
        +String orderId
        +String vendorId
        +Long amount
        +String approvedBy
    }
    class OrderSnapshot {
        +String orderId
        +String vendorId
        +String kind
        +String status
        +Instant complaintDeadline
        +boolean disputeOpen
    }

    Payment "1" *-- "1..*" PaymentAllocation : chia cho từng đơn
    Ledger "1" *-- "0..*" LedgerEntry : sổ ghi
    Ledger ..> OrderSnapshot : orderId
    Refund ..> Payment : originalPaymentId
    DisbursementRequest ..> Ledger : orderId
    Payout ..> Ledger : orderId
```

`PaymentPurpose`: `CHECKOUT` (mua ngay), `DEPOSIT` (cọc), `REMAINDER` (phần còn lại), `REGISTRATION_FEE` (phí mở bán). `OrderSnapshot` là bản sao trạng thái đơn mà payment-service tự giữ (nhận qua sự kiện) để quyết định có được giải ngân không, không gọi sang order-service. Một lần mua ngay nhiều Shop là **một** `Payment` chia thành nhiều `PaymentAllocation`, mỗi đơn một phần. Mỗi đơn có đúng một `Ledger`: `held` là tiền nền tảng đang giữ, `disbursed`, `paidOut`, `refunded` là tiền đã ra.

## 7. orchestrator-service

```mermaid
classDiagram
    class Notification {
        +String id
        +String recipientAccountId
        +String type
        +String title
        +String content
        +String targetUrl
        +boolean read
    }
    class NotificationEventLog {
        +String eventId
        +String recipient
        +String templateCode
        +DeliveryStatus status
    }
    class AuditLog {
        +String id
        +String sourceService
        +String actorAccountId
        +String action
        +String targetType
        +String targetId
        +String reason
        +Instant occurredAt
    }
```

orchestrator-service không có quan hệ JPA giữa các bảng. Dữ liệu tới từ RabbitMQ (`NotificationConsumer`): thông báo trong ứng dụng, email và audit log.
