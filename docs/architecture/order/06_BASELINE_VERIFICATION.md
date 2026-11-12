# Phase 06 — Kiểm chứng baseline trước refactor của Order Service

> Phạm vi: Order Service và Maven dependency module cần thiết  
> Ngày kiểm chứng: 12/11/2026 (Asia/Saigon)  
> Trạng thái: **PASS có điều kiện — build/unit/quality gate đạt, 6 JPA integration test bị skip do Docker unavailable**  
> Hành động: **dừng trước migration cho đến khi integration baseline được chạy đầy đủ và listener package target được phê duyệt**.

## 1. Kết luận nhanh

| Hạng mục | Kết quả |
|---|---|
| Git tracked/staged changes | Không có |
| Untracked changes | 6 tài liệu architecture có trước Phase 06; không ghi đè |
| Order Service source status | Sạch trước và sau baseline |
| Maven reactor build | `BUILD SUCCESS` |
| Test toàn reactor | 227 total; 221 pass; 0 failure; 0 error; 6 skip |
| Test riêng Order Service | 105 total; 99 pass; 0 failure; 0 error; 6 skip |
| ArchUnit riêng Order Service | 6/6 pass |
| Spotless | Pass; không chạy `spotless:apply` |
| Checkstyle | Pass; 0 violation trên toàn reactor được chọn |
| Compile/Error Prone | Pass, có warning baseline |
| Docker/Testcontainers | Docker engine unavailable; 6 JPA test skip |
| Baseline verdict | Build đạt nhưng integration baseline chưa đầy đủ; chưa nên bắt đầu JPA/package migration |

Không phát hiện lỗi test hoặc quality gate. Tuy nhiên, do Phase 05 có kế hoạch di chuyển `OutboxEvent`, `ProcessedEvent` và repository tương ứng, việc 6 JPA integration test bị skip là giới hạn có ý nghĩa và phải được xử lý trước batch B03/B04.

## 2. Git working tree trước kiểm chứng

### 2.1. Command

```text
git status --short --untracked-files=all
git diff --stat
git diff --name-only
git diff --cached --name-only
git status --short -- api/order-service
```

### 2.2. Kết quả

- Không có tracked modification.
- Không có staged change.
- `api/order-service` không có source/config/test change.
- Có các untracked file sau và được giữ nguyên:

```text
docs/architecture/ARCHITECTURE_CONTEXT.md
docs/architecture/order/01_PACKAGE_INVENTORY.md
docs/architecture/order/02_RESPONSIBILITY_ANALYSIS.md
docs/architecture/order/03_ARCHITECTURE_PROFILE.md
docs/architecture/order/04_TARGET_PACKAGE_DESIGN.md
docs/architecture/order/05_CLASS_MIGRATION_PLAN.md
```

Các file trên là tài liệu của các phase trước, không phải output Maven và không bị ghi đè. Sau khi chạy Maven, chỉ xuất hiện `target/` ignored build output; Git tracked status vẫn sạch.

## 3. Môi trường kiểm chứng

### 3.1. Maven và Java

Command:

```text
mvn --version
java -version
```

Kết quả:

| Thành phần | Phiên bản |
|---|---|
| Apache Maven | 3.9.9 |
| Java runtime | Oracle JDK 21.0.7 LTS |
| Project `java.version` | 21 |
| OS | Windows 11 amd64 |
| Platform encoding Maven | UTF-8 |

Java runtime phù hợp cấu hình `release=21` của project.

### 3.2. Docker

Command:

```text
docker info --format '{{.ServerVersion}}'
docker ps --format 'table {{.Names}}\t{{.Status}}'
```

Cả hai command không kết nối được Docker Desktop Linux engine:

```text
open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified
```

Không tự khởi động Docker Desktop/service trong phase này. Testcontainers xác nhận không tìm thấy valid Docker environment và các test có `disabledWithoutDocker = true` được skip.

## 4. Xác định Maven command phù hợp

`api/order-service/pom.xml` phụ thuộc các module nội bộ:

- `common-storage`;
- `common-api`;
- `common-observability`;
- `common-outbox`.

Command phù hợp được chạy từ thư mục `api`:

```text
mvn -pl order-service -am test
```

Ý nghĩa:

- `-pl order-service`: chọn Order Service;
- `-am`: build các Maven module dependency cần thiết;
- `test`: chạy toàn lifecycle từ validate đến test, gồm Spotless, Checkstyle, compile/Error Prone, test compile, unit/integration test khả dụng và ArchUnit.

Reactor thực tế gồm 6 project:

1. parent `api`;
2. `common-storage`;
3. `common-observability`;
4. `common-api`;
5. `common-outbox`;
6. `order-service`.

Command xác nhận riêng quality gate:

```text
mvn -pl order-service -am validate
```

Không cần chạy `verify` để kích hoạt gate bổ sung vì POM hiện bind Spotless/Checkstyle ở `validate`, compiler/Error Prone ở compile và ArchUnit trong test. Không chạy `clean` vì baseline không cần xóa build artifact hiện có.

## 5. Kết quả Maven baseline

### 5.1. Command chính

```text
mvn -pl order-service -am test
```

Kết quả:

- Exit code: `0`.
- Maven result: `BUILD SUCCESS`.
- Thời gian: `45.141 s`.
- Kết thúc: `2026-11-12T17:37:26+07:00`.
- Cả 6 reactor project: `SUCCESS`.

### 5.2. Test result theo module

Số liệu được đối chiếu từ `target/surefire-reports/TEST-*.xml`:

| Module | Total | Pass | Failure | Error | Skip |
|---|---:|---:|---:|---:|---:|
| `common-storage` | 32 | 32 | 0 | 0 | 0 |
| `common-observability` | 32 | 32 | 0 | 0 | 0 |
| `common-api` | 38 | 38 | 0 | 0 | 0 |
| `common-outbox` | 20 | 20 | 0 | 0 | 0 |
| `order-service` | 105 | 99 | 0 | 0 | 6 |
| **Tổng** | **227** | **221** | **0** | **0** | **6** |

### 5.3. Test result chi tiết của Order Service

| Test class | Total | Pass | Failure | Error | Skip |
|---|---:|---:|---:|---:|---:|
| `GlobalExceptionHandlerTest` | 5 | 5 | 0 | 0 | 0 |
| `OrderRepositoryIntegrationTest` | 3 | 0 | 0 | 0 | 3 |
| `OrderStatsRepositoryIntegrationTest` | 3 | 0 | 0 | 0 | 3 |
| `ChatServiceImplTest` | 14 | 14 | 0 | 0 | 0 |
| `CheckoutMoneyTest` | 19 | 19 | 0 | 0 | 0 |
| `CheckoutServiceImplTest` | 5 | 5 | 0 | 0 | 0 |
| `CustomOrderAndDisputeTest` | 23 | 23 | 0 | 0 | 0 |
| `DisputeServiceImplTest` | 9 | 9 | 0 | 0 | 0 |
| `OrderServiceImplTest` | 11 | 11 | 0 | 0 | 0 |
| `OrderStatsServiceImplTest` | 6 | 6 | 0 | 0 | 0 |
| `OutboxServiceImplTest` | 1 | 1 | 0 | 0 | 0 |
| Shared `ArchitectureTest` | 6 | 6 | 0 | 0 | 0 |
| **Tổng** | **105** | **99** | **0** | **0** | **6** |

Hai repository integration test class bị skip hoàn toàn vì Docker unavailable. Đây là environmental skip, không phải assertion failure.

## 6. Quality gate hiện tại

### 6.1. Spotless

POM bind `spotless:check` vào phase `validate`.

Kết quả từ command `test` và command xác nhận `validate`:

- Parent POM: pass.
- `common-storage`: pass.
- `common-observability`: pass.
- `common-api`: pass.
- `common-outbox`: pass.
- `order-service`: pass; 165 Java file và 1 POM được kiểm tra theo output Maven.
- Không file nào cần thay đổi để clean.
- Không chạy `spotless:apply`; không có auto-format hoặc source mutation.

### 6.2. Checkstyle

POM bind `checkstyle:check` vào phase `validate`, có `failOnViolation=true` và kiểm tra cả test source.

Kết quả:

- Cả 6 reactor project pass.
- Order Service: `0 Checkstyle violations`.
- Toàn bộ module dependency được chọn: `0 Checkstyle violations` theo từng Maven module.

### 6.3. Error Prone/compiler

Compile và testCompile thành công. Error Prone không phát hiện error gate nhưng có warning baseline.

Order Service production:

- 17 `MissingSummary` warning trên Javadoc của DTO/nested record;
- 1 `UnrecognisedJavadocTag` tại `OrderProperties`.

Order Service test:

- 1 `InvalidParam` tại `CheckoutMoneyTest`;
- 1 `UnusedVariable` tại `CustomOrderAndDisputeTest`;
- compiler còn ghi nhận unchecked/unsafe operation tại `CheckoutMoneyTest`.

`common-outbox`:

- 3 `InvalidParam` warning trong production Javadoc;
- 1 `DirectInvocationOnMock` warning trong test.

Các warning này không làm build fail theo cấu hình hiện tại. Phase 06 chỉ ghi nhận, không sửa và không gộp việc sửa warning vào package migration.

### 6.4. ArchUnit

Shared `ArchitectureTest` được parent POM thêm vào test source của từng module.

Order Service:

| Chỉ số | Kết quả |
|---|---:|
| Rule/test | 6 |
| Pass | 6 |
| Failure | 0 |
| Error | 0 |
| Skip | 0 |

Toàn reactor được chọn có 5 module jar chạy shared ArchUnit, tổng cộng 30 ArchUnit test pass.

Rule hiện tại kiểm tra:

- controller không dùng repository;
- controller không dùng entity;
- DTO không dùng entity;
- repository không phụ thuộc upper layer;
- service không dùng controller;
- không có package cycle.

Baseline xác nhận **hiện tại không có package cycle**. Kết quả này củng cố blocker Phase 05: không được move listener vào `messaging.listener` nếu việc đó tạo cycle `service ↔ messaging`.

### 6.5. Command `validate`

```text
mvn -pl order-service -am validate
```

Kết quả:

- Exit code: `0`.
- `BUILD SUCCESS`.
- Thời gian: `2.780 s`.
- Spotless và Checkstyle pass trên cả 6 reactor project.

## 7. Warning/log không phải test failure

Các log sau xuất hiện nhưng test vẫn pass:

- Mockito/Byte Buddy cảnh báo dynamic agent self-attach sẽ bị hạn chế ở JDK tương lai.
- Một số test exception handler chủ động log stack trace để kiểm tra HTTP 500 behavior.
- Common Storage configuration test chủ động tạo invalid property context và log exception trong negative test.
- Checkout test log late-payment/refund warning theo scenario.
- Console hiển thị một số message tiếng Việt bị mojibake; Maven platform encoding báo UTF-8. Đây là baseline observation, chưa xác định là source/resource hay console rendering issue.

Không sửa các warning/log trên trong Phase 06.

## 8. Giới hạn môi trường

### 8.1. Docker unavailable

Docker named pipe không tồn tại, Testcontainers không tìm được provider hợp lệ. Hệ quả:

- `OrderRepositoryIntegrationTest`: skip 3;
- `OrderStatsRepositoryIntegrationTest`: skip 3;
- không có runtime PostgreSQL/JPA schema validation từ hai test class này trong lần chạy baseline.

### 8.2. Tác động tới migration readiness

Unit test, compile và quality gates đạt, nhưng baseline chưa kiểm chứng đầy đủ JPA runtime. Đây là blocker trước các batch có liên quan:

- B03: move `ProcessedEvent`, `OutboxEvent` và repository;
- B04: move inbox/outbox implementation/relay;
- bất kỳ thay đổi nào phụ thuộc entity/repository scanning.

Không cần chặn việc review tài liệu hoặc phê duyệt design, nhưng không nên bắt đầu migration source cho đến khi baseline Docker-backed test chạy được hoặc Architect chấp nhận một verification environment tương đương.

## 9. Vấn đề cần xử lý trước migration

| ID | Vấn đề | Mức độ | Hành động yêu cầu |
|---|---|---|---|
| `BV-01` | 6 JPA integration test skip do Docker unavailable | Blocker cho B03/B04 | Khởi động Docker trong môi trường được phép và chạy lại `mvn -pl order-service -am test`; yêu cầu 0 failure/error và không skip hai test class |
| `BV-02` | Target `messaging.listener` tạo package cycle theo phân tích Phase 05 | Blocker cho listener batch | Architect phê duyệt `com.moonkage.order.listener` hoặc target khác; giữ `NO_PACKAGE_CYCLES` |
| `BV-03` | Error Prone warning baseline | Không blocker hiện tại | Ghi nhận riêng; không sửa cùng package migration |
| `BV-04` | Mockito dynamic-agent warning | Không blocker hiện tại | Theo dõi khi nâng JDK/Mockito; không đổi dependency trong migration |
| `BV-05` | Mojibake trong console log tiếng Việt | Không blocker package move | Xác minh riêng nếu ảnh hưởng vận hành/logging; không sửa trong Phase 06 |
| `BV-06` | 6 architecture documents hiện untracked | Process risk | Giữ nguyên; owner quyết định add/commit, không để migration ghi đè |

## 10. Baseline verdict

### Đã đạt

- Git tracked source sạch.
- Maven reactor build thành công.
- 221 test pass, không failure/error.
- Order Service unit/application tests pass.
- Spotless pass.
- Checkstyle pass với 0 violation.
- Compile/Error Prone gate pass.
- ArchUnit 6/6 pass cho Order Service; package-cycle rule pass.

### Chưa đạt đầy đủ

- 6 PostgreSQL/Testcontainers integration test chưa chạy.
- JPA runtime baseline chưa đầy đủ cho planned technical entity/repository moves.
- Listener package target vẫn cần Architect phê duyệt để tránh architecture cycle.

**Kết luận:** baseline là **PASS có điều kiện**, không có lỗi build/test hiện hữu nhưng chưa đủ điều kiện bắt đầu toàn bộ migration. Dừng Phase 06 tại đây và không refactor source.

## 11. Phạm vi thay đổi Phase 06

### Đã thực hiện

- Kiểm tra Git working tree và ghi nhận untracked documentation.
- Xác định Maven reactor command đúng.
- Kiểm tra Java/Maven/Docker environment.
- Chạy `mvn -pl order-service -am test`.
- Chạy `mvn -pl order-service -am validate`.
- Đối chiếu Surefire report để tổng hợp pass/fail/error/skip.
- Kiểm tra Spotless, Checkstyle, Error Prone và ArchUnit.

### Không thực hiện

- Không sửa lỗi/warning baseline.
- Không khởi động Docker service/Desktop.
- Không chỉnh sửa Java, test, configuration, dependency hoặc quality-gate rule.
- Không refactor hoặc di chuyển class.
- Không chạy database migration thủ công.

### File thay đổi

- Chỉ tạo `docs/architecture/order/06_BASELINE_VERIFICATION.md`.
