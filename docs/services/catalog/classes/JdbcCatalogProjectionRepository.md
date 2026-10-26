# Class Log: JdbcCatalogProjectionRepository

## 1. Thông tin chung và bất biến

Dependencies JdbcTemplate/NamedParameterJdbcTemplate, cùng DataSource/transaction với JPA. Product/vendor không ghi field của nhau. Rating chỉ lấy từ product_reviews. Các mutation/rebuild theo product lấy advisory transaction lock theo hash của `catalog:product:<id>`, kể cả product chưa tồn tại. Hash collision chỉ làm serialize thêm, không sai dữ liệu.

## 2. Method

| Method | Output | Lỗi | Mục đích |
| --- | --- | --- | --- |
| claimEvent | boolean | CAT_010/DB | Dedup trong transaction |
| applyProduct | outcome | CAT_010/DB | Upsert version-gated, bảo toàn rating |
| removeProduct | outcome | DB | Tombstone kể cả removal đến đầu |
| applyVendor | outcome | DB | Atomic upsert vendor state |
| applyReview | outcome | CAT_010/DB | Dedup reviewId, aggregate |
| rebuildRating | void | DB | Tính lại từ reviews |

## 3. Pseudocode

### Product / removal

1. **Guard:** lock product identity; lấy max version giữa product_views/tombstone. Input không mới hơn → STALE. Tombstone hoặc row REMOVED hiện có mà input muốn hiện lại → REMOVED, không restore khi chưa có contract.
2. **Nghiệp vụ:** chặn đổi vendor khác row hiện có hoặc reviews đến trước; conflict → CAT_010. Removal không có snapshot vẫn được lưu tombstone, không dựng product giả.
3. **Persistence:** upsert product scalar/text[]/opaque jsonb, SQL WHERE source_version mới hơn; không ghi vendor/rating từ input. Status REMOVED cũng tạo tombstone. Tính lại rating sau upsert. Removal chỉ update row product nếu đã có.
4. **Response:** outcome; lỗi rollback cùng event claim của service.

### Vendor

1. Nhận row đã validate; atomic ON CONFLICT với WHERE sourceVersion mới hơn.
2. Chỉ ghi vendor_snapshots; lock/unlock phản ánh qua view join, không sửa hàng loạt product hay product version/rating.
3. Trả APPLIED/STALE. Không giả định locked wire là full snapshot.

### Reviews / rebuild rating

1. Lock theo product để reviews/upserts/rebuild không ghi đè aggregate của nhau. Product đã có thì vendor phải khớp.
2. Insert review ON CONFLICT DO NOTHING. Nếu reviewId đã có, so đủ field với content null-safe; khác dữ liệu → CAT_010, không sửa review cũ.
3. Count/round avg từ reviews và update product nếu tồn tại. Product chưa có thì giữ review; lần upsert đầu recompute. Rebuild dùng cùng lock, không xóa dữ liệu.
4. Trả APPLIED/DUPLICATE, rollback cả event claim khi conflict.

## 4. Trường hợp biên

Migration mới backfill tombstone từ rows REMOVED trước C2. Runtime còn kiểm status REMOVED nếu tombstone bị mất. Stale removal không che snapshot mới hơn. JSON tiers được bảo toàn nhưng chưa diễn giải field item. Domain conflict dùng CatalogException(CAT_010): IllegalArgumentException trong @Repository có thể bị JPA translator đổi thành lỗi hạ tầng, gây requeue poison; test Rabbit tái hiện và kiểm DLQ.
