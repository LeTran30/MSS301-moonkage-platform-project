# Class Log: ProductReadServiceImpl

## 1. Thông tin chung và bất biến

Dependencies ProductListingRepository (read-only JPA view), JdbcProductSearchRepository (SQL động cho search/facets), ProductReviewReadRepository (JDBC), PublicImageProperties. Runtime mặc định; readonly transaction, @Immutable entity không persist dirty state. Public chỉ ON_SALE + canOperate + sellsShop + giao được theo 34 mã tỉnh. BE-09: profile `legacy-writer` đã bị xoá, nên không còn đường ghi song song.

## 2. Method

| Method | Output | Lỗi | Mục đích |
| --- | --- | --- | --- |
| search | PageResponse | CAT_001 | Lọc province/q/vendor/brand/crust/filling/giá, sort, page |
| getFacets | ProductFacetsResponse | CAT_001 | Giá trị và số đếm cho panel lọc, chỉ theo vùng và q |
| getProduct | ProductListingResponse | CAT_001/009 | Public detail, ảnh/rating/isOwn |
| getReviews | PageResponse | CAT_001/009 | Reviews public product |

## 3. Pseudocode

1. **Guard:** search bắt buộc provinceCode, detail/reviews kiểm khi có; page>=0, size 1–100; mỗi danh sách lọc tối đa 50 giá trị, q tối đa 10 từ; giá >= 0 và min <= max; sort lạ → CAT_001. Escape %, _, backslash trong từng từ của q.
2. **Nghiệp vụ:** repository lấy trang productId theo filter (cùng visibility/delivery predicate ở content/count/facets, so khớp `unaccent(lower(...))`), sort theo `ProductSort` rồi productId; service đọc entity view theo các id đó và giữ thứ tự. Detail/reviews kiểm visibility và vùng, không hợp lệ → CAT_009.
3. **Persistence:** chỉ đọc local projection; reviews pagination tie-break reviewId; không gọi vendor/MinIO.
4. **Response:** mapper DTO/isOwn từ owner joined snapshot, không expose ownerId; dựng URL ảnh theo config; priceTiers giữ JSON nguyên trạng; `vendorAcceptsOrders` copy từ `vendor_snapshots.accepts_orders` (BE-04).

## 4. Giới hạn

Chưa có chế độ quản lý own/admin. Không báo shippingFee=0 khi chưa chọn tỉnh. BE-09: writer và profile `legacy-writer` đã bị xoá; endpoint ghi sản phẩm thuộc vendor-service. Capture wire chưa project nghiệp vụ, chưa sẵn sàng deploy.
