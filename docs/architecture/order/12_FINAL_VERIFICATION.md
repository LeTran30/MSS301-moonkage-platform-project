# PHASE 12 — KIỂM CHỨNG SAU REFACTOR

> Phạm vi kiểm chứng: `api/order-service` và các Maven module phụ thuộc cần thiết  
> Ngày kiểm chứng: 12/11/2026 (Asia/Saigon)  
> Kết luận: **CHƯA CHẤP THUẬN HOÀN THÀNH TOÀN BỘ REFACTOR**

## 1. Kết luận điều hành

Các package move đã thực hiện không làm thay đổi behavior quan sát được qua source comparison và test suite:

- 16/16 type đã move có nội dung tương đương sau khi loại trừ thay đổi `package`/`import`;
- Maven compile đạt;
- Maven verify đạt;
- 227/227 test pass, không failure/error/skip;
- Docker/Testcontainers thực sự chạy, không bị skip;
- 6 Flyway migration được validate và áp dụng trên PostgreSQL test container;
- Spring Data phát hiện 18 JPA repository;
- 6/6 ArchUnit rule của Order Service pass;
- controller, request/response DTO, Maven POM, Order Service configuration và migration SQL không thay đổi.

Tuy nhiên Migration Plan mới hoàn thành **16/26 type move**. Còn 10 type chưa đạt TO-BE, Architecture Compliance vẫn là `PARTIALLY_COMPLIANT`, và commit nền có kèm thay đổi ngoài phạm vi tại `web/package-lock.json`.

Vì vậy:

- **chấp thuận về behavior-preservation cho 16 type đã di chuyển**;
- **chưa chấp thuận đóng toàn bộ chương trình package standardization**;
- cần hoàn tất các batch còn lại theo dependency order đã nêu tại Phase 11 rồi chạy lại final verification.

Phase 12 không sửa source/test/configuration/dependency, không commit và không chuyển sang microservice khác.

## 2. Baseline và phạm vi diff

Commit nền chứa Phase 08/09:

```text
d7ec96f refactor(order-service): move technical repositories and messaging implementations
```

Working tree tại thời điểm kiểm chứng chứa thay đổi Phase 10 và tài liệu Phase 10–11 chưa commit. Phase 12 giữ nguyên toàn bộ thay đổi này.

### 2.1. Phạm vi production hợp lệ

- package declaration của type được move;
- import/reference production và test;
- package mới dưới `com.moonkage.order`;
- tài liệu kiến trúc Order Service.

### 2.2. File kỹ thuật không thay đổi trong Order Service

Diff từ parent của `d7ec96f` đến trạng thái hiện tại không có thay đổi tại:

- `api/pom.xml`;
- `api/order-service/pom.xml`;
- `api/order-service/src/main/resources/application.yml`;
- `api/order-service/src/main/resources/db/migration/**`;
- `api/order-service/src/main/resources/messages.properties`;
- toàn bộ `controller/**`;
- toàn bộ `dto/request/**` và `dto/response/**`.

Không phát hiện dependency Maven, database schema, configuration key, HTTP routing hoặc API DTO schema thay đổi trong phạm vi Order Service.

## 3. Đối chiếu Migration Plan

### 3.1. Tổng số type đã di chuyển

| Batch | Kế hoạch | Đã move | Còn lại | Trạng thái |
|---|---:|---:|---:|---|
| B01 — inbound event DTO | 3 | 3 | 0 | Hoàn thành |
| B02 — outbound event DTO | 5 | 5 | 0 | Hoàn thành |
| B03 — technical entity/repository | 4 | 2 | 2 | Một phần; entity chưa move |
| B04 — inbox/outbox technical service | 5 | 3 | 2 | Một phần; interface chưa move |
| B05/B05-HOLD — scheduler/listener | 3 | 2 | 1 | Listener hoàn thành; scheduler chưa move |
| B06 — publisher | 2 | 0 | 2 | Chưa thực hiện |
| B07 — client facade | 1 | 1 | 0 | Hoàn thành |
| B08 — application support | 2 | 0 | 2 | Chưa thực hiện |
| B09 — storage | 1 | 0 | 1 | Chưa thực hiện |
| **Tổng** | **26** | **16** | **10** | **61,5% type move hoàn thành** |

Hai listener dùng target hiệu chỉnh `com.moonkage.order.listener` đã được tiếp nhận tại Phase 07; đây không phải sai lệch chưa phê duyệt.

### 3.2. Danh sách 16 type đã di chuyển

| # | Type | From | To |
|---:|---|---|---|
| 1 | `ProcessedEventRepository` | `repository` | `repository.inbox` |
| 2 | `OutboxEventRepository` | `repository` | `repository.outbox` |
| 3 | `InboxServiceImpl` | `service.impl` | `messaging.inbox` |
| 4 | `OutboxServiceImpl` | `service.impl` | `messaging.outbox` |
| 5 | `JpaOutboxEventSource` | `messaging` | `messaging.outbox` |
| 6 | `PaymentFailedEvent` | `dto.event` | `dto.event.inbound` |
| 7 | `PaymentSucceededEvent` | `dto.event` | `dto.event.inbound` |
| 8 | `QuoteAcceptedEvent` | `dto.event` | `dto.event.inbound` |
| 9 | `ChatEvent` | `dto.event` | `dto.event.outbound` |
| 10 | `DisputeEvent` | `dto.event` | `dto.event.outbound` |
| 11 | `OrderActivityEvent` | `dto.event` | `dto.event.outbound` |
| 12 | `OrderEvent` | `dto.event` | `dto.event.outbound` |
| 13 | `ReviewCreatedEvent` | `dto.event` | `dto.event.outbound` |
| 14 | `PaymentEventListener` | `messaging` | `listener` |
| 15 | `QuoteAcceptedListener` | `messaging` | `listener` |
| 16 | `VendorDirectory` | `service` | `client.facade` |

### 3.3. Danh sách 10 type chưa di chuyển

| Type | Package hiện tại | Package mục tiêu | Batch |
|---|---|---|---|
| `ProcessedEvent` | `entity` | `entity.inbox` | B03 |
| `OutboxEvent` | `entity` | `entity.outbox` | B03 |
| `InboxService` | `service` | `messaging.inbox` | B04 |
| `OutboxService` | `service` | `messaging.outbox` | B04 |
| `CheckoutExpiryJob` | `messaging` | `scheduler` | B05 |
| `ChatSignalPublisher` | `service` | `messaging.publisher` | B06 |
| `OrderEventPublisher` | `service` | `messaging.publisher` | B06 |
| `OrderAccess` | `service` | `service.support` | B08 |
| `OrderProgress` | `service` | `service.support` | B08 |
| `OrderFileService` | `service` | `storage` | B09 |

## 4. Danh sách file thay đổi

### 4.1. Own file của type đã move

Mười sáu dòng trong mục 3.2 tương ứng 16 logical file move. Git ghi nhận 5 move thuộc Phase 08/09 trong commit `d7ec96f`; 11 move Phase 10 hiện biểu diễn dưới dạng deleted path và untracked target path do chưa stage/commit.

### 4.2. Production reference file được cập nhật

| File | Loại thay đổi |
|---|---|
| `service/ChatSignalPublisher.java` | Import outbound `ChatEvent` |
| `service/OrderAccess.java` | Import `client.facade.VendorDirectory` |
| `service/OrderEventPublisher.java` | Import outbound `OrderEvent` |
| `service/OrderService.java` | Import inbound `QuoteAcceptedEvent` |
| `service/impl/ChatServiceImpl.java` | Import event/facade mới |
| `service/impl/DisputeServiceImpl.java` | Import outbound event mới |
| `service/impl/OrderDocumentServiceImpl.java` | Import outbound event mới |
| `service/impl/OrderServiceImpl.java` | Import inbound event/facade mới |
| `service/impl/OrderStatsServiceImpl.java` | Import facade mới |
| `service/impl/ReviewServiceImpl.java` | Import outbound event mới |

Diff `-U0` xác nhận các file trên chỉ thay import; không có method body thay đổi.

### 4.3. Test reference file được cập nhật

| File | Loại thay đổi |
|---|---|
| `ChatServiceImplTest.java` | Import event/facade mới |
| `CustomOrderAndDisputeTest.java` | Import inbound event/facade mới |
| `DisputeServiceImplTest.java` | Import facade mới |
| `OrderServiceImplTest.java` | Import inbound event/facade mới |
| `OrderStatsServiceImplTest.java` | Import facade mới |
| `OutboxServiceImplTest.java` | Import moved implementation/repository và outbound event qua Phase 08–10 |

Không thay đổi test assertion hoặc expected behavior.

### 4.4. Tài liệu

- `docs/architecture/order/01_PACKAGE_INVENTORY.md` đến `12_FINAL_VERIFICATION.md`;
- `docs/architecture/ARCHITECTURE_CONTEXT.md` được thêm trong commit nền.

## 5. Xác nhận không thay đổi business logic

Đã so sánh source trước/sau bằng nội dung từ Git và filesystem hiện tại. Sau khi normalize đúng các thay đổi package/import đã duyệt:

| Nhóm | Số type so sánh | Tương đương |
|---|---:|---:|
| Technical repository | 2 | 2/2 |
| Technical implementation/adapter | 3 | 3/3 |
| Event DTO | 8 | 8/8 |
| Rabbit listener | 2 | 2/2 |
| Client facade | 1 | 1/1 |
| **Tổng** | **16** | **16/16** |

`ReviewCreatedEvent` cần thêm import `EventEnvelope` sau khi chuyển sang subpackage; đây là compile-time import cho Javadoc link, không thay đổi record component hoặc serialization.

Kết luận source comparison:

- không đổi method body;
- không đổi method/constructor signature;
- không đổi annotation semantics;
- không đổi transaction boundary;
- không đổi bean simple name;
- không đổi event field, constant hoặc routing key;
- không đổi business rule.

## 6. Kết quả build và test

Các command chạy từ thư mục `api`.

### 6.1. Compile

```text
mvn -pl order-service -am -DskipTests compile
```

Kết quả: **BUILD SUCCESS**.

- toàn bộ 6 reactor project thành công;
- Spotless pass;
- Checkstyle: 0 violation;
- Order Service compile thành công.

### 6.2. Verify

```text
mvn -pl order-service -am verify
```

Kết quả: **BUILD SUCCESS**.

| Module | Test | Failure | Error | Skip |
|---|---:|---:|---:|---:|
| `common-storage` | 32 | 0 | 0 | 0 |
| `common-observability` | 32 | 0 | 0 | 0 |
| `common-api` | 38 | 0 | 0 | 0 |
| `common-outbox` | 20 | 0 | 0 | 0 |
| `order-service` | 105 | 0 | 0 | 0 |
| **Tổng reactor** | **227** | **0** | **0** | **0** |

Verify cũng hoàn thành:

- compile/testCompile;
- Surefire test;
- JAR packaging;
- Spring Boot repackage;
- Spotless;
- Checkstyle;
- shared ArchUnit test.

Error Prone/Javadoc warning và Mockito dynamic-agent warning baseline vẫn xuất hiện nhưng không làm fail quality gate. Phase 12 không sửa warning ngoài phạm vi.

## 7. Spring Context, JPA scanning và Spring DI

### 7.1. JPA/Testcontainers — đạt

`OrderRepositoryIntegrationTest` và `OrderStatsRepositoryIntegrationTest` chạy với PostgreSQL 17 Testcontainer thực tế:

- Docker container đã start; test không bị skip;
- `OrderServiceApplication` được dùng làm application source cho JPA test slice;
- automatic repository/entity scanning được enable từ package `com.moonkage.order`;
- phát hiện 18 JPA repository interface;
- validate thành công 6 Flyway migration;
- áp dụng thành công 6 migration lên database test;
- Hibernate khởi tạo `EntityManagerFactory` thành công;
- `OrderRepositoryIntegrationTest`: 3/3 pass;
- `OrderStatsRepositoryIntegrationTest`: 3/3 pass;
- `ddl-auto=validate` của repository integration test không phát hiện schema/entity drift.

### 7.2. Component scanning và DI — đạt có giới hạn

Các moved component vẫn nằm dưới application root `com.moonkage.order`:

- `listener.PaymentEventListener` và `listener.QuoteAcceptedListener` giữ `@Component`;
- `client.facade.VendorDirectory` giữ `@Component`;
- `messaging.inbox.InboxServiceImpl` và `messaging.outbox.OutboxServiceImpl` giữ `@Service`;
- `messaging.outbox.JpaOutboxEventSource` giữ `@Component`.

Compile, type uniqueness, constructor reference và unit tests đều pass. Simple class name không đổi nên default Spring bean name không đổi.

Giới hạn: Order Service hiện không có dedicated full `@SpringBootTest` load toàn bộ application context. Hai `@DataJpaTest` là JPA slice và không chứng minh trực tiếp listener, Feign facade, publisher hoặc inbox/outbox bean đều được instantiate cùng lúc. Vì vậy full component scanning/DI được đánh giá **đạt bằng static evidence và partial context**, chưa phải end-to-end context proof.

## 8. Public API và internal API contract

### 8.1. HTTP routing — không đổi

Không có controller file thay đổi từ trước refactor đến trạng thái hiện tại. Do đó:

- `@RequestMapping`, `@GetMapping`, `@PostMapping`, `@PatchMapping`, `@PutMapping`, `@DeleteMapping` không đổi;
- public route `/api/**` không đổi;
- internal route `/internal/orders/{orderId}/payout-lock` không đổi;
- controller method signature không đổi.

### 8.2. Request/response schema — không đổi

Không có file trong `dto/request` hoặc `dto/response` thay đổi. Không phát hiện JSON field/API DTO schema thay đổi.

`GlobalExceptionHandlerTest` và các service tests pass. Tuy nhiên không có OpenAPI snapshot hoặc consumer contract test để so sánh generated specification trước/sau; HTTP contract được xác nhận bằng unchanged source và test hiện có.

## 9. Event contract và serialization

### 9.1. Contract source — đạt

So sánh 8 moved event DTO xác nhận chỉ thay package declaration; riêng `ReviewCreatedEvent` thêm import phục vụ Javadoc. Các yếu tố sau giữ nguyên:

- record component name, type và order;
- nested record;
- `SOURCE_VERSION`;
- routing-key constant tại `RabbitConfig`;
- listener method parameter semantics;
- envelope structure.

Không có old event FQCN còn sót trong `api/**/src/main` hoặc `src/test`.

### 9.2. Serialization test hiện có — đạt một phần

`OutboxServiceImplTest` pass và kiểm tra `ReviewCreatedEvent` được serialize vào v1 `EventEnvelope`, gồm:

- `eventId`;
- `schemaVersion`;
- `eventType`/routing key;
- `sourceService`;
- aggregate metadata;
- `sourceVersion`;
- `occurredAt`;
- các field chính của payload và explicit `null` field.

`ChatServiceImplTest` xác nhận outbound `ChatEvent` type/routing behavior tại publisher collaborator boundary.

### 9.3. Giới hạn event verification

Chưa có dedicated golden serialization/deserialization test cho:

- ba inbound event DTO qua `Jackson2JsonMessageConverter`;
- `OrderEvent`, `DisputeEvent`, `OrderActivityEvent` và `ChatEvent` JSON đầy đủ;
- Rabbit listener binding/queue startup trong full application context;
- external producer có gửi `__TypeId__` chứa Java FQCN cũ hay không.

`RabbitConfig` ghi nhận listener parameter type quyết định target class, nhưng runtime interoperability với external producer chưa được chứng minh bằng Rabbit integration test. Đây là rủi ro còn lại, không phải test failure hiện tại.

## 10. Architecture compliance

Kết quả Phase 11 được xác nhận lại trong full verify:

- Order Service `ArchitectureTest`: 6/6 pass;
- không có package cycle;
- controller không phụ thuộc repository/entity;
- DTO không phụ thuộc entity;
- repository không phụ thuộc upper layer;
- service không phụ thuộc controller.

Trạng thái tổng thể vẫn là **PARTIALLY_COMPLIANT** vì 10 type chưa đạt TO-BE. Shared ArchUnit rules hiện tại không kiểm đầy đủ class placement, listener/scheduler/client/storage direction; đề xuất Order-specific rules đã được ghi trong Phase 11 nhưng chưa được thêm vì chưa có phê duyệt.

## 11. Sai lệch và vấn đề ngoài phạm vi

### 11.1. Migration chưa hoàn tất

Sai lệch chính so với acceptance criteria của Migration Plan là chỉ 16/26 type move hoàn thành. Không thể tuyên bố Target Package Design đã được triển khai đầy đủ.

### 11.2. Dependency sequencing cần điều chỉnh

Trước khi chuyển `InboxService`/`OutboxService` sang `messaging.inbox/outbox`, phải chuyển `CheckoutExpiryJob` từ root `messaging` sang `scheduler`. Nếu không, `service -> messaging` mới sẽ kết hợp với `messaging.CheckoutExpiryJob -> service` thành package cycle.

Thứ tự an toàn:

1. B05 scheduler;
2. B04 technical interface;
3. B06 publisher;
4. B03/B08/B09 theo các batch độc lập và verification tương ứng.

### 11.3. Thay đổi ngoài Order Service trong commit nền

Commit `d7ec96f` chứa thay đổi tại `web/package-lock.json`:

- 15 dòng thêm, 65 dòng xóa;
- chủ yếu là lockfile metadata `peer`/`libc`;
- `web/package.json` không đổi.

File này nằm ngoài phạm vi Order Service và không được Phase 12 sửa hoặc hoàn tác. Cần tách khỏi architecture-refactor change set hoặc có giải trình/verification riêng trước khi chấp thuận commit như một atomic Order Service refactor.

Commit cũng thêm `docs/architecture/ARCHITECTURE_CONTEXT.md` ngoài thư mục `docs/architecture/order`; đây là documentation change, không ảnh hưởng runtime nhưng nên được review về scope.

## 12. Rủi ro còn lại và nội dung chưa thể kiểm chứng

| Rủi ro/giới hạn | Mức độ | Trạng thái |
|---|---|---|
| 10 type chưa đạt TO-BE | Cao đối với completion, thấp đối với behavior hiện tại | Cần hoàn tất migration |
| Move B04/B06 sai thứ tự tạo cycle | Cao | Phải move scheduler trước và chạy ArchUnit mỗi batch |
| Không có full `@SpringBootTest` cho toàn bộ DI graph | Trung bình | Static/compile/JPA slice pass; full context chưa chứng minh |
| Không có Rabbit serialization/deserialization integration test | Trung bình | Source-equivalence và partial serialization test pass |
| External producer dùng Java `__TypeId__` cũ | Trung bình | Chưa kiểm chứng cross-service/runtime broker |
| Không có OpenAPI snapshot/consumer contract test | Thấp–trung bình | Controller và request/response DTO source không đổi |
| `web/package-lock.json` ngoài phạm vi nằm trong commit nền | Trung bình về change isolation | Cần tách hoặc giải trình riêng |
| Error Prone/Javadoc/Mockito warning baseline | Thấp | Không làm fail build; không sửa trong phase này |
| Phase 10–12 chưa commit | Quy trình | Không tự commit theo yêu cầu |

## 13. Đề xuất chấp thuận

### 13.1. Phần có thể chấp thuận

Chấp thuận kỹ thuật cho 16 package move đã thực hiện vì:

- 16/16 source-equivalence check đạt;
- compile và verify đạt;
- 227 test pass, 0 skip;
- JPA/Flyway/Testcontainers đạt;
- ArchUnit đạt;
- không phát hiện thay đổi business logic, API schema, event field, database schema hoặc Maven dependency trong Order Service.

### 13.2. Phần chưa thể chấp thuận

Chưa chấp thuận tuyên bố **“Order Service package standardization completed”** vì:

1. còn 10/26 planned type move;
2. Architecture Compliance vẫn `PARTIALLY_COMPLIANT`;
3. full Spring context và Rabbit interoperability chưa có dedicated proof;
4. commit nền chứa `web/package-lock.json` ngoài phạm vi.

### 13.3. Điều kiện để final acceptance

1. Senior Solution Architect phê duyệt và thực hiện sequencing B05 → B04 → B06;
2. hoàn tất B03 entity, B08 support và B09 storage;
3. chạy compile/test/verify và ArchUnit sau từng batch;
4. bổ sung Order-specific ArchUnit rules nếu được phê duyệt;
5. cân nhắc full `@SpringBootTest` context smoke và Rabbit contract test trong phase/test scope riêng;
6. tách hoặc giải trình `web/package-lock.json`;
7. chạy lại Phase 12 trên working tree cuối cùng.

## 14. Trạng thái cuối

**CHƯA CHẤP THUẬN HOÀN THÀNH TOÀN BỘ REFACTOR**.

Behavior-preservation của các batch đã triển khai được kiểm chứng đạt. Lý do chưa chấp thuận là migration chưa hoàn tất và còn giới hạn verification/độ tinh khiết change set; không phải do compile hoặc test failure.
