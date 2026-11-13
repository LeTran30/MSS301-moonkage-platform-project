# Phase 05 — Kế hoạch di chuyển class của Order Service

> Phạm vi: `api/order-service`  
> Đầu vào: `01_PACKAGE_INVENTORY.md` đến `04_TARGET_PACKAGE_DESIGN.md`  
> Trạng thái: **kế hoạch chờ Solution Architect phê duyệt**  
> Ngày lập kế hoạch: 12/11/2026  
> Ngoài phạm vi: thực hiện move/rename, sửa source/test/configuration/dependency, thay đổi contract/schema.

## 1. Tóm tắt phạm vi migration

| Phân loại | Số file Java | Kết luận Phase 05 |
|---|---:|---|
| **Di chuyển** | 24 | Có From/To rõ và được chia thành các batch nhỏ |
| **Giữ nguyên package** | 128 | Không đổi package trong migration này |
| **Cần xem xét thêm trước khi move** | 2 | `PaymentEventListener`, `QuoteAcceptedListener`: target Phase 04 tạo package cycle theo ArchUnit hiện tại |
| **Tổng production inventory** | **154** | Khớp Phase 01 và Phase 04 |

Kế hoạch chỉ thực hiện package/import move sau khi được phê duyệt. Không thay đổi method, field, annotation semantics, business logic, API/event payload, routing key, database table hoặc configuration key.

## 2. Quy ước file impact

Trong các bảng dưới đây:

- đường dẫn production mặc định bắt đầu tại `api/order-service/src/main/java/com/moonkage/order/`;
- đường dẫn test mặc định bắt đầu tại `api/order-service/src/test/java/com/moonkage/order/`;
- “own file” là file khai báo class cần đổi package/path;
- danh sách file liên quan được lấy bằng reference search trên cả `src/main` và `src/test`;
- import cùng package hiện không xuất hiện trong một số test, nên sau move phải **thêm import**, không chỉ sửa import cũ.

## 3. Danh sách đầy đủ class cần di chuyển

### 3.1. Event contract — Batch B01 và B02

| Class | From | To | Lý do | Rủi ro | File liên quan | Batch |
|---|---|---|---|---|---|---|
| `PaymentFailedEvent` | `com.moonkage.order.dto.event` | `com.moonkage.order.dto.event.inbound` | Phân biệt incoming payment contract | Jackson/Rabbit listener phải resolve đúng parameter type; không đổi JSON | Own file; `messaging/PaymentEventListener.java` | `B01` |
| `PaymentSucceededEvent` | `com.moonkage.order.dto.event` | `com.moonkage.order.dto.event.inbound` | Phân biệt incoming payment contract | Như trên; cả CHECKOUT và REMAINDER route phải compile | Own file; `messaging/PaymentEventListener.java` | `B01` |
| `QuoteAcceptedEvent` | `com.moonkage.order.dto.event` | `com.moonkage.order.dto.event.inbound` | Incoming quotation integration contract | Nhiều nested record/import; service interface và test fixture bị ảnh hưởng | Own file; `messaging/QuoteAcceptedListener.java`; `service/OrderService.java`; `service/impl/OrderServiceImpl.java`; `service/OrderServiceImplTest.java`; `service/CustomOrderAndDisputeTest.java` | `B01` |
| `ChatEvent` | `com.moonkage.order.dto.event` | `com.moonkage.order.dto.event.outbound` | Outgoing ephemeral chat signal | Vẫn phụ thuộc `ChatMessageResponse`; Mockito `ArgumentCaptor` test cần import mới | Own file; `service/ChatSignalPublisher.java`; `service/impl/ChatServiceImpl.java`; `service/ChatServiceImplTest.java` | `B02` |
| `DisputeEvent` | `com.moonkage.order.dto.event` | `com.moonkage.order.dto.event.outbound` | Outgoing durable dispute event | Payload JSON/routing key không được đổi | Own file; `service/impl/DisputeServiceImpl.java` | `B02` |
| `OrderActivityEvent` | `com.moonkage.order.dto.event` | `com.moonkage.order.dto.event.outbound` | Outgoing mockup/invoice activity event | Payload JSON/routing key không được đổi | Own file; `service/impl/OrderDocumentServiceImpl.java` | `B02` |
| `OrderEvent` | `com.moonkage.order.dto.event` | `com.moonkage.order.dto.event.outbound` | Outgoing order snapshot/status event | Publisher import và serialization phải giữ nguyên | Own file; `service/OrderEventPublisher.java` | `B02` |
| `ReviewCreatedEvent` | `com.moonkage.order.dto.event` | `com.moonkage.order.dto.event.outbound` | Outgoing review state event | `SOURCE_VERSION` và envelope payload test phải giữ nguyên | Own file; `service/impl/ReviewServiceImpl.java`; `service/OutboxServiceImplTest.java` | `B02` |

### 3.2. Technical persistence — Batch B03

| Class | From | To | Lý do | Rủi ro | File liên quan | Batch |
|---|---|---|---|---|---|---|
| `ProcessedEvent` | `com.moonkage.order.entity` | `com.moonkage.order.entity.inbox` | Tách inbox technical model khỏi business entity | JPA entity scan; repository generic type; table mapping phải giữ nguyên | Own file; `repository/ProcessedEventRepository.java`; `service/impl/InboxServiceImpl.java` | `B03` |
| `OutboxEvent` | `com.moonkage.order.entity` | `com.moonkage.order.entity.outbox` | Tách outbox technical model khỏi business entity | JPA scan; relay mutation; test captor/import; table mapping phải giữ nguyên | Own file; `repository/OutboxEventRepository.java`; `messaging/JpaOutboxEventSource.java`; `service/impl/OutboxServiceImpl.java`; `service/OutboxServiceImplTest.java` | `B03` |
| `ProcessedEventRepository` | `com.moonkage.order.repository` | `com.moonkage.order.repository.inbox` | Tách technical inbox data access | Spring Data repository scan và generic entity import | Own file; `service/impl/InboxServiceImpl.java` | `B03` |
| `OutboxEventRepository` | `com.moonkage.order.repository` | `com.moonkage.order.repository.outbox` | Tách technical outbox data access | Spring Data scan; relay và unit test imports | Own file; `messaging/JpaOutboxEventSource.java`; `service/impl/OutboxServiceImpl.java`; `service/OutboxServiceImplTest.java` | `B03` |

### 3.3. Inbox/outbox technical service — Batch B04

| Class | From | To | Lý do | Rủi ro | File liên quan | Batch |
|---|---|---|---|---|---|---|
| `InboxService` | `com.moonkage.order.service` | `com.moonkage.order.messaging.inbox` | Technical idempotency contract, không phải business application service | 4 test cùng package hiện dùng simple name; DI injection type phải đồng nhất | Own file; `service/impl/InboxServiceImpl.java`; `service/impl/CheckoutServiceImpl.java`; `service/impl/OrderServiceImpl.java`; `service/CheckoutMoneyTest.java`; `service/CheckoutServiceImplTest.java`; `service/CustomOrderAndDisputeTest.java`; `service/OrderServiceImplTest.java` | `B04` |
| `InboxServiceImpl` | `com.moonkage.order.service.impl` | `com.moonkage.order.messaging.inbox` | JPA implementation của inbox technical service | `@Service` discovery; `@Transactional(MANDATORY)` semantics; dependency vào B03 | Own file; references qua interface ở các file của `InboxService` | `B04` |
| `OutboxService` | `com.moonkage.order.service` | `com.moonkage.order.messaging.outbox` | Transactional outbox technical contract | Nhiều application service/publisher/test đang dùng simple name/import cũ | Own file; `service/impl/OutboxServiceImpl.java`; `service/OrderEventPublisher.java`; `service/impl/DisputeServiceImpl.java`; `service/impl/OrderDocumentServiceImpl.java`; `service/impl/ReviewServiceImpl.java`; `service/CustomOrderAndDisputeTest.java`; `service/DisputeServiceImplTest.java` | `B04` |
| `OutboxServiceImpl` | `com.moonkage.order.service.impl` | `com.moonkage.order.messaging.outbox` | Jackson/JPA/trace implementation của outbox | `@Service`, `MANDATORY` transaction, `@Value sourceService`, reflection test field | Own file; `service/OutboxServiceImplTest.java`; dependencies từ B03 | `B04` |
| `JpaOutboxEventSource` | `com.moonkage.order.messaging` | `com.moonkage.order.messaging.outbox` | Shared relay JPA adapter thuộc outbox | Package-private class; component discovery và `OutboxEventSource` injection phải được kiểm tra | Own file; imports `OutboxEvent`/`OutboxEventRepository` từ B03; không có direct test/reference khác | `B04` |

### 3.4. Inbound listener và scheduler — Batch B05-HOLD/B05

| Class | From | To | Lý do | Rủi ro | File liên quan | Batch |
|---|---|---|---|---|---|---|
| `PaymentEventListener` | `com.moonkage.order.messaging` | **Candidate:** `com.moonkage.order.listener` | Tách inbound edge khỏi outbound `messaging` để tránh top-level package cycle | **Cần Architect phê duyệt target khác Phase 04**; nếu dùng `messaging.listener`, ArchUnit thấy `service ↔ messaging`; vẫn phải kiểm tra `@RabbitListener` và B01 imports | Own file; `PaymentFailedEvent`; `PaymentSucceededEvent`; `CheckoutService`; `OrderService`; shared `config/archunit/ArchitectureTest.java` | `B05-HOLD` |
| `QuoteAcceptedListener` | `com.moonkage.order.messaging` | **Candidate:** `com.moonkage.order.listener` | Tách inbound edge khỏi outbound `messaging` để tránh top-level package cycle | **Cần Architect phê duyệt target khác Phase 04**; `@RabbitListener` discovery và B01 event import | Own file; `QuoteAcceptedEvent`; `OrderService`; shared `config/archunit/ArchitectureTest.java` | `B05-HOLD` |
| `CheckoutExpiryJob` | `com.moonkage.order.messaging` | `com.moonkage.order.scheduler` | Time-based trigger, không phải messaging component | `@Scheduled` discovery; fixed-delay property phải giữ nguyên | Own file; `CheckoutService` | `B05` |

### 3.5. Publisher — Batch B06

| Class | From | To | Lý do | Rủi ro | File liên quan | Batch |
|---|---|---|---|---|---|---|
| `ChatSignalPublisher` | `com.moonkage.order.service` | `com.moonkage.order.messaging.publisher` | Direct best-effort Rabbit publisher, không phải application service | `@Component` discovery; transaction after-commit; B02 event import; test mock/import | Own file; `service/impl/ChatServiceImpl.java`; `service/ChatServiceImplTest.java` | `B06` |
| `OrderEventPublisher` | `com.moonkage.order.service` | `com.moonkage.order.messaging.publisher` | Event composer/publisher dùng outbox | `@Component` discovery; B02 `OrderEvent`; B04 `OutboxService`; 4 tests cần import | Own file; `service/impl/CheckoutServiceImpl.java`; `service/impl/OrderDocumentServiceImpl.java`; `service/impl/OrderServiceImpl.java`; `service/CheckoutMoneyTest.java`; `service/CheckoutServiceImplTest.java`; `service/CustomOrderAndDisputeTest.java`; `service/OrderServiceImplTest.java` | `B06` |

### 3.6. Client facade — Batch B07

| Class | From | To | Lý do | Rủi ro | File liên quan | Batch |
|---|---|---|---|---|---|---|
| `VendorDirectory` | `com.moonkage.order.service` | `com.moonkage.order.client.facade` | External vendor lookup facade quanh `VendorClient` | `@Component` discovery; 5 test đang dùng simple name; B08 `OrderAccess` dependency | Own file; `service/OrderAccess.java`; `service/impl/ChatServiceImpl.java`; `service/impl/OrderServiceImpl.java`; `service/impl/OrderStatsServiceImpl.java`; `service/ChatServiceImplTest.java`; `service/CustomOrderAndDisputeTest.java`; `service/DisputeServiceImplTest.java`; `service/OrderServiceImplTest.java`; `service/OrderStatsServiceImplTest.java` | `B07` |

### 3.7. Application support — Batch B08

| Class | From | To | Lý do | Rủi ro | File liên quan | Batch |
|---|---|---|---|---|---|---|
| `OrderAccess` | `com.moonkage.order.service` | `com.moonkage.order.service.support` | Concrete access policy/helper, không phải service interface | `@Component` discovery; constructor in tests; dependency vào B07 import mới | Own file; `service/impl/DisputeServiceImpl.java`; `service/impl/OrderDocumentServiceImpl.java`; `service/impl/ReviewServiceImpl.java`; `service/CustomOrderAndDisputeTest.java`; `service/DisputeServiceImplTest.java` | `B08` |
| `OrderProgress` | `com.moonkage.order.service` | `com.moonkage.order.service.support` | Shared status/progress collaborator | `@Component` discovery; no direct test; import tại document workflow | Own file; `service/impl/OrderDocumentServiceImpl.java` | `B08` |

### 3.8. Storage — Batch B09

| Class | From | To | Lý do | Rủi ro | File liên quan | Batch |
|---|---|---|---|---|---|---|
| `OrderFileService` | `com.moonkage.order.service` | `com.moonkage.order.storage` | Object-storage facade, không phải application service | `@Component`/properties discovery; 4 service implementation và 4 test cần import | Own file; `service/impl/ChatServiceImpl.java`; `service/impl/DisputeServiceImpl.java`; `service/impl/OrderDocumentServiceImpl.java`; `service/impl/OrderServiceImpl.java`; `service/ChatServiceImplTest.java`; `service/CustomOrderAndDisputeTest.java`; `service/DisputeServiceImplTest.java`; `service/OrderServiceImplTest.java` | `B09` |

## 4. Class giữ nguyên package

| Nhóm | Số file | Package giữ nguyên | Ghi chú |
|---|---:|---|---|
| Bootstrap | 1 | `com.moonkage.order` | `OrderServiceApplication` |
| Feign client và client DTO | 14 | `client`, `client.dto` | Gồm `QuotationClient` chờ xác minh usage; không move/xóa |
| Configuration | 6 | `config` | Không đổi property prefix/bean config |
| Controller | 9 | `controller` | Tiếp tục phụ thuộc service interface |
| Request/response/shared DTO | 32 | `dto`, `dto.request`, `dto.response`, `dto.event` | Gồm `package-info.java`, 14 request, 16 response và `EventEnvelope` |
| Business entity/value object | 16 | `entity` | Gồm `Voucher` chờ xác minh usage; loại trừ 2 technical entity ở B03 |
| Enum | 10 | `enums` | Không đổi |
| Exception/error boundary | 3 | `exception` | Không đổi |
| Business repository | 16 | `repository` | Gồm `VoucherRepository`; loại trừ 2 technical repository ở B03 |
| Security/web caller context | 5 | `security` | Không đổi |
| Business service interface/implementation | 16 | `service`, `service.impl` | 8 interface + 8 implementation; không refactor logic |
| **Tổng** | **128** |  | Khớp tổng inventory sau khi tách 26 candidate move |

Không tạo danh sách từng file giữ nguyên lần nữa vì Phase 01 đã có class inventory đầy đủ. Bảng trên là reconciliation bắt buộc để bảo đảm không class nào bị bỏ khỏi kế hoạch.

## 5. Class và quyết định cần xem xét thêm

### 5.1. Hai class chưa được phép move theo target Phase 04

| Class | Target Phase 04 | Vấn đề phát hiện trong Phase 05 | Candidate | Quyết định cần có |
|---|---|---|---|---|
| `PaymentEventListener` | `messaging.listener` | Shared ArchUnit kiểm tra cycle theo top-level package; service implementation phụ thuộc `messaging.*`, listener phụ thuộc `service` | `com.moonkage.order.listener` | Architect phê duyệt target mới hoặc đưa ra boundary khác không tạo cycle |
| `QuoteAcceptedListener` | `messaging.listener` | Cùng cycle `service ↔ messaging` | `com.moonkage.order.listener` | Như trên |

Không khuyến nghị sửa/relax shared `NO_PACKAGE_CYCLES` chỉ để giữ target `messaging.listener`. Rule hiện áp dụng cho mọi module và đang bảo vệ dependency direction.

### 5.2. Decision item không thuộc package move

| Item | Class liên quan | Kết luận kế hoạch |
|---|---|---|
| Rename storage component | `OrderFileService` → candidate `OrderFileStorage` | Để phase sau; move package trước, rename riêng nếu được duyệt |
| Rename technical implementation | `InboxServiceImpl`, `OutboxServiceImpl` | Không bắt buộc; giữ tên trong migration đầu để giảm diff |
| Unused Feign declaration | `QuotationClient` | Giữ nguyên, chờ business ownership confirmation |
| Unused persistence declaration | `Voucher`, `VoucherRepository` | Giữ nguyên, không xóa |
| Event/HTTP DTO coupling | `ChatEvent` dùng `ChatMessageResponse` | Giữ nguyên field/type để không đổi event contract |
| Application-service breadth | `OrderServiceImpl`, `CheckoutServiceImpl` | Không refactor cùng migration; tạo phase riêng nếu được duyệt |
| Progress/access duplication | `OrderProgress`, `OrderAccess`, `OrderServiceImpl` | Package move không hợp nhất logic; xử lý ở refactor phase riêng |

## 6. Phân tích tác động kỹ thuật

### 6.1. Java import và reference

- 26 own file cần cập nhật `package` declaration nếu toàn bộ candidate được phê duyệt.
- Mọi file trong cột **File liên quan** phải cập nhật hoặc bổ sung import.
- Test package `com.moonkage.order.service` hiện truy cập nhiều type bằng simple name vì type cùng package. Sau move phải thêm import rõ cho `InboxService`, `OutboxService`, `OrderEventPublisher`, `VendorDirectory`, `OrderAccess`, `OrderFileService`, `ChatSignalPublisher`.
- Nested type của `QuoteAcceptedEvent` giữ nguyên owner; chỉ outer FQCN đổi.
- Không thay static constant, constructor signature, generic type hoặc method call.
- Sau mỗi batch phải tìm lại old FQCN/package declaration; kết quả mong đợi là 0 ngoài tài liệu lịch sử.

### 6.2. Spring DI và component scanning

| Khu vực | Tác động | Kết luận/checkpoint |
|---|---|---|
| `@Component`/`@Service` moved class | `VendorDirectory`, support, storage, publisher, inbox/outbox, listener/job đổi package | Tất cả target vẫn dưới `com.moonkage.order`; `@SpringBootApplication` mặc định scan được |
| Constructor injection | Injection theo type, không theo FQCN string | Cập nhật import; không đổi constructor/bean count |
| Default bean name | Không rename simple class name trong migration | Bean name mặc định giữ nguyên |
| `JpaOutboxEventSource` | Package-private top-level `@Component` | Giữ package-private; xác nhận shared `OutboxEventSource` inject được trong context |
| `@Value("${spring.application.name}")` | Field của `OutboxServiceImpl` | Package move không ảnh hưởng; `OutboxServiceImplTest` dùng `ReflectionTestUtils` theo field name |
| `@EnableConfigurationProperties` | `OrderFileService` enable `OrderFileProperties` | Giữ annotation/property class/prefix; context smoke phải xác nhận bean |
| `@Scheduled` | `CheckoutExpiryJob` | `@EnableScheduling` tại application root tiếp tục scan descendant package |
| `@RabbitListener` | Hai listener | Target phải nằm dưới root scan; queue constants/method signature giữ nguyên |

Không phát hiện `@ComponentScan` tùy chỉnh hoặc bean lookup bằng FQCN cần sửa.

### 6.3. JPA và Spring Data

- `ProcessedEvent` và `OutboxEvent` vẫn là `@Entity`, table mapping/column/ID không đổi.
- Target `entity.inbox/outbox` vẫn dưới `com.moonkage.order`; Boot entity scan từ application root phải nhận diện.
- Target `repository.inbox/outbox` vẫn dưới application root; Spring Data repository scan phải nhận diện.
- Không phát hiện JPQL dùng FQCN của hai entity; repository dùng derived query/generic entity import.
- Không thay migration SQL, table name hoặc database schema.
- Hai `@DataJpaTest` hiện có bootstrap JPA context nhưng dùng Testcontainers và có thể skip khi Docker không sẵn sàng. Vì vậy compile thành công không thay thế được context/JPA scan checkpoint.

Checkpoint bắt buộc sau B03/B04:

1. application/JPA context tạo được `ProcessedEventRepository`, `OutboxEventRepository`;
2. entity manager nhận cả hai technical entity;
3. `JpaOutboxEventSource` inject đúng repository;
4. `InboxServiceImpl`/`OutboxServiceImpl` giữ `Propagation.MANDATORY`.

### 6.4. Jackson và RabbitMQ

- 8 event record đổi FQCN nhưng không đổi field, nested record, JSON property hay routing key.
- Không phát hiện `@JsonTypeInfo`, `Class.forName`, trusted-package allowlist hoặc string FQCN trong Order Service.
- `RabbitConfig` ghi rõ listener parameter type quyết định target class, không dựa vào publisher `__TypeId__` header.
- Outbox lưu JSON payload string; package name hiện không nằm trong payload do `ObjectMapper.writeValueAsString(event)`.
- Rủi ro còn lại là compile-time listener parameter/import và runtime deserialization; cần listener serialization/deserialization smoke hoặc existing integration coverage nếu có.
- `ReviewCreatedEvent.SOURCE_VERSION` và `EventEnvelope.SCHEMA_VERSION` không được thay đổi.

### 6.5. Reflection

- Không phát hiện reflection theo class/package name trong production/test (`Class.forName`, string FQCN).
- `OutboxServiceImplTest` dùng `ReflectionTestUtils.setField(outbox, "sourceService", ...)`; package move không ảnh hưởng nếu field name giữ nguyên.
- Spring/Mockito/Jackson vẫn dùng reflection nội bộ; compile và context test là checkpoint tương ứng.
- Shared ArchUnit phân loại theo package pattern, nên package move trực tiếp làm thay đổi dependency graph được kiểm tra.

### 6.6. Test impact

| Test | Tác động trực tiếp |
|---|---|
| `ChatServiceImplTest` | B02, B06, B07, B09 |
| `CheckoutMoneyTest` | B04, B06 |
| `CheckoutServiceImplTest` | B04, B06 |
| `CustomOrderAndDisputeTest` | B01, B04, B06, B07, B08, B09 |
| `DisputeServiceImplTest` | B04, B07, B08, B09 |
| `OrderServiceImplTest` | B01, B04, B06, B07, B09 |
| `OrderStatsServiceImplTest` | B07 |
| `OutboxServiceImplTest` | B02, B03, B04 |
| `GlobalExceptionHandlerTest` | Không có import trực tiếp cần đổi |
| `OrderRepositoryIntegrationTest` | Không đổi import; vẫn là JPA context regression checkpoint B03 |
| `OrderStatsRepositoryIntegrationTest` | Không đổi import; vẫn là JPA context regression checkpoint B03 |
| Shared `ArchitectureTest` | Bất kỳ batch nào đổi package; đặc biệt chặn target `messaging.listener` |

Không di chuyển package của test chỉ để khớp package production mới. Test application service có thể giữ tại `com.moonkage.order.service` và import collaborator rõ ràng; chỉ di chuyển test nếu có lý do visibility/ownership riêng được duyệt.

### 6.7. Cross-module impact

- Repo-wide search không phát hiện module khác import FQCN `com.moonkage.order.dto.event`, `service`, `entity`, `repository` hoặc `messaging` của Order Service.
- Payment, quotation, vendor và orchestrator có event record riêng để deserialize cùng JSON contract; package move nội bộ Order Service không yêu cầu sửa source các microservice đó.
- Điều này không loại bỏ runtime contract risk: JSON field/routing key/schema version vẫn phải giữ nguyên và contract test/smoke cần xác nhận.
- Không chỉnh sửa microservice khác trong migration Order Service.

## 7. Batch migration plan

Mỗi batch phải là một thay đổi compile-complete: move own file, cập nhật toàn bộ production/test import, chạy verification tương ứng rồi mới sang batch kế tiếp. Không để source tree ở trạng thái chứa đồng thời old/new class duplicate.

| Thứ tự | Batch | Scope | Tiền điều kiện | Verification tối thiểu | Stop condition |
|---:|---|---|---|---|---|
| 0 | `B00` | Baseline, không move | Architect phê duyệt plan; worktree được ghi nhận; không có source change không rõ owner | Chạy test baseline theo môi trường; ghi rõ test skip/failure hiện hữu | Baseline không xác định được hoặc source đang có thay đổi chồng lấn |
| 1 | `B01` | 3 inbound event record | Phê duyệt event direction | Compile; `OrderServiceImplTest`, `CustomOrderAndDisputeTest`; listener type/import check | JSON field/nested type/routing behavior bị thay đổi |
| 2 | `B02` | 5 outbound event record | B01 ổn định | Compile; `ChatServiceImplTest`, `OutboxServiceImplTest`, review/dispute/document service tests hiện có; serialization assertion | Payload/schema constant thay đổi hoặc consumer shape mismatch |
| 3 | `B03` | 2 technical entity + 2 repository | Event batches độc lập nhưng source đang xanh | Compile; `OutboxServiceImplTest`; JPA context/repository integration test với Docker nếu có | Entity/repository không được scan hoặc schema validation lỗi |
| 4 | `B04` | Inbox/outbox interface, implementation, relay source | B03 hoàn tất | Compile; `OutboxServiceImplTest`; checkout/order/dispute tests; context bean check; ArchUnit | Mất `MANDATORY` semantics, bean duplicate/missing hoặc relay không inject được |
| 5 | `B05` | `CheckoutExpiryJob` → `scheduler` | Không phụ thuộc listener decision | Compile; component/scheduling context check; ArchUnit | Scheduled bean/property không được resolve |
| HOLD | `B05-HOLD` | 2 Rabbit listener | Architect chọn target không tạo cycle; B01 hoàn tất | Compile; application context; listener binding/deserialization smoke; ArchUnit | Target vẫn tạo package cycle hoặc listener bean/queue binding lỗi |
| 6 | `B06` | 2 publisher | B02 và B04 hoàn tất | Compile; `ChatServiceImplTest`, checkout/order tests; verify durable vs best-effort semantics; ArchUnit | Publisher semantics/transaction timing thay đổi |
| 7 | `B07` | `VendorDirectory` → `client.facade` | Target approved | Compile; chat/order/stats/dispute tests; ArchUnit | Feign fallback/NotFound behavior đổi hoặc bean missing |
| 8 | `B08` | `OrderAccess`, `OrderProgress` → `service.support` | B07 hoàn tất vì `OrderAccess` phụ thuộc `VendorDirectory` | Compile; dispute/document/review tests; ArchUnit | Authorization/locking/progress behavior đổi |
| 9 | `B09` | `OrderFileService` → `storage` | Rename tách khỏi batch | Compile; chat/dispute/document/order tests; storage bean/property context check; ArchUnit | File limit/prefix/access semantics hoặc bean binding đổi |
| 10 | `B10` | Full regression, không thêm move | Tất cả batch được chấp nhận | Full Order Service test + shared ArchUnit; Docker-backed JPA test nếu khả dụng; old-package search | Còn old import/FQCN, test fail mới hoặc architecture cycle |

### 7.1. File scope theo batch

#### B01 — Inbound event

- Move 3 event files.
- Update `OrderService`, `OrderServiceImpl`, hai listener.
- Update `OrderServiceImplTest`, `CustomOrderAndDisputeTest`.
- Không thay event record field/nested record.

#### B02 — Outbound event

- Move 5 event files.
- Update `ChatSignalPublisher`, `OrderEventPublisher`, `ChatServiceImpl`, `DisputeServiceImpl`, `OrderDocumentServiceImpl`, `ReviewServiceImpl`.
- Update `ChatServiceImplTest`, `OutboxServiceImplTest`.
- Không thay `EventEnvelope`, routing key hoặc schema constant.

#### B03 — Technical persistence

- Move `ProcessedEvent`, `OutboxEvent` và hai repository.
- Update `InboxServiceImpl`, `OutboxServiceImpl`, `JpaOutboxEventSource`, `OutboxServiceImplTest`.
- Không sửa entity annotation/table/column hoặc migration SQL.

#### B04 — Inbox/outbox technical service

- Move 5 service/adapter files.
- Update checkout/order/dispute/document/review implementation và `OrderEventPublisher` imports.
- Update 6 test file có direct reference: `CheckoutMoneyTest`, `CheckoutServiceImplTest`, `CustomOrderAndDisputeTest`, `DisputeServiceImplTest`, `OrderServiceImplTest`, `OutboxServiceImplTest`.
- Giữ annotation và transaction propagation nguyên trạng.

#### B05 — Scheduler

- Move duy nhất `CheckoutExpiryJob`.
- Không thay fixed-delay property hoặc method body.

#### B05-HOLD — Listener

- Chỉ thực hiện sau khi phê duyệt `com.moonkage.order.listener` hoặc target tương đương không tạo cycle.
- Move hai listener, update B01 event imports.
- Không sửa `ArchitectureTest` để bỏ qua cycle.

#### B06 — Publisher

- Move hai publisher.
- Update `ChatServiceImpl`, `CheckoutServiceImpl`, `OrderDocumentServiceImpl`, `OrderServiceImpl`.
- Update `ChatServiceImplTest`, `CheckoutMoneyTest`, `CheckoutServiceImplTest`, `CustomOrderAndDisputeTest`, `OrderServiceImplTest`.
- Giữ trực tiếp Rabbit best-effort cho chat và outbox durable cho order.

#### B07 — Client facade

- Move `VendorDirectory`.
- Update `OrderAccess`, chat/order/stats service implementation.
- Update 5 test: chat, custom/dispute, dispute, order, stats.

#### B08 — Application support

- Move `OrderAccess`, `OrderProgress`.
- Update dispute/document/review service implementation.
- Update `CustomOrderAndDisputeTest`, `DisputeServiceImplTest`.
- Không hợp nhất `OrderServiceImpl.canRead/moveTo` trong batch này.

#### B09 — Storage

- Move `OrderFileService` nhưng giữ tên.
- Update 4 service implementation và 4 test được liệt kê tại mục 3.8.
- Không thay storage path, `BucketAccess`, file limit hoặc URL behavior.

## 8. Thứ tự migration và lý do

1. **Event contract trước**: chỉ đổi package/type import, ít Spring wiring; tạo foundation cho listener/publisher.
2. **Technical persistence trước technical service**: inbox/outbox implementation phải compile với entity/repository target mới.
3. **Inbox/outbox trước publisher**: `OrderEventPublisher` phụ thuộc `OutboxService` target.
4. **Scheduler độc lập được move riêng**: rollback đơn giản, không chờ listener decision.
5. **Listener bị hold**: không đưa cycle đã biết vào tree; thực hiện khi target mới được duyệt.
6. **Publisher sau event + outbox**: tránh sửa cùng import hai lần trong một batch lớn.
7. **Vendor facade trước `OrderAccess`**: support class import ngay target facade cuối cùng.
8. **Application support sau facade**: giảm intermediate package state.
9. **Storage cuối**: nhiều service/test import nhưng độc lập business logic; không gộp rename.
10. **Full regression sau cùng**: xác nhận scan, architecture direction và không còn old package reference.

Không song song hóa các batch có dependency trực tiếp (`B03 → B04 → B06`, `B07 → B08`). Batch độc lập chỉ được làm song song nếu mỗi branch/worktree có owner rõ và merge order đã xác định; mặc định thực hiện tuần tự để tránh import conflict.

## 9. Verification plan

### 9.1. Sau mỗi batch

1. Kiểm tra `git diff --name-status` chỉ có file trong batch và direct reference.
2. Search old FQCN/package declaration của type vừa move.
3. Compile Order Service cùng dependent modules.
4. Chạy targeted test trong bảng batch.
5. Chạy shared ArchUnit test.
6. Ghi nhận test nào bị skip do Docker/environment; không báo thành công nếu chưa chạy.

Command tham khảo từ thư mục `api` sau khi được phép triển khai:

```text
mvn -pl order-service -am -DskipTests compile
mvn -pl order-service -am -Dtest=<TestClass,...> -Dsurefire.failIfNoSpecifiedTests=false test
mvn -pl order-service -am test
```

Đây là kế hoạch lệnh, Phase 05 chưa chạy các command trên.

### 9.2. Checkpoint riêng theo framework

| Framework/concern | Checkpoint |
|---|---|
| Spring DI | Mỗi moved `@Component/@Service` có đúng một bean; constructor injection khởi tạo được |
| Component scan | Mọi target nằm dưới `com.moonkage.order`; không thêm `@ComponentScan` |
| JPA | 2 entity + 2 repository technical được scan; schema validate không đổi |
| Jackson | Event serialize/deserialize cùng JSON shape; nested record hoạt động |
| RabbitMQ | Listener binding/method parameter và publisher routing key không đổi |
| Transaction | `MANDATORY`, after-commit và `TransactionTemplate` behavior không đổi |
| Reflection | `sourceService` field test còn hoạt động; không có FQCN string stale |
| ArchUnit | Không controller/repository/entity violation và không package cycle |
| Test | 8 direct-impact test compile/run; 3 remaining test không regression |

### 9.3. Acceptance criteria cuối migration

- 154 production Java file vẫn tồn tại; không thêm/xóa class ngoài package move được duyệt.
- 24 approved move hoàn tất; hai listener chỉ move khi target được phê duyệt.
- Không còn import old package của type đã move.
- Không thay public method/constructor/record component/annotation semantics.
- Không thay API/event JSON, routing key, schema version, database table/schema.
- Spring context, JPA repository/entity, listener, scheduler và publisher được phát hiện.
- Shared ArchUnit không có cycle.
- Test đã chạy được báo cáo chính xác; test skip/failure còn lại được ghi rõ.

## 10. Rủi ro theo mức độ

| Mức | Rủi ro | Mitigation |
|---|---|---|
| Cao | Target `messaging.listener` tạo `service ↔ messaging` cycle | Hold hai listener; phê duyệt top-level `listener` hoặc boundary khác; không relax ArchUnit |
| Cao | Technical entity/repository không được JPA scan | B03 riêng, context/JPA test trước B04 |
| Trung bình | Event FQCN đổi làm Jackson/Rabbit deserialization lỗi | Giữ JSON shape; listener parameter test/smoke; repo-wide FQCN search |
| Trung bình | Test cùng package mất implicit visibility/import | Cập nhật import trong cùng batch; không move test tùy tiện |
| Trung bình | Inbox/outbox transaction semantics đổi do refactor kèm move | Mechanical move only; giữ annotation; transaction-focused tests/check |
| Trung bình | Publisher delivery semantics bị hợp nhất nhầm | B06 giữ durable outbox và ephemeral Rabbit path riêng |
| Thấp | Bean không được scan sau move | Mọi target dưới application root; context verification |
| Thấp | `ReflectionTestUtils` lỗi | Không rename `sourceService` field/class trong batch |
| Thấp | Microservice khác compile fail do Order FQCN | Repo-wide search hiện có 0 cross-module Order FQCN; vẫn chạy reactor compile |

## 11. Điểm cần phê duyệt trước triển khai

| Approval ID | Quyết định | Khuyến nghị Phase 05 |
|---|---|---|
| `MP-01` | Target của `PaymentEventListener`, `QuoteAcceptedListener` | Dùng `com.moonkage.order.listener` hoặc boundary khác không thuộc top-level `messaging`; không dùng target Phase 04 khi chưa xử lý cycle |
| `MP-02` | Có giữ shared `NO_PACKAGE_CYCLES` không | Giữ nguyên; không tạo exception cho Order Service |
| `MP-03` | Phê duyệt 24 move còn lại và 9 batch chính | Phê duyệt theo thứ tự B01–B09 |
| `MP-04` | Có rename trong migration không | Không; package move trước, rename phase riêng |
| `MP-05` | Có move test package theo production không | Không mặc định; chỉ cập nhật import |
| `MP-06` | JPA verification khi Docker không sẵn sàng | Không coi test skip là pass; yêu cầu môi trường Docker hoặc context verification tương đương trước merge B03/B04 |
| `MP-07` | Có chỉnh `ArchitectureTest` trong migration không | Không, trừ rule mới được Architect phê duyệt độc lập cho toàn platform |
| `MP-08` | Có xóa `QuotationClient`, `Voucher`, `VoucherRepository` không | Không |
| `MP-09` | Có refactor `OrderServiceImpl`/`CheckoutServiceImpl` hoặc duplication không | Không; phase riêng |
| `MP-10` | Có tách `ChatMessageResponse` khỏi `ChatEvent` không | Không; tránh đổi event contract |

## 12. Phạm vi Phase 05

### Đã thực hiện

- Đối chiếu toàn bộ 154 production Java file.
- Lập bảng 26 candidate move với From/To, lý do, rủi ro, file liên quan và batch.
- Phân loại 24 class sẵn sàng lập batch, 2 listener cần target approval và 128 file giữ nguyên.
- Kiểm tra production/test reference cho từng candidate.
- Phân tích Spring DI, component scan, JPA, Jackson, reflection, RabbitMQ, ArchUnit và test impact.
- Chia migration thành batch nhỏ và đề xuất thứ tự/acceptance criteria.

### Không thực hiện

- Không di chuyển, rename, tạo hoặc xóa class/interface.
- Không chỉnh sửa Java, test, configuration, dependency hoặc shared ArchUnit test.
- Không thay đổi API contract, event contract hoặc database schema.
- Không chạy build/test; command chỉ được ghi thành verification plan.

### File thay đổi

- Chỉ tạo `docs/architecture/order/05_CLASS_MIGRATION_PLAN.md`.


