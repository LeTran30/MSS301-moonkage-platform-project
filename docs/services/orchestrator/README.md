# Thông báo, nhật ký kiểm toán và đẩy realtime (orchestrator-service)

orchestrator-service là service **nhận sự kiện** của toàn hệ thống: nhận thông báo trong ứng dụng, gửi email, ghi nhật ký kiểm toán và đẩy thông báo realtime qua WebSocket. Nó không giữ dữ liệu nghiệp vụ của service nào — nó chỉ nhận sự kiện và phát ra kết quả.

- Hợp đồng API + schema: [api-db/orchestrator.md](../../architecture/api-db/orchestrator.md). Khi tài liệu này lệch với `orchestrator.md`, `orchestrator.md` đúng.
- Quyết định liên quan: [api-db/decisions.md](../../architecture/api-db/decisions.md).

## Trách nhiệm

**Có trách nhiệm**

- Hộp thư thông trong ứng dụng (`notifications`): lưu, phân trang, đánh dấu đã đọc (NFR-10).
- Gửi email qua SMTP, render template bằng Thymeleaf; nhận email trong hàng đợi riêng có dead-letter (A-17).
- Nhật ký kiểm toán bất biến (`audit_logs`): ai làm gì, khi nào, giá trị trước/sau (NFR-07).
- Đẩy realtime qua STOMP trên WebSocket (`/ws`): `/user/queue/notifications` và `/user/queue/nfc` (AC-04.5).
- Ghi kết quả gửi từng sự kiện vào `notification_event_logs` để thử lại được và để chống gửi trùng.

**Không có trách nhiệm**

- Không quyết định ai cần được thông báo. Người phát sự kiện (order, payment, vendor, identity…) quyết định nội dung; orchestrator chỉ nhận và gửi.
- Không gửi email OTP trực tiếp từ identity: identity phát `orchestrator.email.identity`, orchestrator gửi mail và template.
- Không có API quản trị đọc audit. `api-db/orchestrator.md` còn vẽ `GET /api/audit-logs`, nhưng **trong code chưa có controller nào** phục vụ đường dẫn này — xem mục "Chưa làm".
- Không có API nội bộ (`/internal/**`).

## Bounded context

| Đối tượng | Bảng | Đường dẫn gốc |
|---|---|---|
| Notification | `notifications` | `/api/notifications` |
| AuditLog | `audit_logs` | (chưa có endpoint) |
| NotificationEventLog | `notification_event_logs` | (kỹ thuật) |

Khác với các service khác, orchestrator-service **không** có bảng `outbox_events` / `processed_events` trong code: nó chỉ nhận, không phát sự kiện domain. Chống gửi trùng dựa trên `notification_event_logs.event_id` (một sự kiện đã `SENT` thì bỏ qua).

## API công khai

Đọc danh tính từ header `X-Account-Id` do gateway gắn (`GatewayHeader.ACCOUNT_ID`). Response bọc trong `ApiResponse<T>` của `common-api`.

Cột **Ai** dùng mã vai: **M** = `MEMBER` (người dùng nhận thông báo).

| Method, đường dẫn | Ai | Việc |
|---|---|---|
| `GET /api/notifications?page=&size=` | M | Thông báo của mình, mới nhất trước; `data.unreadCount` cho biểu tượng chuông; `size` tối đa 100 |
| `POST /api/notifications/{notificationId}/read` | M | Đánh dấu một thông báo đã đọc |
| `POST /api/notifications/read-all` | M | Đánh dấu tất cả thông báo đã đọc; trả số thông báo còn chưa đọc |

**Realtime (STOMP)**

| Điểm đích | Nội dung |
|---|---|
| `/ws` | Endpoint WebSocket (mở ở mức HTTP; token kiểm ở khung STOMP `CONNECT`) |
| `/user/queue/notifications` | Thông báo trong ứng dụng vừa gửi |
| `/user/queue/nfc` | Kết quả xác minh NFC (không có dữ liệu thẻ, kể cả dạng che) |

Broker STOMP là broker in-memory (`enableSimpleBroker`), không phải RabbitMQ: đẩy realtime chỉ là gợi ý cho trang đang mở; web vẫn poll được.

## Dữ liệu

Schema do Flyway quản lý (`api/orchestrator-service/src/main/resources/db/migration`).

| Bảng | Vai trò |
|---|---|
| `notifications` | Thông báo trong ứng dụng: `recipient_account_id`, `type`, `title`, `content`, `target_url`, `is_read`, `created_at`; index `(recipient_account_id, is_read)` và `created_at` |
| `audit_logs` | Nhật ký kiểm toán bất biến: `source_service`, `actor_account_id`, `action`, `target_type`, `target_id`, `before_value`, `after_value`, `reason`, `occurred_at`, `received_at`; index theo `(target_type, target_id)` và `actor_account_id` |
| `notification_event_logs` | Kết quả gửi từng sự kiện: `event_id` (khóa chính), `template_code`, `recipient`, `subject`, `status` (`PENDING`, `SENT`, `FAILED`), `error_message`, `sent_at` |

## Sự kiện

**Phát:** không có. orchestrator-service không ghi outbox.

**Nghe** (`api/orchestrator-service/src/main/java/com/moonkage/orchestrator/infrastructure/messaging/RabbitConfig.java`), exchange `moonkage.events`:

| Queue | Routing key | Loại sự kiện | Xử lý |
|---|---|---|---|
| `orchestrator.email.queue` | `orchestrator.email.#` | `EMAIL` | Render template rồi gửi qua SMTP; lỗi không retry được thì ném `AmqpRejectAndDontRequeueException` → dead-letter |
| `orchestrator.inapp.queue` | `orchestrator.inapp.#` | `IN_APP` | Lưu `notifications` rồi đẩy realtime |
| `orchestrator.audit` | `audit.#` | `AUDIT` | Ghi `audit_logs` |
| `orchestrator.nfc` | `account.nfc_verified`, `account.nfc_failed`, `account.nfc_locked` | `NFC_VERIFICATION` | Ghi audit và đẩy realtime `/user/queue/nfc` |

Dead letter: `orchestrator.email.dlq`, gắn với dead-letter exchange `moonkage.events.dlx`.

Cấu hình listener: `spring.rabbitmq.listener.simple.retry.max-attempts=3`, `default-requeue-rejected=false` — message hỏng sau 3 lần thì bị drop (có log), không requeue vô hạn.

## Phụ thuộc

orchestrator-service **không gọi service nào qua Feign**. Nó chỉ nhận sự kiện qua RabbitMQ và gửi email qua SMTP.

Một số service hiện chưa có đường đưa sự kiện tới orchestrator: ví dụ identity-service khai báo routing key `orchestrator.email.identity` (`api/identity-service/src/main/java/com/moonkage/identity/common/config/RabbitConfig.java`) nhưng orchestrator nghe theo mẫu `orchestrator.email.#` — khớp. Ngược lại, các sự kiện `order.*`, `payment.*` mà order/payment phát **không** khớp mẫu `orchestrator.inapp.#` hay `orchestrator.email.#`, nên chúng không tới hộp thư; xem mục "Chưa làm".

## Cấu trúc mã

Theo kiểu hexagonal, khác các service khác:

| Package | Vai trò |
|---|---|
| `web` | Controller HTTP (`NotificationController`), xử lý lỗi (`ApiExceptionHandler`) |
| `application` | `NotificationService`, `dispatcher` (`EventDispatcher`, `DefaultEventDispatcher`), `port` (interface repository, `EmailSender`, `TemplateRenderer`, `RealtimePublisher`, `EventHandler`) |
| `channel` | Một handler cho mỗi kênh: `email`, `inapp`, `audit`, `nfc` |
| `contract` | Dạng sự kiện nhận vào (`BaseEvent`, `EmailNotificationEvent`, `InAppNotificationEvent`, `AuditEvent`, `NfcVerificationEvent`, `EventType`) và DTO response |
| `domain` | Entity `Notification`, `AuditLog`, `NotificationEventLog`; enum `DeliveryStatus` |
| `infrastructure` | `messaging` (RabbitConfig, consumer), `persistence` (repository JPA), `mail` (`SmtpEmailSender`), `template` (`ThymeleafTemplateRenderer`), `websocket` (`WebSocketConfig`, `StompAuthInterceptor`, `AccessTokenVerifier`, `StompRealtimePublisher`), `config` |

## Cấu hình và chạy local

Cổng `8088`, database `orchestrator_db` (`ORCHESTRATOR_DB_HOST` / `ORCHESTRATOR_DB_PORT`, mặc định `localhost:5447`). Biến lấy từ `.env` ở thư mục gốc repo.

| Biến / khóa | Ghi chú |
|---|---|
| `ORCHESTRATOR_DB_HOST`, `ORCHESTRATOR_DB_PORT` | `orchestrator_db` |
| `RABBITMQ_HOST`, `RABBITMQ_PORT`, `RABBITMQ_USERNAME`, `RABBITMQ_PASSWORD` | Broker sự kiện |
| `EUREKA_URL` | `http://localhost:8761/eureka/` |
| `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD` | SMTP gửi email. Để trống `MAIL_HOST` thì email chỉ được ghi log |
| `JWT_SECRET` | Cùng khóa HS256 với identity-service và api-gateway; dùng để kiểm token trên STOMP `CONNECT` |
| `CORS_ORIGINS` | Origin được phép mở WebSocket (kiểm lúc handshake) |
| `moonkage.mail.blocked-domains` | `mk.com` — không gửi mail thật tới domain tài khoản mẫu |

Chạy:

```bash
cd api
./mvnw -pl orchestrator-service -am spring-boot:run
```

Trên Windows dùng `mvnw.cmd`. Cần Postgres `orchestrator_db` và RabbitMQ đã bật (xem [../../guides/getting-started.md](../../guides/getting-started.md)).

## Chưa làm

- Chưa có endpoint đọc `audit_logs` (`GET /api/audit-logs` như trong [api-db/orchestrator.md](../../architecture/api-db/orchestrator.md)) — audit hiện chỉ ghi, chưa có đường đọc qua HTTP.
- Chưa có adapter nhận sự kiện domain (`order.*`, `payment.*`, `vendor.*`, `product.*`) để sinh thông báo trong ứng dụng hoặc email. Các routing key đó không khớp `orchestrator.inapp.#` / `orchestrator.email.#`, nên hiện **không** service nào ngoài identity gửi được thông báo tới hộp thư.
- Chưa có bảng `processed_events` (inbox) như các service khác; chống trùng dựa trên `notification_event_logs`.

## Kiểm thử

```bash
cd api
./mvnw -pl orchestrator-service -am clean verify
```
