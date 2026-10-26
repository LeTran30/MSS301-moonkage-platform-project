# Class Log: ProjectionRecoveryServiceImpl và transaction replay

## 1. Thông tin chung và bất biến

ProjectionRecoveryServiceImpl phụ thuộc ProjectionRecoveryRepository, CatalogProjectionService, ProjectionReplayEntryService và danh sách ProjectionReplayAdapter. Không có controller/scheduler hay feed giả. Production hiện **không có adapter nghiệp vụ**. Checkpoint chỉ là vị trí quét inbox tạm, không được persist như producer checkpoint.

## 2. Method

| Method | Input | Output | Lỗi |
| --- | --- | --- | --- |
| replayPending | checkpoint hoặc null, limit 1–1000 | inspected/applied/skipped/deferred, nextScanPosition/hasMore | Invalid input, ambiguity, adapter/DB errors |
| rebuildRatings | afterProductId hoặc null, limit 1–1000 | rebuilt, nextProductId/hasMore | Invalid input, DB errors |

## 3. Pseudocode

### replayPending

1. **Guard:** limit hợp lệ. Checkpoint record kiểm timestamp/eventId. Đọc inbox pending bằng keyset `(received_at, event_id)`, lấy limit+1 để báo hasMore.
2. **Nghiệp vụ:** mỗi entry chọn adapter cùng routingKey. Không có → deferred, không gọi mutation. Nhiều adapter cùng key → lỗi cấu hình. Có đúng một → gọi entryService qua proxy riêng.
3. **Persistence:** không ghi checkpoint DB, không xóa raw/processed/tombstone. EntryService dùng transaction REQUIRES_NEW cho từng event; batch có thể commit một phần trước lỗi. Chạy lại từ đầu an toàn nhờ eventId/core dedup.
4. **Response:** outcome APPLIED tính applied; DUPLICATE/STALE/REMOVED tính skipped. NextScanPosition là dòng cuối đã **quét**, có thể gồm deferred; không phải chứng nhận đã xử lý hết.

### rebuildRatings

1. Guard batch và afterProductId. Đọc productId hiện có theo keyset, limit+1.
2. Với từng id gọi CatalogProjectionService.rebuildRating, dùng lock/transaction core và nguồn reviews local.
3. Chỉ sửa rating_count/rating_avg. Không tạo sản phẩm giả cho reviews đến trước; upsert sản phẩm sau này tự tính aggregate. Không thay status/version/claim/tombstone/reviews/inbox.
4. Trả số đã rebuild và cursor tiếp theo. Đây là quét dữ liệu hiện có, không phải full projection rebuild từ producer.

## 4. Giới hạn và restart

receivedAt có thể được tạo trước commit; một event commit muộn có timestamp đứng trước cursor đang quét. Vì vậy mỗi lần recovery mới **bắt đầu checkpoint null**, không lưu cursor qua các lần chạy để suy ra completeness. Pending deferred vẫn được thấy lại. Full rebuild cần producer feed/checkpoint/generation strategy được duyệt; không reset processed_events để tái áp event đã xử lý vào target bị xóa.
