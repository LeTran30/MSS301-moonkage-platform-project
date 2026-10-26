# catalog-service (`catalog_db`)

> **Trạng thái:** Đề xuất (2026-10-22). Một phần của [phác thảo API và database](README.md); quyết định ở [decisions.md](decisions.md).
>
> **Migration:** [`V2026_10_22_1000__align_with_api_db_outline.sql`](../../../api/catalog-service/src/main/resources/db/migration/V2026_10_22_1000__align_with_api_db_outline.sql)

Tiến độ triển khai theo từng mốc, độ lệch IA v1.8 và hợp đồng phí hiện thực hóa được theo dõi tại [catalog service](../../services/catalog/README.md) và [kế hoạch C0–C5](../../services/catalog/implementation-plan.md). Chưa coi toàn bộ outline dưới đây là đã có code.

catalog là **phía đọc** của sản phẩm (CQRS): không nhận lệnh ghi sản phẩm nào. Bảng đọc được dựng từ sự kiện `product.upserted` và `vendor.updated` của vendor-service, `review.created` của order-service. catalog vẫn sở hữu bảng phí giao liên tỉnh và là nơi duy nhất tính phí giao đơn mua ngay (D-14).

**Bảng**

| Bảng | Cột chính | Ràng buộc | Nguồn |
| --- | --- | --- | --- |
| `product_views` **Mới** (thay `products`) | `product_id`, `vendor_id`, `name`, `description`, `cake_type`, `brand`, `origin`, `pieces_per_box`, `list_price`, `stock`, `expiry_date`, `delivery_label`, `quote_threshold`, `status`, `image_keys` (text[]), `price_tiers` (jsonb), `rating_avg`, `rating_count`, `source_version` | Chỉ trường sản phẩm, không chép trường vendor (P-05); chỉ ghi khi `source_version` mới hơn; index tìm kiếm trên `name`, `brand` | FR-05 → FR-07, BR-21 |
| `product_reviews` **Mới** (bản sao) | `review_id`, `product_id`, `vendor_id`, `rating`, `content`, `created_at` | Từ `review.created`; tính `rating_avg` | AC-11.3, AC-06.3 |
| `vendor_snapshots` **Mới** (kỹ thuật) | `vendor_id`, `owner_account_id`, `business_name`, `status`, `can_operate`, `sells_shop`, `delivery_areas`, `local_delivery_fee`, `source_version` | Từ `vendor.updated`, chỉ ghi khi `source_version` mới hơn; nơi duy nhất giữ trường vendor; GIN trên `delivery_areas` | BR-20, BR-30, BR-31 |
| `product_listings` **Mới** (view) | `product_views` JOIN `vendor_snapshots`: thêm `vendor_name`, `owner_account_id`, `delivery_areas`, `local_delivery_fee`, `can_operate`, `sells_shop` | API công khai đọc view này (entity `@Immutable`); khóa Shop chỉ sửa một dòng | P-05 |
| `provinces` **Mới** | `code`, `name` | 34 đơn vị theo Quyết định 19/2025/QĐ-TTg; nạp bằng `db/migration/R__provinces.sql`, khớp enum `Province` của `api/common-reference` (có test) | A-18, P-07 |
| `interprovince_fees` **Mới** | `province_code` (FK → `provinces`), `fee`, `effective_from`, `updated_by` | Một mức hiện hành mỗi tỉnh; lưu bảng phải đủ mọi dòng của `provinces` | FR-52, A-18 |
| `processed_events`, `outbox_events` **Mới** |  | Bỏ sự kiện trùng; phát `interprovince_fee.changed` | NFR-05 |

Bản đọc có thể trễ vài giây so với vendor. Tồn kho hiển thị chỉ để tham khảo; số chính xác được kiểm ở vendor-service khi giữ hàng (BR-28), nên không thể bán vượt tồn kho.

**API công khai**

**Read model Product** (`/api/products`)

| Method, đường dẫn | Ai | Mục đích | FR |
| --- | --- | --- | --- |
| `GET /api/products?provinceCode=&q=&brand=&cakeType=&vendorId=&minPrice=&maxPrice=&sort=` | K, M | Sản phẩm đang bán của Shop giao được, `canOperate`; `data.facets` cho bộ lọc | FR-05, FR-06 |
| `GET /api/products?vendorId=&status=` | S, A | Mọi trạng thái (đang bán, ẩn, bị gỡ) của Shop mình; A xem mọi Shop | FR-29, FR-46 |
| `GET /api/products/{productId}?provinceCode=` | K, M, S | Chi tiết, bậc giá, `shippingFee`, cờ `isOwn` | FR-07 |
| `GET /api/products/{productId}/reviews` | K, M | Đánh giá của sản phẩm | AC-11.3 |

`/api/products` chỉ có `GET`. Mọi lệnh ghi sản phẩm đi qua `/api/vendors/{vendorId}/products` (mục 4).

**Root InterprovinceFeeTable** (`/api/interprovince-fees`)

| Method, đường dẫn | Ai | Mục đích | FR |
| --- | --- | --- | --- |
| `GET /api/interprovince-fees`, `GET /api/interprovince-fees/provinces/{provinceCode}` | K, M, A | Cả bảng, một tỉnh | FR-52 |
| `PUT /api/interprovince-fees` | A | Thay cả bảng; thiếu tỉnh thì từ chối | AC-52.1, AC-52.3 |

So với code: CRUD `/api/seller/products/...` cùng các bảng `products`, `product_images`, `product_price_tiers` chuyển sang vendor-service; catalog chỉ giữ phần `GET` (L-18).

## Sự kiện và API nội bộ

**Phát**

- `interprovince_fee.changed` → orchestrator

**Nghe**

- `product.upserted`, `product.removed` (vendor) → `product_views`
- `vendor.updated`, `vendor.locked` (vendor) → `vendor_snapshots`
- `review.created` (order) → `product_reviews`, `rating_avg`

**API nội bộ**

- Cung cấp `POST /internal/products/snapshot` cho order: phí giao theo vendor và cờ liên tỉnh (D-14)

## Quyết định liên quan

[L-04](decisions.md), [L-07](decisions.md), [L-12](decisions.md), [L-17](decisions.md), [L-18](decisions.md).
