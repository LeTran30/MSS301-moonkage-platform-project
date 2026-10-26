# Bàn giao cho owner orchestrator — audit phí liên tỉnh

Đây là ghi chú bàn giao, **không sửa code orchestrator và không gửi thông báo ra ngoài chat**. Sự kiện hiện do C1 catalog enqueue trong cùng transaction với bảng phí.

## Phần catalog đã có

- Exchange durable `moonkage.events`, routing key `interprovince_fee.changed` theo integration.md.
- Payload C1 hiện thực: `eventId`, `actorAccountId`, `occurredAt`, `before`, `after`; before/after là `{fees:[{provinceCode,provinceName,fee,effectiveFrom}],complete}`. Cả bảng 34 mã tỉnh; `before.fee` có thể null ở lần cấu hình đầu. Payload C1 cần hai owner thống nhất adapter; không coi schema domain events khác đã được duyệt theo đó.
- Outbox persistent JSON, AMQP messageId=eventId; chỉ mark published khi broker ACK và không có mandatory return. Không có binding → giữ pending và retry. Broker ACK có route chỉ chứng minh queue nhận, **không chứng minh audit đã lưu**.

## Việc orchestrator owner cần làm

1. Bind domain routing key vào durable queue, có DLQ/retry thích hợp. Không route thẳng domain payload này vào consumer AuditEvent cũ chỉ nghe `audit.#`: khác schema.
2. Adapter chuyển actor/time/before/after sang audit log (ví dụ action/target cho bảng phí, naming do orchestrator owner chốt); không chép thành PII hoặc log raw không cần thiết.
3. `processed_events` unique eventId và insert audit cùng một transaction; message redelivery/crash sau broker confirm không tạo hai audit. Không dùng occurredAt làm khóa dedup. Duplicate id nhưng payload xung đột cần cảnh báo/DLQ thay vì ghi đè.
4. ACK sau transaction DB thành công; lỗi transient retry, poison giữ lại để xử lý. Nếu đã bind nhưng adapter lỗi, catalog có thể đã published: orchestrator phải chịu trách nhiệm giữ/retry message trong queue, không dựa vào catalog pending nữa.

## Nghiệm thu phối hợp còn thiếu

- Cấu hình bảng phí → một audit đúng before/after; lần đầu null fees; toàn bộ 34 mã tỉnh.
- Publish trùng cùng eventId → một audit; lỗi DB orchestrator/khởi động lại → eventual audit, không mất.
- Catalog chưa có route → outbox pending; sau bind/recovery → audit lưu. Kiểm queue DLQ và backlog hai bên.
- Chốt payload/audit mapping với Lê Trần và owner orchestrator trước bật E2E. Task catalog Phase B không deploy, không mở PR hay tự nhắn owner bằng tool.
