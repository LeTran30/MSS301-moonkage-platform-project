# PHASE 08 — RETRY INTERFACE MIGRATION REPORT

> Phạm vi: `api/order-service`  
> Ngày thực hiện: 12/11/2026 (Asia/Saigon)  
> Trạng thái cuối cùng: **PARTIALLY_COMPLETED**

## 1. Kết quả tổng quan

Phase 08 retry đã di chuyển thành công hai technical Spring Data repository interface thuộc phần độc lập của B03:

- `ProcessedEventRepository` → `com.moonkage.order.repository.inbox`;
- `OutboxEventRepository` → `com.moonkage.order.repository.outbox`.

Không di chuyển `InboxService` và `OutboxService`. Interface-only B04 vẫn tạo top-level package cycle `service ↔ messaging` khi `PaymentEventListener` và `QuoteAcceptedListener` còn nằm trong `com.moonkage.order.messaging`. Khắc phục yêu cầu di chuyển class ngoài phạm vi Phase 08, nên batch này được giữ nguyên và báo cáo cho Solution Architect.

Không thay đổi business logic, method signature, annotation, API contract, event contract hoặc database schema.

## 2. Baseline verification mới

### 2.1. Git working tree trước migration

Trước khi sửa source:

```text
 M web/package-lock.json
?? docs/architecture/ARCHITECTURE_CONTEXT.md
?? docs/architecture/order/
```

Ghi nhận:

- `web/package-lock.json` là thay đổi tracked có sẵn ngoài phạm vi Order Service; Phase 08 không chỉnh sửa hoặc ghi đè file này.
- Các tài liệu architecture đang untracked từ các phase trước.
- `api/order-service` không có thay đổi trước Phase 08 retry.
- Không phát hiện tài liệu điều chỉnh migration mới ngoài Phase 04–08; áp dụng Phase 05 cùng quyết định listener target tại `com.moonkage.order.listener` đã được tiếp nhận trong Phase 07.

### 2.2. Docker/Testcontainers

Command kiểm tra ngoài sandbox:

```text
docker info --format 'ServerVersion={{.ServerVersion}} OSType={{.OSType}}'
```

Kết quả:

```text
ServerVersion=28.1.1 OSType=linux
```

Testcontainers kết nối thành công Docker Desktop qua Windows named pipe và khởi tạo PostgreSQL `17-alpine` cho hai repository integration test.

### 2.3. Maven baseline trước migration

Command chạy từ thư mục `api`:

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

Baseline: **BUILD SUCCESS**. Sáu JPA integration test từng bị skip trong Phase 06 đã chạy và pass. Spotless, Checkstyle và ArchUnit đều pass. Error Prone và Mockito dynamic-agent warning baseline vẫn tồn tại nhưng không làm build fail và không thuộc phạm vi sửa của Phase 08.

## 3. Đánh giá interface và batch eligibility

| Interface | From | To | Batch gốc | Quyết định retry |
|---|---|---|---|---|
| `ProcessedEventRepository` | `com.moonkage.order.repository` | `com.moonkage.order.repository.inbox` | B03 | Di chuyển |
| `OutboxEventRepository` | `com.moonkage.order.repository` | `com.moonkage.order.repository.outbox` | B03 | Di chuyển |
| `InboxService` | `com.moonkage.order.service` | `com.moonkage.order.messaging.inbox` | B04 | Không di chuyển; tạo cycle trong interface-only scope |
| `OutboxService` | `com.moonkage.order.service` | `com.moonkage.order.messaging.outbox` | B04 | Không di chuyển; tạo cycle trong interface-only scope |

Các business service interface, business repository và Feign client interface giữ nguyên package theo Target Package Design.

### 3.1. Phạm vi B03 trong Phase 08

Phase 05 định nghĩa B03 đầy đủ gồm hai technical entity và hai repository. Phase 08 chỉ cho phép interface migration và cấm tự ý di chuyển entity ngoài phạm vi. Vì vậy báo cáo dùng ký hiệu **B03-I** để chỉ phần interface độc lập đã thực hiện; đây không phải architecture batch mới và không tuyên bố toàn bộ B03 đã hoàn thành.

Hai repository interface vẫn tham chiếu entity tại package hiện tại:

```text
repository.inbox.ProcessedEventRepository -> entity.ProcessedEvent
repository.outbox.OutboxEventRepository   -> entity.OutboxEvent
```

Dependency vẫn đi từ repository layer đến entity layer và không tạo top-level cycle.

## 4. Interface đã di chuyển

### 4.1. `ProcessedEventRepository`

```text
From: com.moonkage.order.repository.ProcessedEventRepository
To:   com.moonkage.order.repository.inbox.ProcessedEventRepository
```

Chỉ thay đổi package declaration và import của consumer. Interface name, generic type và method contract được giữ nguyên.

### 4.2. `OutboxEventRepository`

```text
From: com.moonkage.order.repository.OutboxEventRepository
To:   com.moonkage.order.repository.outbox.OutboxEventRepository
```

Chỉ thay đổi package declaration và import của consumer. Hai method sau giữ nguyên hoàn toàn:

- `findByPublishedAtIsNullOrderByCreatedAtAsc(Pageable page)`;
- `countByPublishedAtIsNull()`.

Đối chiếu nội dung trước/sau xác nhận cả hai interface chỉ khác package declaration.

## 5. File source/test bị ảnh hưởng

| File | Thay đổi | Lý do |
|---|---|---|
| `repository/ProcessedEventRepository.java` → `repository/inbox/ProcessedEventRepository.java` | Move + package declaration | Target package B03 |
| `repository/OutboxEventRepository.java` → `repository/outbox/OutboxEventRepository.java` | Move + package declaration | Target package B03 |
| `service/impl/InboxServiceImpl.java` | Cập nhật import | Inject `ProcessedEventRepository` từ package mới |
| `service/impl/OutboxServiceImpl.java` | Cập nhật import | Inject `OutboxEventRepository` từ package mới |
| `messaging/JpaOutboxEventSource.java` | Cập nhật import | Inject `OutboxEventRepository` từ package mới |
| `service/OutboxServiceImplTest.java` | Cập nhật import | Mock repository từ package mới |

Không chỉnh sửa method body hoặc test assertion.

## 6. Dependency graph

### 6.1. Trước B03-I

```text
service.impl.InboxServiceImpl  -> repository.ProcessedEventRepository -> entity.ProcessedEvent
service.impl.OutboxServiceImpl -> repository.OutboxEventRepository    -> entity.OutboxEvent
messaging.JpaOutboxEventSource -> repository.OutboxEventRepository    -> entity.OutboxEvent
```

### 6.2. Sau B03-I

```text
service.impl.InboxServiceImpl  -> repository.inbox.ProcessedEventRepository -> entity.ProcessedEvent
service.impl.OutboxServiceImpl -> repository.outbox.OutboxEventRepository   -> entity.OutboxEvent
messaging.JpaOutboxEventSource -> repository.outbox.OutboxEventRepository   -> entity.OutboxEvent
```

Top-level direction không đổi:

```text
service   -> repository -> entity
messaging -> repository -> entity
```

ArchUnit `NO_PACKAGE_CYCLES` pass sau migration.

### 6.3. B04 interface-only — không thực hiện

Nếu di chuyển `InboxService` và `OutboxService` mà không di chuyển listener/implementation:

```text
service.impl -> messaging.inbox/outbox
messaging.PaymentEventListener / QuoteAcceptedListener -> service
```

Theo rule `slices().matching("com.moonkage.(*).(*)..")`, dependency graph trở thành:

```text
service -> messaging -> service
```

Đây là cycle bị cấm. Phase 08 không được tự ý di chuyển `PaymentEventListener`, `QuoteAcceptedListener`, `InboxServiceImpl`, `OutboxServiceImpl` hoặc `JpaOutboxEventSource` để giải quyết, nên B04 không được thực hiện.

## 7. Verification sau migration

### 7.1. Compile

Command:

```text
mvn -pl order-service -am -DskipTests compile
```

Kết quả: **BUILD SUCCESS**.

- Order Service compile 154 source file thành công.
- Spotless pass.
- Checkstyle: 0 violation.
- Error Prone warning baseline còn tồn tại; không có warning mới liên quan package move được ghi nhận.

### 7.2. Full test và integration test

Command:

```text
mvn -pl order-service -am test
```

Kết quả sau migration:

| Module | Total | Failure | Error | Skip |
|---|---:|---:|---:|---:|
| `common-storage` | 32 | 0 | 0 | 0 |
| `common-observability` | 32 | 0 | 0 | 0 |
| `common-api` | 38 | 0 | 0 | 0 |
| `common-outbox` | 20 | 0 | 0 | 0 |
| `order-service` | 105 | 0 | 0 | 0 |
| **Tổng reactor** | **227** | **0** | **0** | **0** |

Kết luận: **BUILD SUCCESS**, không có test skip.

### 7.3. Spring DI, JPA scanning và ArchUnit

- Spring Data JPA scan phát hiện đủ **18 repository interface** sau package move.
- `OrderRepositoryIntegrationTest`: 3/3 pass.
- `OrderStatsRepositoryIntegrationTest`: 3/3 pass.
- `OutboxServiceImplTest`: 1/1 pass với repository mock từ package mới.
- Order Service `ArchitectureTest`: 6/6 pass, gồm `NO_PACKAGE_CYCLES`.
- Các package mới vẫn nằm dưới root `com.moonkage.order`, không cần thêm `@ComponentScan`, `@EnableJpaRepositories` hoặc `@EntityScan`.

### 7.4. Reference và diff check

- Không còn import/reference đến `com.moonkage.order.repository.ProcessedEventRepository`.
- Không còn import/reference đến `com.moonkage.order.repository.OutboxEventRepository`.
- Hai file mới có package declaration đúng.
- `git diff --check -- api/order-service`: pass, không có whitespace error.
- Không chỉnh sửa `web/package-lock.json` hoặc file ngoài phạm vi.

## 8. Batch chưa thực hiện

| Batch/phần việc | Trạng thái | Lý do | Cần di chuyển đồng thời hoặc trước |
|---|---|---|---|
| Phần entity còn lại của B03 | Chưa thực hiện | Phase 08 chỉ cho phép interface migration | `ProcessedEvent`, `OutboxEvent` trong phase/batch được phê duyệt riêng |
| B04 — `InboxService` | Blocked | Interface-only tạo `service ↔ messaging` cycle | Di chuyển hai listener ra root `listener` trước, hoặc phê duyệt atomic batch phù hợp |
| B04 — `OutboxService` | Blocked | Cùng cycle; implementation vẫn thuộc `service.impl` | Như trên; sau đó thực hiện B04 đầy đủ theo Migration Plan |

Không thực hiện các batch B05–B09 và không mở rộng sang Phase 09.

## 9. Rủi ro còn lại và điểm cần Solution Architect xem xét

1. **Batch order cần điều chỉnh:** listener phải rời top-level `messaging` trước khi `service.impl` phụ thuộc các interface trong `messaging.inbox/outbox`, hoặc các move phải nằm trong một atomic batch đã được phê duyệt.
2. **B03 mới hoàn thành phần interface:** technical entity vẫn ở `entity`; đây là trạng thái compile/runtime hợp lệ nhưng chưa phải cây TO-BE cuối cùng.
3. **B04 chưa bắt đầu:** `InboxService` và `OutboxService` vẫn ở `service`, vì vậy chưa có thay đổi Spring DI cho hai technical service contract.
4. Error Prone/Mockito warning baseline vẫn tồn tại và không được sửa trong package migration.
5. Các file architecture documentation và package mới vẫn untracked; Phase 08 không commit theo quy định.

## 10. Trạng thái cuối cùng

**PARTIALLY_COMPLETED**

- B03-I: hoàn thành, hai repository interface đã được di chuyển và verification đạt.
- B04 interface-only: blocked do dependency cycle; source được giữ ở package cũ.
- Compile: pass.
- Full reactor test: 227/227 pass, 0 failure, 0 error, 0 skip.
- Order Service: 105/105 pass; JPA integration và ArchUnit đều pass.

Phase 08 dừng tại đây và chờ Senior Solution Architect review trước Phase 09.
