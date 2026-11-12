# PHASE 11 — KIỂM TRA TUÂN THỦ KIẾN TRÚC

> Phạm vi: `api/order-service`  
> Ngày kiểm tra: 12/11/2026 (Asia/Saigon)  
> Architecture profile: Layered Architecture  
> Trạng thái tổng thể: **PARTIALLY_COMPLIANT**

## 1. Kết luận điều hành

Order Service đang tuân thủ các dependency guardrail cốt lõi của Layered Architecture:

- controller không truy cập repository/entity/client/messaging trực tiếp;
- listener và scheduled job gọi application service interface;
- repository chỉ phụ thuộc entity/enum và persistence framework;
- entity không phụ thuộc upper layer;
- DTO không dùng JPA entity;
- 8 business service interface có implementation tương ứng tại `service.impl`;
- không phát hiện package cycle trong trạng thái hiện tại;
- 6/6 ArchUnit rule hiện có pass.

Tuy nhiên cây package chưa đạt Target Package Design cuối cùng. Có **10/154 Java type/file** còn ở package trung gian hoặc package cũ theo Migration Plan. Sáu package mục tiêu chưa hình thành:

- `entity.inbox`;
- `entity.outbox`;
- `scheduler`;
- `messaging.publisher`;
- `service.support`;
- `storage`.

Vì vậy kết luận Phase 11 là **PARTIALLY_COMPLIANT**: dependency direction hiện tại an toàn, nhưng class placement và interface–implementation organization của technical component chưa hoàn tất TO-BE.

Phase 11 không sửa source code và không bổ sung ArchUnit test vì chưa có phê duyệt cho việc thêm test kiến trúc.

## 2. Trạng thái working tree được kiểm tra

Working tree tại đầu Phase 11 chứa toàn bộ thay đổi chưa commit của Phase 10:

- event DTO đã tách inbound/outbound;
- hai listener đã chuyển sang root `listener`;
- `VendorDirectory` đã chuyển sang `client.facade`;
- các import production/test tương ứng đã được cập nhật;
- báo cáo Phase 10 đang là untracked file.

Phase 11 chỉ thêm tài liệu này, không hoàn tác, ghi đè hoặc format các file Phase 10.

Commit nền gần nhất:

```text
d7ec96f refactor(order-service): move technical repositories and messaging implementations
```

## 3. Package structure thực tế

Inventory thực tế có 154 Java file, gồm `dto/package-info.java`.

```text
com.moonkage.order                                      (1)
├── client                                               (5)
│   ├── dto                                              (9)
│   └── facade                                           (1)
├── config                                               (6)
├── controller                                           (9)
├── dto                                                  (1)
│   ├── event                                            (1)
│   │   ├── inbound                                      (3)
│   │   └── outbound                                     (5)
│   ├── request                                         (14)
│   └── response                                        (16)
├── entity                                              (18)
├── enums                                               (10)
├── exception                                            (3)
├── listener                                             (2)
├── messaging                                            (1)
│   ├── inbox                                            (1)
│   └── outbox                                           (2)
├── repository                                          (16)
│   ├── inbox                                            (1)
│   └── outbox                                           (1)
├── security                                             (5)
└── service                                             (15)
    └── impl                                             (8)
```

### 3.1. Package đã phù hợp Target Package Design

| Package/nhóm | Đánh giá | Bằng chứng |
|---|---|---|
| `controller` | Đạt | 9 HTTP controller; chỉ import DTO, enum, security và service interface |
| `service.impl` | Đạt | Chỉ chứa 8 business application service implementation |
| `repository`, `repository.inbox`, `repository.outbox` | Đạt | 18 Spring Data repository; technical repository đã được tách |
| `client`, `client.dto`, `client.facade` | Đạt | 5 Feign client, 9 client DTO và `VendorDirectory` facade |
| `dto.request`, `dto.response` | Đạt | Không phụ thuộc JPA entity |
| `dto.event.inbound`, `dto.event.outbound` | Đạt | 3 inbound và 5 outbound event DTO; direction nhận diện rõ |
| `dto.event` | Đạt | Chỉ còn shared `EventEnvelope` |
| `listener` | Đạt theo hiệu chỉnh Phase 07 | Hai Rabbit consumer ở root `listener`, không dùng target cũ `messaging.listener` |
| `config`, `exception`, `security`, `enums` | Đạt | Trách nhiệm không bị trộn với business workflow |

### 3.2. Package mục tiêu chưa hoàn tất

| Package mục tiêu | Trạng thái | Type còn ở package cũ |
|---|---|---|
| `entity.inbox` | Chưa tồn tại | `ProcessedEvent` còn ở `entity` |
| `entity.outbox` | Chưa tồn tại | `OutboxEvent` còn ở `entity` |
| `scheduler` | Chưa tồn tại | `CheckoutExpiryJob` còn ở root `messaging` |
| `messaging.publisher` | Chưa tồn tại | `ChatSignalPublisher`, `OrderEventPublisher` còn ở `service` |
| `service.support` | Chưa tồn tại | `OrderAccess`, `OrderProgress` còn ở `service` |
| `storage` | Chưa tồn tại | `OrderFileService` còn ở `service` |

`messaging.inbox` và `messaging.outbox` đã tồn tại nhưng chưa hoàn chỉnh vì technical interface vẫn ở `service`.

## 4. Class placement compliance

### 4.1. Type đặt đúng package

144/154 Java type/file phù hợp package được phê duyệt hoặc thuộc nhóm được giữ nguyên. Các nhóm chính đạt gồm:

- 8 business service interface và 8 business implementation;
- 9 controller;
- 5 Feign client và 1 client facade;
- 18 repository;
- 8 directional event DTO và shared `EventEnvelope`;
- 2 listener;
- 3 technical implementation/adapter trong `messaging.inbox/outbox`;
- toàn bộ config, exception, security, enum, request/response DTO và business entity còn lại.

### 4.2. Type chưa đạt vị trí TO-BE

| Type | Package hiện tại | Package mục tiêu | Batch | Đánh giá |
|---|---|---|---|---|
| `ProcessedEvent` | `entity` | `entity.inbox` | B03 | Chưa đạt technical entity placement |
| `OutboxEvent` | `entity` | `entity.outbox` | B03 | Chưa đạt technical entity placement |
| `InboxService` | `service` | `messaging.inbox` | B04 | Technical interface tách khỏi implementation |
| `OutboxService` | `service` | `messaging.outbox` | B04 | Technical interface tách khỏi implementation |
| `CheckoutExpiryJob` | `messaging` | `scheduler` | B05 | Scheduled adapter nằm trong messaging root |
| `ChatSignalPublisher` | `service` | `messaging.publisher` | B06 | Infrastructure publisher nằm trong service contract package |
| `OrderEventPublisher` | `service` | `messaging.publisher` | B06 | Infrastructure publisher nằm trong service contract package |
| `OrderAccess` | `service` | `service.support` | B08 | Application policy nằm chung với service interface |
| `OrderProgress` | `service` | `service.support` | B08 | Application collaborator nằm chung với service interface |
| `OrderFileService` | `service` | `storage` | B09 | Storage adapter nằm trong service contract package |

Không đánh giá các mục trên là business-logic defect. Đây là package placement debt đã được Migration Plan nhận diện.

## 5. Interface–implementation organization

### 5.1. Business service

| Interface | Implementation | Đánh giá |
|---|---|---|
| `CartService` | `service.impl.CartServiceImpl` | Đạt |
| `ChatService` | `service.impl.ChatServiceImpl` | Đạt |
| `CheckoutService` | `service.impl.CheckoutServiceImpl` | Đạt |
| `DisputeService` | `service.impl.DisputeServiceImpl` | Đạt |
| `OrderDocumentService` | `service.impl.OrderDocumentServiceImpl` | Đạt |
| `OrderService` | `service.impl.OrderServiceImpl` | Đạt |
| `OrderStatsService` | `service.impl.OrderStatsServiceImpl` | Đạt |
| `ReviewService` | `service.impl.ReviewServiceImpl` | Đạt |

Controller, listener và scheduled job inject các interface này; không phát hiện dependency trực tiếp tới `service.impl`.

### 5.2. Technical service

| Interface | Implementation | Đánh giá |
|---|---|---|
| `service.InboxService` | `messaging.inbox.InboxServiceImpl` | Hoạt động và DI hợp lệ, nhưng chưa đạt B04 TO-BE |
| `service.OutboxService` | `messaging.outbox.OutboxServiceImpl` | Hoạt động và DI hợp lệ, nhưng chưa đạt B04 TO-BE |

Hai implementation đã được phân loại đúng infrastructure concern; interface vẫn ở application `service`, làm phát sinh dependency `messaging -> service` trong trạng thái hiện tại.

### 5.3. Framework-generated interface và SPI

| Loại | Kết quả |
|---|---|
| Spring Data repository | 18 interface, không có handwritten `repository.impl`; đạt rule AR-19 |
| OpenFeign client | 5 interface, không có handwritten `ClientImpl`; đạt rule AR-20 |
| Shared relay SPI | `JpaOutboxEventSource` implements `OutboxEventSource` trong `messaging.outbox`; đúng vai trò adapter |

Không coi việc không có handwritten implementation cho Spring Data/OpenFeign là thiếu implementation.

## 6. Dependency direction

### 6.1. Ma trận kiểm tra

| From | Dependency thực tế | Kết quả | Bằng chứng |
|---|---|---|---|
| `controller` | DTO, enum, security, service interface | Đạt | Không có import repository/entity/client/messaging/storage |
| `listener` | inbound event DTO, `RabbitConfig`, service interface | Đạt | Không gọi repository/entity/client trực tiếp |
| scheduled adapter | `CheckoutService` | Đạt về direction | Class mỏng nhưng package placement chưa đạt |
| `service.impl` | service contract/support, repository, entity, client/facade, config, publisher/technical contract hiện ở `service` | Đạt theo pragmatic Layered Architecture | Không import controller/listener/scheduler |
| `repository*` | entity, enum, Spring Data/JPA | Đạt | Không import service/controller/client/messaging |
| `entity` | enum/value/JPA/Lombok | Đạt | Không import repository/service/controller/client/messaging/DTO |
| `client*` | client DTO, Feign/Spring Web type | Đạt | Không import service/repository/entity/controller |
| `dto*` | JDK type, enum/contract được phép | Đạt | Không phụ thuộc JPA entity |
| `messaging.inbox/outbox` | technical repository/entity và technical interface hiện ở `service` | Chưa đạt TO-BE | Còn chiều `messaging -> service` do B04 chưa hoàn tất |
| Package graph | Không có cycle | Đạt | `NO_PACKAGE_CYCLES` pass |

### 6.2. Graph hiện tại

```text
controller ───────────┐
listener ─────────────┼──> service interface ──> service.impl ──> repository ──> entity
CheckoutExpiryJob ────┘                              │
                                                    ├──> client / client.facade
                                                    └──> concrete collaborator trong service

messaging.inbox.InboxServiceImpl   ──> service.InboxService
messaging.outbox.OutboxServiceImpl ──> service.OutboxService
messaging.outbox.*                  ──> repository.inbox/outbox ──> entity
```

Không có chiều `service -> messaging` ở trạng thái hiện tại nên graph chưa tạo cycle.

### 6.3. Sequencing issue cần Architect xử lý

Phase 10 đã ghi nhận cần di chuyển `InboxService`/`OutboxService` trước publisher. Phase 11 bổ sung một prerequisite còn thiếu: `CheckoutExpiryJob` hiện vẫn ở root `messaging` và phụ thuộc `CheckoutService`.

Nếu chỉ di chuyển hai technical interface trong trạng thái hiện tại:

```text
service.impl -> messaging.inbox/outbox
messaging.CheckoutExpiryJob -> service
```

Graph sẽ thành:

```text
service -> messaging -> service
```

Thứ tự an toàn được đề xuất để Architect phê duyệt:

1. B05: di chuyển `CheckoutExpiryJob` từ `messaging` sang `scheduler`;
2. B04 còn lại: di chuyển đồng thời `InboxService` và `OutboxService` vào `messaging.inbox/outbox`;
3. chạy `NO_PACKAGE_CYCLES` và compile/test;
4. B06: di chuyển `ChatSignalPublisher` và `OrderEventPublisher` vào `messaging.publisher`.

Hai listener đã rời root `messaging`, vì vậy sau B05 không còn inbound adapter nào giữ chiều `messaging -> service` ngoài hai technical interface đang chờ B04.

## 7. Đối chiếu Architecture Rules

| Rule | Kết quả | Bằng chứng/vấn đề còn lại |
|---|---|---|
| AR-01 — Layered Architecture | Đạt | Layer controller/service/repository/entity và integration concern nhận diện rõ |
| AR-02 — Dependency đi từ inbound đến application/data/integration | Đạt về behavior | TO-BE placement chưa hoàn tất nhưng không có reverse business dependency/cycle |
| AR-03 — Controller chỉ dùng service/DTO/security/presentation | Đạt | Import audit 9 controller |
| AR-04 — Controller không dùng repository/entity/client/messaging/storage | Đạt | ArchUnit kiểm repository/entity; static import audit bổ sung client/messaging/storage |
| AR-05 — Listener/scheduler mỏng và gọi service interface | Đạt | Hai listener và `CheckoutExpiryJob` chỉ route/orchestrate tối thiểu |
| AR-06 — Service implementation được dùng repository/entity/client/infrastructure | Đạt | Dependency đúng pragmatic profile |
| AR-07 — Transaction boundary không ở controller/listener | Đạt | `@Transactional` nằm tại service/technical implementation; exception AR-18 được giữ |
| AR-08 — Repository chỉ dùng entity/enum/framework | Đạt | 18 repository được kiểm tra |
| AR-09 — Entity/enum độc lập upper layer | Đạt | Entity chỉ import enum nội bộ ngoài JPA/Lombok/JDK |
| AR-10 — Feign/client DTO không dùng service/repository/entity | Đạt | Import audit package `client` |
| AR-11 — Không package cycle | Đạt | ArchUnit `NO_PACKAGE_CYCLES` pass |
| AR-12 — Không lộ entity qua API/event contract | Đạt | Controller và DTO không dùng entity; ArchUnit pass |
| AR-13 — Không đặt business logic trong config/exception/listener/scheduler/mapper | Đạt | Listener/job chỉ route; không có mapper package; config/handler không triển khai use case |
| AR-14 — Service/adapter không gọi controller | Đạt | ArchUnit service rule và static import audit |
| AR-15 — `controller` chỉ chứa HTTP entry point | Đạt | 9 type đều là controller |
| AR-16 — `service.impl` chỉ chứa application-service implementation | Đạt | 8/8 type là business `*ServiceImpl` |
| AR-17 — Infrastructure implementation ra khỏi `service` | Chưa đạt | Hai publisher và `OrderFileService` vẫn ở `service`; support collaborator cũng chưa tách theo TO-BE |
| AR-18 — Technical transaction service được dùng `MANDATORY` | Đạt | Inbox 1 method, Outbox 2 method giữ `Propagation.MANDATORY` |
| AR-19 — Không tạo repository implementation dư thừa | Đạt | Spring Data sinh proxy |
| AR-20 — Feign contract không có port/implementation thứ hai | Đạt | 5 Feign interface trực tiếp |
| AR-21 — Messaging role phải nhận diện rõ | Chưa đạt hoàn toàn | Listener/outbox đã rõ; scheduler và publisher còn sai package |
| AR-22 — DTO không dùng JPA entity làm field | Đạt | Shared ArchUnit `DTOS_DO_NOT_USE_ENTITIES` pass |
| AR-23 — Incoming/outgoing event direction rõ | Đạt | `dto.event.inbound/outbound` đã hình thành |
| AR-24 — Chỉ tách mapper khi có lý do | Đạt | Không tạo mapper package/abstraction giả |
| AR-25 — Technical persistence model phân biệt business entity | Chưa đạt | `ProcessedEvent`, `OutboxEvent` còn ở root `entity` |

## 8. Package/import cũ còn sót

### 8.1. FQCN đã migration

Repo search trên `src/main` và `src/test` không phát hiện reference tới các FQCN cũ sau:

- 8 event DTO tại `com.moonkage.order.dto.event.<Type>`;
- `com.moonkage.order.messaging.PaymentEventListener`;
- `com.moonkage.order.messaging.QuoteAcceptedListener`;
- `com.moonkage.order.service.VendorDirectory`;
- `com.moonkage.order.service.impl.InboxServiceImpl`;
- `com.moonkage.order.service.impl.OutboxServiceImpl`;
- `com.moonkage.order.messaging.JpaOutboxEventSource`;
- hai technical repository tại root `repository`.

Các path cũ tương ứng đều không còn tồn tại trên filesystem. Tên/package cũ vẫn xuất hiện trong tài liệu Phase 01–10 như historical AS-IS/migration mapping; đây không phải production reference còn sót.

### 8.2. Reference còn ở package cũ theo kế hoạch

Các import sau vẫn tồn tại hợp lệ với source hiện tại nhưng chưa đạt TO-BE:

- `service.InboxService`;
- `service.OutboxService`;
- `service.ChatSignalPublisher`;
- `service.OrderEventPublisher`;
- `service.OrderAccess`;
- `service.OrderProgress`;
- `service.OrderFileService`;
- `entity.ProcessedEvent`;
- `entity.OutboxEvent`.

Không tự sửa các import này trong Phase 11.

## 9. ArchUnit rules hiện có

File shared:

```text
api/config/archunit/com/moonkage/architecture/ArchitectureTest.java
```

| Rule hiện có | Kết quả Order Service | Phạm vi bảo vệ |
|---|---|---|
| `CONTROLLERS_DO_NOT_USE_REPOSITORIES` | Pass | Controller không gọi repository |
| `CONTROLLERS_DO_NOT_USE_ENTITIES` | Pass | API không lộ entity trực tiếp |
| `DTOS_DO_NOT_USE_ENTITIES` | Pass | DTO không chứa entity dependency |
| `REPOSITORIES_DO_NOT_USE_UPPER_LAYERS` | Pass | Repository không dùng service/controller/DTO/mapper |
| `SERVICES_DO_NOT_USE_CONTROLLERS` | Pass | Service không gọi controller |
| `NO_PACKAGE_CYCLES` | Pass | Không có top-level package cycle |

Command đã chạy từ thư mục `api`:

```text
mvn -pl order-service -am '-Dtest=ArchitectureTest' '-Dsurefire.failIfNoSpecifiedTests=false' test
```

Kết quả:

- Order Service: 6 test, 0 failure, 0 error, 0 skip;
- reactor: `BUILD SUCCESS`;
- Spotless pass;
- Checkstyle: 0 violation.

Đây là targeted architecture verification. Full reactor test không được chạy lại trong Phase 11 vì không có source change; lần full verification gần nhất ở Phase 10 đạt 227/227 test.

## 10. Khoảng trống của ArchUnit coverage hiện tại

Các rule hiện tại là shared rule cho toàn platform, chưa mô tả đầy đủ Architecture Profile riêng của Order Service:

1. Controller rule chưa cấm trực tiếp dependency tới Feign client, messaging, storage và scheduler.
2. Chưa có rule cho dependency của `listener` và `scheduler`.
3. Chưa có rule ngăn entity phụ thuộc upper layer; hiện chỉ kiểm chiều DTO → entity.
4. Chưa có rule ngăn Feign client/client DTO phụ thuộc service/repository/entity/controller.
5. Repository rule chưa cấm client/messaging/listener/storage.
6. Chưa kiểm `service.impl` không phụ thuộc controller/listener/scheduler.
7. Chưa kiểm business service interface/implementation phải ở đúng package.
8. Chưa kiểm stereotype/role placement như `@RabbitListener`, `@Scheduled`, `@FeignClient`, `@Entity`.
9. Chưa kiểm publisher/storage technical dependency phải ở package chuyên biệt.
10. `NO_PACKAGE_CYCLES` phát hiện cycle nhưng không chứng minh đúng dependency direction hoặc class placement.

Do đó 6/6 rule pass không đồng nghĩa cây TO-BE đã hoàn tất.

## 11. Đề xuất ArchUnit rules riêng cho Order Service

Đề xuất tạo test riêng với `@AnalyzeClasses(packages = "com.moonkage.order")` sau khi Senior Solution Architect phê duyệt. Không sửa shared rule của toàn platform nếu rule chỉ áp dụng cho Order Service.

### 11.1. Rule có thể bật ngay

| ID đề xuất | Nội dung | Mục tiêu |
|---|---|---|
| `OAR-01` | Controller không phụ thuộc `repository`, `entity`, `client`, `messaging`, `listener`, `scheduler`, `storage` hoặc `service.impl` | Bảo vệ AR-03/04 đầy đủ hơn shared rule |
| `OAR-02` | `listener` không phụ thuộc repository/entity/client/publisher/storage và không inject `service.impl` | Giữ inbound adapter mỏng |
| `OAR-03` | Entity không phụ thuộc repository/service/controller/client/messaging/listener/DTO | Bảo vệ AR-09 theo chiều còn thiếu |
| `OAR-04` | `client` và `client.dto` không phụ thuộc service/repository/entity/controller/messaging | Bảo vệ AR-10 |
| `OAR-05` | Repository không phụ thuộc client/messaging/listener/scheduler/storage ngoài các upper layer đã cấm | Hoàn thiện AR-08 |
| `OAR-06` | `service.impl` không phụ thuộc controller/listener/scheduler hoặc HTTP handler | Bảo vệ orchestration boundary |
| `OAR-07` | Controller/listener/scheduler không phụ thuộc class có suffix `ServiceImpl` | Bảo vệ interface injection |
| `OAR-08` | Method/class trong controller/listener/scheduler không dùng `@Transactional` | Bảo vệ transaction boundary AR-07 |
| `OAR-15` | Ba inbound event type chỉ ở `dto.event.inbound`, năm outbound type chỉ ở `dto.event.outbound` | Giữ regression guard cho B01/B02 |
| `OAR-16` | `@RabbitListener` chỉ xuất hiện ở approved root `..listener..` | Phản ánh hiệu chỉnh Phase 07 |

Các rule trên phù hợp trạng thái source hiện tại và không yêu cầu đổi business logic.

### 11.2. Rule chỉ bật sau khi hoàn tất package migration

| ID đề xuất | Nội dung | Prerequisite |
|---|---|---|
| `OAR-09` | `@Scheduled` component phải ở `..scheduler..` | Hoàn tất B05 |
| `OAR-10` | Class phụ thuộc `RabbitTemplate` hoặc có role publisher phải ở `..messaging.publisher..` | Hoàn tất B06 |
| `OAR-11` | Class phụ thuộc `ObjectStorage` phải ở `..storage..` | Hoàn tất B09 |
| `OAR-12` | Root `service` chỉ chứa 8 business service interface; application collaborator ở `service.support` | Hoàn tất B04/B06/B08/B09 |
| `OAR-13` | `InboxService`/`InboxServiceImpl` chỉ ở `messaging.inbox`; Outbox tương ứng chỉ ở `messaging.outbox` | Hoàn tất B04 |
| `OAR-14` | `ProcessedEvent` ở `entity.inbox`, `OutboxEvent` ở `entity.outbox`; repository technical đi cùng subpackage | Hoàn tất B03 |

Không đề xuất rule ép mọi concrete class phải có interface hoặc ép tạo mapper package; hai yêu cầu đó trái Architecture Profile đã phê duyệt.

## 12. Điểm cần Senior Solution Architect quyết định

| ID | Quyết định cần có | Đề xuất |
|---|---|---|
| `AC-01` | Sequencing B05/B04/B06 | Chuyển `CheckoutExpiryJob` sang `scheduler` trước, sau đó technical interface, cuối cùng publisher |
| `AC-02` | Thời điểm hoàn tất B03 entity | Thực hiện batch riêng và chạy JPA/Testcontainers verification |
| `AC-03` | Thời điểm thực hiện B08/B09 | Tách package move khỏi rename/refactor logic |
| `AC-04` | Có bổ sung Order-specific ArchUnit test không | Phê duyệt nhóm OAR-01–08 trước; OAR-09–16 bật theo prerequisite |
| `AC-05` | Shared rule hay module-specific rule | Giữ shared rule hiện tại; thêm rule riêng trong Order Service để tránh áp đặt profile cho microservice khác |

## 13. Rủi ro còn lại

1. Cây package hiện tại an toàn nhưng là intermediate state; một batch move sai thứ tự có thể tạo cycle dù baseline ArchUnit đang pass.
2. `service` vẫn trộn business contract, technical contract, application support và infrastructure collaborator.
3. Technical entity chưa được tách khỏi business entity vocabulary.
4. Shared ArchUnit coverage còn rộng nhưng nông; regression về client/listener/scheduler/storage direction có thể chưa bị phát hiện.
5. Full Spring context chưa có dedicated assertion cho listener/scheduler/publisher bean placement; Phase 11 không thêm test mới.
6. Working tree chứa Phase 10 chưa commit; mọi migration tiếp theo phải giữ nguyên và review cùng các thay đổi này hoặc commit/tách batch theo quyết định của người dùng.

## 14. Kết luận

Order Service **đạt Layered Architecture về dependency direction hiện tại**, nhưng **chưa đạt đầy đủ Target Package Design**:

- 6/6 ArchUnit rule hiện có pass;
- không có package cycle hoặc stale production import của các type đã migration;
- 8/8 business service interface–implementation pair đúng convention;
- 10 type còn sai vị trí TO-BE;
- 6 target package chưa hình thành;
- cần điều chỉnh migration order để đưa scheduler ra khỏi `messaging` trước technical interface và publisher;
- đề xuất 16 Order-specific ArchUnit guardrail, nhưng chưa bổ sung test do chưa được phê duyệt.

Phase 11 dừng tại báo cáo compliance và chờ review.
