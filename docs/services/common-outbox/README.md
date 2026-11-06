# common-outbox (thư viện relay outbox)

> **Đây không phải service.** `common-outbox` là một **thư viện Java** (`api/common-outbox`) được các service có bảng `outbox_events` nhúng vào dependency. Nó không chạy, không có cổng riêng, không có database, không có Dockerfile và không có health endpoint. Tài liệu này mô tả **API của thư viện** — phần đọc bảng outbox của service và phát sự kiện lên RabbitMQ.

Thư viện lo phần **phát sự kiện** của mẫu transactional outbox: service ghi sự kiện vào bảng `outbox_events` của chính nó trong cùng transaction với thay đổi nghiệp vụ, rồi relay của thư viện đọc các dòng đó và đẩy lên exchange `moonkage.events`. Mẫu này là **BẮT BUỘC** theo [architecture-standards §4.6](../../architecture/architecture-standards.md); thư viện này là chỗ duy nhất chứa logic phát sự kiện dùng chung.

- Quyết định liên quan: Software Design [mục 5.4](../../architecture/software-design.md) (sự kiện và mẫu transactional outbox) và [architecture-standards §4.6](../../architecture/architecture-standards.md) (quy tắc Outbox/Inbox).

## Trách nhiệm

**Có trách nhiệm**

- Đọc một lô sự kiện chưa phát từ bảng outbox của service, **cũ nhất trước**, để các sự kiện của cùng một aggregate tới consumer đúng thứ tự.
- Phát từng sự kiện lên topic exchange `moonkage.events` với routing key của nó, và chỉ đánh dấu "đã phát" **sau khi** broker đã publisher-confirm.
- Khi gửi hỏng, dừng lô và thử lại từ sự kiện đó ở lần chạy sau — thứ tự sự kiện được giữ.
- Ghi số sự kiện "đã ghi nhưng chưa phát" vào gauge dùng chung `outbox.events.unpublished` (BE-11b) — dấu hiệu sớm nhất cho biết relay đang kẹt.
- Cung cấp tên exchange dùng chung để mọi service khai báo cùng một broker topic.

**Không có trách nhiệm**

- Không sở hữu bảng `outbox_events`. Bảng và entity là của **service**; thư viện chỉ biết interface `OutboxEventSource`.
- Không ghi sự kiện mới. Việc ghi event vào outbox thuộc service (repository của service).
- Không quản lý hàng đợi consumer, không bind queue, không xử lý sự kiện nhận về — phần consumer thuộc service khác.
- Không retry vô hạn và không bỏ sự kiện: sự kiện gửi hỏng thì tăng `attempts` và thử lại ở lần chạy sau.
- Không đảm bảo "đúng một lần": relay chạy ở **một** instance của service (hai instance sẽ gửi trùng; consumer chống xử lý lặp bằng `eventId`).
- Không có database, không có migration — migration tạo bảng `outbox_events` thuộc từng service.

## Cách phụ thuộc

Tọa độ Maven: `com.moonkage:common-outbox:0.0.1-SNAPSHOT` (module `api/common-outbox`, cha là `com.moonkage:api`). Service khai báo trong `pom.xml` của mình:

```xml
<dependency>
    <groupId>com.moonkage</groupId>
    <artifactId>common-outbox</artifactId>
    <version>${project.version}</version>
</dependency>
```

Module này là **library jar** (`spring-boot.repackage.skip=true`). Nó phụ thuộc `common-observability` (cần gauge `OutboxMetrics`), nên service khai báo `common-outbox` là đủ — không cần khai báo thêm `common-observability` để relay chạy (nhưng service muốn dùng `MoneyMetrics`/`PiiMasker` thì vẫn khai báo riêng).

## API của thư viện

Package gốc `com.moonkage.outbox`.

| Class | Loại | Mô tả |
|---|---|---|
| `OutboxRelay` | lớp | Bean `@Scheduled` đọc lô sự kiện chưa phát, phát lên RabbitMQ, đánh dấu đã phát sau publisher confirm. Lỗi `AmqpException` thì tăng `attempts` và dừng lô. |
| `OutboxEventSource` | interface | Bốn thao tác relay cần từ bảng outbox của service: `findUnpublished(Pageable)`, `countUnpublished()`, `markPublished(String, Instant)`, `incrementAttempts(String)`. Service hiện thực trên repository của chính nó. |
| `OutboxEventRow` | record | Ảnh chụp chỉ-đọc của một dòng outbox: `id` (gửi kèm làm AMQP message id), `routingKey`, `payload` (JSON đúng như đi trên dây), `attempts`. |
| `OutboxProperties` | `@ConfigurationProperties("outbox")` | Cấu hình relay: `exchange`, `batchSize`, `confirmTimeout`. |
| `OutboxAutoConfiguration` | `@AutoConfiguration` | Đăng ký bean `OutboxRelay` khi service có `OutboxEventSource` và khi `outbox.enabled` không bị tắt. |
| `EventExchange` | lớp final (hằng) | Tên topic exchange dùng chung: `NAME = "moonkage.events"`. |

### Auto-configuration đóng góp

`api/common-outbox/src/main/resources/META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports`:

```
com.moonkage.outbox.OutboxAutoConfiguration
```

Điều kiện đăng ký: `@ConditionalOnClass(RabbitTemplate.class)`, `@ConditionalOnBean(OutboxEventSource.class)`, `@ConditionalOnMissingBean`, `@ConditionalOnProperty(prefix = "outbox", name = "enabled", havingValue = "true", matchIfMissing = true)`, và `@EnableConfigurationProperties(OutboxProperties.class)`.

Auto-configuration khai báo `@AutoConfiguration(after = ObservabilityAutoConfiguration.class)` — nó phải đứng sau auto-configuration metric của `common-observability`, nếu không `MeterRegistry` chưa tồn tại lúc kiểm tra điều kiện.

## Ai đang dùng

| Service | Dùng để |
|---|---|
| identity-service | phát sự kiện của identity (kèm `JpaOutboxEventSource` tại `api/identity-service/src/main/java/com/moonkage/identity/outbox/JpaOutboxEventSource.java`) |
| vendor-service | phát `product.upserted` và các sự kiện người bán (`api/vendor-service/src/main/java/com/moonkage/vendor/outbox/JpaOutboxEventSource.java`) |
| quotation-service | phát sự kiện báo giá (`api/quotation-service/src/main/java/com/moonkage/quotation/messaging/JpaOutboxEventSource.java`) |
| order-service | phát sự kiện đơn hàng (`api/order-service/src/main/java/com/moonkage/order/messaging/JpaOutboxEventSource.java`) |
| payment-service | phát sự kiện thanh toán (`api/payment-service/src/main/java/com/moonkage/payment/messaging/JpaOutboxEventSource.java`) |

`catalog-service` và `orchestrator-service` cũng khai báo dependency `common-outbox` chỉ để dùng `EventExchange.NAME` trong `RabbitConfig` của mình (`api/catalog-service/src/main/java/com/moonkage/catalog/config/RabbitConfig.java:14`, `api/orchestrator-service/src/main/java/com/moonkage/orchestrator/infrastructure/messaging/RabbitConfig.java:24`). Riêng `catalog-service` có **relay riêng** (`api/catalog-service/src/main/java/com/moonkage/catalog/scheduling/CatalogOutboxRelay.java` + `OutboxDeliveryServiceImpl`) vì nó chỉ đọc event, phát từng sự kiện một và dùng `CorrelationData` để chờ confirm thay vì `waitForConfirmsOrDie`; nó không có `OutboxEventSource` nên không được auto-configuration đăng ký relay dùng chung.

## Cấu hình

`OutboxProperties` (`@ConfigurationProperties(prefix = "outbox")`) — mặc định chỉ có tác dụng khi một khoá thiếu trong `application.yml` (ví dụ trong unit test).

| Khoá | Mặc định | Ý nghĩa |
|---|---|---|
| `outbox.exchange` | `moonkage.events` (`OutboxRelay.DEFAULT_EVENTS_EXCHANGE`) | Topic exchange phát sự kiện. |
| `outbox.batch-size` | `100` | Số sự kiện gửi trong một lần chạy relay. |
| `outbox.confirm-timeout` | `5s` | Thời gian chờ publisher confirm của broker cho một sự kiện. |
| `outbox.relay-interval` | `2s` | Chu kỳ chạy relay. **Đọc trực tiếp trong `@Scheduled(fixedDelayString = "${outbox.relay-interval:2s}")`**, không nằm trong `OutboxProperties`. |
| `outbox.enabled` | `true` | Có đăng ký relay hay không. Service chỉ **nhận** sự kiện mà không có bảng outbox thì đặt `false`. |

Cấu hình mẫu trong service: `api/order-service/src/main/resources/application.yml:76-81` (`exchange: moonkage.events`, `relay-interval: 2s`, `batch-size: 100`, `confirm-timeout: 5s`). Cùng khoá, cùng giá trị ở identity, quotation, vendor, payment.

Relay cần `spring.rabbitmq.publisher-confirm-type: simple` — `OutboxRelay` gọi `ops.waitForConfirmsOrDie(...)` nên không có confirm thì không có gì được đánh dấu đã phát.

## Luật bất biến

1. Sự kiện được gửi theo thứ tự cũ → mới; lỗi một sự kiện thì dừng lô, không nhảy qua.
2. Một dòng chỉ được đánh dấu "đã phát" **sau** publisher confirm của broker.
3. Relay chạy ở một instance duy nhất của service.
4. Exchange luôn là `moonkage.events`; routing key quyết định service nào đọc.

## Chạy và kiểm thử

Thư viện không chạy riêng. Kiểm thử:

```bash
cd api
./mvnw -pl common-outbox -am clean verify
```

## Xem thêm

- [../common-observability/README.md](../common-observability/README.md) — thư viện metric, nơi `outbox.events.unpublished` được đăng ký.
- [../common-api/README.md](../common-api/README.md) — thư viện hợp đồng HTTP.
