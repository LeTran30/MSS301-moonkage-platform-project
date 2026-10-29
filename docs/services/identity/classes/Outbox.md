# Class Log: `Outbox`

> **Một câu:** ghi một sự kiện vào bảng `outbox_events` trong **cùng transaction** với dữ liệu nó mô tả; `OutboxRelay` gửi lên RabbitMQ sau.

- **Package:** `com.moonkage.identity.platform.messaging.outbox` (`OutboxEvent`, `OutboxEventRepository`, `OutboxRelay` cùng package)
- **Tham chiếu:** Software Design mục 6, `NFR-05`
- **Dependencies:** `OutboxEventRepository`, `ObjectMapper`, `IdGenerator`
- **Người gọi:** `NfcServiceImpl` (sự kiện `account.nfc_verified / nfc_failed / nfc_locked`)

## 0. Vì sao cần

Nếu ghi DB rồi mới gửi RabbitMQ, máy sập giữa hai bước sẽ **mất sự kiện**. Còn nếu gửi trước rồi DB rollback, ta sẽ **gửi một sự kiện không có thật**. Outbox gộp cả hai vào một transaction DB: dữ liệu và sự kiện cùng commit hoặc cùng mất. Gửi đi là việc của bước sau.

## 1. Luật bất biến

1. **Bắt buộc chạy trong một transaction có sẵn** (`Propagation.MANDATORY`). Gọi ngoài transaction thì ném lỗi ngay, không lặng lẽ ghi riêng.
2. `eventId` là khóa chính của dòng outbox và cũng là message id trên RabbitMQ. `Outbox` sinh nó qua `IdGenerator` (UUID v7) rồi đưa vào hàm dựng sự kiện, nên `eventId` trong payload luôn trùng id của dòng. Bên nhận bỏ qua id đã gặp, nên gửi trùng không gây hại.
3. Dòng mới được `persist` (id gán trước), không `save`/`merge`.

## 2. Method

| Method | Làm gì |
| --- | --- |
| `enqueue(routingKey, eventId -> event)` | Sinh `EventId`, dựng sự kiện, chuyển thành JSON, lưu một dòng `OutboxEvent` (chưa có `publishedAt`); trả `EventId` |

Không chuyển được sang JSON là lỗi lập trình → `IllegalStateException`, transaction rollback.

## 3. Phía gửi (`OutboxRelay`, để tham khảo)
- Cứ `outbox.relay-interval` (2 giây) lấy tối đa `outbox.batch-size` dòng chưa gửi, cũ nhất trước.
- Gửi từng dòng, chờ broker xác nhận rồi mới ghi `publishedAt`. Lỗi thì tăng `attempts` và dừng, lần sau thử lại đúng dòng đó, nên thứ tự được giữ.
- Chỉ chạy đúng với **một instance**; chạy hai instance thì mỗi sự kiện bị gửi hai lần (bên nhận bỏ qua bản trùng).