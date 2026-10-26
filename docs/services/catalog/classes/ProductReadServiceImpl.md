# Class Log: ProductReadServiceImpl

## 1. Thông tin chung và bất biến

Dependencies ProductListingRepository (read-only JPA view), ProductReviewReadRepository (JDBC), PublicImageProperties. Runtime mặc định, không legacy-writer; readonly transaction, @Immutable entity không persist dirty state. Public chỉ ON_SALE + canOperate + sellsShop + giao được theo 34 mã tỉnh.

## 2. Method

| Method | Output | Lỗi | Mục đích |
| --- | --- | --- | --- |
| search | PageResponse | CAT_001 | Basic province/vendor/q/page |
| getProduct | ProductListingResponse | CAT_001/009 | Public detail, ảnh/rating/isOwn |
| getReviews | PageResponse | CAT_001/009 | Reviews public product |

## 3. Pseudocode

1. **Guard:** search bắt buộc provinceCode, detail/reviews kiểm khi có; page>=0, size 1–100. Escape %, _, backslash trong q để tìm literal.
2. **Nghiệp vụ:** native search view có cùng visibility/delivery predicate ở content/count, sort updatedAt DESC/productId. Detail/reviews kiểm visibility và vùng, không hợp lệ → CAT_009.
3. **Persistence:** chỉ đọc local projection; reviews pagination tie-break reviewId; không gọi vendor/MinIO.
4. **Response:** mapper DTO/isOwn từ owner joined snapshot, không expose ownerId; dựng URL ảnh theo config; priceTiers giữ JSON nguyên trạng.

## 4. Giới hạn

Chưa có C3 multi-filters/facets/management modes hoặc C4 shipping/snapshot. Không báo shippingFee=0 khi chưa chọn tỉnh. Writer source/tests còn profile legacy theo chấp thuận Lê Trần; vendor endpoint chưa có vẫn là blocker bàn giao. Capture wire chưa project nghiệp vụ, chưa sẵn sàng deploy.
