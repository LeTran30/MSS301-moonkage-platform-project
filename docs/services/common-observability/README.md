# common-observability (thư viện metric dùng chung)

> **Đây không phải service.** `common-observability` là một **thư viện Java** (`api/common-observability`) được các service nhúng vào dependency. Nó không chạy, không có cổng riêng, không có database, không có Dockerfile và không có health endpoint. Tài liệu này mô tả **API của thư viện** — tên metric, bộ đếm và hàm che PII.

Thư viện giữ **tên metric dùng chung** (BE-11b): cùng một tên metric ở hai service nghĩa là cùng một thứ, nên một dashboard hay một luật cảnh báo viết một lần là chạy được cho mọi service. Nó cũng giữ hàm che dữ liệu cá nhân trước khi ghi vào log (NFR-03, RT-03).

- Quyết định liên quan: NFR-03 (PII, [../../architecture/architecture-standards.md](../../architecture/architecture-standards.md) §4.7), RT-03 (log không chứa secret, [../../conventions/code-quality-rules.md](../../conventions/code-quality-rules.md)).

## Trách nhiệm

**Có trách nhiệm**

- Giữ **một** danh sách tên metric dùng chung, để dashboard và luật cảnh báo viết một lần là áp dụng cho mọi service.
- Cung cấp gauge đếm sự kiện outbox "đã ghi nhưng chưa phát" — dấu hiệu sớm nhất cho biết relay đang kẹt.
- Cung cấp bộ đếm của đường tiền: thanh toán thành công, đơn hàng đã tạo, IPN đã trả lời.
- Che e-mail và số điện thoại trước khi chúng đi vào dòng log.
- Đăng ký sẵn các bean metric vào context của mọi service, kèm cơ chế để service tự thay thế.

**Không có trách nhiệm**

- Không cấu hình actuator, không bật endpoint `prometheus`. Mỗi service tự khai báo trong `application.yml` của mình (`management.endpoints.web.exposure.include: health,prometheus`).
- Không lưu số đo. Số đo nằm trong registry của Micrometer của service; thư viện chỉ đăng ký tên và tag.
- Không gửi metric đi đâu. Việc scrape và lưu trữ là của Prometheus/Grafana ở hạ tầng, không nằm trong repo này.
- Không che PII trong **mọi** nơi: thư viện chỉ cung cấp hàm che, service phải gọi. Chưa có tracing (BE-11b còn lại) nên chưa áp che cho attribute của span.
- Không có database, không có migration.

## Cách phụ thuộc

Tọa độ Maven: `com.moonkage:common-observability:0.0.1-SNAPSHOT` (module `api/common-observability`, cha là `com.moonkage:api`). Service khai báo trong `pom.xml` của mình:

```xml
<dependency>
    <groupId>com.moonkage</groupId>
    <artifactId>common-observability</artifactId>
    <version>${project.version}</version>
</dependency>
```

Module này là **library jar** (`spring-boot.repackage.skip=true`). Nó kéo theo `spring-boot-starter-actuator`, `micrometer-core` và `micrometer-registry-prometheus` — nhờ đó service có sẵn `MeterRegistry` và định dạng scrape của `/actuator/prometheus`.

## API của thư viện

Package gốc `com.moonkage.observability`.

| Class | Loại | Mô tả |
|---|---|---|
| `MetricNames` | lớp final (hằng) | Tên metric dùng chung: `OUTBOX_EVENTS_UNPUBLISHED` (`outbox.events.unpublished`, gauge), `PAYMENT_IPN_TOTAL` (`payment.ipn`, counter), `PAYMENT_SUCCEEDED_TOTAL` (`payment.succeeded`, counter), `ORDER_CREATED_TOTAL` (`order.created`, counter), `LEDGER_BALANCE_MISMATCH_TOTAL` (`ledger.balance.mismatch`, gauge — hằng đã có nhưng **chưa** có nơi nào phát số đo này). Prometheus đổi dấu chấm thành gạch dưới: `outbox.events.unpublished` được scrape thành `outbox_events_unpublished`. |
| `OutboxMetrics` | bean | Gauge số sự kiện outbox chưa phát. Relay tự đẩy giá trị vào (`setUnpublished(long)`) thay vì đếm lúc scrape — nếu không sẽ có một truy vấn database trước Prometheus. Đọc giá trị hiện tại bằng `unpublished()`. |
| `MoneyMetrics` | bean | Bộ đếm của đường tiền: `paymentSucceeded(String purpose)`, `orderCreated(String kind)`, `ipnConfirmed()`, `ipnSignatureInvalid()`. `order.created` và `payment.succeeded` là hai nửa của cùng một câu hỏi: tiền đã đi mà đơn chưa có, hoặc có đơn mà tiền chưa tới. |
| `PiiMasker` | lớp final (hàm tĩnh) | `maskEmail(String)` → `l***n@example.com`; `maskPhone(String)` → `091****678`. Giá trị quá ngắn để che thì che hẳn (`***`); `null` hoặc rỗng thì trả chuỗi rỗng. |
| `ObservabilityAutoConfiguration` | `@AutoConfiguration` | Đăng ký `OutboxMetrics` và `MoneyMetrics` khi có `MeterRegistry`. |

### Auto-configuration đóng góp

`api/common-observability/src/main/resources/META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports`:

```
com.moonkage.observability.ObservabilityAutoConfiguration
```

Điều kiện: `@ConditionalOnClass(MeterRegistry.class)`, `@ConditionalOnBean(MeterRegistry.class)`, và mỗi bean `@ConditionalOnMissingBean` — service muốn có bộ đếm riêng (hoặc test muốn `SimpleMeterRegistry`) thì thay được mà không phải sửa class này.

Auto-configuration khai báo `@AutoConfiguration(after = {MetricsAutoConfiguration.class, PrometheusMetricsExportAutoConfiguration.class, SimpleMetricsExportAutoConfiguration.class})` — không có danh sách `after` thì nó được xếp trước các auto-configuration metric của Boot (package `com.moonkage` đứng trước `org.springframework`) và `MeterRegistry` chưa tồn tại lúc kiểm tra điều kiện.

## Ai đang dùng

Cả 8 module chạy được trong `api/pom.xml` đều khai báo dependency `common-observability` (gateway, identity, catalog, quotation, vendor, order, payment, orchestrator). `common-outbox` cũng phụ thuộc nó, vì relay cần gauge `OutboxMetrics`.

| Chỗ dùng | Ví dụ thật |
|---|---|
| Gauge outbox | `api/common-outbox/src/main/java/com/moonkage/outbox/OutboxRelay.java:80` — `outboxMetrics.setUnpublished(eventSource.countUnpublished())` |
| Bộ đếm tiền | `api/payment-service/src/main/java/com/moonkage/payment/service/impl/PaymentServiceImpl.java:248` — `moneyMetrics.paymentSucceeded(payment.getPurpose().name())`; `api/order-service/src/main/java/com/moonkage/order/service/impl/OrderServiceImpl.java:215` — `moneyMetrics.orderCreated(OrderKind.CUSTOM_ORDER.name())` |
| Che PII | `api/orchestrator-service/src/main/java/com/moonkage/orchestrator/infrastructure/mail/SmtpEmailSender.java:49` — `PiiMasker.maskEmail(to)`; `api/identity-service/src/main/java/com/moonkage/identity/email/EmailNotificationPublisher.java:25` |

## Cấu hình

Thư viện không có `@ConfigurationProperties` của riêng nó và không đọc khoá nào. Nó chỉ cần `MeterRegistry` của service — bean này do actuator + `micrometer-registry-prometheus` cung cấp (`api/common-observability/pom.xml` khai báo `micrometer-core`, `micrometer-registry-prometheus` và `spring-boot-starter-actuator`).

Phía service, để metric scrape được thì `application.yml` phải mở endpoint:

```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,prometheus
```

(ví dụ `api/order-service/src/main/resources/application.yml:62-66`).

## Chạy và kiểm thử

Thư viện không chạy riêng. Kiểm thử:

```bash
cd api
./mvnw -pl common-observability -am clean verify
```

## Xem thêm

- [../common-outbox/README.md](../common-outbox/README.md) — thư viện relay, nơi gauge outbox được đẩy giá trị.
- [../../architecture/be-improve-progress-2026-11-04.md](../../architecture/be-improve-progress-2026-11-04.md) — tiến độ BE-11b.
