# Phase 03 — Architecture Profile của Order Service

> Phạm vi: `api/order-service`  
> Architecture direction: **Layered Architecture**  
> Ngày xác nhận: 12/11/2026  
> Đầu vào: source code hiện tại, `01_PACKAGE_INVENTORY.md`, `02_RESPONSIBILITY_ANALYSIS.md`  
> Ngoài phạm vi: sửa source, thay đổi contract/schema/dependency, thiết kế package tree TO-BE cuối cùng.

## 1. Architecture decision đề xuất

Order Service nên được chuẩn hóa theo **pragmatic Layered Architecture** đang hiện hữu, không chuyển sang Clean Architecture hoặc Hexagonal Architecture.

Profile đề xuất gồm các logical layer:

1. **Presentation / Inbound Layer** — HTTP controller, request binding, caller resolution, exception-to-HTTP mapping.
2. **Application / Business Layer** — application service, transaction boundary, authorization/use-case orchestration và business rule hiện đang nằm trong service.
3. **Domain & Persistence Model** — JPA business entity/value object và enum nghiệp vụ.
4. **Data Access Layer** — Spring Data repository và query projection.
5. **Integration / Infrastructure Layer** — OpenFeign client, AMQP listener/publisher, scheduler, object storage, outbox/inbox adapter.
6. **Configuration / Bootstrap** — Spring configuration, properties và application entry point.

Đây là logical profile. Một số package hiện tại chứa type thuộc nhiều logical layer; việc di chuyển cụ thể sẽ thuộc phase chuẩn hóa sau khi các quyết định trong mục 10 được Architect phê duyệt.

### Dependency flow mục tiêu

```text
HTTP Controller ───────────────┐
AMQP Listener ────────────────┼──> Service interface ──> Service implementation
Scheduled Job ────────────────┘                              │
                                                            ├──> Repository ──> Entity/Enum
                                                            ├──> Feign Client ──> Client DTO
                                                            ├──> Event/Outbox/Publisher
                                                            └──> Storage/technical collaborator

Configuration/Bootstrap wires components; không chứa business flow.
```

Không yêu cầu mọi dependency phải đi qua abstract port. Trong profile Layered này, application service implementation có thể phụ thuộc trực tiếp Spring Data repository, Feign client và infrastructure collaborator nếu boundary và dependency direction vẫn rõ.

## 2. Đối chiếu AS-IS với Layered Architecture

### 2.1. Layer thực tế đang tồn tại

| Logical layer | Package/type AS-IS | Trách nhiệm hiện tại | Mức độ phù hợp |
|---|---|---|---|
| Presentation / HTTP | `controller`, `dto.request`, `dto.response`, `security.CurrentUser*`, `GlobalExceptionHandler` | HTTP endpoint, validation/binding, caller context, response/error mapping | Tốt |
| Application / Business | `service`, `service.impl` | Use case contract, transaction, orchestration, authorization, business rule, mapping | Tồn tại rõ nhưng package `service` đang lẫn technical collaborator |
| Domain & Persistence Model | `entity`, `enums` | JPA state, value object, business/technical status enum | Tồn tại; entity thiên về persistence model hơn rich domain model |
| Data Access | `repository` | Spring Data CRUD, lock, query, projection | Tốt |
| External HTTP Integration | `client`, `client.dto` | Feign proxy contract và remote DTO | Tốt |
| Messaging / Scheduled Integration | `messaging`, một phần `service`/`service.impl` | Rabbit listener, scheduler, publisher, outbox/inbox | Tồn tại nhưng phân tán và trộn inbound/outbound/persistence role |
| Storage Integration | `OrderFileService`, shared `ObjectStorage` | Presigned link, attach/move file, public/private URL | Có implementation nhưng đang nằm trong `service` |
| Configuration / Bootstrap | `config`, `OrderServiceApplication` | Bean/configuration properties, AMQP binding, OpenAPI, locale, bootstrap | Tốt |
| Cross-cutting Error | `exception` | Error vocabulary và HTTP exception mapping | Hợp lý theo convention hiện tại |

### 2.2. Dependency direction hiện tại phù hợp

- Controller chỉ inject service interface; không import repository hoặc entity.
- Repository chỉ import entity và enum; không phụ thuộc controller, service, client hoặc messaging.
- Entity chỉ import enum nội bộ; không phụ thuộc ngược lên service/repository/client.
- Feign client chỉ dùng `client.dto` và framework annotation.
- Rabbit listener và scheduled job gọi service interface thay vì repository.
- Service implementation là nơi điều phối repository, external client, event, storage và transaction.
- Request/response DTO không phụ thuộc repository/service/client.

### 2.3. Điểm làm mờ layer

| Điểm AS-IS | Ảnh hưởng tới Layered Architecture |
|---|---|
| `OrderFileService`, `ChatSignalPublisher`, `VendorDirectory` nằm trong `service` | Infrastructure/integration implementation bị nhìn như business service |
| `InboxServiceImpl`, `OutboxServiceImpl` nằm trong `service.impl` | Technical persistence adapter bị gom cùng application-service implementation |
| `OrderAccess`, `OrderProgress`, publisher và service interface cùng ở `service` | Khó viết package rule chỉ cho “service contract” mà không nhận nhầm concrete collaborator |
| `messaging` chứa listener, scheduler và JPA outbox source | Package name không cho biết inbound trigger hay persistence/outbound adapter |
| `OutboxEvent`, `ProcessedEvent` nằm trong `entity` | Technical persistence model nằm cùng business model |
| `ChatEvent` dùng `ChatMessageResponse` | Integration event contract phụ thuộc HTTP response DTO vocabulary |
| `OrderServiceImpl`, `CheckoutServiceImpl` có responsibility breadth cao | Layer direction vẫn đúng nhưng service layer có nguy cơ trở thành orchestration “god class” |

Các điểm trên không phủ nhận Layered Architecture; chúng là package/responsibility clarity issue trong cùng architecture style.

## 3. Trách nhiệm chuẩn của từng layer

### 3.1. Presentation / Inbound Layer

**Bao gồm:** REST controller, HTTP request/response DTO, gateway caller resolver, HTTP exception handler.

**Được phép:**

- bind path/query/header/body;
- Bean Validation và input-shape validation;
- chuyển HTTP context thành `CurrentUserInfo`;
- gọi application service interface;
- map application exception thành HTTP response;
- khai báo OpenAPI metadata liên quan endpoint.

**Không được phép:**

- gọi repository, `EntityManager`, Feign client, `RabbitTemplate` hoặc object storage trực tiếp;
- điều khiển transaction;
- thực thi state transition, payment/stock workflow hoặc business authorization;
- trả JPA entity trực tiếp trong API contract.

### 3.2. Application / Business Layer

**Bao gồm:** service interface, `service.impl`, application policy/helper như `OrderAccess`, `OrderProgress` và event composition gắn với use case.

**Được phép:**

- định nghĩa use-case operation;
- mở transaction và điều phối repository/integration;
- thực thi business rule đang thuộc service model của Order Service;
- kiểm tra authorization theo business ownership;
- tạo entity/value object và thay đổi aggregate state;
- publish/enqueue event trong cùng transaction;
- map entity/projection thành application/API response khi mapping chỉ phục vụ use case đó.

**Không được phép:**

- chứa HTTP servlet/request/response handling;
- chứa `@RabbitListener`, `@Scheduled` hoặc controller annotation;
- tự cấu hình queue/exchange/Feign bean/storage bean;
- chứa protocol serialization/AMQP message construction trừ technical adapter được phân loại rõ;
- phụ thuộc vào controller hoặc HTTP exception handler.

### 3.3. Domain & Persistence Model Layer

**Bao gồm:** business JPA entity, `@Embeddable` value object, enum trạng thái/khái niệm nghiệp vụ.

**Được phép:**

- biểu diễn state và relationship của Order Service;
- chứa invariant hoặc behavior tự nhiên thuộc chính entity/value object;
- dùng JPA/Lombok annotation theo lựa chọn Layered Architecture hiện tại;
- phụ thuộc enum/value type cấp thấp.

**Không được phép:**

- gọi repository, service, Feign client, messaging hoặc storage;
- nhận/trả HTTP DTO hoặc event DTO trong behavior;
- biết controller, scheduler hoặc transaction orchestration.

Profile này không yêu cầu chuyển sang pure domain model. JPA annotation trong entity là trade-off được chấp nhận của pragmatic Layered Architecture.

### 3.4. Data Access Layer

**Bao gồm:** Spring Data repository, query/projection interface và persistence-specific query.

**Được phép:**

- CRUD, derived query, JPQL/native query;
- pessimistic lock và data-access concern;
- projection phục vụ query/report;
- phụ thuộc entity, enum và Spring Data/JPA.

**Không được phép:**

- chứa use-case orchestration hoặc external service call;
- phụ thuộc controller/service implementation/client/messaging;
- tạo HTTP response hoặc publish event.

### 3.5. Integration / Infrastructure Layer

**Bao gồm:** Feign client, client DTO, AMQP listener/publisher, scheduled trigger, outbox/inbox adapter, object-storage adapter.

**Được phép:**

- triển khai protocol/framework detail;
- chuyển incoming event sang application service call;
- gọi external HTTP API;
- serialize/publish message hoặc ghi/đọc technical outbox/inbox state;
- chuẩn hóa technical failure thành application-understood result/exception;
- kích hoạt use case theo schedule.

**Không được phép:**

- sở hữu business state transition của order/checkout/dispute;
- bypass application service để thay đổi business entity;
- để controller hoặc entity phụ thuộc trực tiếp vào implementation kỹ thuật;
- làm listener/scheduler thành nơi triển khai use case.

### 3.6. Configuration / Bootstrap Layer

**Bao gồm:** `OrderServiceApplication`, `config` và `@ConfigurationProperties`.

**Được phép:**

- khai báo bean, queue/exchange/binding, converter, locale/OpenAPI configuration;
- bind external configuration;
- enable framework feature và bootstrap application.

**Không được phép:**

- chứa business branch hoặc business state mutation;
- gọi repository/client để thực thi workflow lúc startup;
- trở thành nơi chứa helper chỉ vì class không khớp package khác.

## 4. Architecture Rules đề xuất

### 4.1. Core dependency rules

| Rule ID | Quy tắc | Mức áp dụng |
|---|---|---|
| `AR-01` | Order Service sử dụng Layered Architecture; không bắt buộc port/adapter abstraction kiểu Clean/Hexagonal | Bắt buộc |
| `AR-02` | Dependency nghiệp vụ đi từ inbound entry point đến application service, sau đó đến data access/integration; không phụ thuộc ngược | Bắt buộc |
| `AR-03` | Controller chỉ phụ thuộc service interface, DTO, security caller model và presentation concern | Bắt buộc |
| `AR-04` | Controller không phụ thuộc repository, entity, Feign client, messaging publisher hoặc storage | Bắt buộc |
| `AR-05` | Rabbit listener và scheduled job phải mỏng, chỉ validate/route transport data rồi gọi service interface | Bắt buộc |
| `AR-06` | Application service implementation được phép phụ thuộc repository, entity, client và infrastructure collaborator | Bắt buộc theo profile pragmatic |
| `AR-07` | Transaction boundary đặt tại application service implementation; không đặt tại controller/listener | Bắt buộc; ngoại lệ kỹ thuật ở `AR-18` |
| `AR-08` | Repository chỉ phụ thuộc entity/enum và persistence framework; không phụ thuộc service/controller/client | Bắt buộc |
| `AR-09` | Entity/enum không phụ thuộc service, repository, DTO, client, messaging hoặc controller | Bắt buộc |
| `AR-10` | Feign client và client DTO không phụ thuộc application service/repository/entity | Bắt buộc |
| `AR-11` | Không có cyclic dependency giữa package/layer | Bắt buộc |
| `AR-12` | Business entity không được lộ trực tiếp qua API/event contract; dùng DTO/contract type | Bắt buộc |
| `AR-13` | Business logic không đặt trong config, exception handler, listener, scheduler hoặc mapper | Bắt buộc |
| `AR-14` | Service không gọi controller; repository/integration adapter không tự gọi controller | Bắt buộc |

### 4.2. Package responsibility rules

| Rule ID | Quy tắc | Mức áp dụng |
|---|---|---|
| `AR-15` | `controller` chỉ chứa HTTP entry point; internal endpoint vẫn là controller | Bắt buộc |
| `AR-16` | `service.impl` chỉ chứa application-service implementation, không chứa JPA/AMQP/storage adapter thuần kỹ thuật | Đề xuất áp dụng sau chuẩn hóa |
| `AR-17` | `service` có thể chứa service contract và cohesive application-support collaborator; infrastructure implementation phải được phân loại ra khỏi package này | Đề xuất áp dụng sau chuẩn hóa |
| `AR-18` | Technical transaction service như inbox/outbox được phép dùng `@Transactional(MANDATORY)` để tham gia transaction do application service mở | Ngoại lệ được đề xuất |
| `AR-19` | `repository` chứa cả Spring Data interface và projection gần query owner; không tạo handwritten `Impl` nếu Spring Data đã sinh proxy | Bắt buộc |
| `AR-20` | `client` chứa OpenFeign contract; không tạo interface port thứ hai nếu không có nhu cầu thay implementation hoặc cô lập protocol | Đề xuất |
| `AR-21` | `messaging` không nên là “miscellaneous integration”; listener, publisher, scheduler và outbox persistence role phải nhận diện được bằng package/name | Đề xuất áp dụng sau chuẩn hóa |
| `AR-22` | Request, response, client và event DTO không dùng JPA entity làm field | Bắt buộc |
| `AR-23` | Incoming và outgoing event có thể cùng module nhưng direction và delivery semantics phải được document/nhận diện rõ | Bắt buộc về semantics; package cụ thể chờ phê duyệt |
| `AR-24` | Mapping use-case-specific có thể nằm trong service implementation; chỉ tách mapper khi mapping phức tạp, reused hoặc thay đổi độc lập | Đề xuất |
| `AR-25` | Technical persistence model có thể dùng JPA nhưng phải phân biệt với business entity bằng package/name/documentation | Đề xuất áp dụng sau chuẩn hóa |

## 5. Quy tắc interface và implementation

### 5.1. Application service

1. Public use-case contract dùng hậu tố `Service` và nằm trong `service`.
2. Implementation mặc định dùng cùng tên cộng `Impl` và nằm trong `service.impl`.
3. Controller, listener và scheduler inject interface, không inject `*ServiceImpl`.
4. `@Service` và `@Transactional` đặt trên implementation; interface không chứa framework behavior ngoài annotation/documentation thực sự cần cho contract.
5. Không coi convention `service` + `service.impl` là vi phạm Layered Architecture.
6. Không tạo thêm interface chỉ để mọi class đều có interface. Interface mới cần ít nhất một lý do rõ ràng:
   - là boundary được nhiều inbound adapter gọi;
   - có khả năng có nhiều implementation;
   - cần cô lập implementation/framework để test hoặc thay thế;
   - là contract ổn định giữa các component có change lifecycle khác nhau.
7. Không xóa interface hiện hữu chỉ vì hiện có một implementation; việc xóa cần đánh giá caller, test và architecture convention toàn service.

### 5.2. Application-support collaborator

- Concrete helper/policy như `OrderAccess`, `OrderProgress`, `OrderEventPublisher` không bắt buộc có interface.
- Tên class nên phản ánh role (`Access`, `Policy`, `Progress`, `Publisher`, `Mapper`, `Factory`, `Directory`) thay vì dùng hậu tố `Service` nếu không phải application-service contract.
- Concrete collaborator có thể nằm gần application service nếu không triển khai protocol kỹ thuật trực tiếp.
- Nếu class phụ thuộc trực tiếp `RabbitTemplate`, `ObjectStorage`, Feign error type hoặc JPA technical relay contract, class phải được nhận diện là infrastructure/integration collaborator.

### 5.3. Framework-generated interface

Các interface dưới đây là ngoại lệ hợp lý và **không** áp dụng quy tắc `XService` + `XServiceImpl`:

| Loại | Quy tắc |
|---|---|
| Spring Data repository | Giữ `XRepository` trong `repository`; implementation do Spring Data tạo, không tạo `repository.impl` nếu không có custom behavior |
| OpenFeign client | Giữ `XClient` trong `client`; proxy do OpenFeign tạo, không tạo handwritten `XClientImpl` |
| Spring MVC extension | Class có thể implements `HandlerMethodArgumentResolver`/`WebMvcConfigurer` trong security/web configuration concern |
| Shared relay SPI | `JpaOutboxEventSource` implements `OutboxEventSource` vì tích hợp shared outbox relay; đây là infrastructure implementation, không phải service implementation |

### 5.4. Technical service interface

`InboxService` và `OutboxService` là application-facing technical capability. Có hai lựa chọn phù hợp Layered Architecture:

- giữ interface như technical service contract nhưng phân loại implementation ra infrastructure; hoặc
- giữ cả contract/implementation trong technical integration concern nếu không có nhu cầu coi chúng là application contract.

Không cần tái cấu trúc thành “port” theo Clean/Hexagonal terminology. Quyết định package vật lý cần Architect phê duyệt tại `AP-04`.

## 6. Ngoại lệ hợp lý do nghiệp vụ hoặc Spring Boot

| Exception ID | Ngoại lệ | Lý do chấp nhận | Guardrail |
|---|---|---|---|
| `EX-01` | JPA annotation nằm trên business entity | Giảm duplication giữa domain model và persistence model; phù hợp pragmatic layered service | Entity không gọi repository/service/integration |
| `EX-02` | Application service implementation phụ thuộc trực tiếp Spring Data repository | Đây là convention Layered Architecture phổ biến, không cần repository port riêng | Chỉ service/application collaborator gọi repository; controller không gọi |
| `EX-03` | Application service implementation phụ thuộc trực tiếp Feign client | Tránh port/adapter boilerplate khi chỉ có một remote protocol/implementation | Feign type không được rò lên controller/entity; fallback/error policy cần nhất quán |
| `EX-04` | `CurrentUserInfo` xuất hiện trong service interface | Caller identity là input của authorization use case; hiện không chứa servlet type | Không truyền `HttpServletRequest`, token hoặc gateway header vào service |
| `EX-05` | Request/response DTO xuất hiện trong service interface | Giảm mapping layer trung gian trong service nhỏ; API và application contract hiện gần nhau | Entity không lộ ra ngoài; đánh giá lại nếu có nhiều inbound channel cần model khác |
| `EX-06` | Incoming event DTO xuất hiện trong `OrderService` | `createFromQuote` hiện là application use case chỉ được listener gọi | Không để AMQP annotation/framework type vào service contract |
| `EX-07` | `EntityManager.flush()` trong application service/collaborator | Cần version/constraint được materialize trước event hoặc response | Chỉ dùng khi có transaction/version/constraint reason được document; không thay repository mặc định |
| `EX-08` | `TransactionTemplate` trong `CheckoutServiceImpl` | Checkout workflow cần chia transaction quanh remote call/compensation | Giới hạn trong orchestration có lý do rõ; không dùng để che nested transaction tùy tiện |
| `EX-09` | `@Transactional(MANDATORY)` trong inbox/outbox implementation | Bảo đảm idempotency mark/outbox row commit cùng business state | Chỉ được gọi từ transaction hiện hữu; test transaction failure semantics |
| `EX-10` | Direct best-effort RabbitMQ cho chat signal | Typing/read push là hint, yêu cầu latency thấp và không cần durable outbox | Không dùng semantics này cho business event cần delivery guarantee |
| `EX-11` | Internal REST endpoint nằm trong `controller` | Vẫn là HTTP inbound adapter dù audience là service nội bộ | Authorization/network boundary không được xử lý trong repository/service bypass |
| `EX-12` | Error handler nằm trong `exception` | Convention Spring Boot dễ tìm, dù logical role là presentation adapter | Handler chỉ map/localize error, không chứa business decision |
| `EX-13` | Configuration class phụ thuộc framework và có routing-key constants | Spring Boot configuration concern cần biết queue/exchange | Không tạo event/business flow trong config |

## 7. Áp dụng profile cho các class cần chuẩn hóa

Bảng này xác định **layer ownership đề xuất**, chưa quyết định package path TO-BE.

| Class/nhóm | Layer ownership đề xuất | Kết luận profile |
|---|---|---|
| `CartService`, `ChatService`, `CheckoutService`, `DisputeService`, `OrderDocumentService`, `OrderService`, `OrderStatsService`, `ReviewService` | Application / Business | Giữ convention interface trong `service` |
| Các `*ServiceImpl` business tương ứng | Application / Business | Giữ convention implementation trong `service.impl`; decomposition là vấn đề riêng |
| `OrderAccess`, `OrderProgress` | Application / Business support | Concrete class không bắt buộc interface; không coi vị trí cạnh service interface là lỗi tự thân |
| `OrderEventPublisher` | Application event collaborator hoặc Integration publisher boundary | Cần thống nhất ownership; không phải Domain Service |
| `OrderFileService` | Integration / Storage infrastructure | Không nên được phân loại là application service |
| `ChatSignalPublisher` | Integration / Outbound messaging | Không nên nằm trong application service category |
| `VendorDirectory` | Integration / External-client facade | Không phải Domain Service; application được phép phụ thuộc facade |
| `InboxService`, `OutboxService` | Application-facing technical service | Interface placement chờ `AP-04`; semantics transaction phải giữ nguyên |
| `InboxServiceImpl`, `OutboxServiceImpl` | Integration / Technical persistence | Không nên được coi là business `service.impl` |
| `PaymentEventListener`, `QuoteAcceptedListener` | Integration / Inbound messaging | Listener mỏng và dependency direction hiện đúng |
| `CheckoutExpiryJob` | Integration / Scheduled inbound trigger | Vai trò đúng; package vật lý nên nhận diện scheduler thay vì consumer |
| `JpaOutboxEventSource` | Integration / Outbox persistence relay | Không phải inbound listener; nên nhận diện riêng trong infrastructure concern |
| `OutboxEvent`, `ProcessedEvent` và repository tương ứng | Technical persistence | Có thể dùng JPA nhưng cần phân biệt business entity/repository |
| `CatalogClient`, `IdentityClient`, `PaymentClient`, `VendorClient` | Integration / External HTTP | Giữ Feign interface trong `client`; không thêm port nếu chưa có nhu cầu |
| `QuotationClient` | Integration declaration chưa có responsibility thực tế | Chờ xác minh usage; không xóa trong phase này |

## 8. Trade-off của profile đề xuất

### 8.1. Lợi ích

- Bám sát cấu trúc hiện tại, giảm phạm vi di chuyển và rủi ro thay đổi wiring.
- Phù hợp cách Spring Boot/Spring Data/OpenFeign hoạt động; ít abstraction trung gian.
- Dependency direction đơn giản, dễ review: inbound → service → repository/integration.
- Không bắt buộc domain model thuần hoặc port cho mọi external dependency.
- Cho phép giữ transaction orchestration gần business use case.
- Dễ áp dụng incremental package standardization mà không thay đổi business/API/event/database contract.

### 8.2. Chi phí và rủi ro chấp nhận

- Application service implementation biết Spring Data, Feign và JPA; framework coupling cao hơn Clean/Hexagonal.
- Service interface dùng HTTP-oriented DTO và `CurrentUserInfo`, nên application contract chưa hoàn toàn transport-neutral.
- Business rule có xu hướng tập trung vào service implementation; class lớn cần được kiểm soát theo change responsibility.
- JPA entity vừa là business state vừa là persistence model, làm persistence concern hiện diện trong model.
- Direct Feign dependency khiến test application service cần mock remote client contract.
- Package-by-layer có thể khiến một feature trải qua nhiều package; điều hướng theo feature kém hơn package-by-feature.

### 8.3. Vì sao không áp dụng Clean/Hexagonal Architecture

- Source hiện tại không có domain model/port boundary đủ rõ để việc chuyển đổi chỉ là package move.
- Tạo port cho repository, Feign, storage và publisher sẽ thêm nhiều interface/adapter mà chưa có nhu cầu multiple implementation.
- Mục tiêu hiện tại là chuẩn hóa package, không thay đổi business logic hoặc tái thiết kế service.
- Layered dependency direction đã hoạt động tương đối tốt; vấn đề chính là classification clarity và class breadth.
- Transactional outbox, inbox, Feign và JPA vẫn có thể được tổ chức rõ trong Layered Architecture mà không cần đổi architectural style.

## 9. Cơ chế kiểm soát rules đề xuất

### 9.1. Review rule có thể áp dụng ngay

- PR không được thêm controller → repository/client/entity dependency.
- PR không được thêm entity → service/repository/client/messaging dependency.
- Listener/scheduler mới phải gọi service interface và không chứa business mutation trực tiếp.
- Application service mới phải xác định transaction boundary và error/event behavior.
- Infrastructure class mới không đặt vào `service.impl` chỉ vì có Spring stereotype.
- Không tạo interface/`Impl` pair nếu không có lý do boundary rõ ràng.
- Không tái sử dụng JPA entity làm API, client hoặc event DTO.

### 9.2. Automated rule có thể cân nhắc ở phase triển khai

Có thể bổ sung architecture test bằng công cụ **đã có sẵn trong project** nếu có; không tự ý thêm dependency. Rule candidate:

- `controller` không phụ thuộc `repository`, `entity`, `client`, `messaging`;
- `entity`/`enums` không phụ thuộc layer phía trên;
- `repository` chỉ phụ thuộc `entity`/`enums` và framework;
- `messaging` listener không phụ thuộc repository trực tiếp, ngoại trừ outbox persistence adapter được phân loại riêng;
- không class ngoài `service.impl` inject concrete `*ServiceImpl`;
- không có package cycle.

Phase này không tạo hoặc sửa architecture test.

## 10. Điểm cần Solution Architect phê duyệt

| Approval ID | Nội dung cần quyết định | Khuyến nghị | Trade-off/ảnh hưởng |
|---|---|---|---|
| `AP-01` | Xác nhận Order Service dùng pragmatic Layered Architecture, không áp Clean/Hexagonal | **Phê duyệt** | Giữ cấu trúc quen thuộc, chấp nhận coupling Spring/JPA/Feign trong implementation |
| `AP-02` | Giữ convention `service` interface + `service.impl` application implementation | **Phê duyệt** | Ổn định caller và wiring; có thêm interface dù phần lớn chỉ một implementation |
| `AP-03` | Cho phép service implementation phụ thuộc trực tiếp Spring Data repository và Feign client | **Phê duyệt với guardrail** | Ít boilerplate; application layer không transport/persistence-neutral hoàn toàn |
| `AP-04` | Ownership/package category của `InboxService`/`OutboxService` và implementation | **Interface là technical service; implementation thuộc integration/technical persistence** | Cần package move sau này nhưng phải giữ transaction semantics |
| `AP-05` | Chuyển classification của `OrderFileService`, `ChatSignalPublisher`, `VendorDirectory` ra khỏi application service | **Phê duyệt classification** | Làm rõ layer; có thể phát sinh import/package move nhưng không cần thêm interface mặc định |
| `AP-06` | `OrderEventPublisher` thuộc application support hay integration publisher | **Nghiêng về application event collaborator, delivery do `OutboxService` đảm nhiệm** | Event composition gần business state; implementation delivery vẫn tách kỹ thuật |
| `AP-07` | Technical model `OutboxEvent`/`ProcessedEvent` có cần phân biệt package với business entity | **Phê duyệt phân biệt** | Rõ vocabulary; package move phải kiểm tra JPA entity scan |
| `AP-08` | Cho phép service interface tiếp tục dùng request/response DTO và `CurrentUserInfo` | **Phê duyệt trong profile hiện tại** | Đơn giản; chấp nhận application/API contract coupling |
| `AP-09` | `ChatEvent` tiếp tục tái sử dụng `ChatMessageResponse` hay cần event-owned payload type | **Cần Architect quyết định** | Giữ lại giảm duplication; tách ra giảm coupling event contract với HTTP response contract |
| `AP-10` | Incoming/outgoing event tiếp tục chung `dto.event` hay phân biệt direction | **Phê duyệt phân biệt semantics; package cụ thể quyết định ở TO-BE** | Rõ ownership/delivery, đổi package không được đổi contract |
| `AP-11` | Có tách scheduler khỏi `messaging` và outbox relay khỏi listener package không | **Phê duyệt về responsibility** | Rõ inbound/outbound role; có thêm package nhỏ |
| `AP-12` | Có đưa `OrderServiceImpl`/`CheckoutServiceImpl` decomposition vào phase refactor riêng không | **Phê duyệt phân tích riêng, không gộp với package move cơ học** | Giảm rủi ro thay đổi logic khi chuẩn hóa package |
| `AP-13` | Xử lý `QuotationClient`, `Voucher`, `VoucherRepository` chưa có caller | **Chỉ xác minh ownership, chưa xóa** | Tránh xóa feature dự phòng khi chưa có business approval |
| `AP-14` | Mức enforcement bằng architecture test | **Áp rule tối thiểu nếu project đã có công cụ phù hợp** | Giảm regression; không thêm dependency nếu chưa được duyệt |

## 11. Architecture profile tóm tắt

| Thuộc tính | Quyết định đề xuất |
|---|---|
| Architecture style | Pragmatic Layered Architecture |
| Primary dependency direction | Inbound → Application Service → Data Access/Integration |
| Service convention | Interface trong `service`, application implementation trong `service.impl` |
| Repository convention | Spring Data interface trong `repository`, framework-generated implementation |
| Client convention | OpenFeign interface trong `client`, remote contract trong `client.dto` |
| Domain model | JPA-backed entity/value object; không yêu cầu pure domain model |
| Transaction ownership | Application service; technical inbox/outbox tham gia bằng `MANDATORY` |
| Event handling | Listener mỏng; durable business event qua outbox; ephemeral chat signal có ngoại lệ best-effort |
| Interface policy | Chỉ tạo khi có boundary/replacement/testing reason rõ ràng |
| Mapper policy | Không bắt buộc mapper riêng; tách khi phức tạp/reused/independent change |
| Clean/Hexagonal | Không áp dụng cho Order Service trong profile này |

## 12. Phạm vi xác minh

### Đã kiểm tra

- Package inventory và responsibility analysis của Phase 01–02.
- Import direction giữa controller, service, repository, entity, client, messaging và DTO.
- Controller chỉ phụ thuộc service interface.
- Repository chỉ phụ thuộc entity/enum nội bộ.
- Entity không phụ thuộc layer phía trên.
- Feign client chỉ phụ thuộc client DTO nội bộ.
- Listener/scheduler dependency vào service.
- Các ngoại lệ transaction, outbox/inbox, JPA, Feign và best-effort chat signal.

### Không thực hiện

- Không sửa Java, test, configuration hoặc dependency.
- Không di chuyển/đổi tên/tạo/xóa class/interface.
- Không thay đổi API contract, event contract hoặc database schema.
- Không thiết kế package tree TO-BE cuối cùng.
- Không chạy build/test vì chỉ tạo tài liệu architecture profile.

### File thay đổi

- Chỉ tạo `docs/architecture/order/03_ARCHITECTURE_PROFILE.md`.

