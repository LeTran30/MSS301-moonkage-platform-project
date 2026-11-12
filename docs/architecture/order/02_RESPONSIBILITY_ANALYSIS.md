# Phase 02 — Phân tích trách nhiệm class của Order Service

> Phạm vi: `api/order-service/src/main/java` và tài liệu đầu vào `01_PACKAGE_INVENTORY.md`  
> Loại tài liệu: phân tích trách nhiệm **AS-IS**  
> Ngày khảo sát: 12/11/2026  
> Ngoài phạm vi: chỉnh sửa source, refactor business logic, quyết định package tree TO-BE cuối cùng.

## 1. Mục tiêu và cách đọc kết quả

Tài liệu này phân loại type theo **trách nhiệm thực tế thể hiện trong source**, không chỉ theo tên package hoặc Spring stereotype. Một class có thể tham gia nhiều vai trò; cột **Đánh giá** chỉ ra vai trò chính và mức độ phù hợp của package hiện tại.

Các mức đánh giá:

- **Phù hợp**: package hiện tại phản ánh đúng trách nhiệm chính.
- **Chấp nhận được — convention**: vị trí chưa diễn đạt tối đa vai trò nhưng là convention hợp lệ; không đủ bằng chứng coi là sai kiến trúc.
- **Cần xem xét**: có mismatch trách nhiệm/package hoặc class có nhiều responsibility đáng kể; chưa kết luận cách sửa.
- **Chưa phù hợp theo trách nhiệm**: source thể hiện rõ đây là adapter/publisher kỹ thuật nhưng đang nằm trong khu vực application service.
- **Không phải vấn đề package**: vấn đề quan sát được là dead declaration, duplication hoặc class breadth, không phải vị trí package.

“Đề xuất sơ bộ” chỉ nêu hướng phân loại cần cân nhắc ở phase sau; không phải quyết định di chuyển class và không tạo cây TO-BE.

## 2. Tiêu chí phân loại trách nhiệm

| Nhóm trách nhiệm | Tiêu chí dùng trong báo cáo |
|---|---|
| **Application Service** | Cung cấp use case, điều phối transaction, repository, external call, authorization và event; không nhất thiết chứa toàn bộ business rule của riêng nó |
| **Domain Service** | Chứa business rule độc lập với transport/persistence và không tự nhiên thuộc một entity/value object |
| **Inbound Application Port** | Interface use-case được controller, listener hoặc scheduler gọi |
| **Integration Port** | Boundary mà application dùng để yêu cầu một capability kỹ thuật/external; port không nên tự triển khai protocol |
| **Event Publisher** | Tạo hoặc phát event/signal ra ngoài boundary của use case |
| **Infrastructure Adapter** | Triển khai HTTP, AMQP, JPA, object storage, scheduler hoặc framework integration cụ thể |
| **Persistence Model** | Type ánh xạ storage bằng JPA; có thể là business persistence model hoặc technical persistence model |

### Kết luận phân loại quan trọng

1. `CartService`, `ChatService`, `CheckoutService`, `DisputeService`, `OrderDocumentService`, `OrderService`, `OrderStatsService`, `ReviewService` là **Inbound Application Port**; các `*ServiceImpl` tương ứng là **Application Service**.
2. `InboxService` và `OutboxService` không phải business use-case cho HTTP client. Chúng là **technical/integration port** được application service sử dụng để bảo đảm idempotency và transactional outbox.
3. Không phát hiện **Domain Service thuần**. `OrderProgress` gần vai trò domain-support nhất, nhưng hiện phụ thuộc `ProgressUpdateRepository` và `EntityManager`, vì vậy vẫn là application/persistence-aware collaborator.
4. `CatalogClient`, `IdentityClient`, `PaymentClient`, `VendorClient` là OpenFeign adapter contract gắn trực tiếp với HTTP annotation. Chúng là **outbound infrastructure adapter/proxy definition**, không phải technology-neutral integration port.
5. `OrderEventPublisher` và `ChatSignalPublisher` đều là **Event Publisher**, nhưng dùng hai delivery semantics khác nhau: outbox bền vững và best-effort AMQP sau commit.
6. Việc interface ở `service` và implementation ở `service.impl` là một convention hợp lệ của codebase hiện tại, không tự thân là lỗi.

## 3. Phân tích `service` và `service.impl`

### 3.1. Service interface

| Class | Package hiện tại | Trách nhiệm thực tế | Đánh giá | Bằng chứng | Đề xuất sơ bộ |
|---|---|---|---|---|---|
| `CartService` | `service` | Inbound Application Port cho đọc/thay đổi cart | Phù hợp | Được `CartController` gọi; method nhận request/caller và trả response DTO | Giữ vai trò application port; chưa có lý do tạo abstraction khác |
| `ChatService` | `service` | Inbound Application Port cho conversation, inbox, thread, message, read và typing | Phù hợp | `ChatController` chỉ phụ thuộc interface này; 6 use-case method | Giữ vai trò application port |
| `CheckoutService` | `service` | Inbound Application Port dùng chung cho HTTP create/get, payment event và scheduled expiry | Chấp nhận được — convention | Được `CheckoutController`, `PaymentEventListener`, `CheckoutExpiryJob` gọi | Ở phase sau có thể đánh giá việc một port phục vụ ba inbound channel; chưa kết luận cần tách |
| `DisputeService` | `service` | Inbound Application Port cho dispute use case và internal payout lock | Chấp nhận được — convention | Được ba HTTP controller gọi, gồm endpoint internal payout lock | Xem payout lock có cùng application boundary với dispute hay chỉ là một use case liên quan |
| `OrderDocumentService` | `service` | Inbound Application Port cho upload link, mockup và invoice | Phù hợp | `OrderDocumentController` chỉ phụ thuộc interface này | Giữ vai trò application port; đánh giá breadth mockup/invoice ở phase sau nếu cần |
| `OrderService` | `service` | Inbound Application Port cho order HTTP use case và incoming integration event | Chấp nhận được — convention | `OrderController`, `PaymentEventListener`, `QuoteAcceptedListener` cùng gọi interface | Xem lại boundary giữa HTTP order use case và event-consumption use case, không mặc định phải tách |
| `OrderStatsService` | `service` | Inbound Application Port cho dashboard/report query | Phù hợp | `OrderController` gọi `stats(...)`; implementation dùng projection repository | Giữ vai trò query application port |
| `ReviewService` | `service` | Inbound Application Port cho tạo/list review | Phù hợp | `ReviewController` gọi; contract chỉ gồm hai use case | Giữ vai trò application port |
| `InboxService` | `service` | Integration/technical port cho consumer idempotency trong transaction hiện tại | Cần xem xét | Javadoc yêu cầu `MANDATORY` transaction; chỉ application service xử lý event gọi; không có controller | Phân loại riêng khỏi business use-case service khi thiết kế package boundary sau này |
| `OutboxService` | `service` | Integration/technical port để ghi event vào transactional outbox | Cần xem xét | `enqueue`/`enqueueState` yêu cầu cùng transaction; implementation serialize và ghi `OutboxEvent` | Xem như outbound technical port; không kết luận tên/package cuối cùng trong phase này |

### 3.2. Application Service implementation

| Class | Package hiện tại | Trách nhiệm thực tế | Đánh giá | Bằng chứng | Đề xuất sơ bộ |
|---|---|---|---|---|---|
| `CartServiceImpl` | `service.impl` | Điều phối cart persistence, catalog snapshot, rule mua hàng/quantity và response mapping | Phù hợp; breadth thấp | 2 dependency; 4 public method; rule tập trung vào một cart capability | Giữ nguyên về mặt trách nhiệm; mapping nhỏ chưa tạo ra vấn đề rõ ràng |
| `ChatServiceImpl` | `service.impl` | Điều phối toàn bộ chat lifecycle, authorization hai phía, persistence, vendor/identity lookup, attachment, realtime signal và DTO mapping | Cần xem xét; breadth trung bình-cao | 7 dependency; 6 public method; gọi 3 repository, `IdentityClient`, `VendorDirectory`, `OrderFileService`, `ChatSignalPublisher` | Giữ application-service role; đánh giá riêng attachment, identity enrichment và signal construction nếu breadth gây khó thay đổi/test |
| `CheckoutServiceImpl` | `service.impl` | Orchestrate checkout creation/payment callback/expiry, stock reservation, compensation, nhiều transaction segment và tạo Order | Cần xem xét; breadth cao | 14 dependency; 5 public method; dùng 5 repository, 3 external client, `TransactionTemplate`, `EntityManager`, metrics và event publisher | Ưu tiên phân tích boundary nội bộ giữa checkout orchestration, remote stock/payment workflow và order creation; chưa refactor ở phase này |
| `DisputeServiceImpl` | `service.impl` | Dispute lifecycle, access rule, evidence file, payout eligibility/lock, outgoing event và response mapping | Chấp nhận được nhưng có nhiều concern phụ | 6 dependency; 6 public method; `lockForPayout` dùng `OrderRepository` trực tiếp, các flow khác dùng `OrderAccess`; tự tạo `DisputeEvent` | Giữ application-service role; xác minh payout lock và event construction có nên là collaborator riêng ở phase thiết kế |
| `OrderDocumentServiceImpl` | `service.impl` | Mockup workflow, invoice attachment/read, file delegation, status progress và activity event | Chấp nhận được; breadth trung bình | 6 dependency; 6 public method; điều phối `OrderAccess`, `OrderFileService`, `OrderProgress`, hai kiểu event publishing | Giữ application-service role; xem việc trộn mockup workflow với invoice workflow là boundary nghiệp vụ hay chỉ cùng document capability |
| `OrderServiceImpl` | `service.impl` | Query/list/detail, authorization, order transition, progress, remainder payment, tạo custom order từ quote, payment callback, event và response mapping | Cần xem xét; breadth cao | 13 dependency; 7 public method; 446 dòng; vừa nhận HTTP use case vừa consume event; có `moveTo`, `canRead`, mapping và external payment | Đây là class ưu tiên cao để phân tích decomposition theo use case/collaborator; không thay đổi logic trong phase này |
| `OrderStatsServiceImpl` | `service.impl` | Authorization report, normalize date range, chạy projection query, fill missing day và enrich vendor name | Phù hợp | 3 dependency; 1 public method; responsibility tập trung vào report query | Giữ application query service; vendor-name fallback là enrichment liên quan trực tiếp output |
| `ReviewServiceImpl` | `service.impl` | Validate review eligibility, persist review, publish `review.created`, map response | Phù hợp; breadth thấp | 5 dependency nhưng chỉ 2 public method; mọi rule xoay quanh review | Giữ application-service role; event creation nhỏ chưa đủ bằng chứng cần publisher riêng |
| `InboxServiceImpl` | `service.impl` | JPA adapter ghi `ProcessedEvent` để chống xử lý event lặp | Chưa phù hợp theo trách nhiệm | Chỉ phụ thuộc `ProcessedEventRepository`; `@Transactional(MANDATORY)`; không triển khai business use case | Xem như persistence/inbox infrastructure adapter thay vì application-service implementation |
| `OutboxServiceImpl` | `service.impl` | Serialize event, lấy trace context, tạo và lưu `OutboxEvent` trong transaction | Chưa phù hợp theo trách nhiệm | Phụ thuộc `ObjectMapper`, `OutboxEventRepository`, `OutboxTraceContext`; `@Transactional(MANDATORY)` | Xem như transactional-outbox infrastructure adapter triển khai technical port |

### 3.3. Concrete component đang nằm trực tiếp trong `service`

| Class | Package hiện tại | Trách nhiệm thực tế | Đánh giá | Bằng chứng | Đề xuất sơ bộ |
|---|---|---|---|---|---|
| `OrderAccess` | `service` | Application authorization policy kết hợp load/lock `Order` và vendor ownership lookup | Chấp nhận được — convention | Dùng `OrderRepository.findForUpdateById`, `VendorDirectory`; cung cấp `readable`, `forBuyer`, `forVendor`, `forAdmin` | Có thể tiếp tục là application-support service; việc concrete class nằm cạnh interface chỉ là convention difference |
| `OrderProgress` | `service` | Thay đổi status và ghi immutable progress history, rồi flush version | Chấp nhận được; không phải Domain Service thuần | Phụ thuộc `ProgressUpdateRepository` và `EntityManager`; method nhận JPA `Order` và save `ProgressUpdate` | Xem như application/domain-support collaborator; xác minh duplication với `OrderServiceImpl.moveTo()` trước khi quyết định vị trí |
| `OrderEventPublisher` | `service` | Tạo `OrderEvent` snapshot và giao cho outbox port | Cần xem xét | Class chỉ có `announce(...)`; phụ thuộc `OutboxService`; được 3 application service dùng | Phân loại rõ là Event Publisher/application collaborator; package `service` không sai tuyệt đối nhưng chưa diễn đạt role |
| `ChatSignalPublisher` | `service` | Best-effort outbound AMQP publisher sau commit; tự serialize, tạo AMQP `Message` và gọi `RabbitTemplate` | Chưa phù hợp theo trách nhiệm | Phụ thuộc trực tiếp RabbitMQ/Jackson/Spring transaction synchronization; comment xác nhận bypass outbox | Xem như outbound messaging infrastructure adapter/Event Publisher, không phải application service |
| `OrderFileService` | `service` | Object-storage adapter/facade: presigned upload, move/validate object, private/public URL | Chưa phù hợp theo trách nhiệm | Phụ thuộc `ObjectStorage`, `BucketAccess`, `OrderFileProperties`; không có business state/rule của Order ngoài key prefix | Phân loại như storage infrastructure adapter; hậu tố `Service` hiện tạo cảm giác cùng loại với application-service interface |
| `VendorDirectory` | `service` | External vendor integration facade/anti-corruption adapter, chuẩn hóa Feign 404/failure thành `Optional` hoặc fallback | Chưa phù hợp theo trách nhiệm | Bao quanh `VendorClient`, bắt `FeignException`; được access/chat/stats/order dùng | Xem như outbound vendor integration adapter/facade; không phải Domain Service |

## 4. Phân tích các adapter và nhóm class liên quan

### 4.1. HTTP, messaging và scheduler inbound adapter

| Class | Package hiện tại | Trách nhiệm thực tế | Đánh giá | Bằng chứng | Đề xuất sơ bộ |
|---|---|---|---|---|---|
| `CartController`, `ChatController`, `CheckoutController`, `DisputeController`, `DisputeQueueController`, `InternalOrderController`, `OrderController`, `OrderDocumentController`, `ReviewController` | `controller` | Inbound HTTP adapter: bind/validate request, lấy caller, gọi application port | Phù hợp | Controller chỉ inject `*Service`; không phụ thuộc repository/entity trực tiếp | Giữ controller mỏng và phụ thuộc application port |
| `PaymentEventListener` | `messaging` | Inbound AMQP adapter định tuyến `payment.succeeded/failed` theo purpose sang checkout/order use case | Phù hợp | `@RabbitListener`; chỉ gọi `CheckoutService`/`OrderService` | Giữ transport routing ngoài application service |
| `QuoteAcceptedListener` | `messaging` | Inbound AMQP adapter chuyển `QuoteAcceptedEvent` sang order use case | Phù hợp | `@RabbitListener`; method chỉ gọi `OrderService.createFromQuote` | Giữ listener mỏng |
| `CheckoutExpiryJob` | `messaging` | Inbound scheduled adapter kích hoạt expire checkout | Cần xem xét nhẹ | `@Scheduled`; chỉ gọi `CheckoutService.expireOverdue`; không phải messaging consumer | Vai trò đúng nhưng package `messaging` rộng hơn trách nhiệm; đây chủ yếu là package convention, không phải logic defect |
| `JpaOutboxEventSource` | `messaging` | Outbound/persistence adapter cho shared outbox relay đọc/cập nhật outbox row | Cần xem xét | Implements `OutboxEventSource`; dùng `OutboxEventRepository`; không consume/publish AMQP trực tiếp | Phân loại theo outbox persistence/relay adapter; vị trí hiện tại làm `messaging` chứa cả inbound và persistence adapter |

### 4.2. External client

| Class | Package hiện tại | Trách nhiệm thực tế | Đánh giá | Bằng chứng | Đề xuất sơ bộ |
|---|---|---|---|---|---|
| `CatalogClient` | `client` | OpenFeign outbound HTTP adapter lấy product/vendor delivery snapshot | Phù hợp theo convention | Có `@FeignClient`, `@PostMapping`, request/response client DTO | Giữ trong external-client boundary; không gọi đây là technology-neutral port |
| `IdentityClient` | `client` | OpenFeign outbound HTTP adapter lấy account display name | Phù hợp theo convention | Có `@FeignClient`, `@GetMapping`; chỉ `ChatServiceImpl` dùng | Giữ trong external-client boundary |
| `PaymentClient` | `client` | OpenFeign outbound HTTP adapter tạo payment và request refund | Phù hợp theo convention | HTTP annotation và idempotency header nằm ngay trên interface | Giữ trong external-client boundary; application hiện phụ thuộc trực tiếp adapter contract |
| `VendorClient` | `client` | OpenFeign outbound HTTP adapter cho stock reservation và vendor lookup | Phù hợp theo convention | 5 HTTP operation; được `CheckoutServiceImpl` và `VendorDirectory` dùng | Giữ trong external-client boundary; lưu ý hai capability stock/directory đang cùng client vì cùng remote service |
| `QuotationClient` | `client` | Empty OpenFeign declaration, không có operation và không có caller | Không phải vấn đề package; dead declaration cần xác minh | Source chỉ có `@FeignClient`; reference duy nhất là chính declaration | Xác minh nhu cầu tồn tại ở phase riêng; không xóa khi chưa được phê duyệt |

### 4.3. Persistence adapter và model

| Class | Package hiện tại | Trách nhiệm thực tế | Đánh giá | Bằng chứng | Đề xuất sơ bộ |
|---|---|---|---|---|---|
| 15 business `*Repository` (`CartItem` đến `Review`, gồm `OrderStatsRepository`) | `repository` | Spring Data JPA persistence/query adapter contract | Phù hợp theo convention | Extends `JpaRepository`/`Repository`, có JPQL/native query, projection và lock annotation | Giữ trong persistence boundary; không coi là technology-neutral domain port |
| `OutboxEventRepository`, `ProcessedEventRepository` | `repository` | Technical outbox/inbox persistence adapter contract | Cần xem xét | Chỉ phục vụ `OutboxServiceImpl`, `InboxServiceImpl`, `JpaOutboxEventSource` | Khi xác định boundary, phân biệt technical persistence khỏi business repository |
| `VoucherRepository` | `repository` | Persistence declaration cho `Voucher` nhưng chưa có application caller | Không phải vấn đề package | Không được inject/reference ngoài declaration; `Voucher` chỉ được repository reference | Xác minh feature ownership/lifecycle; không xóa trong phase này |
| 16 business persistence type (`CartItem`…`Voucher`, không gồm outbox/inbox model; `InvoiceInfo` là embeddable) | `entity` | JPA-backed business state/value object | Phù hợp theo convention | Các class map business table; phần lớn state transition/rule nằm ở application service | Chưa có bằng chứng cần đổi package chỉ vì dùng JPA entity model |
| `OutboxEvent`, `ProcessedEvent` | `entity` | Technical integration persistence model | Cần xem xét | Map `outbox_events`/`processed_events`; chỉ được technical adapter dùng | Phân loại tách biệt với business entity vocabulary ở phase thiết kế |
| `InvoiceInfo` | `entity` | JPA `@Embeddable` value object dùng trong Checkout/Order | Chấp nhận được — convention | Không có table/identity riêng; được copy/map trong checkout/order flow | Ghi nhận là value object, không coi việc ở `entity` là lỗi bắt buộc |

### 4.4. DTO và event contract

| Class | Package hiện tại | Trách nhiệm thực tế | Đánh giá | Bằng chứng | Đề xuất sơ bộ |
|---|---|---|---|---|---|
| 14 `dto.request` record | `dto.request` | Inbound HTTP command/query payload | Phù hợp | Được controller/application port sử dụng; validation nằm trên DTO field | Giữ contract HTTP tách khỏi entity |
| 16 `dto.response` record | `dto.response` | Outbound HTTP/read-model payload | Phù hợp | Application service map entity/projection thành response record | Giữ response contract tách khỏi persistence model |
| `PaymentSucceededEvent`, `PaymentFailedEvent`, `QuoteAcceptedEvent` | `dto.event` | Incoming integration-event contract | Cần xem xét nhẹ | Chỉ listener/application event-consumer dùng | Phân biệt incoming contract bằng metadata/package boundary ở phase thiết kế nếu có giá trị |
| `OrderEvent`, `OrderActivityEvent`, `DisputeEvent`, `ReviewCreatedEvent`, `ChatEvent` | `dto.event` | Outgoing integration-event/signal contract | Cần xem xét nhẹ | Được publisher/application service tạo và gửi qua outbox hoặc RabbitMQ | Phân biệt outgoing durable event với best-effort signal; chưa đổi contract |
| `EventEnvelope` | `dto.event` | Integration envelope cho state event | Chấp nhận được | `OutboxServiceImpl.enqueueState` tạo envelope trước khi serialize | Xem như technical event contract, không phải HTTP DTO |
| 9 `client.dto` record | `client.dto` | External HTTP contract của catalog/identity/payment/vendor | Phù hợp | Được OpenFeign client và application orchestration sử dụng | Giữ gần external-client boundary |

Việc incoming và outgoing event nằm chung `dto.event` làm direction không hiện rõ, nhưng đây là **package clarity issue**, chưa phải contract defect. Không có bằng chứng cho phép thay đổi event contract trong phase này.

### 4.5. Configuration, security và exception boundary

| Class | Package hiện tại | Trách nhiệm thực tế | Đánh giá | Bằng chứng | Đề xuất sơ bộ |
|---|---|---|---|---|---|
| `RabbitConfig` | `config` | AMQP infrastructure configuration và routing-key catalog | Phù hợp | Khai báo exchange/queue/binding/converter, constants inbound/outgoing | Giữ config; có thể đánh giá ownership của routing-key constants cùng event boundary sau này |
| `LocaleConfig`, `OpenApiConfig`, `OrderProperties`, `OrderFileProperties` | `config` | Framework/configuration properties | Phù hợp | Spring `@Configuration`/`@ConfigurationProperties` | Không có vấn đề trách nhiệm rõ ràng |
| `DotEnvConfig` | `config` | Bootstrap utility nạp `.env` vào system properties | Chấp nhận được — convention | Static utility được application entry point gọi, không phải Spring bean | `config` vẫn là vị trí hiểu được; không đủ bằng chứng coi là sai package |
| `CurrentUserArgumentResolver` | `security` | Inbound HTTP adapter tạo caller context từ gateway header | Phù hợp theo security boundary | Implements `HandlerMethodArgumentResolver`; đọc HTTP header | Security package có tính năng cohesive dù chứa adapter kỹ thuật |
| `CurrentUser`, `CurrentUserInfo`, `Role` | `security` | Web annotation và caller identity model dùng xuyên application port | Chấp nhận được — convention | Controller dùng `@CurrentUser`; service contract nhận `CurrentUserInfo` | Chưa có lý do tách chỉ vì model được application service dùng |
| `WebMvcConfig` | `security` | MVC infrastructure config đăng ký resolver | Phù hợp theo security boundary | Implements `WebMvcConfigurer`; chỉ cấu hình current-user resolution | Giữ gần security adapter là hợp lý |
| `AppException`, `ErrorCode` | `exception` | Application/business error vocabulary | Phù hợp | Application service ném `AppException(ErrorCode)` | Giữ error vocabulary độc lập HTTP handler ở mức khái niệm |
| `GlobalExceptionHandler` | `exception` | Inbound HTTP error adapter, localize và map exception thành `ApiResponse` | Chấp nhận được — convention | `@RestControllerAdvice`, phụ thuộc servlet/HTTP response | `exception` là convention phổ biến; trách nhiệm transport đã rõ qua stereotype, chưa phải lỗi cần sửa |

## 5. Đánh giá class có nhiều trách nhiệm

Mức độ dưới đây phản ánh **change pressure và số loại collaborator**, không khẳng định class vi phạm SRP chỉ vì dài hoặc có nhiều dependency.

| Class | Mức độ | Các responsibility đang cùng tồn tại | Vấn đề thực sự hay convention | Bằng chứng chính | Đề xuất sơ bộ |
|---|---|---|---|---|---|
| `OrderServiceImpl` | Cao | Query/list/detail; access check; status transition; progress persistence; payment link; consume quote/payment event; build entity; DTO mapping; event publication | Vấn đề thực sự về breadth và duplication, không phải do hậu tố `Impl` | 446 dòng, 13 dependency, 7 public method; `moveTo()` trùng responsibility với `OrderProgress.moveTo()`; `canRead()` song song `OrderAccess` | Phân tích theo use-case seams và dùng chung access/progress collaborator trước khi thiết kế package |
| `CheckoutServiceImpl` | Cao | Cart validation; catalog snapshot; stock reserve/commit/release; payment creation/refund; multi-transaction orchestration; expiry; tạo order/item; metrics/event; mapping | Vấn đề thực sự về breadth, nhưng orchestration vẫn là application responsibility | 396 dòng, 14 dependency, 5 public method; trực tiếp điều khiển 3 remote client và `TransactionTemplate` | Phân tích saga/orchestration seams và order-creation responsibility; không thêm pattern/framework mặc định |
| `ChatServiceImpl` | Trung bình-cao | Conversation/read/message use case; authorization; identity/vendor enrichment; attachment storage; realtime signal; DTO mapping | Breadth thực sự nhưng vẫn cohesive trong chat capability | 291 dòng, 7 dependency; cả persistence, file storage, external identity và AMQP collaborator | Đánh giá collaborator cho attachment, recipient/name resolution và response mapping nếu có nhu cầu thay đổi độc lập |
| `DisputeServiceImpl` | Trung bình | Dispute lifecycle; evidence storage; payout lock; event construction; response mapping | Chủ yếu cohesive; payout lock là seam cần xác minh | `lockForPayout()` dùng `OrderRepository` trực tiếp; các method khác dùng `OrderAccess`; tự map evidence URL | Xác minh ownership của payout eligibility và event publishing; chưa coi toàn class là sai thiết kế |
| `OrderDocumentServiceImpl` | Trung bình | Upload delegation; mockup workflow; invoice workflow; progress; hai cơ chế event helper | Chủ yếu cohesive theo “order documents”, nhưng có hai sub-capability | Mockup dùng `OrderProgress`/`OrderEventPublisher`; invoice và activity dùng `OutboxService` trực tiếp | Kiểm tra change cadence của mockup và invoice trước khi quyết định tách |
| `CartServiceImpl` | Thấp | Cart CRUD, catalog validation, response grouping/mapping | Không phải vấn đề đáng kể | 2 dependency; rule và mapping cùng phục vụ cart use case | Không đề xuất decomposition ở thời điểm này |
| `OrderStatsServiceImpl` | Thấp | Authorization report, date normalization, aggregation mapping/enrichment | Không phải vấn đề đáng kể | 1 public method; helper đều phục vụ cùng report output | Không đề xuất decomposition ở thời điểm này |
| `ReviewServiceImpl` | Thấp | Eligibility, persistence, event và response mapping | Không phải vấn đề đáng kể | 2 public method; event nhỏ và trực tiếp gắn create review | Không đề xuất decomposition ở thời điểm này |
| `InboxServiceImpl` | Thấp | Idempotency persistence | Class focused nhưng sai category/package | Chỉ 1 dependency và 1 public method | Xử lý bằng phân loại adapter, không cần chia logic |
| `OutboxServiceImpl` | Thấp | Event serialization/envelope/persistence/trace | Class focused nhưng sai category/package | 3 technical dependency; 2 method cùng outbox capability | Xử lý bằng phân loại adapter, không cần chia logic |

### 5.1. Duplication và responsibility overlap cụ thể

| Overlap | Bằng chứng | Đánh giá |
|---|---|---|
| Order access | `OrderAccess` có `readable/forBuyer/forVendor/forAdmin`, trong khi `OrderServiceImpl` tự có `canRead()` và tự load/lock | Responsibility bị phân tán; là vấn đề consistency thực sự, chưa kết luận hợp nhất cách nào |
| Order progress | `OrderProgress.moveTo()` và private `OrderServiceImpl.moveTo()` đều set status, tạo `ProgressUpdate`, save và flush | Duplication rõ ràng; cần phân tích lý do lịch sử/transaction trước khi refactor |
| Outgoing event construction | `OrderEventPublisher` là publisher riêng, nhưng `DisputeServiceImpl`, `OrderDocumentServiceImpl`, `ReviewServiceImpl` tự dựng event và gọi `OutboxService`; `ChatSignalPublisher` dùng AMQP trực tiếp | Không mặc định phải thống nhất vì delivery semantics khác nhau; tuy nhiên event responsibility hiện phân tán |
| DTO mapping | Mapping nằm trong 7 application service implementation | Khác convention mapper riêng, chưa phải lỗi; chỉ trở thành vấn đề ở class có mapping lớn hoặc cần reuse/test độc lập |
| Vendor lookup/error policy | Một phần được chuẩn hóa trong `VendorDirectory`, nhưng `CheckoutServiceImpl` gọi `VendorClient` trực tiếp cho stock và `ChatServiceImpl` gọi `IdentityClient` trực tiếp | Không phải duplication trực tiếp; phản ánh `VendorDirectory` chỉ là directory facade, không phải port cho mọi vendor capability |

## 6. Class/package cần xem xét theo trách nhiệm

### 6.1. Mismatch có bằng chứng rõ

| Ưu tiên phân tích | Class | Package hiện tại | Vì sao là vấn đề trách nhiệm | Hướng phân loại sơ bộ |
|---|---|---|---|---|
| Cao | `OrderFileService` | `service` | Triển khai trực tiếp object-storage API và configuration; không phải business/application use-case | Storage infrastructure adapter/facade |
| Cao | `ChatSignalPublisher` | `service` | Triển khai trực tiếp RabbitMQ message, serialization, TTL và transaction callback | Outbound messaging adapter/Event Publisher |
| Cao | `OutboxServiceImpl` | `service.impl` | JPA/Jackson/trace adapter cho transactional outbox, không phải application service | Outbox infrastructure adapter |
| Cao | `InboxServiceImpl` | `service.impl` | JPA idempotency adapter cho incoming event, không phải application service | Inbox persistence adapter |
| Trung bình | `VendorDirectory` | `service` | Facade quanh Feign client và remote error policy | Vendor integration adapter/anti-corruption facade |
| Trung bình | `JpaOutboxEventSource` | `messaging` | Adapter đọc/cập nhật JPA outbox cho relay; không phải listener/scheduler/publisher AMQP | Outbox persistence/relay adapter |
| Trung bình | `OutboxEvent`, `ProcessedEvent` | `entity` | Technical integration state đang cùng vocabulary với business entity | Technical persistence model |
| Thấp-trung bình | `OrderEventPublisher` | `service` | Đúng là application collaborator nhưng role publisher không thể hiện qua package | Event Publisher/application support |

### 6.2. Khác convention nhưng chưa đủ bằng chứng coi là sai

| Trường hợp | Kết luận Phase 02 |
|---|---|
| Interface trong `service`, implementation trong `service.impl` | Hợp lệ; không đề xuất thay đổi chỉ để theo một architecture style khác |
| `OrderAccess` và `OrderProgress` là concrete class nằm cạnh service interface | Đây chủ yếu là convention difference. Trách nhiệm của chúng vẫn thuộc application/domain-support boundary |
| Controller theo technical layer thay vì feature package | Không có bằng chứng gây coupling sai; controller hiện mỏng và phụ thuộc interface |
| Feign interface trong `client` | Phù hợp với implementation technology hiện tại; chỉ lưu ý chúng là adapter contract, không phải pure port |
| Spring Data interface trong `repository` | Phù hợp convention; vì gắn Spring Data/JPA nên không gọi là pure domain repository port |
| `GlobalExceptionHandler` trong `exception` thay vì web/adapter package | Convention phổ biến và không gây responsibility leak vào application service |
| `CheckoutExpiryJob` trong `messaging` | Tên package chưa chính xác tuyệt đối, nhưng class là inbound trigger mỏng và không tạo business-logic defect |
| `DotEnvConfig` trong `config` | Utility bootstrap khác Spring config nhưng vẫn cùng configuration concern |
| Không có package/class `mapper` | Không tự động là thiếu sót; mapping nhỏ và use-case-specific có thể ở application service |

## 7. Nhận định về Domain Service và domain logic

### 7.1. Không có Domain Service thuần

Không class nào hiện thỏa đồng thời các dấu hiệu của một Domain Service thuần:

- chứa business rule độc lập transport/persistence;
- không điều phối repository/external adapter;
- không phụ thuộc Spring/JPA technical mechanism;
- có domain vocabulary rõ thay vì DTO/use-case vocabulary.

`OrderProgress` và `OrderAccess` là hai ứng viên dễ bị gọi nhầm là Domain Service:

- `OrderProgress` chứa invariant “status change phải có progress history”, nhưng trực tiếp save repository và flush `EntityManager`;
- `OrderAccess` chứa authorization rule theo buyer/vendor/admin, nhưng trực tiếp load/lock repository và gọi remote vendor directory.

Vì vậy, trong AS-IS chúng phù hợp hơn với **application/domain-support service**, không phải pure Domain Service.

### 7.2. Vị trí business rule hiện tại

Business rule chủ yếu nằm trong `*ServiceImpl`:

- cart purchasing/quantity rule trong `CartServiceImpl`;
- checkout/stock/payment ordering rule trong `CheckoutServiceImpl`;
- order transition/complaint window trong `OrderServiceImpl`;
- dispute eligibility/refund/payout rule trong `DisputeServiceImpl`;
- mockup/invoice rule trong `OrderDocumentServiceImpl`;
- review eligibility trong `ReviewServiceImpl`.

Phần lớn JPA entity là state holder; ngoại lệ nhỏ gồm `CheckoutGroup.totalAmount()`, `OutboxEvent.markPublished()/incrementAttempts()` và static factory của technical entity. Đây là ghi nhận AS-IS, không phải kết luận rằng domain model phải được làm “rich” hơn.

## 8. Điểm cần phân tích tiếp

1. `OrderServiceImpl` có nên tiếp tục sở hữu đồng thời query, command, incoming event và payment use case hay các responsibility này thay đổi độc lập?
2. `CheckoutServiceImpl.createOrders()` thuộc checkout completion hay order creation capability dùng chung?
3. Duplication giữa `OrderProgress.moveTo()` và `OrderServiceImpl.moveTo()` có khác biệt transaction/version nào không được thể hiện rõ?
4. Access rule trong `OrderAccess` và `OrderServiceImpl.canRead()` có chủ ý khác nhau hay bị phân tán theo lịch sử?
5. `InboxService`/`OutboxService` nên được xem là application-facing technical port hay shared infrastructure service của module?
6. `ChatSignalPublisher` và outbox publisher khác nhau có chủ ý về delivery semantics; package boundary nào thể hiện được khác biệt durable event và ephemeral signal?
7. `VendorDirectory` là anti-corruption facade ổn định hay chỉ là wrapper tạm quanh một phần `VendorClient`?
8. Incoming/outgoing event contract có cần direction boundary rõ hơn mà không thay đổi contract?
9. `QuotationClient`, `Voucher`, `VoucherRepository` còn thuộc feature đang hoạt động hay là declaration dự phòng?
10. Mapping nào đủ lớn/reused để đáng tách khỏi application service, thay vì tạo mapper đồng loạt?

Không xử lý hoặc thiết kế giải pháp cuối cùng cho các câu hỏi trên trong Phase 02.

## 9. Kết luận Phase 02

### Vấn đề thực sự

- Một số infrastructure adapter đang nằm trong `service`/`service.impl`: `OrderFileService`, `ChatSignalPublisher`, `VendorDirectory`, `InboxServiceImpl`, `OutboxServiceImpl`.
- `OrderServiceImpl` và `CheckoutServiceImpl` có responsibility breadth cao; `OrderServiceImpl` còn overlap rõ với `OrderAccess` và `OrderProgress`.
- `messaging` đang gom inbound listener, scheduler và outbox persistence adapter.
- Technical persistence model (`OutboxEvent`, `ProcessedEvent`) nằm chung với business entity.
- Event direction và delivery semantics chưa được package thể hiện rõ.

### Không kết luận là vấn đề

- Convention `service` interface + `service.impl` implementation.
- Concrete application-support class nằm trực tiếp trong `service` nếu trách nhiệm vẫn thuộc application layer.
- Feign interface ở `client`, Spring Data interface ở `repository`.
- Không có mapper package.
- Handler/config class đặt theo feature concern thay vì theo hexagonal layer tuyệt đối.

## 10. Phạm vi xác minh

### Đã kiểm tra

- Toàn bộ type đã kiểm kê trong Phase 01.
- Nội dung đầy đủ của 10 service interface, 10 implementation và 6 concrete component trong `service`.
- Dependency, public method, transaction boundary và collaborator của từng service implementation.
- Controller dependency direction.
- OpenFeign client operation, messaging listener/job, outbox relay adapter.
- Repository/entity usage của business persistence và technical outbox/inbox.
- Incoming/outgoing event usage trong production source.

### Không thực hiện

- Không sửa Java, test, configuration, dependency hoặc contract.
- Không di chuyển/đổi tên/tạo/xóa class hoặc interface.
- Không thiết kế cây package TO-BE cuối cùng.
- Không chạy build/test vì chỉ tạo tài liệu phân tích và không thay đổi source.

### File thay đổi

- Chỉ tạo `docs/architecture/order/02_RESPONSIBILITY_ANALYSIS.md`.

