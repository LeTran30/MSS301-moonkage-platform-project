# PHASE 07 — CHUẨN BỊ PACKAGE STRUCTURE

> Phạm vi: `api/order-service`  
> Đầu vào đã được phê duyệt: Phase 04, Phase 05 và Phase 06  
> Trạng thái: **Hoàn thành chuẩn bị; không thay đổi Java source và không tạo thư mục rỗng**

## 1. Mục tiêu và phạm vi

Phase này đối chiếu cây package hiện tại với Target Package Design và Class Migration Plan đã được phê duyệt, xác định thời điểm hình thành các package mục tiêu và ghi nhận tác động có thể xảy ra khi build trong các batch tiếp theo.

Phase này không:

- di chuyển, tạo mới hoặc chỉnh sửa business class/interface;
- thay đổi package declaration hoặc import;
- thay đổi business logic, API contract, event contract hoặc database schema;
- tạo placeholder class, `package-info.java` hoặc abstraction chỉ để duy trì thư mục;
- thay đổi configuration, dependency, test hoặc quality-gate rule.

## 2. Quyết định chuẩn bị package

Không tạo trước thư mục Java rỗng trong Phase 07.

Lý do:

1. Java package được hình thành bởi package declaration của source file, không phải chỉ bởi thư mục vật lý.
2. Git không theo dõi thư mục rỗng; tạo trước các thư mục này không mang lại giá trị cho build hoặc component scanning.
3. Tạo placeholder class hoặc `package-info.java` chỉ để giữ thư mục trái với giới hạn của phase.
4. Package mục tiêu nên được tạo atomically cùng class đầu tiên được di chuyển, package declaration và toàn bộ import/reference liên quan trong đúng migration batch.

Vì vậy, “chuẩn bị cấu trúc” trong phase này là khóa danh sách package, batch sở hữu package và các điều kiện kiểm chứng; không tạo filesystem artifact không có source thực tế.

## 3. Package hiện có — AS-IS

Root package là `com.moonkage.order`. Kiểm tra trực tiếp dưới `src/main/java` xác nhận 16 descendant package, tương ứng 17 package khi tính cả root.

| Package hiện có | Vai trò hiện tại | Xử lý trong Phase 07 |
|---|---|---|
| `com.moonkage.order` | Spring Boot application root | Giữ nguyên |
| `com.moonkage.order.client` | Feign client | Giữ nguyên |
| `com.moonkage.order.client.dto` | DTO của external client | Giữ nguyên |
| `com.moonkage.order.config` | Spring/application configuration | Giữ nguyên |
| `com.moonkage.order.controller` | REST controller | Giữ nguyên |
| `com.moonkage.order.dto` | DTO root và package metadata hiện có | Giữ nguyên |
| `com.moonkage.order.dto.event` | Event contract hiện đang dùng chung | Giữ package; một số event sẽ tách theo direction ở B01–B02 |
| `com.moonkage.order.dto.request` | Request DTO | Giữ nguyên |
| `com.moonkage.order.dto.response` | Response DTO | Giữ nguyên |
| `com.moonkage.order.entity` | Business và technical JPA entity hiện tại | Giữ package; technical entity sẽ tách ở B03 |
| `com.moonkage.order.enums` | Enum/value vocabulary | Giữ nguyên |
| `com.moonkage.order.exception` | Exception và handler | Giữ nguyên |
| `com.moonkage.order.messaging` | Messaging component hiện đang dùng chung | Giữ package; component chuyên biệt sẽ tách ở B04–B06 |
| `com.moonkage.order.repository` | Spring Data repository hiện tại | Giữ package; technical repository sẽ tách ở B03 |
| `com.moonkage.order.security` | Security/current-user support | Giữ nguyên |
| `com.moonkage.order.service` | Service contract và collaborator hiện đang dùng chung | Giữ package; technical/support type sẽ tách ở B04 và B06–B09 |
| `com.moonkage.order.service.impl` | Business service implementation và technical implementation hiện tại | Giữ package; inbox/outbox implementation sẽ tách ở B04 |

Không package hiện có nào bị xóa hoặc đổi tên trong Phase 07.

## 4. Package sẽ hình thành trong các migration batch

Tất cả 14 package dưới đây hiện chưa tồn tại trên filesystem. Chúng chỉ được tạo khi batch tương ứng thực sự di chuyển source file.

| Package mục tiêu | Class đầu tiên/nội dung dự kiến | Batch tạo | Trạng thái Phase 07 |
|---|---|---|---|
| `com.moonkage.order.dto.event.inbound` | `PaymentFailedEvent`, `PaymentSucceededEvent`, `QuoteAcceptedEvent` | B01 | Chưa tạo; tạo cùng event move |
| `com.moonkage.order.dto.event.outbound` | `ChatEvent`, `DisputeEvent`, `OrderActivityEvent`, `OrderEvent`, `ReviewCreatedEvent` | B02 | Chưa tạo; tạo cùng event move |
| `com.moonkage.order.entity.inbox` | `ProcessedEvent` | B03 | Chưa tạo; tạo cùng entity move |
| `com.moonkage.order.entity.outbox` | `OutboxEvent` | B03 | Chưa tạo; tạo cùng entity move |
| `com.moonkage.order.repository.inbox` | `ProcessedEventRepository` | B03 | Chưa tạo; tạo cùng repository move |
| `com.moonkage.order.repository.outbox` | `OutboxEventRepository` | B03 | Chưa tạo; tạo cùng repository move |
| `com.moonkage.order.messaging.inbox` | `InboxService`, `InboxServiceImpl` | B04 | Chưa tạo; tạo cùng technical service move |
| `com.moonkage.order.messaging.outbox` | `OutboxService`, `OutboxServiceImpl`, `JpaOutboxEventSource` | B04 | Chưa tạo; tạo cùng technical service/adapter move |
| `com.moonkage.order.scheduler` | `CheckoutExpiryJob` | B05 | Chưa tạo; tạo cùng scheduled adapter move |
| `com.moonkage.order.listener` | `PaymentEventListener`, `QuoteAcceptedListener` | B05 | Chưa tạo; tạo cùng listener move |
| `com.moonkage.order.messaging.publisher` | `ChatSignalPublisher`, `OrderEventPublisher` | B06 | Chưa tạo; tạo cùng publisher move |
| `com.moonkage.order.client.facade` | `VendorDirectory` | B07 | Chưa tạo; tạo cùng facade move |
| `com.moonkage.order.service.support` | `OrderAccess`, `OrderProgress` | B08 | Chưa tạo; tạo cùng support class move |
| `com.moonkage.order.storage` | `OrderFileService` | B09 | Chưa tạo; tạo cùng storage facade move |

Tổng cộng: **14 package mục tiêu mới**, phục vụ **26 type** trong migration plan đã duyệt.

### 4.1. Hiệu chỉnh listener target đã được tiếp nhận

Phase 04 ban đầu đề xuất `com.moonkage.order.messaging.listener`. Phase 05 phát hiện target này có thể tạo top-level package cycle `service ↔ messaging` theo ArchUnit rule hiện tại và đề xuất `com.moonkage.order.listener`.

Vì điều kiện Phase 07 xác nhận Phase 05 đã được Solution Architect phê duyệt, tài liệu này tiếp nhận `com.moonkage.order.listener` làm target chính thức cho B05. Không tạo `com.moonkage.order.messaging.listener`.

## 5. Package không được tạo

| Package | Quyết định | Lý do |
|---|---|---|
| `com.moonkage.order.messaging.listener` | Không tạo | Bị thay thế bởi `com.moonkage.order.listener` theo hiệu chỉnh Phase 05 để tránh package cycle |
| `com.moonkage.order.dto.event.common` | Không tạo | `EventEnvelope` tiếp tục ở `dto.event`; không tạo package một class không cần thiết |
| `com.moonkage.order.domain` | Không tạo | Order Service dùng pragmatic Layered Architecture; không tái cấu trúc sang Clean/Hexagonal Architecture |
| `com.moonkage.order.application` | Không tạo | Application service tiếp tục ở `service`/`service.impl` |
| `com.moonkage.order.port` hoặc `adapter` | Không tạo | Không thêm abstraction/pattern mới ngoài thiết kế đã duyệt |
| `com.moonkage.order.mapper` | Không tạo | Chưa có trách nhiệm/class cụ thể được duyệt cho package này |
| `common`, `util`, `misc` | Không tạo | Tên package không thể hiện trách nhiệm rõ ràng |

## 6. Quy tắc hình thành package trong từng batch

Mỗi package mới phải được tạo trong cùng change set với source file thực tế đầu tiên của package đó. Batch phải đồng thời:

1. di chuyển file vật lý;
2. cập nhật package declaration;
3. cập nhật toàn bộ import/reference bị ảnh hưởng;
4. không giữ duplicate class tại package cũ;
5. không đổi tên class hoặc refactor logic nếu batch chỉ được phê duyệt cho package move;
6. chạy compile/test và quality gate phù hợp trước khi chuyển batch tiếp theo.

Không tạo package trước batch và không để package mới chỉ chứa placeholder.

## 7. Điểm có thể ảnh hưởng tới build

| Khu vực | Ảnh hưởng có thể xảy ra | Kiểm soát trong batch sau |
|---|---|---|
| Java compile/import | Package declaration và imports phải thay đổi đồng bộ; test đang dùng simple name hoặc package-local access có thể bị lỗi compile | Compile và test ngay sau từng batch; cập nhật reference trong đúng phạm vi batch |
| Spring component scanning | `OrderServiceApplication` ở `com.moonkage.order`, nên 14 package mới đều là descendant và vẫn được scan mặc định | Không thêm `@ComponentScan`; xác nhận bean wiring bằng context/test hiện có |
| Spring Data/JPA | B03 di chuyển entity/repository; lỗi scan hoặc generic import có thể chỉ xuất hiện ở runtime integration test | Giữ nguyên JPA annotation/table mapping; chạy đầy đủ Docker-backed repository integration test trước và sau B03 |
| Rabbit listener | B05 chuyển listener sang root `listener`; annotation và queue/routing configuration phải giữ nguyên | Kiểm tra `@RabbitListener` discovery và application context; không dùng `messaging.listener` |
| Scheduled job | B05 chuyển `CheckoutExpiryJob`; `@EnableScheduling` ở application root vẫn bao phủ package mới | Kiểm tra bean discovery; không đổi cron/property |
| Jackson/event contract | B01–B02 thay đổi Java FQCN nhưng không được đổi field, annotation hoặc serialized JSON | Chạy serialization/deserialization và listener/service test liên quan |
| Reflection | Test hoặc code dùng FQCN/string-based lookup có thể không được compiler phát hiện | Search reference/FQCN trong từng batch và chạy test suite |
| Package-private access | `JpaOutboxEventSource` là package-private; di chuyển phải đi cùng các reference cần thiết và giữ khả năng bean discovery | Thực hiện trong B04 sau B03; compile và context verification |
| ArchUnit | Listener dưới `messaging.listener` có thể tạo cycle `service ↔ messaging` | Dùng root `listener`; giữ nguyên `NO_PACKAGE_CYCLES` và chạy ArchUnit sau B05/B06 |
| Checkstyle/Spotless/Error Prone | File move/import change có thể làm quality gate fail dù logic không đổi | Chạy Maven quality gates theo baseline; không sửa warning ngoài phạm vi migration |

## 8. Điều kiện trước khi bắt đầu migration source

Phase 06 ghi nhận baseline **PASS có điều kiện**:

- build, unit test, ArchUnit, Checkstyle và Spotless đạt;
- 6 JPA integration test bị skip vì Docker unavailable;
- giới hạn này là blocker trực tiếp cho B03/B04 hoặc batch ảnh hưởng entity/repository scanning.

Việc Solution Architect phê duyệt Phase 06 cho phép hoàn thành Phase 07, nhưng không tự động chứng minh Docker-backed baseline đã đầy đủ. Trước B03 phải có một trong hai điều kiện được ghi nhận rõ:

1. chạy lại repository integration test trong môi trường Docker/Testcontainers khả dụng và đạt; hoặc
2. Solution Architect chấp nhận verification environment tương đương.

Listener target không còn là blocker thiết kế trong tài liệu này vì target `com.moonkage.order.listener` được tiếp nhận từ Phase 05 đã phê duyệt.

## 9. Kết quả kiểm chứng Phase 07

Kiểm tra read-only đã xác nhận:

- 16 descendant package AS-IS tồn tại dưới `com.moonkage.order`;
- cả 14 target directory đều chưa tồn tại;
- `api/order-service` không có thay đổi source trong Git working tree;
- các tài liệu `docs/architecture/order` hiện là untracked và được giữ nguyên, không ghi đè nội dung phase trước.

Không chạy lại Maven build/test trong Phase 07 vì không có source, test, configuration hoặc dependency thay đổi. Kết quả baseline gần nhất vẫn là Phase 06.

## 10. Phạm vi thay đổi Phase 07

File được tạo:

- `docs/architecture/order/07_PACKAGE_STRUCTURE_PREPARATION.md` — ghi nhận package AS-IS, package sẽ hình thành theo batch, quy tắc tạo package và build impact.

Không thay đổi:

- Java source;
- test source;
- configuration hoặc dependency;
- API/event/database contract;
- cấu trúc thư mục source hiện tại.

## 11. Kết luận

Package structure đã được chuẩn bị ở mức thiết kế và migration readiness. Không cần và không nên tạo thư mục rỗng trong Phase 07. Mười bốn package mục tiêu sẽ được hình thành atomically trong B01–B09 khi class thực tế được di chuyển; `com.moonkage.order.listener` là target listener chính thức theo hiệu chỉnh Phase 05.

Phase 07 dừng tại đây, không thực hiện migration source.
