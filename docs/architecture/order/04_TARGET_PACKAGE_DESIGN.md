# Phase 04 — Thiết kế cấu trúc package TO-BE của Order Service

> Phạm vi: `api/order-service`  
> Architecture style: **Pragmatic Layered Architecture**  
> Ngày thiết kế: 12/11/2026  
> Đầu vào: `01_PACKAGE_INVENTORY.md`, `02_RESPONSIBILITY_ANALYSIS.md`, `03_ARCHITECTURE_PROFILE.md`  
> Trạng thái: **đề xuất chờ Solution Architect phê duyệt**  
> Ngoài phạm vi: di chuyển/đổi tên class, sửa source/test/configuration/dependency, thay đổi contract/schema.

## 1. Mục tiêu thiết kế

Thiết kế TO-BE giữ nguyên Layered Architecture hiện tại và chỉ làm rõ các responsibility boundary đang bị trộn. Thiết kế không đưa Order Service sang Clean/Hexagonal Architecture và không tạo port/interface cho mọi dependency.

Nguyên tắc:

1. Giữ nguyên package đã phản ánh đúng trách nhiệm.
2. Giữ `service` interface + `service.impl` cho application service.
3. Tách technical adapter khỏi application-service package.
4. Chỉ tạo package mới khi có responsibility và dependency direction rõ ràng.
5. Ưu tiên subpackage dưới vocabulary hiện có (`messaging`, `entity`, `repository`, `client`, `dto`) thay vì tạo một cây `infrastructure.adapter.port` mới.
6. Không kết hợp package move với refactor logic, xóa class hoặc thay đổi contract.
7. Toàn bộ package mới tiếp tục nằm dưới `com.moonkage.order` để tương thích component/JPA/Feign scanning hiện tại.

## 2. Cây package AS-IS

```text
com.moonkage.order                                      (1 file)
├── OrderServiceApplication
├── client                                             (5 files)
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

Các điểm AS-IS cần xử lý bằng package design:

- `service` chứa application interface, application-support class và technical adapter.
- `service.impl` chứa 8 application-service implementation cùng 2 inbox/outbox infrastructure implementation.
- `messaging` chứa listener, scheduler và JPA outbox relay adapter.
- `dto.event` trộn incoming, outgoing và common event contract.
- `entity`/`repository` trộn business persistence với technical inbox/outbox persistence.
- `VendorDirectory` và `OrderFileService` chưa thể hiện rõ external integration/storage role qua package.

## 3. Cây package TO-BE đề xuất

Ký hiệu:

- `[KEEP]`: giữ package/type hiện tại.
- `[MOVE]`: đề xuất đổi package ở phase triển khai sau.
- `[PENDING]`: phụ thuộc quyết định phê duyệt; chưa thực hiện.

```text
com.moonkage.order
├── OrderServiceApplication                                      [KEEP]
│
├── client                                                       [KEEP]
│   ├── CatalogClient                                            [KEEP]
│   ├── IdentityClient                                           [KEEP]
│   ├── PaymentClient                                            [KEEP]
│   ├── QuotationClient                                          [KEEP/PENDING usage]
│   ├── VendorClient                                             [KEEP]
│   ├── dto                                                      [KEEP]
│   │   ├── AccountNameView
│   │   ├── CreatePaymentRequest
│   │   ├── CreatePaymentResponse
│   │   ├── ProductSnapshotRequest
│   │   ├── ProductSnapshotResponse
│   │   ├── RefundRequest
│   │   ├── ReserveStockRequest
│   │   ├── StockReservationResponse
│   │   └── VendorView
│   └── facade                                                   [NEW]
│       └── VendorDirectory                                      [MOVE]
│
├── config                                                       [KEEP]
│   ├── DotEnvConfig
│   ├── LocaleConfig
│   ├── OpenApiConfig
│   ├── OrderFileProperties
│   ├── OrderProperties
│   └── RabbitConfig
│
├── controller                                                   [KEEP]
│   ├── CartController
│   ├── ChatController
│   ├── CheckoutController
│   ├── DisputeController
│   ├── DisputeQueueController
│   ├── InternalOrderController
│   ├── OrderController
│   ├── OrderDocumentController
│   └── ReviewController
│
├── dto                                                          [KEEP]
│   ├── package-info.java                                        [KEEP]
│   ├── request                                                  [KEEP: 14 records]
│   ├── response                                                 [KEEP: 16 records]
│   └── event                                                    [KEEP parent]
│       ├── EventEnvelope                                        [KEEP: shared envelope]
│       ├── inbound                                              [NEW]
│       │   ├── PaymentFailedEvent                               [MOVE]
│       │   ├── PaymentSucceededEvent                            [MOVE]
│       │   └── QuoteAcceptedEvent                               [MOVE]
│       └── outbound                                             [NEW]
│           ├── ChatEvent                                        [MOVE]
│           ├── DisputeEvent                                     [MOVE]
│           ├── OrderActivityEvent                               [MOVE]
│           ├── OrderEvent                                       [MOVE]
│           └── ReviewCreatedEvent                               [MOVE]
│
├── entity                                                       [KEEP parent]
│   ├── CartItem                                                 [KEEP]
│   ├── ChatConversation                                         [KEEP]
│   ├── ChatMessage                                              [KEEP]
│   ├── ChatRead                                                 [KEEP]
│   ├── Checkout                                                 [KEEP]
│   ├── CheckoutGroup                                            [KEEP]
│   ├── CheckoutLine                                             [KEEP]
│   ├── Dispute                                                  [KEEP]
│   ├── DisputeEvidence                                          [KEEP]
│   ├── InvoiceInfo                                              [KEEP]
│   ├── MockupVersion                                            [KEEP]
│   ├── Order                                                    [KEEP]
│   ├── OrderItem                                                [KEEP]
│   ├── ProgressUpdate                                           [KEEP]
│   ├── Review                                                   [KEEP]
│   ├── Voucher                                                  [KEEP/PENDING usage]
│   ├── inbox                                                    [NEW]
│   │   └── ProcessedEvent                                       [MOVE]
│   └── outbox                                                   [NEW]
│       └── OutboxEvent                                          [MOVE]
│
├── enums                                                        [KEEP: 10 enums]
│
├── exception                                                    [KEEP]
│   ├── AppException
│   ├── ErrorCode
│   └── GlobalExceptionHandler
│
├── messaging                                                    [KEEP parent]
│   ├── inbox                                                    [NEW]
│   │   ├── InboxService                                         [MOVE]
│   │   └── InboxServiceImpl                                     [MOVE; rename PENDING]
│   ├── listener                                                 [NEW]
│   │   ├── PaymentEventListener                                 [MOVE]
│   │   └── QuoteAcceptedListener                                [MOVE]
│   ├── outbox                                                   [NEW]
│   │   ├── JpaOutboxEventSource                                 [MOVE]
│   │   ├── OutboxService                                        [MOVE]
│   │   └── OutboxServiceImpl                                    [MOVE; rename PENDING]
│   └── publisher                                                [NEW]
│       ├── ChatSignalPublisher                                  [MOVE]
│       └── OrderEventPublisher                                  [MOVE]
│
├── repository                                                   [KEEP parent]
│   ├── <16 business repositories>                               [KEEP]
│   ├── inbox                                                    [NEW]
│   │   └── ProcessedEventRepository                             [MOVE]
│   └── outbox                                                   [NEW]
│       └── OutboxEventRepository                                [MOVE]
│
├── scheduler                                                    [NEW]
│   └── CheckoutExpiryJob                                        [MOVE]
│
├── security                                                     [KEEP]
│   ├── CurrentUser
│   ├── CurrentUserArgumentResolver
│   ├── CurrentUserInfo
│   ├── Role
│   └── WebMvcConfig
│
├── service                                                      [KEEP]
│   ├── CartService                                              [KEEP]
│   ├── ChatService                                              [KEEP]
│   ├── CheckoutService                                          [KEEP]
│   ├── DisputeService                                           [KEEP]
│   ├── OrderDocumentService                                     [KEEP]
│   ├── OrderService                                             [KEEP]
│   ├── OrderStatsService                                        [KEEP]
│   ├── ReviewService                                            [KEEP]
│   ├── impl                                                     [KEEP]
│   │   ├── CartServiceImpl                                      [KEEP]
│   │   ├── ChatServiceImpl                                      [KEEP]
│   │   ├── CheckoutServiceImpl                                  [KEEP]
│   │   ├── DisputeServiceImpl                                   [KEEP]
│   │   ├── OrderDocumentServiceImpl                             [KEEP]
│   │   ├── OrderServiceImpl                                     [KEEP]
│   │   ├── OrderStatsServiceImpl                                [KEEP]
│   │   └── ReviewServiceImpl                                    [KEEP]
│   └── support                                                  [NEW]
│       ├── OrderAccess                                          [MOVE]
│       └── OrderProgress                                        [MOVE]
│
└── storage                                                      [NEW]
    └── OrderFileService                                         [MOVE; rename PENDING]
```

### 3.1. Package được giữ nguyên

Các package sau đã phù hợp và không cần đổi responsibility boundary:

- `controller`;
- `dto.request`, `dto.response`;
- `config`;
- `security`;
- `exception`;
- `enums`;
- `client` và `client.dto` cho OpenFeign contract;
- `service` cho 8 application-service interface;
- `service.impl` cho 8 application-service implementation;
- root `entity` cho business JPA model;
- root `repository` cho business Spring Data repository.

Không tạo package `domain`, `application`, `port`, `adapter`, `usecase` hoặc `mapper` chỉ để mô phỏng Clean/Hexagonal Architecture.

### 3.2. Đối soát số lượng TO-BE

| Package tree TO-BE | Số file Java | Ghi chú |
|---|---:|---|
| Root application | 1 | `OrderServiceApplication` |
| `client`, `client.dto`, `client.facade` | 15 | 14 file hiện tại + `VendorDirectory` |
| `config` | 6 | Giữ nguyên |
| `controller` | 9 | Giữ nguyên |
| `dto` và các subpackage | 40 | 1 package-info + 14 request + 16 response + 9 event |
| `entity` và `entity.inbox/outbox` | 18 | Không thêm/xóa entity |
| `enums` | 10 | Giữ nguyên |
| `exception` | 3 | Giữ nguyên |
| `messaging.*` | 9 | 2 inbox + 2 listener + 3 outbox + 2 publisher |
| `repository` và `repository.inbox/outbox` | 18 | Không thêm/xóa repository |
| `scheduler` | 1 | `CheckoutExpiryJob` |
| `security` | 5 | Giữ nguyên |
| `service`, `service.impl`, `service.support` | 18 | 8 interface + 8 implementation + 2 support |
| `storage` | 1 | `OrderFileService` |
| **Tổng** | **154** | Khớp inventory Phase 01 |

## 4. Giải thích từng thay đổi

### 4.1. `service.support`

| Type | AS-IS | TO-BE | Lý do |
|---|---|---|---|
| `OrderAccess` | `service` | `service.support` | Concrete application policy/helper, không phải public use-case interface |
| `OrderProgress` | `service` | `service.support` | Persistence-aware application collaborator cho status/progress, không phải public use-case interface |

`service.support` chỉ dành cho collaborator được nhiều application service dùng hoặc có responsibility rõ, không phải nơi gom mọi private helper. Không tạo interface cho hai class này nếu không có nhu cầu thay implementation.

### 4.2. `client.facade`

| Type | AS-IS | TO-BE | Lý do |
|---|---|---|---|
| `VendorDirectory` | `service` | `client.facade` | Bao quanh `VendorClient`, chuẩn hóa `FeignException` và cung cấp vendor lookup cho application layer |

`VendorDirectory` không phải Integration Port thuần vì nó phụ thuộc trực tiếp Feign contract/error. `client.facade` diễn đạt đúng vai trò external-client facade mà không tạo thêm port/adapter abstraction.

### 4.3. `storage`

| Type | AS-IS | TO-BE | Lý do |
|---|---|---|---|
| `OrderFileService` | `service` | `storage` | Triển khai object-storage operation qua shared `ObjectStorage`; không phải application service |

Package `storage` chỉ được tạo vì có technical responsibility riêng và nhiều application service sử dụng. Chưa đề xuất interface mới. Việc đổi tên `OrderFileService` thành `OrderFileStorage` là tùy chọn cần phê duyệt, không bắt buộc để thực hiện package move.

### 4.4. `messaging.listener`

| Type | AS-IS | TO-BE | Lý do |
|---|---|---|---|
| `PaymentEventListener` | `messaging` | `messaging.listener` | Inbound Rabbit listener, chỉ route event sang application service |
| `QuoteAcceptedListener` | `messaging` | `messaging.listener` | Inbound Rabbit listener cho quote acceptance |

Listener không được phụ thuộc repository hoặc thay đổi entity trực tiếp. Dependency tiếp tục đi từ listener đến service interface.

### 4.5. `messaging.publisher`

| Type | AS-IS | TO-BE | Lý do |
|---|---|---|---|
| `ChatSignalPublisher` | `service` | `messaging.publisher` | Outbound Rabbit publisher với best-effort, after-commit và TTL semantics |
| `OrderEventPublisher` | `service` | `messaging.publisher` | Event publisher/composer dùng transactional outbox; được nhiều application service dùng |

Hai publisher ở cùng package nhưng **không có cùng delivery guarantee**:

- `OrderEventPublisher`: durable business event qua outbox;
- `ChatSignalPublisher`: ephemeral hint publish trực tiếp sau commit.

Sự khác biệt phải được giữ trong Javadoc/test và không được “chuẩn hóa” thành một cơ chế duy nhất khi chưa có business reason.

### 4.6. `messaging.inbox` và `messaging.outbox`

| Type | AS-IS | TO-BE | Vai trò |
|---|---|---|---|
| `InboxService` | `service` | `messaging.inbox` | Technical contract cho consumer idempotency |
| `InboxServiceImpl` | `service.impl` | `messaging.inbox` | JPA implementation ghi processed event trong transaction hiện tại |
| `OutboxService` | `service` | `messaging.outbox` | Technical contract cho transactional event enqueue |
| `OutboxServiceImpl` | `service.impl` | `messaging.outbox` | Serialize/envelope/trace và persist outbox event |
| `JpaOutboxEventSource` | `messaging` | `messaging.outbox` | Adapter để shared relay đọc/cập nhật outbox row |

Đây là technical service theo Layered Architecture, không phải Clean/Hexagonal port layer. Interface được giữ vì application service đang phụ thuộc contract và semantics transaction cần rõ; không tạo thêm interface/adapter pair.

### 4.7. `scheduler`

| Type | AS-IS | TO-BE | Lý do |
|---|---|---|---|
| `CheckoutExpiryJob` | `messaging` | `scheduler` | `@Scheduled` inbound trigger, không phải message consumer/publisher |

Chỉ tạo root package `scheduler` vì class có framework role độc lập và package `messaging` sẽ được dành cho message/event integration. Scheduler tiếp tục gọi `CheckoutService`, không gọi repository.

### 4.8. Technical persistence subpackage

| Type | AS-IS | TO-BE | Lý do |
|---|---|---|---|
| `ProcessedEvent` | `entity` | `entity.inbox` | Technical idempotency persistence model |
| `ProcessedEventRepository` | `repository` | `repository.inbox` | Data access cho inbox technical model |
| `OutboxEvent` | `entity` | `entity.outbox` | Technical event-delivery persistence model |
| `OutboxEventRepository` | `repository` | `repository.outbox` | Data access cho outbox technical model |

Thiết kế vẫn giữ discipline theo layer (`entity` và `repository`) thay vì đặt entity/repository vào `messaging`. Subpackage `inbox`/`outbox` chỉ phân biệt technical vocabulary với business vocabulary.

### 4.9. Event direction subpackage

| Type | AS-IS | TO-BE | Direction |
|---|---|---|---|
| `PaymentFailedEvent` | `dto.event` | `dto.event.inbound` | Incoming |
| `PaymentSucceededEvent` | `dto.event` | `dto.event.inbound` | Incoming |
| `QuoteAcceptedEvent` | `dto.event` | `dto.event.inbound` | Incoming |
| `ChatEvent` | `dto.event` | `dto.event.outbound` | Outgoing ephemeral signal |
| `DisputeEvent` | `dto.event` | `dto.event.outbound` | Outgoing durable event |
| `OrderActivityEvent` | `dto.event` | `dto.event.outbound` | Outgoing durable event |
| `OrderEvent` | `dto.event` | `dto.event.outbound` | Outgoing durable event |
| `ReviewCreatedEvent` | `dto.event` | `dto.event.outbound` | Outgoing durable state event |
| `EventEnvelope` | `dto.event` | `dto.event` | Shared envelope giữ tại parent package |

Package move không được thay đổi field, JSON property, routing key, schema version hoặc delivery semantics. `ChatEvent` tiếp tục dùng `ChatMessageResponse` trong đề xuất package-only này; việc tạo event-owned nested payload là contract refactor riêng và không thuộc Phase 04.

## 5. Vị trí Interface và Implementation

### 5.1. Application Service

| Thành phần | TO-BE | Naming |
|---|---|---|
| Public application-service interface | `com.moonkage.order.service` | `<Capability>Service` |
| Application-service implementation | `com.moonkage.order.service.impl` | `<Capability>ServiceImpl` |
| Shared concrete application collaborator | `com.moonkage.order.service.support` | Tên theo role: `Access`, `Progress`, `Policy`, `Factory`, `Mapper` nếu thực sự cần |

Giữ nguyên 8 cặp business service:

- `CartService` / `CartServiceImpl`;
- `ChatService` / `ChatServiceImpl`;
- `CheckoutService` / `CheckoutServiceImpl`;
- `DisputeService` / `DisputeServiceImpl`;
- `OrderDocumentService` / `OrderDocumentServiceImpl`;
- `OrderService` / `OrderServiceImpl`;
- `OrderStatsService` / `OrderStatsServiceImpl`;
- `ReviewService` / `ReviewServiceImpl`.

Không tách `OrderServiceImpl` hoặc `CheckoutServiceImpl` trong package-move phase. Responsibility decomposition phải là refactor riêng có test bảo vệ business behavior.

### 5.2. Technical Integration Service

| Contract | Implementation | TO-BE |
|---|---|---|
| `InboxService` | `InboxServiceImpl` | `messaging.inbox` |
| `OutboxService` | `OutboxServiceImpl` | `messaging.outbox` |

Không đặt implementation kỹ thuật trở lại `service.impl`. Không tạo root package `port`/`adapter` vì profile không dùng Hexagonal Architecture.

### 5.3. Framework-generated interface

| Interface type | TO-BE | Handwritten implementation |
|---|---|---|
| Spring Data `*Repository` | `repository` hoặc `repository.inbox/outbox` | Không, trừ custom repository behavior được phê duyệt |
| OpenFeign `*Client` | `client` | Không; OpenFeign tạo proxy |
| Shared `OutboxEventSource` implementation | `messaging.outbox.JpaOutboxEventSource` | Có một infrastructure adapter cụ thể |

## 6. Integration Port, Adapter, Client và Event

### 6.1. Classification trong TO-BE

| Category | Type/package | Quy tắc |
|---|---|---|
| Application-facing technical contract | `messaging.inbox.InboxService`, `messaging.outbox.OutboxService` | Chỉ expose technical capability application cần; không expose JPA/AMQP type |
| External HTTP client adapter contract | `client.*Client` | Có OpenFeign annotation; không gọi là pure port |
| External-client facade | `client.facade.VendorDirectory` | Chuẩn hóa remote error/fallback; application được phép phụ thuộc |
| Inbound messaging adapter | `messaging.listener` | Nhận event và gọi application service |
| Outbound messaging adapter/publisher | `messaging.publisher` | Phát signal hoặc enqueue event theo semantics đã định |
| Inbox/outbox persistence adapter | `messaging.inbox`, `messaging.outbox`, technical repository/entity subpackage | Tham gia transaction và relay; không chứa business state transition |
| Storage adapter/facade | `storage.OrderFileService` | Bao shared `ObjectStorage`; không phải application service |
| Scheduled inbound adapter | `scheduler.CheckoutExpiryJob` | Trigger application service theo lịch |
| Integration event contract | `dto.event`, `dto.event.inbound`, `dto.event.outbound` | Không chứa JPA entity; không đổi JSON/event contract khi move package |

### 6.2. Vì sao không tạo package `integration.port` và `integration.adapter`

- OpenFeign và Spring Data interface đã là framework-specific contract; bọc thêm port chưa có business need.
- `InboxService`/`OutboxService` đã cung cấp boundary đủ dùng cho transactional technical capability.
- `OrderFileService` chưa có multiple implementation hoặc caller yêu cầu abstraction riêng.
- Mục tiêu là Layered Architecture rõ ràng, không phải mô phỏng Hexagonal terminology.
- Package theo technology/role hiện tại giúp giảm số lượng file và import move.

## 7. Naming convention TO-BE

### 7.1. Package naming

- Package viết lowercase, dùng danh từ trách nhiệm: `controller`, `service`, `repository`, `entity`, `client`, `messaging`, `scheduler`, `storage`.
- Direction dùng `inbound`/`outbound`; không dùng đồng thời `in`, `incoming`, `consumer` cho cùng khái niệm.
- Technical feature dùng `inbox`/`outbox`; không tạo package chung chung như `common`, `util` hoặc `misc`.
- Không tạo package chỉ có tên `util`, `helper`, `manager`, `misc` hoặc `core` nếu không định nghĩa được responsibility.
- `impl` chỉ dùng cho application-service implementation theo convention đã chọn; không dùng `impl` làm nơi chứa mọi concrete class.

### 7.2. Type naming

| Responsibility | Convention | Ví dụ |
|---|---|---|
| Application service contract | `<Capability>Service` | `OrderService` |
| Application service implementation | `<Capability>ServiceImpl` | `OrderServiceImpl` |
| HTTP entry point | `<Capability>Controller` | `OrderController` |
| Spring Data repository | `<Aggregate>Repository` | `OrderRepository` |
| OpenFeign external client | `<RemoteCapability>Client` | `PaymentClient` |
| Incoming message handler | `<Event/Capability>Listener` | `PaymentEventListener` |
| Scheduled trigger | `<Capability>Job` | `CheckoutExpiryJob` |
| Outgoing event component | `<Capability/Event>Publisher` | `OrderEventPublisher` |
| External lookup facade | `<Concept>Directory` hoặc `<Remote>Facade` | `VendorDirectory` |
| Storage component | `<Concept>Storage` ưu tiên cho type mới | `OrderFileStorage` nếu rename được duyệt |
| Request/response contract | `*Request` / `*Response` | `CreateCheckoutRequest` |
| Integration contract | `*Event` | `OrderEvent` |
| Spring config/property | `*Config` / `*Properties` | `RabbitConfig`, `OrderProperties` |

### 7.3. Rename candidate, không tự động áp dụng

| AS-IS name | Candidate | Khuyến nghị |
|---|---|---|
| `OrderFileService` | `OrderFileStorage` | Nên cân nhắc vì type là storage facade; package move có thể thực hiện trước mà chưa rename |
| `InboxServiceImpl` | `JpaInboxService` hoặc `JpaInboxProcessor` | Chỉ rename nếu Architect muốn technical implementation thể hiện technology; tránh đổi tên chỉ để thẩm mỹ |
| `OutboxServiceImpl` | `JpaOutboxService` hoặc `TransactionalOutboxService` | Chỉ rename nếu role rõ hơn và không gây lệch với interface |

Không rename `VendorDirectory`, `OrderAccess`, `OrderProgress`, `OrderEventPublisher` hoặc `ChatSignalPublisher`; tên hiện tại đã phản ánh role.

## 8. Dependency direction trong cây TO-BE

| From | Allowed dependency | Forbidden dependency chính |
|---|---|---|
| `controller` | `service`, `dto.request`, `dto.response`, `security`, `exception` vocabulary | `repository`, `entity`, `client`, `messaging`, `storage`, `scheduler` |
| `service` interface | DTO/event contract, enum, `CurrentUserInfo` | repository/client/messaging implementation/storage/framework transport |
| `service.impl` | service contract/support, repository, entity, client/facade, messaging technical contract/publisher, storage, config property | controller, listener, scheduler, HTTP handler |
| `service.support` | repository/entity/client facade/config khi responsibility yêu cầu | controller, listener, scheduler |
| `repository*` | `entity*`, `enums`, Spring Data/JPA | service/controller/client/messaging publisher |
| `entity*` | enum/value type, JPA/Lombok | repository/service/controller/client/messaging/DTO |
| `client` | `client.dto`, Feign/Spring Web annotation | service/repository/entity/controller |
| `client.facade` | client/client DTO, technical error type | controller/repository/business entity mutation |
| `messaging.listener` | inbound event DTO, config routing/queue, service interface | repository/entity mutation/client |
| `messaging.publisher` | outbound event DTO, outbox technical contract hoặc AMQP API tùy semantics | controller/repository trực tiếp |
| `messaging.inbox/outbox` | technical entity/repository, serializer/trace/shared relay SPI | controller/business workflow |
| `scheduler` | service interface, scheduling/logging | repository/entity/client trực tiếp |
| `storage` | shared storage API, storage properties, file DTO cần thiết | controller/repository/business transition |
| `dto.event` và `dto.event.inbound/outbound` | JDK type, enum/DTO contract được phê duyệt | entity/repository/service implementation/framework listener |
| `config` | framework/configuration type | business workflow invocation |

### 8.1. Dependency flow sau package move

```text
controller ───────────────┐
messaging.listener ──────┼──> service ──> service.impl ──> repository ──> entity
scheduler ───────────────┘                       │
                                                ├──> client / client.facade
                                                ├──> messaging.publisher
                                                ├──> messaging.inbox/outbox
                                                ├──> service.support
                                                └──> storage
```

`service.impl` là orchestration center theo Layered Architecture. Dependency xuống integration/data access là hợp lệ; dependency ngược từ repository/entity/client vào service implementation là không hợp lệ.

## 9. Tương thích Spring component scanning, JPA và OpenFeign

### 9.1. Component scanning

`OrderServiceApplication` nằm tại `com.moonkage.order` và dùng `@SpringBootApplication`. Spring Boot mặc định component-scan toàn bộ descendant package, vì vậy các package mới sau vẫn được phát hiện:

- `com.moonkage.order.service.support`;
- `com.moonkage.order.client.facade`;
- `com.moonkage.order.messaging.*`;
- `com.moonkage.order.scheduler`;
- `com.moonkage.order.storage`.

Không cần thêm `@ComponentScan` nếu mọi class vẫn ở dưới root này.

### 9.2. JPA entity/repository scanning

Các package `entity.inbox`, `entity.outbox`, `repository.inbox`, `repository.outbox` vẫn là descendant của application root. Với Spring Boot auto-configuration hiện tại:

- không cần thêm `@EntityScan`;
- không cần thêm `@EnableJpaRepositories`;
- table name/schema không đổi;
- entity relation/query import phải được cập nhật cơ học khi triển khai.

Khi thực hiện move, bắt buộc chạy application-context/JPA repository tests để xác nhận entity và repository đều được scan. Phase 04 không chạy migration và không thay đổi database schema.

### 9.3. OpenFeign scanning

`@EnableFeignClients` nằm trên `OrderServiceApplication`. Các `*Client` tiếp tục ở `com.moonkage.order.client`, dưới application root, nên không cần khai báo `basePackages` mới. `VendorDirectory` là `@Component`, không phải Feign client.

### 9.4. Scheduler và listener

- `@EnableScheduling` đã có tại application class, nên `scheduler.CheckoutExpiryJob` tiếp tục được scan.
- `@RabbitListener` trên class trong `messaging.listener` tiếp tục được Spring phát hiện.
- `JpaOutboxEventSource` hiện package-private vẫn có thể được component-scan trong package mới vì Spring tạo bean từ chính annotated class; không cần đổi visibility chỉ vì package move.

### 9.5. Configuration properties

`OrderFileProperties` tiếp tục ở `config`. `OrderFileService`/candidate `OrderFileStorage` tiếp tục enable/use properties như hiện tại. Không đổi property prefix hoặc configuration contract.

## 10. Ma trận thay đổi package

### 10.1. Type di chuyển

| # | Type | AS-IS package | TO-BE package |
|---:|---|---|---|
| 1 | `VendorDirectory` | `service` | `client.facade` |
| 2 | `OrderAccess` | `service` | `service.support` |
| 3 | `OrderProgress` | `service` | `service.support` |
| 4 | `OrderFileService` | `service` | `storage` |
| 5 | `ChatSignalPublisher` | `service` | `messaging.publisher` |
| 6 | `OrderEventPublisher` | `service` | `messaging.publisher` |
| 7 | `InboxService` | `service` | `messaging.inbox` |
| 8 | `InboxServiceImpl` | `service.impl` | `messaging.inbox` |
| 9 | `OutboxService` | `service` | `messaging.outbox` |
| 10 | `OutboxServiceImpl` | `service.impl` | `messaging.outbox` |
| 11 | `PaymentEventListener` | `messaging` | `messaging.listener` |
| 12 | `QuoteAcceptedListener` | `messaging` | `messaging.listener` |
| 13 | `JpaOutboxEventSource` | `messaging` | `messaging.outbox` |
| 14 | `CheckoutExpiryJob` | `messaging` | `scheduler` |
| 15 | `ProcessedEvent` | `entity` | `entity.inbox` |
| 16 | `OutboxEvent` | `entity` | `entity.outbox` |
| 17 | `ProcessedEventRepository` | `repository` | `repository.inbox` |
| 18 | `OutboxEventRepository` | `repository` | `repository.outbox` |
| 19 | `PaymentFailedEvent` | `dto.event` | `dto.event.inbound` |
| 20 | `PaymentSucceededEvent` | `dto.event` | `dto.event.inbound` |
| 21 | `QuoteAcceptedEvent` | `dto.event` | `dto.event.inbound` |
| 22 | `ChatEvent` | `dto.event` | `dto.event.outbound` |
| 23 | `DisputeEvent` | `dto.event` | `dto.event.outbound` |
| 24 | `OrderActivityEvent` | `dto.event` | `dto.event.outbound` |
| 25 | `OrderEvent` | `dto.event` | `dto.event.outbound` |
| 26 | `ReviewCreatedEvent` | `dto.event` | `dto.event.outbound` |

### 10.2. Type giữ nguyên package

- 9 controller;
- 8 business service interface và 8 implementation;
- 16 business entity/value object, gồm `Voucher` chờ xác minh usage;
- 16 business repository, gồm `VoucherRepository` chờ xác minh usage;
- 14 request DTO và 16 response DTO;
- `EventEnvelope` tại `dto.event` và `dto/package-info.java`;
- 5 Feign client và 9 client DTO;
- 10 enum;
- 6 config type;
- 5 security type;
- 3 exception type;
- application bootstrap.

`QuotationClient`, `Voucher`, `VoucherRepository` được giữ nguyên vì chưa có phê duyệt xóa, dù Phase 01–02 không phát hiện caller nghiệp vụ.

## 11. Trình tự triển khai đề xuất cho phase sau

Đây chỉ là sequencing proposal, Phase 04 không thực hiện:

1. Phê duyệt tree và các decision trong mục 12.
2. Move event contract subpackage và cập nhật import; không đổi field/JSON/routing key.
3. Move technical entity/repository subpackage; xác nhận JPA scan/query.
4. Move inbox/outbox contract và implementation.
5. Move listener/publisher/scheduler.
6. Move storage và client facade.
7. Move application support.
8. Compile và chạy test hiện có sau từng nhóm move hoặc một batch nhỏ.
9. Chỉ sau package move ổn định mới xem xét rename candidate.
10. Responsibility refactor của `OrderServiceImpl`/`CheckoutServiceImpl` phải là phase riêng.

Không thực hiện package move và rename class trong cùng commit nếu việc tách commit giúp review/import tracing rõ hơn.

## 12. Quyết định cần Solution Architect phê duyệt

| Decision ID | Nội dung | Đề xuất | Ảnh hưởng nếu phê duyệt |
|---|---|---|---|
| `TD-01` | Phê duyệt cây TO-BE tổng thể | Phê duyệt pragmatic layered tree trong mục 3 | Cho phép lập migration plan/file scope |
| `TD-02` | Giữ 8 service interface trong `service`, 8 business implementation trong `service.impl` | Phê duyệt | Không thay convention hiện tại |
| `TD-03` | Tạo `service.support` cho `OrderAccess`, `OrderProgress` | Phê duyệt | Làm sạch service contract package, không thêm interface |
| `TD-04` | Đặt `VendorDirectory` tại `client.facade` | Phê duyệt | Thể hiện Feign facade role; service implementation cập nhật import |
| `TD-05` | Tạo `storage` và chuyển `OrderFileService` | Phê duyệt | Làm rõ storage adapter; component scan không đổi |
| `TD-06` | Đặt cả `OrderEventPublisher` và `ChatSignalPublisher` tại `messaging.publisher` | Phê duyệt với documentation delivery semantics | Cùng role publisher nhưng giữ hai delivery mechanism |
| `TD-07` | Đặt `InboxService`/implementation tại `messaging.inbox` và Outbox tương ứng | Phê duyệt | Technical service ra khỏi application `service.impl`; giữ transaction semantics |
| `TD-08` | Tách `messaging.listener` và root `scheduler` | Phê duyệt | Phân biệt message consumer và time-based trigger |
| `TD-09` | Tách technical entity/repository vào subpackage `inbox`/`outbox` | Phê duyệt | Rõ business vs technical persistence; cần JPA scan test |
| `TD-10` | Tách incoming/outgoing contract vào `dto.event.inbound/outbound`, giữ `EventEnvelope` tại `dto.event` | Phê duyệt | Rõ direction; tránh tạo `common` package một class; không đổi contract |
| `TD-11` | Giữ `ChatEvent` sử dụng `ChatMessageResponse` trong package-only phase | Phê duyệt tạm thời | Tránh event contract refactor; còn coupling event/HTTP DTO |
| `TD-12` | Rename `OrderFileService` thành `OrderFileStorage` | Để sau package move; Architect quyết định | Tên rõ hơn nhưng tăng diff/import change |
| `TD-13` | Rename `InboxServiceImpl`/`OutboxServiceImpl` theo technology | Không bắt buộc; ưu tiên giữ tên ở lần move đầu | Giảm scope và rủi ro; tên `Impl` vẫn chấp nhận được |
| `TD-14` | Xử lý `QuotationClient`, `Voucher`, `VoucherRepository` | Chưa xóa; yêu cầu business ownership confirmation | Không vô tình xóa feature/declaration dự phòng |
| `TD-15` | Có tạo architecture test sau migration không | Áp rule tối thiểu nếu project đã có tool; không tự thêm dependency | Ngăn package regression |
| `TD-16` | Có refactor `OrderServiceImpl`/`CheckoutServiceImpl` cùng package move không | Không; tách phase | Tránh trộn mechanical move với business-logic risk |

## 13. Trade-off của thiết kế TO-BE

### Lợi ích

- Giữ phần lớn package hiện tại và Layered Architecture quen thuộc.
- Application service contract/implementation trở nên rõ hơn vì technical class được tách ra.
- Event direction, listener, publisher, scheduler và inbox/outbox có vocabulary riêng.
- Business persistence và technical persistence vẫn cùng layer nhưng không còn trộn trong một package phẳng.
- Không thêm abstraction/interface/framework/dependency.
- Mọi package mới nằm dưới application root, giảm rủi ro scanning configuration.

### Chi phí

- 26 type cần package/import move nếu toàn bộ thiết kế được duyệt.
- `dto.event` split tạo nhiều import change dù không thay contract.
- Tạo một số package chỉ có 1–2 class (`scheduler`, `storage`, `entity.inbox/outbox`), đổi lại responsibility rõ.
- `ChatEvent` vẫn phụ thuộc `ChatMessageResponse`; direction package rõ hơn nhưng contract coupling còn tồn tại.
- Layered Architecture vẫn cho phép `service.impl` phụ thuộc trực tiếp JPA/Feign; không đạt framework isolation như Clean/Hexagonal.

### Rủi ro cần kiểm chứng khi triển khai

- JPA entity/repository scanning sau khi move technical model.
- Feign/component/scheduler/listener bean discovery.
- Package-private `JpaOutboxEventSource` vẫn được relay inject đúng.
- Import của event DTO trong listener/service/publisher.
- Serialization/deserialization của event không đổi JSON shape.
- Spring transaction proxy tiếp tục hoạt động sau khi technical implementation đổi package.
- Test package/import và architecture rule hiện có nếu có.

## 14. Phạm vi Phase 04

### Đã thực hiện

- Thiết kế cây AS-IS và TO-BE.
- Xác định package giữ nguyên và package mới.
- Lập mapping cho 26 type đề xuất di chuyển.
- Xác định vị trí application service, technical service, client/facade, listener/publisher, scheduler, storage và event contract.
- Đề xuất naming convention, dependency direction và scanning compatibility.
- Liệt kê trade-off, risk và 16 quyết định cần phê duyệt.

### Không thực hiện

- Không di chuyển hoặc đổi package bất kỳ Java class nào.
- Không rename class/interface.
- Không chỉnh sửa Java, test, configuration hoặc dependency.
- Không thay đổi API contract, event contract hoặc database schema.
- Không xóa `QuotationClient`, `Voucher`, `VoucherRepository`.
- Không chạy build/test vì source không thay đổi.

### File thay đổi

- Chỉ tạo `docs/architecture/order/04_TARGET_PACKAGE_DESIGN.md`.


