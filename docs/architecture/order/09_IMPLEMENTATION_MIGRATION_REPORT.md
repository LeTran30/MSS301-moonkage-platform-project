# PHASE 09 — IMPLEMENTATION MIGRATION REPORT

> Phạm vi: `api/order-service`  
> Ngày thực hiện: 12/11/2026 (Asia/Saigon)  
> Trạng thái: **COMPLETED trong phạm vi implementation đã phê duyệt**

## 1. Kết quả tổng quan

Đã di chuyển ba technical implementation/adapter thuộc B04 sang package mục tiêu:

| Type | From | To |
|---|---|---|
| `InboxServiceImpl` | `com.moonkage.order.service.impl` | `com.moonkage.order.messaging.inbox` |
| `OutboxServiceImpl` | `com.moonkage.order.service.impl` | `com.moonkage.order.messaging.outbox` |
| `JpaOutboxEventSource` | `com.moonkage.order.messaging` | `com.moonkage.order.messaging.outbox` |

Không di chuyển business service implementation vì chúng đã đúng package `service.impl`. Không di chuyển interface, entity, listener, publisher hoặc scheduler trong Phase 09.

## 2. Trạng thái đầu vào

Phase 08 đã di chuyển và kiểm chứng:

- `ProcessedEventRepository` → `repository.inbox`;
- `OutboxEventRepository` → `repository.outbox`.

Hai technical service interface vẫn ở package hiện tại do interface-only move tạo cycle:

- `InboxService` tại `com.moonkage.order.service`;
- `OutboxService` tại `com.moonkage.order.service`.

Phase 09 tiếp tục từ working tree này và không ghi đè thay đổi Phase 08.

Thay đổi tracked có sẵn ngoài phạm vi `web/package-lock.json` được giữ nguyên.

## 3. Phạm vi implementation đã thực hiện

### 3.1. `InboxServiceImpl`

File mới:

```text
api/order-service/src/main/java/com/moonkage/order/messaging/inbox/InboxServiceImpl.java
```

Giữ nguyên:

- class name và public visibility;
- `@Service` và `@RequiredArgsConstructor`;
- interface `InboxService`;
- constructor injection qua Lombok;
- method `markProcessed(String eventId, String routingKey)`;
- `@Transactional(propagation = Propagation.MANDATORY)`;
- toàn bộ method body.

Default Spring bean name tiếp tục là `inboxServiceImpl` vì simple class name không đổi.

### 3.2. `OutboxServiceImpl`

File mới:

```text
api/order-service/src/main/java/com/moonkage/order/messaging/outbox/OutboxServiceImpl.java
```

Giữ nguyên:

- class name và public visibility;
- `@Service` và `@RequiredArgsConstructor`;
- interface `OutboxService`;
- constructor-injected dependencies;
- field `sourceService` và `@Value("${spring.application.name}")`;
- method signature và body của `enqueue(...)` và `enqueueState(...)`;
- `Propagation.MANDATORY` trên cả hai method;
- serialization, envelope và trace behavior.

Default Spring bean name tiếp tục là `outboxServiceImpl`.

### 3.3. `JpaOutboxEventSource`

File mới:

```text
api/order-service/src/main/java/com/moonkage/order/messaging/outbox/JpaOutboxEventSource.java
```

Giữ nguyên:

- package-private visibility;
- `@Component` và `@RequiredArgsConstructor`;
- SPI `OutboxEventSource`;
- constructor dependency `OutboxEventRepository`;
- bốn method implementation và method body.

Default Spring bean name tiếp tục là `jpaOutboxEventSource`.

## 4. File thay đổi trong Phase 09

| File | Thay đổi |
|---|---|
| `service/impl/InboxServiceImpl.java` → `messaging/inbox/InboxServiceImpl.java` | Move và cập nhật package declaration |
| `service/impl/OutboxServiceImpl.java` → `messaging/outbox/OutboxServiceImpl.java` | Move và cập nhật package declaration |
| `messaging/JpaOutboxEventSource.java` → `messaging/outbox/JpaOutboxEventSource.java` | Move và cập nhật package declaration |
| `src/test/java/com/moonkage/order/service/OutboxServiceImplTest.java` | Cập nhật import `OutboxServiceImpl` |

Hai repository import trong implementation đã trỏ tới package Phase 08:

- `repository.inbox.ProcessedEventRepository`;
- `repository.outbox.OutboxEventRepository`.

Đối chiếu source trước/sau xác nhận ba implementation chỉ thay đổi package declaration và repository import đã được Phase 08 yêu cầu. Không có method body thay đổi.

## 5. Dependency graph sau migration

```text
messaging.inbox.InboxServiceImpl
    -> service.InboxService
    -> repository.inbox.ProcessedEventRepository
    -> entity.ProcessedEvent

messaging.outbox.OutboxServiceImpl
    -> service.OutboxService
    -> repository.outbox.OutboxEventRepository
    -> entity.OutboxEvent
    -> common-outbox.OutboxTraceContext

messaging.outbox.JpaOutboxEventSource
    -> repository.outbox.OutboxEventRepository
    -> entity.OutboxEvent
    -> common-outbox.OutboxEventSource
```

Ở trạng thái hiện tại, dependency top-level đi từ `messaging` đến `service`, `repository` và `entity`. Không có dependency `service → messaging` do hai interface vẫn nằm trong `service`; vì vậy không tạo cycle mới.

Order Service `ArchitectureTest` pass 6/6, gồm `NO_PACKAGE_CYCLES`.

## 6. Spring component scanning và Dependency Injection

- `OrderServiceApplication` nằm tại root `com.moonkage.order` với `@SpringBootApplication`.
- `messaging.inbox` và `messaging.outbox` là descendant package nên nằm trong default component scan.
- Chỉ có một implementation source cho mỗi contract:
  - `InboxService` → `InboxServiceImpl`;
  - `OutboxService` → `OutboxServiceImpl`;
  - `OutboxEventSource` → `JpaOutboxEventSource` trong Order Service.
- Simple class name và stereotype annotation không đổi, nên default bean name không đổi.
- Constructor, injected type và bean count không thay đổi.
- Không thêm `@ComponentScan`, qualifier, bean alias hoặc configuration.

Test suite hiện không có dedicated full `@SpringBootTest` assertion cho ba bean name. DI được kiểm tra bằng compile/type uniqueness, package scan boundary, test reference và architecture test; đây được ghi nhận là giới hạn verification còn lại.

## 7. Verification

### 7.1. Compile và quality gates

Command chạy từ thư mục `api`:

```text
mvn -pl order-service -am -DskipTests compile
```

Kết quả: **BUILD SUCCESS**.

- Order Service compile 154 source file thành công.
- Spotless pass.
- Checkstyle: 0 violation.
- Error Prone warning baseline còn tồn tại; không sửa trong Phase 09.

### 7.2. Full reactor test

Command:

```text
mvn -pl order-service -am test
```

Kết quả:

| Module | Total | Failure | Error | Skip |
|---|---:|---:|---:|---:|
| `common-storage` | 32 | 0 | 0 | 0 |
| `common-observability` | 32 | 0 | 0 | 0 |
| `common-api` | 38 | 0 | 0 | 0 |
| `common-outbox` | 20 | 0 | 0 | 0 |
| `order-service` | 105 | 0 | 0 | 0 |
| **Tổng reactor** | **227** | **0** | **0** | **0** |

Kết luận: **BUILD SUCCESS**, không có test skip.

Kiểm chứng liên quan:

- `OutboxServiceImplTest`: 1/1 pass với import mới;
- `OrderRepositoryIntegrationTest`: 3/3 pass;
- `OrderStatsRepositoryIntegrationTest`: 3/3 pass;
- Spring Data scan phát hiện đủ 18 repository interface;
- Order Service `ArchitectureTest`: 6/6 pass.

### 7.3. Source/diff verification

- Không còn file implementation tại ba path cũ.
- Mỗi class chỉ có đúng một declaration.
- Không còn import/reference đến FQCN implementation cũ.
- `Propagation.MANDATORY` còn nguyên trên ba transactional method.
- `git diff --check -- api/order-service`: pass.
- Không thay đổi test assertion, configuration, dependency hoặc migration SQL.

## 8. Rủi ro và công việc còn lại

1. `InboxService` và `OutboxService` vẫn nằm trong `service`; B04 đầy đủ chưa đạt cây TO-BE cuối cùng.
2. Di chuyển hai interface sang `messaging.*` vẫn phải chờ hai listener rời top-level `messaging`, nếu không sẽ tạo cycle `service ↔ messaging`.
3. `ProcessedEvent` và `OutboxEvent` vẫn ở root `entity`; phần entity của B03 chưa thực hiện.
4. Chưa có dedicated full `@SpringBootTest` kiểm tra bean name và wiring của ba component; không tự ý thêm test/configuration ngoài phạm vi package migration.
5. Error Prone và Mockito dynamic-agent warning baseline vẫn còn; không phải lỗi Phase 09.

## 9. Kết luận

Phase 09 **COMPLETED trong phạm vi implementation đã phê duyệt**:

- 3 implementation/adapter đã được di chuyển;
- annotation, constructor, method signature, logic và transaction boundary được giữ nguyên;
- bean simple name không đổi;
- compile, quality gate và 227 test đều đạt;
- không phát sinh dependency cycle.

Không thực hiện công việc ngoài Phase 09.
