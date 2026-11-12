# Phase 01 — Kiểm kê cấu trúc package của Order Service

> Phạm vi: chỉ `api/order-service/src/main/java`  
> Loại tài liệu: kiểm kê **AS-IS**  
> Ngày khảo sát: 12/11/2026  
> Ngoài phạm vi: đánh giá kiến trúc mục tiêu, thiết kế TO-BE, refactor, thay đổi Java/test/configuration/dependency.

## 1. Tóm tắt kiểm kê

Order Service hiện có **154 file Java production** dưới root package `com.moonkage.order`:

- 153 top-level type: 57 `class`, 50 `record`, 33 `interface`, 12 `enum`, 1 annotation type.
- 1 `package-info.java` trong `com.moonkage.order.dto`.
- 16 package/subpackage có source file.
- 10 service interface đều có implementation viết tay tương ứng.
- 18 repository interface được Spring Data tạo implementation tại runtime.
- 5 OpenFeign client interface được Spring Cloud OpenFeign tạo proxy tại runtime; `QuotationClient` hiện không khai báo method.
- Không có package hoặc top-level type tên `mapper`; mapping hiện nằm trong private/static method của các service implementation.

Số liệu trên chỉ phản ánh source production trong `src/main/java`; test source không thuộc inventory chính của phase này.

## 2. Cây package AS-IS

```text
com.moonkage.order                                      (1 file)
├── OrderServiceApplication
├── client                                             (5 files)
│   ├── CatalogClient
│   ├── IdentityClient
│   ├── PaymentClient
│   ├── QuotationClient
│   ├── VendorClient
│   └── dto                                            (9 files)
├── config                                             (6 files)
├── controller                                         (9 files)
├── dto                                                (1 package-info.java)
│   ├── event                                          (9 files)
│   ├── request                                        (14 files)
│   └── response                                       (16 files)
├── entity                                             (18 files)
├── enums                                              (10 files)
├── exception                                          (3 files)
├── messaging                                          (4 files)
├── repository                                         (18 files)
├── security                                           (5 files)
└── service                                            (16 files)
    └── impl                                           (10 files)
```

Package hiện tại chủ yếu được tổ chức theo technical layer: `controller`, `service`, `repository`, `entity`, `dto`, `client`, `config`, `exception`. Một số package chứa nhiều loại component khác nhau; các trường hợp này được ghi nhận tại mục 6 mà chưa đưa ra phương án thay đổi.

## 3. Class inventory

### 3.1. Bootstrap

| Type | Loại | Vai trò hiện tại |
|---|---|---|
| `OrderServiceApplication` | Class | Spring Boot entry point; load `.env`, khởi động application, enable scheduling và OpenFeign |

### 3.2. Controller

Package: `com.moonkage.order.controller`

| Type | Loại | Entry point/trách nhiệm hiện tại |
|---|---|---|
| `CartController` | `@RestController` | `/api/carts/me`: đọc, thêm, cập nhật, xóa cart item |
| `ChatController` | `@RestController` | `/api/chat/conversations`: tạo conversation, inbox, thread, gửi/read/typing |
| `CheckoutController` | `@RestController` | `/api/checkouts`: tạo và đọc checkout |
| `DisputeController` | `@RestController` | `/api/orders/{orderId}/dispute`: đọc, mở, thêm evidence, resolve |
| `DisputeQueueController` | `@RestController` | `/api/orders/disputes`: danh sách dispute cho hàng đợi quản trị |
| `InternalOrderController` | `@RestController` | `/internal/orders/{orderId}/payout-lock`: internal entry point cho payment-service |
| `OrderController` | `@RestController` | `/api/orders`: list/detail/stats/update/progress/payment remainder |
| `OrderDocumentController` | `@RestController` | Upload link, mockup, invoice attachment/download |
| `ReviewController` | `@RestController` | `/api/orders/{orderId}/reviews`: list và create review |

Ghi nhận: controller dùng DTO và service; không phát hiện controller phụ thuộc trực tiếp repository hoặc entity.

### 3.3. Service interface

Package: `com.moonkage.order.service`

| Interface | Trách nhiệm thể hiện qua method |
|---|---|
| `CartService` | Đọc cart và thao tác cart item |
| `ChatService` | Conversation, inbox, thread, message, read marker, typing signal |
| `CheckoutService` | Tạo/đọc checkout, xử lý payment event, expire checkout |
| `DisputeService` | Mở/đọc/list/resolve dispute, evidence và payout lock |
| `InboxService` | Đánh dấu event đã xử lý theo `eventId` và `routingKey` |
| `OrderDocumentService` | Upload link, mockup, invoice |
| `OrderService` | Order query/update, progress, remainder payment, tạo order từ quote, payment callback |
| `OrderStatsService` | Thống kê order theo khoảng ngày/vendor |
| `OutboxService` | Enqueue event và state event vào outbox |
| `ReviewService` | Tạo và đọc review của order |

### 3.4. Service implementation

Package: `com.moonkage.order.service.impl`

| Class | Implements | Trách nhiệm hiện tại |
|---|---|---|
| `CartServiceImpl` | `CartService` | Cart persistence, product snapshot validation, mapping cart response |
| `ChatServiceImpl` | `ChatService` | Authorization theo buyer/vendor, chat persistence, account/vendor lookup, file URL, signal event, response mapping |
| `CheckoutServiceImpl` | `CheckoutService` | Catalog snapshot, stock reservation, checkout persistence, payment creation, payment event, order creation |
| `DisputeServiceImpl` | `DisputeService` | Dispute lifecycle, evidence, refund trigger, payout lock, event publication |
| `InboxServiceImpl` | `InboxService` | Ghi `ProcessedEvent`; yêu cầu transaction hiện hữu |
| `OrderDocumentServiceImpl` | `OrderDocumentService` | Mockup/invoice workflow, file attachment, order progress và activity event |
| `OrderServiceImpl` | `OrderService` | Order query/lifecycle, custom order creation, remainder payment, progress và response mapping |
| `OrderStatsServiceImpl` | `OrderStatsService` | Authorization và tổng hợp các projection thống kê từ repository |
| `OutboxServiceImpl` | `OutboxService` | Serialize event, tạo `OutboxEvent`, gắn trace context |
| `ReviewServiceImpl` | `ReviewService` | Review validation/persistence, event và response mapping |

### 3.5. Concrete component nằm trực tiếp trong package `service`

Các type sau không phải interface và không nằm trong `service.impl`:

| Class | Spring stereotype | Trách nhiệm hiện tại | Interface local |
|---|---|---|---|
| `ChatSignalPublisher` | `@Component` | Publish chat signal trực tiếp lên RabbitMQ sau transaction commit | Không |
| `OrderAccess` | `@Component` | Load/lock order và kiểm tra buyer/vendor/admin access | Không |
| `OrderEventPublisher` | `@Component` | Tạo `OrderEvent` và enqueue qua `OutboxService` | Không |
| `OrderFileService` | `@Component` | Presigned upload, attach object, download/public URL qua `ObjectStorage` | Không |
| `OrderProgress` | `@Component` | Chuyển `OrderStatus` và tạo `ProgressUpdate` | Không |
| `VendorDirectory` | `@Component` | Façade quanh `VendorClient` để tra vendor/owner | Không |

### 3.6. Repository

Package: `com.moonkage.order.repository`

| Interface | Base interface | Aggregate/table chính |
|---|---|---|
| `CartItemRepository` | `JpaRepository<CartItem, String>` | Cart item |
| `ChatConversationRepository` | `JpaRepository<ChatConversation, String>` | Chat conversation |
| `ChatMessageRepository` | `JpaRepository<ChatMessage, String>` | Chat message |
| `ChatReadRepository` | `JpaRepository<ChatRead, ChatRead.Key>` | Read marker |
| `CheckoutGroupRepository` | `JpaRepository<CheckoutGroup, CheckoutGroup.Key>` | Checkout group theo vendor |
| `CheckoutLineRepository` | `JpaRepository<CheckoutLine, CheckoutLine.Key>` | Checkout line |
| `CheckoutRepository` | `JpaRepository<Checkout, String>` | Checkout |
| `DisputeEvidenceRepository` | `JpaRepository<DisputeEvidence, String>` | Dispute evidence |
| `DisputeRepository` | `JpaRepository<Dispute, String>` | Dispute, queue và open-dispute query |
| `MockupVersionRepository` | `JpaRepository<MockupVersion, String>` | Mockup version |
| `OrderItemRepository` | `JpaRepository<OrderItem, String>` | Order item |
| `OrderRepository` | `JpaRepository<Order, String>` | Order search và pessimistic lock |
| `OrderStatsRepository` | `Repository<Order, String>` | Projection query cho thống kê order |
| `OutboxEventRepository` | `JpaRepository<OutboxEvent, String>` | Outbox event chưa publish |
| `ProcessedEventRepository` | `JpaRepository<ProcessedEvent, String>` | Consumer idempotency |
| `ProgressUpdateRepository` | `JpaRepository<ProgressUpdate, String>` | Order progress history |
| `ReviewRepository` | `JpaRepository<Review, String>` | Review |
| `VoucherRepository` | `JpaRepository<Voucher, String>` | Voucher |

Không có implementation repository viết tay trong module. Implementation được Spring Data tạo tại runtime từ interface/query declaration.

### 3.7. Entity và persistence model

Package: `com.moonkage.order.entity`

| Type | Loại persistence | Table/vai trò |
|---|---|---|
| `CartItem` | `@Entity` | `cart_items` |
| `ChatConversation` | `@Entity` | `chat_conversations` |
| `ChatMessage` | `@Entity` | `chat_messages` |
| `ChatRead` | `@Entity` | `chat_reads`; dùng composite key `ChatRead.Key` |
| `Checkout` | `@Entity` | `checkouts` |
| `CheckoutGroup` | `@Entity` | `checkout_groups`; composite key |
| `CheckoutLine` | `@Entity` | `checkout_lines`; composite key |
| `Dispute` | `@Entity` | `disputes` |
| `DisputeEvidence` | `@Entity` | `dispute_evidences` |
| `InvoiceInfo` | `@Embeddable` | Value object được embed trong checkout/order |
| `MockupVersion` | `@Entity` | `mockup_versions` |
| `Order` | `@Entity` | `orders` |
| `OrderItem` | `@Entity` | `order_items` |
| `OutboxEvent` | `@Entity` | `outbox_events`; persistence model kỹ thuật |
| `ProcessedEvent` | `@Entity` | `processed_events`; persistence model kỹ thuật |
| `ProgressUpdate` | `@Entity` | `progress_updates` |
| `Review` | `@Entity` | `reviews` |
| `Voucher` | `@Entity` | `vouchers` |

### 3.8. Request DTO

Package: `com.moonkage.order.dto.request`. Tất cả top-level request DTO hiện là Java `record`.

| DTO | Use case |
|---|---|
| `AddCartItemRequest` | Thêm cart item |
| `AttachFileRequest` | Gắn temporary object key vào order |
| `CreateCheckoutRequest` | Tạo checkout và thông tin giao hàng/hóa đơn |
| `CreateReviewRequest` | Tạo review |
| `EvidenceRequest` | Thêm dispute evidence |
| `FileUploadRequest` | Xin presigned upload link |
| `MarkChatReadRequest` | Cập nhật chat read sequence |
| `OpenDisputeRequest` | Mở dispute |
| `ResolveDisputeRequest` | Admin resolve dispute |
| `ReviewMockupRequest` | Buyer duyệt/từ chối mockup |
| `SendChatMessageRequest` | Gửi chat message |
| `StartConversationRequest` | Tạo/tìm chat conversation |
| `UpdateCartItemRequest` | Cập nhật quantity |
| `UpdateOrderRequest` | Chuyển trạng thái/xác nhận nhận hàng |

### 3.9. Response DTO

Package: `com.moonkage.order.dto.response`. Tất cả top-level response DTO hiện là Java `record`.

| DTO | Dữ liệu trả về |
|---|---|
| `CartResponse` | Cart, group theo vendor và line |
| `ChatMessageResponse` | Chat message |
| `ChatThreadResponse` | Thread và paging information |
| `CheckoutResponse` | Trạng thái checkout |
| `ConversationResponse` | Conversation summary |
| `CreateCheckoutResponse` | Checkout/payment URL sau khi tạo |
| `DisputeResponse` | Dispute và evidence |
| `FileLinkResponse` | Download URL |
| `MockupResponse` | Mockup version/review status |
| `OrderResponse` | Order detail/list item |
| `OrderStatsResponse` | Tổng hợp và breakdown thống kê |
| `PaymentLinkResponse` | Payment ID và URL |
| `PayoutLockResponse` | Kết quả internal payout lock |
| `PresignedUploadLinkResponse` | Upload URL/form/key/expiry |
| `ProgressUpdateResponse` | Order progress item |
| `ReviewResponse` | Review data |

### 3.10. Event DTO

Package: `com.moonkage.order.dto.event`. Tất cả top-level event DTO hiện là Java `record`.

| Event type | Hướng sử dụng hiện tại |
|---|---|
| `ChatEvent` | Outgoing; `ChatServiceImpl`/`ChatSignalPublisher` phát chat event |
| `DisputeEvent` | Outgoing; `DisputeServiceImpl` phát dispute event |
| `EventEnvelope<T>` | Wrapper generic dùng bởi outbox API |
| `OrderActivityEvent` | Outgoing; hoạt động mockup/invoice từ `OrderDocumentServiceImpl` |
| `OrderEvent` | Outgoing; trạng thái/snapshot order từ `OrderEventPublisher` |
| `PaymentFailedEvent` | Incoming; `PaymentEventListener` consume |
| `PaymentSucceededEvent` | Incoming; `PaymentEventListener` consume |
| `QuoteAcceptedEvent` | Incoming; `QuoteAcceptedListener` chuyển cho `OrderService` |
| `ReviewCreatedEvent` | Outgoing; `ReviewServiceImpl` enqueue |

### 3.11. External client và client DTO

#### OpenFeign client

Package: `com.moonkage.order.client`

| Interface | Target service | Method hiện có |
|---|---|---|
| `CatalogClient` | catalog-service | `snapshot(...)` |
| `IdentityClient` | identity-service | `getName(...)` |
| `PaymentClient` | payment-service | `createPayment(...)`, `requestRefund(...)` |
| `QuotationClient` | quotation-service | Không có method |
| `VendorClient` | vendor-service | `reserve`, `commit`, `release`, `getVendor`, `findByOwner` |

#### Client DTO

Package: `com.moonkage.order.client.dto`

| DTO | Contract liên quan |
|---|---|
| `AccountNameView` | Response từ identity-service |
| `CreatePaymentRequest` | Request sang payment-service |
| `CreatePaymentResponse` | Response từ payment-service |
| `ProductSnapshotRequest` | Request sang catalog-service |
| `ProductSnapshotResponse` | Response từ catalog-service |
| `RefundRequest` | Request refund sang payment-service |
| `ReserveStockRequest` | Request giữ stock sang vendor-service |
| `StockReservationResponse` | Response giữ/commit stock |
| `VendorView` | Response từ vendor-service |

### 3.12. Messaging và scheduled processing

Package: `com.moonkage.order.messaging`

| Class | Loại component | Trách nhiệm hiện tại |
|---|---|---|
| `CheckoutExpiryJob` | `@Component`, scheduled job | Gọi `CheckoutService.expireOverdue()` theo lịch |
| `JpaOutboxEventSource` | `@Component`, adapter | Implements shared `OutboxEventSource` bằng `OutboxEventRepository` |
| `PaymentEventListener` | `@Component`, Rabbit listener | Route payment succeeded/failed tới checkout/order service |
| `QuoteAcceptedListener` | `@Component`, Rabbit listener | Route `QuoteAcceptedEvent` tới `OrderService.createFromQuote()` |

### 3.13. Configuration

Package: `com.moonkage.order.config`

| Type | Loại | Trách nhiệm hiện tại |
|---|---|---|
| `DotEnvConfig` | Final utility class | Tìm/đọc `.env` và nạp system property lúc bootstrap |
| `LocaleConfig` | `@Configuration` | Locale resolver, message source, Bean Validation message source |
| `OpenApiConfig` | `@Configuration` | OpenAPI metadata và bearer security scheme |
| `OrderFileProperties` | `@ConfigurationProperties` record | File size/type/prefix/lifetime và chuyển thành `FileLimit` |
| `OrderProperties` | `@Configuration` + `@ConfigurationProperties` class | Payment/checkout/complaint/stats time configuration |
| `RabbitConfig` | `@Configuration` | Exchange, queue, binding và routing-key constants |

### 3.14. Exception

Package: `com.moonkage.order.exception`

| Type | Loại | Trách nhiệm hiện tại |
|---|---|---|
| `AppException` | `RuntimeException` | Exception nghiệp vụ mang `ErrorCode` và message arguments |
| `ErrorCode` | Enum | HTTP status, error code và message key của Order Service |
| `GlobalExceptionHandler` | `@RestControllerAdvice` | Map application/storage/common exception thành `ApiResponse` |

### 3.15. Security/web request context

Package: `com.moonkage.order.security`

| Type | Loại | Trách nhiệm hiện tại |
|---|---|---|
| `CurrentUser` | Parameter annotation | Đánh dấu controller parameter cần resolve caller |
| `CurrentUserArgumentResolver` | `HandlerMethodArgumentResolver` | Đọc gateway headers và tạo `CurrentUserInfo` |
| `CurrentUserInfo` | Record | `accountId`, `Role`, helper `isAdmin()` |
| `Role` | Enum | `MEMBER`, `ADMIN` theo gateway role header |
| `WebMvcConfig` | `@Configuration`, `WebMvcConfigurer` | Đăng ký `CurrentUserArgumentResolver` |

### 3.16. Domain/application enum

Package: `com.moonkage.order.enums`

| Enum | Khái niệm |
|---|---|
| `AggregateType` | Loại aggregate dùng trong event/outbox |
| `ChatParty` | Buyer/vendor side trong chat |
| `CheckoutStatus` | Trạng thái checkout |
| `DisputeDecision` | Quyết định xử lý dispute |
| `DisputeParty` | Bên cung cấp evidence |
| `DisputeReason` | Lý do dispute |
| `DisputeStatus` | Trạng thái dispute |
| `MockupReviewStatus` | Trạng thái duyệt mockup |
| `OrderKind` | Buy-now hoặc custom order |
| `OrderStatus` | Vòng đời order |

Ngoài package này, `Role` nằm trong `security` và `ErrorCode` nằm trong `exception`; tổng cộng module có 12 top-level enum.

### 3.17. Mapper

Không phát hiện package `mapper`, class/interface có hậu tố `Mapper`, hoặc mapper framework trong source Order Service.

Mapping hiện được thực hiện bằng private/static method trong service implementation, tiêu biểu:

- `CartServiceImpl.toLine()`;
- `ChatServiceImpl.toConversation()` và `toMessage()`;
- `CheckoutServiceImpl.toItem()` và `copyOf()`;
- `DisputeServiceImpl.toResponse()`;
- `OrderDocumentServiceImpl.toResponse()`;
- `OrderServiceImpl.toResponse()`, `toItem()`, `invoiceOf()`;
- `ReviewServiceImpl.toResponse()`.

Đây chỉ là ghi nhận AS-IS; phase này không kết luận có cần tạo mapper hay không.

## 4. Interface–implementation mapping

### 4.1. Service interface và implementation viết tay

| Interface | Implementation | Cơ chế đăng ký |
|---|---|---|
| `CartService` | `CartServiceImpl` | `@Service` |
| `ChatService` | `ChatServiceImpl` | `@Service` |
| `CheckoutService` | `CheckoutServiceImpl` | `@Service` |
| `DisputeService` | `DisputeServiceImpl` | `@Service` |
| `InboxService` | `InboxServiceImpl` | `@Service` |
| `OrderDocumentService` | `OrderDocumentServiceImpl` | `@Service` |
| `OrderService` | `OrderServiceImpl` | `@Service` |
| `OrderStatsService` | `OrderStatsServiceImpl` | `@Service` |
| `OutboxService` | `OutboxServiceImpl` | `@Service` |
| `ReviewService` | `ReviewServiceImpl` | `@Service` |

Kết quả: không phát hiện service interface thiếu implementation hoặc có nhiều implementation trong source hiện tại.

### 4.2. Interface được framework tạo implementation/proxy

| Nhóm | Interface | Implementation runtime |
|---|---|---|
| Spring Data | 18 `*Repository` trong package `repository` | Spring Data repository proxy/query implementation |
| OpenFeign | `CatalogClient`, `IdentityClient`, `PaymentClient`, `QuotationClient`, `VendorClient` | OpenFeign proxy |

`QuotationClient` vẫn được annotate `@FeignClient` nhưng là empty interface; không phát hiện reference khác ngoài chính declaration.

### 4.3. Implementation của interface ngoài module/JDK

| Class | Interface |
|---|---|
| `JpaOutboxEventSource` | `com.moonkage.outbox.OutboxEventSource` |
| `CurrentUserArgumentResolver` | `org.springframework.web.method.support.HandlerMethodArgumentResolver` |
| `WebMvcConfig` | `org.springframework.web.servlet.config.annotation.WebMvcConfigurer` |

### 4.4. Concrete component không có interface local

`ChatSignalPublisher`, `OrderAccess`, `OrderEventPublisher`, `OrderFileService`, `OrderProgress`, `VendorDirectory`, các listener/job/config/controller và exception handler đều được inject hoặc gọi bằng concrete type. Phase này chỉ ghi nhận, không đánh giá việc có cần abstraction hay không.

## 5. Nested type inventory

Ngoài 153 top-level type, các nested type sau tồn tại:

| Owner | Nested type |
|---|---|
| `OrderStatsRepository` | `TotalsRow`, `DailyRow`, `StatusRow`, `ProductRow`, `VendorRow` projection interface |
| `ChatRead` | `Key` record |
| `CheckoutGroup` | `Key` class |
| `CheckoutLine` | `Key` class |
| `CreatePaymentRequest` | `Allocation` record |
| `ProductSnapshotResponse` | `ProductPart`, `VendorPart` record |
| `ReserveStockRequest` | `Item` record |
| `StockReservationResponse` | `Item` record |
| `CartResponse` | `Group`, `Line` record |
| `OrderStatsResponse` | `Totals`, `DailyPoint`, `StatusCount`, `TopProduct`, `TopVendor` record |
| `OrderResponse` | `Item`, `InvoiceInfoResponse` record |
| `DisputeResponse` | `Evidence` record |
| `CreateCheckoutRequest` | `InvoiceInfoRequest` record |
| `QuoteAcceptedEvent` | `Snapshot`, `RequestPart`, `QuotePart`, `LinePart`, `DeliveryPart`, `InvoicePart` record |

## 6. Điểm package/responsibility cần phân tích tiếp

Các mục dưới đây là quan sát cấu trúc AS-IS, không phải đánh giá TO-BE hoặc yêu cầu di chuyển class.

| ID | Quan sát | Bằng chứng |
|---|---|---|
| PI-01 | Package `service` chứa đồng thời 10 service interface và 6 concrete support component | `service/*.java`: `OrderAccess`, `OrderFileService`, `OrderProgress`, publisher và `VendorDirectory` nằm cạnh các `*Service` interface |
| PI-02 | Naming của concrete service không hoàn toàn đồng nhất | Các use-case service dùng `XService` + `XServiceImpl`; `OrderFileService` là concrete `@Component` và không có interface/`Impl` counterpart |
| PI-03 | Package `messaging` chứa ba loại trách nhiệm | Rabbit listener (`PaymentEventListener`, `QuoteAcceptedListener`), scheduled job (`CheckoutExpiryJob`) và persistence adapter (`JpaOutboxEventSource`) |
| PI-04 | Package `entity` trộn business persistence model với integration infrastructure model | `Order`, `Checkout`, `Dispute` nằm cùng `OutboxEvent`, `ProcessedEvent`; `InvoiceInfo` là `@Embeddable`, không phải entity độc lập |
| PI-05 | Package `security` chứa cả request identity model và MVC configuration | `CurrentUser`, resolver, `CurrentUserInfo`, `Role`, `WebMvcConfig` |
| PI-06 | Mapping responsibility nằm trong nhiều service implementation | Các `toResponse`, `toItem`, `toLine`, `invoiceOf`, `copyOf` được liệt kê ở mục 3.17 |
| PI-07 | Client package có một declared dependency không có operation | `QuotationClient` là empty `@FeignClient` và không có usage ngoài declaration |
| PI-08 | Voucher persistence types chưa có caller trong production source | `Voucher` chỉ được reference bởi `VoucherRepository`; `VoucherRepository` không được inject/reference bởi type khác trong `src/main/java` |
| PI-09 | `OrderServiceImpl` có method `moveTo()` riêng trong khi `OrderProgress` cũng thực hiện chuyển trạng thái và ghi progress | `OrderServiceImpl.moveTo(...)`; `OrderProgress.moveTo(...)` được `OrderDocumentServiceImpl` sử dụng |
| PI-10 | Package `config` chứa cả Spring configuration và bootstrap utility | `LocaleConfig`, `RabbitConfig`, `OpenApiConfig` là configuration; `DotEnvConfig` là static utility được gọi từ application entry point |
| PI-11 | `dto` được chia rõ theo direction, nhưng event và client contract vẫn cùng thuộc DTO vocabulary của module | `dto.request`, `dto.response`, `dto.event`, `client.dto` |
| PI-12 | Chỉ `JpaOutboxEventSource` là package-private top-level class; phần lớn implementation/helper khác là public | Declaration của `JpaOutboxEventSource` không có `public` |

Các quan sát này chưa kết luận class đang “sai package”; chúng là dữ liệu đầu vào cho phase phân tích boundary sau khi được yêu cầu riêng.

## 7. Naming convention hiện tại

### 7.1. Convention nhất quán đã quan sát

- Package viết lowercase và chủ yếu dùng danh từ layer số ít: `controller`, `service`, `repository`, `entity`, `client`, `config`, `exception`, `security`, `messaging`; riêng `enums` dùng số nhiều.
- Service interface dùng hậu tố `Service`; implementation dùng cùng prefix cộng `Impl`.
- Controller dùng hậu tố `Controller`; internal HTTP entry point có prefix `Internal`.
- Repository dùng hậu tố `Repository` và đặt theo entity/projection chính.
- OpenFeign interface dùng hậu tố `Client`; DTO contract của client nằm trong `client.dto`.
- Request/response DTO dùng hậu tố `Request`/`Response`; external read model có hậu tố `View`.
- Event DTO dùng hậu tố `Event`; wrapper dùng tên `EventEnvelope`.
- Configuration dùng hậu tố `Config` hoặc `Properties`.
- Exception dùng `AppException`, `ErrorCode`, `GlobalExceptionHandler`.
- Entity dùng danh từ số ít và file name trùng top-level type name.
- DTO chủ yếu dùng immutable `record`; JPA model dùng mutable `class`.
- Constructor injection chủ yếu được tạo bằng Lombok `@RequiredArgsConstructor`.
- Composite key được lồng trong owner entity với tên `Key`.

### 7.2. Biến thể naming hiện có

- `OrderFileService` mang hậu tố `Service` nhưng là concrete `@Component`; các `XService` còn lại là interface.
- `VendorDirectory`, `OrderAccess`, `OrderProgress` mô tả role thay vì layer suffix.
- Publisher có hai cơ chế/tên: `OrderEventPublisher` dùng outbox; `ChatSignalPublisher` publish signal trực tiếp sau commit.
- Scheduled component dùng hậu tố `Job`; không có package `scheduler` riêng.
- Repository projection interface được lồng trong `OrderStatsRepository` và dùng hậu tố `Row`.
- `ErrorCode` và `Role` là enum nhưng không nằm trong package `enums` do gắn với exception/security context.

## 8. Các điểm cần phân tích ở phase sau

Danh sách này chỉ nêu câu hỏi mở; không đưa ra thiết kế hoặc hành động TO-BE:

1. Boundary giữa application service interface, concrete helper, access policy, file adapter và publisher trong package `service` là gì?
2. `OrderFileService` có cùng semantic category với các service interface hay là storage-facing component?
3. `OrderProgress.moveTo()` và `OrderServiceImpl.moveTo()` đại diện hai rule khác nhau hay là responsibility bị lặp?
4. Messaging consumer, scheduler và outbox adapter có cần được xem như một package boundary hay ba loại component riêng?
5. Event contract nào là incoming, outgoing, domain event hoặc integration event chính thức?
6. `QuotationClient` còn nằm trong dependency boundary thực tế hay là declaration chưa được sử dụng?
7. Voucher thuộc scope nghiệp vụ hiện hành hay chỉ là persistence model dự phòng?
8. Mapping trong service implementation là một phần use-case logic hay responsibility độc lập ở từng trường hợp?
9. `OutboxEvent`/`ProcessedEvent` thuộc entity vocabulary nghiệp vụ hay integration persistence vocabulary?
10. Package rule/ArchUnit hiện tại có phân biệt được 6 concrete component nằm trực tiếp trong `service` hay không?

Không xử lý các câu hỏi trên trong Phase 01.

## 9. Phạm vi và giới hạn xác minh

### Đã kiểm tra

- Toàn bộ file và package trong `api/order-service/src/main/java`.
- Top-level/nested type declaration.
- Spring/JPA/OpenFeign stereotype chính.
- Service interface và implementation.
- Repository/client proxy mechanism.
- Reference trong production source cho các type cần theo dõi.
- Naming convention và vị trí package hiện tại.

### Không thuộc phase này

- Không đánh giá chất lượng business logic.
- Không thiết kế package tree TO-BE.
- Không quyết định di chuyển, đổi tên, tạo hoặc xóa interface/class.
- Không phân tích sâu test package, migration hoặc runtime configuration.
- Không chạy build/test vì phase chỉ yêu cầu source inventory và không sửa source.

### File thay đổi

- Chỉ tạo `docs/architecture/order/01_PACKAGE_INVENTORY.md`.

