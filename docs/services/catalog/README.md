# Catalog service

## Trạng thái 26/10/2026

[Kế hoạch C0–C5](implementation-plan.md) là bản phân chia scope sau khi đối chiếu IA và hai bộ wireframe. Thay đổi đầu tiên triển khai **C1: phí liên tỉnh và outbox**, chưa hoàn thành toàn bộ catalog.

**Chưa chạy được toàn service với schema V2:** entity sản phẩm cũ vẫn trỏ tới bảng đã bị xóa. Cần hoàn thành C2 (CQRS và bàn giao writer cho vendor); không tắt `ddl-auto: validate` hoặc thêm lại bảng cũ để tránh lỗi này. Các API sản phẩm cũ và test ảnh cũ được giữ nguyên trong lát cắt C1 để không xóa nghiệp vụ/test trước khi có bên nhận thay thế.

## API C1

Gateway root: `/api/interprovince-fees`; route tương thích discovery `/catalog-service/api/interprovince-fees` vẫn áp cùng quyền. Public API trả `status, code, message, data, timestamp`; lỗi thêm `path` và `data: null`.

| Method/path | Quyền | Kết quả |
| --- | --- | --- |
| `GET /api/interprovince-fees` | Công khai | `data: {fees: [{provinceCode, provinceName, fee, effectiveFrom}], complete}`; đủ danh mục tỉnh, dòng chưa cấu hình có `fee: null`, không tự gán 0 |
| `GET /api/interprovince-fees/provinces/{provinceCode}` | Công khai | Một dòng; mã lạ 404, chưa cấu hình 503 |
| `PUT /api/interprovince-fees` | ADMIN | Body `{fees: [{provinceCode: "01", fee: 45000}, ...]}` phải có đúng một dòng cho **mỗi mã trong provinces**; trả bảng đã lưu |

Tiền là số nguyên JSON trong miền `long` VND: cho phép 0, từ chối âm, null, chuỗi số, số lẻ và overflow. Bảng hiện có 34 mã tỉnh. Không dùng ba mức Bắc/Trung/Nam từ mockup Q6.1. Mỗi lần PUT thay toàn bộ bảng tại thời điểm server, không hỗ trợ lịch giá tương lai. Hai lần PUT đồng thời được serialize; lần commit sau thay toàn bộ bảng trước.

Gateway xác thực JWT, xóa header danh tính client tự gửi, đặt `X-Account-Id`, `X-User-Role` từ claim. Service kiểm lại ADMIN trước truy cập DB. Hợp đồng header này chỉ tin ở mạng nội bộ phía sau gateway, như các service hiện có.

| Code | HTTP | Ý nghĩa |
| --- | --- | --- |
| CAT_001 | 400 | Body/tiền không hợp lệ |
| CAT_002 | 401 | Thiếu danh tính |
| CAT_003 | 403 | Không phải ADMIN |
| CAT_004 | 400 | Thiếu, trùng hoặc thừa mã tỉnh |
| CAT_005 | 404 | Mã tỉnh không tồn tại |
| CAT_006 | 503 | Chưa có phí tỉnh đó |
| CAT_008 | 500 | Lỗi DB/hạ tầng hoặc ngoài dự kiến |

Gateway tự trả lỗi security trước khi chuyển request vào service; body lỗi gateway hiện chưa theo envelope catalog.

## Persistence và audit

Không đổi schema/migration đã merge. JDBC đọc `provinces`, ghi `interprovince_fees`, `outbox_events` của V2 trong cùng transaction Spring. Khóa các dòng province theo code trước lần lưu, kể cả khi bảng phí còn trống. Bảng tỉnh là nguồn danh mục, không nhân đôi danh sách tỉnh trong service.

Sự kiện domain `interprovince_fee.changed` có `eventId, actorAccountId, occurredAt, before, after`; hai bản bảng phí giúp audit thấy giá trước/sau. Đây là **payload đề xuất cho consumer**, cần thống nhất với người phụ trách orchestrator. Outbox lưu cùng phí; không publish Rabbit ngay trong transaction nghiệp vụ.

Relay mặc định mỗi 2 giây, tối đa 25 message/tick. Mỗi message dùng một transaction riêng, `FOR UPDATE SKIP LOCKED`, timeout confirm 5 giây; không giữ khóa bảng phí trong lúc chờ broker. Publish persistent JSON lên `moonkage.events`, `messageId=eventId`. Chỉ cập nhật `published_at` sau ACK không kèm mandatory return. NACK, timeout, mất kết nối hoặc chưa có route tăng attempts và giữ pending. Có thể phát lặp khi crash sau ACK/trước commit; consumer phải dedup eventId. Chưa yêu cầu thứ tự giao giữa nhiều replica.

**Phụ thuộc còn mở:** orchestrator hiện chỉ bind audit cũ bằng `audit.#`, chưa bind/consume domain key này. Khi chưa có binding thì sự kiện giữ pending, chưa có bản ghi audit E2E. Không bind domain payload thẳng vào consumer AuditEvent cũ vì khác schema. Cần adapter và processed_events ở orchestrator theo [integration](../../architecture/api-db/integration.md).

Cấu hình `catalog.outbox.enabled`, `catalog.outbox.relay-interval`, `catalog.outbox.batch-size` trong application.yml; `spring.rabbitmq.publisher-confirm-type=correlated`, `publisher-returns=true`, `template.mandatory=true` phải đi cùng relay. Chưa thay AuditPublisher cũ của product; việc chuyển writer đó thuộc C2.

## Kiểm tra

Từ thư mục `api`, chạy Maven wrapper theo convention:

```powershell
.\mvnw.cmd -o -B -ntp -pl catalog-service,api-gateway -am verify
```

`-o` dùng cache; bỏ nó nếu máy chưa có dependencies. Tests thêm Testcontainers theo pattern identity, và common-reference **test scope** để đối chiếu seed tỉnh. Không thêm thư viện runtime mới.

- Unit/MVC: quyền, validation bảng/tiền, đủ/trùng/mã lạ, fees chưa cấu hình, serialization trước write, payload audit, relay ACK/NACK/return/lỗi broker.
- Gateway: GET công khai, PUT ADMIN ở cả hai route; lọc header giả mạo.
- PostgreSQL 17: Flyway thật, bảng tỉnh khớp enum, upsert toàn bảng, rollback phí+outbox, hai lần lưu đầu đồng thời, trạng thái pending/published.
- RabbitMQ 4.1: Testcontainers riêng; xác nhận persistent publish/messageId và mandatory return với routing key không có binding.

Các test DB là **JDBC slice**, không chạy JPA/entity sản phẩm cũ hay MinIO; không coi chúng là bằng chứng startup toàn service. Không có Docker thì integration tests skip theo pattern repo, không phải đã kiểm thử thành công. Kết quả lần chạy thực tế được ghi ở kế hoạch sau khi kiểm tra hoàn tất.

Pseudocode: [InterprovinceFeeServiceImpl](classes/InterprovinceFeeServiceImpl.md), [OutboxDeliveryServiceImpl](classes/OutboxDeliveryServiceImpl.md).
