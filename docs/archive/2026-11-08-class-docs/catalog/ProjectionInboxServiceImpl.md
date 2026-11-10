# Class Log: ProjectionInboxServiceImpl

## 1. Thông tin chung và bất biến

Dependencies ObjectMapper/ProjectionInboxRepository. Nguồn tối thiểu đã xác nhận là năm routing keys và eventId trong integration.md. Capture ACK chỉ nghĩa inbox commit, không nghĩa business projection hoàn tất. JSONB bảo toàn nội dung semantic, không byte/whitespace/key order. Không xóa raw sau processing.

## 2. Method

| Method | Input/Output | Lỗi | Mục đích |
| --- | --- | --- | --- |
| capture | key, bytes → boolean inserted | Invalid input, CAT_010, DB | Commit minimum envelope |
| findPending | limit 1–1000 → rows | Invalid input, DB | Batch chưa có processed marker |

## 3. Pseudocode

1. **Guard:** known routing key, non-null payload; parse JSON chặn duplicate keys/trailing tokens; eventId textual/nonblank/<=64. Không yêu cầu field nghiệp vụ chưa chốt.
2. **Nghiệp vụ:** INSERT inbox ON CONFLICT DO NOTHING; trùng thì so key + JSONB equality. Giống semantic → duplicate; khác → CAT_010. Unique index serialize hai consumer cùng ID.
3. **Persistence:** commit inbox rồi listener ACK. Không ghi processed_events/product/vendor/reviews ở bước capture.
4. **Read:** findPending anti-join processed_events, bounded batch order receivedAt/eventId; thứ tự nhận không thay sourceVersion.

## 4. Listener và trường hợp biên

ProjectionInboxConsumer nhận Message, hai consumer, durable queue/DLX/DLQ. Malformed/ambiguous JSON, identity conflict hoặc DataIntegrityViolation (ví dụ NUL không lưu được JSONB) → reject không requeue, message gốc ở DLQ. DB transient lỗi truyền ra để requeue; test cho DB lỗi một lần rồi nhận lại thành công. Chưa có backoff/retention/metrics/re-drive DLQ tự động; việc C5. Pending không có adapter vẫn pending, không tuyên bố đồng bộ nghiệp vụ.
