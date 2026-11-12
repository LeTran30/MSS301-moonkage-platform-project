# PHASE 10 — CHUẨN HÓA CÁC THÀNH PHẦN HỖ TRỢ

> Phạm vi: `api/order-service`  
> Ngày thực hiện: 12/11/2026 (Asia/Saigon)  
> Trạng thái: **PARTIALLY_COMPLETED**

## 1. Kết quả tổng quan

Phase 10 đã di chuyển 11 type thuộc các batch độc lập và đáp ứng dependency rule hiện tại:

- 3 inbound event DTO thuộc B01;
- 5 outbound event DTO thuộc B02;
- 2 inbound Rabbit consumer thuộc B05-HOLD đã được phê duyệt target hiệu chỉnh;
- 1 client facade thuộc B07.

Hai publisher thuộc B06 chưa được di chuyển vì trạng thái package sau Phase 09 vẫn làm phát sinh cycle `service ↔ messaging` nếu thực hiện publisher-only. Không di chuyển `InboxService` hoặc `OutboxService` trong Phase 10 vì đây là interface migration ngoài phạm vi phase.

Không thay đổi business logic, API DTO schema, JSON field, routing key, event payload, database schema, dependency hoặc configuration key.

## 2. Trạng thái đầu vào

- Working tree sạch tại thời điểm bắt đầu Phase 10.
- Commit đầu vào: `d7ec96f` — `refactor(order-service): move technical repositories and messaging implementations`.
- Phase 08/09 đã đưa repository và technical implementation vào các package `repository.inbox`, `repository.outbox`, `messaging.inbox` và `messaging.outbox`.
- `InboxService` và `OutboxService` vẫn thuộc `com.moonkage.order.service` theo báo cáo Phase 08/09.
- Target `com.moonkage.order.listener` đã được tiếp nhận chính thức tại Phase 07 để tránh cycle do target cũ `messaging.listener`.

## 3. Mapping đã thực hiện

| Batch | Type | From | To | Kết quả |
|---|---|---|---|---|
| B01 | `PaymentFailedEvent` | `com.moonkage.order.dto.event` | `com.moonkage.order.dto.event.inbound` | Đã di chuyển |
| B01 | `PaymentSucceededEvent` | `com.moonkage.order.dto.event` | `com.moonkage.order.dto.event.inbound` | Đã di chuyển |
| B01 | `QuoteAcceptedEvent` | `com.moonkage.order.dto.event` | `com.moonkage.order.dto.event.inbound` | Đã di chuyển |
| B02 | `ChatEvent` | `com.moonkage.order.dto.event` | `com.moonkage.order.dto.event.outbound` | Đã di chuyển |
| B02 | `DisputeEvent` | `com.moonkage.order.dto.event` | `com.moonkage.order.dto.event.outbound` | Đã di chuyển |
| B02 | `OrderActivityEvent` | `com.moonkage.order.dto.event` | `com.moonkage.order.dto.event.outbound` | Đã di chuyển |
| B02 | `OrderEvent` | `com.moonkage.order.dto.event` | `com.moonkage.order.dto.event.outbound` | Đã di chuyển |
| B02 | `ReviewCreatedEvent` | `com.moonkage.order.dto.event` | `com.moonkage.order.dto.event.outbound` | Đã di chuyển |
| B05-HOLD | `PaymentEventListener` | `com.moonkage.order.messaging` | `com.moonkage.order.listener` | Đã di chuyển theo target hiệu chỉnh được phê duyệt |
| B05-HOLD | `QuoteAcceptedListener` | `com.moonkage.order.messaging` | `com.moonkage.order.listener` | Đã di chuyển theo target hiệu chỉnh được phê duyệt |
| B07 | `VendorDirectory` | `com.moonkage.order.service` | `com.moonkage.order.client.facade` | Đã di chuyển |

Các thay đổi trên chỉ gồm move file, cập nhật `package declaration` và cập nhật import/reference. Simple class name, method signature, annotation, constant và method body được giữ nguyên.

## 4. Kiểm tra theo nhóm trách nhiệm

### 4.1. DTO

- Inbound và outbound event DTO đã được tách theo direction như Migration Plan.
- `EventEnvelope` vẫn ở `com.moonkage.order.dto.event` vì là envelope dùng chung.
- Request/response DTO và client DTO đang đúng package đã duyệt nên không di chuyển.
- Việc đổi Java FQCN không làm thay đổi record component, JSON field hoặc event payload.

### 4.2. Mapper, Validator và Utility

Không phát hiện production type/package riêng có tên hoặc trách nhiệm `Mapper`, `Validator`, `Util` hay `Utility` trong Order Service. Không tạo package hoặc abstraction giả.

### 4.3. Feign Client và client facade

Năm interface có `@FeignClient` tiếp tục được giữ tại `com.moonkage.order.client`:

- `CatalogClient`;
- `IdentityClient`;
- `PaymentClient`;
- `QuotationClient`;
- `VendorClient`.

`VendorDirectory` là facade concrete quanh `VendorClient`, vì vậy được di chuyển sang `com.moonkage.order.client.facade`. `@Component`, constructor injection và exception behavior được giữ nguyên.

### 4.4. Event Consumer

`PaymentEventListener` và `QuoteAcceptedListener` được di chuyển sang root package `com.moonkage.order.listener` theo hiệu chỉnh tại Phase 07. Các nội dung sau được giữ nguyên:

- `@Component` và `@RabbitListener`;
- queue constant và routing configuration tham chiếu từ `RabbitConfig`;
- listener method signature và method body;
- application service dependency.

Package mới vẫn là descendant của `com.moonkage.order`, nên nằm trong default component scanning của `OrderServiceApplication`.

### 4.5. Event Publisher

`ChatSignalPublisher` và `OrderEventPublisher` chỉ được cập nhật import sang outbound event DTO mới; chưa di chuyển khỏi `service`.

Dependency graph hiện tại:

```text
messaging.inbox.InboxServiceImpl   -> service.InboxService
messaging.outbox.OutboxServiceImpl -> service.OutboxService
service.impl                       -> service.ChatSignalPublisher / OrderEventPublisher
```

Nếu chỉ di chuyển publisher theo B06:

```text
service.impl -> messaging.publisher
messaging.inbox/outbox -> service
```

Kết quả là top-level cycle:

```text
service -> messaging -> service
```

Vì vậy B06 bị giữ lại. `NO_PACKAGE_CYCLES` không bị sửa hoặc nới lỏng.

### 4.6. Configuration và Exception

Các package này đã đúng trách nhiệm và được giữ nguyên:

- Configuration: `DotEnvConfig`, `LocaleConfig`, `OpenApiConfig`, `OrderFileProperties`, `OrderProperties`, `RabbitConfig`;
- Exception: `AppException`, `ErrorCode`, `GlobalExceptionHandler`.

Không thay đổi property prefix, bean, handler mapping hoặc error contract.

## 5. File source/test bị ảnh hưởng

### 5.1. Own file được di chuyển

| Nhóm | File logic |
|---|---|
| Inbound event DTO | `PaymentFailedEvent.java`, `PaymentSucceededEvent.java`, `QuoteAcceptedEvent.java` |
| Outbound event DTO | `ChatEvent.java`, `DisputeEvent.java`, `OrderActivityEvent.java`, `OrderEvent.java`, `ReviewCreatedEvent.java` |
| Consumer | `PaymentEventListener.java`, `QuoteAcceptedListener.java` |
| Client facade | `VendorDirectory.java` |

### 5.2. Production reference được cập nhật

- `service/ChatSignalPublisher.java`;
- `service/OrderAccess.java`;
- `service/OrderEventPublisher.java`;
- `service/OrderService.java`;
- `service/impl/ChatServiceImpl.java`;
- `service/impl/DisputeServiceImpl.java`;
- `service/impl/OrderDocumentServiceImpl.java`;
- `service/impl/OrderServiceImpl.java`;
- `service/impl/OrderStatsServiceImpl.java`;
- `service/impl/ReviewServiceImpl.java`.

### 5.3. Test reference được cập nhật

- `ChatServiceImplTest.java`;
- `CustomOrderAndDisputeTest.java`;
- `DisputeServiceImplTest.java`;
- `OrderServiceImplTest.java`;
- `OrderStatsServiceImplTest.java`;
- `OutboxServiceImplTest.java`.

Không thay đổi test assertion hoặc dùng test edit để che giấu lỗi.

## 6. Verification theo batch

Mỗi Maven `test` command đều thực hiện compile và chạy Spotless/Checkstyle trước test.

| Batch | Command chính | Kết quả Order Service |
|---|---|---|
| B01 | `mvn -pl order-service -am '-Dtest=OrderServiceImplTest,CustomOrderAndDisputeTest,ArchitectureTest' '-Dsurefire.failIfNoSpecifiedTests=false' test` | 40 test pass, 0 fail/error/skip |
| B02 | `mvn -pl order-service -am '-Dtest=ChatServiceImplTest,OutboxServiceImplTest,CustomOrderAndDisputeTest,DisputeServiceImplTest,ArchitectureTest' '-Dsurefire.failIfNoSpecifiedTests=false' test` | 53 test pass, 0 fail/error/skip |
| B05-HOLD | `mvn -pl order-service -am '-Dtest=CheckoutServiceImplTest,OrderServiceImplTest,CustomOrderAndDisputeTest,ArchitectureTest' '-Dsurefire.failIfNoSpecifiedTests=false' test` | 45 test pass, 0 fail/error/skip |
| B07 | `mvn -pl order-service -am '-Dtest=ChatServiceImplTest,CustomOrderAndDisputeTest,DisputeServiceImplTest,OrderServiceImplTest,OrderStatsServiceImplTest,ArchitectureTest' '-Dsurefire.failIfNoSpecifiedTests=false' test` | 69 test pass, 0 fail/error/skip |

Lần kiểm tra đầu của B07 dừng tại Spotless do thứ tự ba import mới. Chỉ ba import đó được sắp xếp lại; không chạy formatter diện rộng. Lần chạy lại đạt `BUILD SUCCESS`.

### 6.1. Full reactor test cuối cùng

Command chạy từ thư mục `api`:

```text
mvn -pl order-service -am test
```

| Module | Total | Failure | Error | Skip |
|---|---:|---:|---:|---:|
| `common-storage` | 32 | 0 | 0 | 0 |
| `common-observability` | 32 | 0 | 0 | 0 |
| `common-api` | 38 | 0 | 0 | 0 |
| `common-outbox` | 20 | 0 | 0 | 0 |
| `order-service` | 105 | 0 | 0 | 0 |
| **Tổng reactor** | **227** | **0** | **0** | **0** |

Kết quả cuối: **BUILD SUCCESS**.

- Order Service `ArchitectureTest`: 6/6 pass, gồm `NO_PACKAGE_CYCLES`;
- Spotless: pass;
- Checkstyle: 0 violation;
- JPA/Testcontainers integration tests: pass;
- `git diff --check`: pass.

Các Error Prone, Mockito dynamic-agent và Javadoc warning baseline vẫn xuất hiện; không phát hiện warning mới làm fail quality gate và không sửa ngoài phạm vi Phase 10.

## 7. Thay đổi còn tồn đọng

| Batch/nhóm | Trạng thái | Lý do |
|---|---|---|
| B06 — `ChatSignalPublisher` | Blocked | Publisher-only move tạo cycle `service ↔ messaging` |
| B06 — `OrderEventPublisher` | Blocked | Cùng dependency cycle; vẫn phụ thuộc `OutboxService` tại `service` |
| `InboxService`, `OutboxService` | Chưa thực hiện | Thuộc interface migration, không nằm trong phạm vi Phase 10 |
| B05 — `CheckoutExpiryJob` | Chưa thực hiện | Scheduler không thuộc danh sách thành phần được giao trong Phase 10 |
| B08 — application support | Chưa thực hiện | `OrderAccess`, `OrderProgress` không thuộc nhóm Phase 10 được giao |
| B09 — storage | Chưa thực hiện | `OrderFileService` không thuộc nhóm Phase 10 được giao |

Điều kiện kỹ thuật để mở B06 trong một phase được phê duyệt tiếp theo:

1. di chuyển `InboxService` và `OutboxService` vào `messaging.inbox/outbox` sau khi hai listener đã rời top-level `messaging`;
2. chạy ArchUnit để xác nhận dependency còn một chiều `service -> messaging`;
3. sau đó mới di chuyển publisher sang `messaging.publisher`.

## 8. Rủi ro còn lại

1. Java FQCN của 8 event DTO đã đổi. JSON shape được giữ nguyên và full test pass, nhưng hiện không có dedicated Rabbit serialization/deserialization smoke test cho hai listener.
2. Hai listener được phát hiện theo component-scan boundary và compile/reference check; test suite chưa có dedicated full `@SpringBootTest` assertion cho listener bean/queue binding.
3. B06 còn blocked nên cây package chưa đạt TO-BE cuối cùng cho outbound publisher.
4. `InboxService` và `OutboxService` còn ở `service`, duy trì dependency `messaging -> service` cho đến khi interface batch riêng được phê duyệt.
5. Baseline warning từ Error Prone/Javadoc và Mockito dynamic agent vẫn tồn tại, không phải lỗi phát sinh từ package migration.

## 9. Kết luận

Phase 10 ở trạng thái **PARTIALLY_COMPLETED**:

- 11 type đã được di chuyển đúng các batch độc lập và target được phê duyệt;
- DTO/event contract, annotation, routing key, method signature và business logic được giữ nguyên;
- configuration, exception và Feign client đã được kiểm tra và giữ nguyên vì package hiện tại phù hợp;
- không tạo Mapper, Validator hoặc Utility không có trách nhiệm thực tế;
- full reactor build/test đạt 227/227;
- B06 chưa thực hiện để tránh dependency cycle và chờ Senior Solution Architect phê duyệt prerequisite interface migration.

Không thực hiện công việc ngoài Phase 10.
