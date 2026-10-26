# Class Log: CatalogProjectionServiceImpl

## 1. Thông tin chung và bất biến

Package `service.impl`; dependency CatalogProjectionRepository; NFR-05, P-05, BR-20/24. Input là row nội bộ bám schema V2, **không phải DTO event wire**. Không có adapter từ payload chưa duyệt vào core. sourceVersion là version source, không thay bằng timestamp.

## 2. Method

| Method | Input | Output | Lỗi |
| --- | --- | --- | --- |
| applyProduct | eventId, normalized product row | APPLIED/DUPLICATE/STALE/REMOVED | CAT_010, DB |
| removeProduct | eventId, productId, sourceVersion | APPLIED/DUPLICATE/STALE | Invalid input, CAT_010, DB |
| applyVendor | eventId, routingKey, normalized vendor row | APPLIED/DUPLICATE/STALE | Invalid input, CAT_010, DB |
| applyReview | eventId, normalized review row | APPLIED/DUPLICATE | CAT_010, DB |
| rebuildRating | productId | void | Invalid input, DB |

## 3. Pseudocode

1. **Guard:** kiểm eventId không rỗng, <=64 ký tự; removal version không âm. Vendor chỉ nhận source updated/locked; normalized locked row phải LOCKED và canOperate=false. Constructor row kiểm identity, field bắt buộc, version, list/JSON array, mã tỉnh.
2. **Nghiệp vụ:** claim event bằng insert unique processed_events. Trùng cùng key → DUPLICATE; cùng id khác key → CAT_010. Nếu claim được thì gọi repository mutation tương ứng.
3. **Persistence:** claim và mutation/aggregate cùng transaction. Lỗi rollback cả hai. Outcome STALE/REMOVED cũng là một quyết định projection hợp lệ, nên claim được commit. Không phát event thay vendor.
4. **Response:** trả outcome enum. Rebuild rating chỉ recompute nguồn reviews, không xóa claim/tombstone.

## 4. Trường hợp biên

Core không có hash wire payload: inbox chặn payload conflict trước adapter; gọi trực tiếp core là trusted internal port. Vendor row normalized có thể đến từ adapter full hoặc signal sau này, nhưng C2 chưa có adapter đó. Full replay/rebuild chưa đủ contract/feed/checkpoint; không reset processed_events để lách dedup.
