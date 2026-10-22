# orchestrator-service (`orchestrator_db`)

> **Trạng thái:** Đề xuất (2026-10-22). Một phần của [phác thảo API và database](README.md); quyết định ở [decisions.md](decisions.md).
>
> **Migration:** không có (schema đã đủ, chỉ cần thêm `processed_events` khi viết consumer).

Service này thay `notification-service` của thiết kế: nhận mọi sự kiện, ghi audit, lưu thông báo trong ứng dụng, đẩy WebSocket và gửi email (D-23 đang mở). Schema đã có 3 bảng; cần thêm bảng chống xử lý sự kiện trùng.

**Bảng**

| Bảng | Cột chính | Ràng buộc | Nguồn |
| --- | --- | --- | --- |
| `audit_logs` | `id`, `source_service`, `actor_account_id`, `action`, `target_type`, `target_id`, `before_value`, `after_value`, `reason`, `occurred_at`, `received_at` | User DB chỉ có INSERT, SELECT; payload chỉ chứa số đã che | NFR-07 |
| `notifications` | `id`, `recipient_account_id`, `type`, `title`, `content`, `target_url`, `is_read`, `created_at` | Index `(recipient_account_id, is_read, created_at)` | NFR-10 |
| `notification_event_logs` | `event_id` (PK), `template_code`, `recipient`, `subject`, `status` (PENDING, SENT, FAILED), `error_message`, `sent_at` | Mỗi sự kiện email gửi một lần | A-17 |
| `processed_events` **Mới** | `event_id` (PK), `routing_key`, `processed_at` | Bỏ qua sự kiện đã xử lý. Khác `notification_event_logs`: bảng này chống xử lý lặp một sự kiện, bảng kia ghi kết quả gửi email để thử lại | Software Design 5.4 |

**API công khai**

**Root Notification** (`/api/notifications`)

| Method, đường dẫn | Ai | Mục đích | FR |
| --- | --- | --- | --- |
| `GET /api/notifications?unreadOnly=&page=` | M | Thông báo của mình; `data.unreadCount` cho biểu tượng chuông | NFR-10 |
| `PATCH /api/notifications/{notificationId}` | M | `{read: true}` | NFR-10 |
| `PATCH /api/notifications` | M | `{read: true}` cho mọi thông báo của mình | NFR-10 |
| `/ws` (STOMP) | M | `/user/queue/notifications`; `/user/queue/nfc` cho trang QR tự cập nhật | AC-04.5, NFR-10 |

**Root AuditLog** (`/api/audit-logs`, chỉ đọc)

| Method, đường dẫn | Ai | Mục đích | FR |
| --- | --- | --- | --- |
| `GET /api/audit-logs?targetType=&targetId=&actorAccountId=&from=&to=` | A | Tra cứu audit | NFR-07 |
| `GET /api/audit-logs/{auditLogId}` | A | Chi tiết giá trị trước / sau | NFR-07 |

## Sự kiện và API nội bộ

**Phát**

- Đẩy WebSocket `/user/queue/notifications`, `/user/queue/nfc`

**Nghe**

- Mọi sự kiện có thông báo hoặc audit (xem [integration.md](integration.md))

**API nội bộ**

- Không có API nội bộ

## Quyết định liên quan

[L-17](decisions.md).
