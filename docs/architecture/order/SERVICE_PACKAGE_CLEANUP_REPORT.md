# Báo cáo cleanup package `service` của Order Service

> Phạm vi: `api/order-service`
> Ngày kiểm chứng: 13/11/2026
> Architecture style: Layered Architecture
> Trạng thái: **COMPLETED**

## 1. Phạm vi và baseline

Task hoàn tất cleanup cho sáu concrete component từng được xem xét trong package `service`:

- `ChatSignalPublisher`;
- `OrderAccess`;
- `OrderEventPublisher`;
- `OrderFileService`;
- `OrderProgress`;
- `VendorDirectory`.

Trước khi chỉnh sửa hai publisher, working tree đã chứa các package move chưa commit của lần cleanup trước và `docs/business-audit/` là untracked. Task giữ nguyên nội dung ngoài phạm vi, không stage, không xóa và không commit.

Baseline được kiểm tra bằng:

```text
mvn -pl order-service -am -DskipTests compile
```

Kết quả baseline: **BUILD SUCCESS**. Không có compile error thực tế tại `OrderAccess`, `OrderProgress` hoặc các reference đã cập nhật. Dấu hiệu lỗi trong IDE không được xác nhận bởi Maven và phù hợp với tình trạng IDE index/cache chưa đồng bộ sau logical file move.

## 2. Package mapping cuối cùng

| Class | Package trước cleanup | Package cuối | Trách nhiệm | Trạng thái |
|---|---|---|---|---|
| `ChatSignalPublisher` | `com.moonkage.order.service` | `com.moonkage.order.service.publisher` | Best-effort Rabbit publisher gửi chat signal sau transaction commit | Đã di chuyển |
| `OrderAccess` | `com.moonkage.order.service` | `com.moonkage.order.service.support` | Application support component thực thi access rule và lấy/lock `Order` | Đã di chuyển |
| `OrderEventPublisher` | `com.moonkage.order.service` | `com.moonkage.order.service.publisher` | Tạo outbound `OrderEvent` và ghi event qua transactional outbox | Đã di chuyển |
| `OrderFileService` | `com.moonkage.order.service` | `com.moonkage.order.storage` | Storage adapter quanh `ObjectStorage` | Đã di chuyển |
| `OrderProgress` | `com.moonkage.order.service` | `com.moonkage.order.service.support` | Application support component cập nhật trạng thái và progress history | Đã di chuyển |
| `VendorDirectory` | `com.moonkage.order.service` | `com.moonkage.order.client.facade` | Facade quanh `VendorClient` | Đã di chuyển ở batch trước |

Không class nào được đưa vào `service.impl` vì các class này không implement Service Interface.

## 3. Phân tích và quyết định package publisher

### 3.1. Vì sao không dùng `messaging.publisher`

Dependency hiện có trước publisher move:

```text
messaging.inbox.InboxServiceImpl   -> service.InboxService
messaging.outbox.OutboxServiceImpl -> service.OutboxService
messaging.CheckoutExpiryJob        -> service.CheckoutService
```

Nếu chỉ chuyển publisher sang `messaging.publisher`, application implementation tạo cạnh ngược:

```text
service.impl -> messaging.publisher
messaging     -> service
```

Shared ArchUnit chia slice theo top-level package `com.moonkage.(*).(*)..`; phương án đó tạo cycle `service -> messaging -> service`. Một top-level package mới như `publisher` hoặc `event.publisher` cũng tạo cycle tương đương vì `OrderEventPublisher` phụ thuộc `service.OutboxService`, trong khi `service.impl` phụ thuộc publisher.

### 3.2. Package được chọn

`com.moonkage.order.service.publisher` được chọn vì:

1. package trực tiếp `com.moonkage.order.service` chỉ còn Service Interface;
2. subpackage `publisher` phản ánh rõ event publishing responsibility;
3. không đưa publisher vào `service.impl`;
4. không yêu cầu di chuyển `InboxService`, `OutboxService` hoặc `CheckoutExpiryJob` ngoài phạm vi;
5. không tạo dependency cycle theo Layered Architecture và ArchUnit rules hiện hành.

Đây là pragmatic Layered Architecture placement: publisher là collaborator của application service và được cô lập trong subpackage chuyên trách, trong khi technical inbox/outbox implementation vẫn nằm dưới `messaging`.

## 4. Dependency graph sau migration

```text
controller / listener / scheduler
  -> service interface

service.impl
  -> service interface
  -> service.publisher
  -> service.support
  -> storage
  -> repository / client / dto / entity

service.publisher.ChatSignalPublisher
  -> config / dto.event.outbound / Spring AMQP

service.publisher.OrderEventPublisher
  -> service.OutboxService
  -> dto.event.outbound / entity

service.support
  -> repository / entity / security / exception / client.facade

storage
  -> config / dto / common-storage

messaging.inbox / messaging.outbox / messaging root
  -> service interface
```

`service` interface không phụ thuộc `service.impl` hoặc `service.publisher`. Không có cạnh `service -> messaging` phát sinh từ publisher move. ArchUnit xác nhận graph không có package cycle.

## 5. File đã thay đổi

### 5.1. Logical move của publisher

| Class | From | To |
|---|---|---|
| `ChatSignalPublisher` | `service/ChatSignalPublisher.java` | `service/publisher/ChatSignalPublisher.java` |
| `OrderEventPublisher` | `service/OrderEventPublisher.java` | `service/publisher/OrderEventPublisher.java` |

Class name, `@Component`, `@RequiredArgsConstructor`, `@Slf4j`, method signature, constant và method body được giữ nguyên. `OrderEventPublisher` chỉ bổ sung explicit import cho `OutboxService` sau khi rời package trực tiếp `service`.

### 5.2. Production reference cập nhật cho publisher

- `service/impl/ChatServiceImpl.java`;
- `service/impl/CheckoutServiceImpl.java`;
- `service/impl/OrderDocumentServiceImpl.java`;
- `service/impl/OrderServiceImpl.java`.

### 5.3. Test reference cập nhật cho publisher

- `service/ChatServiceImplTest.java`;
- `service/CheckoutMoneyTest.java`;
- `service/CheckoutServiceImplTest.java`;
- `service/CustomOrderAndDisputeTest.java`;
- `service/OrderServiceImplTest.java`.

Các test chỉ đổi import; assertion và behavior không thay đổi.

### 5.4. File thuộc cleanup trước đang cùng working tree

Logical move:

- `OrderAccess` sang `service/support`;
- `OrderProgress` sang `service/support`;
- `OrderFileService` sang `storage`.

Production reference:

- `service/impl/ChatServiceImpl.java`;
- `service/impl/DisputeServiceImpl.java`;
- `service/impl/OrderDocumentServiceImpl.java`;
- `service/impl/OrderServiceImpl.java`;
- `service/impl/ReviewServiceImpl.java`.

Test reference:

- `service/ChatServiceImplTest.java`;
- `service/CustomOrderAndDisputeTest.java`;
- `service/DisputeServiceImplTest.java`;
- `service/OrderServiceImplTest.java`.

## 6. Compile error và stale reference

Không phát hiện compile error ở baseline hoặc sau migration.

Các reference được cập nhật từ:

- `com.moonkage.order.service.ChatSignalPublisher` sang `com.moonkage.order.service.publisher.ChatSignalPublisher`;
- `com.moonkage.order.service.OrderEventPublisher` sang `com.moonkage.order.service.publisher.OrderEventPublisher`;
- các old FQCN của `OrderAccess`, `OrderProgress` và `OrderFileService` đã được loại bỏ ở cleanup trước.

Không còn import/reference đến năm old FQCN trong `src/main` hoặc `src/test`. Nếu IDE vẫn hiển thị lỗi, cần reload Maven project hoặc invalidate IDE cache; không cần thay đổi source để che lỗi IDE.

## 7. Verification

Các command chạy từ thư mục `api`.

### 7.1. Compile

```text
mvn -pl order-service -am -DskipTests compile
```

Kết quả sau migration: **BUILD SUCCESS**.

- 6/6 reactor module thành công;
- Order Service compile 154 source file;
- Spotless pass;
- Checkstyle pass, 0 violation;
- warning Error Prone/Javadoc baseline không làm fail build và không được sửa ngoài phạm vi.

### 7.2. Test

```text
mvn -pl order-service -am test
```

Kết quả: **BUILD SUCCESS**.

| Module | Total | Failure | Error | Skip |
|---|---:|---:|---:|---:|
| `common-storage` | 32 | 0 | 0 | 0 |
| `common-observability` | 32 | 0 | 0 | 0 |
| `common-api` | 38 | 0 | 0 | 0 |
| `common-outbox` | 20 | 0 | 0 | 0 |
| `order-service` | 105 | 0 | 0 | 0 |
| **Tổng** | **227** | **0** | **0** | **0** |

Hai JPA Testcontainers suite chạy thực tế với PostgreSQL 17:

- `OrderRepositoryIntegrationTest`: 3/3 pass;
- `OrderStatsRepositoryIntegrationTest`: 3/3 pass;
- 6 Flyway migration được validate và apply;
- 18 JPA repository được scan;
- `EntityManagerFactory` khởi tạo thành công.

Order Service ArchUnit: **6/6 pass**, bao gồm `NO_PACKAGE_CYCLES`.

### 7.3. Spring DI và component scanning

- hai publisher giữ nguyên `@Component` và constructor injection;
- simple class name không đổi nên default bean name `chatSignalPublisher` và `orderEventPublisher` không đổi;
- package mới vẫn dưới `com.moonkage.order`, nằm trong component-scan boundary của `OrderServiceApplication`;
- production/test compile và các unit test của consumer đều pass;
- JPA Spring context slice khởi tạo thành công.

Order Service chưa có dedicated full `@SpringBootTest` load toàn bộ messaging/application context. Vì vậy publisher bean discovery được kiểm chứng bằng package/annotation inspection, compile và consumer tests; chưa có full-context assertion riêng cho hai bean.

### 7.4. Package `service` cuối cùng

Package trực tiếp `com.moonkage.order.service` chỉ còn 10 interface:

- `CartService`;
- `ChatService`;
- `CheckoutService`;
- `DisputeService`;
- `InboxService`;
- `OrderDocumentService`;
- `OrderService`;
- `OrderStatsService`;
- `OutboxService`;
- `ReviewService`.

Không còn concrete class trực tiếp trong package này. `service.impl`, `service.publisher` và `service.support` có trách nhiệm riêng, rõ ràng.

### 7.5. Diff audit

- `git diff --check`: pass;
- không thay đổi method body hoặc business logic;
- không thay đổi API contract, event payload, routing key hoặc serialization field;
- không thay đổi database schema, migration, configuration hoặc Maven dependency;
- không chỉnh sửa `docs/business-audit/` có sẵn ngoài phạm vi;
- không commit.

## 8. Vấn đề còn lại

Không còn compile error, stale source reference hoặc concrete class trực tiếp trong `service`.

Giới hạn kiểm chứng còn lại là chưa có dedicated full `@SpringBootTest` cho toàn bộ DI graph. Đây không phải failure của migration hiện tại; compile, unit/integration test và ArchUnit đều đạt.

Nếu tương lai `InboxService`, `OutboxService` và `CheckoutExpiryJob` được chuyển theo migration plan riêng, Architect có thể đánh giá lại việc đặt publisher dưới `messaging.publisher`. Không cần thay đổi đó để đáp ứng mục tiêu cleanup hiện tại.

## 9. Trạng thái cuối

**COMPLETED**.

- 6/6 concrete component đã được đặt ngoài package trực tiếp `service`;
- package trực tiếp `service` chỉ còn Service Interface;
- publisher nằm tại `service.publisher` và không tạo dependency cycle;
- compile, test, JPA Testcontainers, Spotless, Checkstyle và ArchUnit đều đạt;
- không thay đổi business logic hoặc contract;
- không commit.
