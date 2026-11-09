# Class Log: OutboxDeliveryServiceImpl

## 1. Thông tin chung và bất biến

- Package: `com.moonkage.catalog.service.impl`; NFR-05; dependencies OutboxEventRepository, RabbitTemplate, CatalogOutboxProperties, Clock.
- Không đánh dấu published trước broker confirm. ACK nhưng message bị trả lại vì không route vẫn là thất bại. Chỉ khóa một dòng outbox trong mỗi transaction; không giữ khóa bảng phí khi publish.

## 2. Method

| Method | Input | Output | Ngoại lệ | Mục đích |
| --- | --- | --- | --- | --- |
| deliverNext | — | boolean | DB errors truyền ra | Lock/publish một event; false nếu hết việc hoặc delivery lỗi |
| send | OutboxEvent | boolean | Bắt AMQP/future/timeout, bảo toàn interrupt | Publish và đợi confirm tối đa 5 giây |

## 3. Luồng

1. Guard: lấy dòng pending sớm nhất bằng `FOR UPDATE SKIP LOCKED`; rỗng thì false. Mỗi worker bỏ qua dòng worker khác đang giữ.
2. Nghiệp vụ: tạo persistent JSON message, UTF-8, messageId=eventId; gửi exchange theo routingKey với CorrelationData.
3. Persistence/events: chờ future confirm. ACK và không returned → mark published tại Clock. Các kết quả còn lại tăng attempts và giữ published_at null. DB lỗi rollback; crash sau ACK có thể khiến lần sau gửi lại.
4. Return: true khi đã mark published; false khi thiếu event/delivery fail. Scheduler nằm package scheduling, gọi qua service proxy từng lần để transaction không bao cả batch; dừng batch sau failure, thử tick sau.

## 4. Trường hợp biên và quyết định

- `publisher-confirm-type=correlated`, `publisher-returns=true`, `mandatory=true` là cấu hình bắt buộc. Persistent message và durable exchange/consumer queue cùng cần thiết cho độ bền.
- Orchestrator chưa có binding/consumer domain event: giữ pending thay vì mất audit. Chưa chứng minh consumer lưu audit và dedup E2E.
- Nhiều instance được phép lấy các dòng khác nhau; không đảm bảo thứ tự nhận giữa instance. Mỗi event chứa cả thời điểm và before/after; phía audit phải dùng eventId chống trùng.
- Timeout broker giới hạn 5 giây mỗi dòng; batch mặc định 25. Backlog chưa có retention/pruning/metrics chuyên biệt, ghi trong việc vận hành sau tích hợp.
