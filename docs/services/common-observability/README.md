# common-observability (thư viện metric và tracing dùng chung)

> **Đây không phải service.** `common-observability` là một **thư viện Java** (`api/common-observability`) được các service nhúng vào dependency. Nó không chạy, không có cổng riêng, không có database, không có Dockerfile và không có health endpoint. Tài liệu này mô tả **API của thư viện** — tên metric, bộ đếm, hàm che PII và bộ lọc che PII cho span của trace.

Thư viện giữ **tên metric dùng chung** (BE-11b): cùng một tên metric ở hai service nghĩa là cùng một thứ, nên một dashboard hay một luật cảnh báo viết một lần là chạy được cho mọi service. Nó cũng giữ hàm che dữ liệu cá nhân trước khi ghi vào log (NFR-03, RT-03), và **che dữ liệu cá nhân trong span của trace** trước khi span rời khỏi service (BE-11).

- Quyết định liên quan: NFR-03 (PII, [../../architecture/architecture-standards.md](../../architecture/architecture-standards.md) §4.7), RT-03 (log không chứa secret, [../../conventions/code-quality-rules.md](../../conventions/code-quality-rules.md)), BE-11 (tracing, [../../architecture/be-improve-progress-2026-11-04.md](../../archive/2026-11-04-be-improve-progress.md)).

## Trách nhiệm

**Có trách nhiệm**

- Giữ **một** danh sách tên metric dùng chung, để dashboard và luật cảnh báo viết một lần là áp dụng cho mọi service.
- Cung cấp gauge đếm sự kiện outbox "đã ghi nhưng chưa phát" — dấu hiệu sớm nhất cho biết relay đang kẹt.
- Cung cấp bộ đếm của đường tiền: thanh toán thành công, đơn hàng đã tạo, IPN đã trả lời.
- Che e-mail và số điện thoại trước khi chúng đi vào dòng log.
- Che e-mail, số điện thoại, secret và số định danh trước khi chúng đi vào **span của trace**.
- Đăng ký sẵn các bean metric vào context của mọi service, kèm cơ chế để service tự thay thế.

**Không có trách nhiệm**

- Không cấu hình actuator, không bật endpoint `prometheus`. Mỗi service tự khai báo trong `application.yml` của mình (`management.endpoints.web.exposure.include: health,prometheus`).
- Không lưu số đo. Số đo nằm trong registry của Micrometer của service; thư viện chỉ đăng ký tên và tag.
- Không gửi metric đi đâu. Việc scrape và lưu trữ là của Prometheus/Grafana ở hạ tầng, không nằm trong repo này.
- Không gửi span đi đâu. Thư viện chỉ gắn cầu nối OTel và che dữ liệu; nơi nhận span là OTel Collector ở hạ tầng (xem mục *Tracing* bên dưới).
- Không che PII trong **mọi** nơi: thư viện chỉ cung cấp hàm che và bộ lọc, service phải gọi hàm che khi tự thêm key value của riêng mình.
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

Với tracing (BE-11) nó kéo thêm `micrometer-tracing-bridge-otel` và `opentelemetry-exporter-otlp`: bridge biến span của Micrometer thành span của OpenTelemetry, exporter gửi span đó đi theo giao thức OTLP. Phiên bản lấy từ BOM của Spring Boot nên luôn khớp với actuator đang dùng.

## API của thư viện

Package gốc `com.moonkage.observability`.

| Class | Loại | Mô tả |
|---|---|---|
| `MetricNames` | lớp final (hằng) | Tên metric dùng chung: `OUTBOX_EVENTS_UNPUBLISHED` (`outbox.events.unpublished`, gauge), `PAYMENT_IPN_TOTAL` (`payment.ipn`, counter), `PAYMENT_SUCCEEDED_TOTAL` (`payment.succeeded`, counter), `ORDER_CREATED_TOTAL` (`order.created`, counter), `LEDGER_BALANCE_MISMATCH_TOTAL` (`ledger.balance.mismatch`, gauge — hằng đã có nhưng **chưa** có nơi nào phát số đo này). Prometheus đổi dấu chấm thành gạch dưới: `outbox.events.unpublished` được scrape thành `outbox_events_unpublished`. |
| `OutboxMetrics` | bean | Gauge số sự kiện outbox chưa phát. Relay tự đẩy giá trị vào (`setUnpublished(long)`) thay vì đếm lúc scrape — nếu không sẽ có một truy vấn database trước Prometheus. Đọc giá trị hiện tại bằng `unpublished()`. |
| `MoneyMetrics` | bean | Bộ đếm của đường tiền: `paymentSucceeded(String purpose)`, `orderCreated(String kind)`, `ipnConfirmed()`, `ipnSignatureInvalid()`. `order.created` và `payment.succeeded` là hai nửa của cùng một câu hỏi: tiền đã đi mà đơn chưa có, hoặc có đơn mà tiền chưa tới. |
| `PiiMasker` | lớp final (hàm tĩnh) | `maskEmail(String)` → `l***n@example.com`; `maskPhone(String)` → `091****678`. Giá trị quá ngắn để che thì che hẳn (`***`); `null` hoặc rỗng thì trả chuỗi rỗng. |
| `PiiMaskingObservationFilter` | lớp final (`ObservationFilter`) | Che dữ liệu cá nhân của **mọi** observation trước khi nó được gắn vào span. Xem mục *Tracing* bên dưới. |
| `ObservabilityAutoConfiguration` | `@AutoConfiguration` | Đăng ký `OutboxMetrics` và `MoneyMetrics` khi có `MeterRegistry`. |
| `PiiMaskingAutoConfiguration` | `@AutoConfiguration` | Đăng ký `PiiMaskingObservationFilter` khi có `ObservationFilter` trên classpath. |

### Auto-configuration đóng góp

`api/common-observability/src/main/resources/META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports`:

```
com.moonkage.observability.ObservabilityAutoConfiguration
com.moonkage.observability.PiiMaskingAutoConfiguration
```

Điều kiện: `@ConditionalOnClass(MeterRegistry.class)`, `@ConditionalOnBean(MeterRegistry.class)`, và mỗi bean `@ConditionalOnMissingBean` — service muốn có bộ đếm riêng (hoặc test muốn `SimpleMeterRegistry`) thì thay được mà không phải sửa class này.

Auto-configuration khai báo `@AutoConfiguration(after = {MetricsAutoConfiguration.class, PrometheusMetricsExportAutoConfiguration.class, SimpleMetricsExportAutoConfiguration.class})` — không có danh sách `after` thì nó được xếp trước các auto-configuration metric của Boot (package `com.moonkage` đứng trước `org.springframework`) và `MeterRegistry` chưa tồn tại lúc kiểm tra điều kiện.

`PiiMaskingAutoConfiguration` thì khai báo `@AutoConfiguration(before = ObservationAutoConfiguration.class)` — nó phải có mặt trước khi Boot gom các bean `ObservationFilter` vào registry, nếu không thì filter đăng ký muộn và không được dùng.

## Tracing (BE-11)

### Vì sao lại cần một bộ lọc riêng

Một dòng log được một người đọc, và người đó được dặn không sao chép nó đi. Một span thì khác: nó được gửi tới collector và giữ lại nhiều ngày. Span của một request HTTP mang theo URL, span của một message RabbitMQ mang theo routing key, và service có thể tự thêm bất kỳ key value nào. Vì vậy luật của log áp cho trace: **đủ để phân biệt hai người gọi, không đủ để nhận ra một người**.

`PiiMaskingObservationFilter` là một `ObservationFilter`, không phải một `ObservationHandler`, là có chủ đích. Micrometer chạy các filter của một observation **trước** các handler của nó, và handler của tracing chính là thứ chép key value lên span. Nhờ vậy dữ liệu bị che trước khi bất kỳ ai kịp đọc — không phải lo thứ tự, không phụ thuộc thứ tự các handler được đăng ký.

### Bộ lọc che gì

Quy tắc bị quyết định bởi **tên** của key value:

| Tên key (đã chuẩn hoá: chữ thường, `-` → `_`) | Cách che |
|---|---|
| `email`, `e_mail`, `mail`, `email_address` | `PiiMasker.maskEmail` |
| `phone`, `phone_number`, `mobile`, `msisdn` | `PiiMasker.maskPhone` |
| `password`, `secret`, `token`, `authorization`, `api_key`… | thay bằng `[secret]` |
| `id_number`, `national_id`, `identity_number`… | thay bằng `[redacted]` |
| `uri`, `url`, `http_url`, `http.url`, `url.full`… | che **từng tham số** của query string, giữ nguyên path |

Ngoài ra, một khoá mà **tên của nó kết thúc bằng** `.uri`, `.url`, `_uri` hay `_url` cũng được coi là khoá URL — vì tên đầy đủ của một khoá quen thuộc (`http.uri`) không nằm trong bất kỳ danh sách cố định nào.

Hai lưới an toàn phủ trường hợp tên key không nói lên điều gì: một giá trị mà **hoàn toàn** là e-mail hoặc **hoàn toàn** là số điện thoại thì bị che bất kể nó được gọi tên gì; và query string của một URL được che theo từng tham số, nên `?page=2&sort=name` sống nguyên.

> **Bài học từ lúc kiểm chứng thật (2026-11-07):** bộ dò "trông như e-mail" phải kiểm tra **cả phần trước `@` lẫn tên miền** (chỉ chữ, số, `.`, `-`). Nếu không, một URL như `https://host/api?email=a@b.com` bị nhận nhầm là e-mail — bộ che che mất phần `?email=...` nhưng **để lộ số điện thoại** nằm trong query string. Test `aUrlIsNotMistakenForAnEmailAddress` khoá lại đúng hành vi này.

### Ai đang dùng

| Chỗ dùng | Ví dụ thật |
|---|---|
| Che PII trong log | `api/orchestrator-service/src/main/java/com/moonkage/orchestrator/infrastructure/mail/SmtpEmailSender.java:49` — `PiiMasker.maskEmail(to)`; `api/identity-service/src/main/java/com/moonkage/identity/email/EmailNotificationPublisher.java:25` |
| Che PII trong span | `api/common-observability/src/main/java/com/moonkage/observability/PiiMaskingAutoConfiguration.java:32` — đăng ký filter cho mọi service |
| Test của bộ lọc | `api/common-observability/src/test/java/com/moonkage/observability/PiiMaskingObservationFilterTest.java` |

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

### Cấu hình tracing của service

Mỗi service bật tracing bằng cùng một khối cấu hình (giá trị mặc định trỏ về Collector chạy trên máy dev):

```yaml
management:
  tracing:
    enabled: ${TRACING_ENABLED:true}
    sampling:
      probability: ${TRACING_SAMPLING_PROBABILITY:1.0}
    propagation:
      produce: [W3C]
      consume: [W3C]
  otlp:
    tracing:
      endpoint: ${OTLP_TRACING_ENDPOINT:http://localhost:4318/v1/traces}
      transport: http
  opentelemetry:
    resource-attributes:
      service.namespace: moonkage
      service.group: moonkage-platform
```

| Khoá | Ý nghĩa |
|---|---|
| `management.tracing.enabled` | Tắt tracing cho một môi trường không có Collector. Khi tắt, service không có bean `Tracer` và mọi sự kiện bắt đầu trace riêng. |
| `management.tracing.sampling.probability` | `1.0` ghi lại mọi trace (dev); môi trường thật lấy mẫu ít hơn. |
| `management.tracing.propagation` | `W3C` là định dạng header `traceparent` mà HTTP và AMQP cùng dùng. |
| `management.otlp.tracing.endpoint` | Nơi nhận span. Trong Docker Compose là `http://otel-collector:4318/v1/traces`, khi chạy từ IDE là `http://localhost:4318/v1/traces`. |
| `management.opentelemetry.resource-attributes` | Thuộc tính mà Collector dùng để gom các trace theo nhóm. |

Service nào có RabbitMQ thì bật thêm quan sát cho message:

```yaml
spring:
  rabbitmq:
    template:
      observation-enabled: true
    listener:
      simple:
        observation-enabled: true
```

Cờ này làm cho span của lúc **phát** và lúc **nhận** message tồn tại, và header `traceparent` được chèn vào message AMQP — nhờ đó consumer tiếp tục đúng trace của request đã sinh ra sự kiện.

## Chạy và kiểm thử

Thư viện không chạy riêng. Kiểm thử:

```bash
cd api
./mvnw -pl common-observability -am clean verify
```

## Xem thêm

- [../common-outbox/README.md](../common-outbox/README.md) — thư viện relay, nơi gauge outbox được đẩy giá trị và nơi trace context được mang qua hàng đợi.
- [../../architecture/be-improve-progress-2026-11-04.md](../../archive/2026-11-04-be-improve-progress.md) — tiến độ BE-11b và BE-11.
- [../../architecture/debt-implementation-plan.md](../../work/plans/debt-implementation-plan.md) — hạng mục C-2 (OpenTelemetry tracing).
